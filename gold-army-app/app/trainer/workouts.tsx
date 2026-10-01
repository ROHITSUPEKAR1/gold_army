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
import { RoleNav, RoleScreen, roleStyles as s } from '../../components/RoleScreen';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  useAssignWorkout,
  useCreateWorkout,
  useExercises,
  useWorkouts,
} from '../../hooks/useWorkouts';

export default function TrainerWorkouts() {
  const [workoutName, setWorkoutName] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [notes, setNotes] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [assignModalWorkout, setAssignModalWorkout] = useState<string | null>(null);
  const [targetMemberId, setTargetMemberId] = useState('');

  const { data: workouts = [], isLoading: isWorkoutsLoading } = useWorkouts();
  const { data: exercises = [], isLoading: isExercisesLoading } = useExercises();

  const createWorkoutMutation = useCreateWorkout();
  const assignWorkoutMutation = useAssignWorkout();

  const toggleExerciseSelection = (id: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Missing Field', 'Please enter a workout name.');
      return;
    }

    try {
      await createWorkoutMutation.mutateAsync({
        name: workoutName.trim(),
        goal,
        notes: notes.trim() || undefined,
        durationMin: 45,
        calories: 380,
        exercises: selectedExerciseIds.map((exerciseId, index) => ({
          exerciseId,
          order: index + 1,
          sets: 3,
          reps: 10,
          weight: 'Moderate',
          restSec: 60,
        })),
      });

      setWorkoutName('');
      setNotes('');
      setSelectedExerciseIds([]);
      Alert.alert('Success', 'Workout template created successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create workout.';
      Alert.alert('Error', message);
    }
  };

  const handleAssignToMember = async () => {
    if (!assignModalWorkout || !targetMemberId.trim()) {
      Alert.alert('Missing Member ID', 'Please specify the Member ID.');
      return;
    }

    try {
      await assignWorkoutMutation.mutateAsync({
        workoutId: assignModalWorkout,
        memberId: targetMemberId.trim(),
      });
      setAssignModalWorkout(null);
      setTargetMemberId('');
      Alert.alert('Success', 'Workout assigned to member successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign workout.';
      Alert.alert('Error', message);
    }
  };

  return (
    <RoleGate role="trainer">
      <RoleScreen title="Workout Management" eyebrow="TRAINER · WORKOUTS">
        {/* Workout Creation Card */}
        <Card>
          <Text style={s.heading}>Create Workout Template</Text>

          <TextInput
            style={s.input}
            placeholder="Workout name (e.g., Heavy Leg Day)"
            placeholderTextColor={colors.muted}
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="Goal: Muscle Gain, Strength, HIIT, Fat Loss"
            placeholderTextColor={colors.muted}
            value={goal}
            onChangeText={setGoal}
          />

          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="Trainer coaching notes (optional)"
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Exercise Selector Chips */}
          <Text style={[s.muted, { marginTop: 12, fontWeight: '700' }]}>
            Select Exercises ({selectedExerciseIds.length} chosen):
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exerciseChipsScroll}
          >
            {exercises.map((ex) => {
              const isSelected = selectedExerciseIds.includes(ex.id);
              return (
                <Pressable
                  key={ex.id}
                  onPress={() => toggleExerciseSelection(ex.id)}
                  style={[
                    styles.exerciseChip,
                    isSelected && styles.exerciseChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      isSelected && styles.exerciseChipTextSelected,
                    ]}
                  >
                    {isSelected ? `✓ ${ex.name}` : `+ ${ex.name}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              label="SAVE WORKOUT TEMPLATE"
              loading={createWorkoutMutation.isPending}
              onPress={handleCreateWorkout}
            />
          </View>
        </Card>

        {/* Existing Workouts List */}
        <Text style={[s.heading, { marginTop: 22 }]}>Available Templates</Text>

        {isWorkoutsLoading ? (
          <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginVertical: 20 }} />
        ) : workouts.length === 0 ? (
          <Card>
            <Text style={s.muted}>No workout templates found. Create one above.</Text>
          </Card>
        ) : (
          workouts.map((workout) => (
            <Card key={workout.id} style={{ marginBottom: 10 }}>
              <View style={s.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={s.muted}>
                    {workout.exercises.length} exercises · {workout.durationMin ?? 45} min · ~
                    {workout.calories ?? 380} kcal
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Badge label={workout.goal} tone="gold" />
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <PrimaryButton
                    label="Assign"
                    onPress={() => setAssignModalWorkout(workout.id)}
                  />
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Assignment Modal */}
        <Modal visible={Boolean(assignModalWorkout)} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeading}>Assign Workout to Member</Text>
              <Text style={s.muted}>
                Enter the Member ID or select the assigned client below.
              </Text>

              <TextInput
                style={[s.input, { marginTop: 14, width: '100%' }]}
                placeholder="Enter Member ID"
                placeholderTextColor={colors.muted}
                value={targetMemberId}
                onChangeText={setTargetMemberId}
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  label="ASSIGN WORKOUT"
                  loading={assignWorkoutMutation.isPending}
                  onPress={handleAssignToMember}
                />
                <Pressable
                  onPress={() => setAssignModalWorkout(null)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
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
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  exerciseChipsScroll: {
    gap: 8,
    paddingVertical: 10,
  },
  exerciseChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
  },
  exerciseChipSelected: {
    backgroundColor: colors.red,
    borderColor: colors.redBright,
  },
  exerciseChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseChipTextSelected: {
    color: colors.white,
  },
  workoutName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalHeading: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalActions: {
    marginTop: 18,
    gap: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
