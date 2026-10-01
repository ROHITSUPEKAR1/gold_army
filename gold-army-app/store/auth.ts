import { create } from 'zustand';
import { authApi, formatApiError, SESSION_KEY } from '../services/api';
import { safeStorage } from '../services/storage';
import type { AuthSession, SessionUser, UserRole } from '../types';

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const raw = await safeStorage.getItem(SESSION_KEY);
      if (!raw) {
        set({ session: null, isHydrated: true });
        return;
      }

      const storedSession = JSON.parse(raw) as AuthSession;

      // Verify token freshness against backend /auth/me
      try {
        const currentUser = await authApi.me();
        const updatedSession: AuthSession = {
          ...storedSession,
          user: {
            ...storedSession.user,
            ...currentUser,
          },
        };
        await safeStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        set({ session: updatedSession, isHydrated: true });
      } catch (verifyError) {
        // If /me fails with 401, check if refresh worked or wipe invalid session
        const freshRaw = await safeStorage.getItem(SESSION_KEY);
        if (freshRaw) {
          const recheckSession = JSON.parse(freshRaw) as AuthSession;
          set({ session: recheckSession, isHydrated: true });
        } else {
          set({ session: null, isHydrated: true });
        }
      }
    } catch {
      set({ session: null, isHydrated: true });
    }
  },

  signIn: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken, refreshToken, user } = await authApi.login(identifier, password);
      const session: AuthSession = {
        token: accessToken,
        accessToken,
        refreshToken,
        user,
      };

      await safeStorage.setItem(SESSION_KEY, JSON.stringify(session));
      set({ session, isLoading: false, error: null });
      return session;
    } catch (err) {
      const message = formatApiError(err);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout
    } finally {
      await safeStorage.deleteItem(SESSION_KEY);
      set({ session: null, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));

