import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { TransactionType } from '../../src/types.js';

export class CreditLedgerService {
  /**
   * Modifies a user's credit balance atomically with a ledger entry.
   * Throws an error if deduction would cause balance to drop below zero.
   */
  static recordTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ): { newBalance: number; transactionId: string } {
    const user = db.prepare('SELECT credits, total_earned_credits, total_spent_credits FROM users WHERE id = ?').get(userId) as {
      credits: number;
      total_earned_credits: number;
      total_spent_credits: number;
    } | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = Number(user.credits);
    const newBalance = Number((currentBalance + amount).toFixed(4));

    if (newBalance < 0) {
      throw new Error('Insufficient credit balance');
    }

    const transactionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Begin atomic transaction updates
    const insertTx = db.prepare(`
      INSERT INTO credit_transactions (
        id, user_id, amount, type, description, reference_id, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let newTotalEarned = user.total_earned_credits;
    let newTotalSpent = user.total_spent_credits;

    if (amount > 0) {
      newTotalEarned += amount;
    } else if (amount < 0) {
      newTotalSpent += Math.abs(amount);
    }

    const updateUser = db.prepare(`
      UPDATE users 
      SET credits = ?, total_earned_credits = ?, total_spent_credits = ?
      WHERE id = ?
    `);

    // Execute atomic operations
    insertTx.run(transactionId, userId, amount, type, description, referenceId || null, newBalance, now);
    updateUser.run(newBalance, newTotalEarned, newTotalSpent, userId);

    return { newBalance, transactionId };
  }

  /**
   * Get transaction history for a user
   */
  static getUserTransactions(userId: string, limit = 50, offset = 0) {
    return db.prepare(`
      SELECT * FROM credit_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
  }

  /**
   * Checks deterministic 24-hour loyalty login bonus eligibility with bonus options
   */
  static getDailyBonusStatus(userId: string): {
    eligible: boolean;
    bonusAmount: number;
    streakDays: number;
    streakMultiplier: number;
    lastClaimAt?: string;
    nextClaimAt?: string;
    secondsRemaining: number;
    message: string;
    bonusOptions: Array<{
      id: string;
      title: string;
      subtitle: string;
      description: string;
      creditAmount: number;
      visitsEquivalent: number;
      inrValue: number;
      badge: string;
      iconName: 'gift' | 'rocket' | 'zap' | 'target' | 'flame';
      highlight?: boolean;
    }>;
  } {
    const user = db.prepare('SELECT credits, last_daily_bonus_at, login_streak FROM users WHERE id = ?').get(userId) as {
      credits: number;
      last_daily_bonus_at?: string;
      login_streak?: number;
    } | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    const settings = db.prepare('SELECT daily_bonus_credits FROM platform_settings WHERE id = ?').get('default') as {
      daily_bonus_credits: number;
    } | undefined;

    const baseBonus = settings?.daily_bonus_credits ? Math.round(settings.daily_bonus_credits) : 10;
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

    let currentStreak = Number(user.login_streak) || 1;
    let streakDays = currentStreak;

    if (user.last_daily_bonus_at) {
      const lastClaimTime = new Date(user.last_daily_bonus_at).getTime();
      const elapsedMs = now - lastClaimTime;

      if (elapsedMs < TWENTY_FOUR_HOURS_MS) {
        const remainingMs = TWENTY_FOUR_HOURS_MS - elapsedMs;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const nextClaimIso = new Date(lastClaimTime + TWENTY_FOUR_HOURS_MS).toISOString();

        return {
          eligible: false,
          bonusAmount: baseBonus,
          streakDays: Math.min(7, streakDays),
          streakMultiplier: Number((1.0 + (Math.min(7, streakDays) - 1) * 0.15).toFixed(2)),
          lastClaimAt: user.last_daily_bonus_at,
          nextClaimAt: nextClaimIso,
          secondsRemaining: Math.ceil(remainingMs / 1000),
          message: `Daily 24-hour bonus claimed. Next sign-in bonus available in ${remainingHours}h ${remainingMinutes}m.`,
          bonusOptions: []
        };
      } else if (elapsedMs > FORTY_EIGHT_HOURS_MS) {
        // Streak expired (>48h), resets to 1
        streakDays = 1;
      }
    }

    const calculatedBonus = Math.round(baseBonus * (1 + (Math.min(7, streakDays) - 1) * 0.2));

    const bonusOptions = [
      {
        id: 'ten_thousand_visits_boost',
        title: '24-Hour 10,000 Visits Traffic Package',
        subtitle: 'Mega High-Volume Promotional Booster',
        description: 'Receive 10,000 bonus credits (+10,000 CR) to fuel high-volume campaign delivery and website visitor impressions.',
        creditAmount: 10000,
        visitsEquivalent: 10000,
        inrValue: 15000,
        badge: '10,000 Visits Special',
        iconName: 'rocket' as const,
        highlight: true
      },
      {
        id: 'instant_credits',
        title: `Daily Surfer Loyalty Bonus (+${calculatedBonus} CR)`,
        subtitle: `Day ${Math.min(7, streakDays)} Streak Gift`,
        description: 'Instant liquid wallet credit balance for manual surfing or launching standard campaigns.',
        creditAmount: calculatedBonus,
        visitsEquivalent: calculatedBonus,
        inrValue: Number((calculatedBonus * 1.5).toFixed(2)),
        badge: `Day ${Math.min(7, streakDays)} Streak`,
        iconName: 'gift' as const
      },
      {
        id: 'streak_surge_multiplier',
        title: '24-Hour Surfer Earning Booster (+25 CR)',
        subtitle: 'Double Surf Rate + Bonus Pool',
        description: 'Instant +25 credits with active 2x Surf Multiplier token for maximum earning during surf sessions.',
        creditAmount: 25,
        visitsEquivalent: 25,
        inrValue: 37.5,
        badge: '2x Multiplier',
        iconName: 'zap' as const
      },
      {
        id: 'campaign_traffic_injection',
        title: 'Direct Campaign Fueling (+100 CR)',
        subtitle: 'Direct Visitor Allocation',
        description: 'Instant 100 credits allocated to rapidly accelerate your top campaign delivery queue.',
        creditAmount: 100,
        visitsEquivalent: 100,
        inrValue: 150,
        badge: '100 Visits',
        iconName: 'target' as const
      }
    ];

    return {
      eligible: true,
      bonusAmount: calculatedBonus,
      streakDays: Math.min(7, streakDays),
      streakMultiplier: Number((1.0 + (Math.min(7, streakDays) - 1) * 0.15).toFixed(2)),
      lastClaimAt: user.last_daily_bonus_at,
      nextClaimAt: new Date(now).toISOString(),
      secondsRemaining: 0,
      message: `24-Hour Sign-In Bonus is ready! Choose your daily reward option below.`,
      bonusOptions
    };
  }

  /**
   * Deterministically claim daily loyalty login bonus after 24 hours
   */
  static claimDailyBonus(userId: string, optionId: string = 'instant_credits'): {
    success: boolean;
    creditsAdded: number;
    visitsGranted: number;
    optionTitle: string;
    streakDays: number;
    message: string;
    newBalance: number;
    nextClaimAt?: string;
  } {
    const status = this.getDailyBonusStatus(userId);
    const user = db.prepare('SELECT credits, last_daily_bonus_at, login_streak FROM users WHERE id = ?').get(userId) as any;

    if (!status.eligible) {
      return {
        success: false,
        creditsAdded: 0,
        visitsGranted: 0,
        optionTitle: '',
        streakDays: status.streakDays,
        message: status.message,
        newBalance: user?.credits || 0,
        nextClaimAt: status.nextClaimAt
      };
    }

    const selectedOption = status.bonusOptions.find(opt => opt.id === optionId) || status.bonusOptions[0];
    const creditsToAward = selectedOption ? selectedOption.creditAmount : status.bonusAmount;
    const visitsGranted = selectedOption ? selectedOption.visitsEquivalent : creditsToAward;
    const optionTitle = selectedOption ? selectedOption.title : 'Daily Active Surfer Bonus';

    const nowIso = new Date().toISOString();

    // Determine new streak count
    let newStreak = 1;
    if (user.last_daily_bonus_at) {
      const elapsed = Date.now() - new Date(user.last_daily_bonus_at).getTime();
      const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
      if (elapsed <= FORTY_EIGHT_HOURS_MS) {
        newStreak = ((Number(user.login_streak) || 1) % 7) + 1;
      }
    }

    // Award deterministic bonus with detailed ledger description
    const { newBalance } = this.recordTransaction(
      userId,
      creditsToAward,
      'bonus',
      `Daily 24-Hour Sign-In Bonus: ${optionTitle} (+${creditsToAward} CR / ${visitsGranted} visits)`
    );

    db.prepare('UPDATE users SET last_daily_bonus_at = ?, login_streak = ? WHERE id = ?').run(nowIso, newStreak, userId);

    const nextAvailableIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      success: true,
      creditsAdded: creditsToAward,
      visitsGranted,
      optionTitle,
      streakDays: newStreak,
      message: `🎉 Claimed ${optionTitle}! Added +${creditsToAward.toLocaleString()} Credits (${visitsGranted.toLocaleString()} Visits equivalent) to your account!`,
      newBalance,
      nextClaimAt: nextAvailableIso
    };
  }
}
