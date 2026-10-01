import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { PrimaryButton } from '../components/ui';
import { colors, fonts, spacing } from '../constants/theme';
import { useAuthStore } from '../store/auth';

type FormValues = { identifier: string; password: string };

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { setValue, handleSubmit } = useForm<FormValues>({
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    const id = values.identifier.trim();
    const pass = values.password;

    if (!id) {
      setLocalError('Please enter your mobile number or email.');
      return;
    }
    if (!pass) {
      setLocalError('Please enter your password.');
      return;
    }

    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      const session = await signIn(id, pass);
      router.replace(`/${session.user.role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please check and try again.';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormValues, value: string) => {
    setValue(field, value);
    if (localError || authError) {
      setLocalError(null);
      clearError();
    }
  };

  const errorMessage = localError || authError;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandMark compact />
        <View style={styles.heading}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your training</Text>
        </View>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Field
            label="MOBILE NUMBER OR EMAIL"
            placeholder="+91 98221 04000 or email"
            keyboardType="email-address"
            onChangeText={(value) => handleInputChange('identifier', value)}
          />
          <Field
            label="PASSWORD"
            placeholder="••••••••••"
            secureTextEntry
            onChangeText={(value) => handleInputChange('password', value)}
          />

          <View style={styles.links}>
            <Pressable onPress={() => undefined}>
              <Text style={styles.gold}>Login with OTP instead</Text>
            </Pressable>
            <Pressable onPress={() => undefined}>
              <Text style={styles.muted}>Forgot password?</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Login"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />

          <Text style={styles.footer}>
            New here? <Text style={styles.gold}>Create an account</Text>
          </Text>
        </View>

        <Text style={styles.demo}>
          Gold Army Fitness Club • Authenticated with server-verified role
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'phone-pad' | 'email-address';
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholder={placeholder}
        placeholderTextColor={colors.text2}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.blackDeep },
  content: { flex: 1, padding: spacing.xxl, paddingTop: 56 },
  heading: { alignItems: 'center', marginTop: 28, marginBottom: 28 },
  title: { color: colors.white, fontFamily: fonts.display, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 6 },
  form: { gap: 12 },
  errorCard: {
    backgroundColor: '#381014',
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: { color: '#FFA8A8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: { color: colors.white, fontSize: 14, padding: 0 },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  gold: { color: colors.goldSoft, fontSize: 12, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 8 },
  demo: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 'auto',
    lineHeight: 15,
  },
});
