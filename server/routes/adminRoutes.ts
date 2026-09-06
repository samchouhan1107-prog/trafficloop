import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { AnalyticsService } from '../services/analyticsService.js';

export const adminRoutes = Router();

// Enforce authentication AND admin role for all /api/admin/* endpoints
adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

/**
 * GET /api/admin/overview
 * Combined stats for admin control center
 */
adminRoutes.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = AnalyticsService.getPlatformStats();
    const pendingReviewsCount = (db.prepare("SELECT COUNT(*) as c FROM campaign_reviews WHERE status = 'pending'").get() as any).c;
    const recentLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 15').all();
    const recentAdminActions = db.prepare('SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 15').all();

    res.json({
      stats,
      pendingReviewsCount,
      recentLogs,
      recentAdminActions
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * GET /api/admin/users
 * List and filter all registered users
 */
adminRoutes.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : '%';
  const role = req.query.role ? String(req.query.role) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;

  let query = 'SELECT id, email, name, role, credits, total_earned_credits, total_spent_credits, total_visits_made, total_visits_received, status, created_at, last_login_at FROM users WHERE (email LIKE ? OR name LIKE ?)';
  const params: any[] = [search, search];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

/**
 * POST /api/admin/users/:id/adjust-credits
 * Manually grant or deduct credits with an audit trail
 */
adminRoutes.post('/users/:id/adjust-credits', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, reason } = req.body;
    const cleanAmount = Number(amount);

    if (isNaN(cleanAmount) || cleanAmount === 0) {
      res.status(400).json({ error: 'Valid non-zero adjustment amount is required.' });
      return;
    }

    const targetUser = db.prepare('SELECT id, name, email, credits FROM users WHERE id = ?').get(req.params.id) as any;
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const { newBalance } = CreditLedgerService.recordTransaction(
      targetUser.id,
      cleanAmount,
      'adjustment',
      `Admin adjustment by ${req.user!.name}: ${reason || 'Manual platform correction'}`,
      req.user!.id
    );

    const now = new Date().toISOString();

    // Log admin action audit
    db.prepare(`
      INSERT INTO admin_actions (id, admin_id, admin_name, action, target_id, target_type, details, created_at)
      VALUES (?, ?, ?, 'credit_adjustment', ?, 'user', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.name,
      targetUser.id,
      `Adjusted ${targetUser.email} credits by ${cleanAmount > 0 ? '+' : ''}${cleanAmount} (New balance: ${newBalance}). Reason: ${reason || 'N/A'}`,
      now
    );

    res.json({
      message: `Adjusted credits for ${targetUser.name} by ${cleanAmount > 0 ? '+' : ''}${cleanAmount}.`,
      newBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Ban, suspend, or reactivate a user account
 */
adminRoutes.patch('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, role } = req.body;
    const targetUser = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.params.id) as any;

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot modify your own administrator status.' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status && (status === 'active' || status === 'suspended')) {
      updates.push('status = ?');
      params.push(status);
    }

    if (role && (role === 'user' || role === 'admin')) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid changes specified' });
      return;
    }

    params.push(targetUser.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // If suspended, invalidate all active sessions
    if (status === 'suspended') {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(targetUser.id);
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO admin_actions (id, admin_id, admin_name, action, target_id, target_type, details, created_at)
      VALUES (?, ?, ?, 'user_status_update', ?, 'user', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.name,
      targetUser.id,
      `Updated user ${targetUser.email}: status=${status || 'unchanged'}, role=${role || 'unchanged'}`,
      now
    );

    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * GET /api/admin/reviews
 * List campaigns in the review queue
 */
adminRoutes.get('/reviews', (req: AuthenticatedRequest, res: Response) => {
  const statusFilter = req.query.status ? String(req.query.status) : 'pending';

  const reviews = db.prepare(`
    SELECT r.*, c.title as campaign_title, c.url as campaign_url, c.duration_seconds, c.credit_budget,
           c.category, u.name as user_name, u.email as user_email
    FROM campaign_reviews r
    JOIN campaigns c ON r.campaign_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE r.status = ?
    ORDER BY r.created_at ASC
  `).all(statusFilter) as any[];

  const parsed = reviews.map(r => ({
    ...r,
    automated_checks: JSON.parse(r.automated_checks_json || '{}')
  }));

  res.json({ reviews: parsed });
});

/**
 * POST /api/admin/reviews/:id/decision
 * Approve or Reject a campaign with explanation notes
 */
adminRoutes.post('/reviews/:id/decision', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { decision, reason } = req.body;

    if (decision !== 'approve' && decision !== 'reject') {
      res.status(400).json({ error: 'Decision must be either "approve" or "reject".' });
      return;
    }

    const review = db.prepare(`
      SELECT r.*, c.id as campaign_id, c.title as campaign_title, c.user_id as campaign_user_id, c.credit_budget, c.spent_credits
      FROM campaign_reviews r
      JOIN campaigns c ON r.campaign_id = c.id
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!review) {
      res.status(404).json({ error: 'Review record not found' });
      return;
    }

    const now = new Date().toISOString();
    const isApproved = decision === 'approve';
    const newCampaignStatus = isApproved ? 'active' : 'rejected';
    const newReviewStatus = isApproved ? 'approved' : 'rejected';

    // Update review record
    db.prepare(`
      UPDATE campaign_reviews
      SET status = ?, reviewer_id = ?, rejection_reason = ?, reviewed_at = ?
      WHERE id = ?
    `).run(newReviewStatus, req.user!.id, isApproved ? null : (reason || 'Administrative policy rejection'), now, review.id);

    // Update campaign status
    db.prepare(`
      UPDATE campaigns
      SET status = ?, rejection_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(newCampaignStatus, isApproved ? null : (reason || 'Administrative policy rejection'), now, review.campaign_id);

    // If rejected, refund the unspent budget to user
    if (!isApproved) {
      const unspent = Number(Math.max(0, review.credit_budget - review.spent_credits).toFixed(4));
      if (unspent > 0) {
        CreditLedgerService.recordTransaction(
          review.campaign_user_id,
          unspent,
          'refund',
          `Automatic refund for rejected campaign: ${review.campaign_title}`,
          review.campaign_id
        );
      }
    }

    // Log admin action
    db.prepare(`
      INSERT INTO admin_actions (id, admin_id, admin_name, action, target_id, target_type, details, created_at)
      VALUES (?, ?, ?, 'campaign_review_decision', ?, 'campaign', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.name,
      review.campaign_id,
      `${isApproved ? 'Approved' : 'Rejected'} campaign "${review.campaign_title}". Reason: ${reason || 'Approved by admin'}`,
      now
    );

    res.json({
      message: `Campaign has been ${isApproved ? 'approved and activated' : 'rejected'}.`,
      status: newCampaignStatus
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * GET /api/admin/campaigns
 * List all campaigns across the platform
 */
adminRoutes.get('/campaigns', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  let query = `
    SELECT c.*, u.name as user_name, u.email as user_email
    FROM campaigns c
    JOIN users u ON c.user_id = u.id
  `;
  const params: any[] = [];

  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.created_at DESC LIMIT 100';

  const campaigns = db.prepare(query).all(...params);
  res.json({ campaigns });
});

/**
 * GET /api/admin/settings
 * Read platform system settings
 */
adminRoutes.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.prepare("SELECT * FROM platform_settings WHERE id = 'default'").get();
  res.json({ settings });
});

/**
 * PUT /api/admin/settings
 * Update platform system settings
 */
adminRoutes.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      base_credit_reward,
      cost_per_second,
      min_duration_seconds,
      max_duration_seconds,
      welcome_bonus_credits,
      daily_bonus_credits,
      cooldown_between_same_campaign_mins,
      auto_approval_enabled,
      auto_approval_min_score,
      max_visits_per_user_hourly,
      maintenance_mode
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE platform_settings SET
        base_credit_reward = COALESCE(?, base_credit_reward),
        cost_per_second = COALESCE(?, cost_per_second),
        min_duration_seconds = COALESCE(?, min_duration_seconds),
        max_duration_seconds = COALESCE(?, max_duration_seconds),
        welcome_bonus_credits = COALESCE(?, welcome_bonus_credits),
        daily_bonus_credits = COALESCE(?, daily_bonus_credits),
        cooldown_between_same_campaign_mins = COALESCE(?, cooldown_between_same_campaign_mins),
        auto_approval_enabled = COALESCE(?, auto_approval_enabled),
        auto_approval_min_score = COALESCE(?, auto_approval_min_score),
        max_visits_per_user_hourly = COALESCE(?, max_visits_per_user_hourly),
        maintenance_mode = COALESCE(?, maintenance_mode),
        updated_at = ?
      WHERE id = 'default'
    `).run(
      base_credit_reward,
      cost_per_second,
      min_duration_seconds,
      max_duration_seconds,
      welcome_bonus_credits,
      daily_bonus_credits,
      cooldown_between_same_campaign_mins,
      auto_approval_enabled !== undefined ? (auto_approval_enabled ? 1 : 0) : null,
      auto_approval_min_score,
      max_visits_per_user_hourly,
      maintenance_mode !== undefined ? (maintenance_mode ? 1 : 0) : null,
      now
    );

    db.prepare(`
      INSERT INTO admin_actions (id, admin_id, admin_name, action, details, created_at)
      VALUES (?, ?, ?, 'settings_update', 'Updated platform configuration parameters', ?)
    `).run(crypto.randomUUID(), req.user!.id, req.user!.name, now);

    const updated = db.prepare("SELECT * FROM platform_settings WHERE id = 'default'").get();
    res.json({ message: 'Settings updated successfully', settings: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * GET /api/admin/payments
 * List and filter user payment & bank deposit orders
 */
adminRoutes.get('/payments', (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    let query = `
      SELECT p.*, u.name as user_name, u.credits as current_user_credits
      FROM payment_orders p
      JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' WHERE p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT 100';

    const orders = db.prepare(query).all(...params);
    const pendingCount = (db.prepare("SELECT COUNT(*) as c FROM payment_orders WHERE status = 'pending'").get() as any).c;

    res.json({ orders, pendingCount });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * POST /api/admin/payments/:id/decision
 * Approve or reject a deposit order with atomic ledger synchronization
 */
adminRoutes.post('/payments/:id/decision', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, notes } = req.body;
    const order = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(req.params.id) as any;

    if (!order) {
      res.status(404).json({ error: 'Deposit order not found.' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({ error: `Order is already ${order.status}.` });
      return;
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      // 1. Credit the user's balance
      const ledgerResult = CreditLedgerService.recordTransaction(
        order.user_id,
        order.credits_amount,
        'bonus',
        `Bank Transfer Deposit Approved: ${order.package_name} (${order.fiat_amount} ${order.currency}) - Ref: ${order.payment_reference}`,
        order.id
      );

      // 2. Update order status
      db.prepare(`
        UPDATE payment_orders
        SET status = 'approved', admin_notes = ?, reviewed_at = ?, reviewed_by = ?, reviewed_by_name = ?
        WHERE id = ?
      `).run(
        notes || 'Verified against bank statement & credited',
        now,
        req.user!.id,
        req.user!.name,
        order.id
      );

      // 3. Admin audit log
      db.prepare(`
        INSERT INTO admin_actions (id, admin_id, admin_name, action, target_id, target_type, details, created_at)
        VALUES (?, ?, ?, 'payment_approved', ?, 'payment_order', ?, ?)
      `).run(
        crypto.randomUUID(),
        req.user!.id,
        req.user!.name,
        order.id,
        `Approved deposit of ${order.fiat_amount} ${order.currency} for ${order.user_email} (+${order.credits_amount} CR). New balance: ${ledgerResult.newBalance}`,
        now
      );

      res.json({
        message: `Deposit order approved! +${order.credits_amount} credits credited to ${order.user_email}.`,
        status: 'approved'
      });
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE payment_orders
        SET status = 'rejected', admin_notes = ?, reviewed_at = ?, reviewed_by = ?, reviewed_by_name = ?
        WHERE id = ?
      `).run(
        notes || 'Bank transfer could not be verified on statement',
        now,
        req.user!.id,
        req.user!.name,
        order.id
      );

      // Admin audit log
      db.prepare(`
        INSERT INTO admin_actions (id, admin_id, admin_name, action, target_id, target_type, details, created_at)
        VALUES (?, ?, ?, 'payment_rejected', ?, 'payment_order', ?, ?)
      `).run(
        crypto.randomUUID(),
        req.user!.id,
        req.user!.name,
        order.id,
        `Rejected deposit order ${order.payment_reference} for ${order.user_email}. Reason: ${notes || 'N/A'}`,
        now
      );

      res.json({
        message: `Deposit order marked as rejected.`,
        status: 'rejected'
      });
    } else {
      res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * PATCH /api/admin/bank-settings
 * Update platform linked bank account information & payment gateway options
 */
adminRoutes.patch('/bank-settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_branch_code,
      bank_swift_code,
      bank_currency,
      bank_payment_instructions,
      credit_price_per_unit,
      mobile_money_details,
      crypto_wallet_address,
      upi_id,
      upi_name,
      upi_bank_name,
      upi_instructions,
      upi_enabled
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE platform_settings SET
        bank_name = COALESCE(?, bank_name),
        bank_account_name = COALESCE(?, bank_account_name),
        bank_account_number = COALESCE(?, bank_account_number),
        bank_branch_code = COALESCE(?, bank_branch_code),
        bank_swift_code = COALESCE(?, bank_swift_code),
        bank_currency = COALESCE(?, bank_currency),
        bank_payment_instructions = COALESCE(?, bank_payment_instructions),
        credit_price_per_unit = COALESCE(?, credit_price_per_unit),
        mobile_money_details = COALESCE(?, mobile_money_details),
        crypto_wallet_address = COALESCE(?, crypto_wallet_address),
        upi_id = COALESCE(?, upi_id),
        upi_name = COALESCE(?, upi_name),
        upi_bank_name = COALESCE(?, upi_bank_name),
        upi_instructions = COALESCE(?, upi_instructions),
        upi_enabled = COALESCE(?, upi_enabled),
        updated_at = ?
      WHERE id = 'default'
    `).run(
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_branch_code,
      bank_swift_code,
      bank_currency,
      bank_payment_instructions,
      credit_price_per_unit,
      mobile_money_details,
      crypto_wallet_address,
      upi_id,
      upi_name,
      upi_bank_name,
      upi_instructions,
      upi_enabled !== undefined ? (upi_enabled ? 1 : 0) : null,
      now
    );

    db.prepare(`
      INSERT INTO admin_actions (id, admin_id, admin_name, action, details, created_at)
      VALUES (?, ?, ?, 'bank_settings_updated', 'Updated official platform bank account & payment gateway parameters', ?)
    `).run(crypto.randomUUID(), req.user!.id, req.user!.name, now);

    const updated = db.prepare("SELECT * FROM platform_settings WHERE id = 'default'").get();
    res.json({
      message: 'Bank account and payment details updated successfully.',
      settings: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

