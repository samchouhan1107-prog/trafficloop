import { db } from '../database/db.js';

export interface SeoRecord {
  id: string;
  campaign_id: string;
  url: string;
  canonical_url: string;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  is_indexable: number;
  in_sitemap: number;
  http_status: number;
  created_at: string;
  updated_at: string;
}

export class SeoService {
  /**
   * Generates a clean, URL-safe slug from a title and campaign ID
   */
  static generateSlug(title: string, campaignId: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    const suffix = campaignId.replace(/-/g, '').slice(0, 6);
    return baseSlug ? `${baseSlug}-${suffix}` : `campaign-${suffix}`;
  }

  /**
   * Synchronizes or creates an SEO record for a campaign
   */
  static syncCampaignSeo(campaignId: string, baseUrl = 'https://ais-dev-2kihhyrlgt2whdrikfqcq7-875704011986.asia-east1.run.app'): SeoRecord | null {
    const campaign = db.prepare(`
      SELECT id, title, url, category, status, created_at, updated_at
      FROM campaigns
      WHERE id = ?
    `).get(campaignId) as any;

    if (!campaign) return null;

    const slug = this.generateSlug(campaign.title, campaign.id);
    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/showcase/${slug}`;
    const metaDescription = `Verified traffic showcase for ${campaign.title} on TrafficLoop. Category: ${campaign.category || 'Technology'}.`;
    const isIndexable = campaign.status === 'active' ? 1 : 0;
    const inSitemap = campaign.status === 'active' ? 1 : 0;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM seo_records WHERE campaign_id = ?').get(campaign.id) as any;

    if (existing) {
      db.prepare(`
        UPDATE seo_records
        SET url = ?,
            canonical_url = ?,
            slug = ?,
            title = ?,
            meta_description = ?,
            category = ?,
            is_indexable = ?,
            in_sitemap = ?,
            http_status = 200,
            updated_at = ?
        WHERE id = ?
      `).run(
        campaign.url,
        canonicalUrl,
        slug,
        campaign.title,
        metaDescription,
        campaign.category || 'Technology',
        isIndexable,
        inSitemap,
        now,
        existing.id
      );
    } else {
      const recordId = `seo-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO seo_records (
          id, campaign_id, url, canonical_url, slug, title,
          meta_description, category, is_indexable, in_sitemap,
          http_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 200, ?, ?)
      `).run(
        recordId,
        campaign.id,
        campaign.url,
        canonicalUrl,
        slug,
        campaign.title,
        metaDescription,
        campaign.category || 'Technology',
        isIndexable,
        inSitemap,
        campaign.created_at || now,
        now
      );
    }

    return db.prepare('SELECT * FROM seo_records WHERE campaign_id = ?').get(campaign.id) as unknown as SeoRecord;
  }

  /**
   * Syncs all existing active campaigns into seo_records
   */
  static syncAllCampaignsSeo(baseUrl?: string): number {
    const campaigns = db.prepare(`SELECT id FROM campaigns WHERE status = 'active'`).all() as Array<{ id: string }>;
    let count = 0;
    for (const c of campaigns) {
      if (this.syncCampaignSeo(c.id, baseUrl)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Retrieves all verified sitemap URLs, preventing duplicates, 404s, or malformed entries
   */
  static getSitemapEntries(baseUrl: string): Array<{ loc: string; priority: string; changefreq: string; lastmod: string }> {
    const cleanBase = baseUrl.replace(/\/$/, '');
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: `${cleanBase}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { loc: `${cleanBase}/surf`, priority: '0.9', changefreq: 'always', lastmod: today },
      { loc: `${cleanBase}/campaigns`, priority: '0.8', changefreq: 'daily', lastmod: today },
      { loc: `${cleanBase}/analytics`, priority: '0.7', changefreq: 'daily', lastmod: today },
      { loc: `${cleanBase}/tri-station`, priority: '0.8', changefreq: 'daily', lastmod: today },
      { loc: `${cleanBase}/rewards`, priority: '0.8', changefreq: 'daily', lastmod: today }
    ];

    // Query indexable seo_records
    const dynamicRecords = db.prepare(`
      SELECT slug, updated_at
      FROM seo_records
      WHERE is_indexable = 1 AND in_sitemap = 1 AND http_status = 200
      ORDER BY updated_at DESC
      LIMIT 100
    `).all() as Array<{ slug: string; updated_at: string }>;

    const dynamicPages = dynamicRecords.map(r => ({
      loc: `${cleanBase}/showcase/${r.slug}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: r.updated_at ? r.updated_at.split('T')[0] : today
    }));

    // Deduplicate by URL
    const seen = new Set<string>();
    const all = [...staticPages, ...dynamicPages].filter(p => {
      if (seen.has(p.loc)) return false;
      seen.add(p.loc);
      return true;
    });

    return all;
  }

  /**
   * Retrieves public SEO data for an indexable showcase slug
   */
  static getShowcaseBySlug(slug: string) {
    return db.prepare(`
      SELECT s.*, c.total_visits_received, c.category, c.status as campaign_status
      FROM seo_records s
      JOIN campaigns c ON s.campaign_id = c.id
      WHERE s.slug = ? AND s.is_indexable = 1
    `).get(slug) as any;
  }
}
