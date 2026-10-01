import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { RoleGate } from '../../components/RoleGate';
import { RoleNav, RoleScreen, roleStyles as s } from '../../components/RoleScreen';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { colors } from '../../constants/theme';
import { roleRepository } from '../../services/roleRepository';

const distribution: Array<[string, `${number}%`]> = [['General Gym', '44%'], ['Gym + PT', '31%'], ['Cardio', '15%'], ['Gym + Cardio', '10%']];

export default function AdminHome() { return <RoleGate role="admin"><AdminDashboard /></RoleGate>; }
function AdminDashboard() {
  const { data: metrics } = useQuery({ queryKey: ['admin', 'metrics'], queryFn: roleRepository.getAdminMetrics });
  const { data: activities } = useQuery({ queryKey: ['admin', 'activity'], queryFn: roleRepository.getAdminActivities });
  return <RoleScreen title="Business Overview" eyebrow="GOLD ARMY · SANGAMNER">
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{metrics?.map((metric) => <Card key={metric.label} style={{ width: '47%', padding: 14 }}><Text style={{ color: colors.muted, fontSize: 10, fontWeight: '700' }}>{metric.label}</Text><Text style={{ color: metric.tone === 'red' ? colors.redBright : metric.tone === 'amber' ? colors.amber : metric.tone === 'green' ? '#5FD39E' : colors.white, fontSize: 20, fontWeight: '800', marginTop: 7 }}>{metric.value}</Text></Card>)}</View>
    <Card style={{ marginTop: 14 }}><View style={s.row}><Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>Revenue trend</Text><Badge label="+12% vs yesterday" /></View><View style={{ height: 90, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 }}>{[42, 55, 48, 70, 62, 85, 66].map((height, index) => <View key={index} style={{ flex: 1, height, backgroundColor: colors.red, borderRadius: 5 }} />)}</View><Text style={s.muted}>Mon · Tue · Wed · Thu · Fri · Sat · Sun</Text></Card>
    <Card><Text style={s.heading}>Service distribution</Text>{distribution.map(([label, value]) => <View key={label} style={{ marginBottom: 10 }}><View style={s.row}><Text style={s.muted}>{label}</Text><Text style={s.muted}>{value}</Text></View><View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 99, marginTop: 5 }}><View style={{ width: value, height: '100%', backgroundColor: colors.goldSoft, borderRadius: 99 }} /></View></View>)}</Card>
    <Card><Text style={s.heading}>Recent activity</Text>{activities?.map((activity) => <View key={activity.text} style={[s.row, { marginBottom: 10 }]}><Text style={{ color: colors.white, flex: 1, fontSize: 12 }}>{activity.text}</Text><Text style={s.muted}>{activity.time}</Text></View>)}</Card>
    <PrimaryButton label="Open member management" onPress={() => router.push('/admin/members')} />
    <RoleNav items={[{ label: 'Home', route: '/admin' }, { label: 'Members', route: '/admin/members' }, { label: 'Attendance', route: '/admin/attendance' }, { label: 'Payments', route: '/admin/payments' }, { label: 'More', route: '/admin/more' }]} />
  </RoleScreen>;
}
