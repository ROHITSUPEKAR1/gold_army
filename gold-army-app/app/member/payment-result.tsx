import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Card, PrimaryButton } from '../../components/ui';
import { MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors } from '../../constants/theme';

export default function PaymentResult() {
  const { status, planName, amount, ref } = useLocalSearchParams<{
    status?: string;
    planName?: string;
    amount?: string;
    ref?: string;
  }>();

  const success = status === 'SUCCESSFUL';

  return (
    <MemberScreen title="Payment Result">
      <Card
        style={{
          alignItems: 'center',
          marginTop: 40,
          borderColor: success ? colors.green : colors.red,
          paddingVertical: 28,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: success ? colors.green : colors.redBright, fontSize: 48, fontWeight: '800' }}>
          {success ? '✓' : '!'}
        </Text>

        <Text style={{ color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 12 }}>
          {success ? 'Subscription Activated' : 'Payment Failed'}
        </Text>

        <Text style={[s.muted, { textAlign: 'center', marginTop: 8, lineHeight: 18 }]}>
          {success
            ? `Your subscription for ${planName ?? 'Gold Membership'} has been recorded and activated successfully.`
            : 'We were unable to process the subscription payment. Please try another payment method.'}
        </Text>

        {success && amount ? (
          <View
            style={{
              width: '100%',
              backgroundColor: colors.surface2,
              borderRadius: 12,
              padding: 14,
              marginVertical: 18,
            }}
          >
            <View style={s.row}>
              <Text style={s.muted}>Amount Paid</Text>
              <Text style={{ color: colors.white, fontWeight: '800' }}>
                ₹{Number(amount).toLocaleString('en-IN')}
              </Text>
            </View>
            {ref ? (
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.muted}>Reference</Text>
                <Text style={{ color: colors.goldSoft, fontSize: 11, fontWeight: '700' }}>{ref}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ width: '100%', marginTop: 8 }}>
          <PrimaryButton
            label={success ? 'View Membership' : 'Try Again'}
            onPress={() => router.replace(success ? '/member/membership' : '/member/choose-membership')}
          />
        </View>
      </Card>
    </MemberScreen>
  );
}
