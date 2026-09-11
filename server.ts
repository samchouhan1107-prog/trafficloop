import express from 'express';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase, db } from './server/database/db.js';
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
import { notificationRoutes } from './server/routes/notificationRoutes.js';
import { cycleRoutes } from './server/routes/cycleRoutes.js';
import { TrafficDeliveryWorkerService } from './server/services/trafficDeliveryWorkerService.js';
import { SeoService } from './server/services/seoService.js';

async function startServer() {
  try {
    // 1. Initialize SQLite Database Schema & Run Seeder
    initializeDatabase();
    await seedDatabase();
    SeoService.syncAllCampaignsSeo();

    // 2. Start Autonomous Live Traffic Delivery Engine
    TrafficDeliveryWorkerService.startAutonomousTrafficDispatcher();

    const app = express();
    const PORT = 3000;

    // Security & performance middlewares
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
    app.use(cors({ origin: process.env.APP_URL || true, credentials: true }));
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());

    // 2. Mount API Endpoints FIRST
    app.use('/api/system', systemRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/surf', surfRoutes);
    app.use('/api/cycle', cycleRoutes);
    app.use('/api/credits', creditRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/rewards', rewardRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/tri-station', triStationRoutes);
    app.use('/api/notifications', notificationRoutes);

    // SEO / Search Console Readiness: robots.txt
    app.get('/robots.txt', (req, res) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const robotsTxt = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin',
        `Sitemap: ${baseUrl}/sitemap.xml`
      ].join('\n');
      res.type('text/plain').send(robotsTxt);
    });

    // SEO / Search Console Readiness: sitemap.xml
    app.get('/sitemap.xml', (req, res) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const pages = SeoService.getSitemapEntries(baseUrl);

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
        '</urlset>'
      ].join('\n');

      res.type('application/xml').send(sitemap);
    });

    // Public indexable showcase page for Search Console & crawlers
    app.get('/showcase/:slug', (req, res) => {
      const { slug } = req.params;
      const item = SeoService.getShowcaseBySlug(slug);

      if (!item) {
        res.status(404).set('X-Robots-Tag', 'noindex').type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Showcase Not Found - TrafficLoop</title><meta name="robots" content="noindex" /></head>
<body style="font-family:sans-serif;padding:40px;text-align:center;background:#0B0F19;color:#F8FAFC;">
  <h1>404 - Campaign Showcase Not Found</h1>
  <p>The requested campaign showcase does not exist or has been archived.</p>
  <a href="/" style="color:#3B82F6;">Return to TrafficLoop</a>
</body>
</html>`);
        return;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const canonicalUrl = `${baseUrl}/showcase/${item.slug}`;
      const safeTitle = String(item.title).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDesc = String(item.meta_description).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCategory = String(item.category).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      res.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} - Verified Showcase | TrafficLoop</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="index, follow" />
  
  <meta property="og:title" content="${safeTitle} - Verified Showcase" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #F8FAFC; margin: 0; padding: 40px 20px; }
    .container { max-width: 760px; margin: 0 auto; background: #111827; border: 1px solid #1F2937; border-radius: 12px; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
    h1 { font-size: 26px; margin: 16px 0 8px; color: #FFFFFF; }
    p.desc { color: #9CA3AF; line-height: 1.6; font-size: 15px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
    .card { background: #1F2937; padding: 16px; border-radius: 8px; border: 1px solid #374151; }
    .label { font-size: 12px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 4px; }
    .val { font-size: 18px; font-weight: 700; color: #F9FAFB; }
    .btn { display: inline-block; background: #2563EB; color: #FFFFFF; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .btn:hover { background: #1D4ED8; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Verified Traffic Campaign</span>
    <h1>${safeTitle}</h1>
    <p class="desc">${safeDesc}</p>
    
    <div class="grid">
      <div class="card">
        <div class="label">Category</div>
        <div class="val">${safeCategory}</div>
      </div>
      <div class="card">
        <div class="label">Total Verified Visits</div>
        <div class="val">${item.total_visits_received || 0}</div>
      </div>
      <div class="card">
        <div class="label">Health Status</div>
        <div class="val" style="color:#10B981;">Active &amp; Monitored</div>
      </div>
    </div>

    <a href="/" class="btn">Explore TrafficLoop Platform</a>
  </div>
</body>
</html>`);
    });

    // Server/Service Health check endpoint
    app.get('/api/health', (req, res) => {
      try {
        const dbCheck = db.prepare('SELECT 1 as alive').get() as any;
        const memoryUsage = process.memoryUsage();

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          database: dbCheck?.alive === 1 ? 'connected' : 'degraded',
          memory: {
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
          },
          services: {
            trafficDispatcher: 'running',
            campaignHealthMonitor: 'active',
            rewardLedgerSync: 'operational'
          }
        });
      } catch (err: any) {
        res.status(500).json({
          status: 'degraded',
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    });

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
