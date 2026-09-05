/**
 * Deal Health Service Abstraction
 * Encapsulates deal health scores, stalled deal feeds, and anomaly detection rules.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/intelligence/deal-health).
 */

import { MOCK_DEAL_HEALTH_OVERVIEW, MOCK_DEAL_HEALTH_ALERTS } from '@/data/mockDealHealthData';
import type { DealHealthOverview, DealHealthAlert } from '@/types';

let mockAlertsState: DealHealthAlert[] = [...MOCK_DEAL_HEALTH_ALERTS];

export const dealHealthService = {
  async getOverview(): Promise<DealHealthOverview> {
    await new Promise((r) => setTimeout(r, 150));
    return { ...MOCK_DEAL_HEALTH_OVERVIEW };
  },

  async getAlerts(): Promise<DealHealthAlert[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockAlertsState];
  },

  async resolveAlert(alertId: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 200));
    mockAlertsState = mockAlertsState.filter((a) => a.id !== alertId);
    return true;
  },
};
