export type PlanDuration = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'PT Package';
export type PaymentStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED';
export type MemberStatus = 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED' | 'FROZEN' | 'PAYMENT PENDING';

export type Membership = {
  id: string;
  planName: string;
  service: string;
  duration: PlanDuration;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  progress: number;
  status: MemberStatus;
  paymentStatus: PaymentStatus;
  price: number;
};

export type Plan = { id: string; name: string; service: string; duration: PlanDuration; price: number; originalPrice?: number; benefits: string[]; label?: 'POPULAR' | 'PREMIUM' };
export type Payment = { id: string; plan: string; amount: number; date: string; reference: string; status: PaymentStatus };
export type Exercise = { id: string; name: string; target: string; sets: number; reps: number; weight: string; rest: string; difficulty: string; instructions: string; notes: string };
export type Meal = { type: string; time: string; name: string; calories: number; protein: string; budget: number };
export type Notification = { id: string; title: string; body: string; category: 'Membership' | 'Payment' | 'Workout' | 'Diet' | 'PT' | 'Offers' | 'Gym'; time: string; unread?: boolean };
