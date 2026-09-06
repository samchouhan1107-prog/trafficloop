import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { AnalyticsService } from '../services/analyticsService.js';

export const systemRoutes = Router();

/**
 * GET /api/health
 */
systemRoutes.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TrafficLoop WebZoneBW Exchange Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/system/public-stats
 * Live metrics ticker for landing page and ecosystem stats
 */
systemRoutes.get('/public-stats', (req: Request, res: Response) => {
  try {
    const stats = AnalyticsService.getPlatformStats();
    const activeCampaignCount = (db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status = 'active'").get() as any).c;

    res.json({
      totalUsers: stats.total_users,
      activeCampaigns: activeCampaignCount,
      totalVisitsCompleted: stats.total_visits_completed,
      visitsToday: stats.visits_today,
      totalCreditsExchanged: stats.total_credits_exchanged,
      ecosystem: 'WebZoneBW Traffic Network'
    });
  } catch (error: any) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to retrieve public stats.' });
  }
});
