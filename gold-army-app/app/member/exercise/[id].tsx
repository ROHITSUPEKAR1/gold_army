import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../../components/ui';
import { MemberScreen, memberStyles as s } from '../../../components/MemberScreen';
import { colors, radius, spacing } from '../../../constants/theme';
import { useExercise } from '../../../hooks/useWorkouts';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading, error } = useExercise(id);

  if (isLoading) {
    return (
      <MemberScreen title="Exercise Guide">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.goldSoft} />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading exercise details...</Text>
        </View>
      </MemberScreen>
    );
  }

  if (!exercise || error) {
    return (
      <MemberScreen title="Exercise Guide">
        <Card style={styles.errorCard}>
          <Text style={styles.errorHeading}>Exercise Not Found</Text>
          <Text style={s.muted}>The requested exercise could not be located in the catalog.</Text>
        </Card>
      </MemberScreen>
    );
  }

  const handleWatchVideo = () => {
    if (exercise.videoUrl) {
      void Linking.openURL(exercise.videoUrl).catch(() => undefined);
    }
  };

  return (
    <MemberScreen title={exercise.name}>
      {/* Video & Media Area */}
      <Card style={styles.videoCard}>
        <View style={styles.videoPlayCircle}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <Text style={styles.videoHeading}>EXERCISE DEMONSTRATION</Text>
        <Text style={styles.videoSubtitle}>
          {exercise.videoUrl ? 'HD Trainer Technique Video' : 'Form guide preview'}
        </Text>
      </Card>

      {/* Target & Difficulty Header Chips */}
      <View style={styles.chipsRow}>
        <Badge label={exercise.targetMuscle.toUpperCase()} tone="gold" />
        <Badge label={exercise.difficulty.toUpperCase()} tone="amber" />
        <Badge label="GOLD ARMY CERTIFIED" tone="green" />
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.metricGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>TARGET MUSCLE</Text>
          <Text style={styles.metricValue}>{exercise.targetMuscle}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>DIFFICULTY</Text>
          <Text style={styles.metricValue}>{exercise.difficulty}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>SETS / REPS</Text>
          <Text style={styles.metricValue}>3-4 Sets</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>RECOMMENDED REST</Text>
          <Text style={styles.metricValue}>60-90s</Text>
        </Card>
      </View>

      {/* Video Play Button */}
      {exercise.videoUrl && (
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="WATCH HD FORM TUTORIAL" onPress={handleWatchVideo} />
        </View>
      )}

      {/* Step-by-Step Instructions */}
      <Text style={[s.heading, { marginTop: 24 }]}>Step-by-Step Technique</Text>
      <Card>
        <Text style={styles.instructionsText}>
          {exercise.instructions ||
            'Perform with controlled tempo. Inhale on the eccentric phase and exhale during concentric contraction.'}
        </Text>
      </Card>

      {/* Trainer Coaching Tips */}
      <Text style={[s.heading, { marginTop: 20 }]}>Gold Army Coach Tip</Text>
      <Card style={styles.coachCard}>
        <Text style={styles.coachTip}>
          🔥 "Prioritize range of motion and mind-muscle connection over heavy weight. Track your reps each session to ensure progressive overload."
        </Text>
      </Card>
    </MemberScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  errorHeading: {
    color: colors.redBright,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  videoCard: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1210',
    borderColor: '#4A1D1A',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  videoPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playIcon: {
    color: colors.white,
    fontSize: 24,
    marginLeft: 4,
  },
  videoHeading: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  videoSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
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
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  instructionsText: {
    color: colors.text2,
    fontSize: 13,
    lineHeight: 20,
  },
  coachCard: {
    backgroundColor: '#171408',
    borderColor: '#3D3308',
    borderWidth: 1,
  },
  coachTip: {
    color: colors.goldSoft,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
