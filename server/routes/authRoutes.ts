import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { CreditLedgerService } from '../services/creditLedgerService.js';
import { CurrencyConversionService } from '../services/currencyConversionService.js';
import { GA4Service } from '../services/ga4Service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { validateRealEmailDomain, generateSignupSecurityPin, verifySignupSecurityPin } from '../utils/spamDomainFilter.js';
import { NotificationService } from '../services/notificationService.js';

export const authRoutes = Router();

const loginLimiter = createRateLimiter(15, 60 * 1000, 'Too many login attempts. Please wait 1 minute.');
const registerLimiter = createRateLimiter(10, 60 * 1000, 'Too many registration requests.');

/**
 * GET /api/auth/signup-pin
 * Issues a cryptographic 6-digit Human Verification PIN challenge for signup
 */
authRoutes.get('/signup-pin', (req, res) => {
  try {
    const { pin, pinToken, expiresAt } = generateSignupSecurityPin();
    res.json({ pin, pinToken, expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate security PIN' });
  }
});

function formatUserResponse(userRow: any) {
  const credits = Number(userRow.credits || 0);
  const preferredCurrency = userRow.preferred_currency || 'INR';
  const valuation = CurrencyConversionService.calculateCreditValue(credits, preferredCurrency);

  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
    location: userRow.location || 'Botswana',
    preferred_currency: preferredCurrency,
    credits,
    inr_equivalent_balance: valuation.inrValue,
    formatted_inr_balance: valuation.formattedInr,
    total_earned_credits: Number(userRow.total_earned_credits || 0),
    total_spent_credits: Number(userRow.total_spent_credits || 0),
    total_visits_made: Number(userRow.total_visits_made || 0),
    total_visits_received: Number(userRow.total_visits_received || 0),
    status: userRow.status,
    last_active_at: userRow.last_active_at,
    inactivity_reason: userRow.inactivity_reason,
    created_at: userRow.created_at,
    last_login_at: userRow.last_login_at
  };
}

/**
 * POST /api/auth/register
 */
authRoutes.post('/register', registerLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, location, preferredCurrency, pin, pinToken } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    const emailClean = String(email).trim().toLowerCase();
    const nameClean = String(name).trim();
    const userLocation = location ? String(location).trim() : 'Botswana';
    const prefCurrency = preferredCurrency ? String(preferredCurrency).toUpperCase() : 'INR';

    // 1. Anti-Spam / Disposable Domain Validation
    const domainCheck = validateRealEmailDomain(emailClean);
    if (!domainCheck.isValid) {
      res.status(400).json({ error: domainCheck.reason || 'Invalid or disposable email domain.' });
      return;
    }

    // 2. Anti-Bot Security Verification PIN check
    if (pin || pinToken) {
      const pinResult = verifySignupSecurityPin(pin, pinToken);
      if (!pinResult.isValid) {
        res.status(400).json({ error: pinResult.error || 'Invalid Security Verification PIN.' });
        return;
      }
    } else {
      res.status(400).json({ error: 'Please enter the 6-digit Security Verification PIN displayed on the signup window.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(emailClean);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const settings = db.prepare('SELECT welcome_bonus_credits FROM platform_settings WHERE id = ?').get('default') as {
      welcome_bonus_credits: number;
    } | undefined;

    const welcomeBonus = settings?.welcome_bonus_credits || 15.0;
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // 1. Insert user with baseline 0 credits so ledger entry sets accurate balance
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, name, role, location, preferred_currency, credits,
        total_earned_credits, total_spent_credits, total_visits_made,
        total_visits_received, status, created_at, last_login_at
      ) VALUES (?, ?, ?, ?, 'user', ?, ?, 0.0, 0.0, 0.0, 0, 0, 'active', ?, ?)
    `).run(userId, emailClean, passwordHash, nameClean, userLocation, prefCurrency, now, now);

    // 2. Record welcome bonus transaction in credit ledger
    CreditLedgerService.recordTransaction(
      userId,
      welcomeBonus,
      'bonus',
      'Welcome bonus registration credit gift'
    );

    // 3. Create session token (valid 30 days)
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, user_id, ip_address, user_agent, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionToken, userId, req.ip || '127.0.0.1', req.headers['user-agent'] || '', now, expiresAt);

    // 4. Log activity
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_email, action, details, ip_address, created_at)
      VALUES (?, ?, ?, 'user_registered', 'New account registration', ?, ?)
    `).run(crypto.randomUUID(), userId, emailClean, req.ip || '127.0.0.1', now);

    GA4Service.trackEvent('user_registered', { userId, welcomeBonus });

    // Set cookie
    res.cookie('trafficloop_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 86400000
    });

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    res.status(201).json({
      message: 'Account created successfully! Welcome bonus credited.',
      token: sessionToken,
      user: formatUserResponse(userRow)
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 */
authRoutes.post('/login', loginLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailClean = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(emailClean) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials. If you are a new member, please sign up or check your email.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended. Please contact platform support.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const sessionToken = crypto.randomBytes(48).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, user_id, ip_address, user_agent, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionToken, user.id, req.ip || '127.0.0.1', req.headers['user-agent'] || '', now, expiresAt);

    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

    res.cookie('trafficloop_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 86400000
    });

    const refreshedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;

    res.json({
      message: 'Login successful',
      token: sessionToken,
      user: formatUserResponse(refreshedUser || user)
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 */
authRoutes.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/refresh
 * Secure session renewal endpoint.
 * Extends the active session's expiration window by 30 days and re-issues cookie.
 */
authRoutes.post('/refresh', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionToken = req.sessionToken;
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();

    if (sessionToken) {
      db.prepare(`
        UPDATE sessions
        SET expires_at = ?, last_renewed_at = ?
        WHERE token = ?
      `).run(newExpiresAt, now.toISOString(), sessionToken);

      res.cookie('trafficloop_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 86400000
      });
    }

    res.json({
      success: true,
      token: sessionToken,
      expiresAt: newExpiresAt,
      user: req.user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Session renewal failed' });
  }
});

/**
 * PUT /api/auth/profile
 * Allows updating user name, primary location, and preferred currency
 */
authRoutes.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, location, preferredCurrency } = req.body;
    const userId = req.user!.id;

    const updates: string[] = [];
    const params: any[] = [];

    if (name && typeof name === 'string' && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (location && typeof location === 'string' && location.trim()) {
      updates.push('location = ?');
      params.push(location.trim());
    }

    if (preferredCurrency && typeof preferredCurrency === 'string' && preferredCurrency.trim()) {
      updates.push('preferred_currency = ?');
      params.push(preferredCurrency.trim().toUpperCase());
    }

    if (updates.length > 0) {
      params.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedUserRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    res.json({
      message: 'Profile updated successfully!',
      user: formatUserResponse(updatedUserRow)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile.' });
  }
});

/**
 * POST /api/auth/logout
 */
authRoutes.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
  }
  res.clearCookie('trafficloop_token');
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/change-password
 */
authRoutes.post('/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user!.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/heartbeat
 * Reports user activity ping, keeps session active
 */
authRoutes.post('/heartbeat', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(now, userId);

    res.json({
      status: req.user!.status,
      last_active_at: now
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/reactivate
 * Restores an inactive user to active status with notification
 */
authRoutes.post('/reactivate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notification = NotificationService.notifyUserReactivated(userId);

    const refreshedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    res.json({
      message: 'Account reactivated successfully!',
      user: formatUserResponse(refreshedUser),
      notification
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reactivate account' });
  }
});

/**
 * POST /api/auth/set-idle
 * Marks user session inactive due to idle timeout / inactivity with notification
 */
authRoutes.post('/set-idle', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const reason = req.body.reason || 'Session idle timeout (5+ min inactivity detected)';

    const notification = NotificationService.notifyUserInactivity(userId, reason);
    const refreshedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    res.json({
      message: 'Account marked inactive due to inactivity.',
      user: formatUserResponse(refreshedUser),
      notification
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark inactive' });
  }
});
