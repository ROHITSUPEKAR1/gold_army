import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={loading || disabled ? undefined : onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Badge({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'green' | 'amber' | 'red' }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${toneColor[tone]}22` }]}>
      <Text style={[styles.badgeText, { color: toneColor[tone] }]}>{label}</Text>
    </View>
  );
}

const toneColor = { gold: colors.goldSoft, green: '#5FD39E', amber: colors.amber, red: colors.redBright };

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  button: { backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontFamily: fonts.body, fontWeight: '800', fontSize: 14 },
  badge: { alignSelf: 'flex-start', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
