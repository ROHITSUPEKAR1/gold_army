import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors } from '../../constants/theme';
import { usePlans, useCreateSubscription } from '../../hooks/usePlans';
import { useAuthStore } from '../../store/auth';
import { formatApiError } from '../../services/api';

export default function PaymentScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: plans, isLoading: isPlansLoading } = usePlans();
  const createSubMutation = useCreateSubscription();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const plan = plans?.find((item) => item.id === planId) ?? plans?.[0];

  const handleCheckout = async () => {
    if (!plan) return;
    setErrorMessage(null);

    try {
      const res = await createSubMutation.mutateAsync({
        planId: plan.id,
        paymentMethod,
        autoActivate: true,
      });

      router.replace({
        pathname: '/member/payment-result',
        params: {
          status: 'SUCCESSFUL',
          planName: plan.name,
          amount: String(plan.price),
          ref: res.data?.id ?? `GA-${Date.now()}`,
        },
      });
    } catch (err) {
      const formatted = formatApiError(err);
      setErrorMessage(formatted);
    }
  };

  if (isPlansLoading) {
    return (
      <MemberScreen title="Review & Pay">
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={colors.goldSoft} size="small" />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading plan details...</Text>
        </Card>
      </MemberScreen>
    );
  }

  return (
    <MemberScreen title="Review & Pay">
      {errorMessage ? (
        <Card style={{ borderColor: colors.red, backgroundColor: '#381014', marginBottom: 14 }}>
          <Text style={{ color: '#FFA8A8', fontWeight: '700', fontSize: 13 }}>Checkout Failed</Text>
          <Text style={[s.muted, { color: '#FFD1D1', marginTop: 4 }]}>{errorMessage}</Text>
        </Card>
      ) : null}

      <Card>
        <View style={s.row}>
          <Text style={s.heading}>{plan?.name ?? 'Membership Plan'}</Text>
          {plan?.label ? <Badge label={plan.label} tone={plan.label === 'PREMIUM' ? 'gold' : 'red'} /> : null}
        </View>

        <Text style={[s.muted, { marginTop: 4 }]}>
          {plan?.service} · {plan?.duration}
        </Text>

        <View style={[s.divider, { marginVertical: 14 }]} />

        <View style={s.row}>
          <Text style={s.muted}>Member</Text>
          <Text style={{ color: colors.white, fontWeight: '700' }}>{session?.user.name}</Text>
        </View>

        <View style={[s.row, { marginTop: 8 }]}>
          <Text style={s.muted}>Plan Price</Text>
          <Text style={{ color: colors.white, fontWeight: '700' }}>
            {plan?.originalPrice ? `₹${plan.originalPrice.toLocaleString('en-IN')}` : `₹${plan?.price.toLocaleString('en-IN')}`}
          </Text>
        </View>

        {plan?.originalPrice ? (
          <View style={[s.row, { marginTop: 8 }]}>
            <Text style={{ color: colors.goldSoft, fontSize: 12, fontWeight: '600' }}>Club Discount</Text>
            <Text style={{ color: colors.goldSoft, fontWeight: '700' }}>
              -₹{(plan.originalPrice - plan.price).toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}

        <View style={[s.divider, { marginVertical: 14 }]} />

        <View style={s.row}>
          <Text style={{ color: colors.white, fontWeight: '800', fontSize: 15 }}>Final Payable</Text>
          <Text style={{ color: colors.white, fontFamily: 'Manrope', fontWeight: '800', fontSize: 20 }}>
            ₹{plan?.price.toLocaleString('en-IN')}
          </Text>
        </View>
      </Card>

      <Text style={[s.heading, { marginTop: 22 }]}>Select Payment Method</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 }}>
        <Pressable
          onPress={() => setPaymentMethod('UPI')}
          style={{
            flex: 1,
            backgroundColor: paymentMethod === 'UPI' ? colors.surface2 : colors.surface,
            borderColor: paymentMethod === 'UPI' ? colors.goldSoft : colors.line,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: paymentMethod === 'UPI' ? colors.white : colors.muted, fontWeight: '800', fontSize: 13 }}>
            UPI (Instant)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPaymentMethod('CARD')}
          style={{
            flex: 1,
            backgroundColor: paymentMethod === 'CARD' ? colors.surface2 : colors.surface,
            borderColor: paymentMethod === 'CARD' ? colors.goldSoft : colors.line,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: paymentMethod === 'CARD' ? colors.white : colors.muted, fontWeight: '800', fontSize: 13 }}>
            Credit / Debit Card
          </Text>
        </Pressable>
      </View>

      <PrimaryButton
        label={createSubMutation.isPending ? 'Activating Subscription…' : `Pay ₹${plan?.price.toLocaleString('en-IN')} & Activate`}
        loading={createSubMutation.isPending}
        onPress={handleCheckout}
      />
    </MemberScreen>
  );
}
