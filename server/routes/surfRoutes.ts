import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { TrafficExchangeService } from '../services/trafficExchangeService.js';
import { GA4Service } from '../services/ga4Service.js';
import { RewardService } from '../services/rewardService.js';
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
    res.status(500).json({ error: error.message || 'Failed to start surf session' });
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

    try {
      RewardService.processUserActivity(
        req.user!.id,
        (req as any).session?.id,
        {
          eventType: 'surf_dwell_verified',
          feature: 'surf_arena',
          path: '/surf',
          metadata: {
            visitId: result.visitId,
            creditsEarned: result.creditsEarned,
            dwellSeconds: result.dwellSeconds
          },
          eventId: `surf-visit-${result.visitId}`
        },
        req.ip,
        req.headers['user-agent'] as string
      );
    } catch (rewardErr) {
      console.warn('[surfRoutes] Error awarding reward points for visit:', rewardErr);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Surf complete error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify and complete visit' });
  }
});

/**
 * POST /api/surf/register-click
 * Registers an authentic visitor click on the surfed webpage, awarding engagement credits and firing a GA4 'click' beacon
 */
surfRoutes.post('/register-click', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionToken, clickType, linkUrl, linkText } = req.body;

    if (!sessionToken) {
      res.status(400).json({ error: 'Session token is required.' });
      return;
    }

    const result = TrafficExchangeService.registerVisitorClick(
      req.user!.id,
      String(sessionToken),
      clickType || 'in_frame',
      linkUrl ? String(linkUrl) : undefined,
      linkText ? String(linkText) : undefined
    );

    res.json(result);
  } catch (error: any) {
    console.error('Register click error:', error);
    res.status(400).json({ error: error.message || 'Failed to register click on webpage' });
  }
});

/**
 * POST /api/surf/heartbeat
 * Records active vs background dwell time based on client tab visibility and window focus
 */
surfRoutes.post('/heartbeat', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionToken, isVisible, isFocused } = req.body;

    if (!sessionToken) {
      res.status(400).json({ error: 'Session token is required.' });
      return;
    }

    const result = TrafficExchangeService.recordHeartbeat(
      req.user!.id,
      String(sessionToken),
      Boolean(isVisible !== false),
      Boolean(isFocused !== false)
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Heartbeat update failed' });
  }
});

/**
 * GET /api/surf/inspect-url
 * Proactively verifies headers and iframe embeddability of a target URL
 */
surfRoutes.get('/inspect-url', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const url = req.query.url as string;
    const campaignId = (req.query.campaignId as string) || 'inspect';

    if (!url) {
      res.status(400).json({ error: 'URL query parameter is required.' });
      return;
    }

    const { CampaignAvailabilityService } = await import('../services/campaignAvailabilityService.js');
    const result = await CampaignAvailabilityService.checkCampaignAvailability(campaignId, url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Inspection failed' });
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
    res.status(500).json({ error: error.message || 'Failed to retrieve engine diagnostics' });
  }
});

