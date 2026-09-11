import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { CampaignReviewService } from '../services/campaignReviewService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { GA4Service } from '../services/ga4Service.js';
import { TrafficDeliveryWorkerService } from '../services/trafficDeliveryWorkerService.js';
import { NotificationService } from '../services/notificationService.js';
import { SeoService } from '../services/seoService.js';
import { CampaignPoolService } from '../services/campaignPoolService.js';

export const campaignRoutes = Router();

// Apply auth to all campaign routes
campaignRoutes.use(authMiddleware);

/**
 * GET /api/campaigns/active
 * Returns the current active pool of campaigns for exchange cycling
 */
campaignRoutes.get('/active', (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = CampaignPoolService.getActivePool(req.user!.id);
    res.json({
      campaigns: pool.sites,
      sites: pool.sites,
      total: pool.total,
      eligibleTotal: pool.eligibleTotal,
      poolVersion: pool.poolVersion,
      updatedAt: pool.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve active campaigns' });
  }
});

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
  const campaigns = (db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user!.id) as any[]).map(c => {
    let urls: string[] = [c.url];
    if (c.urls_json) {
      try {
        const parsed = JSON.parse(c.urls_json);
        if (Array.isArray(parsed) && parsed.length > 0) urls = parsed;
      } catch {}
    }
    return { ...c, urls };
  });

  res.json({ campaigns });
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
campaignRoutes.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, url, urls, durationSeconds, budget, category, dailyVisitLimit, targetLocations, deviceTargeting, ga4MeasurementId, ga4_measurement_id, ga4ApiSecret, ga4_api_secret, initialStatus } = req.body;

    const validUrls = TrafficDeliveryWorkerService.parseUrls(urls || url);
    if (validUrls.length === 0) {
      res.status(400).json({ error: 'At least one valid destination URL starting with http:// or https:// is required.' });
      return;
    }

    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      res.status(400).json({ error: 'Campaign title is required.' });
      return;
    }

    const cleanUrl = validUrls[0];
    const urlsJson = JSON.stringify(validUrls);
    const cleanBudget = Number(budget);
    const duration = Math.max(10, Math.min(60, Number(durationSeconds) || 15));
    const dailyLimit = Math.max(1, Number(dailyVisitLimit) || 100);
    const cleanCategory = String(category || 'Tech & Software').trim();
    const cleanLocations = String(targetLocations || 'Worldwide').trim();
    const cleanDevice = String(deviceTargeting || 'all').trim();
    const cleanGa4Id = (ga4MeasurementId || ga4_measurement_id || '').trim().toUpperCase() || null;
    const cleanGa4Secret = (ga4ApiSecret || ga4_api_secret || '').trim() || null;
    const campaignStatus = initialStatus === 'test' ? 'test' : 'active';

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

    // 2. Insert campaign (supports multiple URLs, rotation cursor, and auto_progress)
    db.prepare(`
      INSERT INTO campaigns (
        id, user_id, title, url, urls_json, url_cursor, country_cursor, auto_progress,
        duration_seconds, credit_cost_per_visit, credit_budget, spent_credits,
        total_visits_received, total_clicks_received, status, category, daily_visit_limit,
        today_visits_received, target_locations, device_targeting, ga4_measurement_id,
        ga4_api_secret, interactive_clicks_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?, 0.0, 0, 0, ?, ?, ?, 0, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      campaignId,
      req.user!.id,
      cleanTitle,
      cleanUrl,
      urlsJson,
      duration,
      costPerVisit,
      cleanBudget,
      campaignStatus,
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

    console.log(`[CAMPAIGN CREATED] ID=${campaignId} Title="${cleanTitle}" URLs=${validUrls.length} Budget=${cleanBudget} CR Duration=${duration}s`);
    console.log(`[CAMPAIGN QUEUED] ID=${campaignId} Status=${reviewOutcome.status} NextURL=${cleanUrl} TargetGeo="${cleanLocations}"`);

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
      duration,
      urlCount: validUrls.length
    });

    const createdCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as any;
    createdCampaign.urls = validUrls;

    // Synchronize public indexable SEO record for search console readiness
    SeoService.syncCampaignSeo(campaignId);

    // Increment central campaign pool version for instant SSE & live cycle refresh
    CampaignPoolService.incrementVersion('campaign_created');

    res.status(201).json({
      message: 'Campaign created and activated live immediately!',
      campaign: createdCampaign,
      reviewStatus: reviewOutcome.status
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to create campaign' });
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
    res.status(404).json({ error: error.message || 'Campaign not found' });
  }
});

/**
 * PATCH /api/campaigns/:id/toggle
 * Pause, Resume, or Activate a campaign (supports test -> active transition)
 */
campaignRoutes.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'active' && campaign.status !== 'paused' && campaign.status !== 'test') {
      res.status(400).json({ error: `Cannot toggle campaign in status "${campaign.status}".` });
      return;
    }

    const prevStatus = campaign.status;
    let nextStatus = 'active';

    if (prevStatus === 'active') {
      nextStatus = 'paused';
    } else if (prevStatus === 'paused') {
      nextStatus = 'active';
    } else if (prevStatus === 'test') {
      nextStatus = 'active';
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, campaign.id);

    // Notify pool update
    CampaignPoolService.incrementVersion(`campaign_status_${nextStatus}`);

    // Trigger transition notification (celebratory alert if test -> active)
    let notification: any = null;
    if (prevStatus === 'test' && nextStatus === 'active') {
      notification = NotificationService.notifyCampaignTransition(campaign.id, 'test', 'active');
    } else {
      notification = NotificationService.notifyCampaignTransition(campaign.id, prevStatus, nextStatus);
    }

    res.json({
      message: `Campaign transitioned from ${prevStatus} to ${nextStatus}.`,
      status: nextStatus,
      notification
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/transition-status
 * Explicitly transition campaign status (e.g. from 'test' to 'active')
 */
campaignRoutes.post('/:id/transition-status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status: requestedStatus } = req.body;
    const validStatuses = ['active', 'test', 'paused'];

    if (!validStatuses.includes(requestedStatus)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const prevStatus = campaign.status;
    const now = new Date().toISOString();

    db.prepare('UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?').run(requestedStatus, now, campaign.id);

    CampaignPoolService.incrementVersion(`campaign_transition_${requestedStatus}`);

    const notification = NotificationService.notifyCampaignTransition(campaign.id, prevStatus, requestedStatus);

    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id);

    res.json({
      message: `Campaign successfully updated to ${requestedStatus}.`,
      campaign: updated,
      notification
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/upgrade
 * Upgrades campaign with active category, tier, optional boost credits, and sets status to 'active'
 */
campaignRoutes.post('/:id/upgrade', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tier = 'pro_commercial', category, boostCredits = 0 } = req.body;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const cleanBoost = Math.max(0, Number(boostCredits) || 0);
    const cleanCategory = category ? String(category).trim() : campaign.category;
    const prevStatus = campaign.status;
    const nextStatus = 'active'; // Upgrading activates campaign immediately

    if (cleanBoost > 0) {
      const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as { credits: number };
      if (user.credits < cleanBoost) {
        res.status(400).json({ error: `Insufficient credits for upgrade boost. Required: ${cleanBoost} CR, Available: ${user.credits.toFixed(2)} CR.` });
        return;
      }

      CreditLedgerService.recordTransaction(
        req.user!.id,
        -cleanBoost,
        'campaign_spend',
        `Upgrade boost allocation for campaign: ${campaign.title}`,
        campaign.id
      );

      db.prepare(`
        UPDATE campaigns 
        SET credit_budget = credit_budget + ?,
            status = ?,
            category = ?,
            tier = ?,
            updated_at = ?
        WHERE id = ?
      `).run(cleanBoost, nextStatus, cleanCategory, tier, new Date().toISOString(), campaign.id);
    } else {
      db.prepare(`
        UPDATE campaigns 
        SET status = ?,
            category = ?,
            tier = ?,
            updated_at = ?
        WHERE id = ?
      `).run(nextStatus, cleanCategory, tier, new Date().toISOString(), campaign.id);
    }

    // Trigger notifications
    if (prevStatus === 'test') {
      NotificationService.notifyCampaignTransition(campaign.id, 'test', 'active');
    }
    const upgradeNotification = NotificationService.notifyCampaignUpgrade(campaign.id, tier, cleanCategory, cleanBoost);

    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id);

    res.json({
      message: `Campaign upgraded to ${tier} successfully!`,
      campaign: updated,
      notification: upgradeNotification
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/campaigns/:id/settings
 * Update campaign destination URL, title, geo country targeting, category, daily limit, device options
 */
campaignRoutes.patch('/:id/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, url, urls, targetLocations, deviceTargeting, category, dailyVisitLimit, durationSeconds, ga4MeasurementId, ga4_measurement_id, ga4ApiSecret, ga4_api_secret, interactiveClicksEnabled, interactive_clicks_enabled, status, autoProgress, auto_progress } = req.body;

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const nextTitle = title !== undefined ? String(title).trim() : campaign.title;
    
    let nextUrlsJson = campaign.urls_json;
    let nextUrl = campaign.url;

    if (urls !== undefined || url !== undefined) {
      const validUrls = TrafficDeliveryWorkerService.parseUrls(urls !== undefined ? urls : url);
      if (validUrls.length > 0) {
        nextUrlsJson = JSON.stringify(validUrls);
        nextUrl = validUrls[0];
      }
    }

    const nextLocations = targetLocations !== undefined ? String(targetLocations).trim() : (campaign.target_locations || 'Worldwide');
    const nextDevice = deviceTargeting !== undefined ? String(deviceTargeting).trim() : (campaign.device_targeting || 'all');
    const nextCategory = category !== undefined ? String(category).trim() : (campaign.category || 'Tech & Software');
    const nextDailyLimit = dailyVisitLimit !== undefined ? Math.max(1, Number(dailyVisitLimit) || 100) : campaign.daily_visit_limit;
    const nextStatus = status !== undefined && ['active', 'test', 'paused'].includes(status) ? status : campaign.status;
    
    let nextAutoProgress = campaign.auto_progress ?? 1;
    if (autoProgress !== undefined || auto_progress !== undefined) {
      const val = autoProgress !== undefined ? autoProgress : auto_progress;
      nextAutoProgress = val ? 1 : 0;
    }

    let nextInteractiveClicks = campaign.interactive_clicks_enabled ?? 1;
    if (interactiveClicksEnabled !== undefined || interactive_clicks_enabled !== undefined) {
      const val = interactiveClicksEnabled !== undefined ? interactiveClicksEnabled : interactive_clicks_enabled;
      nextInteractiveClicks = val ? 1 : 0;
    }
    
    let nextGa4Id = campaign.ga4_measurement_id;
    if (ga4MeasurementId !== undefined || ga4_measurement_id !== undefined) {
      const rawId = (ga4MeasurementId !== undefined ? ga4MeasurementId : ga4_measurement_id);
      nextGa4Id = rawId ? String(rawId).trim().toUpperCase() : null;
    }

    let nextGa4Secret = campaign.ga4_api_secret;
    if (ga4ApiSecret !== undefined || ga4_api_secret !== undefined) {
      const rawSec = (ga4ApiSecret !== undefined ? ga4ApiSecret : ga4_api_secret);
      nextGa4Secret = rawSec ? String(rawSec).trim() : null;
    }

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
          urls_json = ?,
          target_locations = ?,
          device_targeting = ?,
          category = ?,
          daily_visit_limit = ?,
          duration_seconds = ?,
          credit_cost_per_visit = ?,
          ga4_measurement_id = ?,
          ga4_api_secret = ?,
          interactive_clicks_enabled = ?,
          auto_progress = ?,
          status = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      nextTitle,
      nextUrl,
      nextUrlsJson,
      nextLocations,
      nextDevice,
      nextCategory,
      nextDailyLimit,
      nextDuration,
      nextCostPerVisit,
      nextGa4Id,
      nextGa4Secret,
      nextInteractiveClicks,
      nextAutoProgress,
      nextStatus,
      now,
      campaign.id
    );

    // If destination URL changed, re-evaluate safety
    if (nextUrl !== campaign.url) {
      CampaignReviewService.processCampaignReview(campaign.id, nextTitle, nextUrl);
    }

    // Trigger notification if status transitioned
    let notification: any = null;
    if (campaign.status !== nextStatus) {
      notification = NotificationService.notifyCampaignTransition(campaign.id, campaign.status, nextStatus);
    }

    const updatedCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id) as any;
    if (updatedCampaign.urls_json) {
      try {
        const parsed = JSON.parse(updatedCampaign.urls_json);
        if (Array.isArray(parsed) && parsed.length > 0) updatedCampaign.urls = parsed;
      } catch {}
    } else {
      updatedCampaign.urls = [updatedCampaign.url];
    }

    res.json({
      message: 'Campaign destination and targeting settings updated successfully!',
      campaign: updatedCampaign,
      notification
    });
  } catch (error: any) {
    console.error('Error updating campaign settings:', error);
    res.status(500).json({ error: error.message || 'Failed to update campaign settings' });
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
    res.status(500).json({ error: error.message });
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

    CampaignPoolService.incrementVersion('campaign_deleted');

    res.json({
      message: unspent > 0 
        ? `Campaign deleted and ${unspent.toFixed(2)} unspent credits returned to your balance.`
        : 'Campaign deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/dispatch-traffic
 * Instantly delivers real exchange network visitor hits to the campaign
 */
campaignRoutes.post('/:id/dispatch-traffic', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { count } = req.body;
    const requestedCount = Math.max(1, Math.min(50, Number(count) || 5));

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const result = await TrafficDeliveryWorkerService.dispatchBatchToCampaign(campaign.id, requestedCount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to dispatch traffic' });
  }
});

/**
 * POST /api/campaigns/:id/step
 * Delivers exactly one visit step for testing or immediate UI progression
 */
campaignRoutes.post('/:id/step', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const result = await TrafficDeliveryWorkerService.stepSingleVisit(campaign.id);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to execute next visit step' });
  }
});

/**
 * POST /api/campaigns/:id/next-visit
 * Alias to /step
 */
campaignRoutes.post('/:id/next-visit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const result = await TrafficDeliveryWorkerService.stepSingleVisit(campaign.id);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to execute next visit' });
  }
});

/**
 * GET /api/campaigns/:id/visits
 * List recent visits for this campaign including target_url and visitor_country
 */
campaignRoutes.get('/:id/visits', (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const visits = db.prepare(`
      SELECT id, campaign_id, target_url, visitor_country, visitor_country_code, visitor_device,
             duration_seconds, actual_dwell_seconds, credits_charged, status, http_status,
             ip_address, created_at, completed_at
      FROM visits
      WHERE campaign_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(campaign.id);

    res.json({ visits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/scheduler/tick
 * Triggers one immediate execution tick across all active campaigns in queue
 */
campaignRoutes.post('/scheduler/tick', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TrafficDeliveryWorkerService.tickScheduler();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Scheduler tick execution failed' });
  }
});

/**
 * GET /api/campaigns/scheduler/status
 * Returns current scheduler queue health and status
 */
campaignRoutes.get('/scheduler/status', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = TrafficDeliveryWorkerService.getSchedulerStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message || 'Verification failed' });
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
    res.status(500).json({ error: error.message });
  }
});

