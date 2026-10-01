import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type BackendExercise = {
  id: string;
  name: string;
  targetMuscle: string;
  difficulty: string;
  instructions?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
};

export type BackendWorkoutExercise = {
  workoutId: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  weight?: string | null;
  restSec?: number | null;
  trainerNotes?: string | null;
  exercise: BackendExercise;
};

export type BackendWorkout = {
  id: string;
  trainerId?: string | null;
  name: string;
  goal: string;
  notes?: string | null;
  durationMin?: number | null;
  calories?: number | null;
  isDeleted: boolean;
  trainer?: {
    user: {
      name: string;
    };
  };
  exercises: BackendWorkoutExercise[];
};

export type MemberWorkoutAssignment = {
  memberId: string;
  workoutId: string;
  assignedAt: string;
  completedAt?: string | null;
  workout: BackendWorkout;
};

/**
 * Hook to fetch all exercises in catalog
 */
export function useExercises() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: BackendExercise[] }>('/exercises');
      return response.data.data;
    },
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * Hook to fetch single exercise details
 */
export function useExercise(exerciseId?: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: async () => {
      if (!exerciseId) return null;
      const response = await api.get<{ success: boolean; data: BackendExercise }>(
        `/exercises/${exerciseId}`
      );
      return response.data.data;
    },
    enabled: Boolean(exerciseId && session),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to fetch member's assigned workouts
 */
export function useMemberWorkouts(memberId?: string) {
  const session = useAuthStore((state) => state.session);
  const targetId = memberId || session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'workouts', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const response = await api.get<{ success: boolean; data: MemberWorkoutAssignment[] }>(
        `/members/${targetId}/workouts`
      );
      return response.data.data;
    },
    enabled: Boolean(targetId && session),
  });
}

/**
 * Hook to fetch all workout templates
 */
export function useWorkouts() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: BackendWorkout[] }>('/workouts');
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Hook to fetch single workout by ID
 */
export function useWorkout(workoutId?: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const response = await api.get<{ success: boolean; data: BackendWorkout }>(
        `/workouts/${workoutId}`
      );
      return response.data.data;
    },
    enabled: Boolean(workoutId && session),
  });
}

/**
 * Mutation to mark a workout as completed
 */
export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (workoutId: string) => {
      try {
        const response = await api.post<{ success: boolean; data: MemberWorkoutAssignment }>(
          `/workouts/${workoutId}/complete`,
          { memberId: session?.user.memberId }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'workouts'] });
    },
  });
}

/**
 * Trainer mutation to create a new workout
 */
export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      goal: string;
      notes?: string;
      durationMin?: number;
      calories?: number;
      exercises?: Array<{
        exerciseId: string;
        order?: number;
        sets: number;
        reps: number;
        weight?: string;
        restSec?: number;
        trainerNotes?: string;
      }>;
    }) => {
      try {
        const response = await api.post<{ success: boolean; data: BackendWorkout }>(
          '/workouts',
          payload
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Trainer mutation to assign workout to member
 */
export function useAssignWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, memberId }: { workoutId: string; memberId: string }) => {
      try {
        const response = await api.post<{ success: boolean; data: unknown }>(
          `/workouts/${workoutId}/assign`,
          { memberId }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', 'workouts', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
