import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, PrimaryButton } from '../../components/ui';
import { MemberNav, MemberScreen, memberStyles as s } from '../../components/MemberScreen';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useMemberDiet } from '../../hooks/useDiet';

const MEAL_ORDER: Record<string, number> = {
  BREAKFAST: 1,
  'MID-MORNING': 2,
  LUNCH: 3,
  'PRE-WORKOUT': 4,
  'POST-WORKOUT': 5,
  DINNER: 6,
};

export default function DietScreen() {
  const {
    data: memberDietPlans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMemberDiet();

  const activeAssignment = memberDietPlans[0];
  const dietPlan = activeAssignment?.dietPlan;

  const meals = dietPlan?.meals
    ? [...dietPlan.meals].sort(
        (a, b) =>
          (MEAL_ORDER[a.mealType.toUpperCase()] ?? 99) -
          (MEAL_ORDER[b.mealType.toUpperCase()] ?? 99)
      )
    : [];

  const totalCalculatedCost = meals.reduce(
    (sum, m) => sum + (Number(m.estimatedCost) || 0),
    0
  );

  return (
    <MemberScreen title="Personalized Diet">
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.goldSoft} />
          <Text style={[s.muted, { marginTop: 12 }]}>Loading your diet plan...</Text>
        </View>
      ) : !dietPlan ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyHeading}>No Diet Plan Assigned Yet</Text>
          <Text style={styles.emptyText}>
            Your assigned Gold Army trainer or certified nutritionist will create and link your personalized daily meal targets here.
          </Text>
        </Card>
      ) : (
        <>
          {/* Daily Nutrition Macro Target Hero Card */}
          <Card style={styles.heroCard}>
            <View style={s.row}>
              <Badge label={dietPlan.goal.toUpperCase()} tone="gold" />
              <Badge
                label={dietPlan.dietType.replace('_', ' ')}
                tone={dietPlan.dietType === 'VEGETARIAN' ? 'green' : 'amber'}
              />
            </View>

            <Text style={styles.planTitle}>{dietPlan.name}</Text>

            {/* Daily Macro 4-Grid */}
            <View style={styles.macrosRow}>
              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>
                  {Number(dietPlan.calories).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.macroLabel}>CALORIES</Text>
              </View>

              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{dietPlan.proteinG}g</Text>
                <Text style={styles.macroLabel}>PROTEIN</Text>
              </View>

              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{dietPlan.carbsG}g</Text>
                <Text style={styles.macroLabel}>CARBS</Text>
              </View>

              <View style={styles.macroBox}>
                <Text style={styles.macroValue}>{dietPlan.fatsG}g</Text>
                <Text style={styles.macroLabel}>FATS</Text>
              </View>
            </View>
          </Card>

          {/* Meals Schedule Header */}
          <View style={[s.row, { marginTop: 22, marginBottom: 10 }]}>
            <View>
              <Text style={s.heading}>Daily Meal Schedule</Text>
              <Text style={s.muted}>
                {meals.length} planned meals · ₹{dietPlan.budget ?? totalCalculatedCost}/day budget
              </Text>
            </View>
            <Badge label="CHEF VERIFIED" tone="gold" />
          </View>

          {/* Meals List */}
          {meals.length === 0 ? (
            <Card>
              <Text style={s.muted}>No meals listed under this plan yet.</Text>
            </Card>
          ) : (
            meals.map((meal) => (
              <Card key={meal.id} style={styles.mealCard}>
                {/* Meal Type & Timing */}
                <View style={s.row}>
                  <View style={styles.mealTypeBadge}>
                    <Text style={styles.mealTypeText}>{meal.mealType}</Text>
                  </View>
                  <Text style={styles.timingText}>{meal.timing}</Text>
                </View>

                {/* Meal Foods & Name */}
                <Text style={styles.mealName}>{meal.name}</Text>
                {meal.quantity && (
                  <Text style={styles.mealQuantity}>Portion: {meal.quantity}</Text>
                )}

                {/* Macro summary line & budget */}
                <View style={[s.row, { marginTop: 10 }]}>
                  <Text style={styles.mealMacros}>
                    🔥 {meal.calories} kcal · 💪 {meal.proteinG}g protein
                  </Text>
                  {meal.estimatedCost ? (
                    <Text style={styles.mealCost}>₹{Number(meal.estimatedCost)}</Text>
                  ) : null}
                </View>

                {/* Preparation / Nutritionist Notes */}
                {meal.preparationNotes && (
                  <View style={styles.prepNotesBox}>
                    <Text style={styles.prepNotesText}>
                      Tip: {meal.preparationNotes}
                    </Text>
                  </View>
                )}
              </Card>
            ))
          )}
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
  heroCard: {
    backgroundColor: '#1C1408',
    borderColor: '#4A370A',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  planTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
  },
  macroBox: {
    alignItems: 'center',
  },
  macroValue: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
  },
  macroLabel: {
    color: colors.goldSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  mealCard: {
    marginBottom: 12,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(230, 199, 106, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mealTypeText: {
    color: colors.goldSoft,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  timingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  mealName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  mealQuantity: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 2,
  },
  mealMacros: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  mealCost: {
    color: colors.goldSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  prepNotesBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  prepNotesText: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
