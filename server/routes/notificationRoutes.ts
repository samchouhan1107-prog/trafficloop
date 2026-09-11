import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { db } from '../database/db.js';

export const notificationRoutes = Router();

// Require authentication for all notification routes
notificationRoutes.use(authMiddleware);

/**
 * GET /api/notifications
 * Fetch user's notification list and unread count
 */
notificationRoutes.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const notifications = NotificationService.getUserNotifications(userId, limit);
    const unreadCount = NotificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
notificationRoutes.post('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = NotificationService.markAsRead(userId, notificationId);
    const unreadCount = NotificationService.getUnreadCount(userId);

    res.json({
      success,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all user notifications as read
 */
notificationRoutes.post('/read-all', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const updatedCount = NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      updatedCount,
      unreadCount: 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
notificationRoutes.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = NotificationService.deleteNotification(userId, notificationId);
    const unreadCount = NotificationService.getUnreadCount(userId);

    res.json({
      success,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

/**
 * POST /api/notifications/clear
 * Clear all read notifications
 */
notificationRoutes.post('/clear', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const clearedCount = NotificationService.clearReadNotifications(userId);
    const unreadCount = NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      clearedCount,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear notifications' });
  }
});

/**
 * POST /api/notifications/test-event
 * Test / Simulation endpoint to trigger global notifications (Campaign transition test->active, user inactivity, etc.)
 */
notificationRoutes.post('/test-event', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventType, campaignId, reason } = req.body;

    let resultNotification: any = null;

    if (eventType === 'campaign_test_to_active') {
      // Find a user campaign or create a reference one
      let targetCampaign = campaignId 
        ? db.prepare('SELECT id, title FROM campaigns WHERE id = ? AND user_id = ?').get(campaignId, userId) as any
        : db.prepare('SELECT id, title FROM campaigns WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;

      if (!targetCampaign) {
        // Create mock campaign id for demonstration
        resultNotification = NotificationService.createNotification(userId, {
          type: 'campaign_status',
          title: '🎉 Campaign Activated: Live Traffic Online!',
          message: 'Your campaign "WebZone Business Showcase" has transitioned from \'test\' to \'active\' status! Real visitors and verified GA4 dwell sessions are now routing to your business destination.',
          link: '/campaigns',
          metadata: { from_status: 'test', to_status: 'active' }
        });
      } else {
        db.prepare("UPDATE campaigns SET status = 'active', updated_at = ? WHERE id = ?").run(new Date().toISOString(), targetCampaign.id);
        resultNotification = NotificationService.notifyCampaignTransition(targetCampaign.id, 'test', 'active');
      }
    } else if (eventType === 'user_inactivity') {
      resultNotification = NotificationService.notifyUserInactivity(
        userId, 
        reason || 'Session idle timeout (5+ min inactivity detected)'
      );
    } else if (eventType === 'user_reactivated') {
      resultNotification = NotificationService.notifyUserReactivated(userId);
    } else {
      resultNotification = NotificationService.createNotification(userId, {
        type: 'system',
        title: 'System Notification',
        message: 'Platform update complete: Global Notification and Inactivity Sentinel operational.',
        link: '/dashboard'
      });
    }

    const unreadCount = NotificationService.getUnreadCount(userId);
    res.json({
      success: true,
      notification: resultNotification,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create test notification' });
  }
});
