import { useQuery } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';
import type { Membership, MemberStatus, PaymentStatus, PlanDuration } from '../types/member';

export type BackendMemberProfile = {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  fitnessGoal?: string | null;
  emergencyPhone?: string | null;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    status: string;
  };
  subscriptions: BackendSubscription[];
  payments: Array<{
    id: string;
    amount: number;
    finalAmount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
  attendance: Array<{
    id: string;
    checkInDate: string;
    checkInTime: string;
    method: string;
  }>;
  progress: Array<{
    id: string;
    weightKg?: number | null;
    measuredAt: string;
  }>;
};

export type BackendSubscription = {
  id: string;
  memberId: string;
  planId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'FROZEN' | 'PAYMENT_PENDING';
  daysRemaining?: number;
  discount: number;
  plan?: {
    id: string;
    name: string;
    durationMonths?: number | null;
    durationDays?: number | null;
    price: number;
    isPopular?: boolean;
    isPremium?: boolean;
  };
  service?: {
    id: string;
    name: string;
  };
  payments?: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
};

export function formatDateString(dateString?: string | Date | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDuration(plan?: { durationMonths?: number | null; durationDays?: number | null }): PlanDuration {
  if (!plan) return 'Monthly';
  if (plan.durationMonths === 3) return 'Quarterly';
  if (plan.durationMonths === 6) return 'Half-Yearly';
  if (plan.durationMonths === 12) return 'Yearly';
  if (plan.durationDays) return `${plan.durationDays} Days` as unknown as PlanDuration;
  return 'Monthly';
}

export function normalizeStatus(status?: string): MemberStatus {
  if (status === 'EXPIRING_SOON') return 'EXPIRING SOON';
  if (status === 'PAYMENT_PENDING') return 'PAYMENT PENDING';
  if (status === 'FROZEN') return 'FROZEN';
  if (status === 'EXPIRED') return 'EXPIRED';
  return 'ACTIVE';
}

export function normalizePaymentStatus(status?: string): PaymentStatus {
  if (status === 'SUCCESSFUL' || status === 'ACTIVE') return 'SUCCESSFUL';
  if (status === 'FAILED') return 'FAILED';
  return 'PENDING';
}

export function mapSubscriptionToMembership(sub: BackendSubscription): Membership {
  const startMs = new Date(sub.startDate).getTime();
  const endMs = new Date(sub.endDate).getTime();
  const nowMs = Date.now();
  const totalDuration = Math.max(1, endMs - startMs);
  const elapsed = Math.max(0, nowMs - startMs);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  const daysRem =
    sub.daysRemaining ??
    Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));

  return {
    id: sub.id,
    planName: sub.plan?.name ?? 'Gold Membership',
    service: sub.service?.name ?? 'General Gym',
    duration: formatDuration(sub.plan),
    startedAt: formatDateString(sub.startDate),
    expiresAt: formatDateString(sub.endDate),
    daysRemaining: daysRem,
    progress: progressPercent,
    status: normalizeStatus(sub.status),
    paymentStatus: normalizePaymentStatus(sub.payments?.[0]?.status ?? (sub.status === 'ACTIVE' || sub.status === 'EXPIRING_SOON' ? 'SUCCESSFUL' : 'PENDING')),
    price: Number(sub.plan?.price ?? 0),
  };
}

export const memberApi = {
  getProfile: async (memberId: string): Promise<BackendMemberProfile> => {
    const res = await api.get<{ success: boolean; data: BackendMemberProfile }>(`/members/${memberId}`);
    return res.data.data;
  },

  getSubscriptions: async (): Promise<BackendSubscription[]> => {
    const res = await api.get<{ success: boolean; data: BackendSubscription[] }>('/subscriptions');
    return res.data.data;
  },

  getMembershipSummary: async (): Promise<{
    activeMembership: Membership | null;
    history: Array<{
      id: string;
      title: string;
      status: MemberStatus;
      dateRange: string;
      price: number;
    }>;
  }> => {
    const subs = await memberApi.getSubscriptions();
    if (!subs.length) {
      return { activeMembership: null, history: [] };
    }

    const activeSub = subs[0];
    const activeMembership = mapSubscriptionToMembership(activeSub);

    const history = subs.map((s) => ({
      id: s.id,
      title: `${s.service?.name ?? 'General Gym'} · ${formatDuration(s.plan)}`,
      status: normalizeStatus(s.status),
      dateRange: `${formatDateString(s.startDate)} – ${formatDateString(s.endDate)} · ₹${Number(s.plan?.price ?? 0).toLocaleString('en-IN')}`,
      price: Number(s.plan?.price ?? 0),
    }));

    return { activeMembership, history };
  },
};

export function useMemberProfile() {
  const session = useAuthStore((state) => state.session);
  const memberId = session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'profile', memberId],
    queryFn: () => {
      if (!memberId) throw new Error('No member profile linked to account');
      return memberApi.getProfile(memberId);
    },
    enabled: Boolean(memberId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useMemberSubscriptions() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['member', 'subscriptions', session?.user.id],
    queryFn: memberApi.getSubscriptions,
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMembership() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['member', 'membership-summary', session?.user.id],
    queryFn: memberApi.getMembershipSummary,
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 2,
  });
}
