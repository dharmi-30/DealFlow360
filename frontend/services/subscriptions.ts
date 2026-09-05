/**
 * Subscriptions Service Abstraction
 * Encapsulates recurring subscription plans, proration calculations, and cancellations.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/subscriptions).
 */

import { MOCK_SUBSCRIPTIONS } from '@/data/mockSubscriptionData';
import type { SubscriptionDetail } from '@/types';

let mockSubscriptionsState: SubscriptionDetail[] = [...MOCK_SUBSCRIPTIONS];

export const subscriptionsService = {
  async getSubscriptions(): Promise<SubscriptionDetail[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockSubscriptionsState];
  },

  async getSubscriptionById(id: string): Promise<SubscriptionDetail | null> {
    await new Promise((r) => setTimeout(r, 100));
    return (
      mockSubscriptionsState.find(
        (s) =>
          s.id === id ||
          s.subscriptionNumber.toLowerCase() === id.toLowerCase()
      ) || null
    );
  },

  async updateQuantity(id: string, newQuantity: number): Promise<SubscriptionDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockSubscriptionsState.findIndex(
      (s) => s.id === id || s.subscriptionNumber === id
    );
    if (idx === -1) throw new Error(`Subscription ${id} not found`);

    const current = mockSubscriptionsState[idx];
    const unitPrice = current.recurringAmount / Math.max(current.quantity, 1);
    const updated: SubscriptionDetail = {
      ...current,
      quantity: newQuantity,
      recurringAmount: Math.round(unitPrice * newQuantity),
    };

    mockSubscriptionsState[idx] = updated;
    return updated;
  },

  async cancelSubscription(
    id: string,
    immediate: boolean,
    reason?: string
  ): Promise<SubscriptionDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockSubscriptionsState.findIndex(
      (s) => s.id === id || s.subscriptionNumber === id
    );
    if (idx === -1) throw new Error(`Subscription ${id} not found`);

    const current = mockSubscriptionsState[idx];
    const updated: SubscriptionDetail = {
      ...current,
      status: immediate ? 'canceled' : 'pending_cancellation',
    };

    mockSubscriptionsState[idx] = updated;
    return updated;
  },
};
