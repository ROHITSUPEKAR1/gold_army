export type UserRole = 'member' | 'trainer' | 'admin';
export type MembershipStatus = 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED' | 'FROZEN' | 'PAYMENT PENDING';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  memberId?: string;
  trainerId?: string;
};

export type AuthSession = {
  token: string;
  accessToken: string;
  refreshToken?: string;
  user: SessionUser;
};
