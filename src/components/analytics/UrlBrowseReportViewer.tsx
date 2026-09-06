import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Compass,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Radio,
  Eye,
  Activity,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  BarChart3,
  Server,
  Laptop,
  Smartphone,
  Tablet,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import {
  UrlBrowseReportResponse,
  UrlBrowseItem,
  UrlBrowseRecentHit
} from '../../types.js';

interface UrlBrowseReportViewerProps {
  onOpenDebugger?: (url: string, country?: string) => void;
}

export function UrlBrowseReportViewer({ onOpenDebugger }: UrlBrowseReportViewerProps) {
  const [data, setData] = useState<UrlBrowseReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // UI state
  const [activeTab, setActiveTab] = useState<'url_matrix' | 'live_feed'>('url_matrix');
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchReport = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const resp = await api.getUrlBrowseReport({
        search: searchQuery,
        campaignId: selectedCampaignId || undefined,
        timeRange
      });
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to load URL browse report');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCampaignId, timeRange]);

  useEffect(() => {
    fetchReport(true);
  }, [fetchReport]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleExportCsv = () => {
    if (!data || data.urls.length === 0) return;
    setIsExporting(true);
    try {
      const headers = ['URL', 'Campaign Title', 'Status', 'Total Visits', 'Today Visits', 'Avg Dwell (s)', 'Credits Spent', 'Target Locations', 'Top Origin Country', 'Last Browsed At'];
      const rows = data.urls.map(u => [
        `"${u.url.replace(/"/g, '""')}"`,
        `"${u.campaignTitle.replace(/"/g, '""')}"`,
        u.campaignStatus,
        u.totalVisits,
        u.todayVisits,
        u.avgDwellSeconds,
        u.totalCreditsSpent,
        `"${u.targetLocations}"`,
        `"${u.geoDistribution[0]?.country || 'Global'}"`,
        `"${u.lastBrowsedAt}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `trafficloop_url_browse_report_${timeRange}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="url-browse-report-viewer" className="space-y-6">
      {/* Header Banner & Live Status */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-5 md:p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3 text-cyan-400 shrink-0 shadow-inner">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">URL Browse Analytics & Origin Report</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Radio className="w-3 h-3 animate-ping" /> Real-time API
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Comprehensive destination URL inspection report detailing where your links are being browsed across international network nodes, dwell durations, and Google Analytics verification status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              id="url-report-export-csv-btn"
              onClick={handleExportCsv}
              disabled={isExporting || !data || data.urls.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
            <button
              id="url-report-refresh-btn"
              onClick={() => fetchReport(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Top Summary Stat Grid */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Active URLs</span>
              <span className="text-lg md:text-xl font-bold text-white mt-0.5 block">{data.summary.totalUrlsCount}</span>
              <span className="text-[10px] text-cyan-400 font-mono">Live campaigns</span>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Browsed</span>
              <span className="text-lg md:text-xl font-bold text-emerald-400 mt-0.5 block">{data.summary.totalVisitsCount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-mono">+{data.summary.todayVisitsCount} today</span>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Avg Dwell Time</span>
              <span className="text-lg md:text-xl font-bold text-cyan-300 mt-0.5 block">{data.summary.avgDwellSeconds}s</span>
              <span className="text-[10px] text-emerald-400 font-mono">100% verified</span>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Dwell Hours</span>
              <span className="text-lg md:text-xl font-bold text-purple-400 mt-0.5 block">{data.summary.totalDwellHours} hrs</span>
              <span className="text-[10px] text-slate-400 font-mono">Total engagement</span>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Top Origin Geo</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base">{data.summary.topOriginFlag}</span>
                <span className="text-sm font-bold text-white truncate">{data.summary.topOriginCountry}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Primary browse pool</span>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Active Surfers</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-lg font-bold text-emerald-300">{data.summary.activeBrowsersCount} online</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Exchanging hits</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="url-browse-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search URL, domain, or title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {data?.availableCampaigns && data.availableCampaigns.length > 0 && (
            <select
              id="url-browse-campaign-filter"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Campaigns ({data.availableCampaigns.length})</option>
              {data.availableCampaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
            {['today', '7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === 'today' ? 'Today' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('url_matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'url_matrix'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> URL Breakdown ({data?.urls.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('live_feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'live_feed'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Browse Stream
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Aggregating real-time URL browse logs & geo matrices...</p>
          <p className="text-xs text-slate-500 mt-1">Connecting to authoritative edge logs</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => fetchReport(true)}
            className="mt-3 px-4 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs rounded-lg border border-red-700 transition"
          >
            Retry Request
          </button>
        </div>
      )}

      {!isLoading && !error && data && data.urls.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No URL Browse Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery ? `No campaigns or URLs match "${searchQuery}". Try clearing search filters.` : 'Start a campaign or launch auto-surfing to populate real-time URL browse logs.'}
          </p>
        </div>
      )}

      {/* Tab 1: URL Breakdown & Geographic Origin Matrix */}
      {!isLoading && !error && data && data.urls.length > 0 && activeTab === 'url_matrix' && (
        <div className="space-y-4">
          {data.urls.map((item, idx) => {
            const isExpanded = expandedUrl === item.url;
            return (
              <div
                key={`${item.campaignId}_${idx}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden backdrop-blur-md shadow-lg transition-all hover:border-slate-700"
              >
                {/* Main Card Header */}
                <div className="p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* URL Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                          {item.campaignTitle}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.campaignStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.campaignStatus.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" /> Target: {item.targetLocations}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm md:text-base font-semibold text-white hover:text-cyan-300 transition truncate flex items-center gap-1.5"
                        >
                          {item.url}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </a>
                        <button
                          onClick={() => handleCopy(item.url)}
                          className="text-slate-500 hover:text-slate-300 transition p-1"
                          title="Copy destination URL"
                        >
                          {copiedUrl === item.url ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-center min-w-[90px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Total Hits</span>
                        <span className="text-base font-bold text-white">{item.totalVisits.toLocaleString()}</span>
                        <span className="text-[9px] text-emerald-400 font-mono">+{item.todayVisits} today</span>
                      </div>

                      <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-center min-w-[90px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Avg Dwell</span>
                        <span className="text-base font-bold text-cyan-300">{item.avgDwellSeconds}s</span>
                        <span className="text-[9px] text-slate-400 font-mono">per visitor</span>
                      </div>

                      <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-center min-w-[90px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Credits</span>
                        <span className="text-base font-bold text-purple-400">{item.totalCreditsSpent}</span>
                        <span className="text-[9px] text-slate-400 font-mono">spent</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenDebugger && (
                          <button
                            id={`test-debugger-btn-${idx}`}
                            onClick={() => onOpenDebugger(item.url, item.targetLocations)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Test in Debugger
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedUrl(isExpanded ? null : item.url)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>Hide Trace <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>View Trace Logs ({item.recentHits.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Origins Matrix Bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" /> Where this URL is being browsed from (Geo Attribution)
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Last hit: {new Date(item.lastBrowsedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {item.geoDistribution.map((geo, gIdx) => (
                        <div
                          key={gIdx}
                          className="rounded-xl bg-slate-950/60 border border-slate-800/90 p-2.5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{geo.flag}</span>
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block leading-tight">{geo.country}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{geo.visits} visits</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40">
                            {geo.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Trace Logs Section */}
                {isExpanded && (
                  <div className="bg-slate-950/80 border-t border-slate-800 p-4 md:p-5 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Real-time Ingress & Egress Browse Traces for this URL
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">Residential Reverse-Proxy & GA4 Verified</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Timestamp</th>
                            <th className="py-2.5 px-3">Visitor Socket</th>
                            <th className="py-2.5 px-3">Detected Origin</th>
                            <th className="py-2.5 px-3">Simulated Egress</th>
                            <th className="py-2.5 px-3">Dwell Time</th>
                            <th className="py-2.5 px-3">Device</th>
                            <th className="py-2.5 px-3">Referrer</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                          {item.recentHits.map((hit) => (
                            <tr key={hit.id} className="hover:bg-slate-900/50 transition">
                              <td className="py-2 px-3 text-slate-400 text-[11px]">
                                {new Date(hit.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-2 px-3 text-slate-300 text-[11px]">
                                {hit.visitorSubnet}
                              </td>
                              <td className="py-2 px-3 text-slate-200">
                                <span className="mr-1">{hit.originFlag}</span> {hit.originCountry}
                              </td>
                              <td className="py-2 px-3 text-cyan-300">
                                <span className="mr-1">{hit.simulatedFlag}</span> {hit.simulatedCountry}
                              </td>
                              <td className="py-2 px-3 text-emerald-400 font-semibold">
                                {hit.dwellSeconds}s <span className="text-[10px] text-slate-500 font-normal">/ {hit.requiredDwellSeconds}s</span>
                              </td>
                              <td className="py-2 px-3 text-slate-400 capitalize">
                                {hit.deviceType === 'mobile' ? (
                                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-purple-400" /> Mobile</span>
                                ) : hit.deviceType === 'tablet' ? (
                                  <span className="flex items-center gap-1"><Tablet className="w-3 h-3 text-amber-400" /> Tablet</span>
                                ) : (
                                  <span className="flex items-center gap-1"><Laptop className="w-3 h-3 text-cyan-400" /> Desktop</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[140px]" title={hit.referrer}>
                                {hit.referrer}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" /> GA4 UIP
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Live Real-Time Browse Stream Feed */}
      {!isLoading && !error && data && activeTab === 'live_feed' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Surfer & Network URL Browse Stream
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chronological stream of URLs visited with dwell timing and geo-proxy egress attribution.
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50 self-start sm:self-auto">
              {data.recentLiveFeed.length} recent network hits logged
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Time</th>
                  <th className="py-3 px-3.5">Destination URL & Campaign</th>
                  <th className="py-3 px-3.5">Detected Ingress</th>
                  <th className="py-3 px-3.5">Simulated Egress</th>
                  <th className="py-3 px-3.5">Dwell Duration</th>
                  <th className="py-3 px-3.5">Device</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono bg-slate-900/40">
                {data.recentLiveFeed.map((hit) => (
                  <tr key={hit.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(hit.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3.5 max-w-[280px]">
                      <div className="font-semibold text-slate-200 truncate" title={hit.campaignTitle}>
                        {hit.campaignTitle}
                      </div>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline truncate block"
                        title={hit.url}
                      >
                        {hit.url}
                      </a>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-300">
                      <span className="mr-1">{hit.originFlag}</span> {hit.originCountry}
                      <span className="text-[10px] text-slate-500 block">{hit.visitorSubnet}</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-cyan-300">
                      <span className="mr-1">{hit.simulatedFlag}</span> {hit.simulatedCountry}
                      <span className="text-[10px] text-emerald-400 block">GA4 UIP Attached</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-emerald-400 font-bold">
                      {hit.dwellSeconds}s <span className="text-[10px] text-slate-400 font-normal">/ {hit.requiredDwellSeconds}s</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 capitalize">
                      {hit.deviceType}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {onOpenDebugger && (
                        <button
                          onClick={() => onOpenDebugger(hit.url, hit.simulatedCountryCode)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg border border-cyan-500/30 transition inline-flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Trace
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
