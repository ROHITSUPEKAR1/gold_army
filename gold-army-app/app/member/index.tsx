import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../../components/BrandMark';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { colors, fonts, spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/auth';
import { useMemberProfile, useMembership } from '../../hooks/useMember';

export default function MemberHome() {
  const session = useAuthStore((state) => state.session);
  const { data: profile, isLoading: isProfileLoading } = useMemberProfile();
  const { data: membershipData, isLoading: isMembershipLoading } = useMembership();

  if (!session) return <Redirect href="/login" />;

  const active = membershipData?.activeMembership;
  const userName = profile?.user.name ?? session.user.name;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Good evening</Text>
          <Text style={styles.greeting}>{userName}</Text>
        </View>
        <BrandMark compact />
      </View>

      {isMembershipLoading ? (
        <Card style={styles.membership}>
          <ActivityIndicator color={colors.goldSoft} />
        </Card>
      ) : active ? (
        <Card style={styles.membership}>
          <View style={styles.row}>
            <Badge label={active.planName.toUpperCase()} />
            <Badge
              label={active.status}
              tone={
                active.status === 'EXPIRING SOON'
                  ? 'amber'
                  : active.status === 'ACTIVE'
                  ? 'green'
                  : 'red'
              }
            />
          </View>
          <View style={styles.days}>
            <Text style={styles.big}>{Math.max(0, active.daysRemaining)}</Text>
            <Text style={styles.daysLabel}>DAYS REMAINING</Text>
          </View>
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: `${active.progress}%` }]} />
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Valid until {active.expiresAt}</Text>
            <Text style={styles.muted}>{active.service}</Text>
          </View>
          <PrimaryButton
            label="Renew Membership"
            onPress={() => router.push('/member/choose-membership')}
          />
        </Card>
      ) : (
        <Card style={styles.membership}>
          <View style={styles.row}>
            <Badge label="MEMBERSHIP" />
            <Badge label="INACTIVE" tone="red" />
          </View>
          <Text style={[styles.cardTitle, { marginTop: 14, fontSize: 16 }]}>
            No active membership found
          </Text>
          <Text style={[styles.muted, { marginTop: 4, marginBottom: 14 }]}>
            Choose a plan to activate full gym and trainer access.
          </Text>
          <PrimaryButton
            label="Choose Membership"
            onPress={() => router.push('/member/choose-membership')}
          />
        </Card>
      )}

      <View style={styles.stats}>
        <Stat label="TODAY'S WORKOUT" value="Push Day" detail="6 exercises · 48 min" />
        <Stat label="WORKOUT STREAK" value="12 days" detail="Best: 21 days" />
        <Stat label="CALORIE TARGET" value="2,240" detail="kcal today" />
        <Stat label="NEXT PT SESSION" value="Today 6:30 PM" detail="Aditya Rao" />
      </View>

      <Card>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>This week's attendance</Text>
          <Text style={styles.muted}>5 / 6 days</Text>
        </View>
        <View style={styles.week}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <View key={`${day}-${index}`} style={styles.weekDay}>
              <View style={[styles.dayBox, index < 5 && styles.dayDone]}>
                <Text style={styles.dayText}>{index < 5 ? '✓' : ''}</Text>
              </View>
              <Text style={styles.muted}>{day}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.notice}>
        <Text style={styles.cardTitle}>New diet plan assigned</Text>
        <Text style={styles.muted}>Trainer Aditya updated your meal plan</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Your fitness</Text>
        <View style={styles.quickGrid}>
          {[
            ['Workout', '/member/workout'],
            ['Diet plan', '/member/diet'],
            ['Progress', '/member/progress'],
            ['Personal Training', '/member/pt'],
            ['Notifications', '/member/notifications'],
          ].map(([label, route]) => (
            <Pressable
              key={label}
              style={styles.quickAction}
              onPress={() => router.push(route as '/member/workout')}
            >
              <Text style={styles.quickText}>{label}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.nav}>
        <Pressable onPress={() => router.push('/member')}>
          <Text style={styles.navActive}>Home</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/member/choose-membership')}>
          <Text style={styles.navText}>Services</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/member/workout')}>
          <Text style={styles.navText}>Workout</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/member/attendance')}>
          <Text style={styles.navText}>Attend</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/member/membership')}>
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blackDeep },
  content: { padding: spacing.xl, gap: 14, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  eyebrow: { color: colors.muted, fontSize: 12 },
  greeting: { color: colors.white, fontSize: 16, fontWeight: '800', marginTop: 3 },
  membership: { backgroundColor: '#1C1408', borderColor: '#6F5A1E' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  days: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 },
  big: { color: colors.white, fontFamily: fonts.display, fontSize: 36, fontWeight: '800' },
  daysLabel: { color: colors.text2, fontSize: 13, fontWeight: '700' },
  progress: {
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: { height: '100%', backgroundColor: colors.goldSoft },
  muted: { color: colors.muted, fontSize: 11 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48%',
    minHeight: 92,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  statValue: {
    color: colors.white,
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 7,
  },
  statDetail: { color: '#5FD39E', fontSize: 10.5, marginTop: 4 },
  cardTitle: { color: colors.white, fontSize: 13.5, fontWeight: '700' },
  week: { flexDirection: 'row', gap: 7, marginTop: 14 },
  weekDay: { flex: 1, alignItems: 'center', gap: 5 },
  dayBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDone: { backgroundColor: colors.red },
  dayText: { color: colors.white, fontSize: 12 },
  notice: { backgroundColor: colors.surface2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickAction: {
    width: '48%',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickText: { color: colors.text2, fontSize: 12, fontWeight: '700' },
  arrow: { color: colors.redBright, fontSize: 18, lineHeight: 14 },
  nav: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
  },
  navText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  navActive: { color: colors.redBright, fontSize: 10, fontWeight: '700' },
});
