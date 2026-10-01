import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors } from '../../constants/theme';
import { useMembership, useMemberProfile } from '../../hooks/useMember';
import { useAuthStore } from '../../store/auth';

export default function MembershipScreen() {
  const { data: membershipData, isLoading: isMembershipLoading, refetch } = useMembership();
  const { data: profile, isLoading: isProfileLoading } = useMemberProfile();
  const signOut = useAuthStore((state) => state.signOut);

  const active = membershipData?.activeMembership;
  const history = membershipData?.history ?? [];

  if (isMembershipLoading || isProfileLoading) {
    return (
      <MemberScreen title="Membership">
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={colors.goldSoft} size="small" />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading membership details...</Text>
        </Card>
        <MemberNav />
      </MemberScreen>
    );
  }

  return (
    <MemberScreen title="Membership">
      {/* 1. Member Profile Details */}
      {profile ? (
        <Card style={{ marginBottom: 14 }}>
          <View style={s.row}>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
              {profile.user.name}
            </Text>
            <Badge label={profile.isActive ? 'ACTIVE MEMBER' : 'INACTIVE'} tone={profile.isActive ? 'green' : 'red'} />
          </View>
          <Text style={[s.muted, { marginTop: 4 }]}>
            {profile.user.phone ?? profile.user.email ?? 'Member'}
          </Text>

          <View style={[s.row, { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line }]}>
            <Info label="FITNESS GOAL" value={profile.fitnessGoal ?? 'General Fitness'} />
            <Info label="HEIGHT" value={profile.heightCm ? `${profile.heightCm} cm` : '—'} />
            <Info label="WEIGHT" value={profile.weightKg ? `${profile.weightKg} kg` : '—'} />
          </View>
        </Card>
      ) : null}

      {/* 2. Active Membership Card */}
      {active ? (
        <Card style={{ backgroundColor: '#1C1408', borderColor: '#6F5A1E' }}>
          <View style={s.row}>
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
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: '800', marginTop: 12 }}>
            {active.planName}
          </Text>
          <Text style={[s.muted, { marginTop: 4 }]}>
            {active.service} · {active.duration}
          </Text>

          <View style={[s.row, { marginTop: 18 }]}>
            <Info label="STARTED" value={active.startedAt} />
            <Info label="EXPIRES" value={active.expiresAt} />
            <Info label="PRICE" value={`₹${active.price.toLocaleString('en-IN')}`} />
          </View>

          <View
            style={{
              height: 7,
              backgroundColor: colors.surface2,
              borderRadius: 99,
              overflow: 'hidden',
              marginTop: 16,
            }}
          >
            <View style={{ width: `${active.progress}%`, height: '100%', backgroundColor: colors.goldSoft }} />
          </View>

          <Text style={[s.muted, { marginTop: 8 }]}>
            {Math.max(0, active.daysRemaining)} days remaining · Payment {active.paymentStatus.toLowerCase()}
          </Text>

          <PrimaryButton
            label="Renew Membership"
            onPress={() => router.push('/member/choose-membership')}
          />
        </Card>
      ) : (
        <Card style={{ backgroundColor: '#1C1408', borderColor: '#6F5A1E' }}>
          <View style={s.row}>
            <Badge label="NO SUBSCRIPTION" tone="amber" />
          </View>
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 12 }}>
            No Active Membership
          </Text>
          <Text style={[s.muted, { marginTop: 6, marginBottom: 14 }]}>
            Choose a plan to get full access to gym facilities, workout routines, and diet plans.
          </Text>
          <PrimaryButton
            label="Choose Membership Plan"
            onPress={() => router.push('/member/choose-membership')}
          />
        </Card>
      )}

      {/* 3. Membership History */}
      <View style={s.section}>
        <Text style={s.heading}>Membership History</Text>
        {history.length > 0 ? (
          history.map((item) => (
            <Card key={item.id} style={{ marginBottom: 10, padding: 14 }}>
              <View style={s.row}>
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>
                  {item.title}
                </Text>
                <Badge
                  label={item.status}
                  tone={
                    item.status === 'ACTIVE'
                      ? 'green'
                      : item.status === 'EXPIRING SOON'
                      ? 'amber'
                      : 'red'
                  }
                />
              </View>
              <Text style={s.muted}>{item.dateRange}</Text>
            </Card>
          ))
        ) : (
          <Card style={{ padding: 14 }}>
            <Text style={[s.muted, { textAlign: 'center' }]}>No previous subscriptions found.</Text>
          </Card>
        )}
      </View>

      {/* 4. Payment History Link & Account Actions */}
      <View style={s.section}>
        <Text style={s.heading}>Payment History</Text>
        <PrimaryButton label="View all payments" onPress={() => router.push('/member/payments')} />
      </View>

      <View style={[s.section, { marginTop: 12, marginBottom: 20 }]}>
        <PrimaryButton
          label="Sign Out"
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        />
      </View>

      <MemberNav />
    </MemberScreen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: 10 }}>{label}</Text>
      <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{value}</Text>
    </View>
  );
}
