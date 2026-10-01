import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type AttendanceRecord = {
  id: string;
  memberId: string;
  serviceId: string;
  checkInDate: string;
  checkInTime: string;
  method: string;
  service?: {
    id: string;
    name: string;
    code?: string;
  };
};

export type AttendanceStats = {
  totalVisits: number;
  thisMonthVisits: number;
  hasAttendedToday: boolean;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
  past7Days: Array<{
    date: string;
    attended: boolean;
  }>;
};

export type CheckInResponse = {
  attendance: AttendanceRecord;
  currentStreak: number;
  longestStreak: number;
  totalVisits: number;
  message: string;
};

export type AdminAttendanceSummary = {
  todayCount: number;
  weeklyCount: number;
  monthlyCount: number;
  recentRecords: Array<AttendanceRecord & {
    member: {
      user: {
        name: string;
        phone?: string | null;
      };
    };
  }>;
};

/**
 * Hook to fetch member's attendance history
 */
export function useAttendance(memberId?: string) {
  const session = useAuthStore((state) => state.session);
  const targetId = memberId || session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'attendance', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const response = await api.get<{ success: boolean; data: AttendanceRecord[] }>(
        `/attendance/member/${targetId}`
      );
      return response.data.data;
    },
    enabled: Boolean(targetId),
  });
}

/**
 * Hook to fetch attendance statistics (streak, monthly percentage, past 7 days)
 */
export function useAttendanceStats(memberId?: string) {
  const session = useAuthStore((state) => state.session);
  const targetId = memberId || session?.user.memberId;

  return useQuery({
    queryKey: ['member', 'attendance-stats', targetId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: AttendanceStats }>(
        '/attendance/stats',
        { params: targetId ? { memberId: targetId } : undefined }
      );
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Hook to check in with a scanned QR token
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qrToken, serviceId }: { qrToken: string; serviceId?: string }) => {
      try {
        const response = await api.post<{ success: boolean; data: CheckInResponse }>(
          '/attendance/check-in',
          { qrToken, serviceId }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'attendance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

/**
 * Hook to fetch Admin attendance overview
 */
export function useAdminAttendance() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['admin', 'attendance'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: AdminAttendanceSummary }>(
        '/admin/attendance'
      );
      return response.data.data;
    },
    enabled: session?.user.role === 'admin',
  });
}
