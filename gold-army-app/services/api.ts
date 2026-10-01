import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { safeStorage } from './storage';
import type { AuthSession, SessionUser, UserRole } from '../types';

export const SESSION_KEY = 'gold-army-session';

// Environment-based API URL (configurable via .env / EXPO_PUBLIC_API_URL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request interceptor to attach Bearer token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const rawSession = await safeStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession) as AuthSession;
        const activeToken = session.accessToken || session.token;
        if (activeToken && activeToken !== 'demo-session-token') {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
      }
    } catch {
      // safeStorage read failure fallback
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response interceptor for automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh for login or refresh endpoints or already retried requests
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const rawSession = await safeStorage.getItem(SESSION_KEY);
      if (!rawSession) throw new Error('No session stored');

      const session = JSON.parse(rawSession) as AuthSession;
      if (!session.refreshToken) throw new Error('No refresh token available');

      // Call refresh endpoint directly using pure axios to prevent interceptor recursion
      const refreshResponse = await axios.post<{
        success: boolean;
        data: { accessToken: string; user?: SessionUser };
      }>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: session.refreshToken,
      });

      const newAccessToken = refreshResponse.data.data.accessToken;
      const updatedSession: AuthSession = {
        ...session,
        accessToken: newAccessToken,
        token: newAccessToken,
        user: refreshResponse.data.data.user ?? session.user,
      };

      await safeStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await safeStorage.deleteItem(SESSION_KEY);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }
    if (error.response?.status === 401) {
      return 'Invalid credentials or session expired.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'Requested resource not found.';
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please try again in a few moments.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      return 'Unable to reach the server. Please check your network connection.';
    }
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export const authApi = {
  login: async (identifier: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          name: string;
          role: UserRole;
          phone?: string;
          email?: string;
          memberId?: string;
          trainerId?: string;
        };
      };
    }>('/auth/login', { identifier, password });
    return res.data.data;
  },
  refresh: async (refreshToken: string) => {
    const res = await api.post<{
      success: boolean;
      data: {
        accessToken: string;
        user?: SessionUser;
      };
    }>('/auth/refresh', { refreshToken });
    return res.data.data;
  },
  me: async () => {
    const res = await api.get<{
      success: boolean;
      data: SessionUser;
    }>('/auth/me');
    return res.data.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort logout
    }
  },
};

export const backendApi = {
  me: () => api.get('/auth/me'),
  members: () => api.get('/members'),
  membership: () => api.get('/subscriptions'),
  attendanceStats: () => api.get('/attendance/stats'),
  notifications: () => api.get('/notifications'),
};
