import { describe, expect, it } from 'vitest';
import { subscriptionStatus } from '../src/modules/business';

describe('subscription business rules', () => {
  const now = new Date('2026-09-11T00:00:00.000Z');
  it('calculates active subscriptions', () => expect(subscriptionStatus(new Date('2026-10-11T00:00:00.000Z'), now)).toEqual({ daysRemaining: 30, status: 'ACTIVE' }));
  it('marks seven-day subscriptions expiring soon', () => expect(subscriptionStatus(new Date('2026-09-18T00:00:00.000Z'), now)).toEqual({ daysRemaining: 7, status: 'EXPIRING_SOON' }));
  it('marks past subscriptions expired', () => expect(subscriptionStatus(new Date('2026-09-10T00:00:00.000Z'), now)).toEqual({ daysRemaining: -1, status: 'EXPIRED' }));
});
