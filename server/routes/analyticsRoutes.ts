import { Router, Response } from 'express';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { TrafficDebuggerService } from '../services/trafficDebuggerService.js';
import { GA4Service } from '../services/ga4Service.js';

export const analyticsRoutes = Router();

// User dashboard stats
analyticsRoutes.get('/dashboard', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = AnalyticsService.getUserStats(req.user!.id);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
});

// User weekly traffic breakdown and credits spent
analyticsRoutes.get('/weekly', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const weeklyData = AnalyticsService.getWeeklyAnalytics(req.user!.id);
    res.json(weeklyData);
  } catch (error: any) {
    console.error('Error fetching weekly analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly analytics.' });
  }
});

// User geographic traffic distribution & heat map verification
analyticsRoutes.get('/geo-distribution', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const geoData = AnalyticsService.getGeoTrafficDistribution(req.user!.id);
    res.json(geoData);
  } catch (error: any) {
    console.error('Error fetching geo distribution:', error);
    res.status(500).json({ error: 'Failed to retrieve geo distribution.' });
  }
});

// Global Traffic Log: Real-time raw visitor requests with detected vs simulated geo-proxy location status
analyticsRoutes.get('/global-traffic-log', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, country, status, search, limit } = req.query;
    const logData = AnalyticsService.getGlobalTrafficLog(req.user!.id, {
      campaignId: campaignId ? String(campaignId) : undefined,
      country: country ? String(country) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });
    res.json(logData);
  } catch (error: any) {
    console.error('Error fetching global traffic log:', error);
    res.status(500).json({ error: 'Failed to retrieve traffic log.' });
  }
});

// URL Browse Report: Complete breakdown of where URLs are being browsed, dwell times, and geo origins
analyticsRoutes.get('/url-browse-report', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeRange, search, campaignId, limit } = req.query;
    const reportData = AnalyticsService.getUrlBrowseReport(req.user!.id, {
      timeRange: timeRange ? String(timeRange) : undefined,
      search: search ? String(search) : undefined,
      campaignId: campaignId ? String(campaignId) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });
    res.json(reportData);
  } catch (error: any) {
    console.error('Error fetching URL browse report:', error);
    res.status(500).json({ error: 'Failed to retrieve URL browse report.' });
  }
});

// Time Lap & Dwell Duration Analytics: Page counts in time lap brackets and accumulated dwell times
analyticsRoutes.get('/time-laps', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeRange, search, campaignId, lapInterval, lapFilter, limit } = req.query;
    const lapData = AnalyticsService.getPageTimeLapAnalytics(req.user!.id, {
      timeRange: timeRange ? String(timeRange) : undefined,
      search: search ? String(search) : undefined,
      campaignId: campaignId ? String(campaignId) : undefined,
      lapInterval: lapInterval as any,
      lapFilter: lapFilter ? String(lapFilter) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });
    res.json(lapData);
  } catch (error: any) {
    console.error('Error fetching time lap analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve time lap analytics.' });
  }
});

// Traffic Debugger: Test campaign links against simulated geo-proxy & redirection inspector
analyticsRoutes.post('/debug-traffic', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TrafficDebuggerService.debugTraffic(req.user!.id, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error debugging traffic:', error);
    res.status(400).json({ error: 'Traffic debugging failed' });
  }
});

// GA4 Tag Scanner: Deep scan of URL to check Google Analytics tags and SPA configuration
analyticsRoutes.post('/ga4-scan', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Destination URL is required' });
      return;
    }
    const result = await GA4Service.scanWebsiteForGATags(String(url));
    res.json(result);
  } catch (error: any) {
    console.error('Error scanning URL for GA4 tags:', error);
    res.status(500).json({ error: 'Failed to scan URL for GA4 tags' });
  }
});

// GA4 Realtime Test Ping: Dispatch live test beacon to user's Google Analytics property
analyticsRoutes.post('/ga4-test-ping', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url, measurementId, campaignId, countryCode } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Destination URL is required' });
      return;
    }
    const result = await GA4Service.sendTestPing({
      userId: req.user!.id,
      campaignId,
      url: String(url),
      measurementId: measurementId ? String(measurementId) : undefined,
      countryCode: countryCode ? String(countryCode) : 'IN'
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error dispatching GA4 test ping:', error);
    res.status(400).json({ error: 'Failed to dispatch test ping to Google Analytics' });
  }
});

// GA4 Delivery Logs: Retrieve recent real-time Google Analytics dispatch logs
analyticsRoutes.get('/ga4-delivery-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, limit } = req.query;
    const logs = GA4Service.getRecentDeliveryLogs(req.user!.id, {
      campaignId: campaignId ? String(campaignId) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });
    res.json({ logs });
  } catch (error: any) {
    console.error('Error fetching GA4 delivery logs:', error);
    res.status(500).json({ error: 'Failed to retrieve delivery logs.' });
  }
});

// Platform stats (admin-only)
analyticsRoutes.get('/platform', authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = AnalyticsService.getPlatformStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: 'Failed to retrieve platform stats.' });
  }
});
