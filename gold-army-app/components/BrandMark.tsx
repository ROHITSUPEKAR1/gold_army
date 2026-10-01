import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, compact && styles.markCompact]}><Text style={styles.star}>✦</Text></View>
      {!compact && <View><Text style={styles.name}>GOLD ARMY</Text><Text style={styles.sub}>FITNESS CLUB</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  markCompact: { width: 38, height: 38, borderRadius: 9 },
  star: { color: colors.gold, fontSize: 28, lineHeight: 30 },
  name: { color: colors.white, fontFamily: fonts.display, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  sub: { color: colors.goldSoft, fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginTop: 2 },
});
