import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';

export default function SplashScreen() {
  const router = useRouter();
  const { session, isHydrated } = useAuthStore();
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => router.replace(session ? `/${session.user.role}` : '/login'), 900);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, router, session]);
  if (!isHydrated) return <View style={styles.screen}><ActivityIndicator color={colors.redBright} /></View>;
  return <View style={styles.screen}><BrandMark /><View style={styles.rule}><View style={styles.ruleFill} /></View><Text style={styles.tagline}>DISCIPLINE IS FREEDOM</Text></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.blackDeep, alignItems: 'center', justifyContent: 'center' }, rule: { width: 120, height: 3, backgroundColor: colors.surface2, marginTop: 30, overflow: 'hidden' }, ruleFill: { width: '65%', height: '100%', backgroundColor: colors.red }, tagline: { color: colors.muted, fontSize: 11, letterSpacing: 1, marginTop: 14 } });