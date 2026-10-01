import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type BodyMeasurements = {
  chestIn?: number;
  waistIn?: number;
  armsIn?: number;
  thighsIn?: number;
  hipsIn?: number;
  shouldersIn?: number;
};

export type PersonalRecordItem = {
  exerciseName: string;
  weightKg: number;
  reps: number;
  date?: string;
  notes?: string;
};

export type BackendProgressEntry = {
  id: string;
  memberId: string;
  measuredAt: string;
  weightKg?: number | null;
  bodyFat?: number | null;
  measurements?: BodyMeasurements | null;
  photoUrls?: string[] | null;
  notes?: string | null;
  personalRecords?: Record<string, PersonalRecordItem> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProgressInput = {
  memberId?: string;
  measuredAt?: string | Date;
  weightKg?: number;
  bodyFat?: number;
  measurements?: BodyMeasurements;
  notes?: string;
  personalRecords?: Record<string, PersonalRecordItem>;
};

/**
 * Hook to fetch member's full progress history
 */
export function useMemberProgress(memberId?: string) {
  const session = useAuthStore((state) => state.session);
  const targetId = memberId || session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'progress', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const response = await api.get<{ success: boolean; data: BackendProgressEntry[] }>(
        `/progress/${targetId}`
      );
      return response.data.data;
    },
    enabled: Boolean(targetId && session),
  });
}

/**
 * Hook to log a new progress measurement entry or update PRs
 */
export function useCreateProgress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (payload: CreateProgressInput) => {
      try {
        const response = await api.post<{ success: boolean; data: BackendProgressEntry }>(
          '/progress',
          {
            ...payload,
            memberId: payload.memberId || session?.user.memberId,
          }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: (_, variables) => {
      const memberId = variables.memberId || session?.user.memberId;
      queryClient.invalidateQueries({ queryKey: ['member', 'progress', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member', 'profile'] });
    },
  });
}
