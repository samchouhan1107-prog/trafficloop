import { Router, Response } from 'express';
import { RewardService } from '../services/rewardService.js';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

export const rewardRoutes = Router();

// Rate limiter for claim requests: max 12 claims per minute per IP/user
const claimRateLimiter = createRateLimiter(12, 60 * 1000, 'Too many claim requests. Please wait a minute before collecting more rewards.');

/**
 * GET /api/rewards/summary
 * Accessible publicly or with auth.
 * Returns India Campaign (450K) verified stats, user reward overview, and separated analytics.
 */
rewardRoutes.get('/summary', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const summary = RewardService.getSummary(userId);
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching rewards summary:', error);
    res.status(500).json({ error: 'Failed to fetch rewards summary' });
  }
});

/**
 * GET /api/rewards/activity
 * Protected endpoint.
 * Returns user's verified activity logs (today, this month, history) without exposing raw IPs.
 */
rewardRoutes.get('/activity', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const activity = RewardService.getActivity(userId);
    res.json(activity);
  } catch (error: any) {
    console.error('Error fetching rewards activity:', error);
    res.status(500).json({ error: 'Failed to fetch rewards activity' });
  }
});

/**
 * GET /api/rewards/eligibility
 * Protected endpoint.
 * Returns ledger items with status (ELIGIBLE, CLAIMED, PENDING, REJECTED, EXPIRED).
 */
rewardRoutes.get('/eligibility', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const offset = Math.max(0, parseInt(String(req.query.offset || '0'), 10));

    const eligibility = RewardService.getEligibility(userId, limit, offset);
    res.json(eligibility);
  } catch (error: any) {
    console.error('Error fetching rewards eligibility:', error);
    res.status(500).json({ error: 'Failed to fetch rewards eligibility' });
  }
});

/**
 * POST /api/rewards/claim
 * Protected & Rate-limited endpoint.
 * Claims single reward or all eligible rewards atomically.
 */
rewardRoutes.post('/claim', authMiddleware, claimRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rewardId, claimAll } = req.body;

    if (!rewardId && !claimAll) {
      res.status(400).json({ error: 'Please provide either a rewardId or specify claimAll: true.' });
      return;
    }

    const result = RewardService.claimReward(userId, { rewardId, claimAll });
    res.json(result);
  } catch (error: any) {
    console.warn('[RewardClaim Rejected]:', error?.message || error);
    const statusCode = error.message?.includes('not found') || error.message?.includes('already been claimed') || error.message?.includes('not eligible') ? 400 : 500;
    res.status(statusCode).json({ error: 'Failed to claim reward' });
  }
});
