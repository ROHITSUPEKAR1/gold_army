export type TrainerMember = { id: string; name: string; initials: string; goal: string; weight: string; membership: 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED' | 'FROZEN' | 'INACTIVE'; attendance: string; nextSession: string; height: string; notes: string };
export type TrainerSession = { id: string; member: string; time: string; status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'; type: string };
export type AdminMember = { id: string; name: string; initials: string; phone: string; service: string; plan: string; expiry: string; days: number; status: 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED' | 'FROZEN' | 'PAYMENT PENDING'; attendance: string };
export type AdminMetric = { label: string; value: string; tone?: 'normal' | 'green' | 'amber' | 'red' };
export type AdminActivity = { text: string; time: string; tone: 'green' | 'gold' | 'red' };
export type AdminPlan = { id: string; name: string; service: string; duration: string; price: number; status: 'ACTIVE' | 'INACTIVE'; label?: 'POPULAR' | 'PREMIUM' };
