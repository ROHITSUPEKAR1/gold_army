import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type PTSessionItem = {
  id: string;
  memberId: string;
  trainerId: string;
  startsAt: string;
  endsAt?: string | null;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    user: {
      id: string;
      name: string;
      phone?: string;
      email?: string;
    };
  };
  trainer?: {
    user: {
      id: string;
      name: string;
      phone?: string;
      email?: string;
    };
  };
};

export type TrainerProfile = {
  id: string;
  userId: string;
  specialization?: string | null;
  experienceYears?: number | null;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  _count?: {
    members: number;
    ptSessions: number;
  };
};

export type BookPTSessionInput = {
  trainerId: string;
  memberId?: string;
  startsAt: string | Date;
  endsAt?: string | Date;
  notes?: string;
};

/**
 * Fetch all available active trainers for PT booking & profile view
 */
export function useTrainers() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: TrainerProfile[] }>('/trainers');
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Fetch PT sessions for the authenticated user (member or trainer or admin)
 */
export function usePTSessions(filters?: { memberId?: string; trainerId?: string; status?: string }) {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['pt', 'sessions', session?.user.role, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.memberId) params.append('memberId', filters.memberId);
      if (filters?.trainerId) params.append('trainerId', filters.trainerId);
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<{ success: boolean; data: PTSessionItem[] }>(
        `/pt/sessions${queryString}`
      );
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Book a new PT session
 */
export function useBookPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BookPTSessionInput) => {
      try {
        const response = await api.post<{ success: boolean; data: PTSessionItem }>(
          '/pt/sessions',
          payload
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
    },
  });
}

/**
 * Cancel a PT session
 */
export function useCancelPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      try {
        const response = await api.post<{ success: boolean; data: PTSessionItem }>(
          `/pt/sessions/${sessionId}/cancel`
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
    },
  });
}

/**
 * Mark a PT session completed with trainer notes
 */
export function useCompletePTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      try {
        const response = await api.post<{ success: boolean; data: PTSessionItem }>(
          `/pt/sessions/${sessionId}/complete`,
          { notes }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
    },
  });
}
