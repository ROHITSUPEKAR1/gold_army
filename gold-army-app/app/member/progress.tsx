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
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAttendanceStats } from '../../hooks/useAttendance';
import { useMemberProfile } from '../../hooks/useMember';
import {
  useCreateProgress,
  useMemberProgress,
  type BackendProgressEntry,
  type PersonalRecordItem,
} from '../../hooks/useProgress';

export default function ProgressScreen() {
  const { data: profile } = useMemberProfile();
  const { data: attendanceStats } = useAttendanceStats();
  const { data: progressHistory = [], isLoading, refetch, isRefetching } = useMemberProgress();

  const createProgressMutation = useCreateProgress();

  // Progress Logging Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [armsInput, setArmsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // PR Logging Modal State
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prExerciseName, setPrExerciseName] = useState('Barbell Bench Press');
  const [prWeightInput, setPrWeightInput] = useState('');
  const [prRepsInput, setPrRepsInput] = useState('');
  const [prNotesInput, setPrNotesInput] = useState('');

  // Current vs Baseline Stats Calculation
  const latestEntry = progressHistory[0];
  const oldestEntry = progressHistory[progressHistory.length - 1];

  const currentWeight = Number(latestEntry?.weightKg ?? profile?.weightKg ?? 78);
  const startWeight = Number(oldestEntry?.weightKg ?? currentWeight);
  const weightDiff = +(currentWeight - startWeight).toFixed(1);

  const currentBodyFat = Number(latestEntry?.bodyFat ?? 18);
  const measurements = latestEntry?.measurements ?? {};

  // Aggregate All Personal Records across entries
  const aggregatedPRs: Record<string, PersonalRecordItem> = {};
  for (const entry of progressHistory) {
    if (entry.personalRecords) {
      for (const [key, pr] of Object.entries(entry.personalRecords)) {
        if (!aggregatedPRs[key] || pr.weightKg > aggregatedPRs[key].weightKg) {
          aggregatedPRs[key] = pr;
        }
      }
    }
  }

  const prList = Object.values(aggregatedPRs);

  const handleSaveProgress = async () => {
    const weightNum = parseFloat(weightInput);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight in kg.');
      return;
    }

    try {
      await createProgressMutation.mutateAsync({
        weightKg: weightNum,
        bodyFat: bodyFatInput ? parseFloat(bodyFatInput) : undefined,
        measurements: {
          chestIn: chestInput ? parseFloat(chestInput) : undefined,
          waistIn: waistInput ? parseFloat(waistInput) : undefined,
          armsIn: armsInput ? parseFloat(armsInput) : undefined,
        },
        notes: notesInput.trim() || undefined,
      });

      setIsLogModalOpen(false);
      setWeightInput('');
      setBodyFatInput('');
      setChestInput('');
      setWaistInput('');
      setArmsInput('');
      setNotesInput('');
      Alert.alert('Success', 'Body progress entry recorded.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save progress.';
      Alert.alert('Error', message);
    }
  };

  const handleSavePR = async () => {
    const weightNum = parseFloat(prWeightInput);
    const repsNum = parseInt(prRepsInput, 10);

    if (!prExerciseName.trim()) {
      Alert.alert('Missing Field', 'Please specify an exercise name.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }
    if (isNaN(repsNum) || repsNum <= 0) {
      Alert.alert('Invalid Reps', 'Please enter number of reps completed.');
      return;
    }

    try {
      const newPRItem: PersonalRecordItem = {
        exerciseName: prExerciseName.trim(),
        weightKg: weightNum,
        reps: repsNum,
        date: new Date().toISOString().split('T')[0],
        notes: prNotesInput.trim() || undefined,
      };

      await createProgressMutation.mutateAsync({
        personalRecords: {
          [prExerciseName.trim()]: newPRItem,
        },
        notes: `New PR logged for ${prExerciseName.trim()}: ${weightNum}kg × ${repsNum}`,
      });

      setIsPrModalOpen(false);
      setPrWeightInput('');
      setPrRepsInput('');
      setPrNotesInput('');
      Alert.alert('Personal Record Saved! 🔥', `New record of ${weightNum}kg for ${prExerciseName}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save Personal Record.';
      Alert.alert('Error', message);
    }
  };

  return (
    <MemberScreen title="Fitness Progress">
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.goldSoft} />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading fitness metrics...</Text>
        </View>
      ) : (
        <>
          {/* Top Weight Trend & Bar Visualization Card */}
          <Card style={styles.heroCard}>
            <View style={s.row}>
              <Text style={s.heading}>Weight Trend</Text>
              <Badge
                label={weightDiff <= 0 ? `${weightDiff} kg` : `+${weightDiff} kg`}
                tone={weightDiff <= 0 ? 'green' : 'amber'}
              />
            </View>

            {/* Custom SVG-free Lightweight Mobile Bar Chart */}
            <View style={styles.chartContainer}>
              {progressHistory.length === 0 ? (
                <View style={styles.chartEmpty}>
                  <Text style={s.muted}>Log measurements to see your weight graph.</Text>
                </View>
              ) : (
                [...progressHistory].reverse().map((entry, idx) => {
                  const weightVal = Number(entry.weightKg ?? 75);
                  // Scale relative height between 40px and 110px
                  const barHeight = Math.max(35, Math.min(110, (weightVal / 100) * 110));
                  const isLatest = idx === progressHistory.length - 1;
                  const dateLabel = new Date(entry.measuredAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <View key={entry.id} style={styles.barColumn}>
                      <Text style={styles.barValue}>{weightVal}</Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: isLatest ? colors.goldSoft : colors.red,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>{dateLabel}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <Text style={[s.muted, { marginTop: 8, textAlign: 'center' }]}>
              {startWeight} kg → {currentWeight} kg over {progressHistory.length} recorded checkpoints
            </Text>

            <View style={styles.heroActionRow}>
              <PrimaryButton label="+ Log Body Metrics" onPress={() => setIsLogModalOpen(true)} />
            </View>
          </Card>

          {/* 4-Measurement Grid */}
          <View style={styles.metricGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>CHEST</Text>
              <Text style={styles.metricValue}>
                {measurements.chestIn ? `${measurements.chestIn} in` : '41.0 in'}
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>WAIST</Text>
              <Text style={styles.metricValue}>
                {measurements.waistIn ? `${measurements.waistIn} in` : '34.0 in'}
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>ARMS</Text>
              <Text style={styles.metricValue}>
                {measurements.armsIn ? `${measurements.armsIn} in` : '14.2 in'}
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>BODY FAT</Text>
              <Text style={styles.metricValue}>{currentBodyFat}%</Text>
            </Card>
          </View>

          {/* Personal Records (PR) Section */}
          <Card style={{ marginTop: 16 }}>
            <View style={s.row}>
              <View>
                <Text style={s.heading}>Personal Records (PR)</Text>
                <Text style={s.muted}>Your peak strength milestones</Text>
              </View>
              <Badge label="STRENGTH" tone="gold" />
            </View>

            {prList.length === 0 ? (
              <Text style={[s.muted, { marginVertical: 10 }]}>
                No personal records logged yet. Tap below to log your best lifts!
              </Text>
            ) : (
              prList.map((pr) => (
                <View key={pr.exerciseName} style={styles.prRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prExerciseName}>{pr.exerciseName}</Text>
                    <Text style={styles.prDate}>
                      {pr.date ? `Achieved ${pr.date}` : 'Verified'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.prWeightText}>
                      🔥 {pr.weightKg} kg × {pr.reps}
                    </Text>
                    {pr.notes && <Text style={styles.prNotesText}>{pr.notes}</Text>}
                  </View>
                </View>
              ))
            )}

            <View style={{ marginTop: 14 }}>
              <PrimaryButton label="+ Log Personal Record (PR)" onPress={() => setIsPrModalOpen(true)} />
            </View>
          </Card>

          {/* Consistency & Streak Overview */}
          <Card style={{ marginTop: 16 }}>
            <Text style={s.heading}>Discipline & Consistency</Text>
            <View style={styles.consistencyRow}>
              <Text style={styles.consistencyLabel}>Current Attendance Streak</Text>
              <Badge
                label={`🔥 ${attendanceStats?.currentStreak ?? 1} DAYS`}
                tone="gold"
              />
            </View>
            <View style={styles.consistencyRow}>
              <Text style={styles.consistencyLabel}>Monthly Consistency</Text>
              <Badge
                label={`${attendanceStats?.attendancePercentage ?? 86}%`}
                tone="green"
              />
            </View>
            <View style={styles.consistencyRow}>
              <Text style={styles.consistencyLabel}>Total Gym Visits</Text>
              <Text style={styles.consistencyValue}>
                {attendanceStats?.totalVisits ?? 14} sessions
              </Text>
            </View>
          </Card>

          {/* Modal 1: Log Body Metrics Form */}
          <Modal visible={isLogModalOpen} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Log Body Progress</Text>
                  <Text style={s.muted}>
                    Record your current weight and body tape measurements.
                  </Text>

                  <Text style={[styles.inputHeading, { marginTop: 14 }]}>Weight (kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 78.5"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={weightInput}
                    onChangeText={setWeightInput}
                  />

                  <Text style={styles.inputHeading}>Body Fat % (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 18.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={bodyFatInput}
                    onChangeText={setBodyFatInput}
                  />

                  <Text style={styles.inputHeading}>Chest Measurement (inches)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 41.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={chestInput}
                    onChangeText={setChestInput}
                  />

                  <Text style={styles.inputHeading}>Waist Measurement (inches)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 34.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={waistInput}
                    onChangeText={setWaistInput}
                  />

                  <Text style={styles.inputHeading}>Arms Measurement (inches)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 14.5"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={armsInput}
                    onChangeText={setArmsInput}
                  />

                  <Text style={styles.inputHeading}>Notes</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Felt strong, consistent diet this week"
                    placeholderTextColor={colors.muted}
                    value={notesInput}
                    onChangeText={setNotesInput}
                  />

                  <View style={styles.modalActionButtons}>
                    <PrimaryButton
                      label="SAVE PROGRESS"
                      loading={createProgressMutation.isPending}
                      onPress={handleSaveProgress}
                    />
                    <Pressable
                      onPress={() => setIsLogModalOpen(false)}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Modal>

          {/* Modal 2: Log Personal Record (PR) */}
          <Modal visible={isPrModalOpen} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Log Personal Record (PR)</Text>
                <Text style={s.muted}>
                  Record your heaviest lift for tracking strength progression.
                </Text>

                <Text style={[styles.inputHeading, { marginTop: 14 }]}>Exercise Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Barbell Bench Press, Deadlift"
                  placeholderTextColor={colors.muted}
                  value={prExerciseName}
                  onChangeText={setPrExerciseName}
                />

                <Text style={styles.inputHeading}>Weight (kg) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 100"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={prWeightInput}
                  onChangeText={setPrWeightInput}
                />

                <Text style={styles.inputHeading}>Reps Completed *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 5"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={prRepsInput}
                  onChangeText={setPrRepsInput}
                />

                <Text style={styles.inputHeading}>Notes (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Clean paused reps, beltless"
                  placeholderTextColor={colors.muted}
                  value={prNotesInput}
                  onChangeText={setPrNotesInput}
                />

                <View style={styles.modalActionButtons}>
                  <PrimaryButton
                    label="RECORD PR"
                    loading={createProgressMutation.isPending}
                    onPress={handleSavePR}
                  />
                  <Pressable
                    onPress={() => setIsPrModalOpen(false)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      <MemberNav />
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#1E100E',
    borderColor: '#4A1D1A',
    borderWidth: 1,
  },
  chartContainer: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingBottom: 4,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  chartEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  bar: {
    width: 28,
    borderRadius: 6,
  },
  barLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  heroActionRow: {
    marginTop: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    width: '47.5%',
    paddingVertical: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  prExerciseName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  prDate: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  prWeightText: {
    color: colors.goldSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  prNotesText: {
    color: colors.text2,
    fontSize: 11,
    marginTop: 2,
  },
  consistencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  consistencyLabel: {
    color: colors.text2,
    fontSize: 13,
  },
  consistencyValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
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
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
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
