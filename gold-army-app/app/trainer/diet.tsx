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
  useAssignDietPlan,
  useCreateDietPlan,
  useDietPlans,
  type DietType,
} from '../../hooks/useDiet';

const DIET_TYPES: DietType[] = ['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN'];

export default function TrainerDiet() {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [dietType, setDietType] = useState<DietType>('VEGETARIAN');
  const [calories, setCalories] = useState('2400');
  const [proteinG, setProteinG] = useState('150');
  const [carbsG, setCarbsG] = useState('260');
  const [fatsG, setFatsG] = useState('65');
  const [budget, setBudget] = useState('350');

  // Meal modal states
  const [assignModalPlan, setAssignModalPlan] = useState<string | null>(null);
  const [targetMemberId, setTargetMemberId] = useState('');

  const { data: dietPlans = [], isLoading } = useDietPlans();
  const createDietPlanMutation = useCreateDietPlan();
  const assignDietPlanMutation = useAssignDietPlan();

  const handleCreateDietPlan = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a diet plan name.');
      return;
    }

    try {
      await createDietPlanMutation.mutateAsync({
        name: name.trim(),
        goal,
        dietType,
        calories: parseInt(calories, 10) || 2000,
        proteinG: parseInt(proteinG, 10) || 120,
        carbsG: parseInt(carbsG, 10) || 200,
        fatsG: parseInt(fatsG, 10) || 50,
        budget: parseInt(budget, 10) || 300,
        meals: [
          {
            mealType: 'BREAKFAST',
            timing: '8:00 AM',
            name: dietType === 'NON_VEGETARIAN' ? 'Egg Omelette + Toast' : 'Paneer Bhurji + Roti',
            quantity: 'Standard portion',
            calories: 450,
            proteinG: 28,
            estimatedCost: 60,
          },
          {
            mealType: 'LUNCH',
            timing: '1:00 PM',
            name: dietType === 'NON_VEGETARIAN' ? 'Grilled Chicken + Rice' : 'Dal Makhani + Rice + Salad',
            quantity: 'Standard portion',
            calories: 600,
            proteinG: 40,
            estimatedCost: 90,
          },
          {
            mealType: 'DINNER',
            timing: '8:30 PM',
            name: 'Protein Shake / Soya Stir Fry',
            quantity: 'Light dinner',
            calories: 400,
            proteinG: 30,
            estimatedCost: 50,
          },
        ],
      });

      setName('');
      Alert.alert('Success', 'Diet plan template created successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create diet plan.';
      Alert.alert('Error', message);
    }
  };

  const handleAssignToMember = async () => {
    if (!assignModalPlan || !targetMemberId.trim()) {
      Alert.alert('Missing Member ID', 'Please enter the target Member ID.');
      return;
    }

    try {
      await assignDietPlanMutation.mutateAsync({
        dietPlanId: assignModalPlan,
        memberId: targetMemberId.trim(),
      });
      setAssignModalPlan(null);
      setTargetMemberId('');
      Alert.alert('Success', 'Diet plan assigned to member successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign diet plan.';
      Alert.alert('Error', message);
    }
  };

  return (
    <RoleGate role="trainer">
      <RoleScreen title="Diet Management" eyebrow="TRAINER · DIET PLANS">
        {/* Diet Plan Creation Form */}
        <Card>
          <Text style={s.heading}>Create Diet Plan Template</Text>
          <Text style={[s.muted, { marginBottom: 12 }]}>
            Build goal-based, veg/non-veg, budget-aware meal templates for your clients.
          </Text>

          <TextInput
            style={s.input}
            placeholder="Plan Name (e.g., Lean Cutting Veg)"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="Goal: Muscle Gain, Fat Loss, Strength…"
            placeholderTextColor={colors.muted}
            value={goal}
            onChangeText={setGoal}
          />

          {/* Diet Preference Selector Chips */}
          <Text style={[s.muted, { marginTop: 12, fontWeight: '700' }]}>Diet Type:</Text>
          <View style={styles.dietTypeRow}>
            {DIET_TYPES.map((type) => {
              const isSelected = dietType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setDietType(type)}
                  style={[styles.dietChip, isSelected && styles.dietChipSelected]}
                >
                  <Text style={[styles.dietChipText, isSelected && styles.dietChipTextSelected]}>
                    {type.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Macros Row */}
          <View style={styles.macroInputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CALORIES</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <Text style={styles.inputLabel}>PROTEIN (g)</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={proteinG}
                onChangeText={setProteinG}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>BUDGET (₹/day)</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <PrimaryButton
              label="SAVE DIET TEMPLATE"
              loading={createDietPlanMutation.isPending}
              onPress={handleCreateDietPlan}
            />
          </View>
        </Card>

        {/* Available Diet Plans List */}
        <Text style={[s.heading, { marginTop: 22 }]}>Available Diet Templates</Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.goldSoft} style={{ marginVertical: 20 }} />
        ) : dietPlans.length === 0 ? (
          <Card>
            <Text style={s.muted}>No diet plans created yet. Build one above.</Text>
          </Card>
        ) : (
          dietPlans.map((plan) => (
            <Card key={plan.id} style={{ marginBottom: 10 }}>
              <View style={s.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={s.muted}>
                    {plan.calories} kcal · {plan.proteinG}g protein · ₹{plan.budget ?? 350}/day
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Badge label={plan.goal} tone="gold" />
                    <Badge
                      label={plan.dietType.replace('_', ' ')}
                      tone={plan.dietType === 'VEGETARIAN' ? 'green' : 'amber'}
                    />
                  </View>
                </View>

                <View>
                  <PrimaryButton
                    label="Assign"
                    onPress={() => setAssignModalPlan(plan.id)}
                  />
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Member Assignment Modal */}
        <Modal visible={Boolean(assignModalPlan)} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeading}>Assign Diet Plan to Member</Text>
              <Text style={s.muted}>
                Enter the Member ID to update their daily meal dashboard.
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
                  label="ASSIGN DIET PLAN"
                  loading={assignDietPlanMutation.isPending}
                  onPress={handleAssignToMember}
                />
                <Pressable
                  onPress={() => setAssignModalPlan(null)}
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
  dietTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  dietChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
  },
  dietChipSelected: {
    backgroundColor: colors.red,
    borderColor: colors.redBright,
  },
  dietChipText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  dietChipTextSelected: {
    color: colors.white,
  },
  macroInputsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  planName: {
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
