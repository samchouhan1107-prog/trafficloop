import { User, Campaign, Visit, CreditTransaction, UserStats, PlatformStats, SurfSessionPayload, SurfCompleteResult, SurfEngineDiagnostics, RegisterClickResult, PaymentOrder, CreditPackage, BankDetails, MarketRates, CreditValuation, CurrencyConversionResult, WeeklyAnalyticsData, DailyBonusStatus, ClaimDailyBonusResponse, GeoTrafficDistributionData, TrafficDebuggerRequest, TrafficDebuggerResult, GlobalTrafficLogResponse, UrlBrowseReportResponse, TimeLapAnalyticsResponse, CyclePoolResponse, TrafficStrengthTelemetry, CycleSite } from '../types.js';

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('trafficloop_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('trafficloop_token', token);
      } else {
        localStorage.removeItem('trafficloop_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // 15-second request timeout to prevent hanging connections or infinite spinners
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
        signal: options.signal || controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || `Request failed with status ${response.status}`,
          response.status,
          data.code
        );
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your network connection.', 408, 'TIMEOUT');
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network request failed', 0, 'NETWORK_ERROR');
    }
  }

  // System
  async getPublicStats() {
    return this.request<{
      totalUsers: number;
      activeCampaigns: number;
      totalVisitsCompleted: number;
      visitsToday: number;
      totalCreditsExchanged: number;
      ecosystem: string;
    }>('/api/system/public-stats');
  }

  // Auth
  async getSignupPin() {
    return this.request<{ pin: string; pinToken: string; expiresAt: number }>('/api/auth/signup-pin');
  }

  async register(data: { email: string; password: string; name: string; location?: string; pin?: string; pinToken?: string }) {
    const res = await this.request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(res.token);
    return res;
  }

  async login(data: { email: string; password: string }) {
    const res = await this.request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(res.token);
    return res;
  }

  async getMe() {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async refreshToken() {
    const res = await this.request<{ success: boolean; token: string; expiresAt: string; user: User }>('/api/auth/refresh', {
      method: 'POST'
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async updateProfile(data: { name?: string; location?: string; preferredCurrency?: string }) {
    return this.request<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.changePassword(currentPassword, newPassword);
  }

  // Campaigns
  async getCampaigns() {
    return this.request<{ campaigns: Campaign[] }>('/api/campaigns');
  }

  async getUserCampaigns(): Promise<Campaign[]> {
    const res = await this.getCampaigns();
    return res.campaigns || [];
  }

  async createCampaign(data: {
    title: string;
    url: string;
    durationSeconds: number;
    budget: number;
    category: string;
    dailyVisitLimit?: number;
    targetLocations?: string;
    deviceTargeting?: string;
    ga4MeasurementId?: string | null;
    ga4ApiSecret?: string | null;
    interactiveClicksEnabled?: boolean;
  }) {
    return this.request<{ message: string; campaign: Campaign; reviewStatus: string }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async preValidateUrl(url: string, title?: string, campaignId?: string) {
    return this.request<{
      score: number;
      passed: boolean;
      checks: any;
      suggestedStatus: string;
      rejectionReason?: string;
    }>('/api/campaigns/pre-validate', {
      method: 'POST',
      body: JSON.stringify({ url, title, campaignId })
    });
  }

  async getCampaignDetails(id: string) {
    return this.request<{
      campaign: Campaign;
      metrics: any;
      recent_visits: any[];
      review: any;
    }>(`/api/campaigns/${id}`);
  }

  async toggleCampaignStatus(id: string) {
    return this.request<{ message: string; status: string }>(`/api/campaigns/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async updateCampaignSettings(id: string, data: {
    title?: string;
    url?: string;
    urls?: string[] | string;
    targetLocations?: string;
    deviceTargeting?: string;
    category?: string;
    dailyVisitLimit?: number;
    durationSeconds?: number;
    ga4MeasurementId?: string | null;
    ga4ApiSecret?: string | null;
    interactiveClicksEnabled?: boolean;
    autoProgress?: boolean;
    auto_progress?: boolean | number;
    status?: string;
  }) {
    return this.request<{ message: string; campaign: Campaign }>(`/api/campaigns/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async stepCampaignVisit(id: string) {
    return this.request<{
      success: boolean;
      result: {
        success: boolean;
        visitId: string;
        targetUrl: string;
        country: string;
        httpStatus: number;
        spentCredits: number;
        remainingBudget: number;
        totalVisits: number;
      };
    }>(`/api/campaigns/${id}/step`, {
      method: 'POST'
    });
  }

  async getCampaignVisits(id: string) {
    return this.request<{
      visits: Array<{
        id: string;
        campaign_id: string;
        target_url: string;
        visitor_country: string;
        visitor_country_code: string;
        visitor_device: string;
        duration_seconds: number;
        actual_dwell_seconds: number;
        credits_charged: number;
        status: string;
        http_status: number;
        ip_address: string;
        created_at: string;
        completed_at: string;
      }>;
    }>(`/api/campaigns/${id}/visits`);
  }

  async triggerSchedulerTick() {
    return this.request<{
      success: boolean;
      result: {
        timestamp: string;
        activeCampaignsCount: number;
        deliveredCount: number;
        dispatchedVisits: any[];
      };
    }>(`/api/campaigns/scheduler/tick`, {
      method: 'POST'
    });
  }

  async getSchedulerStatus() {
    return this.request<{
      isRunning: boolean;
      activeCampaignsCount: number;
      lastTickAt: string | null;
      intervalSeconds: number;
    }>(`/api/campaigns/scheduler/status`);
  }

  async addCampaignBudget(id: string, amount: number) {
    return this.request<{ message: string; newBudget: number; status: string }>(`/api/campaigns/${id}/budget`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async deleteCampaign(id: string) {
    return this.request<{ message: string }>(`/api/campaigns/${id}`, {
      method: 'DELETE'
    });
  }

  async dispatchCampaignTraffic(id: string, count: number = 5) {
    return this.request<{
      success: boolean;
      visitsDelivered: number;
      creditsSpent: number;
      remainingBudget: number;
      totalVisits: number;
      message: string;
    }>(`/api/campaigns/${id}/dispatch-traffic`, {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  }

  async verifyCampaignRouting(id: string) {
    return this.request<{
      campaignId: string;
      title: string;
      url: string;
      targetLocations: string;
      routingMode: 'strict_geo' | 'regional_pool' | 'global_any';
      geoProfile: {
        country: string;
        code: string;
        locale: string;
        languages: string;
        sampleCities: string[];
        ipRangeSample: string;
      };
      simulatedRouting: {
        ipAddress: string;
        userAgent: string;
        acceptLanguage: string;
        uipOverride: string;
        forwardedFor: string;
        ga4Locale: string;
        countryAttribution: string;
      };
      analytics: {
        detectedGa4Tag: string | null;
        uipReportingSupported: boolean;
        protocol: string;
      };
      urlCheck: {
        status: number;
        ok: boolean;
        responseTimeMs: number;
        error: string | null;
      };
      throttling: {
        dailyLimit: number;
        todayVisits: number;
        deviceTargeting: string;
        durationSeconds: number;
        costPerVisit: number;
        budget: number;
        spent: number;
        remainingCredits: number;
      };
      systemHealth: {
        status: 'optimal' | 'warning' | 'error';
        checksPassed: string[];
        recommendations: string[];
      };
    }>(`/api/campaigns/${id}/verify-routing`);
  }

  async getSystemRoutingRules() {
    return this.request<{
      profiles: Array<{
        country: string;
        code: string;
        cities: string[];
        locale: string;
        languages: string;
        ipRanges: string[];
      }>;
      networkEngine: {
        ga4ProtocolOverride: string;
        forwardingHeaders: string[];
        activeNodes: number;
        version: string;
      };
    }>('/api/campaigns/system/routing-rules');
  }

  // Surf
  async getSurfStatus() {
    return this.request<{
      hasCampaigns: boolean;
      totalAvailableInPool: number;
      userCredits: number;
      todayVisitsMade: number;
    }>('/api/surf/status');
  }

  async startSurfSession(preferredCampaignId?: string) {
    return this.request<SurfSessionPayload>('/api/surf/start', {
      method: 'POST',
      body: JSON.stringify({ preferredCampaignId })
    });
  }

  async completeSurfSession(sessionToken: string, challengeAnswer: string, clientDwellSeconds = 15): Promise<SurfCompleteResult> {
    return this.request<SurfCompleteResult>('/api/surf/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, challengeAnswer, clientDwellSeconds })
    });
  }

  async registerSurfClick(data: {
    sessionToken: string;
    clickType?: 'in_frame' | 'companion_tab' | 'quick_action';
    linkUrl?: string;
    linkText?: string;
  }): Promise<RegisterClickResult> {
    return this.request<RegisterClickResult>('/api/surf/register-click', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async sendSurfHeartbeat(sessionToken: string, isVisible: boolean, isFocused: boolean) {
    return this.request<{
      success: boolean;
      activeDwellSeconds: number;
      backgroundDwellSeconds: number;
      requiredSeconds: number;
      isEligible: boolean;
    }>('/api/surf/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, isVisible, isFocused })
    });
  }

  async inspectUrl(url: string, campaignId?: string) {
    const params = new URLSearchParams({ url });
    if (campaignId) params.set('campaignId', campaignId);
    return this.request<{
      campaignId: string;
      url: string;
      isAvailable: boolean;
      httpStatus: number;
      responseTimeMs: number;
      canEmbedInIframe: boolean;
      xFrameOptions: string | null;
      cspFrameAncestors: string | null;
      healthStatus: 'healthy' | 'degraded' | 'unreachable';
      error: string | null;
    }>(`/api/surf/inspect-url?${params.toString()}`);
  }

  async getEngineDiagnostics(): Promise<SurfEngineDiagnostics> {
    return this.request<SurfEngineDiagnostics>('/api/surf/engine-diagnostics');
  }

  // Live Cycle & Exchange Pool
  async getCyclePool(): Promise<CyclePoolResponse> {
    return this.request<CyclePoolResponse>('/api/cycle');
  }

  async getCycleSites(): Promise<{ sites: CycleSite[]; total: number; updatedAt: string; poolVersion: number }> {
    return this.request<{ sites: CycleSite[]; total: number; updatedAt: string; poolVersion: number }>('/api/cycle/sites');
  }

  async getCycleVersion(): Promise<{ poolVersion: number; total: number; updatedAt: string }> {
    return this.request<{ poolVersion: number; total: number; updatedAt: string }>('/api/cycle/version');
  }

  async getTrafficStrength(): Promise<TrafficStrengthTelemetry> {
    return this.request<TrafficStrengthTelemetry>('/api/cycle/traffic-strength');
  }

  async getActiveCampaigns(): Promise<{ campaigns: CycleSite[]; sites: CycleSite[]; total: number; eligibleTotal: number; poolVersion: number; updatedAt: string }> {
    return this.request<{ campaigns: CycleSite[]; sites: CycleSite[]; total: number; eligibleTotal: number; poolVersion: number; updatedAt: string }>('/api/campaigns/active');
  }

  // Credits & Currency Conversion
  async getMarketRates(): Promise<MarketRates> {
    return this.request<MarketRates>('/api/credits/market-rates');
  }

  async getCreditValuation(): Promise<CreditValuation> {
    return this.request<CreditValuation>('/api/credits/valuation');
  }

  async convertCurrency(amount: number, from: string, to: string): Promise<CurrencyConversionResult> {
    return this.request<CurrencyConversionResult>('/api/credits/convert', {
      method: 'POST',
      body: JSON.stringify({ amount, from, to })
    });
  }

  async getCreditHistory(limit = 50, offset = 0) {
    return this.request<{
      transactions: CreditTransaction[];
      total: number;
      currentBalance: number;
    }>(`/api/credits/history?limit=${limit}&offset=${offset}`);
  }

  async getCreditLedger(limit = 50, offset = 0): Promise<CreditTransaction[]> {
    const res = await this.getCreditHistory(limit, offset);
    return res.transactions || [];
  }

  async getDailyBonusStatus(): Promise<DailyBonusStatus> {
    return this.request<DailyBonusStatus>('/api/credits/daily-bonus/status');
  }

  async claimDailyBonus(optionId?: string): Promise<ClaimDailyBonusResponse> {
    return this.request<ClaimDailyBonusResponse>('/api/credits/daily-bonus', {
      method: 'POST',
      body: JSON.stringify({ optionId })
    });
  }

  async transferCredits(recipientEmail: string, amount: number, note?: string) {
    return this.request<{ message: string; newBalance: number }>('/api/credits/transfer', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail, amount, note })
    });
  }

  // Analytics
  async getUserDashboardStats() {
    return this.request<UserStats>('/api/analytics/dashboard');
  }

  async getWeeklyAnalytics() {
    return this.request<WeeklyAnalyticsData>('/api/analytics/weekly');
  }

  async getGeoTrafficDistribution() {
    return this.request<GeoTrafficDistributionData>('/api/analytics/geo-distribution');
  }

  async getGlobalTrafficLog(params?: { campaignId?: string; country?: string; status?: string; search?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.country) query.set('country', params.country);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<GlobalTrafficLogResponse>(`/api/analytics/global-traffic-log${qs ? `?${qs}` : ''}`);
  }

  async getUrlBrowseReport(params?: { timeRange?: string; search?: string; campaignId?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.timeRange) query.set('timeRange', params.timeRange);
    if (params?.search) query.set('search', params.search);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<UrlBrowseReportResponse>(`/api/analytics/url-browse-report${qs ? `?${qs}` : ''}`);
  }

  async getTimeLapAnalytics(params?: {
    timeRange?: string;
    search?: string;
    campaignId?: string;
    lapInterval?: 'standard' | 'fine' | 'extended';
    lapFilter?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.timeRange) query.set('timeRange', params.timeRange);
    if (params?.search) query.set('search', params.search);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.lapInterval) query.set('lapInterval', params.lapInterval);
    if (params?.lapFilter) query.set('lapFilter', params.lapFilter);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<TimeLapAnalyticsResponse>(`/api/analytics/time-laps${qs ? `?${qs}` : ''}`);
  }

  async debugTraffic(payload: TrafficDebuggerRequest) {
    return this.request<TrafficDebuggerResult>('/api/analytics/debug-traffic', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getPlatformStats() {
    return this.request<PlatformStats>('/api/analytics/platform');
  }

  // Admin
  async getAdminOverview() {
    return this.request<{
      stats: PlatformStats;
      pendingReviewsCount: number;
      recentLogs: any[];
      recentAdminActions: any[];
    }>('/api/admin/overview');
  }

  async getAdminStats() {
    return this.getAdminOverview();
  }

  async getAdminUsers(search = '', role = '', status = ''): Promise<User[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    const res = await this.request<{ users: User[] }>(`/api/admin/users?${params.toString()}`);
    return res.users || [];
  }

  async adjustUserCredits(userId: string, amount: number, reason: string) {
    return this.request<{ message: string; newBalance: number }>(`/api/admin/users/${userId}/adjust-credits`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    });
  }

  async updateUserStatus(userId: string, status?: string, role?: string) {
    return this.request<{ message: string }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, role })
    });
  }

  async getAdminReviews(status = 'pending') {
    return this.request<{ reviews: any[] }>(`/api/admin/reviews?status=${status}`);
  }

  async getReviewQueue(status = 'pending'): Promise<any[]> {
    const res = await this.getAdminReviews(status);
    return res.reviews || [];
  }

  async makeReviewDecision(reviewId: string, decision: 'approve' | 'reject', reason?: string) {
    return this.request<{ message: string; status: string }>(`/api/admin/reviews/${reviewId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason })
    });
  }

  async reviewCampaign(reviewId: string, decision: 'approve' | 'reject', reason?: string) {
    return this.makeReviewDecision(reviewId, decision, reason);
  }

  async getAdminCampaigns(status = ''): Promise<Campaign[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await this.request<{ campaigns: Campaign[] }>(`/api/admin/campaigns?${params.toString()}`);
    return res.campaigns || [];
  }

  async getAdminSettings(): Promise<any> {
    const res = await this.request<{ settings: any }>('/api/admin/settings');
    return res.settings;
  }

  async updateAdminSettings(settings: any) {
    return this.request<{ message: string; settings: any }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Payments & Bank Deposits
  async getPaymentPackages() {
    return this.request<{
      packages: CreditPackage[];
      bankDetails: BankDetails;
    }>('/api/payments/packages');
  }

  async getBankDetails() {
    return this.request<BankDetails>('/api/payments/bank-details');
  }

  async createPaymentOrder(data: {
    packageId?: string;
    customCredits?: number;
    paymentMethod?: string;
    currency?: string;
  }) {
    return this.request<{
      message: string;
      order: PaymentOrder;
      bankDetails: BankDetails;
    }>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async submitPaymentProof(orderId: string, proofReference: string, proofNotes?: string) {
    return this.request<{ message: string; order: PaymentOrder }>(`/api/payments/orders/${orderId}/submit-proof`, {
      method: 'POST',
      body: JSON.stringify({ proofReference, proofNotes })
    });
  }

  async quickUpiVerify(orderId: string, utrNumber: string, payerUpiId?: string, payerName?: string) {
    return this.request<{ message: string; order: PaymentOrder; newBalance: number }>(`/api/payments/orders/${orderId}/quick-upi-verify`, {
      method: 'POST',
      body: JSON.stringify({ utrNumber, payerUpiId, payerName })
    });
  }

  async instantCardCheckout(orderId: string) {
    return this.request<{ message: string; order: PaymentOrder; newBalance: number }>(`/api/payments/orders/${orderId}/instant-checkout`, {
      method: 'POST'
    });
  }

  async getMyPaymentOrders() {
    return this.request<{ orders: PaymentOrder[] }>('/api/payments/my-orders');
  }

  async getAdminPaymentOrders(status?: string) {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return this.request<{ orders: PaymentOrder[]; pendingCount: number }>(`/api/admin/payments${query}`);
  }

  async reviewPaymentOrder(orderId: string, action: 'approve' | 'reject', notes?: string) {
    return this.request<{ message: string; status: string }>(`/api/admin/payments/${orderId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    });
  }

  async updateAdminBankSettings(settings: Partial<BankDetails>) {
    return this.request<{ message: string; settings: any }>('/api/admin/bank-settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  // ==========================================
  // TRI-STATION MULTI-BROWSER ENGINE
  // ==========================================

  async getTriStationState() {
    return this.request<import('../types.js').TriStationEngineResponse>('/api/tri-station/state');
  }

  async controlTriStation(payload: import('../types.js').StationControlPayload) {
    return this.request<import('../types.js').TriStationEngineResponse>('/api/tri-station/control', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async startAllTriStations() {
    return this.request<import('../types.js').TriStationEngineResponse>('/api/tri-station/start-all', {
      method: 'POST'
    });
  }

  async stopAllTriStations() {
    return this.request<import('../types.js').TriStationEngineResponse>('/api/tri-station/stop-all', {
      method: 'POST'
    });
  }

  async pushUrlToTriStation(data: {
    url: string;
    stationId?: import('../types.js').StationId;
    searchKeyword?: string;
    searchTheme?: string;
    targetCountry?: string;
    targetCity?: string;
    deviceProfile?: import('../types.js').DeviceTypeProfile;
    dwellDurationSeconds?: number;
    adDisplayCustom?: Partial<import('../types.js').StationAdDisplayData>;
  }) {
    return this.request<{ message: string; state: import('../types.js').TriStationEngineResponse }>('/api/tri-station/push-url', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async setTriStationRotationalClass(rotationalClass: '24h_rotational' | 'hourly_5k_burst' | 'standard', stationId?: import('../types.js').StationId) {
    return this.request<{ message: string; state: import('../types.js').TriStationEngineResponse }>('/api/tri-station/rotational-class', {
      method: 'POST',
      body: JSON.stringify({ rotationalClass, stationId })
    });
  }

  // Google Analytics (GA4) Diagnostics & Realtime Verification
  async scanWebsiteForGA4Tags(url: string) {
    return this.request<import('../types.js').GA4TagScanResult>('/api/analytics/ga4-scan', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }

  async sendGA4TestPing(data: { url: string; measurementId?: string; campaignId?: string; countryCode?: string }) {
    return this.request<import('../types.js').GA4TestPingResult>('/api/analytics/ga4-test-ping', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getGA4DeliveryLogs(campaignId?: string, limit: number = 30) {
    const params = new URLSearchParams();
    if (campaignId) params.set('campaignId', campaignId);
    if (limit) params.set('limit', String(limit));
    return this.request<{ logs: import('../types.js').GA4DeliveryLog[] }>(`/api/analytics/ga4-delivery-logs?${params.toString()}`);
  }

  // Global Notifications & Activity Sentinel
  async getNotifications(limit: number = 40) {
    return this.request<{ notifications: import('../types.js').AppNotification[]; unreadCount: number }>(`/api/notifications?limit=${limit}`);
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean; unreadCount: number }>(`/api/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean; updatedCount: number; unreadCount: number }>('/api/notifications/read-all', {
      method: 'POST'
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; unreadCount: number }>(`/api/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  async clearReadNotifications() {
    return this.request<{ success: boolean; clearedCount: number; unreadCount: number }>('/api/notifications/clear', {
      method: 'POST'
    });
  }

  async triggerTestNotification(eventType: 'campaign_test_to_active' | 'user_inactivity' | 'user_reactivated' | 'system', campaignId?: string, reason?: string) {
    return this.request<{ success: boolean; notification: import('../types.js').AppNotification; unreadCount: number }>('/api/notifications/test-event', {
      method: 'POST',
      body: JSON.stringify({ eventType, campaignId, reason })
    });
  }

  // Campaign Status Transition & Upgrades
  async transitionCampaignStatus(id: string, status: 'active' | 'test' | 'paused') {
    return this.request<{ message: string; campaign: Campaign; notification?: import('../types.js').AppNotification }>(`/api/campaigns/${id}/transition-status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async upgradeCampaign(id: string, data: { tier?: string; category?: string; boostCredits?: number }) {
    return this.request<{ message: string; campaign: Campaign; notification?: import('../types.js').AppNotification }>(`/api/campaigns/${id}/upgrade`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // User Activity & Inactivity Sentinel
  async heartbeatActivity() {
    return this.request<{ status: string; last_active_at: string }>('/api/auth/heartbeat', {
      method: 'POST'
    });
  }

  async reactivateAccount() {
    return this.request<{ message: string; user: User; notification?: import('../types.js').AppNotification }>('/api/auth/reactivate', {
      method: 'POST'
    });
  }

  async setAccountIdle(reason?: string) {
    return this.request<{ message: string; user: User; notification?: import('../types.js').AppNotification }>('/api/auth/set-idle', {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
}

export const api = new ApiClient();
