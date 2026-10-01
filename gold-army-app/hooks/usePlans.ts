import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { formatDuration } from './useMember';
import type { PlanDuration } from '../types/member';

export type BackendPlan = {
  id: string;
  name: string;
  durationMonths?: number | null;
  durationDays?: number | null;
  price: number;
  discount: number;
  isPopular: boolean;
  isPremium: boolean;
  isActive: boolean;
  services?: Array<{
    service: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
};

export type FormattedPlan = {
  id: string;
  name: string;
  service: string;
  duration: PlanDuration;
  price: number;
  originalPrice?: number;
  benefits: string[];
  label?: 'POPULAR' | 'PREMIUM';
  raw: BackendPlan;
};

export function formatPlanBenefits(plan: BackendPlan): string[] {
  const benefits: string[] = [];
  const serviceNames = plan.services?.map((s) => s.service.name) ?? [];

  if (serviceNames.some((s) => s.includes('Gym') || s.includes('General'))) {
    benefits.push('Full gym floor & strength equipment access');
  }
  if (serviceNames.some((s) => s.includes('Cardio'))) {
    benefits.push('Unlimited cardio zone & endurance suite');
  }
  if (serviceNames.some((s) => s.includes('PT') || s.includes('Personal Training'))) {
    benefits.push('Dedicated 1-on-1 Personal Trainer guidance');
  }
  benefits.push('Workout tracking & PR logging');
  if (plan.isPremium || serviceNames.some((s) => s.includes('PT'))) {
    benefits.push('Personalized nutritionist diet plan');
  }
  if (plan.discount > 0) {
    benefits.push(`Special ₹${Number(plan.discount).toLocaleString('en-IN')} Gold savings included`);
  }

  return benefits;
}

export function formatPlan(plan: BackendPlan): FormattedPlan {
  const serviceNames = plan.services?.map((s) => s.service.name).join(' + ') || 'General Gym';
  const priceNum = Number(plan.price);
  const discountNum = Number(plan.discount);
  const originalPrice = discountNum > 0 ? priceNum + discountNum : undefined;

  let label: 'POPULAR' | 'PREMIUM' | undefined;
  if (plan.isPremium) label = 'PREMIUM';
  else if (plan.isPopular) label = 'POPULAR';

  return {
    id: plan.id,
    name: plan.name,
    service: serviceNames,
    duration: formatDuration(plan),
    price: priceNum,
    originalPrice,
    benefits: formatPlanBenefits(plan),
    label,
    raw: plan,
  };
}

export const plansApi = {
  getPlans: async (): Promise<FormattedPlan[]> => {
    const res = await api.get<{ success: boolean; data: BackendPlan[] }>('/plans');
    return res.data.data.map(formatPlan);
  },

  createSubscription: async (payload: {
    planId: string;
    serviceId?: string;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'RAZORPAY';
    discount?: number;
    autoActivate?: boolean;
  }) => {
    const res = await api.post('/subscriptions', payload);
    return res.data;
  },

  renewSubscription: async (subscriptionId: string) => {
    const res = await api.post(`/subscriptions/${subscriptionId}/renew`);
    return res.data;
  },
};

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.getPlans,
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.createSubscription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['member', 'subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'membership-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'payments'] });
    },
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.renewSubscription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['member', 'subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'membership-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['member', 'payments'] });
    },
  });
}
