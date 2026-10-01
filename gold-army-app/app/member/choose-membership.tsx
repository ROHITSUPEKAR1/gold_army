import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors } from '../../constants/theme';
import { usePlans } from '../../hooks/usePlans';

export default function ChooseMembership() {
  const { data: plans, isLoading, error } = usePlans();

  return (
    <MemberScreen title="Choose Membership">
      <Text style={s.muted}>Select a service and duration built for your goal.</Text>

      {isLoading ? (
        <Card style={{ padding: 24, alignItems: 'center', marginTop: 14 }}>
          <ActivityIndicator color={colors.goldSoft} size="small" />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading membership plans...</Text>
        </Card>
      ) : error ? (
        <Card style={{ padding: 20, alignItems: 'center', marginTop: 14 }}>
          <Text style={{ color: colors.redBright, fontWeight: '700' }}>Failed to load plans</Text>
          <Text style={[s.muted, { marginTop: 6, textAlign: 'center' }]}>Please check your connection.</Text>
        </Card>
      ) : (
        <View style={{ marginTop: 14 }}>
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              style={{
                marginBottom: 12,
                borderColor: plan.label ? (plan.label === 'PREMIUM' ? colors.gold : colors.red) : colors.line,
              }}
            >
              <View style={s.row}>
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800', flex: 1 }}>
                  {plan.name}
                </Text>
                {plan.label && (
                  <Badge
                    label={plan.label}
                    tone={plan.label === 'PREMIUM' ? 'gold' : 'red'}
                  />
                )}
              </View>

              <Text style={[s.muted, { marginTop: 4 }]}>
                {plan.service} · {plan.duration}
              </Text>

              <Text style={{ color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 12 }}>
                ₹{plan.price.toLocaleString('en-IN')}
              </Text>

              {plan.originalPrice ? (
                <Text style={[s.muted, { textDecorationLine: 'line-through', marginTop: 2 }]}>
                  ₹{plan.originalPrice.toLocaleString('en-IN')} · Save ₹{(plan.originalPrice - plan.price).toLocaleString('en-IN')}
                </Text>
              ) : null}

              <View style={{ marginTop: 14, marginBottom: 16 }}>
                {plan.benefits.map((benefit) => (
                  <Text key={benefit} style={{ color: colors.text2, fontSize: 12, marginBottom: 6 }}>
                    ✓ {benefit}
                  </Text>
                ))}
              </View>

              <PrimaryButton
                label="Select Plan"
                onPress={() =>
                  router.push({
                    pathname: '/member/payment',
                    params: { planId: plan.id },
                  })
                }
              />
            </Card>
          ))}
        </View>
      )}

      <MemberNav />
    </MemberScreen>
  );
}
