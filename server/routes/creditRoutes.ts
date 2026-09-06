import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { CurrencyConversionService } from '../services/currencyConversionService.js';
import { GA4Service } from '../services/ga4Service.js';

export const creditRoutes = Router();

/**
 * GET /api/credits/market-rates
 * Returns live market exchange rates & credit benchmarking in INR, BWP, USD, etc.
 */
creditRoutes.get('/market-rates', async (req, res: Response) => {
  try {
    const rates = await CurrencyConversionService.refreshMarketRates();
    res.json(rates);
  } catch (error: any) {
    res.json(CurrencyConversionService.getMarketRates());
  }
});

/**
 * POST /api/credits/convert
 * Converts between currencies or between credits and INR
 */
creditRoutes.post('/convert', (req, res: Response) => {
  try {
    const { amount, from, to } = req.body;
    const cleanAmount = Number(amount) || 0;
    const fromType = String(from || 'credits').toLowerCase();
    const toType = String(to || 'inr').toLowerCase();

    if (fromType === 'credits' && toType === 'inr') {
      const inrValue = CurrencyConversionService.convertCreditsToInr(cleanAmount);
      res.json({
        credits: cleanAmount,
        inrValue,
        formattedInr: CurrencyConversionService.formatCurrency(inrValue, 'INR'),
        rate: CurrencyConversionService.getMarketRates().creditBenchmark.ratePerCreditInr
      });
      return;
    }

    if (fromType === 'inr' && toType === 'credits') {
      const credits = CurrencyConversionService.convertInrToCredits(cleanAmount);
      res.json({
        inrAmount: cleanAmount,
        credits,
        rate: CurrencyConversionService.getMarketRates().creditBenchmark.ratePerCreditInr
      });
      return;
    }

    const converted = CurrencyConversionService.convertCurrency(cleanAmount, from, to);
    res.json({
      amount: cleanAmount,
      from,
      to,
      result: converted,
      formattedResult: CurrencyConversionService.formatCurrency(converted, to)
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

// Protect user-specific credit routes below
creditRoutes.use(authMiddleware);

/**
 * GET /api/credits/valuation
 * Real-time valuation of the authenticated user's credits in INR, BWP, and USD
 */
creditRoutes.get('/valuation', (req: AuthenticatedRequest, res: Response) => {
  try {
    const preferredCurrency = (req.user as any)?.preferred_currency || 'INR';
    const valuation = CurrencyConversionService.calculateCreditValue(req.user!.credits, preferredCurrency);
    res.json(valuation);
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * GET /api/credits/history
 * Complete transaction history with INR valuation
 */
creditRoutes.get('/history', (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Number(req.query.offset) || 0;

  const rawTransactions = CreditLedgerService.getUserTransactions(req.user!.id, limit, offset);
  const benchmark = CurrencyConversionService.getMarketRates().creditBenchmark;

  const transactions = rawTransactions.map(tx => {
    const amountNum = Number(tx.amount);
    const inrValue = Number((Math.abs(amountNum) * benchmark.ratePerCreditInr).toFixed(2));
    return {
      ...tx,
      amount: amountNum,
      inr_value: inrValue,
      formatted_inr_value: `₹${inrValue.toFixed(2)}`,
      currency: 'INR'
    };
  });

  const totalCount = (db.prepare('SELECT COUNT(*) as c FROM credit_transactions WHERE user_id = ?').get(req.user!.id) as any).c;
  const valuation = CurrencyConversionService.calculateCreditValue(req.user!.credits, (req.user as any)?.preferred_currency || 'INR');

  res.json({
    transactions,
    total: totalCount,
    currentBalance: req.user!.credits,
    inrEquivalent: valuation.inrValue,
    formattedInr: valuation.formattedInr,
    valuation
  });
});

/**
 * GET /api/credits/daily-bonus/status
 * Check deterministic 24-hour daily bonus eligibility and countdown
 */
creditRoutes.get('/daily-bonus/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = CreditLedgerService.getDailyBonusStatus(req.user!.id);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * POST /api/credits/daily-bonus
 * Claim 24h surfer loyalty gift with option selection
 */
creditRoutes.post('/daily-bonus', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { optionId } = req.body || {};
    const result = CreditLedgerService.claimDailyBonus(req.user!.id, optionId);
    if (result.success) {
      GA4Service.trackEvent('credits_earned', {
        userId: req.user!.id,
        amount: result.creditsAdded,
        type: 'daily_bonus'
      });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

/**
 * POST /api/credits/transfer
 * Transfer credits to another user by email
 */
creditRoutes.post('/transfer', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientEmail, amount, note } = req.body;
    const cleanAmount = Number(amount);

    if (!recipientEmail || !cleanAmount || cleanAmount <= 0) {
      res.status(400).json({ error: 'Recipient email and positive credit amount are required.' });
      return;
    }

    const cleanEmail = String(recipientEmail).trim().toLowerCase();

    if (cleanEmail === req.user!.email) {
      res.status(400).json({ error: 'Cannot transfer credits to your own account.' });
      return;
    }

    const recipient = db.prepare("SELECT id, name, email FROM users WHERE email = ? AND status = 'active'").get(cleanEmail) as any;
    if (!recipient) {
      res.status(404).json({ error: 'Recipient user account not found or is inactive.' });
      return;
    }

    if (req.user!.credits < cleanAmount) {
      res.status(400).json({ error: `Insufficient credits. Current balance: ${req.user!.credits.toFixed(2)}.` });
      return;
    }

    // Deduct from sender
    const senderResult = CreditLedgerService.recordTransaction(
      req.user!.id,
      -cleanAmount,
      'transfer',
      `Credit transfer to ${recipient.name} (${recipient.email})${note ? `: ${note}` : ''}`,
      recipient.id
    );

    // Credit to recipient
    CreditLedgerService.recordTransaction(
      recipient.id,
      cleanAmount,
      'transfer',
      `Credit transfer received from ${req.user!.name} (${req.user!.email})${note ? `: ${note}` : ''}`,
      req.user!.id
    );

    res.json({
      message: `Successfully transferred ${cleanAmount} credits to ${recipient.name}.`,
      newBalance: senderResult.newBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});
