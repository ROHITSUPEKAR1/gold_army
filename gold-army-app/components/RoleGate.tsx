import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { useAuthStore } from '../store/auth';

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  if (!session) return <Redirect href="/login" />;
  if (session.user.role !== role) return <Redirect href={`/${session.user.role}`} />;
  return children;
}