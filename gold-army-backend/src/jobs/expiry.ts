import { prisma } from '../config/prisma';

export async function runExpiryJob(now = new Date()) {
  const reminders = [7, 3, 1, 0];
  for (const days of reminders) {
    const from = new Date(now); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() + days);
    const to = new Date(from); to.setDate(to.getDate() + 1);
    const subscriptions = await prisma.subscription.findMany({ where: { endDate: { gte: from, lt: to }, isDeleted: false }, include: { member: true } });
    for (const subscription of subscriptions) {
      const dedupeKey = `expiry:${subscription.id}:${days}`;
      const existing = await prisma.notificationLog.findUnique({ where: { dedupeKey } });
      if (existing) continue;
      const notification = await prisma.notification.create({ data: { title: days === 0 ? 'Membership expired today' : `Membership expires in ${days} day${days === 1 ? '' : 's'}`, message: days === 0 ? 'Renew your membership to continue training.' : 'Renew now to keep your training active.', audience: 'SELECTED_MEMBERS', recipients: { create: { memberId: subscription.memberId } } } });
      await prisma.notificationLog.create({ data: { dedupeKey, notificationId: notification.id, channel: 'IN_APP' } });
    }
  }
}

export function startExpiryJob(intervalMs = 24 * 60 * 60 * 1000) { void runExpiryJob().catch((error) => console.error('Expiry job failed', error)); return setInterval(() => void runExpiryJob().catch((error) => console.error('Expiry job failed', error)), intervalMs); }
