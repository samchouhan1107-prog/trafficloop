import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db.js';

export async function seedDatabase(): Promise<void> {
  const usersCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (usersCount > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial TrafficLoop database with production-grade demo data...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
  const demoPassword = process.env.SEED_DEMO_PASSWORD || crypto.randomBytes(16).toString('hex');
  const generalPassword = process.env.SEED_USER_PASSWORD || crypto.randomBytes(16).toString('hex');

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('[Security] SEED_ADMIN_PASSWORD not set. Generated random admin password:', adminPassword);
  }
  if (!process.env.SEED_DEMO_PASSWORD) {
    console.warn('[Security] SEED_DEMO_PASSWORD not set. Generated random demo password:', demoPassword);
  }
  if (!process.env.SEED_USER_PASSWORD) {
    console.warn('[Security] SEED_USER_PASSWORD not set. Generated random user password:', generalPassword);
  }

  const passwordHashAdmin = await bcrypt.hash(adminPassword, 10);
  const passwordHashDemo = await bcrypt.hash(demoPassword, 10);
  const passwordHashGeneral = await bcrypt.hash(generalPassword, 10);

  const now = new Date();
  const isoNow = now.toISOString();

  // 1. Create Users
  const adminId = crypto.randomUUID();
  const demoUserId = crypto.randomUUID();
  const userAlphaId = crypto.randomUUID();
  const userBetaId = crypto.randomUUID();
  const userGammaId = crypto.randomUUID();

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, role, location, credits,
      total_earned_credits, total_spent_credits, total_visits_made,
      total_visits_received, status, created_at, last_login_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Admin User
  insertUser.run(
    adminId,
    'admin@trafficloop.webzonebw.com',
    passwordHashAdmin,
    'System Administrator',
    'admin',
    'Botswana',
    1000.0,
    500.0,
    0.0,
    120,
    0,
    'active',
    new Date(Date.now() - 30 * 86400000).toISOString(),
    isoNow
  );

  // Demo User
  insertUser.run(
    demoUserId,
    'demo@webzonebw.com',
    passwordHashDemo,
    'Alex Rivera',
    'user',
    'India',
    85.0,
    115.0,
    45.0,
    48,
    36,
    'active',
    new Date(Date.now() - 14 * 86400000).toISOString(),
    isoNow
  );

  // Member 1
  insertUser.run(
    userAlphaId,
    'sophia.dev@webzonebw.com',
    passwordHashGeneral,
    'Sophia Chen',
    'user',
    'Botswana',
    140.0,
    220.0,
    95.0,
    88,
    72,
    'active',
    new Date(Date.now() - 20 * 86400000).toISOString(),
    isoNow
  );

  // Member 2
  insertUser.run(
    userBetaId,
    'marcus.tech@webzonebw.com',
    passwordHashGeneral,
    'Marcus Thorne',
    'user',
    'United States',
    210.0,
    310.0,
    120.0,
    130,
    98,
    'active',
    new Date(Date.now() - 25 * 86400000).toISOString(),
    isoNow
  );

  // Member 3
  insertUser.run(
    userGammaId,
    'elena.digital@webzonebw.com',
    passwordHashGeneral,
    'Elena Rostova',
    'user',
    'South Africa',
    95.0,
    150.0,
    70.0,
    62,
    54,
    'active',
    new Date(Date.now() - 10 * 86400000).toISOString(),
    isoNow
  );

  // 2. Initial Credit Transactions (Welcome Bonuses)
  const insertTx = db.prepare(`
    INSERT INTO credit_transactions (
      id, user_id, amount, type, description, reference_id, balance_after, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTx.run(crypto.randomUUID(), adminId, 1000.0, 'bonus', 'System Administrator initial reserve grant', null, 1000.0, isoNow);
  insertTx.run(crypto.randomUUID(), demoUserId, 15.0, 'bonus', 'Welcome bonus registration gift', null, 15.0, new Date(Date.now() - 14 * 86400000).toISOString());
  insertTx.run(crypto.randomUUID(), demoUserId, 70.0, 'visit_reward', 'Surfing session rewards (35 visits)', null, 85.0, isoNow);
  insertTx.run(crypto.randomUUID(), userAlphaId, 15.0, 'bonus', 'Welcome bonus registration gift', null, 15.0, new Date(Date.now() - 20 * 86400000).toISOString());
  insertTx.run(crypto.randomUUID(), userBetaId, 15.0, 'bonus', 'Welcome bonus registration gift', null, 15.0, new Date(Date.now() - 25 * 86400000).toISOString());
  insertTx.run(crypto.randomUUID(), userGammaId, 15.0, 'bonus', 'Welcome bonus registration gift', null, 15.0, new Date(Date.now() - 10 * 86400000).toISOString());

  // 3. Create High-Quality Live Campaigns
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (
      id, user_id, title, url, duration_seconds, credit_cost_per_visit,
      credit_budget, spent_credits, total_visits_received, status,
      category, daily_visit_limit, today_visits_received, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO campaign_reviews (
      id, campaign_id, reviewer_id, automated_score, automated_checks_json,
      status, rejection_reason, created_at, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoCampaigns = [
    {
      id: crypto.randomUUID(),
      userId: userAlphaId,
      title: 'Vite Next Generation Frontend Tooling',
      url: 'https://vite.dev',
      duration: 15,
      cost: 1.0,
      budget: 50.0,
      spent: 12.0,
      visits: 12,
      status: 'active',
      category: 'Developer Tools',
    },
    {
      id: crypto.randomUUID(),
      userId: userBetaId,
      title: 'Tailwind CSS Modern Styling System',
      url: 'https://tailwindcss.com',
      duration: 15,
      cost: 1.0,
      budget: 80.0,
      spent: 24.0,
      visits: 24,
      status: 'active',
      category: 'Web Development',
    },
    {
      id: crypto.randomUUID(),
      userId: userGammaId,
      title: 'TypeScript Official JavaScript with Types',
      url: 'https://www.typescriptlang.org',
      duration: 20,
      cost: 1.5,
      budget: 60.0,
      spent: 18.0,
      visits: 12,
      status: 'active',
      category: 'Tech & Software',
    },
    {
      id: crypto.randomUUID(),
      userId: userAlphaId,
      title: 'React Official Component Architecture Hub',
      url: 'https://react.dev',
      duration: 20,
      cost: 1.5,
      budget: 75.0,
      spent: 30.0,
      visits: 20,
      status: 'active',
      category: 'Web Development',
    },
    {
      id: crypto.randomUUID(),
      userId: userBetaId,
      title: 'Mozilla Developer Network Web Standards Portal',
      url: 'https://developer.mozilla.org',
      duration: 25,
      cost: 1.75,
      budget: 90.0,
      spent: 35.0,
      visits: 20,
      status: 'active',
      category: 'Education & Tech',
    },
    {
      id: crypto.randomUUID(),
      userId: userGammaId,
      title: 'Dev.to Community Developer Articles & Guides',
      url: 'https://dev.to',
      duration: 15,
      cost: 1.0,
      budget: 40.0,
      spent: 14.0,
      visits: 14,
      status: 'active',
      category: 'News & Blogs',
    },
    {
      id: crypto.randomUUID(),
      userId: demoUserId,
      title: 'WebZoneBW High-Speed Tools & Infrastructure',
      url: 'https://github.com',
      duration: 15,
      cost: 1.0,
      budget: 30.0,
      spent: 10.0,
      visits: 10,
      status: 'active',
      category: 'Developer Tools',
    },
    {
      id: crypto.randomUUID(),
      userId: demoUserId,
      title: 'Modern CSS Grid & Flexbox Complete Interactive Cheatsheet',
      url: 'https://css-tricks.com',
      duration: 20,
      cost: 1.5,
      budget: 25.0,
      spent: 0.0,
      visits: 0,
      status: 'pending_review',
      category: 'Web Development',
    }
  ];

  for (const c of demoCampaigns) {
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10 + 1) * 86400000).toISOString();
    insertCampaign.run(
      c.id,
      c.userId,
      c.title,
      c.url,
      c.duration,
      c.cost,
      c.budget,
      c.spent,
      c.visits,
      c.status,
      c.category,
      100,
      Math.floor(c.visits / 3),
      createdAt,
      createdAt
    );

    const checksJson = JSON.stringify({
      https_valid: true,
      domain_valid: true,
      private_ip_blocked: true,
      malicious_pattern_free: true,
      framing_warning: false,
      duplicate_check: true,
      latency_ms: Math.floor(Math.random() * 80 + 40),
      details: ['Valid HTTPS protocol verified', 'Public domain DNS resolved', 'No prohibited heuristics detected']
    });

    insertReview.run(
      crypto.randomUUID(),
      c.id,
      c.status === 'active' ? adminId : null,
      c.status === 'active' ? 98 : 92,
      checksJson,
      c.status === 'active' ? 'approved' : 'pending',
      null,
      createdAt,
      c.status === 'active' ? createdAt : null
    );
  }

  // 4. Activity Logs
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, user_id, user_email, action, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLog.run(crypto.randomUUID(), adminId, 'admin@trafficloop.webzonebw.com', 'system_initialized', 'TrafficLoop database schema and seed initialized', '127.0.0.1', isoNow);
  insertLog.run(crypto.randomUUID(), demoUserId, 'demo@webzonebw.com', 'user_registered', 'Account registered with welcome bonus', '127.0.0.1', new Date(Date.now() - 14 * 86400000).toISOString());
  insertLog.run(crypto.randomUUID(), demoUserId, 'demo@webzonebw.com', 'campaign_created', 'Created campaign WebZoneBW Tools', '127.0.0.1', new Date(Date.now() - 10 * 86400000).toISOString());

  console.log('✅ TrafficLoop database seed complete!');
}
