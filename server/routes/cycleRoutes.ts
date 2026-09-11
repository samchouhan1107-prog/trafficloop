import { Router, Response } from 'express';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CampaignPoolService } from '../services/campaignPoolService.js';
import { TrafficExchangeService } from '../services/trafficExchangeService.js';

export const cycleRoutes = Router();

// Allow authenticated users and guest previewing
cycleRoutes.use(optionalAuthMiddleware);

/**
 * GET /api/cycle
 * Primary server-driven live cycle endpoint.
 * Returns the current active site pool, total, pool version, and traffic strength metrics.
 */
const handleGetPool = (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = CampaignPoolService.getActivePool(userId);
    const trafficStrength = CampaignPoolService.getTrafficStrengthMetrics();

    // Check If-None-Match or version check to save bandwidth
    const clientVersion = req.headers['if-none-match'];
    if (clientVersion && clientVersion === `v${pool.poolVersion}`) {
      res.status(304).end();
      return;
    }

    res.setHeader('ETag', `v${pool.poolVersion}`);
    res.setHeader('Cache-Control', 'no-cache');

    res.json({
      sites: pool.sites,
      total: pool.total,
      eligibleTotal: pool.eligibleTotal,
      poolVersion: pool.poolVersion,
      updatedAt: pool.updatedAt,
      trafficStrength
    });
  } catch (err: any) {
    console.error('[CYCLE] Error fetching cycle pool:', err);
    res.status(500).json({ error: 'Failed to retrieve live cycle pool' });
  }
};

cycleRoutes.get('/', handleGetPool);
cycleRoutes.get('/pool', handleGetPool);

/**
 * GET /api/cycle/sites
 * Returns active sites array directly
 */
cycleRoutes.get('/sites', (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = CampaignPoolService.getActivePool(req.user?.id);
    res.json({
      sites: pool.sites,
      total: pool.total,
      updatedAt: pool.updatedAt,
      poolVersion: pool.poolVersion
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve cycle sites' });
  }
});

/**
 * GET /api/cycle/version
 * Fast lightweight polling endpoint to check if pool has updated
 */
cycleRoutes.get('/version', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    poolVersion: CampaignPoolService.getVersion(),
    total: CampaignPoolService.getActiveCampaignCount(),
    updatedAt: CampaignPoolService.getUpdatedAt()
  });
});

/**
 * GET /api/cycle/stream
 * Server-Sent Events (SSE) stream for live updates without manual page reload
 */
cycleRoutes.get('/stream', (req: AuthenticatedRequest, res: Response) => {
  CampaignPoolService.registerSseClient(res, req.user?.id);
});

/**
 * GET /api/cycle/traffic-strength
 * Returns real server-calculated traffic strength metrics
 */
cycleRoutes.get('/traffic-strength', (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = CampaignPoolService.getTrafficStrengthMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate traffic strength' });
  }
});
