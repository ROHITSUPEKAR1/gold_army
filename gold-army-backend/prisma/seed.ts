import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('GoldArmy123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'owner@goldarmy.local' },
    update: {},
    create: {
      email: 'owner@goldarmy.local',
      name: 'Gold Army Owner',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@goldarmy.local' },
    update: {},
    create: {
      email: 'trainer@goldarmy.local',
      name: 'Aditya Rao',
      passwordHash,
      role: 'TRAINER',
    },
  });

  const trainer = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      specialization: 'Strength & Hypertrophy',
      experienceYears: 6,
    },
  });

  const serviceNames = [
    'General Gym',
    'Cardio',
    'Personal Training',
    'Gym + Cardio',
    'Gym + PT',
    'Gym + Cardio + PT',
  ];

  const services = await Promise.all(
    serviceNames.map((name) =>
      prisma.service.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const sGeneral = services.find((s) => s.name === 'General Gym')!;
  const sCardio = services.find((s) => s.name === 'Cardio')!;
  const sPT = services.find((s) => s.name === 'Personal Training')!;
  const sGymCardio = services.find((s) => s.name === 'Gym + Cardio')!;
  const sGymPT = services.find((s) => s.name === 'Gym + PT')!;
  const sAll = services.find((s) => s.name === 'Gym + Cardio + PT')!;

  // Seed Plans Catalog
  const plansData = [
    {
      id: 'plan-gym-cardio-q',
      name: 'Gym + Cardio',
      durationMonths: 3,
      price: 5499,
      discount: 1500,
      isPopular: true,
      isPremium: false,
      services: [sGymCardio.id, sGeneral.id, sCardio.id],
    },
    {
      id: 'plan-gym-pt-h',
      name: 'Gym + Cardio + PT',
      durationMonths: 6,
      price: 16999,
      discount: 3000,
      isPopular: false,
      isPremium: true,
      services: [sAll.id, sGymPT.id, sPT.id],
    },
    {
      id: 'plan-gym-monthly',
      name: 'General Gym',
      durationMonths: 1,
      price: 1999,
      discount: 0,
      isPopular: false,
      isPremium: false,
      services: [sGeneral.id],
    },
    {
      id: 'plan-pt-package-12',
      name: 'Personal Training (12 Sessions)',
      durationDays: 45,
      price: 8999,
      discount: 1000,
      isPopular: false,
      isPremium: false,
      services: [sPT.id],
    },
    {
      id: 'seed-gold-quarterly',
      name: 'Gold Quarterly (Gym + PT)',
      durationMonths: 3,
      price: 8499,
      discount: 1000,
      isPopular: true,
      isPremium: true,
      services: [sGymPT.id, sGeneral.id],
    },
    {
      id: 'plan-gold-annual',
      name: 'Gold Elite Annual',
      durationMonths: 12,
      price: 24999,
      discount: 5000,
      isPopular: false,
      isPremium: true,
      services: [sAll.id],
    },
  ];

  for (const p of plansData) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        durationMonths: p.durationMonths,
        durationDays: p.durationDays,
        price: p.price,
        discount: p.discount,
        isPopular: p.isPopular,
        isPremium: p.isPremium,
      },
      create: {
        id: p.id,
        name: p.name,
        durationMonths: p.durationMonths,
        durationDays: p.durationDays,
        price: p.price,
        discount: p.discount,
        isPopular: p.isPopular,
        isPremium: p.isPremium,
        services: {
          create: p.services.map((serviceId) => ({ serviceId })),
        },
      },
    });
  }

  const memberUser = await prisma.user.upsert({
    where: { phone: '+919822104000' },
    update: {},
    create: {
      phone: '+919822104000',
      name: 'Rohan Deshmukh',
      passwordHash,
      role: 'MEMBER',
    },
  });

  const member = await prisma.member.upsert({
    where: { userId: memberUser.id },
    update: {},
    create: {
      userId: memberUser.id,
      fitnessGoal: 'Muscle Gain',
      heightCm: 178,
      weightKg: 78,
    },
  });

  await prisma.trainerMember.upsert({
    where: { trainerId_memberId: { trainerId: trainer.id, memberId: member.id } },
    update: {},
    create: { trainerId: trainer.id, memberId: member.id },
  });

  await prisma.subscription.upsert({
    where: { id: 'seed-subscription' },
    update: {},
    create: {
      id: 'seed-subscription',
      memberId: member.id,
      planId: 'seed-gold-quarterly',
      serviceId: sGymPT.id,
      startDate: new Date('2026-07-12'),
      endDate: new Date('2026-10-04'),
      status: 'EXPIRING_SOON',
    },
  });

  // Comprehensive Exercises Catalog
  const exerciseCatalog = [
    {
      id: 'ex-bench-press',
      name: 'Barbell Bench Press',
      targetMuscle: 'Chest',
      difficulty: 'Intermediate',
      instructions: 'Lie flat, grip bar slightly wider than shoulder-width. Lower to mid-chest with control and press up explosively.',
      videoUrl: 'https://assets.goldarmy.local/videos/bench-press.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'ex-incline-dumbbell',
      name: 'Incline Dumbbell Press',
      targetMuscle: 'Chest',
      difficulty: 'Intermediate',
      instructions: 'Set bench to 30-45°. Press dumbbells overhead with palms forward. Lower until elbows hit 90° and contract chest.',
      videoUrl: 'https://assets.goldarmy.local/videos/incline-press.mp4',
    },
    {
      id: 'ex-lat-pulldown',
      name: 'Wide-Grip Lat Pulldown',
      targetMuscle: 'Back',
      difficulty: 'Beginner',
      instructions: 'Grip bar wide with palms away. Pull down to upper chest while arching slightly and squeezing shoulder blades.',
      videoUrl: 'https://assets.goldarmy.local/videos/lat-pulldown.mp4',
    },
    {
      id: 'ex-barbell-row',
      name: 'Bent-Over Barbell Row',
      targetMuscle: 'Back',
      difficulty: 'Advanced',
      instructions: 'Hinge at hips at 45° angle with flat back. Pull bar towards belly button driving through elbows.',
      videoUrl: 'https://assets.goldarmy.local/videos/barbell-row.mp4',
    },
    {
      id: 'ex-overhead-press',
      name: 'Standing Overhead Barbell Press',
      targetMuscle: 'Shoulders',
      difficulty: 'Intermediate',
      instructions: 'Stand tall with core braced. Press barbell from collarbone to overhead lockout, tucking chin as bar passes.',
      videoUrl: 'https://assets.goldarmy.local/videos/overhead-press.mp4',
    },
    {
      id: 'ex-lateral-raise',
      name: 'Dumbbell Lateral Raise',
      targetMuscle: 'Shoulders',
      difficulty: 'Beginner',
      instructions: 'Slight bend in elbows. Raise dumbbells to shoulder level leading with elbows and control descent.',
      videoUrl: 'https://assets.goldarmy.local/videos/lateral-raise.mp4',
    },
    {
      id: 'ex-barbell-squat',
      name: 'Barbell Back Squat',
      targetMuscle: 'Legs',
      difficulty: 'Advanced',
      instructions: 'Rest bar across traps. Descend until thighs are parallel to floor and drive back up through midfoot.',
      videoUrl: 'https://assets.goldarmy.local/videos/squat.mp4',
    },
    {
      id: 'ex-leg-press',
      name: '45-Degree Leg Press',
      targetMuscle: 'Legs',
      difficulty: 'Beginner',
      instructions: 'Feet shoulder-width on platform. Lower sled until knees reach 90° and press firmly through heels.',
      videoUrl: 'https://assets.goldarmy.local/videos/leg-press.mp4',
    },
    {
      id: 'ex-bicep-curl',
      name: 'EZ-Bar Bicep Curl',
      targetMuscle: 'Biceps',
      difficulty: 'Beginner',
      instructions: 'Lock elbows at sides. Curl bar upward contracting biceps at the top without swinging torso.',
      videoUrl: 'https://assets.goldarmy.local/videos/bicep-curl.mp4',
    },
    {
      id: 'ex-tricep-pushdown',
      name: 'Cable Tricep Rope Pushdown',
      targetMuscle: 'Triceps',
      difficulty: 'Beginner',
      instructions: 'Grip rope attachment with neutral grip. Extend arms downward, spreading rope at bottom contraction.',
      videoUrl: 'https://assets.goldarmy.local/videos/tricep-pushdown.mp4',
    },
    {
      id: 'ex-hanging-leg-raise',
      name: 'Hanging Leg Raise',
      targetMuscle: 'Core',
      difficulty: 'Intermediate',
      instructions: 'Hang from pull-up bar. Without swinging, curl pelvis and lift knees to chest engaging lower abs.',
      videoUrl: 'https://assets.goldarmy.local/videos/hanging-leg-raise.mp4',
    },
    {
      id: 'ex-treadmill-hiit',
      name: 'Incline Treadmill Sprints',
      targetMuscle: 'Cardio',
      difficulty: 'Intermediate',
      instructions: 'Perform intervals of 30 sec sprint at 12% incline followed by 60 sec walking recovery.',
      videoUrl: 'https://assets.goldarmy.local/videos/treadmill-hiit.mp4',
    },
  ];

  for (const ex of exerciseCatalog) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        name: ex.name,
        targetMuscle: ex.targetMuscle,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl,
      },
      create: {
        id: ex.id,
        name: ex.name,
        targetMuscle: ex.targetMuscle,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl,
      },
    });
  }

  // Seed Push Day Workout
  const pushWorkout = await prisma.workout.upsert({
    where: { id: 'seed-push-day' },
    update: {
      name: 'Push Day (Hypertrophy)',
      goal: 'Muscle Gain',
      notes: 'Focus on progressive overload on bench press. Control negative reps on isolation exercises.',
      durationMin: 50,
      calories: 420,
    },
    create: {
      id: 'seed-push-day',
      trainerId: trainer.id,
      name: 'Push Day (Hypertrophy)',
      goal: 'Muscle Gain',
      notes: 'Focus on progressive overload on bench press. Control negative reps on isolation exercises.',
      durationMin: 50,
      calories: 420,
    },
  });

  // Seed Pull Day Workout
  const pullWorkout = await prisma.workout.upsert({
    where: { id: 'seed-pull-day' },
    update: {
      name: 'Pull Day (Back & Biceps)',
      goal: 'Strength',
      notes: 'Maintain strict form on barbell rows. Do not let lower back round.',
      durationMin: 45,
      calories: 380,
    },
    create: {
      id: 'seed-pull-day',
      trainerId: trainer.id,
      name: 'Pull Day (Back & Biceps)',
      goal: 'Strength',
      notes: 'Maintain strict form on barbell rows. Do not let lower back round.',
      durationMin: 45,
      calories: 380,
    },
  });

  // Attach exercises to Push Workout
  const pushExercises = [
    { exerciseId: 'ex-bench-press', order: 1, sets: 4, reps: 8, weight: '65 kg', restSec: 90, trainerNotes: 'Warm up with empty bar first.' },
    { exerciseId: 'ex-incline-dumbbell', order: 2, sets: 3, reps: 10, weight: '22 kg', restSec: 75, trainerNotes: 'Elbows at 45 degrees.' },
    { exerciseId: 'ex-overhead-press', order: 3, sets: 3, reps: 8, weight: '40 kg', restSec: 90, trainerNotes: 'Keep glutes squeezed.' },
    { exerciseId: 'ex-lateral-raise', order: 4, sets: 4, reps: 15, weight: '10 kg', restSec: 60, trainerNotes: 'Slight forward lean.' },
    { exerciseId: 'ex-tricep-pushdown', order: 5, sets: 3, reps: 12, weight: '25 kg', restSec: 60, trainerNotes: 'Full lockout at bottom.' },
  ];

  for (const item of pushExercises) {
    await prisma.workoutExercise.upsert({
      where: { workoutId_exerciseId: { workoutId: pushWorkout.id, exerciseId: item.exerciseId } },
      update: item,
      create: { workoutId: pushWorkout.id, ...item },
    });
  }

  // Attach exercises to Pull Workout
  const pullExercises = [
    { exerciseId: 'ex-lat-pulldown', order: 1, sets: 4, reps: 10, weight: '55 kg', restSec: 75, trainerNotes: 'Squeeze lats at bottom.' },
    { exerciseId: 'ex-barbell-row', order: 2, sets: 4, reps: 8, weight: '60 kg', restSec: 90, trainerNotes: 'Keep chest up.' },
    { exerciseId: 'ex-bicep-curl', order: 3, sets: 3, reps: 12, weight: '25 kg', restSec: 60, trainerNotes: 'No momentum.' },
    { exerciseId: 'ex-hanging-leg-raise', order: 4, sets: 3, reps: 15, weight: 'Bodyweight', restSec: 45, trainerNotes: 'Controlled negative.' },
  ];

  for (const item of pullExercises) {
    await prisma.workoutExercise.upsert({
      where: { workoutId_exerciseId: { workoutId: pullWorkout.id, exerciseId: item.exerciseId } },
      update: item,
      create: { workoutId: pullWorkout.id, ...item },
    });
  }

  // Comprehensive Diet Plans
  const vegMuscleGainPlan = await prisma.dietPlan.upsert({
    where: { id: 'seed-diet-veg-muscle' },
    update: {
      name: 'Vegetarian High-Protein Hypertrophy',
      goal: 'Muscle Gain',
      dietType: 'VEGETARIAN',
      calories: 2640,
      proteinG: 160,
      carbsG: 280,
      fatsG: 70,
      budget: 350,
    },
    create: {
      id: 'seed-diet-veg-muscle',
      trainerId: trainer.id,
      name: 'Vegetarian High-Protein Hypertrophy',
      goal: 'Muscle Gain',
      dietType: 'VEGETARIAN',
      calories: 2640,
      proteinG: 160,
      carbsG: 280,
      fatsG: 70,
      budget: 350,
    },
  });

  const vegMeals = [
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'BREAKFAST', timing: '8:00 AM', name: 'Paneer Bhurji + 2 Multigrain Rotis + Almonds', quantity: '150g Paneer, 2 Rotis', calories: 480, proteinG: 30, estimatedCost: 65, preparationNotes: 'Cook paneer with minimal olive oil, turmeric and green chillies.' },
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'MID-MORNING', timing: '11:00 AM', name: 'Whey Protein Isolate + Banana + Chia Seeds', quantity: '1 Scoop Whey, 1 Banana', calories: 280, proteinG: 26, estimatedCost: 50, preparationNotes: 'Blend with chilled water or almond milk.' },
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'LUNCH', timing: '1:30 PM', name: 'Thick Dal Tadka + Steamed Brown Rice + Curd + Salad', quantity: '200g Dal, 150g Rice, 100g Curd', calories: 620, proteinG: 28, estimatedCost: 80, preparationNotes: 'Use moong and toor dal combination for complete amino profile.' },
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'PRE-WORKOUT', timing: '5:00 PM', name: 'Peanut Butter on Whole Wheat Toast + Black Coffee', quantity: '2 Slices, 30g PB', calories: 320, proteinG: 14, estimatedCost: 35, preparationNotes: 'Consume 45 minutes before strength training session.' },
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'POST-WORKOUT', timing: '7:30 PM', name: 'Roasted Chana + Protein Shake / Soya Chunks', quantity: '50g Roasted Chana, 1 Scoop', calories: 410, proteinG: 34, estimatedCost: 60, preparationNotes: 'Fast-digesting protein within 30 mins of workout.' },
    { dietPlanId: vegMuscleGainPlan.id, mealType: 'DINNER', timing: '9:30 PM', name: 'Soya Chunk Curry + 2 Phulkas + Cucumber Salad', quantity: '60g Soya chunks, 2 Phulkas', calories: 530, proteinG: 28, estimatedCost: 60, preparationNotes: 'Light sodium in the evening to reduce water retention.' },
  ];

  await prisma.dietMeal.deleteMany({ where: { dietPlanId: vegMuscleGainPlan.id } });
  for (const meal of vegMeals) {
    await prisma.dietMeal.create({ data: meal });
  }

  // Non-Veg Fat Loss Plan
  const nonVegLossPlan = await prisma.dietPlan.upsert({
    where: { id: 'seed-diet-nonveg-loss' },
    update: {
      name: 'Lean Cut Non-Vegetarian',
      goal: 'Weight Loss',
      dietType: 'NON_VEGETARIAN',
      calories: 1950,
      proteinG: 175,
      carbsG: 160,
      fatsG: 50,
      budget: 380,
    },
    create: {
      id: 'seed-diet-nonveg-loss',
      trainerId: trainer.id,
      name: 'Lean Cut Non-Vegetarian',
      goal: 'Weight Loss',
      dietType: 'NON_VEGETARIAN',
      calories: 1950,
      proteinG: 175,
      carbsG: 160,
      fatsG: 50,
      budget: 380,
    },
  });

  const nonVegMeals = [
    { dietPlanId: nonVegLossPlan.id, mealType: 'BREAKFAST', timing: '8:00 AM', name: '4 Boiled Egg Whites + 1 Whole Egg + Oats', quantity: '5 Eggs, 40g Oats', calories: 380, proteinG: 32, estimatedCost: 55, preparationNotes: 'Boil eggs fresh with black pepper.' },
    { dietPlanId: nonVegLossPlan.id, mealType: 'LUNCH', timing: '1:00 PM', name: 'Grilled Chicken Breast + Quinoa + Green Beans', quantity: '180g Chicken, 80g Quinoa', calories: 520, proteinG: 48, estimatedCost: 110, preparationNotes: 'Marinate chicken in lemon, garlic, and curd.' },
    { dietPlanId: nonVegLossPlan.id, mealType: 'PRE-WORKOUT', timing: '4:30 PM', name: 'Apple + Green Tea + 5 Almonds', quantity: '1 Apple, 5 Almonds', calories: 140, proteinG: 3, estimatedCost: 25, preparationNotes: 'Light clean carbs for workout energy.' },
    { dietPlanId: nonVegLossPlan.id, mealType: 'POST-WORKOUT', timing: '7:00 PM', name: 'Whey Protein Isolate in Water', quantity: '1 Scoop', calories: 120, proteinG: 25, estimatedCost: 45, preparationNotes: 'Direct absorption.' },
    { dietPlanId: nonVegLossPlan.id, mealType: 'DINNER', timing: '8:30 PM', name: 'Grilled Fish / Chicken Tikka + Broccoli Stir Fry', quantity: '200g Fish / Chicken', calories: 450, proteinG: 42, estimatedCost: 120, preparationNotes: 'High protein, low carb dinner.' },
  ];

  await prisma.dietMeal.deleteMany({ where: { dietPlanId: nonVegLossPlan.id } });
  for (const meal of nonVegMeals) {
    await prisma.dietMeal.create({ data: meal });
  }

  // Realistic Member Progress & PR History
  await prisma.progress.deleteMany({ where: { memberId: member.id } });

  const progressEntries = [
    {
      memberId: member.id,
      measuredAt: new Date(Date.now() - 35 * 86400000), // 5 weeks ago
      weightKg: 82.5,
      bodyFat: 21.0,
      measurements: { chestIn: 39.5, waistIn: 36.0, armsIn: 13.5, thighsIn: 22.0 },
      notes: 'Initial fitness baseline. High enthusiasm.',
      personalRecords: {
        'Barbell Bench Press': { exerciseName: 'Barbell Bench Press', weightKg: 50, reps: 8, date: '2026-08-07', notes: 'First test.' },
        'Barbell Back Squat': { exerciseName: 'Barbell Back Squat', weightKg: 65, reps: 8, date: '2026-08-07' },
      },
    },
    {
      memberId: member.id,
      measuredAt: new Date(Date.now() - 21 * 86400000), // 3 weeks ago
      weightKg: 80.2,
      bodyFat: 19.5,
      measurements: { chestIn: 40.2, waistIn: 35.0, armsIn: 13.8, thighsIn: 22.5 },
      notes: 'Significant energy improvement and tighter core.',
      personalRecords: {
        'Barbell Bench Press': { exerciseName: 'Barbell Bench Press', weightKg: 57.5, reps: 8, date: '2026-08-21' },
        'Barbell Back Squat': { exerciseName: 'Barbell Back Squat', weightKg: 75, reps: 6, date: '2026-08-21' },
      },
    },
    {
      memberId: member.id,
      measuredAt: new Date(Date.now() - 7 * 86400000), // 1 week ago
      weightKg: 78.8,
      bodyFat: 18.2,
      measurements: { chestIn: 41.0, waistIn: 34.0, armsIn: 14.2, thighsIn: 23.0 },
      notes: 'Gained noticeable shoulder cap definition and chest fullness.',
      personalRecords: {
        'Barbell Bench Press': { exerciseName: 'Barbell Bench Press', weightKg: 65, reps: 8, date: '2026-09-04', notes: 'Clean paused reps.' },
        'Barbell Back Squat': { exerciseName: 'Barbell Back Squat', weightKg: 85, reps: 8, date: '2026-09-04' },
        'Deadlift': { exerciseName: 'Deadlift', weightKg: 110, reps: 5, date: '2026-09-04', notes: 'Double overhand grip.' },
      },
    },
  ];

  for (const entry of progressEntries) {
    await prisma.progress.create({ data: entry });
  }

  console.log(`Seeded admin ${admin.email}, trainer ${trainerUser.email}, member ${memberUser.phone} with plans, workouts, diet & progress history.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
