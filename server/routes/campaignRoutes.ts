import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { CampaignReviewService } from '../services/campaignReviewService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { GA4Service } from '../services/ga4Service.js';
import { TrafficDeliveryWorkerService } from '../services/trafficDeliveryWorkerService.js';

export const campaignRoutes = Router();

// Apply auth to all campaign routes
campaignRoutes.use(authMiddleware);

/**
 * POST /api/campaigns/pre-validate
 * Live check of URL and category before submission
 */
campaignRoutes.post('/pre-validate', (req: AuthenticatedRequest, res: Response) => {
  const { url, title, campaignId } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }
  const result = CampaignReviewService.evaluateUrl(url, title || 'Campaign Preview', campaignId);
  res.json(result);
});

/**
 * GET /api/campaigns
 * List all campaigns belonging to the current user
 */
campaignRoutes.get('/', (req: AuthenticatedRequest, res: Response) => {
  const campaigns = db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user!.id);

  res.json({ campaigns });
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
campaignRoutes.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, url, durationSeconds, budget, category, dailyVisitLimit, targetLocations, deviceTargeting, ga4MeasurementId, ga4_measurement_id, ga4ApiSecret, ga4_api_secret } = req.body;

    if (!title || !url || !budget) {
      res.status(400).json({ error: 'Title, destination URL, and initial credit budget are required.' });
      return;
    }

    const cleanTitle = String(title).trim();
    const cleanUrl = String(url).trim();
    const cleanBudget = Number(budget);
    const duration = Math.max(10, Math.min(60, Number(durationSeconds) || 15));
    const dailyLimit = Math.max(1, Number(dailyVisitLimit) || 100);
    const cleanCategory = String(category || 'Tech & Software').trim();
    const cleanLocations = String(targetLocations || 'Worldwide').trim();
    const cleanDevice = String(deviceTargeting || 'all').trim();
    const cleanGa4Id = (ga4MeasurementId || ga4_measurement_id || '').trim().toUpperCase() || null;
    const cleanGa4Secret = (ga4ApiSecret || ga4_api_secret || '').trim() || null;

    if (cleanBudget < 5) {
      res.status(400).json({ error: 'Minimum initial campaign budget is 5.0 credits.' });
      return;
    }

    // Check user has enough credits
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as { credits: number };
    if (user.credits < cleanBudget) {
      res.status(400).json({ error: `Insufficient credits. You have ${user.credits.toFixed(2)} credits, but need ${cleanBudget.toFixed(2)}.` });
      return;
    }

    // Cost formula: base 1.0 credit for 15s + 0.05 per extra second
    const settings = db.prepare('SELECT base_credit_reward, cost_per_second FROM platform_settings WHERE id = ?').get('default') as {
      base_credit_reward: number;
      cost_per_second: number;
    } | undefined;

    const baseReward = settings?.base_credit_reward || 1.0;
    const costPerSec = settings?.cost_per_second || 0.05;
    const costPerVisit = Number((baseReward + Math.max(0, duration - 15) * costPerSec).toFixed(2));

    const campaignId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Lock credits by recording transaction
    CreditLedgerService.recordTransaction(
      req.user!.id,
      -cleanBudget,
      'campaign_spend',
      `Budget allocation for campaign: ${cleanTitle}`,
      campaignId
    );

    // 2. Insert campaign immediately as 'active' (instant live traffic deployment)
    db.prepare(`
      INSERT INTO campaigns (
        id, user_id, title, url, duration_seconds, credit_cost_per_visit,
        credit_budget, spent_credits, total_visits_received, status,
        category, daily_visit_limit, today_visits_received, target_locations,
        device_targeting, ga4_measurement_id, ga4_api_secret, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 0, 'active', ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).run(
      campaignId,
      req.user!.id,
      cleanTitle,
      cleanUrl,
      duration,
      costPerVisit,
      cleanBudget,
      cleanCategory,
      dailyLimit,
      cleanLocations,
      cleanDevice,
      cleanGa4Id,
      cleanGa4Secret,
      now,
      now
    );

    // 3. Process automated safety check in background (only flag/reject if malicious)
    const reviewOutcome = CampaignReviewService.processCampaignReview(campaignId, cleanTitle, cleanUrl);

    // 4. Log activity
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, ip_address, created_at)
      VALUES (?, ?, ?, 'campaign_created', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `Created and launched campaign "${cleanTitle}" with ${cleanBudget} credits budget (Status: ${reviewOutcome.status})`,
      req.ip || '127.0.0.1',
      now
    );

    GA4Service.trackEvent('campaign_created', {
      campaignId,
      budget: cleanBudget,
      status: reviewOutcome.status,
      duration
    });

    const createdCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);

    res.status(201).json({
      message: 'Campaign created and activated live immediately! +500,000 lifetime free visit bonus unlocked.',
      campaign: createdCampaign,
      reviewStatus: reviewOutcome.status,
      lifetimeBonusVisits: 500000
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign.' });
  }
});

/**
 * GET /api/campaigns/:id
 * Detailed stats for a single campaign
 */
campaignRoutes.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = AnalyticsService.getCampaignDetails(req.params.id, req.user!.id, req.user!.role === 'admin');
    res.json(data);
  } catch (error: any) {
    res.status(404).json({ error: 'Campaign not found.' });
  }
});

/**
 * PATCH /api/campaigns/:id/toggle
 * Pause or Resume an active/paused campaign
 */
campaignRoutes.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'active' && campaign.status !== 'paused') {
      res.status(400).json({ error: `Cannot toggle campaign in status "${campaign.status}".` });
      return;
    }

    const nextStatus = campaign.status === 'active' ? 'paused' : 'active';
    const now = new Date().toISOString();

    db.prepare('UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, campaign.id);

    res.json({ message: `Campaign is now ${nextStatus}.`, status: nextStatus });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * PATCH /api/campaigns/:id/settings
 * Update campaign destination URL, title, geo country targeting, category, daily limit, device options
 */
campaignRoutes.patch('/:id/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, url, targetLocations, deviceTargeting, category, dailyVisitLimit, durationSeconds } = req.body;

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const nextTitle = title !== undefined ? String(title).trim() : campaign.title;
    const nextUrl = url !== undefined ? String(url).trim() : campaign.url;
    const nextLocations = targetLocations !== undefined ? String(targetLocations).trim() : (campaign.target_locations || 'Worldwide');
    const nextDevice = deviceTargeting !== undefined ? String(deviceTargeting).trim() : (campaign.device_targeting || 'all');
    const nextCategory = category !== undefined ? String(category).trim() : (campaign.category || 'Tech & Software');
    const nextDailyLimit = dailyVisitLimit !== undefined ? Math.max(1, Number(dailyVisitLimit) || 100) : campaign.daily_visit_limit;
    
    let nextDuration = campaign.duration_seconds;
    let nextCostPerVisit = campaign.credit_cost_per_visit;

    if (durationSeconds !== undefined) {
      nextDuration = Math.max(10, Math.min(60, Number(durationSeconds) || 15));
      const settings = db.prepare('SELECT base_credit_reward, cost_per_second FROM platform_settings WHERE id = ?').get('default') as {
        base_credit_reward: number;
        cost_per_second: number;
      } | undefined;
      const baseReward = settings?.base_credit_reward || 1.0;
      const costPerSec = settings?.cost_per_second || 0.05;
      nextCostPerVisit = Number((baseReward + Math.max(0, nextDuration - 15) * costPerSec).toFixed(2));
    }

    if (!nextTitle) {
      res.status(400).json({ error: 'Campaign title cannot be empty.' });
      return;
    }

    if (!nextUrl || !/^https?:\/\//i.test(nextUrl)) {
      res.status(400).json({ error: 'Valid destination URL starting with http:// or https:// is required.' });
      return;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE campaigns
      SET title = ?,
          url = ?,
          target_locations = ?,
          device_targeting = ?,
          category = ?,
          daily_visit_limit = ?,
          duration_seconds = ?,
          credit_cost_per_visit = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      nextTitle,
      nextUrl,
      nextLocations,
      nextDevice,
      nextCategory,
      nextDailyLimit,
      nextDuration,
      nextCostPerVisit,
      now,
      campaign.id
    );

    // If destination URL changed, re-evaluate safety
    if (nextUrl !== campaign.url) {
      CampaignReviewService.processCampaignReview(campaign.id, nextTitle, nextUrl);
    }

    const updatedCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id);

    res.json({
      message: 'Campaign destination and targeting settings updated successfully!',
      campaign: updatedCampaign
    });
  } catch (error: any) {
    console.error('Error updating campaign settings:', error);
    res.status(500).json({ error: 'Failed to update campaign settings.' });
  }
});

/**
 * POST /api/campaigns/:id/budget
 * Add more credits to an existing campaign budget
 */
campaignRoutes.post('/:id/budget', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const cleanAmount = Number(amount);

    if (!cleanAmount || cleanAmount <= 0) {
      res.status(400).json({ error: 'Valid positive credit amount required.' });
      return;
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as { credits: number };
    if (user.credits < cleanAmount) {
      res.status(400).json({ error: 'Insufficient credits available in account.' });
      return;
    }

    // Deduct from account balance
    CreditLedgerService.recordTransaction(
      req.user!.id,
      -cleanAmount,
      'campaign_spend',
      `Budget increase for campaign: ${campaign.title}`,
      campaign.id
    );

    const newBudget = Number((campaign.credit_budget + cleanAmount).toFixed(4));
    const now = new Date().toISOString();

    // If campaign was completed and now has budget, reactivate if not paused/rejected
    let nextStatus = campaign.status;
    if (campaign.status === 'completed' && newBudget > campaign.spent_credits) {
      nextStatus = 'active';
    }

    db.prepare(`
      UPDATE campaigns 
      SET credit_budget = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newBudget, nextStatus, now, campaign.id);

    res.json({
      message: `Added +${cleanAmount} credits to campaign budget.`,
      newBudget,
      status: nextStatus
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Deletes a campaign and refunds unspent credits to user's balance
 */
campaignRoutes.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const unspent = Number(Math.max(0, campaign.credit_budget - campaign.spent_credits).toFixed(4));

    // If there is unspent budget, issue refund transaction
    if (unspent > 0) {
      CreditLedgerService.recordTransaction(
        req.user!.id,
        unspent,
        'refund',
        `Unused budget refund for deleted campaign: ${campaign.title}`,
        campaign.id
      );
    }

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaign.id);

    res.json({
      message: unspent > 0 
        ? `Campaign deleted and ${unspent.toFixed(2)} unspent credits returned to your balance.`
        : 'Campaign deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * POST /api/campaigns/:id/dispatch-traffic
 * Instantly delivers real exchange network visitor hits to the campaign
 */
campaignRoutes.post('/:id/dispatch-traffic', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { count } = req.body;
    const requestedCount = Math.max(1, Math.min(50, Number(count) || 5));

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const result = TrafficDeliveryWorkerService.dispatchBatchToCampaign(campaign.id, requestedCount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to dispatch traffic.' });
  }
});

/**
 * GET /api/campaigns/:id/verify-routing
 * Validates campaign traffic routing rules against system-wide configurations
 */
campaignRoutes.get('/:id/verify-routing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const verification = await TrafficDeliveryWorkerService.verifyCampaignRoutingConfig(campaign.id);
    res.json(verification);
  } catch (error: any) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

/**
 * GET /api/campaigns/system-routing-rules
 * Returns system-wide geo routing matrix and active profile rules
 */
campaignRoutes.get('/system/routing-rules', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const profiles = TrafficDeliveryWorkerService.getGeoProfiles();
    res.json({
      profiles,
      networkEngine: {
        ga4ProtocolOverride: 'uip (User IP Override) Enabled',
        forwardingHeaders: ['X-Forwarded-For', 'Client-IP', 'CF-Connecting-IP'],
        activeNodes: profiles.length,
        version: 'v2.4-geo-matrix'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

