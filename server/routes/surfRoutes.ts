import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { TrafficExchangeService } from '../services/trafficExchangeService.js';
import { GA4Service } from '../services/ga4Service.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

export const surfRoutes = Router();

// Protect surf endpoints
surfRoutes.use(authMiddleware);

const surfStartLimiter = createRateLimiter(60, 60 * 1000, 'Surfing rate limit reached. Please wait a moment.');
const surfCompleteLimiter = createRateLimiter(60, 60 * 1000, 'Completion rate limit reached.');

/**
 * GET /api/surf/status
 * Quick check on queue availability and current user stats
 */
surfRoutes.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const eligible = TrafficExchangeService.getEligibleCampaign(userId);

  const totalActiveInPool = (db.prepare(`
    SELECT COUNT(*) as c FROM campaigns 
    WHERE status = 'active' AND user_id != ? AND (credit_budget - spent_credits) >= credit_cost_per_visit
  `).get(userId) as any).c;

  res.json({
    hasCampaigns: eligible !== null,
    totalAvailableInPool: totalActiveInPool,
    userCredits: req.user!.credits,
    todayVisitsMade: req.user!.total_visits_made
  });
});

/**
 * POST /api/surf/start
 * Starts a real viewing session for an eligible campaign
 */
surfRoutes.post('/start', surfStartLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { preferredCampaignId } = req.body;
    const session = TrafficExchangeService.startSurfingSession(
      req.user!.id,
      req.ip || '127.0.0.1',
      req.headers['user-agent'] || 'Web Surfer',
      preferredCampaignId
    );

    GA4Service.trackEvent('visit_started', {
      campaignId: session.campaign.id,
      duration: session.campaign.duration_seconds,
      visitorId: req.user!.id
    });

    res.json(session);
  } catch (error: any) {
    if (error.message === 'NO_CAMPAIGNS_AVAILABLE') {
      res.status(404).json({
        error: 'NO_CAMPAIGNS_AVAILABLE',
        message: 'No eligible campaigns are currently available in the surf exchange pool. Please check back shortly or create your own campaign!'
      });
      return;
    }
    console.error('Surf start error:', error);
    res.status(500).json({ error: 'Failed to start surf session' });
  }
});

/**
 * POST /api/surf/complete
 * Verifies dwell time & human challenge, awards credits, records visit
 */
surfRoutes.post('/complete', surfCompleteLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionToken, challengeAnswer, clientDwellSeconds } = req.body;

    if (!sessionToken || !challengeAnswer) {
      res.status(400).json({ error: 'Session token and human verification answer are required.' });
      return;
    }

    const result = TrafficExchangeService.completeSurfingSession(
      req.user!.id,
      String(sessionToken),
      String(challengeAnswer),
      Number(clientDwellSeconds) || 0
    );

    GA4Service.trackEvent('visit_completed', {
      creditsEarned: result.creditsEarned,
      visitorId: req.user!.id
    });

    res.json(result);
  } catch (error: any) {
    if (error?.code === 'INSUFFICIENT_DWELL') {
      res.status(400).json({
        error: 'Insufficient viewing duration.',
        code: 'INSUFFICIENT_DWELL',
        message: error.message,
        remainingSeconds: error.remainingSeconds || 1,
        requiredDwellSeconds: error.requiredDwellSeconds
      });
      return;
    }
    console.error('Surf complete error:', error);
    res.status(400).json({ error: 'Failed to verify and complete visit' });
  }
});

/**
 * GET /api/surf/engine-diagnostics
 * Live algorithm metrics, latency, and throughput
 */
surfRoutes.get('/engine-diagnostics', (req: AuthenticatedRequest, res: Response) => {
  try {
    const diagnostics = TrafficExchangeService.getEngineDiagnostics();
    res.json(diagnostics);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve engine diagnostics' });
  }
});

