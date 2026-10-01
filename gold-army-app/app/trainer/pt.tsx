import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RoleGate } from '../../components/RoleGate';
import { RoleNav, RoleScreen, StatusBadge, roleStyles as s } from '../../components/RoleScreen';
import { Card, PrimaryButton } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  useCancelPTSession,
  useCompletePTSession,
  usePTSessions,
  type PTSessionItem,
} from '../../hooks/usePT';

export default function TrainerPT() {
  return (
    <RoleGate role="trainer">
      <PTContent />
    </RoleGate>
  );
}

function PTContent() {
  const { data: sessions = [], isLoading, refetch, isRefetching } = usePTSessions();
  const completeMutation = useCompletePTSession();
  const cancelMutation = useCancelPTSession();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'ALL'>('UPCOMING');

  // Complete Session Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  const filteredSessions = sessions.filter((session) => {
    if (activeTab === 'ALL') return true;
    return session.status === activeTab;
  });

  const upcomingCount = sessions.filter((s) => s.status === 'UPCOMING').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;

  const handleOpenCompleteModal = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSessionNotes('');
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedSessionId) return;

    try {
      await completeMutation.mutateAsync({
        sessionId: selectedSessionId,
        notes: sessionNotes.trim() || undefined,
      });
      setIsCompleteModalOpen(false);
      setSelectedSessionId(null);
      Alert.alert('Session Completed', 'PT session marked as completed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete session.';
      Alert.alert('Error', msg);
    }
  };

  const handleCancelSession = (session: PTSessionItem) => {
    Alert.alert(
      'Cancel Session',
      `Cancel session for member ${session.member?.user.name ?? 'Member'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(session.id);
              Alert.alert('Session Cancelled', 'Session marked as cancelled.');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to cancel session.';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  return (
    <RoleScreen title="PT Sessions" eyebrow="TRAINER · PERSONAL TRAINING">
      {/* 1. Metric Header Cards */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>UPCOMING</Text>
          <Text style={styles.metricValue}>{upcomingCount}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>COMPLETED</Text>
          <Text style={[styles.metricValue, { color: colors.goldSoft }]}>{completedCount}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL</Text>
          <Text style={styles.metricValue}>{sessions.length}</Text>
        </Card>
      </View>

      {/* 2. Filter Tabs */}
      <View style={styles.tabRow}>
        {(['UPCOMING', 'COMPLETED', 'ALL'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 3. Session List */}
      {isLoading ? (
        <ActivityIndicator color={colors.goldSoft} style={{ marginVertical: 20 }} />
      ) : filteredSessions.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>
            No {activeTab.toLowerCase()} sessions found
          </Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 4 }]}>
            {activeTab === 'UPCOMING'
              ? 'You have no scheduled 1-on-1 sessions at the moment.'
              : 'No sessions match this filter.'}
          </Text>
        </Card>
      ) : (
        filteredSessions.map((session) => {
          const startDate = new Date(session.startsAt);
          const dateStr = startDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const timeStr = startDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>
                    {session.member?.user.name ?? 'Assigned Member'}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {dateStr} · {timeStr}
                  </Text>
                  {session.member?.user.phone && (
                    <Text style={s.muted}>Phone: {session.member.user.phone}</Text>
                  )}
                  {session.notes && (
                    <Text style={[s.muted, { color: colors.goldSoft, marginTop: 4 }]}>
                      Notes: {session.notes}
                    </Text>
                  )}
                </View>
                <StatusBadge label={session.status} />
              </View>

              {session.status === 'UPCOMING' && (
                <View style={styles.actionsRow}>
                  <PrimaryButton
                    label="Mark Complete"
                    onPress={() => handleOpenCompleteModal(session.id)}
                  />
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => handleCancelSession(session)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          );
        })
      )}

      {/* Completion Modal */}
      <Modal visible={isCompleteModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete PT Session</Text>
            <Text style={s.muted}>
              Add workout notes, reps achieved, or focus points for the member.
            </Text>

            <Text style={[styles.inputHeading, { marginTop: 12 }]}>Session Notes (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Heavy bench press form check, completed 5x5 squats"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              value={sessionNotes}
              onChangeText={setSessionNotes}
            />

            <View style={styles.modalActions}>
              <PrimaryButton
                label="CONFIRM COMPLETION"
                loading={completeMutation.isPending}
                onPress={handleConfirmComplete}
              />
              <Pressable
                onPress={() => setIsCompleteModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RoleNav
        items={[
          { label: 'Home', route: '/trainer' },
          { label: 'Members', route: '/trainer/members' },
          { label: 'Workouts', route: '/trainer/workouts' },
          { label: 'PT', route: '/trainer/pt' },
          { label: 'Profile', route: '/trainer/profile' },
        ]}
      />
    </RoleScreen>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderColor: colors.goldSoft,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  tabButtonText: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: colors.goldSoft,
    fontWeight: '800',
  },
  sessionCard: {
    marginBottom: spacing.sm,
  },
  memberName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  sessionTime: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputHeading: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    minHeight: 64,
  },
  modalActions: {
    marginTop: 16,
    gap: 8,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCancelBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
