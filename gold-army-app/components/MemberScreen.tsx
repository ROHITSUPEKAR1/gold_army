import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { colors, spacing } from '../constants/theme';
import { useAuthStore } from '../store/auth';
import { BrandMark } from './BrandMark';

export function MemberScreen({ title, children, scroll = true }: { title: string; children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.inner}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><BrandMark compact /></View>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView> : content}</SafeAreaView>;
}

export function MemberNav() {
  const signOut = useAuthStore((state) => state.signOut);
  return <View style={styles.nav}><NavItem label="Home" route="/member" /><NavItem label="Membership" route="/member/membership" /><NavItem label="Workout" route="/member/workout" /><NavItem label="Attend" route="/member/attendance" /><Pressable onPress={() => void signOut()}><Text style={styles.navText}>Logout</Text></Pressable></View>;
}
function NavItem({ label, route }: { label: string; route: '/member' | '/member/membership' | '/member/workout' | '/member/attendance' }) { return <Pressable onPress={() => router.push(route)}><Text style={styles.navText}>{label}</Text></Pressable>; }

export const memberStyles = StyleSheet.create({ section: { marginTop: spacing.lg }, heading: { color: colors.white, fontSize: 15, fontWeight: '800', marginBottom: 10 }, muted: { color: colors.muted, fontSize: 12, lineHeight: 18 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, divider: { height: 1, backgroundColor: colors.line, marginVertical: 14 }, });
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.blackDeep }, content: { paddingBottom: 28 }, inner: { padding: spacing.xl, paddingTop: spacing.md }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }, title: { color: colors.white, fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' }, back: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.text2, fontSize: 28, lineHeight: 30 }, nav: { borderTopColor: colors.line, borderTopWidth: 1, backgroundColor: colors.blackDeep, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 6, paddingVertical: 14 }, navText: { color: colors.muted, fontSize: 10, fontWeight: '700' } });
