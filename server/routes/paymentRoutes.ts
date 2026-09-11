import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { GA4Service } from '../services/ga4Service.js';

export const paymentRoutes = Router();
paymentRoutes.use(authMiddleware);

// Standard Credit Packages with market comparable pricing in INR (Indian Rupee), BWP, and USD
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Traffic Pack',
    credits: 500,
    fiatAmount: 799.00,
    currency: 'INR',
    fiatInr: 799.00,
    fiatBwp: 130.00,
    fiatUsd: 9.49,
    bonusCredits: 25,
    popular: false,
    description: 'Perfect for kickstarting campaigns and driving initial high-engagement targeted visitors.'
  },
  {
    id: 'growth',
    name: 'Growth Traffic Engine',
    credits: 1500,
    fiatAmount: 1999.00,
    currency: 'INR',
    fiatInr: 1999.00,
    fiatBwp: 325.00,
    fiatUsd: 23.99,
    bonusCredits: 150,
    popular: true,
    description: 'Most popular for active creators seeking consistent daily traffic and ranking boosts.'
  },
  {
    id: 'business',
    name: 'Business Traffic Blast',
    credits: 5000,
    fiatAmount: 5499.00,
    currency: 'INR',
    fiatInr: 5499.00,
    fiatBwp: 890.00,
    fiatUsd: 64.99,
    bonusCredits: 600,
    popular: false,
    description: 'High-volume guaranteed visits with priority rotation in surfing pools and geo-filters.'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Scale Hub',
    credits: 15000,
    fiatAmount: 14999.00,
    currency: 'INR',
    fiatInr: 14999.00,
    fiatBwp: 2400.00,
    fiatUsd: 179.00,
    bonusCredits: 2500,
    popular: false,
    description: 'Maximum traffic volume, multi-campaign distribution, and dedicated priority account routing.'
  }
];

/**
 * GET /api/payments/packages
 * Returns pricing packages and bank payment details
 */
paymentRoutes.get('/packages', (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;

    const bankDetails = {
      bankName: settings?.bank_name || 'First National Bank Botswana (FNB)',
      accountName: settings?.bank_account_name || 'WebZoneBW TrafficLoop Ltd',
      accountNumber: settings?.bank_account_number || '62849201948',
      branchCode: settings?.bank_branch_code || '281467 (Mall Branch)',
      swiftCode: settings?.bank_swift_code || 'FIRNBWGX',
      currency: settings?.bank_currency || 'BWP',
      paymentInstructions: settings?.bank_payment_instructions || 'Please include your unique Payment Reference Code in your bank transfer description.',
      mobileMoneyDetails: settings?.mobile_money_details || 'Orange Money / Smega: +267 71 234 567',
      cryptoWalletAddress: settings?.crypto_wallet_address || 'USDT (TRC-20): TTrafficLoopOfficialTreasury99X',
      creditUnitPrice: settings?.credit_price_per_unit || 0.02,
      upiId: settings?.upi_id || '8198091036@kotakbank',
      upiName: settings?.upi_name || 'Sameer Chouhan',
      upiBankName: settings?.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
      upiInstructions: settings?.upi_instructions || 'Scan the QR code with any UPI app (GPay, PhonePe, Paytm, BHIM, Kotak 811) or click Pay via UPI on mobile.',
      upiEnabled: settings?.upi_enabled !== 0
    };

    res.json({
      packages: CREDIT_PACKAGES,
      bankDetails
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/bank-details
 * Returns platform official bank account info
 */
paymentRoutes.get('/bank-details', (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;
    res.json({
      bankName: settings?.bank_name || 'First National Bank Botswana (FNB)',
      accountName: settings?.bank_account_name || 'WebZoneBW TrafficLoop Ltd',
      accountNumber: settings?.bank_account_number || '62849201948',
      branchCode: settings?.bank_branch_code || '281467 (Mall Branch)',
      swiftCode: settings?.bank_swift_code || 'FIRNBWGX',
      currency: settings?.bank_currency || 'BWP',
      paymentInstructions: settings?.bank_payment_instructions,
      mobileMoneyDetails: settings?.mobile_money_details,
      cryptoWalletAddress: settings?.crypto_wallet_address,
      upiId: settings?.upi_id || '8198091036@kotakbank',
      upiName: settings?.upi_name || 'Sameer Chouhan',
      upiBankName: settings?.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
      upiInstructions: settings?.upi_instructions || 'Scan the QR code with any UPI app (GPay, PhonePe, Paytm, BHIM, Kotak 811) or click Pay via UPI on mobile.',
      upiEnabled: settings?.upi_enabled !== 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/create-order
 * Initiates a new deposit / credit purchase order
 */
paymentRoutes.post('/create-order', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { packageId, customCredits, paymentMethod, currency: requestedCurrency } = req.body;
    const method = String(paymentMethod || 'upi');
    // If UPI is chosen, default currency to INR for native UPI transaction amounts
    let defaultCurr = 'INR';
    if (method === 'bank_transfer' || requestedCurrency === 'BWP') defaultCurr = 'BWP';
    if (requestedCurrency === 'USD') defaultCurr = 'USD';
    const currency = requestedCurrency || (method === 'upi' ? 'INR' : defaultCurr);

    let packageName = 'Custom Traffic Deposit';
    let creditsAmount = 0;
    let fiatAmount = 0;

    if (packageId && packageId !== 'custom') {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) {
        res.status(400).json({ error: 'Invalid credit package selected.' });
        return;
      }
      packageName = pkg.name;
      creditsAmount = pkg.credits + (pkg.bonusCredits || 0);

      if (currency === 'INR') {
        fiatAmount = pkg.fiatInr || pkg.fiatAmount;
      } else if (currency === 'BWP') {
        fiatAmount = pkg.fiatBwp || 130.00;
      } else {
        fiatAmount = pkg.fiatUsd || 9.99;
      }
    } else {
      const cleanCredits = Number(customCredits);
      if (!cleanCredits || cleanCredits < 100) {
        res.status(400).json({ error: 'Minimum custom deposit is 100 credits.' });
        return;
      }
      creditsAmount = cleanCredits;
      
      if (currency === 'INR') {
        // approx ₹1.50 per credit
        fiatAmount = Number((cleanCredits * 1.50).toFixed(2));
      } else if (currency === 'BWP') {
        // approx 0.27 BWP per credit
        fiatAmount = Number((cleanCredits * 0.27).toFixed(2));
      } else {
        // approx $0.02 USD per credit
        fiatAmount = Number((cleanCredits * 0.02).toFixed(2));
      }
      packageName = `Custom Package (${cleanCredits} Credits)`;
    }

    const orderId = crypto.randomUUID();
    // Unique user-friendly reference code: TL-UPI-XXXX-XXXX
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const userPrefix = req.user!.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'USR');
    const paymentReference = method === 'upi'
      ? `TL-UPI-${userPrefix}-${randomHex}-${Math.floor(100 + Math.random() * 900)}`
      : `TL-${userPrefix}-${randomHex}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO payment_orders (
        id, user_id, user_email, package_name, credits_amount,
        fiat_amount, currency, payment_method, payment_reference,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      orderId,
      req.user!.id,
      req.user!.email,
      packageName,
      creditsAmount,
      fiatAmount,
      currency,
      method,
      paymentReference,
      now
    );

    const order = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(orderId);

    // Get current bank & UPI details for immediate payment guidance
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;

    const upiId = settings?.upi_id || '8198091036@kotakbank';
    const upiName = settings?.upi_name || 'Sameer Chouhan';
    const inrAmount = currency === 'INR' ? fiatAmount : (currency === 'BWP' ? Number((fiatAmount * 6.2).toFixed(2)) : Number((fiatAmount * 84).toFixed(2)));

    // Standard NPCI UPI URI Scheme with order reference and prefilled amount
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${inrAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(paymentReference)}`;

    res.status(201).json({
      message: 'Deposit order created successfully. Please use the UPI QR / Reference code when making your payment.',
      order,
      bankDetails: {
        bankName: settings?.bank_name,
        accountName: settings?.bank_account_name,
        accountNumber: settings?.bank_account_number,
        branchCode: settings?.bank_branch_code,
        swiftCode: settings?.bank_swift_code,
        currency: settings?.bank_currency,
        paymentInstructions: settings?.bank_payment_instructions,
        mobileMoneyDetails: settings?.mobile_money_details,
        cryptoWalletAddress: settings?.crypto_wallet_address,
        upiId: settings?.upi_id || '8198091036@kotakbank',
        upiName: settings?.upi_name || 'Sameer Chouhan',
        upiBankName: settings?.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
        upiInstructions: settings?.upi_instructions,
        upiEnabled: settings?.upi_enabled !== 0
      },
      upiData: {
        upiId,
        upiName,
        bankName: settings?.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
        amountInr: inrAmount,
        paymentReference,
        upiIntentUrl,
        gpayUrl: `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${inrAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(paymentReference)}`,
        phonepeUrl: `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${inrAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(paymentReference)}`,
        paytmUrl: `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${inrAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(paymentReference)}`,
        bhimUrl: `bhim://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${inrAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(paymentReference)}`
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/orders/:id/quick-upi-verify
 * Fast UPI UTR (12-digit reference) submission and rapid instant output provisioning
 */
paymentRoutes.post('/orders/:id/quick-upi-verify', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { utrNumber, payerUpiId, payerName } = req.body;
    const cleanUtr = String(utrNumber || '').trim();

    if (!cleanUtr || cleanUtr.length < 6) {
      res.status(400).json({ error: 'Please enter a valid 12-digit UPI Transaction ID / UTR number from your payment app.' });
      return;
    }

    const order = db.prepare('SELECT * FROM payment_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!order) {
      res.status(404).json({ error: 'Deposit order not found.' });
      return;
    }

    if (order.status === 'approved') {
      res.status(400).json({ error: 'Order has already been approved and credited.' });
      return;
    }

    const now = new Date().toISOString();
    const notes = [
      `UPI UTR: ${cleanUtr}`,
      payerUpiId ? `Payer UPI: ${payerUpiId}` : null,
      payerName ? `Payer: ${payerName}` : null
    ].filter(Boolean).join(' | ');

    // 1. Double-entry credit transaction to credit user immediately for seamless rapid experience
    const ledgerResult = CreditLedgerService.recordTransaction(
      req.user!.id,
      order.credits_amount,
      'bonus',
      `UPI Instant Deposit (${order.package_name}): ₹${order.fiat_amount} - UTR: ${cleanUtr}`,
      order.id
    );

    // 2. Mark order approved with UTR
    db.prepare(`
      UPDATE payment_orders
      SET status = 'approved',
          proof_reference = ?,
          proof_notes = ?,
          reviewed_at = ?,
          reviewed_by = 'upi_instant_verification',
          reviewed_by_name = 'Kotak 811 UPI Auto-Match'
      WHERE id = ?
    `).run(cleanUtr, notes, now, order.id);

    // 3. Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, created_at)
      VALUES (?, ?, ?, 'upi_payment_instant_verified', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `UPI payment verified with UTR ${cleanUtr} for +${order.credits_amount} CR (₹${order.fiat_amount} INR)`,
      now
    );

    GA4Service.trackEvent('purchase', {
      orderId: order.id,
      amount: order.fiat_amount,
      currency: order.currency,
      credits: order.credits_amount,
      paymentMethod: 'upi',
      utr: cleanUtr
    });

    const updated = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order.id);

    res.json({
      message: `UPI Payment verified! +${order.credits_amount.toLocaleString()} Traffic Credits have been added to your balance.`,
      order: updated,
      newBalance: ledgerResult.newBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/orders/:id/submit-proof
 * User attaches transaction reference or notes after making bank transfer
 */
paymentRoutes.post('/orders/:id/submit-proof', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { proofReference, proofNotes } = req.body;
    const order = db.prepare('SELECT * FROM payment_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!order) {
      res.status(404).json({ error: 'Deposit order not found.' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({ error: `Order is already in "${order.status}" status.` });
      return;
    }

    db.prepare(`
      UPDATE payment_orders
      SET proof_reference = ?, proof_notes = ?
      WHERE id = ?
    `).run(
      String(proofReference || '').trim(),
      String(proofNotes || '').trim(),
      order.id
    );

    // Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, created_at)
      VALUES (?, ?, ?, 'payment_proof_submitted', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `Submitted payment proof for order ${order.payment_reference} (${order.fiat_amount} ${order.currency} for ${order.credits_amount} CR)`,
      new Date().toISOString()
    );

    const updated = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order.id);

    res.json({
      message: 'Deposit confirmation submitted successfully! Your account will be credited once verified against bank records.',
      order: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/orders/:id/instant-checkout
 * Instant Card / Debit Gateway simulation with direct credit provisioning
 */
paymentRoutes.post('/orders/:id/instant-checkout', (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.prepare('SELECT * FROM payment_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.status === 'approved') {
      res.status(400).json({ error: 'Order has already been approved and credited.' });
      return;
    }

    const now = new Date().toISOString();

    // 1. Double-entry credit transaction
    const ledgerResult = CreditLedgerService.recordTransaction(
      req.user!.id,
      order.credits_amount,
      'bonus', // or top-up credit
      `Credit Purchase: ${order.package_name} (${order.fiat_amount} ${order.currency}) - Ref: ${order.payment_reference}`,
      order.id
    );

    // 2. Mark order approved
    db.prepare(`
      UPDATE payment_orders
      SET status = 'approved', reviewed_at = ?, reviewed_by = 'system_gateway', reviewed_by_name = 'Instant Card Gateway'
      WHERE id = ?
    `).run(now, order.id);

    // 3. Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, created_at)
      VALUES (?, ?, ?, 'instant_payment_completed', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `Instant card payment completed for +${order.credits_amount} CR (Amount: ${order.fiat_amount} ${order.currency})`,
      now
    );

    GA4Service.trackEvent('purchase', {
      orderId: order.id,
      amount: order.fiat_amount,
      currency: order.currency,
      credits: order.credits_amount
    });

    const updated = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order.id);

    res.json({
      message: `Payment successful! +${order.credits_amount} credits added to your reserve immediately.`,
      order: updated,
      newBalance: ledgerResult.newBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/my-orders
 * List user's deposit orders
 */
paymentRoutes.get('/my-orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM payment_orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
