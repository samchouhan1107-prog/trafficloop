import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { GA4Service } from '../services/ga4Service.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

export const paymentRoutes = Router();
paymentRoutes.use(authMiddleware);

const paymentRateLimiter = createRateLimiter(30, 60 * 1000, 'Too many payment requests. Please slow down.');

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
 * Returns pricing packages and basic payment guidance (no full credentials)
 */
paymentRoutes.get('/packages', paymentRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;

    res.json({
      packages: CREDIT_PACKAGES,
      paymentMethod: {
        upiEnabled: settings?.upi_enabled !== 0,
        creditUnitPrice: settings?.credit_price_per_unit || 0.02,
        currency: settings?.bank_currency || 'BWP',
        instructions: settings?.bank_payment_instructions || ''
      }
    });
  } catch (error: any) {
    console.error('Error fetching payment packages:', error);
    res.status(500).json({ error: 'Failed to retrieve payment packages.' });
  }
});

/**
 * GET /api/payments/bank-details
 * Admin-only: returns platform payment credentials
 */
paymentRoutes.get('/bank-details', paymentRateLimiter, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;
    res.json({
      bankName: settings?.bank_name || '',
      accountName: settings?.bank_account_name || '',
      accountNumber: settings?.bank_account_number || '',
      branchCode: settings?.bank_branch_code || '',
      swiftCode: settings?.bank_swift_code || '',
      currency: settings?.bank_currency || 'BWP',
      paymentInstructions: settings?.bank_payment_instructions || '',
      mobileMoneyDetails: settings?.mobile_money_details || '',
      cryptoWalletAddress: settings?.crypto_wallet_address || '',
      upiId: settings?.upi_id || '',
      upiName: settings?.upi_name || '',
      upiBankName: settings?.upi_bank_name || '',
      upiInstructions: settings?.upi_instructions || '',
      upiEnabled: settings?.upi_enabled !== 0
    });
  } catch (error: any) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({ error: 'Failed to retrieve bank details.' });
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

    // Get current bank & UPI details for payment guidance
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = ?').get('default') as any;

    const upiId = settings?.upi_id || '';
    const upiName = settings?.upi_name || '';
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
         upiId: settings?.upi_id || '',
         upiName: settings?.upi_name || '',
         upiBankName: settings?.upi_bank_name || '',
         upiInstructions: settings?.upi_instructions,
         upiEnabled: settings?.upi_enabled !== 0
       },
      upiData: {
        upiId,
        upiName,
        bankName: settings?.upi_bank_name || '',
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
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

/**
 * POST /api/payments/orders/:id/quick-upi-verify
 * UTR (12-digit reference) submission for manual payment verification
 */
paymentRoutes.post('/orders/:id/quick-upi-verify', paymentRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { utrNumber, payerUpiId, payerName } = req.body;
    const cleanUtr = String(utrNumber || '').trim();

    if (!cleanUtr || cleanUtr.length < 6) {
      res.status(400).json({ error: 'Please enter a valid UPI Transaction ID / UTR number from your payment app.' });
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

    // Store UTR reference on order; status remains 'pending' for manual verification
    db.prepare(`
      UPDATE payment_orders
      SET proof_reference = ?,
          proof_notes = ?,
          status = 'pending_verification'
      WHERE id = ?
    `).run(cleanUtr, notes, order.id);

    // Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, created_at)
      VALUES (?, ?, ?, 'upi_payment_utr_submitted', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `UTR ${cleanUtr} submitted for order ${order.payment_reference} (${order.fiat_amount} ${order.currency} for ${order.credits_amount} CR). Pending manual verification.`,
      now
    );

    GA4Service.trackEvent('purchase', {
      orderId: order.id,
      amount: order.fiat_amount,
      currency: order.currency,
      credits: order.credits_amount,
      paymentMethod: 'upi',
      utr: cleanUtr,
      verificationStatus: 'pending_manual'
    });

    const updated = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order.id);

    res.json({
      message: `UTR submitted. Your payment is pending verification and will be credited within 1-24 hours once confirmed.`,
      order: updated
    });
  } catch (error: any) {
    console.error('Error in quick-upi-verify:', error);
    res.status(500).json({ error: 'Failed to submit UPI verification.' });
  }
});

/**
 * POST /api/payments/orders/:id/submit-proof
 * User attaches transaction reference or notes after making bank transfer
 */
paymentRoutes.post('/orders/:id/submit-proof', paymentRateLimiter, (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Error submitting payment proof:', error);
    res.status(500).json({ error: 'Failed to submit payment proof.' });
  }
});

/**
 * POST /api/payments/orders/:id/instant-checkout
 * Card / Debit payment submission for manual verification
 */
paymentRoutes.post('/orders/:id/instant-checkout', paymentRateLimiter, (req: AuthenticatedRequest, res: Response) => {
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

    // Mark order as pending manual verification — do NOT credit user automatically
    db.prepare(`
      UPDATE payment_orders
      SET status = 'pending_verification',
          reviewed_at = ?,
          reviewed_by = 'card_gateway_pending',
          reviewed_by_name = 'Card Gateway (Pending Verification)'
      WHERE id = ?
    `).run(now, order.id);

    // Activity log
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, created_at)
      VALUES (?, ?, ?, 'instant_payment_submitted', ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      req.user!.email,
      `Card payment submitted for order ${order.payment_reference} (${order.fiat_amount} ${order.currency} for ${order.credits_amount} CR). Pending manual verification.`,
      now
    );

    GA4Service.trackEvent('purchase', {
      orderId: order.id,
      amount: order.fiat_amount,
      currency: order.currency,
      credits: order.credits_amount,
      verificationStatus: 'pending_manual'
    });

    const updated = db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order.id);

    res.json({
      message: `Payment submitted. Your order is pending verification and will be credited within 1-24 hours once confirmed.`,
      order: updated
    });
  } catch (error: any) {
    console.error('Error in instant-checkout:', error);
    res.status(500).json({ error: 'Failed to process payment.' });
  }
});

/**
 * GET /api/payments/my-orders
 * List user's deposit orders
 */
paymentRoutes.get('/my-orders', paymentRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM payment_orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    res.json({ orders });
  } catch (error: any) {
    console.error('Error fetching payment orders:', error);
    res.status(500).json({ error: 'Failed to fetch payment orders.' });
  }
});
