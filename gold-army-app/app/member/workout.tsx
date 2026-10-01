import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  useCompleteWorkout,
  useExercises,
  useMemberWorkouts,
  type BackendWorkoutExercise,
} from '../../hooks/useWorkouts';

const GOALS = [
  'ALL',
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Biceps',
  'Triceps',
  'Core',
  'Cardio',
] as const;

export default function WorkoutScreen() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('ALL');
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

  const {
    data: memberWorkouts = [],
    isLoading: isWorkoutsLoading,
    refetch: refetchWorkouts,
    isRefetching: isWorkoutsRefetching,
  } = useMemberWorkouts();

  const {
    data: allExercises = [],
    isLoading: isExercisesLoading,
    refetch: refetchExercises,
    isRefetching: isExercisesRefetching,
  } = useExercises();

  const completeWorkoutMutation = useCompleteWorkout();

  const activeAssignment = memberWorkouts[0];
  const activeWorkout = activeAssignment?.workout;

  const exercisesList: BackendWorkoutExercise[] = activeWorkout?.exercises ?? [];

  const totalExercises = exercisesList.length;
  const completedCount = completedExerciseIds.size;
  const completionPercentage = totalExercises > 0
    ? Math.round((completedCount / totalExercises) * 100)
    : activeAssignment?.completedAt
    ? 100
    : 0;

  const isFullyCompleted = completionPercentage === 100 || Boolean(activeAssignment?.completedAt);

  const toggleExerciseComplete = (exerciseId: string) => {
    setCompletedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;
    try {
      await completeWorkoutMutation.mutateAsync(activeWorkout.id);
    } catch {
      // Handled silently or state refreshed
    }
  };

  // Filter exercise catalog
  const filteredCatalog = selectedMuscle === 'ALL'
    ? allExercises
    : allExercises.filter(
        (ex) => ex.targetMuscle.toLowerCase() === selectedMuscle.toLowerCase()
      );

  const isLoading = isWorkoutsLoading || isExercisesLoading;
  const isRefreshing = isWorkoutsRefetching || isExercisesRefetching;

  const onRefresh = () => {
    void refetchWorkouts();
    void refetchExercises();
  };

  return (
    <MemberScreen title="Workout">
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.goldSoft} />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading your workouts...</Text>
        </View>
      ) : (
        <>
          {/* Today's Assigned Routine */}
          {activeWorkout ? (
            <Card style={styles.heroCard}>
              <View style={s.row}>
                <Badge label={activeWorkout.goal.toUpperCase()} tone="gold" />
                <Text style={styles.percentageText}>
                  {completionPercentage}% complete
                </Text>
              </View>

              <Text style={styles.workoutTitle}>{activeWorkout.name}</Text>

              {activeWorkout.notes && (
                <Text style={styles.trainerNotesText}>
                  "{activeWorkout.notes}"
                </Text>
              )}

              <Text style={styles.workoutMeta}>
                {totalExercises} exercises · {activeWorkout.durationMin ?? 45} min · ~
                {activeWorkout.calories ?? 380} kcal
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(5, completionPercentage)}%` },
                  ]}
                />
              </View>

              {isFullyCompleted ? (
                <View style={styles.completedBadgeRow}>
                  <Badge label="✓ WORKOUT COMPLETED TODAY" tone="green" />
                </View>
              ) : (
                completedCount > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <PrimaryButton
                      label="FINISH WORKOUT"
                      loading={completeWorkoutMutation.isPending}
                      onPress={handleFinishWorkout}
                    />
                  </View>
                )
              )}
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyHeading}>No Workout Assigned Yet</Text>
              <Text style={styles.emptyText}>
                Your dedicated trainer will assign a personalized workout routine tailored to your fitness goals.
              </Text>
            </Card>
          )}

          {/* Assigned Exercises Section */}
          {exercisesList.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={s.row}>
                <Text style={s.heading}>Assigned Exercises</Text>
                <Text style={s.muted}>Tap circle to mark done</Text>
              </View>

              {exercisesList.map((item) => {
                const isDone = completedExerciseIds.has(item.exerciseId) || Boolean(activeAssignment?.completedAt);
                return (
                  <Card key={item.exerciseId} style={styles.exerciseCard}>
                    <View style={s.row}>
                      {/* Completion checkbox button */}
                      <Pressable
                        onPress={() => toggleExerciseComplete(item.exerciseId)}
                        style={[
                          styles.checkbox,
                          isDone && styles.checkboxDone,
                        ]}
                      >
                        {isDone && <Text style={styles.checkmarkText}>✓</Text>}
                      </Pressable>

                      {/* Title & Set Info */}
                      <Pressable
                        onPress={() => router.push(`/member/exercise/${item.exerciseId}`)}
                        style={{ flex: 1, marginHorizontal: 12 }}
                      >
                        <Text
                          style={[
                            styles.exerciseName,
                            isDone && styles.exerciseNameDone,
                          ]}
                        >
                          {item.exercise?.name || 'Exercise'}
                        </Text>
                        <Text style={s.muted}>
                          {item.sets} sets × {item.reps} reps
                          {item.weight ? ` · ${item.weight}` : ''}
                          {item.restSec ? ` · ${item.restSec}s rest` : ''}
                        </Text>
                        {item.trainerNotes && (
                          <Text style={styles.itemNote}>
                            Tip: {item.trainerNotes}
                          </Text>
                        )}
                      </Pressable>

                      {/* Navigation Arrow */}
                      <Pressable onPress={() => router.push(`/member/exercise/${item.exerciseId}`)}>
                        <Text style={styles.arrowIcon}>›</Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Exercise Library & Muscle Filters */}
          <View style={{ marginTop: 24 }}>
            <Text style={s.heading}>Exercise Library & Form Guide</Text>

            {/* Muscle Group Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {GOALS.map((muscle) => {
                const isSelected = selectedMuscle === muscle;
                return (
                  <Pressable
                    key={muscle}
                    onPress={() => setSelectedMuscle(muscle)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isSelected && styles.filterTextActive,
                      ]}
                    >
                      {muscle}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Filtered Exercise Cards */}
            {filteredCatalog.length === 0 ? (
              <Card style={{ marginTop: 12 }}>
                <Text style={s.muted}>No exercises found for this muscle group.</Text>
              </Card>
            ) : (
              filteredCatalog.map((ex) => (
                <Card key={ex.id} style={styles.catalogCard}>
                  <View style={s.row}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.catalogTitle}>{ex.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <Text style={styles.muscleBadge}>{ex.targetMuscle}</Text>
                        <Text style={styles.difficultyBadge}>• {ex.difficulty}</Text>
                      </View>
                    </View>
                    <PrimaryButton
                      label="View"
                      onPress={() => router.push(`/member/exercise/${ex.id}`)}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        </>
      )}

      <MemberNav />
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#24100F',
    borderColor: '#4A1D1A',
    borderWidth: 1,
  },
  percentageText: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  workoutTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  trainerNotesText: {
    color: colors.text2,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  workoutMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.red,
    borderRadius: 3,
  },
  completedBadgeRow: {
    marginTop: 14,
    alignItems: 'flex-start',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyHeading: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  exerciseCard: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkmarkText: {
    color: colors.blackDeep,
    fontSize: 14,
    fontWeight: '900',
  },
  exerciseName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseNameDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  itemNote: {
    color: colors.goldSoft,
    fontSize: 11,
    marginTop: 3,
  },
  arrowIcon: {
    color: colors.redBright,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  catalogCard: {
    marginBottom: 8,
    paddingVertical: 12,
  },
  catalogTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  muscleBadge: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  difficultyBadge: {
    color: colors.text2,
    fontSize: 11,
  },
});
