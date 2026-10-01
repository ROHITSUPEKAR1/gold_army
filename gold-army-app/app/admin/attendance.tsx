import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { RoleGate } from '../../components/RoleGate';
import { RoleNav, RoleScreen, roleStyles as s } from '../../components/RoleScreen';
import { Badge, Card } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';
import { useAdminAttendance } from '../../hooks/useAttendance';

export default function AdminAttendance() {
  const { data: attendance, isLoading, refetch, isRefetching } = useAdminAttendance();

  const todayCount = attendance?.todayCount ?? 0;
  const weeklyCount = attendance?.weeklyCount ?? 0;
  const monthlyCount = attendance?.monthlyCount ?? 0;
  const recentRecords = attendance?.recentRecords ?? [];

  return (
    <RoleGate role="admin">
      <RoleScreen title="Attendance" eyebrow="ADMIN · OPERATIONS">
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>TODAY</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.metricValue}>{todayCount}</Text>
            )}
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>THIS WEEK</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.metricValue}>{weeklyCount}</Text>
            )}
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>THIS MONTH</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.metricValue}>{monthlyCount}</Text>
            )}
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>STATUS</Text>
            <View style={{ marginTop: 6 }}>
              <Badge label="LIVE VERIFIED" tone="green" />
            </View>
          </Card>
        </View>

        {/* Peak Hours Overview */}
        <Card style={{ marginTop: 14 }}>
          <Text style={s.heading}>Peak Hours Distribution</Text>
          <View style={styles.chartBarContainer}>
            {[35, 48, 72, 90, 64, 45, 30].map((height, index) => (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height,
                    backgroundColor: index === 3 ? colors.goldSoft : colors.red,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[s.muted, { marginTop: 10, textAlign: 'center' }]}>
            6 AM · 8 AM · 10 AM · 6 PM · 7 PM · 8 PM · 9 PM
          </Text>
        </Card>

        {/* Live Check-ins Feed */}
        <Card style={{ marginTop: 14 }}>
          <View style={s.row}>
            <Text style={s.heading}>Live Check-in Activity</Text>
            <Text style={s.muted}>{recentRecords.length} recent</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginVertical: 16 }} />
          ) : recentRecords.length === 0 ? (
            <Text style={[s.muted, { marginVertical: 10 }]}>No attendance records today.</Text>
          ) : (
            recentRecords.map((item) => {
              const checkInDate = new Date(item.checkInTime || item.checkInDate);
              const timeStr = checkInDate.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <View key={item.id} style={styles.activityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {item.member?.user?.name || 'Member'}
                    </Text>
                    <Text style={styles.serviceName}>
                      {item.service?.name || 'General Gym'} • {item.method || 'QR'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge label="CHECKED IN" tone="green" />
                    <Text style={styles.timeText}>{timeStr}</Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <RoleNav
          items={[
            { label: 'Home', route: '/admin' },
            { label: 'Members', route: '/admin/members' },
            { label: 'Attendance', route: '/admin/attendance' },
            { label: 'Payments', route: '/admin/payments' },
            { label: 'More', route: '/admin/more' },
          ]}
        />
      </RoleScreen>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '47.5%',
    paddingVertical: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 6,
  },
  chartBarContainer: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  chartBar: {
    flex: 1,
    borderRadius: 5,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  memberName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  serviceName: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  timeText: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
