import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type DietType = 'VEGETARIAN' | 'NON_VEGETARIAN' | 'EGGETARIAN';

export type BackendDietMeal = {
  id: string;
  dietPlanId: string;
  mealType: string;
  timing: string;
  name: string;
  quantity?: string | null;
  calories: number;
  proteinG: number;
  estimatedCost?: number | null;
  preparationNotes?: string | null;
};

export type BackendDietPlan = {
  id: string;
  trainerId?: string | null;
  name: string;
  goal: string;
  dietType: DietType;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  budget?: number | null;
  isDeleted: boolean;
  meals: BackendDietMeal[];
  trainer?: {
    user: {
      name: string;
    };
  };
};

export type MemberDietAssignment = {
  memberId: string;
  dietPlanId: string;
  assignedAt: string;
  dietPlan: BackendDietPlan;
};

/**
 * Hook to fetch member's assigned diet plans
 */
export function useMemberDiet(memberId?: string) {
  const session = useAuthStore((state) => state.session);
  const targetId = memberId || session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'diet', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const response = await api.get<{ success: boolean; data: MemberDietAssignment[] }>(
        `/members/${targetId}/diet`
      );
      return response.data.data;
    },
    enabled: Boolean(targetId && session),
  });
}

/**
 * Hook to fetch all diet plans (templates)
 */
export function useDietPlans() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['diet-plans'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: BackendDietPlan[] }>('/diet-plans');
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Hook to fetch a single diet plan by ID
 */
export function useDietPlan(dietPlanId?: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['diet-plan', dietPlanId],
    queryFn: async () => {
      if (!dietPlanId) return null;
      const response = await api.get<{ success: boolean; data: BackendDietPlan }>(
        `/diet-plans/${dietPlanId}`
      );
      return response.data.data;
    },
    enabled: Boolean(dietPlanId && session),
  });
}

/**
 * Trainer/Admin mutation to create a new diet plan
 */
export function useCreateDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      goal: string;
      dietType: DietType;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
      budget?: number;
      meals?: Array<{
        mealType: string;
        timing: string;
        name: string;
        quantity?: string;
        calories: number;
        proteinG: number;
        estimatedCost?: number;
        preparationNotes?: string;
      }>;
    }) => {
      try {
        const response = await api.post<{ success: boolean; data: BackendDietPlan }>(
          '/diet-plans',
          payload
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
  });
}

/**
 * Trainer/Admin mutation to assign a diet plan to a member
 */
export function useAssignDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dietPlanId, memberId }: { dietPlanId: string; memberId: string }) => {
      try {
        const response = await api.post<{ success: boolean; data: unknown }>(
          `/diet-plans/${dietPlanId}/assign`,
          { memberId }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', 'diet', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
  });
}
