import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'trafficloop.sqlite');

function cleanCorruptedFiles(filePath: string) {
  const filesToDelete = [
    filePath,
    `${filePath}-wal`,
    `${filePath}-shm`,
    `${filePath}-journal`,
  ];
  for (const f of filesToDelete) {
    try {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.warn(`[Database Recovery] Cleaned up database artifact: ${f}`);
      }
    } catch (unlinkErr) {
      console.error(`[Database Recovery] Failed to clean up file ${f}:`, unlinkErr);
    }
  }
}

function openDatabaseInstance(filePath: string): DatabaseSync {
  try {
    const instance = new DatabaseSync(filePath);
    instance.exec('PRAGMA integrity_check;');
    return instance;
  } catch (err: any) {
    console.error(`[Database Warning] Database initialization failed or malformed at ${filePath}:`, err?.message || err);
    console.warn('[Database Recovery] Cleaning up corrupted SQLite/WAL/SHM disk images and creating fresh instance...');
    cleanCorruptedFiles(filePath);
    const freshInstance = new DatabaseSync(filePath);
    freshInstance.exec('PRAGMA integrity_check;');
    return freshInstance;
  }
}

let dbInstance = openDatabaseInstance(DB_PATH);

export const db = new Proxy({} as DatabaseSync, {
  get(_target, prop, receiver) {
    const val = (dbInstance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(dbInstance);
    }
    return Reflect.get(dbInstance, prop, receiver);
  }
});

function setupSchemaAndTables(): void {
  // Enable foreign keys and WAL mode safely
  try {
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    console.warn('Failed to set foreign_keys pragma:', e);
  }

  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {
    console.warn('Failed to set journal_mode pragma:', e);
  }

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      location TEXT NOT NULL DEFAULT 'Botswana',
      credits REAL NOT NULL DEFAULT 10.0,
      total_earned_credits REAL NOT NULL DEFAULT 0.0,
      total_spent_credits REAL NOT NULL DEFAULT 0.0,
      total_visits_made INTEGER NOT NULL DEFAULT 0,
      total_visits_received INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      last_daily_bonus_at TEXT,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );
  `);

  // 2. Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Campaigns Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 15,
      credit_cost_per_visit REAL NOT NULL DEFAULT 1.0,
      credit_budget REAL NOT NULL DEFAULT 10.0,
      spent_credits REAL NOT NULL DEFAULT 0.0,
      total_visits_received INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending_review',
      category TEXT NOT NULL DEFAULT 'Tech & Software',
      daily_visit_limit INTEGER NOT NULL DEFAULT 100,
      today_visits_received INTEGER NOT NULL DEFAULT 0,
      last_visit_reset_date TEXT,
      rejection_reason TEXT,
      bonus_visit_limit INTEGER NOT NULL DEFAULT 500000,
      bonus_visits_delivered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Campaign Reviews Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_reviews (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      reviewer_id TEXT,
      automated_score INTEGER NOT NULL DEFAULT 100,
      automated_checks_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 5. Visits Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      visitor_user_id TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      actual_dwell_seconds INTEGER NOT NULL,
      credits_earned REAL NOT NULL,
      credits_charged REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'started',
      verification_code TEXT,
      session_token TEXT UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Credit Transactions Table (Double-entry / strict ledger)
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      balance_after REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Activity Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 8. Admin Actions Audit Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      target_type TEXT,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 9. Platform Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id TEXT PRIMARY KEY,
      base_credit_reward REAL NOT NULL DEFAULT 1.0,
      cost_per_second REAL NOT NULL DEFAULT 0.05,
      min_duration_seconds INTEGER NOT NULL DEFAULT 10,
      max_duration_seconds INTEGER NOT NULL DEFAULT 60,
      welcome_bonus_credits REAL NOT NULL DEFAULT 15.0,
      daily_bonus_credits REAL NOT NULL DEFAULT 5.0,
      cooldown_between_same_campaign_mins INTEGER NOT NULL DEFAULT 30,
      auto_approval_enabled INTEGER NOT NULL DEFAULT 1,
      auto_approval_min_score INTEGER NOT NULL DEFAULT 85,
      max_visits_per_user_hourly INTEGER NOT NULL DEFAULT 120,
      maintenance_mode INTEGER NOT NULL DEFAULT 0,
      bank_name TEXT NOT NULL DEFAULT '',
      bank_account_name TEXT NOT NULL DEFAULT '',
      bank_account_number TEXT NOT NULL DEFAULT '',
      bank_branch_code TEXT NOT NULL DEFAULT '',
      bank_swift_code TEXT NOT NULL DEFAULT '',
      bank_currency TEXT NOT NULL DEFAULT 'BWP',
      bank_payment_instructions TEXT NOT NULL DEFAULT '',
      credit_price_per_unit REAL NOT NULL DEFAULT 0.02,
      mobile_money_details TEXT NOT NULL DEFAULT '',
      crypto_wallet_address TEXT NOT NULL DEFAULT '',
      upi_id TEXT NOT NULL DEFAULT '',
      upi_name TEXT NOT NULL DEFAULT '',
      upi_bank_name TEXT NOT NULL DEFAULT '',
      upi_instructions TEXT NOT NULL DEFAULT '',
      upi_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // 10. Payment Orders & Bank Top-ups Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      package_name TEXT NOT NULL,
      credits_amount REAL NOT NULL,
      fiat_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BWP',
      payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
      payment_reference TEXT NOT NULL UNIQUE,
      proof_reference TEXT,
      proof_notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      reviewed_by_name TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 11. Reward Ledger Table (Server-side immutable fraud-resistant reward tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reward_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      eligibility_source TEXT NOT NULL,
      qualifying_event_id TEXT NOT NULL UNIQUE,
      amount_inr REAL NOT NULL,
      amount_credits REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'ELIGIBLE',
      transaction_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      claimed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ga4_delivery_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      target_url TEXT NOT NULL,
      measurement_id TEXT,
      client_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      event_name TEXT NOT NULL DEFAULT 'page_view',
      country_name TEXT,
      country_code TEXT,
      city TEXT,
      geo_ip TEXT,
      http_status INTEGER,
      status TEXT NOT NULL,
      details TEXT,
      source TEXT DEFAULT 'exchange_surf',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe schema migrations for existing databases
  const runMigration = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // Column already exists or already migrated
    }
  };

  runMigration("ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT 'Botswana';");
  runMigration("ALTER TABLE users ADD COLUMN preferred_currency TEXT NOT NULL DEFAULT 'INR';");
  runMigration("ALTER TABLE credit_transactions ADD COLUMN inr_value REAL;");
  runMigration("ALTER TABLE credit_transactions ADD COLUMN currency TEXT DEFAULT 'INR';");
  runMigration("ALTER TABLE campaigns ADD COLUMN target_locations TEXT NOT NULL DEFAULT 'Worldwide';");
  runMigration("ALTER TABLE campaigns ADD COLUMN device_targeting TEXT NOT NULL DEFAULT 'all';");
  runMigration("ALTER TABLE campaigns ADD COLUMN ga4_measurement_id TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE campaigns ADD COLUMN ga4_api_secret TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE campaigns ADD COLUMN bonus_visit_limit INTEGER NOT NULL DEFAULT 500000;");
  runMigration("ALTER TABLE campaigns ADD COLUMN bonus_visits_delivered INTEGER NOT NULL DEFAULT 0;");
  runMigration("ALTER TABLE visits ADD COLUMN visitor_country TEXT DEFAULT 'Botswana';");
  runMigration("ALTER TABLE visits ADD COLUMN visitor_country_code TEXT DEFAULT 'BW';");
  runMigration("ALTER TABLE visits ADD COLUMN visitor_device TEXT DEFAULT 'desktop';");
  runMigration("ALTER TABLE visits ADD COLUMN http_status INTEGER DEFAULT 200;");
  runMigration("ALTER TABLE visits ADD COLUMN observation_status TEXT DEFAULT 'VERIFIED';");
  runMigration("ALTER TABLE visits ADD COLUMN station_id TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE visits ADD COLUMN ga4_measurement_id TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE visits ADD COLUMN ga4_client_id TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE visits ADD COLUMN traffic_source TEXT DEFAULT 'direct';");
  runMigration("ALTER TABLE visits ADD COLUMN egress_ip TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE visits ADD COLUMN egress_country TEXT DEFAULT NULL;");
  runMigration("ALTER TABLE visits ADD COLUMN egress_country_code TEXT DEFAULT NULL;");

  // Ensure default platform settings exists (no hardcoded credentials)
  try {
    db.prepare(`
      UPDATE platform_settings
      SET bank_name = COALESCE(NULLIF(bank_name, ''), ''),
          bank_account_name = COALESCE(NULLIF(bank_account_name, ''), ''),
          bank_account_number = COALESCE(NULLIF(bank_account_number, ''), ''),
          bank_swift_code = COALESCE(NULLIF(bank_swift_code, ''), ''),
          mobile_money_details = COALESCE(NULLIF(mobile_money_details, ''), ''),
          crypto_wallet_address = COALESCE(NULLIF(crypto_wallet_address, ''), ''),
          upi_id = COALESCE(NULLIF(upi_id, ''), ''),
          upi_name = COALESCE(NULLIF(upi_name, ''), ''),
          upi_bank_name = COALESCE(NULLIF(upi_bank_name, ''), '')
      WHERE id = 'default'
    `).run();
  } catch {
    // Ignore if not present yet
  }

  // Indexes for high performance querying
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_user_id);
    CREATE INDEX IF NOT EXISTS idx_visits_campaign ON visits(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_visits_completed ON visits(completed_at);
    CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
    CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_campaign ON campaign_reviews(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_orders(status);
    CREATE INDEX IF NOT EXISTS idx_rewards_user ON reward_ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_status ON reward_ledger(status);
    CREATE INDEX IF NOT EXISTS idx_rewards_event ON reward_ledger(qualifying_event_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_created ON reward_ledger(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);

  // Insert default settings if not exists
  const existingSettings = db.prepare('SELECT id FROM platform_settings WHERE id = ?').get('default');
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO platform_settings (
        id, base_credit_reward, cost_per_second, min_duration_seconds,
        max_duration_seconds, welcome_bonus_credits, daily_bonus_credits,
        cooldown_between_same_campaign_mins, auto_approval_enabled,
        auto_approval_min_score, max_visits_per_user_hourly, maintenance_mode,
        bank_name, bank_account_name, bank_account_number, bank_branch_code,
        bank_swift_code, bank_currency, bank_payment_instructions,
        credit_price_per_unit, mobile_money_details, crypto_wallet_address, updated_at
      ) VALUES (
        'default', 1.0, 0.05, 10, 60, 15.0, 5.0, 30, 1, 85, 120, 0,
        '', '', '', '', '', 'BWP', '',
        0.02, '', '', ?
      )
    `).run(new Date().toISOString());
  }

  // Seed Network Showcase Pool if active campaigns are empty or low
  seedNetworkShowcasePool();
}

export function initializeDatabase(): void {
  try {
    setupSchemaAndTables();
  } catch (err: any) {
    console.error('[Database Error] Failed during database schema initialization:', err?.message || err);
    if (err?.message?.includes('malformed') || err?.code === 'ERR_SQLITE_ERROR' || err?.errcode === 11) {
      console.warn('[Database Recovery] Malformed error detected during schema setup. Performing full database reset and recovery...');
      try {
        dbInstance.close();
      } catch (closeErr) {
        console.warn('Error closing database instance during recovery:', closeErr);
      }
      cleanCorruptedFiles(DB_PATH);
      dbInstance = new DatabaseSync(DB_PATH);
      setupSchemaAndTables();
    } else {
      throw err;
    }
  }
}

function seedNetworkShowcasePool(): void {
  try {
    const activeCount = (db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status = 'active'").get() as any)?.c || 0;
    if (activeCount >= 5) return;

    const now = new Date().toISOString();
    const systemUserId = 'system-network-node';
    
    // Ensure system node user exists
    const existingSystemUser = db.prepare('SELECT id FROM users WHERE id = ?').get(systemUserId);
    if (!existingSystemUser) {
      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, name, role, location, preferred_currency,
          credits, total_earned_credits, total_spent_credits,
          total_visits_made, total_visits_received, status, created_at, last_login_at
        ) VALUES (?, ?, ?, ?, 'admin', 'Global Network', 'INR', 100000.0, 100000.0, 0.0, 0, 0, 'active', ?, ?)
      `).run(
        systemUserId,
        'network@trafficloop.global',
        'system_managed_pool_hash_never_login',
        'TrafficLoop Verified Network Showcase',
        now,
        now
      );
    }

    const seedShowcases = [
      {
        id: 'showcase-devdocs',
        title: 'MDN Web Developer Platform & API Docs',
        url: 'https://developer.mozilla.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Tech & Software'
      },
      {
        id: 'showcase-wikipedia',
        title: 'Wikipedia Open Knowledge Network',
        url: 'https://en.wikipedia.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Education & Career'
      },
      {
        id: 'showcase-openstreetmap',
        title: 'OpenStreetMap Global Geospatial Project',
        url: 'https://www.openstreetmap.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Travel & Regional'
      },
      {
        id: 'showcase-archive',
        title: 'Internet Archive Universal Media Repository',
        url: 'https://archive.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Entertainment & Media'
      },
      {
        id: 'showcase-w3c',
        title: 'W3C Open Web Platform & Web Standards',
        url: 'https://www.w3.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Tech & Software'
      },
      {
        id: 'showcase-freecodecamp',
        title: 'freeCodeCamp Global Open Interactive Learning',
        url: 'https://www.freecodecamp.org',
        duration_seconds: 15,
        credit_cost_per_visit: 1.0,
        credit_budget: 10000.0,
        category: 'Education & Career'
      }
    ];

    const insertCampaign = db.prepare(`
      INSERT OR IGNORE INTO campaigns (
        id, user_id, title, url, duration_seconds, credit_cost_per_visit,
        credit_budget, spent_credits, total_visits_received, status,
        category, daily_visit_limit, today_visits_received, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 0, 'active', ?, 50000, 0, ?, ?)
    `);

    for (const s of seedShowcases) {
      insertCampaign.run(
        s.id,
        systemUserId,
        s.title,
        s.url,
        s.duration_seconds,
        s.credit_cost_per_visit,
        s.credit_budget,
        s.category,
        now,
        now
      );
    }
  } catch (err) {
    console.error('Failed to seed network showcase pool:', err);
  }
}

