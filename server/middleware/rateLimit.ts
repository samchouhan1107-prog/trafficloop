import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Clean up old keys every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(maxRequests: number, windowMs: number, message = 'Too many requests. Please slow down.') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      const resetAt = now + windowMs;
      rateLimitMap.set(key, { count: 1, resetTime: resetAt });
      // Inform clients about their allowance so they can pace requests precisely
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
      res.status(429).json({ error: message, retryAfterSeconds: retryAfterSec });
      return;
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
    next();
  };
}
