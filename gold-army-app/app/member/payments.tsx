import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { Badge, Card } from '../../components/ui';
import { MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors } from '../../constants/theme';
import { memberRepository } from '../../services/memberRepository';

export default function Payments() { const { data } = useQuery({ queryKey: ['member', 'payments'], queryFn: memberRepository.getPayments }); return <MemberScreen title="Payment History">{data?.map((payment) => <Card key={payment.id} style={{ marginBottom: 10 }}><View style={s.row}><View><Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>{payment.plan}</Text><Text style={s.muted}>{payment.date} · {payment.reference}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: colors.white, fontWeight: '800' }}>₹{payment.amount.toLocaleString('en-IN')}</Text><Badge label={payment.status} tone={payment.status === 'SUCCESSFUL' ? 'green' : payment.status === 'PENDING' ? 'amber' : 'red'} /></View></View></Card>)}</MemberScreen>; }
