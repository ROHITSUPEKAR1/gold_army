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
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  useBookPTSession,
  useCancelPTSession,
  usePTSessions,
  useTrainers,
  type PTSessionItem,
  type TrainerProfile,
} from '../../hooks/usePT';

export default function MemberPTScreen() {
  const { data: sessions = [], isLoading: isSessionsLoading, refetch, isRefetching } = usePTSessions();
  const { data: trainers = [], isLoading: isTrainersLoading } = useTrainers();

  const bookMutation = useBookPTSession();
  const cancelMutation = useCancelPTSession();

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [selectedDaysOffset, setSelectedDaysOffset] = useState<number>(1); // Tomorrow by default
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('07:00 AM');
  const [bookingNotes, setBookingNotes] = useState<string>('');

  const upcomingSessions = sessions.filter((s) => s.status === 'UPCOMING');
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED');

  const timeSlots = [
    '06:30 AM',
    '07:30 AM',
    '08:30 AM',
    '09:30 AM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
  ];

  const handleOpenBooking = (trainerId?: string) => {
    if (trainerId) {
      setSelectedTrainerId(trainerId);
    } else if (trainers.length > 0) {
      setSelectedTrainerId(trainers[0].id);
    }
    setIsBookModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTrainerId) {
      Alert.alert('Selection Required', 'Please select a personal trainer.');
      return;
    }

    try {
      // Calculate session target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + selectedDaysOffset);

      // Parse time slot
      const [time, period] = selectedTimeSlot.split(' ');
      const [hourStr, minStr] = time.split(':');
      let hours = parseInt(hourStr, 10);
      const minutes = parseInt(minStr, 10);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      targetDate.setHours(hours, minutes, 0, 0);

      await bookMutation.mutateAsync({
        trainerId: selectedTrainerId,
        startsAt: targetDate.toISOString(),
        notes: bookingNotes.trim() || undefined,
      });

      setIsBookModalOpen(false);
      setBookingNotes('');
      Alert.alert('Session Confirmed', 'Your 1-on-1 PT session has been scheduled.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book session.';
      Alert.alert('Booking Error', msg);
    }
  };

  const handleCancelSession = (session: PTSessionItem) => {
    Alert.alert(
      'Cancel PT Session',
      `Are you sure you want to cancel your session with ${
        session.trainer?.user.name ?? 'your trainer'
      }?`,
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(session.id);
              Alert.alert('Session Cancelled', 'Your session has been cancelled.');
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
    <MemberScreen title="Personal Training">
      {/* 1. Header Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={s.row}>
          <View>
            <Text style={styles.eyebrow}>1-ON-1 COACHING</Text>
            <Text style={styles.summaryTitle}>Personal Training</Text>
          </View>
          <Badge label="ACTIVE" tone="gold" />
        </View>
        <Text style={[s.muted, { marginTop: 6 }]}>
          Book 1-on-1 sessions with certified elite trainers for form correction, customized
          programming, and strength progression.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{upcomingSessions.length}</Text>
            <Text style={styles.statLabel}>UPCOMING</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedSessions.length}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{trainers.length}</Text>
            <Text style={styles.statLabel}>TRAINERS</Text>
          </View>
        </View>

        <PrimaryButton
          label="BOOK 1-ON-1 SESSION"
          onPress={() => handleOpenBooking()}
          loading={isTrainersLoading}
        />
      </Card>

      {/* 2. Available Trainers Roster */}
      <View style={s.section}>
        <Text style={s.heading}>Certified Trainers</Text>
        {isTrainersLoading ? (
          <ActivityIndicator color={colors.goldSoft} style={{ marginVertical: 14 }} />
        ) : trainers.length === 0 ? (
          <Card>
            <Text style={s.muted}>No trainers currently active.</Text>
          </Card>
        ) : (
          trainers.map((trainer: TrainerProfile) => (
            <Card key={trainer.id} style={styles.trainerCard}>
              <View style={s.row}>
                <View style={styles.trainerAvatar}>
                  <Text style={styles.avatarText}>
                    {trainer.user.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.trainerName}>{trainer.user.name}</Text>
                  <Text style={styles.trainerSpec}>
                    {trainer.specialization ?? 'Strength & Conditioning Specialist'}
                  </Text>
                  <Text style={s.muted}>
                    {trainer.experienceYears ?? 4}+ years experience · {trainer._count?.ptSessions ?? 0}{' '}
                    sessions
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  label="Book with Trainer"
                  onPress={() => handleOpenBooking(trainer.id)}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* 3. Upcoming Booked Sessions */}
      <View style={s.section}>
        <View style={s.row}>
          <Text style={s.heading}>Upcoming Sessions</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={{ color: colors.goldSoft, fontSize: 12, fontWeight: '700' }}>
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>

        {isSessionsLoading ? (
          <ActivityIndicator color={colors.goldSoft} style={{ marginVertical: 14 }} />
        ) : upcomingSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Upcoming Sessions</Text>
            <Text style={[s.muted, { textAlign: 'center', marginTop: 4 }]}>
              You have no active 1-on-1 PT sessions scheduled. Tap "Book 1-on-1 Session" to reserve
              a slot with your coach.
            </Text>
          </Card>
        ) : (
          upcomingSessions.map((session) => {
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
                  <View>
                    <Text style={styles.sessionDate}>
                      {dateStr} · {timeStr}
                    </Text>
                    <Text style={styles.sessionTrainer}>
                      Coach: {session.trainer?.user.name ?? 'Assigned Trainer'}
                    </Text>
                    {session.notes && (
                      <Text style={[s.muted, { marginTop: 4 }]}>Goal: {session.notes}</Text>
                    )}
                  </View>
                  <Badge label="SCHEDULED" tone="gold" />
                </View>

                <View style={styles.sessionActions}>
                  <Pressable
                    style={styles.cancelSessionBtn}
                    onPress={() => handleCancelSession(session)}
                    disabled={cancelMutation.isPending}
                  >
                    <Text style={styles.cancelSessionBtnText}>Cancel Booking</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* 4. Session History */}
      {completedSessions.length > 0 && (
        <View style={s.section}>
          <Text style={s.heading}>Completed Sessions ({completedSessions.length})</Text>
          {completedSessions.map((session) => {
            const dateStr = new Date(session.startsAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            return (
              <Card key={session.id} style={styles.historyCard}>
                <View style={s.row}>
                  <View>
                    <Text style={styles.historyDate}>{dateStr}</Text>
                    <Text style={s.muted}>Coach: {session.trainer?.user.name}</Text>
                    {session.notes && (
                      <Text style={[s.muted, { color: colors.goldSoft, marginTop: 4 }]}>
                        Notes: {session.notes}
                      </Text>
                    )}
                  </View>
                  <Badge label="COMPLETED" tone="green" />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Booking Modal */}
      <Modal visible={isBookModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Book 1-on-1 PT Session</Text>
              <Text style={s.muted}>
                Reserve a personalized coaching slot with your trainer.
              </Text>

              {/* Select Trainer */}
              <Text style={[styles.inputHeading, { marginTop: 14 }]}>Select Coach *</Text>
              <View style={styles.optionsWrap}>
                {trainers.map((tr) => (
                  <Pressable
                    key={tr.id}
                    style={[
                      styles.choiceChip,
                      selectedTrainerId === tr.id && styles.choiceChipActive,
                    ]}
                    onPress={() => setSelectedTrainerId(tr.id)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selectedTrainerId === tr.id && styles.choiceChipTextActive,
                      ]}
                    >
                      {tr.user.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Select Day */}
              <Text style={styles.inputHeading}>Select Day *</Text>
              <View style={styles.optionsWrap}>
                {[
                  { label: 'Today', offset: 0 },
                  { label: 'Tomorrow', offset: 1 },
                  { label: 'In 2 Days', offset: 2 },
                  { label: 'In 3 Days', offset: 3 },
                ].map((item) => (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.choiceChip,
                      selectedDaysOffset === item.offset && styles.choiceChipActive,
                    ]}
                    onPress={() => setSelectedDaysOffset(item.offset)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selectedDaysOffset === item.offset && styles.choiceChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Select Time Slot */}
              <Text style={styles.inputHeading}>Select Time Slot *</Text>
              <View style={styles.optionsWrap}>
                {timeSlots.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[
                      styles.choiceChip,
                      selectedTimeSlot === slot && styles.choiceChipActive,
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selectedTimeSlot === slot && styles.choiceChipTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.inputHeading}>Session Focus / Goals (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Form check for heavy squats, deadlift setup"
                placeholderTextColor={colors.muted}
                value={bookingNotes}
                onChangeText={setBookingNotes}
              />

              <View style={styles.modalActionButtons}>
                <PrimaryButton
                  label="CONFIRM BOOKING"
                  loading={bookMutation.isPending}
                  onPress={handleConfirmBooking}
                />
                <Pressable
                  onPress={() => setIsBookModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <MemberNav />
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderColor: colors.goldSoft,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.goldSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  trainerCard: {
    marginBottom: spacing.sm,
  },
  trainerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  avatarText: {
    color: colors.goldSoft,
    fontWeight: '800',
    fontSize: 14,
  },
  trainerName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  trainerSpec: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: '600',
    marginVertical: 2,
  },
  sessionCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.goldSoft,
  },
  sessionDate: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionTrainer: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 2,
  },
  sessionActions: {
    marginTop: spacing.md,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
  },
  cancelSessionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  cancelSessionBtnText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '700',
  },
  historyCard: {
    marginBottom: spacing.xs,
  },
  historyDate: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginTop: 12,
    marginBottom: 6,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  choiceChipActive: {
    borderColor: colors.goldSoft,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  choiceChipText: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: colors.goldSoft,
    fontWeight: '700',
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
  },
  modalActionButtons: {
    marginTop: 18,
    gap: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
