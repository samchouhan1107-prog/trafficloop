import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import zlib from 'node:zlib';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/database/db.js';
import { seedDatabase } from './server/database/seed.js';
import { authRoutes } from './server/routes/authRoutes.js';
import { campaignRoutes } from './server/routes/campaignRoutes.js';
import { surfRoutes } from './server/routes/surfRoutes.js';
import { creditRoutes } from './server/routes/creditRoutes.js';
import { analyticsRoutes } from './server/routes/analyticsRoutes.js';
import { adminRoutes } from './server/routes/adminRoutes.js';
import { systemRoutes } from './server/routes/systemRoutes.js';
import { paymentRoutes } from './server/routes/paymentRoutes.js';
import { triStationRoutes } from './server/routes/triStationRoutes.js';
import { rewardRoutes } from './server/routes/rewardRoutes.js';
import { TrafficDeliveryWorkerService } from './server/services/trafficDeliveryWorkerService.js';
import { createRateLimiter } from './server/middleware/rateLimit.js';

async function startServer() {
  try {
    // 1. Initialize SQLite Database Schema & Run Seeder
    initializeDatabase();
    await seedDatabase();

    // 2. Start Autonomous Live Traffic Delivery Engine
    TrafficDeliveryWorkerService.startAutonomousTrafficDispatcher();

    const app = express();
    const PORT = 3000;

    // Standard middlewares
    app.use(express.json());
    app.use(cookieParser());

    // Gzip compression for API + static responses (built-in zlib, zero deps)
    app.use((req, res, next) => {
      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (!acceptEncoding.includes('gzip') || res.getHeader('Content-Encoding')) return next();

      const gzip = zlib.createGzip({ level: 6 });
      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');

      // Route writes through the gzip stream
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      res.write = ((chunk: any, encoding?: BufferEncoding, cb?: (error?: Error | null) => void) => {
        gzip.write(chunk, encoding);
        if (cb) cb(null);
        return true;
      }) as any;
      res.end = ((chunk?: any, encoding?: BufferEncoding, cb?: () => void) => {
        if (chunk && chunk.length > 0) gzip.write(chunk, encoding);
        gzip.end();
        gzip.on('data', (d) => originalWrite(d));
        gzip.on('end', () => originalEnd(undefined, encoding, cb));
        return res as any;
      }) as any;
      res.on('close', () => gzip.destroy());
      next();
    });

    // Static asset cache headers (Vite emits hashed filenames → long-lived cache)
    app.use((req, res, next) => {
      if (process.env.NODE_ENV === 'production') {
        const isAsset = /\.(js|css|woff2?|png|jpg|jpeg|svg|webp|ico)(\?|$)/.test(req.path);
        res.setHeader('Cache-Control', isAsset
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=0, must-revalidate');
      }
      next();
    });

    // Security headers (inline helmet-equivalent)
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';");
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
      next();
    });

    // CORS allowlist (inline cors-equivalent)
    const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : (process.env.NODE_ENV === 'production'
          ? [process.env.APP_URL || 'https://trafficloop.network'].filter(Boolean)
          : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173']);

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      }
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
    });

    // Global rate limiter for API endpoints
    const apiLimiter = createRateLimiter(300, 60 * 1000, 'Too many requests. Please slow down.');
    app.use('/api/', apiLimiter);

    // 2. Mount API Endpoints FIRST
    app.use('/api/system', systemRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/surf', surfRoutes);
    app.use('/api/credits', creditRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/rewards', rewardRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/tri-station', triStationRoutes);

    // Global API fallback
    app.get('/api/*', (req, res) => {
      res.status(404).json({ error: `API endpoint ${req.path} not found` });
    });

    // 3. Vite middleware for frontend development & static SPA in production
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 TrafficLoop Platform running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting TrafficLoop server:', error);
    process.exit(1);
  }
}

startServer();
