import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAttendance, useAttendanceStats } from '../../hooks/useAttendance';
import { useMemberProfile } from '../../hooks/useMember';

export default function AttendanceScreen() {
  const { data: profile } = useMemberProfile();
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isRefetching: isStatsRefetching,
  } = useAttendanceStats();
  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
    isRefetching: isHistoryRefetching,
  } = useAttendance(profile?.id);

  const isLoading = isStatsLoading || isHistoryLoading;
  const isRefreshing = isStatsRefetching || isHistoryRefetching;

  const onRefresh = () => {
    void refetchStats();
    void refetchHistory();
  };

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalVisits = stats?.totalVisits ?? history.length ?? 0;
  const thisMonthVisits = stats?.thisMonthVisits ?? 0;
  const attendancePercentage = stats?.attendancePercentage ?? 0;
  const hasAttendedToday = stats?.hasAttendedToday ?? false;

  // Build current month calendar data
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const attendedDaysSet = new Set(
    history
      .map((item) => {
        const d = new Date(item.checkInDate);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          return d.getDate();
        }
        return null;
      })
      .filter(Boolean) as number[]
  );

  const todayDate = now.getDate();

  return (
    <MemberScreen title="Attendance">
      {/* Top Hero: Live Streak & Check-in CTA */}
      <Card style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.fireIcon}>🔥</Text>
          <Text style={styles.streakTitle}>{currentStreak} DAY STREAK</Text>
        </View>
        <Text style={styles.streakSubtitle}>
          {hasAttendedToday
            ? "✓ You're checked in for today! Great dedication."
            : 'Keep your momentum going! Check in at the club today.'}
        </Text>
        <View style={{ marginTop: 14, width: '100%' }}>
          <PrimaryButton
            label={hasAttendedToday ? 'Scan QR Again' : 'Scan QR to Check-in'}
            onPress={() => router.push('/member/scan')}
          />
        </View>
      </Card>

      {/* 4-Stat Metric Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL VISITS</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.statValue}>{totalVisits}</Text>
          )}
        </Card>

        <Card style={styles.statBox}>
          <Text style={styles.statLabel}>LONGEST STREAK</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.statValue}>{longestStreak} days</Text>
          )}
        </Card>

        <Card style={styles.statBox}>
          <Text style={styles.statLabel}>THIS MONTH</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.statValue}>{thisMonthVisits} visits</Text>
          )}
        </Card>

        <Card style={styles.statBox}>
          <Text style={styles.statLabel}>ATTENDANCE</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.statValue}>{attendancePercentage}%</Text>
          )}
        </Card>
      </View>

      {/* Monthly Attendance Calendar */}
      <Card style={styles.calendarCard}>
        <View style={s.row}>
          <View>
            <Text style={s.heading}>{monthName}</Text>
            <Text style={s.muted}>Monthly check-in calendar</Text>
          </View>
          <Badge label={`${attendedDaysSet.size} Attended`} tone="gold" />
        </View>

        {/* Days of week header */}
        <View style={styles.weekHeader}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={idx} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {/* Empty offset days for start of month */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.daySlot} />
          ))}

          {/* Actual days in month */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isAttended = attendedDaysSet.has(day);
            const isToday = day === todayDate;
            const isPast = day < todayDate;

            let bgColor: string = colors.surface2;
            let borderColor: string = 'transparent';
            let textColor: string = colors.muted;

            if (isAttended) {
              bgColor = colors.red;
              textColor = colors.white;
            } else if (isToday) {
              bgColor = '#2A1F08';
              borderColor = colors.goldSoft;
              textColor = colors.goldSoft;
            } else if (isPast) {
              bgColor = '#1A1A1A';
              textColor = '#555555';
            }

            return (
              <View
                key={`day-${day}`}
                style={[
                  styles.daySlot,
                  {
                    backgroundColor: bgColor,
                    borderColor,
                    borderWidth: isToday ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: textColor,
                      fontWeight: isAttended || isToday ? '800' : '500',
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Calendar Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.red }]} />
            <Text style={styles.legendText}>Attended</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2A1F08', borderColor: colors.goldSoft, borderWidth: 1 }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1A1A1A' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </Card>

      {/* Recent Check-in Activity */}
      <Card style={{ marginTop: 14 }}>
        <View style={s.row}>
          <Text style={s.heading}>Recent Check-ins</Text>
          <Text style={s.muted}>{history.length} records</Text>
        </View>

        {history.length === 0 ? (
          <Text style={[s.muted, { marginVertical: 10 }]}>
            No check-in activity recorded yet. Scan the gym QR to start your streak!
          </Text>
        ) : (
          history.slice(0, 5).map((item) => {
            const checkInDate = new Date(item.checkInTime || item.checkInDate);
            const dateStr = checkInDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = checkInDate.toLocaleTimeString('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <View key={item.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyTitle}>{item.service?.name || 'General Gym'}</Text>
                  <Text style={styles.historyDate}>{dateStr}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Badge label="VERIFIED" tone="green" />
                  <Text style={[styles.historyTime, { marginTop: 4 }]}>{timeStr}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    alignItems: 'center',
    backgroundColor: '#24120F',
    borderColor: '#4A1D1A',
    borderWidth: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireIcon: {
    fontSize: 28,
  },
  streakTitle: {
    color: colors.goldSoft,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  streakSubtitle: {
    color: colors.text2,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    width: '47.5%',
    paddingVertical: 14,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  calendarCard: {
    marginTop: 14,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  weekDayText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    width: '12%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  daySlot: {
    width: '12.4%',
    aspectRatio: 1,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.muted,
    fontSize: 11,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  historyTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  historyTime: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '600',
  },
});
