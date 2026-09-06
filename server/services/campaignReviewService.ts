import { db } from '../database/db.js';
import { CampaignReview } from '../../src/types.js';
import crypto from 'node:crypto';

export class CampaignReviewService {
  /**
   * Evaluates a campaign URL against safety heuristics and rules
   */
  static evaluateUrl(url: string, campaignTitle: string, excludeCampaignId?: string): {
    score: number;
    passed: boolean;
    checks: {
      https_valid: boolean;
      domain_valid: boolean;
      private_ip_blocked: boolean;
      malicious_pattern_free: boolean;
      framing_warning: boolean;
      duplicate_check: boolean;
      latency_ms: number;
      details: string[];
    };
    suggestedStatus: 'active' | 'pending_review' | 'rejected';
    rejectionReason?: string;
  } {
    const details: string[] = [];
    let score = 100;
    let https_valid = false;
    let domain_valid = false;
    let private_ip_blocked = true;
    let malicious_pattern_free = true;
    let framing_warning = false;
    let duplicate_check = true;

    const startPerf = Date.now();

    // 1. Structure and Protocol Validation
    try {
      const parsed = new URL(url);

      if (parsed.protocol === 'https:') {
        https_valid = true;
        details.push('HTTPS protocol verified secure');
      } else if (parsed.protocol === 'http:') {
        https_valid = false;
        score -= 25;
        details.push('Notice: Plain HTTP detected (HTTPS recommended for traffic exchange framing)');
      } else {
        https_valid = false;
        score = 0;
        return {
          score: 0,
          passed: false,
          checks: {
            https_valid: false,
            domain_valid: false,
            private_ip_blocked: false,
            malicious_pattern_free: false,
            framing_warning: false,
            duplicate_check: true,
            latency_ms: 5,
            details: [`Unsupported protocol: ${parsed.protocol}. Only HTTPS/HTTP destinations are allowed.`]
          },
          suggestedStatus: 'rejected',
          rejectionReason: `Unsupported protocol ${parsed.protocol}.`
        };
      }

      // 2. Private IP and Localhost Filtering (SSRF Prevention)
      const hostname = parsed.hostname.toLowerCase();
      const privateIpRegex = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|0\.0\.0\.0|::1|.*\.local|.*\.internal)$/i;

      if (privateIpRegex.test(hostname)) {
        private_ip_blocked = false;
        score = 0;
        return {
          score: 0,
          passed: false,
          checks: {
            https_valid,
            domain_valid: false,
            private_ip_blocked: false,
            malicious_pattern_free: false,
            framing_warning: false,
            duplicate_check: true,
            latency_ms: 10,
            details: ['Rejected: Localhost, loopback, and RFC-1918 private network addresses are prohibited.']
          },
          suggestedStatus: 'rejected',
          rejectionReason: 'Prohibited local or internal network destination.'
        };
      } else {
        private_ip_blocked = true;
      }

      // 3. Domain TLD and Structure Check
      if (hostname.includes('.') && hostname.split('.').pop()!.length >= 2) {
        domain_valid = true;
        details.push(`Valid top-level domain structure: ${hostname}`);
      } else {
        domain_valid = false;
        score -= 40;
        details.push('Malformed hostname or missing valid top-level domain');
      }

      // 4. Malicious / Phishing Keywords and Dangerous Pattern Heuristics
      const suspiciousPatterns = [
        /account.*verification/i,
        /login.*update.*secure/i,
        /bank.*confirm/i,
        /paypal.*security/i,
        /free.*crypto.*claim.*wallet/i,
        /claim.*airdrop.*connect.*seed/i,
        /\.exe$/i,
        /\.scr$/i,
        /\.bat$/i,
        /\.apk$/i,
        /data:text\/html/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url) || pattern.test(campaignTitle)) {
          malicious_pattern_free = false;
          score -= 50;
          details.push(`Suspicious keyword pattern detected matching ${pattern.toString()}`);
          break;
        }
      }

      if (malicious_pattern_free) {
        details.push('Passed heuristic safety pattern inspection');
      }

      // 5. Framing and X-Frame-Options notice check
      // Certain domains (like google.com or facebook.com) have strict framing policies; we flag for preview banner
      const strictFrameDomains = ['google.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com'];
      if (strictFrameDomains.some(d => hostname.endsWith(d))) {
        framing_warning = true;
        details.push('Note: Destination may require TrafficLoop Direct Safe Frame wrapper due to parent CSP headers');
      }

    } catch (e: any) {
      return {
        score: 0,
        passed: false,
        checks: {
          https_valid: false,
          domain_valid: false,
          private_ip_blocked: false,
          malicious_pattern_free: false,
          framing_warning: false,
          duplicate_check: false,
          latency_ms: 5,
          details: [`Invalid or malformed URL syntax: ${e.message}`]
        },
        suggestedStatus: 'rejected',
        rejectionReason: 'Malformed URL syntax.'
      };
    }

    // 6. Duplicate Active Campaign Check
    let duplicateQuery = "SELECT id FROM campaigns WHERE url = ? AND status IN ('active', 'pending_review')";
    const params: any[] = [url];
    if (excludeCampaignId) {
      duplicateQuery += ' AND id != ?';
      params.push(excludeCampaignId);
    }
    const duplicate = db.prepare(duplicateQuery).get(...params);
    if (duplicate) {
      duplicate_check = false;
      score -= 30;
      details.push('Notice: An active or pending campaign with this exact destination URL already exists in the system');
    } else {
      duplicate_check = true;
      details.push('URL uniqueness verified');
    }

    const latency_ms = Date.now() - startPerf + 15;

    // Determine platform auto-approval policy
    const settings = db.prepare('SELECT auto_approval_enabled, auto_approval_min_score FROM platform_settings WHERE id = ?').get('default') as {
      auto_approval_enabled: number;
      auto_approval_min_score: number;
    } | undefined;

    const autoApprovalEnabled = settings ? Boolean(settings.auto_approval_enabled) : true;
    const minScore = settings?.auto_approval_min_score || 85;

    let suggestedStatus: 'active' | 'pending_review' | 'rejected' = 'active';
    let rejectionReason: string | undefined = undefined;

    if (score < 20 || !domain_valid || !private_ip_blocked || !malicious_pattern_free) {
      suggestedStatus = 'rejected';
      rejectionReason = 'Campaign URL contains unsafe, malformed, or prohibited destination patterns.';
    } else {
      suggestedStatus = 'active';
      details.push(`Direct Live Activation (Verified destination: ${url})`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      passed: score >= 50,
      checks: {
        https_valid,
        domain_valid,
        private_ip_blocked,
        malicious_pattern_free,
        framing_warning,
        duplicate_check,
        latency_ms,
        details
      },
      suggestedStatus,
      rejectionReason
    };
  }

  /**
   * Creates a review record for a campaign and updates campaign status accordingly
   */
  static processCampaignReview(campaignId: string, title: string, url: string, reviewerId?: string): {
    status: 'active' | 'pending_review' | 'rejected';
    score: number;
  } {
    const evalResult = this.evaluateUrl(url, title, campaignId);
    const reviewId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertReview = db.prepare(`
      INSERT INTO campaign_reviews (
        id, campaign_id, reviewer_id, automated_score, automated_checks_json,
        status, rejection_reason, created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reviewStatus = evalResult.suggestedStatus === 'active' ? 'approved' 
      : evalResult.suggestedStatus === 'rejected' ? 'rejected' 
      : 'pending';

    // Ensure reviewerId is a valid existing user ID or null for automated system evaluations
    let validReviewerId: string | null = null;
    if (reviewerId) {
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(reviewerId);
      if (userExists) {
        validReviewerId = reviewerId;
      }
    }

    insertReview.run(
      reviewId,
      campaignId,
      validReviewerId,
      evalResult.score,
      JSON.stringify(evalResult.checks),
      reviewStatus,
      evalResult.rejectionReason || null,
      now,
      evalResult.suggestedStatus !== 'pending_review' ? now : null
    );

    // Update campaign status
    db.prepare(`
      UPDATE campaigns 
      SET status = ?, rejection_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(evalResult.suggestedStatus, evalResult.rejectionReason || null, now, campaignId);

    return {
      status: evalResult.suggestedStatus,
      score: evalResult.score
    };
  }
}
