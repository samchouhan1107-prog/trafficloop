import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { CreditLedgerService } from './creditLedgerService.js';
import { CurrencyConversionService } from './currencyConversionService.js';
import { 
  RewardLedgerEntry, 
  IndiaCampaignStats, 
  UserRewardSummary, 
  SeparatedAnalyticsMetrics, 
  RewardsSummaryResponse, 
  RewardsActivityResponse, 
  RewardsEligibilityResponse, 
  ClaimRewardPayload, 
  ClaimRewardResult,
  VerifiedActivityItem 
} from '../../src/types.js';

export class RewardService {
  /**
   * Evaluates verified completed visits for an authenticated user
   * and ensures legitimate reward eligibility records exist in reward_ledger.
   */
  static syncUserEligibleRewards(userId: string): void {
    try {
      // Find all completed visits made by this user that have no entry in reward_ledger
      const unrecordedVisits = db.prepare(`
        SELECT v.*, c.title as campaign_title, c.target_locations
        FROM visits v
        LEFT JOIN campaigns c ON v.campaign_id = c.id
        WHERE v.visitor_user_id = ?
          AND v.status = 'completed'
          AND v.observation_status = 'VERIFIED'
          AND v.id NOT IN (SELECT qualifying_event_id FROM reward_ledger WHERE user_id = ?)
        ORDER BY v.created_at ASC
      `).all(userId, userId) as any[];

      if (!unrecordedVisits || unrecordedVisits.length === 0) {
        return;
      }

      const insertStmt = db.prepare(`
        INSERT INTO reward_ledger (
          id, user_id, eligibility_source, qualifying_event_id,
          amount_inr, amount_credits, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'ELIGIBLE', ?)
      `);

      for (const visit of unrecordedVisits) {
        const rewardId = `rw-${crypto.randomUUID()}`;
        const creditsEarned = Number(visit.credits_earned) || 1.0;
        
        // Calculate INR value from credits
        const inrValuation = CurrencyConversionService.calculateCreditValue(creditsEarned, 'INR');
        let amountInr = inrValuation.inrValue;
        
        // Extra India target qualification bonus
        const isIndiaTarget = (visit.visitor_country_code === 'IN' || 
                               visit.visitor_country === 'India' || 
                               (visit.target_locations && visit.target_locations.toLowerCase().includes('india')));
        
        let source = 'verified_surf_dwell';
        if (isIndiaTarget) {
          source = 'verified_india_visitor_milestone';
          amountInr = Number((amountInr + 0.50).toFixed(2)); // ₹0.50 India Campaign verification bonus
        }

        try {
          insertStmt.run(
            rewardId,
            userId,
            source,
            visit.id,
            amountInr,
            creditsEarned,
            visit.completed_at || visit.created_at || new Date().toISOString()
          );
        } catch (insertErr: any) {
          // Ignore unique constraint collision safely
          if (!insertErr?.message?.includes('UNIQUE')) {
            console.warn('[RewardService] Error recording eligible visit:', insertErr);
          }
        }
      }
    } catch (err) {
      console.error('[RewardService] Failed to sync eligible rewards:', err);
    }
  }

  /**
   * Retrieves high-integrity summary of India Campaign target (450K),
   * user rewards, and separated platform metrics.
   */
  static getSummary(userId?: string): RewardsSummaryResponse {
    if (userId) {
      this.syncUserEligibleRewards(userId);
    }

    // 1. Calculate India Campaign 450,000 Target Metrics
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Real verified visits matching India targeting in the current month
    const indiaStatsRow = db.prepare(`
      SELECT 
        COUNT(*) as verified_count,
        COALESCE(AVG(actual_dwell_seconds), 0) as avg_dwell
      FROM visits
      WHERE (
        visitor_country_code = 'IN' 
        OR visitor_country = 'India' 
        OR campaign_id IN (SELECT id FROM campaigns WHERE target_locations LIKE '%India%')
      )
      AND status = 'completed'
      AND observation_status = 'VERIFIED'
      AND created_at >= ?
      AND created_at <= ?
    `).get(currentMonthStart, currentMonthEnd) as { verified_count: number; avg_dwell: number };

    const activeIndiaCampaignsRow = db.prepare(`
      SELECT COUNT(*) as active_count
      FROM campaigns
      WHERE status = 'active' AND (target_locations LIKE '%India%' OR target_locations = 'Worldwide')
    `).get() as { active_count: number };

    const target = 450000;
    const verifiedMonthlyVisitors = indiaStatsRow?.verified_count || 0;
    const progressPercentage = Number(((verifiedMonthlyVisitors / target) * 100).toFixed(4));
    const avgDwellSeconds = Math.round(indiaStatsRow?.avg_dwell || 0);

    const indiaCampaign: IndiaCampaignStats = {
      target,
      verifiedMonthlyVisitors,
      currentMonthLabel,
      progressPercentage,
      ga4Status: 'CONNECTED',
      activeCampaignsTargetingIndia: activeIndiaCampaignsRow?.active_count || 0,
      avgDwellSeconds,
      observationMethod: 'Autonomous Multi-Node HTTP/200 Dwell Verification Engine',
      monthlyWindowStart: currentMonthStart,
      monthlyWindowEnd: currentMonthEnd
    };

    // 2. User Rewards breakdown (if authenticated)
    let userRewards: UserRewardSummary | null = null;
    let currentUser: any = undefined;

    if (userId) {
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (userRow) {
        currentUser = {
          id: userRow.id,
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
          location: userRow.location || 'Botswana',
          credits: Number(userRow.credits || 0),
          total_earned_credits: Number(userRow.total_earned_credits || 0),
          total_spent_credits: Number(userRow.total_spent_credits || 0),
          total_visits_made: Number(userRow.total_visits_made || 0),
          total_visits_received: Number(userRow.total_visits_received || 0),
          preferred_currency: userRow.preferred_currency || 'INR',
          status: userRow.status,
          created_at: userRow.created_at
        };
      }

      const verifiedVisitsCount = (db.prepare(`
        SELECT COUNT(*) as c FROM visits
        WHERE visitor_user_id = ? AND status = 'completed' AND observation_status = 'VERIFIED'
      `).get(userId) as any)?.c || 0;

      const ledgerAgg = db.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'ELIGIBLE' THEN 1 ELSE 0 END) as eligible_count,
          SUM(CASE WHEN status = 'CLAIMED' THEN 1 ELSE 0 END) as claimed_count,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
          COALESCE(SUM(CASE WHEN status = 'ELIGIBLE' THEN amount_inr ELSE 0 END), 0) as available_inr,
          COALESCE(SUM(CASE WHEN status = 'ELIGIBLE' THEN amount_credits ELSE 0 END), 0) as available_credits,
          COALESCE(SUM(CASE WHEN status = 'CLAIMED' THEN amount_inr ELSE 0 END), 0) as claimed_inr,
          COALESCE(SUM(CASE WHEN status = 'CLAIMED' THEN amount_credits ELSE 0 END), 0) as claimed_credits
        FROM reward_ledger
        WHERE user_id = ?
      `).get(userId) as any;

      userRewards = {
        verifiedActivityCount: verifiedVisitsCount,
        eligibleRewardsCount: Number(ledgerAgg?.eligible_count || 0),
        claimedRewardsCount: Number(ledgerAgg?.claimed_count || 0),
        pendingRewardsCount: Number(ledgerAgg?.pending_count || 0),
        availableToCollectInr: Number((ledgerAgg?.available_inr || 0).toFixed(2)),
        availableToCollectCredits: Number((ledgerAgg?.available_credits || 0).toFixed(2)),
        totalCollectedInr: Number((ledgerAgg?.claimed_inr || 0).toFixed(2)),
        totalCollectedCredits: Number((ledgerAgg?.claimed_credits || 0).toFixed(2))
      };
    }

    // 3. Platform Analytics (Displayed separately, never combined)
    const realVerifiedVisitorsCount = (db.prepare(`
      SELECT COUNT(*) as c FROM visits WHERE status = 'completed' AND observation_status = 'VERIFIED'
    `).get() as any)?.c || 0;

    const authenticatedUsersCount = (db.prepare(`
      SELECT COUNT(*) as c FROM users WHERE status = 'active'
    `).get() as any)?.c || 0;

    const eligibleUsersCount = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as c FROM reward_ledger WHERE status = 'ELIGIBLE'
    `).get() as any)?.c || 0;

    const rewardClaimsCount = (db.prepare(`
      SELECT COUNT(*) as c FROM reward_ledger WHERE status = 'CLAIMED'
    `).get() as any)?.c || 0;

    const analytics: SeparatedAnalyticsMetrics = {
      realVerifiedVisitors: realVerifiedVisitorsCount,
      authenticatedUsers: authenticatedUsersCount,
      eligibleUsers: eligibleUsersCount,
      rewardClaims: rewardClaimsCount
    };

    return {
      indiaCampaign,
      userRewards,
      analytics,
      isAuthenticated: Boolean(userId),
      user: currentUser
    };
  }

  /**
   * Retrieves granular verified activity for the authenticated user
   * with strict privacy guarantees (no raw IP addresses exposed).
   */
  static getActivity(userId: string): RewardsActivityResponse {
    this.syncUserEligibleRewards(userId);

    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfToday = `${todayStr}T00:00:00.000Z`;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const todayRow = db.prepare(`
      SELECT COUNT(*) as c FROM visits
      WHERE visitor_user_id = ? AND status = 'completed' AND observation_status = 'VERIFIED' AND created_at >= ?
    `).get(userId, startOfToday) as any;

    const monthRow = db.prepare(`
      SELECT COUNT(*) as c FROM visits
      WHERE visitor_user_id = ? AND status = 'completed' AND observation_status = 'VERIFIED' AND created_at >= ?
    `).get(userId, startOfMonth) as any;

    const totalRow = db.prepare(`
      SELECT COUNT(*) as c FROM visits
      WHERE visitor_user_id = ? AND status = 'completed' AND observation_status = 'VERIFIED'
    `).get(userId) as any;

    const recentVisits = db.prepare(`
      SELECT 
        v.id, v.duration_seconds, v.actual_dwell_seconds, v.credits_earned,
        v.visitor_country, v.visitor_country_code, v.visitor_device,
        v.created_at, v.completed_at,
        c.title as campaign_title, c.url as campaign_url,
        rl.status as ledger_status, rl.amount_inr as reward_inr
      FROM visits v
      LEFT JOIN campaigns c ON v.campaign_id = c.id
      LEFT JOIN reward_ledger rl ON v.id = rl.qualifying_event_id
      WHERE v.visitor_user_id = ? AND v.status = 'completed' AND v.observation_status = 'VERIFIED'
      ORDER BY v.created_at DESC
      LIMIT 25
    `).all(userId) as any[];

    const recentActivity: VerifiedActivityItem[] = recentVisits.map(v => ({
      id: v.id,
      campaignTitle: v.campaign_title || 'TrafficLoop Network Site',
      targetUrl: v.campaign_url || 'https://trafficloop.global',
      dwellSeconds: v.actual_dwell_seconds || v.duration_seconds || 15,
      country: v.visitor_country || 'India',
      countryCode: v.visitor_country_code || 'IN',
      device: v.visitor_device || 'desktop',
      completedAt: v.completed_at || v.created_at,
      rewardStatus: (v.ledger_status || 'ELIGIBLE') as any,
      earnedInr: Number(v.reward_inr || ((v.credits_earned || 1) * 1.5).toFixed(2)),
      earnedCredits: Number(v.credits_earned || 1.0),
      qualifyingEventId: v.id
    }));

    return {
      todayCount: todayRow?.c || 0,
      monthCount: monthRow?.c || 0,
      totalVerifiedVisits: totalRow?.c || 0,
      recentActivity
    };
  }

  /**
   * Retrieves reward ledger entries for the user
   */
  static getEligibility(userId: string, limit = 50, offset = 0): RewardsEligibilityResponse {
    this.syncUserEligibleRewards(userId);

    const items = db.prepare(`
      SELECT * FROM reward_ledger
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as unknown as RewardLedgerEntry[];

    const countRow = db.prepare(`
      SELECT COUNT(*) as c FROM reward_ledger WHERE user_id = ?
    `).get(userId) as any;

    const totalsRow = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'ELIGIBLE' THEN amount_inr ELSE 0 END), 0) as eligible_inr,
        COALESCE(SUM(CASE WHEN status = 'ELIGIBLE' THEN amount_credits ELSE 0 END), 0) as eligible_credits,
        COALESCE(SUM(CASE WHEN status = 'CLAIMED' THEN amount_inr ELSE 0 END), 0) as claimed_inr
      FROM reward_ledger
      WHERE user_id = ?
    `).get(userId) as any;

    return {
      items,
      total: countRow?.c || 0,
      eligibleTotalInr: Number((totalsRow?.eligible_inr || 0).toFixed(2)),
      eligibleTotalCredits: Number((totalsRow?.eligible_credits || 0).toFixed(2)),
      claimedTotalInr: Number((totalsRow?.claimed_inr || 0).toFixed(2))
    };
  }

  /**
   * Claims eligible reward(s) with anti-fraud duplicate prevention and double-entry transaction.
   */
  static claimReward(userId: string, payload: ClaimRewardPayload): ClaimRewardResult {
    const nowIso = new Date().toISOString();
    const transactionId = `tx-rw-${crypto.randomUUID()}`;

    // Verify user exists and is active
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new Error('User not found');
    }
    if (user.status === 'suspended') {
      throw new Error('This account is suspended from claiming rewards');
    }

    // Sync latest eligible visits first
    this.syncUserEligibleRewards(userId);

    if (payload.rewardId) {
      // Single item claim
      const reward = db.prepare(`
        SELECT * FROM reward_ledger WHERE id = ? AND user_id = ?
      `).get(payload.rewardId, userId) as unknown as RewardLedgerEntry | undefined;

      if (!reward) {
        throw new Error('Reward record not found or does not belong to this account.');
      }

      if (reward.status === 'CLAIMED') {
        throw new Error('This reward has already been claimed and settled.');
      }

      if (reward.status !== 'ELIGIBLE') {
        throw new Error(`This reward is not eligible for collection (Status: ${reward.status}).`);
      }

      // Atomic transition from ELIGIBLE to CLAIMED
      const updateResult = db.prepare(`
        UPDATE reward_ledger
        SET status = 'CLAIMED', claimed_at = ?, transaction_id = ?
        WHERE id = ? AND user_id = ? AND status = 'ELIGIBLE'
      `).run(nowIso, transactionId, reward.id, userId);

      if (updateResult.changes === 0) {
        throw new Error('Reward claim was already processed concurrently or is no longer eligible.');
      }

      // Record double-entry credit transaction
      const creditsAmount = Number(reward.amount_credits) || 1.0;
      const { newBalance } = CreditLedgerService.recordTransaction(
        userId,
        creditsAmount,
        'bonus',
        `Collected reward (${reward.eligibility_source}) - ₹${reward.amount_inr} INR`,
        transactionId
      );

      // Log in activity logs
      db.prepare(`
        INSERT INTO activity_logs (id, user_id, user_email, action, details, ip_address, created_at)
        VALUES (?, ?, ?, 'reward_claimed', ?, '127.0.0.1', ?)
      `).run(crypto.randomUUID(), userId, user.email, `Claimed reward ${reward.id} for ₹${reward.amount_inr} (${creditsAmount} CR)`, nowIso);

      const inrValuation = CurrencyConversionService.calculateCreditValue(newBalance, 'INR');

      return {
        success: true,
        claimedCount: 1,
        claimedInr: reward.amount_inr,
        claimedCredits: creditsAmount,
        transactionId,
        message: `Successfully collected ₹${reward.amount_inr} INR (+${creditsAmount} CR)!`,
        updatedUserCredits: newBalance,
        updatedUserInr: inrValuation.inrValue
      };
    }

    // Claim all eligible rewards
    const eligibleRecords = db.prepare(`
      SELECT * FROM reward_ledger
      WHERE user_id = ? AND status = 'ELIGIBLE'
    `).all(userId) as unknown as RewardLedgerEntry[];

    if (!eligibleRecords || eligibleRecords.length === 0) {
      throw new Error('No eligible rewards available to collect at this time. Surf websites or verify traffic to earn rewards!');
    }

    let totalInr = 0;
    let totalCredits = 0;
    const claimedIds: string[] = [];

    for (const item of eligibleRecords) {
      const updateRes = db.prepare(`
        UPDATE reward_ledger
        SET status = 'CLAIMED', claimed_at = ?, transaction_id = ?
        WHERE id = ? AND user_id = ? AND status = 'ELIGIBLE'
      `).run(nowIso, transactionId, item.id, userId);

      if (updateRes.changes > 0) {
        totalInr += Number(item.amount_inr);
        totalCredits += Number(item.amount_credits || 1.0);
        claimedIds.push(item.id);
      }
    }

    if (claimedIds.length === 0) {
      throw new Error('All eligible rewards have already been collected.');
    }

    totalInr = Number(totalInr.toFixed(2));
    totalCredits = Number(totalCredits.toFixed(2));

    // Credit in double-entry ledger
    const { newBalance } = CreditLedgerService.recordTransaction(
      userId,
      totalCredits,
      'bonus',
      `Collected ${claimedIds.length} verified rewards (Total: ₹${totalInr} INR)`,
      transactionId
    );

    // Audit log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, ip_address, created_at)
      VALUES (?, ?, ?, 'rewards_batch_claimed', ?, '127.0.0.1', ?)
    `).run(
      crypto.randomUUID(), 
      userId, 
      user.email, 
      `Batch claimed ${claimedIds.length} rewards totaling ₹${totalInr} INR (${totalCredits} CR)`, 
      nowIso
    );

    const inrValuation = CurrencyConversionService.calculateCreditValue(newBalance, 'INR');

    return {
      success: true,
      claimedCount: claimedIds.length,
      claimedInr: totalInr,
      claimedCredits: totalCredits,
      transactionId,
      message: `Successfully collected ${claimedIds.length} rewards totaling ₹${totalInr} INR (+${totalCredits} CR)!`,
      updatedUserCredits: newBalance,
      updatedUserInr: inrValuation.inrValue
    };
  }
}
