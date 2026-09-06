import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { CreditLedgerTable } from '../components/analytics/CreditLedgerTable.js';
import { WeeklyAnalyticsVisualization } from '../components/analytics/WeeklyAnalyticsVisualization.js';
import { GeoTrafficHeatMapVisualization } from '../components/analytics/GeoTrafficHeatMapVisualization.js';
import { TrafficDebuggerUtility } from '../components/analytics/TrafficDebuggerUtility.js';
import { GlobalTrafficLogViewer } from '../components/analytics/GlobalTrafficLogViewer.js';
import { UrlBrowseReportViewer } from '../components/analytics/UrlBrowseReportViewer.js';
import { PageTimeLapViewer } from '../components/analytics/PageTimeLapViewer.js';
import { StatCard } from '../components/common/StatCard.js';
import { CurrencyValuationCard } from '../components/common/CurrencyValuationCard.js';
import { TrafficMetricsBreakdown } from '../components/analytics/TrafficMetricsBreakdown.js';
import { Coins, ArrowDownLeft, ArrowUpRight, TrendingUp, ShieldCheck, RefreshCw, Globe, Radio, BarChart3, Flame, Terminal, FileText, Layers, Compass, Timer } from 'lucide-react';
import { CreditTransaction, WeeklyAnalyticsData, GeoTrafficDistributionData, Campaign } from '../types.js';
import { formatCredits, formatInr } from '../utils/formatters.js';

type AnalyticsTab = 'time_laps' | 'url_browse_report' | 'global_traffic_log' | 'overview_weekly' | 'geo_heatmap' | 'redirection_debugger' | 'credit_ledger' | 'all_views';

export function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('time_laps');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalyticsData | null>(null);
  const [geoData, setGeoData] = useState<GeoTrafficDistributionData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [ledgerData, statsData, weekly, geo, userCampaigns] = await Promise.all([
        api.getCreditLedger(),
        api.getUserDashboardStats(),
        api.getWeeklyAnalytics(),
        api.getGeoTrafficDistribution(),
        api.getUserCampaigns().catch(() => [])
      ]);
      setTransactions(ledgerData);
      setStats(statsData);
      setWeeklyData(weekly);
      setGeoData(geo);
      setCampaigns(userCampaigns);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const totalEarned = transactions
    .filter(t => t.type === 'visit_reward' || t.type === 'bonus' || t.type === 'streak_milestone_bonus')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'campaign_spend')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics, Global Traffic Log & Valuation</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time forensic visitor traffic logs with detected versus simulated geo-routing verification, weekly performance, and INR currency valuation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isRefreshing ? 'Updating...' : 'Refresh All Data'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Balance"
          value={`${formatCredits(user?.credits)} CR`}
          subtitle={`${formatInr((user?.credits || 0) * 1.5)} Real-Time INR Value`}
          icon={<Coins className="h-5 w-5" />}
          highlight={true}
        />

        <StatCard
          title="Total Earned"
          value={`+${formatCredits(totalEarned)} CR`}
          subtitle={`+${formatInr(totalEarned * 1.5)} earned`}
          icon={<ArrowDownLeft className="h-5 w-5 text-emerald-400" />}
        />

        <StatCard
          title="Total Delivered Spend"
          value={`-${formatCredits(totalSpent)} CR`}
          subtitle={`-${formatInr(totalSpent * 1.5)} invested`}
          icon={<ArrowUpRight className="h-5 w-5 text-rose-400" />}
        />

        <StatCard
          title="Exchange Ratio"
          value="1 : 1"
          subtitle="Fair 1-to-1 baseline rate"
          icon={<TrendingUp className="h-5 w-5 text-cyan-400" />}
        />
      </div>

      {/* Separated Multi-Tier Traffic & Telemetry Metrics */}
      <TrafficMetricsBreakdown
        metrics={stats?.stats?.traffic_metrics}
        totalReceived={stats?.stats?.total_visits_received || user?.total_visits_received || 0}
        todayReceived={stats?.stats?.today_visits_received || 0}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex items-center gap-2 overflow-x-auto pb-px scrollbar-none" aria-label="Analytics Tabs">
          <button
            type="button"
            id="tab-time-laps-btn"
            onClick={() => setActiveTab('time_laps')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'time_laps'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Timer className="h-4 w-4 text-indigo-400" />
            <span>Time Laps & Dwell</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
              Page Dwell Matrix
            </span>
          </button>

          <button
            type="button"
            id="tab-url-browse-report-btn"
            onClick={() => setActiveTab('url_browse_report')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'url_browse_report'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>URL Browse Report</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
              Live Edge API
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('global_traffic_log')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'global_traffic_log'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Globe className="h-4 w-4" />
            <span>Global Traffic Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
              Live Raw Stream
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('geo_heatmap')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'geo_heatmap'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Geo Heatmap & Intent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview_weekly')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'overview_weekly'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span>Weekly Breakdown & Revenue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('redirection_debugger')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'redirection_debugger'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Terminal className="h-4 w-4 text-purple-400" />
            <span>Redirection Inspector</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credit_ledger')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'credit_ledger'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Coins className="h-4 w-4 text-yellow-400" />
            <span>Credit Ledger & Valuation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_views')}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ml-auto ${
              activeTab === 'all_views'
                ? 'border-slate-400 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Sections</span>
          </button>
        </nav>
      </div>

      {/* Tab Content 0: Page Time Laps & User Dwell Analytics */}
      {(activeTab === 'time_laps' || activeTab === 'all_views') && (
        <section id="section-time-laps" className="space-y-6">
          <PageTimeLapViewer
            onOpenDebugger={(url, country) => {
              setActiveTab('redirection_debugger');
            }}
          />
        </section>
      )}

      {/* Tab Content: URL Browse Analytics & Origin Report */}
      {(activeTab === 'url_browse_report' || activeTab === 'all_views') && (
        <section id="section-url-browse-report" className="space-y-6">
          <UrlBrowseReportViewer
            onOpenDebugger={(url) => {
              setActiveTab('redirection_debugger');
            }}
          />
        </section>
      )}

      {/* Tab Content 1: Global Traffic Log */}
      {(activeTab === 'global_traffic_log' || activeTab === 'all_views') && (
        <section id="section-global-traffic-log" className="space-y-6">
          <GlobalTrafficLogViewer campaigns={campaigns} />
        </section>
      )}

      {/* Tab Content 2: Geo Heatmap & Target Intent */}
      {(activeTab === 'geo_heatmap' || activeTab === 'all_views') && (
        <section id="section-geo-heatmap" className="space-y-6">
          <GeoTrafficHeatMapVisualization
            data={geoData}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* Tab Content 3: Weekly Analytics & Traffic Sources */}
      {(activeTab === 'overview_weekly' || activeTab === 'all_views') && (
        <section id="section-overview-weekly" className="space-y-6">
          <WeeklyAnalyticsVisualization
            data={weeklyData}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* Tab Content 4: Traffic Debugger & Redirection Inspector */}
      {(activeTab === 'redirection_debugger' || activeTab === 'all_views') && (
        <section id="section-redirection-debugger" className="space-y-6">
          <TrafficDebuggerUtility
            campaigns={campaigns}
          />
        </section>
      )}

      {/* Tab Content 5: Credit Ledger & INR Valuation */}
      {(activeTab === 'credit_ledger' || activeTab === 'all_views') && (
        <section id="section-credit-ledger" className="space-y-6">
          {/* Real-Time Currency Valuation Card */}
          <CurrencyValuationCard
            creditBalance={user?.credits || 0}
            preferredCurrency={user?.preferred_currency || 'INR'}
          />

          {/* Ledger Table */}
          <CreditLedgerTable
            transactions={transactions}
            currentBalance={user?.credits || 0}
          />
        </section>
      )}
    </div>
  );
}


