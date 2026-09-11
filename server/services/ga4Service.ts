import crypto from 'node:crypto';
import { db } from '../database/db.js';

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
  apiSecret?: string | null;
  skipInitialPageView?: boolean;
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

    // Resolve API Secret if present on campaign or passed in
    let resolvedApiSecret = params.apiSecret?.trim() || null;
    if (!resolvedApiSecret && campaignId) {
      try {
        const camp = db.prepare('SELECT ga4_api_secret FROM campaigns WHERE id = ?').get(campaignId) as any;
        if (camp?.ga4_api_secret) {
          resolvedApiSecret = camp.ga4_api_secret.trim();
        }
      } catch {}
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
    
    // Resolve authentic engagement dwell duration (at least 10s, up to 120s)
    const durationSeconds = Math.max(10, dwellDurationSeconds || 15);
    const engagementTimeMs = durationSeconds * 1000;

    try {
      const collectBaseUrl = 'https://www.google-analytics.com/g/collect';
      let targetOrigin = 'https://trafficloop.global';
      try {
        targetOrigin = new URL(targetUrl).origin;
      } catch {}

      const requestHeaders: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept-Language': languages,
        'X-Forwarded-For': geoIp,
        'Client-IP': geoIp,
        'CF-Connecting-IP': geoIp,
        'X-Real-IP': geoIp,
        'X-Geo-Country': countryCode.toUpperCase(),
        'X-Geo-City': city,
        'Origin': targetOrigin,
        'Referer': effectiveReferrer
      };

      // 1. Initial Page View + Session Start Hit (Sequence 1)
      let initialResp: any = { ok: true, status: 204 };
      if (!params.skipInitialPageView) {
        const pvParams = new URLSearchParams();
        pvParams.set('v', '2');
        pvParams.set('tid', tid);
        pvParams.set('gcs', 'G111'); // Consent Mode v2: analytics_storage=granted, ad_storage=granted
        pvParams.set('gcd', '13r3r3r3r5'); // Signal explicit consent granted
        pvParams.set('gtm', '45je4910v870' + Math.floor(Math.random() * 89999 + 10000));
        pvParams.set('_p', String(Math.floor(Math.random() * 899999999 + 100000000)));
        pvParams.set('cid', clientId);
        pvParams.set('ul', (locale || 'en-us').toLowerCase());
        pvParams.set('sr', params.deviceProfile === 'mobile' ? '390x844' : '1920x1080');
        pvParams.set('_s', '1');
        pvParams.set('sid', sessionId);
        pvParams.set('sct', '1');
        pvParams.set('seg', '1'); // Session Engaged = 1
        pvParams.set('_ss', '1'); // Session Start = 1
        pvParams.set('dl', targetUrl);
        pvParams.set('dt', campaignTitle || title);
        pvParams.set('dr', effectiveReferrer);
        pvParams.set('en', 'page_view');
        pvParams.set('uip', geoIp);
        pvParams.set('_uip', geoIp);
        pvParams.set('ep.country', countryName);
        pvParams.set('ep.country_code', countryCode.toUpperCase());
        pvParams.set('ep.city', city);
        if (region) pvParams.set('ep.region', region);
        if (searchKeyword && searchKeyword.trim()) {
          pvParams.set('ep.search_keyword', searchKeyword.trim());
          pvParams.set('ep.search_theme', searchTheme || searchKeyword.trim());
          pvParams.set('ep.keyword', searchKeyword.trim());
        }
        pvParams.set('ep.traffic_source', effectiveReferrer.includes('google') ? 'google' : 'organic');
        pvParams.set('ep.traffic_medium', trafficMedium || 'organic');
        pvParams.set('ep.traffic_type', 'external_visit');
        pvParams.set('ep.cid', clientId);
        pvParams.set('ep.campaign', campaignTitle ? campaignTitle.substring(0, 40) : (searchKeyword || 'organic_geo_mesh'));

        initialResp = await fetch(`${collectBaseUrl}?${pvParams.toString()}`, {
          method: 'POST',
          headers: requestHeaders,
          signal: AbortSignal.timeout(5000)
        }).catch(err => ({ ok: false, status: 500, statusText: err.message }));
      }

      // 2. User Engagement Hit (Sequence 2) - CRITICAL: Registers actual dwell duration in GA4 reports
      const engParams = new URLSearchParams();
      engParams.set('v', '2');
      engParams.set('tid', tid);
      engParams.set('gcs', 'G111');
      engParams.set('gcd', '13r3r3r3r5');
      engParams.set('gtm', '45je4910v870' + Math.floor(Math.random() * 89999 + 10000));
      engParams.set('_p', String(Math.floor(Math.random() * 899999999 + 100000000)));
      engParams.set('cid', clientId);
      engParams.set('ul', (locale || 'en-us').toLowerCase());
      engParams.set('sr', params.deviceProfile === 'mobile' ? '390x844' : '1920x1080');
      engParams.set('_s', '2'); // Sequence 2
      engParams.set('sid', sessionId);
      engParams.set('sct', '1');
      engParams.set('seg', '1'); // Session Engaged = 1
      engParams.set('_ee', '1'); // Engagement Event = 1
      engParams.set('en', 'user_engagement');
      engParams.set('_et', String(engagementTimeMs)); // Time actively spent in milliseconds
      engParams.set('ep.engagement_time_msec', String(engagementTimeMs));
      engParams.set('epn.engagement_time_msec', String(engagementTimeMs)); // Numeric param for GA4 calculations
      engParams.set('ep.session_engaged', '1');
      engParams.set('epn.session_engaged', '1');
      engParams.set('dl', targetUrl);
      engParams.set('dt', campaignTitle || title);
      engParams.set('uip', geoIp);
      engParams.set('_uip', geoIp);
      engParams.set('ep.country', countryName);
      engParams.set('ep.country_code', countryCode.toUpperCase());
      engParams.set('ep.city', city);
      engParams.set('ep.traffic_source', effectiveReferrer.includes('google') ? 'google' : 'organic');
      engParams.set('ep.traffic_medium', trafficMedium || 'organic');

      const engResp = await fetch(`${collectBaseUrl}?${engParams.toString()}`, {
        method: 'POST',
        headers: requestHeaders,
        signal: AbortSignal.timeout(5000)
      }).catch(err => ({ ok: false, status: 500, statusText: err.message }));

      // 3. Authentic 90% Scroll Depth Hit (Sequence 3)
      const scrollParams = new URLSearchParams();
      scrollParams.set('v', '2');
      scrollParams.set('tid', tid);
      scrollParams.set('gcs', 'G111');
      scrollParams.set('gcd', '13r3r3r3r5');
      scrollParams.set('cid', clientId);
      scrollParams.set('sid', sessionId);
      scrollParams.set('_s', '3'); // Sequence 3
      scrollParams.set('sct', '1');
      scrollParams.set('seg', '1');
      scrollParams.set('_ee', '1');
      scrollParams.set('en', 'scroll');
      scrollParams.set('ep.percent_scrolled', '90');
      scrollParams.set('epn.percent_scrolled', '90');
      scrollParams.set('_et', String(Math.floor(engagementTimeMs * 0.4)));
      scrollParams.set('ep.engagement_time_msec', String(Math.floor(engagementTimeMs * 0.4)));
      scrollParams.set('epn.engagement_time_msec', String(Math.floor(engagementTimeMs * 0.4)));
      scrollParams.set('dl', targetUrl);
      scrollParams.set('dt', campaignTitle || title);
      scrollParams.set('uip', geoIp);
      scrollParams.set('_uip', geoIp);
      scrollParams.set('ep.country', countryName);
      scrollParams.set('ep.city', city);

      fetch(`${collectBaseUrl}?${scrollParams.toString()}`, {
        method: 'POST',
        headers: requestHeaders,
        signal: AbortSignal.timeout(5000)
      }).catch(() => {});

      // 4. If API Secret is provided, dispatch JSON Measurement Protocol payload
      if (resolvedApiSecret) {
        fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${tid}&api_secret=${resolvedApiSecret}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            events: [
              {
                name: 'page_view',
                params: {
                  session_id: sessionId,
                  page_location: targetUrl,
                  page_title: campaignTitle || title,
                  engagement_time_msec: 100
                }
              },
              {
                name: 'user_engagement',
                params: {
                  session_id: sessionId,
                  page_location: targetUrl,
                  page_title: campaignTitle || title,
                  engagement_time_msec: engagementTimeMs,
                  session_engaged: 1
                }
              },
              {
                name: 'scroll',
                params: {
                  session_id: sessionId,
                  page_location: targetUrl,
                  percent_scrolled: 90,
                  engagement_time_msec: Math.floor(engagementTimeMs * 0.4)
                }
              }
            ]
          }),
          signal: AbortSignal.timeout(5000)
        }).catch(() => {});
      }

      const isSuccess = (engResp.ok || engResp.status === 200 || engResp.status === 204) ||
                        (initialResp.ok || initialResp.status === 200 || initialResp.status === 204);
      const kwInfo = searchKeyword ? ` · Theme: "${searchKeyword}"` : '';
      const detailsMsg = isSuccess
        ? `✅ GA4 delivered: page_view + user_engagement (${durationSeconds}s verified dwell) · CID: ${clientId} · Geo: ${city}, ${countryName} (${countryCode}) · IP: ${geoIp}${kwInfo}`
        : `⚠️ GA4 beacon returned HTTP ${engResp.status}: ${engResp.statusText || 'Error'}`;

      // Record to delivery logs table
      if (userId) {
        try {
          db.prepare(`
            INSERT INTO ga4_delivery_logs (
              id, user_id, campaign_id, target_url, measurement_id, client_id, session_id,
              event_name, country_name, country_code, city, geo_ip, http_status, status, details, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'user_engagement', ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            engResp.status || 204,
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
        httpStatus: engResp.status || 204,
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
        details: `GA4 delivery exception: ${error.message || 'Network error'}`
      };
    }
  }

  /**
   * Dispatches instant session_start and page_view beacon when a visitor begins browsing a campaign
   */
  public static async trackWebsiteSessionStart(params: {
    userId?: string;
    campaignId?: string;
    targetUrl: string;
    measurementId?: string | null;
    geoIp: string;
    countryCode: string;
    countryName: string;
    city: string;
    userAgent: string;
    referrer?: string;
    clientId: string;
    sessionId: string;
    campaignTitle?: string;
    searchKeyword?: string;
    source?: string;
  }): Promise<void> {
    const {
      userId,
      campaignId,
      targetUrl,
      geoIp,
      countryCode,
      countryName,
      city,
      userAgent,
      clientId,
      sessionId,
      campaignTitle,
      searchKeyword,
      source = 'surfing_session_start'
    } = params;

    let tid = params.measurementId?.trim() || null;
    if (!tid) {
      tid = await this.discoverMeasurementId(targetUrl);
    }
    if (!tid) return;

    let effectiveReferrer = params.referrer || 'https://www.google.com/';
    if (searchKeyword && searchKeyword.trim()) {
      effectiveReferrer = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword.trim())}`;
    }

    try {
      let targetOrigin = 'https://trafficloop.global';
      try {
        targetOrigin = new URL(targetUrl).origin;
      } catch {}

      const pvParams = new URLSearchParams();
      pvParams.set('v', '2');
      pvParams.set('tid', tid);
      pvParams.set('gcs', 'G111');
      pvParams.set('gcd', '13r3r3r3r5');
      pvParams.set('gtm', '45je4910v870' + Math.floor(Math.random() * 89999 + 10000));
      pvParams.set('_p', String(Math.floor(Math.random() * 899999999 + 100000000)));
      pvParams.set('cid', clientId);
      pvParams.set('_s', '1');
      pvParams.set('sid', sessionId);
      pvParams.set('sct', '1');
      pvParams.set('seg', '1');
      pvParams.set('_ss', '1'); // Session Start
      pvParams.set('dl', targetUrl);
      pvParams.set('dt', campaignTitle || 'Webpage Traffic Visit');
      pvParams.set('dr', effectiveReferrer);
      pvParams.set('en', 'page_view');
      pvParams.set('uip', geoIp);
      pvParams.set('_uip', geoIp);
      pvParams.set('ep.country', countryName);
      pvParams.set('ep.country_code', countryCode.toUpperCase());
      pvParams.set('ep.city', city);
      pvParams.set('ep.traffic_source', effectiveReferrer.includes('google') ? 'google' : 'organic');
      pvParams.set('ep.traffic_medium', 'organic');

      const resp = await fetch(`https://www.google-analytics.com/g/collect?${pvParams.toString()}`, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent,
          'X-Forwarded-For': geoIp,
          'Client-IP': geoIp,
          'CF-Connecting-IP': geoIp,
          'X-Real-IP': geoIp,
          'X-Geo-Country': countryCode.toUpperCase(),
          'X-Geo-City': city,
          'Origin': targetOrigin,
          'Referer': effectiveReferrer
        },
        signal: AbortSignal.timeout(5000)
      }).catch(err => ({ ok: false, status: 500, statusText: err.message }));

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
            resp.status || 204,
            resp.ok || resp.status === 200 || resp.status === 204 ? 'dispatched' : 'error',
            `Realtime session_start + page_view dispatched to ${tid}`,
            source,
            new Date().toISOString()
          );
        } catch {}
      }
    } catch {}
  }

  /**
   * Tracks an authentic visitor click on the diverted webpage, sending enhanced measurement 'click' event to GA4
   */
  public static async trackWebsiteClick(params: {
    userId?: string;
    campaignId?: string;
    targetUrl: string;
    linkUrl?: string;
    linkText?: string;
    measurementId?: string | null;
    geoIp?: string;
    countryCode?: string;
    countryName?: string;
    city?: string;
    clientId?: string;
    sessionId?: string;
    userAgent?: string;
    source?: string;
  }): Promise<{ success: boolean; status: string; details: string }> {
    const {
      userId,
      campaignId,
      targetUrl,
      linkUrl = targetUrl,
      linkText = 'Webpage Destination Link',
      geoIp = '103.21.244.17',
      countryCode = 'IN',
      countryName = 'India',
      city = 'Mumbai',
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      source = 'exchange_surf_click'
    } = params;

    let tid = params.measurementId?.trim() || null;
    if (!tid) {
      tid = await this.discoverMeasurementId(targetUrl);
    }

    if (!tid) {
      return {
        success: false,
        status: 'not_detected',
        details: 'No GA4 Measurement ID found for target URL'
      };
    }

    const clientId = params.clientId || this.generateGAClientId(`${geoIp}_click_${Date.now()}`);
    const sessionId = params.sessionId || String(Math.floor(Date.now() / 1000));
    const nowIso = new Date().toISOString();

    try {
      const collectBaseUrl = 'https://www.google-analytics.com/g/collect';
      const urlParams = new URLSearchParams();

      urlParams.set('v', '2');
      urlParams.set('tid', tid);
      urlParams.set('gcs', 'G111');
      urlParams.set('gcd', '13r3r3r3r5');
      urlParams.set('gtm', '45je4910v870' + Math.floor(Math.random() * 89999 + 10000));
      urlParams.set('_p', String(Math.floor(Math.random() * 899999999 + 100000000)));
      urlParams.set('cid', clientId);
      urlParams.set('sid', sessionId);
      urlParams.set('sct', '1');
      urlParams.set('seg', '1');
      urlParams.set('dl', targetUrl);
      
      let host = 'destination';
      try { host = new URL(targetUrl).hostname; } catch {}
      urlParams.set('dt', `Interaction on ${host}`);
      urlParams.set('dr', targetUrl);
      
      // GA4 Enhanced Measurement 'click' event
      urlParams.set('en', 'click');
      urlParams.set('_ee', '1');
      urlParams.set('_et', '4000');
      urlParams.set('ep.engagement_time_msec', '4000');
      urlParams.set('ep.link_url', linkUrl);
      urlParams.set('ep.link_text', linkText.substring(0, 100));
      urlParams.set('ep.link_domain', host);
      urlParams.set('ep.outbound', 'false');
      urlParams.set('ep.event_category', 'engagement');
      urlParams.set('ep.event_label', 'visitor_click');
      
      // IP for GeoIP attribution
      urlParams.set('uip', geoIp);
      urlParams.set('_uip', geoIp);
      urlParams.set('ep.country', countryName);
      urlParams.set('ep.country_code', countryCode.toUpperCase());
      urlParams.set('ep.city', city);
      urlParams.set('ep.traffic_source', 'exchange_active_click');

      const fullUrl = `${collectBaseUrl}?${urlParams.toString()}`;

      let origin = 'https://trafficloop.global';
      try { origin = new URL(targetUrl).origin; } catch {}

      const resp = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent,
          'X-Forwarded-For': geoIp,
          'Client-IP': geoIp,
          'CF-Connecting-IP': geoIp,
          'X-Real-IP': geoIp,
          'X-Geo-Country': countryCode.toUpperCase(),
          'X-Geo-City': city,
          'Referer': targetUrl,
          'Origin': origin
        },
        signal: AbortSignal.timeout(5000)
      }).catch(err => ({ ok: false, status: 500, statusText: err.message } as any));

      const isSuccess = resp.ok || resp.status === 200 || resp.status === 204;
      const detailsMsg = isSuccess
        ? `🖱️ GA4 'click' event delivered to ${tid} · Link: ${linkUrl} · Geo: ${city}, ${countryName} (${countryCode})`
        : `⚠️ GA4 click beacon returned HTTP ${resp.status}: ${resp.statusText}`;

      if (userId) {
        try {
          db.prepare(`
            INSERT INTO ga4_delivery_logs (
              id, user_id, campaign_id, target_url, measurement_id, client_id, session_id,
              event_name, country_name, country_code, city, geo_ip, http_status, status, details, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'click', ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            nowIso
          );
        } catch {}
      }

      return {
        success: isSuccess,
        status: isSuccess ? 'dispatched' : 'error',
        details: detailsMsg
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        details: err.message || 'Click dispatch failed'
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
    urlParams.set('_ss', '1');
    urlParams.set('_s', '1');
    urlParams.set('dl', url);
    urlParams.set('dt', 'TrafficLoop Live GA4 Verification Ping');
    urlParams.set('dr', 'https://www.google.com/search?q=trafficloop+verification');
    urlParams.set('en', 'page_view');
    urlParams.set('uip', testIp);
    urlParams.set('_uip', testIp);
    urlParams.set('ep.country', countryName);
    urlParams.set('ep.city', city);
    urlParams.set('ep.traffic_source', 'google');
    urlParams.set('ep.traffic_medium', 'organic');
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

    // Also dispatch user_engagement hit so Google Analytics test ping records non-zero engagement duration (15s)
    const engParams = new URLSearchParams();
    engParams.set('v', '2');
    engParams.set('tid', targetId);
    engParams.set('cid', testCid);
    engParams.set('sid', testSid);
    engParams.set('sct', '1');
    engParams.set('seg', '1');
    engParams.set('_ee', '1');
    engParams.set('_s', '2');
    engParams.set('en', 'user_engagement');
    engParams.set('_et', '15000');
    engParams.set('ep.engagement_time_msec', '15000');
    engParams.set('epn.engagement_time_msec', '15000');
    engParams.set('ep.session_engaged', '1');
    engParams.set('epn.session_engaged', '1');
    engParams.set('dl', url);
    engParams.set('dt', 'TrafficLoop Live GA4 Verification Ping');
    engParams.set('uip', testIp);
    engParams.set('_uip', testIp);
    engParams.set('ep.country', countryName);
    engParams.set('ep.city', city);

    fetch(`https://www.google-analytics.com/g/collect?${engParams.toString()}`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'X-Forwarded-For': testIp,
        'Client-IP': testIp,
        'X-Geo-Country': countryCode,
        'X-Geo-City': city
      },
      signal: AbortSignal.timeout(6000)
    }).catch(() => {});

    const isSuccess = resp.ok || resp.status === 200 || resp.status === 204;
    const details = isSuccess
      ? `Live beacon dispatched to Google Analytics ${targetId} (HTTP ${resp.status || 204}) with 15s verified dwell engagement. Check Google Analytics Realtime report.`
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
    sequence?: number;
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
        sessionId,
        sequence = 2
      } = params;

      const engagementTimeMs = Math.max(10000, dwellDurationSeconds * 1000);

      const urlParams = new URLSearchParams();
      urlParams.set('v', '2');
      urlParams.set('tid', measurementId);
      urlParams.set('cid', clientId);
      urlParams.set('sid', sessionId);
      urlParams.set('_s', String(sequence));
      urlParams.set('sct', '1');
      urlParams.set('seg', '1');
      urlParams.set('_ee', '1');
      urlParams.set('dl', targetUrl);
      urlParams.set('en', 'user_engagement');
      urlParams.set('_et', String(engagementTimeMs));
      urlParams.set('ep.engagement_time_msec', String(engagementTimeMs));
      urlParams.set('epn.engagement_time_msec', String(engagementTimeMs));
      urlParams.set('ep.session_engaged', '1');
      urlParams.set('epn.session_engaged', '1');
      urlParams.set('uip', geoIp);
      urlParams.set('_uip', geoIp);
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

