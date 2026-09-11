import { ActivityEventPayload, ActivityEventResult } from '../types.js';
import { api } from './api.js';

class ActivityTrackerService {
  private lastExploredFeatures: Map<string, number> = new Map();
  private pendingRequests: Set<string> = new Set();

  private getAuthToken(): string | null {
    return api.getToken() || localStorage.getItem('trafficloop_token') || localStorage.getItem('trafficloop_auth_token') || null;
  }

  /**
   * Records legitimate user exploration of platform features.
   * Debounces identical features on the client (15-second client throttle)
   * before sending to the server where strict qualification and anti-replay
   * are authoritatively enforced.
   */
  async recordExploration(path: string, feature: string): Promise<ActivityEventResult | null> {
    const token = this.getAuthToken();
    if (!token) {
      return null;
    }

    const now = Date.now();
    const lastTime = this.lastExploredFeatures.get(feature) || 0;

    // 15-second client throttle to avoid spamming the backend
    if (now - lastTime < 15000) {
      return null;
    }

    if (this.pendingRequests.has(feature)) {
      return null;
    }

    this.pendingRequests.add(feature);
    this.lastExploredFeatures.set(feature, now);

    try {
      const payload: ActivityEventPayload = {
        eventType: 'feature_exploration',
        feature,
        path,
        metadata: {
          timestamp: new Date().toISOString(),
          screen: `${window.innerWidth}x${window.innerHeight}`
        }
      };

      const res = await fetch('/api/rewards/activity-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        return null;
      }

      const data: ActivityEventResult = await res.json();
      
      if (data.qualified && data.pointsAwarded > 0) {
        // Dispatch global event for responsive UI updates (e.g. RewardsPage)
        window.dispatchEvent(new CustomEvent('rewards_points_updated', { detail: data }));
      }

      return data;
    } catch (err) {
      console.warn('[ActivityTracker] Could not record activity event:', err);
      return null;
    } finally {
      this.pendingRequests.delete(feature);
    }
  }

  /**
   * Explicitly record a specific user-initiated action (e.g., campaign creation, test)
   */
  async recordAction(eventType: string, feature: string, metadata?: Record<string, any>): Promise<ActivityEventResult | null> {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      const payload: ActivityEventPayload = {
        eventType,
        feature,
        path: window.location.pathname,
        metadata
      };

      const res = await fetch('/api/rewards/activity-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) return null;
      const data: ActivityEventResult = await res.json();
      if (data.qualified && data.pointsAwarded > 0) {
        window.dispatchEvent(new CustomEvent('rewards_points_updated', { detail: data }));
      }
      return data;
    } catch {
      return null;
    }
  }
}

export const activityTracker = new ActivityTrackerService();
