export type UserRole = 'user' | 'admin';

export type CampaignStatus = 
  | 'pending_review' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'rejected'
  | 'test';

export type TransactionType = 
  | 'visit_reward' 
  | 'campaign_spend' 
  | 'bonus' 
  | 'streak_milestone_bonus'
  | 'adjustment' 
  | 'refund' 
  | 'transfer';

export type VisitStatus = 'started' | 'completed' | 'abandoned' | 'invalidated';

export type NotificationType = 
  | 'campaign_status' 
  | 'campaign_upgrade' 
  | 'user_inactivity' 
  | 'user_reactivated' 
  | 'system' 
  | 'credit';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location?: string;
  credits: number;
  total_earned_credits: number;
  total_spent_credits: number;
  points?: number;
  total_earned_points?: number;
  total_visits_made: number;
  total_visits_received: number;
  preferred_currency?: 'INR' | 'USD' | 'BWP' | 'EUR' | 'GBP';
  inr_equivalent_balance?: number;
  formatted_inr_balance?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_active_at?: string;
  inactivity_reason?: string;
  created_at: string;
  last_login_at?: string;
}

export interface SessionData {
  token: string;
  user: User;
}

export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  url: string;
  urls?: string[];
  urls_json?: string | null;
  url_cursor?: number;
  country_cursor?: number;
  failed_visits_count?: number;
  last_dispatched_at?: string | null;
  next_dispatch_at?: string | null;
  auto_progress?: boolean;
  duration_seconds: number;
  credit_cost_per_visit: number;
  credit_budget: number;
  spent_credits: number;
  total_visits_received: number;
  total_clicks_received?: number;
  interactive_clicks_enabled?: boolean;
  status: CampaignStatus;
  category: string;
  daily_visit_limit: number;
  today_visits_received: number;
  target_locations?: string;
  device_targeting?: string;
  tier?: string;
  ga4_measurement_id?: string | null;
  ga4_api_secret?: string | null;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
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
  url?: string;
  countryCode?: string;
  endpointUsed: string;
  parametersSent: Record<string, string>;
  details: string;
  realtimeGuide: string;
}

export interface GA4DeliveryLog {
  id: string;
  user_id: string;
  campaign_id?: string | null;
  target_url: string;
  measurement_id?: string | null;
  client_id: string;
  session_id: string;
  event_name: string;
  country_name?: string | null;
  country_code?: string | null;
  city?: string | null;
  geo_ip?: string | null;
  http_status: number;
  status: string;
  delivery_status?: string;
  details?: string | null;
  source: string;
  created_at: string;
}

export interface CampaignReview {
  id: string;
  campaign_id: string;
  reviewer_id?: string;
  reviewer_name?: string;
  automated_score: number; // 0-100 safety score
  automated_checks: {
    https_valid: boolean;
    domain_valid: boolean;
    private_ip_blocked: boolean;
    malicious_pattern_free: boolean;
    framing_warning: boolean;
    duplicate_check: boolean;
    latency_ms: number;
    details: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  campaign_title?: string;
  campaign_url?: string;
}

export interface Visit {
  id: string;
  campaign_id: string;
  visitor_user_id: string;
  owner_user_id: string;
  duration_seconds: number;
  actual_dwell_seconds: number;
  credits_earned: number;
  credits_charged: number;
  status: VisitStatus;
  target_url?: string;
  http_status?: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  visitor_country?: string;
  visitor_country_code?: string;
  visitor_device?: string;
  created_at: string;
  completed_at?: string;
  campaign_title?: string;
  campaign_url?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number; // Positive for earnings, negative for spends
  type: TransactionType;
  description: string;
  reference_id?: string; // campaign_id or visit_id
  balance_after: number;
  inr_value?: number;
  formatted_inr_value?: string;
  currency?: string;
  created_at: string;
  user_email?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id?: string;
  target_type?: string;
  details: string;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  base_credit_reward: number;
  cost_per_second: number;
  min_duration_seconds: number;
  max_duration_seconds: number;
  welcome_bonus_credits: number;
  daily_bonus_credits: number;
  cooldown_between_same_campaign_mins: number;
  auto_approval_enabled: boolean;
  auto_approval_min_score: number;
  max_visits_per_user_hourly: number;
  maintenance_mode: boolean;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch_code?: string;
  bank_swift_code?: string;
  bank_currency?: string;
  bank_payment_instructions?: string;
  credit_price_per_unit?: number;
  mobile_money_details?: string;
  crypto_wallet_address?: string;
  upi_id?: string;
  upi_name?: string;
  upi_bank_name?: string;
  upi_instructions?: string;
  upi_enabled?: boolean;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  current_user_credits?: number;
  package_name: string;
  credits_amount: number;
  fiat_amount: number;
  currency: string;
  payment_method: 'upi' | 'bank_transfer' | 'card_instant' | 'mobile_money' | 'crypto_usdt';
  payment_reference: string;
  proof_reference?: string;
  proof_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  fiatAmount: number;
  currency: string;
  fiatInr: number;
  fiatBwp: number;
  fiatUsd: number;
  bonusCredits?: number;
  popular?: boolean;
  description: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  swiftCode: string;
  currency: string;
  paymentInstructions?: string;
  mobileMoneyDetails?: string;
  cryptoWalletAddress?: string;
  creditUnitPrice?: number;
  upiId?: string;
  upiName?: string;
  upiBankName?: string;
  upiInstructions?: string;
  upiEnabled?: boolean;
}

export interface UserTrafficMetrics {
  requests_dispatched: number;
  requests_started: number;
  http_responses: number;
  verified_observations: number;
  unique_visitors: number;
  unverified_requests: number;
  failed_requests: number;
}

export interface UserStats {
  credits: number;
  total_earned_credits: number;
  total_spent_credits: number;
  total_visits_made: number;
  total_visits_received: number;
  active_campaigns_count: number;
  total_campaigns_count: number;
  today_visits_made: number;
  today_visits_received?: number;
  today_credits_earned: number;
  traffic_metrics?: UserTrafficMetrics;
  recent_transactions: CreditTransaction[];
  recent_visits: Visit[];
  recent_campaigns: Campaign[];
}

export interface PlatformStats {
  total_users: number;
  active_users_today: number;
  total_campaigns: number;
  active_campaigns: number;
  pending_reviews: number;
  rejected_campaigns: number;
  total_visits_completed: number;
  visits_today: number;
  visits_this_week: number;
  total_credits_exchanged: number;
  system_health: 'operational' | 'degraded' | 'maintenance';
}

export interface SurfSessionPayload {
  session_token: string;
  campaign: {
    id: string;
    title: string;
    url: string;
    duration_seconds: number;
    credit_reward: number;
    category: string;
    is_network_showcase?: boolean;
    preview_mode?: boolean;
    is_fallback?: boolean;
    canEmbedInIframe?: boolean;
    interactive_clicks_enabled?: boolean;
    total_clicks_received?: number;
  };
  server_timestamp: number;
  clicks_registered?: number;
  click_bonus_rate?: number;
  verification_challenge: {
    prompt: string;
    target_id: string;
    challenge_type: 'icon' | 'match_pair' | 'speed_pick';
    options: { id: string; label: string; icon: string }[];
  };
  algorithm_metadata?: {
    engine: string;
    matching_mode: 'weighted_priority_v3' | 'round_robin' | 'sandbox_preview';
    exchange_ratio: string;
    surfer_streak: number;
    multiplier: number;
    mystery_milestone_target: number;
  };
}

export interface RegisterClickResult {
  success: boolean;
  clicksCount: number;
  bonusCredits: number;
  totalCreditsEarned: number;
  message: string;
  ga4Tracked: boolean;
  details?: string;
}

export interface SurfCompleteResult {
  success: boolean;
  creditsEarned: number;
  newBalance: number;
  nextCampaignAvailable: boolean;
  message: string;
  streakCount: number;
  streakBonus: number;
  clicksCount?: number;
  clickBonusEarned?: number;
  mysteryReward?: {
    unlocked: boolean;
    amount: number;
    inrEquivalent: number;
    badgeName: string;
    message: string;
  };
  exchangeRatio: string;
  visitId?: string;
  dwellSeconds?: number;
}

export interface SurfEngineDiagnostics {
  status: 'optimal' | 'active' | 'degraded';
  algorithm: string;
  activeCampaignsInPool: number;
  exchangeRatio: string;
  averageQueueLatencyMs: number;
  adaptiveCooldownSeconds: number;
  totalNetworkCapacity: string;
  antiStarvationActive: boolean;
  activeSurfersCount: number;
}

export interface MarketRates {
  base: string;
  timestamp: string;
  rates: {
    INR: number;
    USD: number;
    BWP: number;
    EUR: number;
    GBP: number;
    [key: string]: number;
  };
  creditBenchmark: {
    baseCreditUsd: number;
    ratePerCreditInr: number;
    ratePerCreditBwp: number;
    ratePerCreditUsd: number;
    ratePerCreditEur: number;
    ratePerCreditGbp: number;
  };
}

export interface CreditValuation {
  credits: number;
  ratePerCreditInr: number;
  ratePerCreditBwp: number;
  ratePerCreditUsd: number;
  ratePerCreditEur: number;
  ratePerCreditGbp: number;
  inrValue: number;
  bwpValue: number;
  usdValue: number;
  eurValue: number;
  gbpValue: number;
  formattedInr: string;
  formattedBwp: string;
  formattedUsd: string;
  formattedEur: string;
  formattedGbp: string;
  preferredCurrency: string;
  preferredValue: number;
  formattedPreferredValue: string;
  marketRateTimestamp: string;
}

export interface CurrencyConversionResult {
  amount: number;
  from: string;
  to: string;
  result: number;
  formattedResult: string;
  rate: number;
  timestamp: string;
}

export interface DailyBreakdownItem {
  date: string;
  dayLabel: string;
  shortDay: string;
  creditsSpent: number;
  creditsEarned: number;
  visitsReceived: number;
  visitsMade: number;
  inrSpent: number;
  inrEarned: number;
}

export interface TrafficSourceItem {
  name: string;
  category: string;
  visits: number;
  creditsSpent: number;
  percentage: number;
  color: string;
}

export interface WeeklyAnalyticsData {
  dailyBreakdown: DailyBreakdownItem[];
  trafficSources: TrafficSourceItem[];
  summary: {
    totalCreditsSpent: number;
    totalCreditsEarned: number;
    totalVisitsReceived: number;
    totalVisitsMade: number;
    netCreditFlow: number;
    avgDailySpend: number;
    peakSpendDay: string;
    peakVisitsDay: string;
    topTrafficSource: string;
  };
}

export interface DailyBonusOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  creditAmount: number;
  visitsEquivalent: number;
  inrValue: number;
  badge: string;
  iconName: 'gift' | 'rocket' | 'zap' | 'target' | 'flame';
  highlight?: boolean;
}

export interface DailyBonusStatus {
  eligible: boolean;
  bonusAmount: number;
  streakDays: number;
  streakMultiplier: number;
  lastClaimAt?: string;
  nextClaimAt?: string;
  secondsRemaining: number;
  message: string;
  bonusOptions: DailyBonusOption[];
}

export interface ClaimDailyBonusResponse {
  success: boolean;
  creditsAdded: number;
  visitsGranted: number;
  optionTitle: string;
  streakDays: number;
  message: string;
  newBalance: number;
  nextClaimAt?: string;
}

export interface GeoCountryTraffic {
  country: string;
  countryCode: string;
  flag: string;
  region: string;
  visits: number;
  intendedVisits: number;
  percentage: number;
  matchRate: number; // 0-100% compliance
  isTargeted: boolean;
  heatScore: number; // 0-100 density score
  heatColor: string; // Heatmap hex color
  avgDwellSeconds: number;
  creditsSpent: number;
  lat: number;
  lon: number;
}

export interface GeoRegionTraffic {
  region: string;
  visits: number;
  percentage: number;
  intendedVisits: number;
  matchRate: number;
  color: string;
}

export interface CampaignGeoTargetStatus {
  campaignId: string;
  title: string;
  targetLocations: string;
  totalVisits: number;
  matchedVisits: number;
  matchRate: number;
  status: string;
}

export interface GeoTrafficDistributionData {
  countries: GeoCountryTraffic[];
  regions: GeoRegionTraffic[];
  campaignTargets: CampaignGeoTargetStatus[];
  summary: {
    totalDeliveredVisits: number;
    intendedTargetVisits: number;
    unintendedVisits: number;
    overallMatchRate: number; // e.g. 98.8%
    topCountry: string;
    topCountryFlag: string;
    topCountryVisits: number;
    topCountryPercentage: number;
    activeGeoCampaignsCount: number;
    heatIndex: 'Extreme' | 'High' | 'Moderate' | 'Low';
    routingIntegrity: 'Optimal' | 'Good' | 'Attention Needed';
  };
}

export interface AuthoritativeSimulationLocation {
  countryCode: string;
  countryName: string;
  flag: string;
  region: string;
  city: string;
  provider: string;
  ip: string;
  language: string;
  locale: string;
  timezone: string;
  simulationMode: 'residential_proxy_simulation' | 'strict_geo_pool';
  simulationId: string;
  sessionId: string;
}

export interface GeoAttributionBreakdown {
  originLocation: {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    source: 'raw_client_ingress';
  };
  simulatedLocation: {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    region: string;
    provider: string;
    language: string;
    locale: string;
    timezone: string;
    status: 'SIMULATED';
  };
  proxyEgressLocation: {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    isp: string;
    status: 'SIMULATED_EGRESS';
  };
  analyticsSimulatedLocation: {
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    attributionMethod: string;
    status: 'SIMULATED_GA4';
  };
  externalDetectedLocation: {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    flag: string;
    runtimeEnvironment: string;
    reasonForDifference: string;
    status: 'REAL_PHYSICAL_NETWORK';
  };
}

export interface TrafficDebuggerRequest {
  url: string;
  campaignId?: string;
  targetCountry: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  referrerType: 'direct' | 'google' | 'twitter' | 'reddit' | 'custom_utm';
  customReferrer?: string;
  followRedirects?: boolean;
  sessionId?: string;
  forceReset?: boolean;
}

export interface TrafficDebuggerHop {
  hopIndex: number;
  stage: 'ingress_origin' | 'network_gateway' | 'geo_proxy_egress' | 'destination_hop' | 'final_landing';
  stageTitle: string;
  url: string;
  httpStatus: number;
  statusText: string;
  responseTimeMs: number;
  ip: string;
  isp: string;
  geo: {
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    locale: string;
  };
  headersSent: Record<string, string>;
  headersReceived: Record<string, string>;
  protocol: string;
  notes: string[];
}

export interface TrafficDebuggerComparison {
  beforeCrossing: {
    originIp: string;
    originCountry: string;
    originCountryCode: string;
    originFlag: string;
    rawUserAgent: string;
    rawReferrer: string;
    xForwardedFor: string;
    ga4Attribution: string;
    privacyState: string;
  };
  afterCrossing: {
    proxyIp: string;
    proxyCountry: string;
    proxyCountryCode: string;
    proxyFlag: string;
    injectedUserAgent: string;
    injectedReferrer: string;
    xForwardedFor: string;
    acceptLanguage: string;
    ga4UipOverride: string;
    ga4Attribution: string;
    routingMode: string;
    privacyState: string;
  };
}

export interface TrafficDebuggerResult {
  targetUrl: string;
  finalUrl: string;
  hasRedirects: boolean;
  totalHops: number;
  totalLatencyMs: number;
  success: boolean;
  statusCode: number;
  targetMatchRate: number;
  targetGeoVerified: boolean;
  authoritativeLocation: AuthoritativeSimulationLocation;
  attributionBreakdown: GeoAttributionBreakdown;
  diagnosticLogs: string[];
  hops: TrafficDebuggerHop[];
  comparison: TrafficDebuggerComparison;
  detectedTags: {
    ga4: string | null;
    gtm: string | null;
    metaPixel: boolean;
    utmTags: Record<string, string>;
  };
  securityAndHeaders: {
    isHttps: boolean;
    sslValid: boolean;
    xFrameOptions: string | null;
    contentSecurityPolicy: string | null;
    canRenderInIframe: boolean;
    server: string | null;
    cacheControl: string | null;
  };
  executableCommands: {
    curlTest: string;
    proxyCurlTest: string;
    ga4VerificationTest: string;
  };
  recommendations: string[];
  timestamp: string;
}

export interface GlobalTrafficLogEntry {
  id: string;
  timestamp: string;
  campaignId: string;
  campaignTitle: string;
  campaignUrl: string;
  targetLocations: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  
  // Physical / Ingress Socket (Detected)
  detectedOrigin: {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    flag: string;
    isp: string;
    sourceType: 'client_socket_ingress' | 'surfer_residential' | 'direct_peer';
  };

  // Simulated / Geo-Proxy Node (Attributed to Target Destination)
  simulatedEgress: {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    region: string;
    flag: string;
    isp: string;
    language: string;
    locale: string;
    timezone: string;
    routingMode: 'residential_proxy' | 'authoritative_mesh' | 'ga4_uip_override';
  };

  // Geo Verification & Status
  locationStatus: 'MATCHED' | 'GLOBAL_MESH' | 'GEO_ROUTED' | 'UNMATCHED';
  locationStatusText: string;
  isTargetCompliant: boolean;
  
  // Session Metrics & Dwell Time
  dwellSeconds: number;
  requiredDwellSeconds: number;
  creditsCharged: number;
  status: 'completed' | 'in_progress' | 'verified';
  
  // Redirection & Request Headers
  referrer: string;
  userAgent: string;
  forwardedHeaders: {
    xForwardedFor: string;
    clientIp: string;
    acceptLanguage: string;
    cfIpCountry: string;
    ga4Uip: string;
  };
  verificationCode?: string;
  sessionToken?: string;
  httpStatus?: number;
  observationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'NOT_CONFIGURED' | 'PENDING';
}

export interface GlobalTrafficLogStats {
  totalLoggedVisits: number;
  targetedMatchRate: number;
  activeGlobalNodes: number;
  averageDwellTime: number;
  worldwidePoolDelivered: number;
  strictGeoDelivered: number;
  topEgressCountry: string;
  topEgressFlag: string;
  recentLiveCount: number;
}

export interface GlobalTrafficLogResponse {
  logs: GlobalTrafficLogEntry[];
  stats: GlobalTrafficLogStats;
  availableCampaigns: Array<{ id: string; title: string; targetLocations: string }>;
  availableCountries: Array<{ code: string; name: string; flag: string }>;
  filterSummary: {
    totalMatching: number;
    campaignFilter: string;
    countryFilter: string;
    statusFilter: string;
    searchQuery: string;
  };
}

export interface UrlBrowseRecentHit {
  id: string;
  url: string;
  campaignTitle: string;
  timestamp: string;
  visitorSubnet: string;
  originCountry: string;
  originCountryCode: string;
  originFlag: string;
  simulatedCountry: string;
  simulatedCountryCode: string;
  simulatedFlag: string;
  dwellSeconds: number;
  requiredDwellSeconds: number;
  status: 'verified' | 'completed' | 'in_progress';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ga4Reported: boolean;
  referrer: string;
}

export interface UrlBrowseItem {
  url: string;
  campaignId: string;
  campaignTitle: string;
  campaignStatus: string;
  targetLocations: string;
  totalVisits: number;
  todayVisits: number;
  avgDwellSeconds: number;
  totalCreditsSpent: number;
  lastBrowsedAt: string;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geoDistribution: Array<{
    country: string;
    code: string;
    flag: string;
    visits: number;
    percentage: number;
  }>;
  recentHits: UrlBrowseRecentHit[];
}

export interface UrlBrowseSummaryStats {
  totalUrlsCount: number;
  totalVisitsCount: number;
  todayVisitsCount: number;
  totalDwellHours: number;
  avgDwellSeconds: number;
  topBrowsedUrl: string;
  topOriginCountry: string;
  topOriginFlag: string;
  activeBrowsersCount: number;
}

export interface UrlBrowseReportResponse {
  summary: UrlBrowseSummaryStats;
  urls: UrlBrowseItem[];
  recentLiveFeed: UrlBrowseRecentHit[];
  availableCampaigns: Array<{ id: string; title: string; url: string }>;
  filterSummary: {
    timeRange: string;
    search: string;
    campaignId?: string;
    totalMatchingUrls: number;
  };
}

// ==========================================
// TIME LAP & PAGE DWELL ANALYTICS TYPES
// ==========================================

export interface TimeLapBracket {
  id: string;
  label: string;
  shortLabel: string;
  minSeconds: number;
  maxSeconds: number | null;
  count: number;
  percentage: number;
  totalSeconds: number;
  avgSeconds: number;
  badgeColor: string;
  description: string;
}

export interface PageTimeLapBucket {
  lapId: string;
  label: string;
  shortLabel: string;
  minSeconds: number;
  maxSeconds: number | null;
  count: number;
  percentage: number;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
}

export interface PageTimeLapSession {
  id: string;
  timestamp: string;
  dwellSeconds: number;
  requiredDwellSeconds: number;
  lapId: string;
  lapLabel: string;
  visitorSubnet: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  device: string;
  status: string;
  ga4Reported: boolean;
}

export interface PageTimeLapItem {
  campaignId: string;
  url: string;
  campaignTitle: string;
  campaignStatus: string;
  targetLocations: string;
  totalVisits: number;
  todayVisits: number;
  totalTimeSpentSeconds: number;
  totalTimeSpentFormatted: string;
  avgDwellSeconds: number;
  minDwellSeconds: number;
  maxDwellSeconds: number;
  bounceCount: number;
  bounceRate: number; // % below 15 seconds
  highEngagementCount: number;
  highEngagementRate: number; // % >= 30 seconds
  laps: PageTimeLapBucket[];
  recentSessions: PageTimeLapSession[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geoDistribution: Array<{
    country: string;
    code: string;
    flag: string;
    visits: number;
    percentage: number;
    avgDwell: number;
  }>;
}

export interface TimeLapAnalyticsSummary {
  totalUrlsCount: number;
  totalVisitsCount: number;
  todayVisitsCount: number;
  totalTimeSpentSeconds: number;
  totalTimeSpentHours: number;
  totalTimeSpentFormatted: string;
  overallAvgDwellSeconds: number;
  topDwellPage: string;
  topDwellPageTime: string;
  mostPopularLapId: string;
  mostPopularLapLabel: string;
  deepEngagementRate: number; // % >= 30s
}

export interface TimeLapAnalyticsResponse {
  summary: TimeLapAnalyticsSummary;
  overallLaps: TimeLapBracket[];
  pages: PageTimeLapItem[];
  availableCampaigns: Array<{ id: string; title: string; url: string }>;
  presetInterval: 'standard' | 'fine' | 'extended';
  filterSummary: {
    timeRange: string;
    search: string;
    campaignId?: string;
    lapFilter?: string;
    totalMatchingPages: number;
  };
}

// ==========================================
// TRI-STATION MULTI-BROWSER ENGINE TYPES
// ==========================================

export type StationId = 'station-1' | 'station-2' | 'station-3';

export type StationStatus = 
  | 'idle' 
  | 'connecting' 
  | 'verifying_geo' 
  | 'navigating' 
  | 'active' 
  | 'completed' 
  | 'error' 
  | 'paused';

export type GeoVerificationStatus = 
  | 'match_verified' 
  | 'mismatch_flagged' 
  | 'pending_verification' 
  | 'unreachable';

export type DeviceTypeProfile = 'desktop' | 'mobile' | 'tablet';

export interface StationGeoEndpointInfo {
  targetCountryCode: string;
  targetCountryName: string;
  targetFlag: string;
  targetCity?: string;
  publicIp: string;
  detectedCountryCode: string;
  detectedCountryName: string;
  detectedFlag: string;
  detectedCity: string;
  detectedRegion: string;
  isp: string;
  asn: string;
  verificationStatus: GeoVerificationStatus;
  verificationMessage: string;
  dnsLatencyMs: number;
  sslValid: boolean;
  ga4MeasurementId?: string | null;
  ga4HitStatus?: 'dispatched' | 'pending' | 'not_detected' | 'error';
  ga4HitDetails?: string;
  gaClientId?: string;
  searchKeyword?: string;
  searchTheme?: string;
  trafficMedium?: 'organic' | 'referral' | 'direct' | 'cpc';
}

export interface StationPerformanceMetrics {
  ttfbMs: number;
  domInteractiveMs: number;
  firstPaintMs: number;
  pageLoadMs: number;
  pageSizeKb: number;
  httpStatusCode: number;
  httpStatusText: string;
  contentType: string;
  protocol: string;
}

export interface StationActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  metric?: string;
}

export interface StationCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  category: 'analytics' | 'advertising' | 'functional' | 'essential';
}

export interface StationAdDisplayData {
  headline: string;
  displayUrl: string;
  destinationUrl: string;
  description: string;
  searchKeyword: string;
  searchTheme: string;
  callToAction: string;
  snippetBadges: string[];
  rating?: number;
  reviewCount?: number;
  sitelinks?: Array<{ title: string; snippet: string }>;
}

export interface StationState {
  stationId: StationId;
  stationName: string;
  stationTag: 'ALPHA-01' | 'BETA-02' | 'GAMMA-03';
  sessionId: string | null;
  status: StationStatus;
  targetUrl: string;
  campaignId?: string;
  campaignTitle?: string;
  selectedTargetCountry: string;
  selectedTargetCity?: string;
  dwellDurationSeconds: number;
  elapsedSeconds: number;
  deviceProfile: DeviceTypeProfile;
  userAgent: string;
  referrer: string;
  gaMeasurementId?: string;
  gaClientId?: string;
  searchKeyword?: string;
  searchTheme?: string;
  trafficMedium?: 'organic' | 'referral' | 'direct' | 'cpc';
  ga4HitStatus?: 'dispatched' | 'pending' | 'not_detected' | 'error';
  ga4HitDetails?: string;
  geoEndpoint: StationGeoEndpointInfo | null;
  performance: StationPerformanceMetrics | null;
  logs: StationActivityLog[];
  completedRuns: number;
  errorCount: number;
  lastErrorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cookies?: StationCookie[];
  adDisplay?: StationAdDisplayData;
  rotationalClass?: '24h_rotational' | 'hourly_5k_burst' | 'standard';
  dailyLimitBypass?: boolean;
}

export interface TriStationOverallMetrics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalPageViews: number;
  totalDwellSeconds: number;
  avgSessionDuration: number;
  avgTtfbMs: number;
  avgPageLoadMs: number;
  successRatePercent: number;
  totalErrors: number;
  geoDistribution: Array<{
    country: string;
    code: string;
    flag: string;
    sessionsCount: number;
    percentage: number;
  }>;
  httpStatusDistribution: Array<{
    code: number;
    label: string;
    count: number;
    percentage: number;
  }>;
  trafficTimeline: Array<{
    time: string;
    station1: number;
    station2: number;
    station3: number;
    total: number;
  }>;
}

export interface TriStationRotationalSchedule {
  activeClass: '24h_rotational' | 'hourly_5k_burst' | 'standard';
  dailyCapacity: number;
  hourlyThroughput: number;
  activeSlots: number;
  unrestrictedExploreMode: boolean;
  last24hRotationalReset: string;
  projected24hDelivery: number;
}

export interface TriStationEngineResponse {
  stations: Record<StationId, StationState>;
  metrics: TriStationOverallMetrics;
  availableCampaigns: Array<{ id: string; title: string; url: string; target_locations: string; duration_seconds: number }>;
  supportedCountries: Array<{ code: string; name: string; flag: string; region: string; cities?: string[] }>;
  isGlobalMasterRunning: boolean;
  complianceNotice: string;
  rotationalSchedule?: TriStationRotationalSchedule;
}

export interface StationControlPayload {
  action: 'start' | 'pause' | 'resume' | 'stop' | 'reset' | 'step' | 'push_url' | 'set_rotational_class' | 'clear_cookies';
  stationId?: StationId; // If omitted, action applies to all 3 stations
  config?: {
    targetUrl?: string;
    campaignId?: string;
    targetCountry?: string;
    targetCity?: string;
    dwellDurationSeconds?: number;
    deviceProfile?: DeviceTypeProfile;
    userAgent?: string;
    referrer?: string;
    gaMeasurementId?: string;
    gaClientId?: string;
    searchKeyword?: string;
    searchTheme?: string;
    trafficMedium?: 'organic' | 'referral' | 'direct' | 'cpc';
    rotationalClass?: '24h_rotational' | 'hourly_5k_burst' | 'standard';
    adDisplayCustom?: Partial<StationAdDisplayData>;
  };
}

// ----------------------------------------------------
// Sign In & Rewards Ledger Types
// ----------------------------------------------------

export type RewardStatus = 'PENDING' | 'ELIGIBLE' | 'CLAIMED' | 'REJECTED' | 'EXPIRED';

export interface RewardLedgerEntry {
  id: string;
  user_id: string;
  eligibility_source: string;
  qualifying_event_id: string;
  amount_inr: number;
  amount_credits: number;
  points?: number;
  status: RewardStatus;
  transaction_id?: string | null;
  notes?: string | null;
  created_at: string;
  claimed_at?: string | null;
}

export interface MonthlyPointsMetrics {
  monthlyTarget: number; // 450,000 monthly points target
  dailyTarget: number; // monthlyTarget / daysInCurrentMonth
  daysInCurrentMonth: number; // dynamic count (e.g. 28, 29, 30, 31)
  elapsedDays: number; // elapsed days in current month (min 1)
  remainingDays: number; // remaining calendar days in month
  currentPoints: number; // user total persisted points
  todayPoints: number; // points earned today
  thisWeekPoints: number; // points earned this week
  weekPoints?: number; // alias for week points
  currentMonthPoints: number; // points earned in the current calendar month
  dailyAverage: number; // currentMonthPoints / elapsedDays
  projectedMonthlyPoints: number; // (currentMonthPoints / elapsedDays) * daysInCurrentMonth
  remainingPoints: number; // Math.max(0, monthlyTarget - currentMonthPoints)
  targetProgress?: number; // alias for targetProgressPercentage
  targetProgressPercentage: number; // (currentMonthPoints / monthlyTarget) * 100
  monthLabel: string; // e.g. 'September 2026'
  qualifyingEventsCount: number;
}

export interface ActivityEventPayload {
  eventType: string; // 'feature_exploration' | 'surf_dwell_verified' | 'tri_station_rotation' | 'campaign_management' | string
  feature: string; // 'dashboard' | 'surf_arena' | 'tri_station' | 'campaigns' | 'analytics' | 'seo_directory' | 'rewards_hub' | 'profile' | string
  path?: string;
  metadata?: Record<string, any>;
  eventId?: string;
}

export interface ActivityEventResult {
  success: boolean;
  eventId: string;
  qualified: boolean;
  qualificationStatus?: 'PENDING' | 'QUALIFIED' | 'REJECTED' | 'EXPIRED';
  qualificationReason?: string;
  pointsAwarded: number;
  pointsTotal: number;
  monthlyPoints: MonthlyPointsMetrics;
}

export interface IndiaCampaignStats {
  target: number; // 450,000 verified monthly visitors target
  verifiedMonthlyVisitors: number;
  currentMonthLabel: string;
  progressPercentage: number;
  ga4Status: 'CONNECTED' | 'VERIFIED' | 'PENDING' | 'UNAVAILABLE';
  activeCampaignsTargetingIndia: number;
  avgDwellSeconds: number;
  observationMethod: string;
  monthlyWindowStart: string;
  monthlyWindowEnd: string;
}

export interface UserRewardSummary {
  verifiedActivityCount: number;
  eligibleRewardsCount: number;
  claimedRewardsCount: number;
  pendingRewardsCount: number;
  availableToCollectInr: number;
  availableToCollectCredits: number;
  totalCollectedInr: number;
  totalCollectedCredits: number;
}

export interface SeparatedAnalyticsMetrics {
  realVerifiedVisitors: number;
  authenticatedUsers: number;
  eligibleUsers: number;
  rewardClaims: number;
}

export interface RewardsSummaryResponse {
  indiaCampaign: IndiaCampaignStats;
  monthlyPoints: MonthlyPointsMetrics;
  userRewards: UserRewardSummary | null;
  analytics: SeparatedAnalyticsMetrics;
  isAuthenticated: boolean;
  user?: User;
}

export interface VerifiedActivityItem {
  id: string;
  campaignTitle: string;
  targetUrl: string;
  dwellSeconds: number;
  country: string;
  countryCode: string;
  device: string;
  completedAt: string;
  rewardStatus: 'ELIGIBLE' | 'CLAIMED' | 'PENDING';
  earnedInr: number;
  earnedCredits: number;
  qualifyingEventId: string;
}

export interface RewardsActivityResponse {
  todayCount: number;
  monthCount: number;
  totalVerifiedVisits: number;
  recentActivity: VerifiedActivityItem[];
}

export interface RewardsEligibilityResponse {
  items: RewardLedgerEntry[];
  total: number;
  eligibleTotalInr: number;
  eligibleTotalCredits: number;
  claimedTotalInr: number;
}

export interface ClaimRewardPayload {
  rewardId?: string;
  claimAll?: boolean;
}

export interface ClaimRewardResult {
  success: boolean;
  claimedCount: number;
  claimedInr: number;
  claimedCredits: number;
  transactionId: string;
  message: string;
  updatedUserCredits: number;
  updatedUserInr: number;
}

export interface CycleSite {
  id: string;
  campaignId: string;
  url: string;
  title: string;
  status: string;
  category: string;
  duration: number;
  creditReward: number;
  weight: number;
  available: boolean;
  canEmbedInIframe: boolean;
  isFallback?: boolean;
}

export interface TrafficStrengthTelemetry {
  score: number;
  activeSites: number;
  eligibleSites: number;
  qualifiedVisits: number;
  verifiedVisits: number;
  failedVisits: number;
  totalExchanges: number;
  poolVersion: number;
  lastSync: string;
}

export interface CyclePoolResponse {
  sites: CycleSite[];
  total: number;
  eligibleTotal: number;
  poolVersion: number;
  updatedAt: string;
  trafficStrength: TrafficStrengthTelemetry;
}







