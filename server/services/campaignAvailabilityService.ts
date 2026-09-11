import { db } from '../database/db.js';

export interface CampaignAvailabilityResult {
  campaignId: string;
  url: string;
  isAvailable: boolean;
  httpStatus: number;
  responseTimeMs: number;
  canEmbedInIframe: boolean;
  xFrameOptions: string | null;
  cspFrameAncestors: string | null;
  healthStatus: 'healthy' | 'degraded' | 'unreachable';
  error: string | null;
}

export class CampaignAvailabilityService {
  private static headerCache = new Map<string, { result: CampaignAvailabilityResult; cachedAt: number }>();
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Proactively checks availability, response latency, and embeddability of a campaign URL
   */
  static async checkCampaignAvailability(campaignId: string, url: string): Promise<CampaignAvailabilityResult> {
    const cached = this.headerCache.get(url);
    if (cached && (Date.now() - cached.cachedAt) < this.CACHE_TTL_MS) {
      return cached.result;
    }

    const startTime = Date.now();
    let httpStatus = 0;
    let isAvailable = false;
    let canEmbedInIframe = true;
    let xFrameOptions: string | null = null;
    let cspFrameAncestors: string | null = null;
    let error: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const resp = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 TrafficLoop-HealthCheck/3.0'
        },
        signal: controller.signal,
        redirect: 'follow'
      }).catch(async (headErr) => {
        // Fall back to GET with range if HEAD method is not supported by target server
        return await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 TrafficLoop-HealthCheck/3.0',
            'Range': 'bytes=0-1024'
          },
          signal: controller.signal,
          redirect: 'follow'
        });
      });

      clearTimeout(timeoutId);

      httpStatus = resp.status;
      isAvailable = resp.status >= 200 && resp.status < 400;

      // Inspect frame embedding restrictions
      xFrameOptions = resp.headers.get('x-frame-options');
      const csp = resp.headers.get('content-security-policy');
      if (csp && csp.toLowerCase().includes('frame-ancestors')) {
        cspFrameAncestors = csp;
      }

      if (xFrameOptions && (xFrameOptions.toUpperCase().includes('DENY') || xFrameOptions.toUpperCase().includes('SAMEORIGIN'))) {
        canEmbedInIframe = false;
      }

      if (cspFrameAncestors && (cspFrameAncestors.includes("'none'") || cspFrameAncestors.includes("'self'"))) {
        canEmbedInIframe = false;
      }
    } catch (err: any) {
      error = err.message || 'Connection timeout or network failure';
      httpStatus = 0;
      isAvailable = false;
    }

    const responseTimeMs = Date.now() - startTime;
    const healthStatus: 'healthy' | 'degraded' | 'unreachable' = isAvailable
      ? (responseTimeMs > 2500 ? 'degraded' : 'healthy')
      : 'unreachable';

    const result: CampaignAvailabilityResult = {
      campaignId,
      url,
      isAvailable,
      httpStatus,
      responseTimeMs,
      canEmbedInIframe,
      xFrameOptions,
      cspFrameAncestors,
      healthStatus,
      error
    };

    this.headerCache.set(url, { result, cachedAt: Date.now() });

    // Update campaign health status in database asynchronously
    try {
      const now = new Date().toISOString();
      const failures = isAvailable ? 0 : 1;
      db.prepare(`
        UPDATE campaigns
        SET health_status = ?,
            last_availability_check = ?,
            consecutive_failures = CASE WHEN ? = 0 THEN 0 ELSE COALESCE(consecutive_failures, 0) + 1 END
        WHERE id = ?
      `).run(healthStatus, now, failures, campaignId);
    } catch (dbErr) {
      console.warn('[AvailabilityCheck DB Update Warning]:', dbErr);
    }

    return result;
  }

  /**
   * Periodic health scanner that checks active campaigns for reachability
   */
  static async scanActiveCampaigns(): Promise<{ checked: number; healthy: number; unreachable: number }> {
    try {
      const campaigns = db.prepare(`
        SELECT id, url, title FROM campaigns
        WHERE status = 'active'
        ORDER BY last_availability_check ASC NULLS FIRST
        LIMIT 10
      `).all() as Array<{ id: string; url: string; title: string }>;

      let healthy = 0;
      let unreachable = 0;

      for (const c of campaigns) {
        const check = await this.checkCampaignAvailability(c.id, c.url);
        if (check.isAvailable) healthy++;
        else unreachable++;
      }

      return { checked: campaigns.length, healthy, unreachable };
    } catch (err) {
      console.error('[CampaignAvailabilityService] Scan error:', err);
      return { checked: 0, healthy: 0, unreachable: 0 };
    }
  }
}
