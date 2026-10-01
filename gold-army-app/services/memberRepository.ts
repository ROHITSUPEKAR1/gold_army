import { memberApi } from '../hooks/useMember';
import { plansApi } from '../hooks/usePlans';
import type { Exercise, Meal, Membership, Notification, Payment, Plan } from '../types/member';

const fallbackMembership: Membership = {
  id: 'sub-001',
  planName: 'Gym + Personal Training',
  service: 'Gym + PT',
  duration: 'Quarterly',
  startedAt: '12 Jul 2026',
  expiresAt: '04 Oct 2026',
  daysRemaining: 23,
  progress: 74,
  status: 'EXPIRING SOON',
  paymentStatus: 'SUCCESSFUL',
  price: 8499,
};

const fallbackPlans: Plan[] = [
  { id: 'gym-cardio-q', name: 'Gym + Cardio', service: 'Gym + Cardio', duration: 'Quarterly', price: 5499, originalPrice: 6999, benefits: ['Full gym access', 'Cardio zone access', 'Diet plan included', 'Free 1 PT session'], label: 'POPULAR' },
  { id: 'gym-pt-h', name: 'Gym + Cardio + PT', service: 'Gym + Cardio + PT', duration: 'Half-Yearly', price: 16999, benefits: ['Full gym and cardio access', '24 PT sessions', 'Personalized diet plan'], label: 'PREMIUM' },
  { id: 'gym-m', name: 'General Gym', service: 'General Gym', duration: 'Monthly', price: 1999, benefits: ['Full gym access', 'Workout tracking'] },
  { id: 'pt-12', name: 'Personal Training', service: 'Personal Training', duration: 'PT Package', price: 8999, benefits: ['12 trainer-led sessions', 'Progress tracking', 'Trainer notes'] },
];

const payments: Payment[] = [
  { id: 'pay-1', plan: 'Gold Membership Renewal', amount: 8499, date: '12 Jul 2026', reference: 'GA2607128499', status: 'SUCCESSFUL' },
  { id: 'pay-2', plan: 'General Gym', amount: 1999, date: '12 Jun 2026', reference: 'GA2606121999', status: 'PENDING' },
  { id: 'pay-3', plan: 'General Gym', amount: 1999, date: '12 May 2026', reference: 'GA2605121999', status: 'FAILED' },
];

const exercises: Exercise[] = [{ id: 'bench', name: 'Barbell Bench Press', target: 'Chest · Compound', sets: 4, reps: 8, weight: '60 kg', rest: '90 sec', difficulty: 'Intermediate', instructions: 'Lie flat on the bench with feet planted. Grip the bar slightly wider than shoulder-width. Lower the bar to mid-chest with control, then press up until arms are fully extended.', notes: 'Keep your shoulder blades pinned back. Add 2.5kg next week if all reps feel controlled.' }];
const meals: Meal[] = [
  { type: 'BREAKFAST', time: '7:00 AM', name: 'Paneer bhurji + 2 multigrain roti', calories: 420, protein: '28g', budget: 70 },
  { type: 'MID-MORNING', time: '10:30 AM', name: 'Whey shake + banana', calories: 260, protein: '24g', budget: 45 },
  { type: 'LUNCH', time: '1:00 PM', name: 'Dal, rice, mixed veg, curd', calories: 560, protein: '22g', budget: 90 },
  { type: 'PRE-WORKOUT', time: '5:00 PM', name: 'Peanut butter toast + black coffee', calories: 310, protein: '12g', budget: 35 },
  { type: 'POST-WORKOUT', time: '7:30 PM', name: 'Whey shake + 4 boiled eggs', calories: 380, protein: '42g', budget: 55 },
  { type: 'DINNER', time: '9:00 PM', name: 'Soya chunk curry + 2 roti + salad', calories: 410, protein: '30g', budget: 55 },
];
const notifications: Notification[] = [
  { id: 'n1', title: 'Membership expiring soon', body: 'Only 3 days remaining on your Gold membership.', category: 'Membership', time: '2h ago', unread: true },
  { id: 'n2', title: 'Payment successful', body: '₹8,499 received for Gold Membership renewal.', category: 'Payment', time: '1d ago', unread: true },
  { id: 'n3', title: 'New workout assigned', body: 'Aditya assigned you a new Push Day routine.', category: 'Workout', time: '1d ago' },
  { id: 'n4', title: 'Diet plan updated', body: 'Your meal plan has been revised for muscle gain.', category: 'Diet', time: '2d ago' },
  { id: 'n5', title: 'PT session reminder', body: 'Session with Aditya Rao at 6:30 PM today.', category: 'PT', time: '2d ago' },
  { id: 'n6', title: 'New offer for you', body: 'Upgrade to Gym+PT and save ₹1,500 this month.', category: 'Offers', time: '6d ago' },
];

export const memberRepository = {
  getMembership: async (): Promise<Membership> => {
    try {
      const summary = await memberApi.getMembershipSummary();
      return summary.activeMembership ?? fallbackMembership;
    } catch {
      return fallbackMembership;
    }
  },
  getPlans: async (): Promise<Plan[]> => {
    try {
      const live = await plansApi.getPlans();
      return live.map((p) => ({
        id: p.id,
        name: p.name,
        service: p.service,
        duration: p.duration,
        price: p.price,
        originalPrice: p.originalPrice,
        benefits: p.benefits,
        label: p.label,
      }));
    } catch {
      return fallbackPlans;
    }
  },
  getPayments: async () => {
    try {
      const { api } = await import('./api');
      const res = await api.get<{ success: boolean; data: any[] }>('/payments');
      return res.data.data.map((p) => ({
        id: p.id,
        plan: p.subscription?.plan?.name ?? 'Membership Payment',
        amount: Number(p.finalAmount ?? p.amount),
        date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        reference: p.transactionId ?? `GA-${p.id.slice(0, 8).toUpperCase()}`,
        status: p.status,
      }));
    } catch {
      return payments;
    }
  },
  getExercises: async () => exercises,
  getMeals: async () => meals,
  getNotifications: async () => notifications,
  renew: async (planId: string) => {
    try {
      const res = await plansApi.createSubscription({ planId });
      return { orderId: res.data?.id ?? `order-${planId}`, status: 'SUCCESSFUL' as const };
    } catch {
      return { orderId: `order-${planId}`, status: 'PENDING' as const };
    }
  },
  checkIn: async () => ({ verified: true, streak: 13, checkedInAt: new Date().toISOString() }),
};
