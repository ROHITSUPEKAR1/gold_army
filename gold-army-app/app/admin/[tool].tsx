import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { RoleGate } from '../../components/RoleGate';
import { RoleNav, RoleScreen, StatusBadge, roleStyles as s } from '../../components/RoleScreen';
import { Card, PrimaryButton } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useDietPlans } from '../../hooks/useDiet';
import { roleRepository } from '../../services/roleRepository';

const titles: Record<string, string> = { plans: 'Services & Plans', subscriptions: 'Subscriptions', expiry: 'Expiry Management', pt: 'PT Management', workouts: 'Workout Library', diets: 'Diet Plans', notifications: 'New Notification', reports: 'Reports', offers: 'Offers', settings: 'Settings' };

export default function AdminTool() { return <RoleGate role="admin"><Tool /></RoleGate>; }
function Tool() {
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const title = titles[tool ?? ''] ?? 'Admin Tools';
  const { data: members } = useQuery({ queryKey: ['admin', 'members'], queryFn: roleRepository.getAdminMembers });
  const { data: plans } = useQuery({ queryKey: ['admin', 'plans'], queryFn: roleRepository.getAdminPlans });
  const { data: dietPlans = [] } = useDietPlans();
  const expiry = members?.filter((item) => item.status === 'EXPIRING SOON' || item.status === 'EXPIRED' || item.status === 'PAYMENT PENDING');
  return <RoleScreen title={title} eyebrow={`ADMIN · ${title.toUpperCase()}`}>
    {tool === 'expiry' ? <><View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}><StatusBadge label="TODAY 6" /><StatusBadge label="3 DAYS 18" /><StatusBadge label="EXPIRED 61" /></View>{expiry?.map((member) => <Card key={member.id} style={s.card}><View style={s.row}><View><Text style={{ color: colors.white, fontWeight: '700' }}>{member.name}</Text><Text style={s.muted}>{member.plan} · Exp {member.expiry}</Text><Text style={s.muted}>{member.phone} · {member.days} days</Text></View><StatusBadge label={member.status} /></View><View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><PrimaryButton label="Notify" onPress={() => undefined} /><PrimaryButton label="Renew" onPress={() => undefined} /></View></Card>)}</> : tool === 'plans' ? <>{plans?.map((plan) => <Card key={plan.id} style={s.card}><View style={s.row}><View><Text style={{ color: colors.white, fontWeight: '700' }}>{plan.name}</Text><Text style={s.muted}>{plan.service} · {plan.duration}</Text></View><Text style={{ color: colors.goldSoft, fontWeight: '800' }}>₹{plan.price.toLocaleString('en-IN')}</Text></View><Text style={[s.muted, { marginTop: 8 }]}>Included services · {plan.label ?? 'Standard'} · {plan.status}</Text></Card>)}<PrimaryButton label="Add service or plan" onPress={() => undefined} /></> : tool === 'diets' ? <>{dietPlans.map((dp) => <Card key={dp.id} style={s.card}><View style={s.row}><View><Text style={{ color: colors.white, fontWeight: '700' }}>{dp.name}</Text><Text style={s.muted}>{dp.calories} kcal · {dp.proteinG}g protein · ₹{dp.budget ?? 350}/day</Text></View><Text style={{ color: colors.goldSoft, fontWeight: '800' }}>{dp.goal}</Text></View><Text style={[s.muted, { marginTop: 8 }]}>{dp.dietType.replace('_', ' ')} · {dp.meals.length} meals</Text></Card>)}</> : tool === 'notifications' ? <Card><Text style={s.heading}>Notification composer</Text><TextInput style={s.input} placeholder="TITLE" placeholderTextColor={colors.muted} /><TextInput style={[s.input, { marginTop: 10, height: 90 }]} placeholder="MESSAGE" placeholderTextColor={colors.muted} multiline /><Text style={[s.muted, { marginTop: 12 }]}>Audience · All members · Expiring · Expired · Specific plan</Text><PrimaryButton label="Send notification" onPress={() => undefined} /></Card> : <Card><Text style={s.heading}>{title}</Text><Text style={s.muted}>Mobile workflow for {title.toLowerCase()} with compact cards, filters, and action controls.</Text><PrimaryButton label={tool === 'reports' ? 'Export PDF' : 'Create new'} onPress={() => undefined} /><PrimaryButton label={tool === 'reports' ? 'Export Excel' : 'Manage records'} onPress={() => undefined} /></Card>}
    <RoleNav items={[{ label: 'Home', route: '/admin' }, { label: 'Members', route: '/admin/members' }, { label: 'Attendance', route: '/admin/attendance' }, { label: 'Payments', route: '/admin/payments' }, { label: 'More', route: '/admin/more' }]} />
  </RoleScreen>;
}
