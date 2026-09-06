import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { User } from '../../src/types.js';
import { CurrencyConversionService } from '../services/currencyConversionService.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check authorization header or cookie
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.trafficloop_token) {
    token = req.cookies.trafficloop_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  // Lookup active session
  const session = db.prepare(`
    SELECT s.*, u.id, u.email, u.name, u.role, u.location, u.preferred_currency, u.credits, u.total_earned_credits, 
           u.total_spent_credits, u.total_visits_made, u.total_visits_received, u.status, u.created_at, u.last_login_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, new Date().toISOString()) as any;

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  if (session.status === 'suspended') {
    res.status(403).json({ error: 'Your account has been suspended by administration.' });
    return;
  }

  const credits = Number(session.credits);
  const preferredCurrency = session.preferred_currency || 'INR';
  const valuation = CurrencyConversionService.calculateCreditValue(credits, preferredCurrency);

  req.user = {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role,
    location: session.location || 'Botswana',
    preferred_currency: preferredCurrency,
    credits,
    inr_equivalent_balance: valuation.inrValue,
    formatted_inr_balance: valuation.formattedInr,
    total_earned_credits: Number(session.total_earned_credits),
    total_spent_credits: Number(session.total_spent_credits),
    total_visits_made: session.total_visits_made,
    total_visits_received: session.total_visits_received,
    status: session.status,
    created_at: session.created_at,
    last_login_at: session.last_login_at
  };

  req.sessionToken = token;
  next();
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.trafficloop_token) {
    token = req.cookies.trafficloop_token;
  }

  if (!token) {
    return next();
  }

  try {
    const session = db.prepare(`
      SELECT s.*, u.id, u.email, u.name, u.role, u.location, u.preferred_currency, u.credits, u.total_earned_credits, 
             u.total_spent_credits, u.total_visits_made, u.total_visits_received, u.status, u.created_at, u.last_login_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > ?
    `).get(token, new Date().toISOString()) as any;

    if (session && session.status !== 'suspended') {
      const credits = Number(session.credits);
      const preferredCurrency = session.preferred_currency || 'INR';
      const valuation = CurrencyConversionService.calculateCreditValue(credits, preferredCurrency);

      req.user = {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        location: session.location || 'Botswana',
        preferred_currency: preferredCurrency,
        credits,
        inr_equivalent_balance: valuation.inrValue,
        formatted_inr_balance: valuation.formattedInr,
        total_earned_credits: Number(session.total_earned_credits),
        total_spent_credits: Number(session.total_spent_credits),
        total_visits_made: session.total_visits_made,
        total_visits_received: session.total_visits_received,
        status: session.status,
        created_at: session.created_at,
        last_login_at: session.last_login_at
      };
      req.sessionToken = token;
    }
  } catch {}

  next();
}

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
    return;
  }
  next();
}
