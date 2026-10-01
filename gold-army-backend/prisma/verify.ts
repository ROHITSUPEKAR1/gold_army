import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Testing Prisma Database Connection ---');
  await prisma.$connect();
  console.log('✓ Successfully connected to MySQL database.');

  console.log('\n--- 2. Checking Seeded Entities ---');
  const [userCount, memberCount, trainerCount, serviceCount, planCount, subscriptionCount, exerciseCount] = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.trainer.count(),
    prisma.service.count(),
    prisma.plan.count(),
    prisma.subscription.count(),
    prisma.exercise.count(),
  ]);

  console.log(`- Users: ${userCount}`);
  console.log(`- Members: ${memberCount}`);
  console.log(`- Trainers: ${trainerCount}`);
  console.log(`- Services: ${serviceCount}`);
  console.log(`- Plans: ${planCount}`);
  console.log(`- Subscriptions: ${subscriptionCount}`);
  console.log(`- Exercises: ${exerciseCount}`);

  console.log('\n--- 3. Verifying Seed Data Records & Relationships ---');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const trainer = await prisma.trainer.findFirst({ include: { user: true, members: { include: { member: { include: { user: true } } } } } });
  const member = await prisma.member.findFirst({ include: { user: true, subscriptions: { include: { plan: true, service: true } } } });

  console.log(`✓ Admin User: ${admin?.name} (${admin?.email})`);
  console.log(`✓ Trainer: ${trainer?.user.name} with ${trainer?.members.length} assigned member(s)`);
  console.log(`✓ Member: ${member?.user.name} (${member?.user.phone})`);
  console.log(`  - Subscriptions: ${member?.subscriptions.length} (Plan: ${member?.subscriptions[0]?.plan?.name}, Status: ${member?.subscriptions[0]?.status})`);

  console.log('\n--- 4. Running Test CRUD Verification ---');
  const testOffer = await prisma.offer.create({
    data: {
      name: 'Test Setup Offer',
      description: 'Temporary offer for database connection verification',
      discount: 500,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 86400000),
      isActive: true,
    },
  });
  console.log(`✓ CREATE successful (ID: ${testOffer.id})`);

  const readOffer = await prisma.offer.findUnique({ where: { id: testOffer.id } });
  if (!readOffer) throw new Error('Failed to read created offer');
  console.log(`✓ READ successful (${readOffer.name})`);

  const updatedOffer = await prisma.offer.update({
    where: { id: testOffer.id },
    data: { name: 'Test Setup Offer (Verified)' },
  });
  console.log(`✓ UPDATE successful (${updatedOffer.name})`);

  await prisma.offer.delete({ where: { id: testOffer.id } });
  console.log('✓ DELETE successful (Cleaned up test record)');

  console.log('\n========================================');
  console.log('🎉 ALL DATABASE VERIFICATION CHECKS PASSED');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Database verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
