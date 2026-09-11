import crypto from 'node:crypto';
import { db } from '../database/db.js';

export interface NotificationPayload {
  type: 'campaign_status' | 'campaign_upgrade' | 'user_inactivity' | 'user_reactivated' | 'system' | 'credit';
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Insert a new notification for a specific user
   */
  static createNotification(userId: string, payload: NotificationPayload) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const metadataJson = payload.metadata ? JSON.stringify(payload.metadata) : null;

    db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, link, read, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      userId,
      payload.type,
      payload.title,
      payload.message,
      payload.link || null,
      metadataJson,
      now
    );

    return {
      id,
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      read: false,
      metadata: payload.metadata || {},
      created_at: now
    };
  }

  /**
   * Retrieve notifications for a user, formatted with parsed metadata
   */
  static getUserNotifications(userId: string, limit = 50) {
    const rows = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      type: r.type,
      title: r.title,
      message: r.message,
      link: r.link,
      read: Boolean(r.read),
      metadata: r.metadata_json ? JSON.parse(r.metadata_json) : {},
      created_at: r.created_at
    }));
  }

  /**
   * Get unread notifications count for a user
   */
  static getUnreadCount(userId: string): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND read = 0
    `).get(userId) as { count: number };

    return row?.count || 0;
  }

  /**
   * Mark a single notification as read
   */
  static markAsRead(userId: string, notificationId: string): boolean {
    const res = db.prepare(`
      UPDATE notifications 
      SET read = 1 
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);

    return res.changes > 0;
  }

  /**
   * Mark all notifications for a user as read
   */
  static markAllAsRead(userId: string): number {
    const res = db.prepare(`
      UPDATE notifications 
      SET read = 1 
      WHERE user_id = ? AND read = 0
    `).run(userId);

    return Number(res.changes);
  }

  /**
   * Delete a specific notification
   */
  static deleteNotification(userId: string, notificationId: string): boolean {
    const res = db.prepare(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);

    return Number(res.changes) > 0;
  }

  /**
   * Clear read notifications for a user
   */
  static clearReadNotifications(userId: string): number {
    const res = db.prepare(`
      DELETE FROM notifications 
      WHERE user_id = ? AND read = 1
    `).run(userId);

    return Number(res.changes);
  }

  /**
   * Dispatch campaign status transition notification
   * Especially triggers celebration and high-visibility alert when 'test' -> 'active'
   */
  static notifyCampaignTransition(campaignId: string, fromStatus: string, toStatus: string) {
    const campaign = db.prepare(`
      SELECT id, user_id, title, url, category, duration_seconds, credit_budget, target_locations 
      FROM campaigns WHERE id = ?
    `).get(campaignId) as any;

    if (!campaign) return null;

    let title = `Campaign Status Updated`;
    let message = `Your campaign "${campaign.title}" is now ${toStatus}.`;
    let type: NotificationPayload['type'] = 'campaign_status';

    if (fromStatus === 'test' && toStatus === 'active') {
      title = `🎉 Campaign Activated: Live Traffic Online!`;
      message = `Your campaign "${campaign.title}" has transitioned from 'test' to 'active' status! Real visitors and verified GA4 dwell sessions are now routing to your business destination.`;
    } else if (toStatus === 'active') {
      title = `🟢 Campaign Resumed Live`;
      message = `Traffic delivery for "${campaign.title}" is active and receiving live exchange impressions.`;
    } else if (toStatus === 'test') {
      title = `🧪 Campaign In Test Mode`;
      message = `Campaign "${campaign.title}" switched to test mode for preview & tag verification.`;
    } else if (toStatus === 'paused') {
      title = `⏸️ Campaign Delivery Paused`;
      message = `Traffic allocation for "${campaign.title}" is temporarily paused.`;
    } else if (toStatus === 'completed') {
      title = `🏁 Campaign Budget Completed`;
      message = `Campaign "${campaign.title}" has delivered all allocated credits. Add budget to resume live traffic.`;
    }

    return this.createNotification(campaign.user_id, {
      type,
      title,
      message,
      link: `/campaigns`,
      metadata: {
        campaign_id: campaign.id,
        campaign_title: campaign.title,
        campaign_url: campaign.url,
        from_status: fromStatus,
        to_status: toStatus,
        category: campaign.category
      }
    });
  }

  /**
   * Mark user inactive and trigger an alert
   */
  static notifyUserInactivity(userId: string, reason = 'Prolonged inactivity detected') {
    const now = new Date().toISOString();

    // 1. Update user record in database
    db.prepare(`
      UPDATE users 
      SET status = 'inactive', 
          inactivity_reason = ? 
      WHERE id = ? AND status != 'suspended'
    `).run(reason, userId);

    // 2. Dispatch high-priority global notification
    return this.createNotification(userId, {
      type: 'user_inactivity',
      title: `⚠️ Account Marked Inactive (Idle Protection)`,
      message: `Your account was marked inactive due to inactivity (${reason}). Automated exchange traffic routing has been paused to protect your credits. Click to reactivate your session.`,
      link: `/profile`,
      metadata: {
        reason,
        timestamp: now,
        actionRequired: 'reactivate'
      }
    });
  }

  /**
   * Restore user to active and notify
   */
  static notifyUserReactivated(userId: string) {
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET status = 'active', 
          inactivity_reason = NULL, 
          last_active_at = ? 
      WHERE id = ? AND status != 'suspended'
    `).run(now, userId);

    return this.createNotification(userId, {
      type: 'user_reactivated',
      title: `✅ Account Reactivated Successfully`,
      message: `Welcome back! Your account has been reactivated. Surfing exchange and campaign deliveries have resumed operational status.`,
      link: `/dashboard`,
      metadata: {
        reactivated_at: now
      }
    });
  }

  /**
   * Dispatch campaign tier upgrade notification
   */
  static notifyCampaignUpgrade(campaignId: string, tierName: string, category: string, creditsAdded = 0) {
    const campaign = db.prepare(`SELECT * FROM campaigns WHERE id = ?`).get(campaignId) as any;
    if (!campaign) return null;

    return this.createNotification(campaign.user_id, {
      type: 'campaign_upgrade',
      title: `⭐ Campaign Upgraded to ${tierName}!`,
      message: `Campaign "${campaign.title}" was upgraded with active business category [${category}]. Short banner live results are now streaming in real-time.`,
      link: `/campaigns`,
      metadata: {
        campaign_id: campaign.id,
        tier: tierName,
        category,
        credits_added: creditsAdded
      }
    });
  }
}
