import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { assertUrlSafe } from '../utils/urlSafety.js';

export interface GA4VisitDispatchParams {
  userId?: string;
  campaignId?: string;
  targetUrl: string;
  measurementId?: string | null;
  geoIp: string;
  countryCode: string;
  countryName: string;
  city: string;
  region?: string;
  locale?: string;
  languages?: string;
  dwellDurationSeconds: number;
  deviceProfile?: string;
  userAgent: string;
  referrer?: string;
  title?: string;
  clientId?: string;
  sessionId?: string;
  campaignTitle?: string;
  searchKeyword?: string;
  searchTheme?: string;
  trafficMedium?: 'organic' | 'referral' | 'direct' | 'cpc';
  source?: string;
}

export interface GA4DispatchResult {
  success: boolean;
  measurementId: string | null;
  status: 'dispatched' | 'not_detected' | 'error';
  details: string;
  httpStatus?: number;
  clientId?: string;
  sessionId?: string;
  searchKeyword?: string;
  searchTheme?: string;
  trafficMedium?: string;
  geoSummary?: string;
}

export interface GA4TagScanResult {
  url: string;
  isReachable: boolean;
  httpStatus?: number;
  detectedMeasurementId: string | null;
  detectedGtmId: string | null;
  detectedUniversalAnalyticsId: string | null;
  hasGtagScript: boolean;
  hasGtmScript: boolean;
  hasDataLayer: boolean;
  isSpaOrClientSide: boolean;
  details: string[];
  recommendations: string[];
}

export interface GA4TestPingResult {
  success: boolean;
  measurementId: string;
  httpStatus: number;
  statusText: string;
  clientId: string;
  sessionId: string;
  timestamp: string;
  geoSummary: string;
  targetUrl: string;
  endpointUsed: string;
  parametersSent: Record<string, string>;
  details: string;
  realtimeGuide: string;
}

export class GA4Service {
  private static systemMeasurementId = process.env.GA4_MEASUREMENT_ID;
  private static systemApiSecret = process.env.GA4_API_SECRET;

  // In-memory cache for discovered GA4 Measurement IDs per URL
  private static measurementIdCache = new Map<string, { id: string | null; timestamp: number }>();

  /**
   * Generates a realistic Google Analytics Client ID (cid) in standard browser cookie format
   * e.g., '1482910482.1725178492'
   */
  public static generateGAClientId(seed?: string): string {
    if (seed) {
      const hash = crypto.createHash('md5').update(seed).digest('hex');
      const p1 = parseInt(hash.substring(0, 8), 16) % 900000000 + 100000000;
      const p2 = Math.floor(Date.now() / 1000) - Math.floor(parseInt(hash.substring(8, 12), 16) % 3600);
      return `${p1}.${p2}`;
    }
    const randPart = Math.floor(Math.random() * 899999999 + 100000000);
    const timestampPart = Math.floor(Date.now() / 1000);
    return `${randPart}.${timestampPart}`;
  }

  /**
   * Scans website HTML content or fetches URL to extract GA4 Measurement ID (G-XXXXXXXXXX)
   */
  public static async discoverMeasurementId(url: string, htmlContent?: string): Promise<string | null> {
    if (!url || !url.startsWith('http')) return null;

    // Check cache (1 hour TTL)
    const cached = this.measurementIdCache.get(url);
    if (cached && (Date.now() - cached.timestamp < 3600000)) {
      return cached.id;
    }

    let html = htmlContent || '';

    // If no HTML was provided, fetch the page with a fast timeout
    if (!html) {
      try {
        assertUrlSafe(url);
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(4000)
        });
        if (resp.ok) {
          html = await resp.text().catch(() => '');
        }
      } catch {
        // Fetch failed or timed out
      }
    }

    let detectedId: string | null = null;

    if (html) {
      // 1. Check for standard gtag config: gtag('config', 'G-XXXXXXXXXX') or gtag("config", "G-XXXXXXXXXX")
      const gtagMatch = html.match(/gtag\s*\(\s*['"]config['"]\s*,\s*['"](G-[A-Za-z0-9]{6,16})['"]/i);
      if (gtagMatch && gtagMatch[1]) {
        detectedId = gtagMatch[1].toUpperCase();
      }

      // 2. Check for googletagmanager script tag: id=G-XXXXXXXXXX
      if (!detectedId) {
        const gtmScriptMatch = html.match(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Za-z0-9]{6,16})/i);
        if (gtmScriptMatch && gtmScriptMatch[1]) {
          detectedId = gtmScriptMatch[1].toUpperCase();
        }
      }

      // 3. Check for data-ga or data-analytics attributes
      if (!detectedId) {
        const dataGaMatch = html.match(/data-ga(?:4)?=['"](G-[A-Za-z0-9]{6,16})['"]/i);
        if (dataGaMatch && dataGaMatch[1]) {
          detectedId = dataGaMatch[1].toUpperCase();
        }
      }

      // 4. Fallback: Any standalone G-XXXXXXXXXX pattern inside script blocks or body
      if (!detectedId) {
        const generalMatch = html.match(/\b(G-[A-Z0-9]{8,14})\b/i);
        if (generalMatch && generalMatch[1]) {
          detectedId = generalMatch[1].toUpperCase();
        }
      }
    }

    this.measurementIdCache.set(url, { id: detectedId, timestamp: Date.now() });
    return detectedId;
  }

  /**
   * Deep diagnostic scan of a target URL to check for Google Analytics 4 tags, GTM containers, and SPA scripts
   */
  public static async scanWebsiteForGATags(url: string): Promise<GA4TagScanResult> {
    const details: string[] = [];
    const recommendations: string[] = [];
    let isReachable = false;
    let httpStatus: number | undefined;
    let html = '';

    if (!url || !url.startsWith('http')) {
      return {
        url,
        isReachable: false,
        detectedMeasurementId: null,
        detectedGtmId: null,
        detectedUniversalAnalyticsId: null,
        hasGtagScript: false,
        hasGtmScript: false,
        hasDataLayer: false,
        isSpaOrClientSide: false,
        details: ['Invalid URL format. Please provide a full URL starting with https:// or http://'],
        recommendations: ['Check destination URL syntax']
      };
    }

    try {
      assertUrlSafe(url);
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(6000)
      });
      httpStatus = resp.status;
      isReachable = resp.ok;
      html = await resp.text().catch(() => '');
      details.push(`HTTP ${resp.status} ${resp.statusText} (${html.length} bytes received)`);
    } catch (err: any) {
      details.push(`Connection failed: ${err.message || 'Timeout'}`);
      recommendations.push('Ensure the web server is online and accessible publicly.');
    }

    // 1. Detect GA4 Tag (G-XXXXXXXXXX)
    let detectedMeasurementId: string | null = null;
    const gtagMatch = html.match(/gtag\s*\(\s*['"]config['"]\s*,\s*['"](G-[A-Za-z0-9]{6,16})['"]/i);
    if (gtagMatch) detectedMeasurementId = gtagMatch[1].toUpperCase();

    if (!detectedMeasurementId) {
      const gtmScriptMatch = html.match(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Za-z0-9]{6,16})/i);
      if (gtmScriptMatch) detectedMeasurementId = gtmScriptMatch[1].toUpperCase();
    }

    if (!detectedMeasurementId) {
      const generalMatch = html.match(/\b(G-[A-Z0-9]{8,14})\b/i);
      if (generalMatch) detectedMeasurementId = generalMatch[1].toUpperCase();
    }

    // 2. Detect GTM Container (GTM-XXXXXXX)
    let detectedGtmId: string | null = null;
    const gtmMatch = html.match(/\b(GTM-[A-Z0-9]{5,10})\b/i);
    if (gtmMatch) detectedGtmId = gtmMatch[1].toUpperCase();

    // 3. Detect Legacy Universal Analytics (UA-XXXXX-Y)
    let detectedUniversalAnalyticsId: string | null = null;
    const uaMatch = html.match(/\b(UA-\d{4,10}-\d{1,4})\b/i);
    if (uaMatch) detectedUniversalAnalyticsId = uaMatch[1].toUpperCase();

    // 4. Scripts and DataLayer presence
    const hasGtagScript = /googletagmanager\.com\/gtag\/js/i.test(html) || /gtag\s*\(/i.test(html);
    const hasGtmScript = /googletagmanager\.com\/gtm\.js/i.test(html);
    const hasDataLayer = /window\.dataLayer\s*=/i.test(html) || /dataLayer\.push/i.test(html);

    // 5. Detect SPA / Client-side rendering (Next.js, Vite, React, Vue, Nuxt)
    const isSpaOrClientSide = /<div id=["'](?:root|app|__next)["']>\s*<\/div>/i.test(html) ||
      /__NEXT_DATA__/i.test(html) ||
      /vite\/client/i.test(html) ||
      html.includes('Loading...') && html.length < 3000;

    if (detectedMeasurementId) {
      details.push(`✅ Found Google Analytics 4 Measurement ID: ${detectedMeasurementId}`);
      recommendations.push(`Tag ${detectedMeasurementId} is active on this URL.`);
    } else {
      details.push('⚠️ No Google Analytics 4 (G-XXXXXXXXXX) tag found in raw HTML.');
      if (isSpaOrClientSide) {
        details.push('ℹ️ Notice: This website appears to be a Client-Side Single Page App (SPA). Scripts are dynamically injected in browser memory.');
        recommendations.push('In TrafficLoop, manually configure your Google Analytics 4 Measurement ID (G-XXXXXXXXXX) in Campaign Settings.');
      } else {
        recommendations.push('Add the Google Analytics 4 tracking script (gtag.js) to your website <head> tag or configure your Measurement ID manually.');
      }
    }

    if (detectedGtmId) {
      details.push(`ℹ️ Google Tag Manager container detected: ${detectedGtmId}`);
    }

    if (detectedUniversalAnalyticsId) {
      details.push(`⚠️ Legacy Universal Analytics tag detected: ${detectedUniversalAnalyticsId} (Google sunset UA in 2023 - ensure GA4 is also active).`);
    }

    if (hasDataLayer) {
      details.push('✅ dataLayer array initialized.');
    }

    return {
      url,
      isReachable,
      httpStatus,
      detectedMeasurementId,
      detectedGtmId,
      detectedUniversalAnalyticsId,
      hasGtagScript,
      hasGtmScript,
      hasDataLayer,
      isSpaOrClientSide,
      details,
      recommendations
    };
  }

  /**
   * Dispatches high-fidelity Google Analytics (GA4) page_view beacon with precise Country & City IP attribution
   * so GA4 Realtime and Traffic Acquisition reports measure the exact visitor location without dropping.
   */
  public static async trackWebsiteVisit(params: GA4VisitDispatchParams): Promise<GA4DispatchResult> {
    const {
      userId,
      campaignId,
      targetUrl,
      geoIp,
      countryCode,
      countryName,
      city,
      region,
      locale = 'en-US',
      languages = 'en-US,en;q=0.9',
      dwellDurationSeconds = 20,
      userAgent,
      title = 'TrafficLoop Verified Session',
      clientId: customClientId,
      sessionId: customSessionId,
      campaignTitle,
      searchKeyword,
      searchTheme,
      trafficMedium = 'organic',
      source = 'exchange_surf'
    } = params;

    // 1. Resolve Target Measurement ID (custom override, explicit param, or auto-discovered)
    let tid = params.measurementId?.trim() || null;
    if (!tid) {
      tid = await this.discoverMeasurementId(targetUrl);
    }

    if (!tid) {
      // Record failure log
      if (userId) {
        try {
          db.prepare(`
            INSERT INTO ga4_delivery_logs (
              id, user_id, campaign_id, target_url, measurement_id, client_id, session_id,
              event_name, country_name, country_code, city, geo_ip, http_status, status, details, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'page_view', ?, ?, ?, ?, 0, 'not_detected', ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            userId,
            campaignId || null,
            targetUrl,
            null,
            customClientId || 'unknown',
            customSessionId || String(Math.floor(Date.now() / 1000)),
            countryName,
            countryCode,
            city,
            geoIp,
            'No GA4 Measurement ID detected or configured',
            source,
            new Date().toISOString()
          );
        } catch {}
      }

      return {
        success: false,
        measurementId: null,
        status: 'not_detected',
        details: 'No GA4 Measurement Tag (G-XXXXXXXXXX) found on destination HTML or provided in config.'
      };
    }

    // Resolve realistic referrer: if searchKeyword provided, construct organic search referrer
    let effectiveReferrer = params.referrer;
    if (!effectiveReferrer || effectiveReferrer === '(Direct Navigation)') {
      if (searchKeyword && searchKeyword.trim()) {
        effectiveReferrer = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword.trim())}`;
      } else {
        effectiveReferrer = 'https://www.google.com/';
      }
    } else if (effectiveReferrer.includes('google.com') && searchKeyword && !effectiveReferrer.includes('q=')) {
      effectiveReferrer = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword.trim())}`;
    }

    // Ensure client ID and session ID are formatted properly
    const clientId = customClientId || this.generateGAClientId(`${geoIp}_${Date.now()}`);
    const sessionId = customSessionId || String(Math.floor(Date.now() / 1000));
    const engagementTimeMs = Math.min(60000, Math.max(5000, dwellDurationSeconds * 1000));

    try {
      // Build GA4 Direct Browser Measurement Protocol Collection URL (v=2 endpoint)
      const collectBaseUrl = 'https://www.google-analytics.com/g/collect';
      const urlParams = new URLSearchParams();

      urlParams.set('v', '2');
      urlParams.set('tid', tid);
      urlParams.set('gtm', '45je4910v870' + Math.floor(Math.random() * 89999 + 10000));
      urlParams.set('_p', String(Math.floor(Math.random() * 899999999 + 100000000)));
      urlParams.set('cid', clientId);
      urlParams.set('ul', (locale || 'en-us').toLowerCase());
      urlParams.set('sr', params.deviceProfile === 'mobile' ? '390x844' : '1920x1080');
      urlParams.set('_s', '1');
      urlParams.set('sid', sessionId);
      urlParams.set('sct', '1');
      urlParams.set('seg', '1'); // Session Engaged = 1 (CRITICAL: prevents 0s bounce drops in GA4)
      urlParams.set('dl', targetUrl);
      urlParams.set('dt', campaignTitle || title);
      urlParams.set('dr', effectiveReferrer);
      urlParams.set('en', 'page_view');
      urlParams.set('_ee', '1'); // Engagement event
      urlParams.set('_et', String(Math.min(engagementTimeMs, 15000)));
      urlParams.set('ep.engagement_time_msec', String(engagementTimeMs));

      // User IP parameter for GA4 GeoIP resolution (country, region, city, ISP)
      urlParams.set('uip', geoIp);
      urlParams.set('_uip', geoIp);

      // Custom event parameters for explicit dimension reporting in GA4
      urlParams.set('ep.country', countryName);
      urlParams.set('ep.country_code', countryCode.toUpperCase());
      urlParams.set('ep.city', city);
      if (region) urlParams.set('ep.region', region);
      
      // External search keyword and theme attribution
      if (searchKeyword && searchKeyword.trim()) {
        urlParams.set('ep.search_keyword', searchKeyword.trim());
        urlParams.set('ep.search_theme', searchTheme || searchKeyword.trim());
        urlParams.set('ep.keyword', searchKeyword.trim());
      }
      urlParams.set('ep.traffic_source', effectiveReferrer.includes('google') ? 'google' : 'organic');
      urlParams.set('ep.traffic_medium', trafficMedium || 'organic');
      urlParams.set('ep.traffic_type', 'external_visit');
      urlParams.set('ep.cid', clientId);
      urlParams.set('ep.campaign', campaignTitle ? campaignTitle.substring(0, 40) : (searchKeyword || 'organic_geo_mesh'));

      const fullUrl = `${collectBaseUrl}?${urlParams.toString()}`;

      // Dispatch request with realistic proxy forwarding headers matching country & city
      const resp = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': languages,
          'X-Forwarded-For': geoIp,
          'Client-IP': geoIp,
          'CF-Connecting-IP': geoIp,
          'X-Real-IP': geoIp,
          'X-Geo-Country': countryCode.toUpperCase(),
          'X-Geo-City': city,
          'Origin': new URL(targetUrl).origin,
          'Referer': effectiveReferrer
        },
        signal: AbortSignal.timeout(5000)
      }).catch(err => {
        return { ok: false, status: 500, statusText: err.message } as any;
      });

      const isSuccess = resp.ok || resp.status === 200 || resp.status === 204;
      const kwInfo = searchKeyword ? ` · Theme: "${searchKeyword}"` : '';
      const detailsMsg = isSuccess
        ? `✅ GA4 hit delivered to ${tid} · CID: ${clientId} · Geo: ${city}, ${countryName} (${countryCode}) · IP: ${geoIp}${kwInfo}`
        : `⚠️ GA4 beacon returned HTTP ${resp.status}: ${resp.statusText}`;

      // Record to delivery logs table
      if (userId) {
        try {
          db.prepare(`
            INSERT INTO ga4_delivery_logs (
              id, user_id, campaign_id, target_url, measurement_id, client_id, session_id,
              event_name, country_name, country_code, city, geo_ip, http_status, status, details, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'page_view', ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            userId,
            campaignId || null,
            targetUrl,
            tid,
            clientId,
            sessionId,
            countryName,
            countryCode,
            city,
            geoIp,
            resp.status || 200,
            isSuccess ? 'dispatched' : 'error',
            detailsMsg,
            source,
            new Date().toISOString()
          );
        } catch {}
      }

      return {
        success: isSuccess,
        measurementId: tid,
        status: isSuccess ? 'dispatched' : 'error',
        details: detailsMsg,
        httpStatus: resp.status,
        clientId,
        sessionId,
        searchKeyword,
        searchTheme: searchTheme || searchKeyword,
        trafficMedium,
        geoSummary: `${city}, ${countryName} (${countryCode})`
      };
    } catch (error: any) {
      return {
        success: false,
        measurementId: tid,
        status: 'error',
        details: `GA4 delivery failed for ${tid}`
      };
    }
  }

  /**
   * Dispatches an instant test ping to Google Analytics Realtime to verify property setup
   */
  public static async sendTestPing(params: {
    userId?: string;
    campaignId?: string;
    url: string;
    measurementId?: string;
    countryCode?: string;
  }): Promise<GA4TestPingResult> {
    const { userId, campaignId, url, countryCode = 'IN' } = params;

    let targetId = params.measurementId?.trim() || null;
    if (!targetId) {
      targetId = await this.discoverMeasurementId(url);
    }

    if (!targetId) {
      throw new Error('Google Analytics 4 Measurement ID is required (e.g., G-XXXXXXXXXX). Please provide your Measurement ID.');
    }

    const testCid = this.generateGAClientId(`test_ping_${Date.now()}`);
    const testSid = String(Math.floor(Date.now() / 1000));
    const nowIso = new Date().toISOString();

    const countryName = countryCode === 'IN' ? 'India' : countryCode === 'US' ? 'United States' : countryCode === 'GB' ? 'United Kingdom' : 'Global';
    const city = countryCode === 'IN' ? 'Mumbai' : countryCode === 'US' ? 'New York' : 'London';
    const testIp = countryCode === 'IN' ? '103.21.244.17' : countryCode === 'US' ? '172.56.42.109' : '82.165.197.43';

    const urlParams = new URLSearchParams();
    urlParams.set('v', '2');
    urlParams.set('tid', targetId);
    urlParams.set('cid', testCid);
    urlParams.set('sid', testSid);
    urlParams.set('sct', '1');
    urlParams.set('seg', '1');
    urlParams.set('dl', url);
    urlParams.set('dt', 'TrafficLoop Live GA4 Verification Ping');
    urlParams.set('dr', 'https://www.google.com/search?q=trafficloop+verification');
    urlParams.set('en', 'page_view');
    urlParams.set('_ee', '1');
    urlParams.set('_et', '10000');
    urlParams.set('ep.engagement_time_msec', '10000');
    urlParams.set('uip', testIp);
    urlParams.set('_uip', testIp);
    urlParams.set('ep.country', countryName);
    urlParams.set('ep.city', city);
    urlParams.set('ep.traffic_source', 'trafficloop_verification_test');
    urlParams.set('ep.traffic_medium', 'cpc');
    urlParams.set('ep.test_ping', 'true');

    const collectUrl = `https://www.google-analytics.com/g/collect?${urlParams.toString()}`;

    const resp = await fetch(collectUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'X-Forwarded-For': testIp,
        'Client-IP': testIp,
        'X-Geo-Country': countryCode,
        'X-Geo-City': city
      },
      signal: AbortSignal.timeout(6000)
    }).catch(err => {
      return { ok: false, status: 500, statusText: err.message } as any;
    });

    const isSuccess = resp.ok || resp.status === 200 || resp.status === 204;
    const details = isSuccess
      ? `Live beacon dispatched to Google Analytics ${targetId} (HTTP ${resp.status || 204}). Check Google Analytics Realtime report.`
      : `Google Analytics beacon returned status HTTP ${resp.status}: ${resp.statusText}`;

    // Record to delivery logs
    if (userId) {
      try {
        db.prepare(`
          INSERT INTO ga4_delivery_logs (
            id, user_id, campaign_id, target_url, measurement_id, client_id, session_id,
            event_name, country_name, country_code, city, geo_ip, http_status, status, details, source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'test_ping', ?, ?, ?, ?, ?, ?, ?, 'live_test_ping', ?)
        `).run(
          crypto.randomUUID(),
          userId,
          campaignId || null,
          url,
          targetId,
          testCid,
          testSid,
          countryName,
          countryCode,
          city,
          testIp,
          resp.status || 204,
          isSuccess ? 'dispatched' : 'error',
          details,
          nowIso
        );
      } catch {}
    }

    return {
      success: isSuccess,
      measurementId: targetId,
      httpStatus: resp.status || 204,
      statusText: resp.statusText || 'OK',
      clientId: testCid,
      sessionId: testSid,
      timestamp: nowIso,
      geoSummary: `${city}, ${countryName} (${countryCode}) - ${testIp}`,
      targetUrl: url,
      endpointUsed: 'https://www.google-analytics.com/g/collect (Measurement Protocol v2)',
      parametersSent: Object.fromEntries(urlParams.entries()),
      details,
      realtimeGuide: '1. Open Google Analytics (analytics.google.com)\n2. Navigate to Reports > Realtime\n3. Look at "Users in Last 30 Minutes" card - you will see 1 active user from ' + city + ', ' + countryName + ' within 10-30 seconds.'
    };
  }

  /**
   * Retrieves recent GA4 hit delivery logs for a user
   */
  public static getRecentDeliveryLogs(userId: string, options: { campaignId?: string; limit?: number } = {}) {
    const limit = Math.min(100, Math.max(5, options.limit || 30));
    let query = `
      SELECT * FROM ga4_delivery_logs
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (options.campaignId) {
      query += ' AND campaign_id = ?';
      params.push(options.campaignId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    try {
      const rows = db.prepare(query).all(...params);
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Dispatches an engagement heartbeat (user_engagement / scroll) during dwell time
   * so GA4 Realtime keeps the active user counter live and counts active user minutes accurately.
   */
  public static async trackEngagementPing(params: {
    targetUrl: string;
    measurementId: string;
    geoIp: string;
    countryCode: string;
    countryName: string;
    city: string;
    dwellDurationSeconds: number;
    userAgent: string;
    clientId: string;
    sessionId: string;
  }): Promise<void> {
    try {
      const {
        targetUrl,
        measurementId,
        geoIp,
        countryCode,
        countryName,
        city,
        dwellDurationSeconds,
        userAgent,
        clientId,
        sessionId
      } = params;

      const urlParams = new URLSearchParams();
      urlParams.set('v', '2');
      urlParams.set('tid', measurementId);
      urlParams.set('cid', clientId);
      urlParams.set('sid', sessionId);
      urlParams.set('sct', '1');
      urlParams.set('seg', '1');
      urlParams.set('dl', targetUrl);
      urlParams.set('en', 'user_engagement');
      urlParams.set('_et', String(Math.min(30000, dwellDurationSeconds * 1000)));
      urlParams.set('ep.engagement_time_msec', String(Math.min(30000, dwellDurationSeconds * 1000)));
      urlParams.set('uip', geoIp);
      urlParams.set('ep.country', countryName);
      urlParams.set('ep.city', city);

      fetch(`https://www.google-analytics.com/g/collect?${urlParams.toString()}`, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent,
          'X-Forwarded-For': geoIp,
          'Client-IP': geoIp,
          'X-Geo-Country': countryCode,
          'X-Geo-City': city
        },
        signal: AbortSignal.timeout(4000)
      }).catch(() => {});
    } catch {
      // Non-blocking background heartbeat
    }
  }

  /**
   * Platform internal telemetry event tracking (for system metrics)
   */
  public static async trackEvent(
    eventName: string,
    params: Record<string, any> = {},
    clientId: string = 'trafficloop-system-client'
  ): Promise<void> {
    if (!this.systemMeasurementId || !this.systemApiSecret) {
      return;
    }

    try {
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.systemMeasurementId}&api_secret=${this.systemApiSecret}`;
      const payload = {
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: {
              ...params,
              engagement_time_msec: 100,
              timestamp_micros: Date.now() * 1000
            }
          }
        ]
      };

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {
      // Silently ignore system telemetry error
    }
  }
}

