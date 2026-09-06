import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  Clock,
  Hourglass,
  Layers,
  Search,
  RefreshCw,
  Download,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Radio,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Users,
  Compass,
  Laptop,
  Smartphone,
  Tablet,
  Activity,
  BarChart3,
  Flame,
  PieChart,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../../services/api.js';
import {
  TimeLapAnalyticsResponse,
  PageTimeLapItem,
  TimeLapBracket,
  PageTimeLapSession
} from '../../types.js';

interface PageTimeLapViewerProps {
  onOpenDebugger?: (url: string, country?: string) => void;
}

export function PageTimeLapViewer({ onOpenDebugger }: PageTimeLapViewerProps) {
  const [data, setData] = useState<TimeLapAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [lapInterval, setLapInterval] = useState<'standard' | 'fine' | 'extended'>('standard');
  const [selectedLapFilter, setSelectedLapFilter] = useState<string>('all');

  // UI state
  const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'sessions'>('matrix');

  const fetchTimeLaps = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const resp = await api.getTimeLapAnalytics({
        search: searchQuery,
        campaignId: selectedCampaignId || undefined,
        timeRange,
        lapInterval,
        lapFilter: selectedLapFilter !== 'all' ? selectedLapFilter : undefined
      });
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to load page time lap analytics');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCampaignId, timeRange, lapInterval, selectedLapFilter]);

  useEffect(() => {
    fetchTimeLaps(true);
  }, [fetchTimeLaps]);

  const handleExportCsv = () => {
    if (!data || data.pages.length === 0) return;
    setIsExporting(true);
    try {
      const lapHeaders = data.overallLaps.map(l => `Lap: ${l.shortLabel} (${l.label})`);
      const headers = [
        'Page URL',
        'Campaign Title',
        'Status',
        'Total Visits',
        'Today Visits',
        'Total User Time Spent',
        'Avg Dwell Seconds',
        'Min Dwell',
        'Max Dwell',
        'Bounce Rate (<15s %)',
        'Deep Engagement Rate (>=30s %)',
        ...lapHeaders,
        'Top Origin Country'
      ];

      const rows = data.pages.map(p => {
        const lapCounts = data.overallLaps.map(l => {
          const matching = p.laps.find(pl => pl.lapId === l.id);
          return matching ? `${matching.count} (${matching.percentage}%)` : '0 (0%)';
        });

        return [
          `"${p.url.replace(/"/g, '""')}"`,
          `"${p.campaignTitle.replace(/"/g, '""')}"`,
          p.campaignStatus,
          p.totalVisits,
          p.todayVisits,
          `"${p.totalTimeSpentFormatted}"`,
          p.avgDwellSeconds,
          p.minDwellSeconds,
          p.maxDwellSeconds,
          `${p.bounceRate}%`,
          `${p.highEngagementRate}%`,
          ...lapCounts,
          `"${p.geoDistribution[0]?.country || 'Global'}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `trafficloop_page_time_laps_${timeRange}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  const getBadgeClass = (color: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'emerald':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getBarColorClass = (color: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500';
      case 'amber':
        return 'bg-amber-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'cyan':
        return 'bg-cyan-500';
      case 'indigo':
        return 'bg-indigo-500';
      case 'purple':
        return 'bg-purple-500';
      case 'emerald':
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div id="page-time-lap-viewer" className="space-y-6">
      {/* Top Banner & Telemetry Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 md:p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3 text-indigo-400 shrink-0 shadow-inner">
              <Timer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">Page Counts in Time Laps & User Dwell Analytics</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity className="w-3 h-3 animate-ping" /> Dwell Engine
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Track exact page visit counts partitioned by time lap intervals (e.g. 0-15s, 16-30s, 31-60s, 61-120s, 120s+). Inspect accumulated time users have spent exploring each destination link.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              id="time-lap-export-csv-btn"
              onClick={handleExportCsv}
              disabled={isExporting || !data || data.pages.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
            </button>
            <button
              id="time-lap-refresh-btn"
              onClick={() => fetchTimeLaps(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Macro Summary Stats Grid */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Total User Time Spent</span>
              <span className="text-lg font-bold text-indigo-300 font-mono mt-0.5 block truncate">
                {data.summary.totalTimeSpentFormatted}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{data.summary.totalTimeSpentHours} total hours</span>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Total Page Visits</span>
              <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                {data.summary.totalVisitsCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-cyan-400 mt-0.5 block">+{data.summary.todayVisitsCount} today</span>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Avg Dwell Per User</span>
              <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                {data.summary.overallAvgDwellSeconds}s
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Active countdown dwell</span>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Deep Read Rate</span>
              <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5 block">
                {data.summary.deepEngagementRate}%
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Visits ≥ 30 seconds</span>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Top Dwell Page</span>
              <span className="text-xs font-semibold text-amber-300 font-mono mt-0.5 block truncate" title={data.summary.topDwellPage}>
                {data.summary.topDwellPage.replace(/^https?:\/\//, '')}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{data.summary.topDwellPageTime} logged</span>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-xs text-slate-400 font-medium block">Dominant Time Lap</span>
              <span className="text-xs font-bold text-purple-300 font-mono mt-0.5 block truncate">
                {data.summary.mostPopularLapLabel}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Highest volume tier</span>
            </div>
          </div>
        )}
      </div>

      {/* Time Lap Brackets Macro Breakdown Ribbon */}
      {data && data.overallLaps.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Overall Time Lap Duration Distribution & Visit Counts
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Interval Preset:</span>
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                {(['standard', 'fine', 'extended'] as const).map(preset => (
                  <button
                    key={preset}
                    onClick={() => setLapInterval(preset)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize transition ${
                      lapInterval === preset
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick-Filter Lap Bracket Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.overallLaps.map(lap => {
              const isSelected = selectedLapFilter === lap.id;
              return (
                <button
                  key={lap.id}
                  id={`lap-pill-${lap.id}`}
                  onClick={() => setSelectedLapFilter(isSelected ? 'all' : lap.id)}
                  className={`rounded-xl border p-3 text-left transition relative overflow-hidden group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded border ${getBadgeClass(lap.badgeColor)}`}>
                      {lap.shortLabel}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{lap.percentage}%</span>
                  </div>
                  <div className="text-base font-black text-white font-mono mt-1">
                    {lap.count.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">visits</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {lap.description}
                  </div>
                  {/* Progress bar inside card */}
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full ${getBarColorClass(lap.badgeColor)} transition-all duration-500`}
                      style={{ width: `${Math.max(4, lap.percentage)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedLapFilter !== 'all' && (
            <div className="flex items-center justify-between text-xs text-indigo-300 bg-indigo-950/30 border border-indigo-500/30 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <span>
                  Filtered by <strong>{data.overallLaps.find(l => l.id === selectedLapFilter)?.label}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedLapFilter('all')}
                className="underline hover:text-white"
              >
                Clear Lap Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Control Bar: Search, Campaign Filter, Time Range, View Toggle */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="time-lap-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by page URL or campaign title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="w-48 hidden sm:block">
            <select
              id="time-lap-campaign-select"
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Campaigns / Pages</option>
              {data?.availableCampaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            {[
              { id: '24h', label: '24h' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  timeRange === range.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Time Lap Matrix View"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Matrix
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Detailed Card View"
            >
              <Layers className="w-3.5 h-3.5" /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* Main Pages Table / Matrix */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Aggregating page visits & user dwell time laps...</p>
          <p className="text-xs text-slate-500 mt-1">Calculating high-precision time brackets and session telemetry.</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-6 text-center text-rose-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={() => fetchTimeLaps(true)}
            className="mt-3 px-4 py-1.5 bg-rose-600/30 border border-rose-500/40 rounded-xl text-xs hover:bg-rose-600/50 transition"
          >
            Retry Analysis
          </button>
        </div>
      ) : !data || data.pages.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Hourglass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Page Time Lap Data Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedCampaignId
              ? 'No active destination pages match your search or campaign filter.'
              : 'Create or launch a campaign to start tracking how much time users spend on each page.'}
          </p>
        </div>
      ) : viewMode === 'matrix' ? (
        /* Matrix Table View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Page / Destination URL</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Total Visits</th>
                  <th className="py-3.5 px-3 font-semibold">User Time Spent</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Avg Dwell</th>
                  <th className="py-3.5 px-4 font-semibold min-w-[240px]">Time Lap Breakdown (% Share)</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Bounce / Deep Rate</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.pages.map((page, idx) => {
                  const isExpanded = expandedPageUrl === page.url;
                  return (
                    <React.Fragment key={page.campaignId || idx}>
                      <tr className="hover:bg-slate-800/40 transition">
                        {/* Page URL & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-slate-300 shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 max-w-xs md:max-w-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate block">
                                  {page.campaignTitle}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-mono font-semibold ${
                                  page.campaignStatus === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {page.campaignStatus}
                                </span>
                              </div>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-indigo-400 text-[11px] font-mono flex items-center gap-1 truncate mt-0.5"
                                title={page.url}
                              >
                                {page.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Total Visits */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono font-bold text-white text-sm">
                            {page.totalVisits.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-cyan-400 font-mono">
                            +{page.todayVisits} today
                          </span>
                        </td>

                        {/* User Time Spent */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-indigo-300 text-sm block">
                            {page.totalTimeSpentFormatted}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {(page.totalTimeSpentSeconds / 3600).toFixed(2)} hrs total
                          </span>
                        </td>

                        {/* Avg Dwell */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                            <Clock className="w-3 h-3" /> {page.avgDwellSeconds}s
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            range: {page.minDwellSeconds}s - {page.maxDwellSeconds}s
                          </span>
                        </td>

                        {/* Multi-Segment Time Lap Bar */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            {/* Segmented Bar */}
                            <div className="flex h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              {page.laps.map(lap => {
                                if (lap.count === 0) return null;
                                const lapDef = data.overallLaps.find(o => o.id === lap.lapId);
                                const colorClass = getBarColorClass(lapDef?.badgeColor || 'emerald');
                                return (
                                  <div
                                    key={lap.lapId}
                                    className={`${colorClass} hover:opacity-80 transition`}
                                    style={{ width: `${lap.percentage}%` }}
                                    title={`${lap.label}: ${lap.count} visits (${lap.percentage}%) - ${lap.timeSpentFormatted}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Mini Lap Badges */}
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              {page.laps.map(lap => {
                                if (lap.count === 0) return null;
                                const lapDef = data.overallLaps.find(o => o.id === lap.lapId);
                                return (
                                  <span
                                    key={lap.lapId}
                                    className={`px-1.5 py-0.2 rounded border font-mono ${getBadgeClass(lapDef?.badgeColor || 'emerald')}`}
                                  >
                                    {lap.shortLabel}: <strong>{lap.count}</strong> ({lap.percentage}%)
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Bounce & High Engagement */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20"
                              title={`Bounce Rate (<15s): ${page.bounceCount} visits`}
                            >
                              {page.bounceRate}%
                            </span>
                            <span
                              className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                              title={`Deep Read (≥30s): ${page.highEngagementCount} visits`}
                            >
                              {page.highEngagementRate}%
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            bounce / deep
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenDebugger && (
                              <button
                                onClick={() => onOpenDebugger(page.url, page.geoDistribution[0]?.country)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
                                title="Open Live Proxy Debugger"
                              >
                                Debug
                              </button>
                            )}
                            <button
                              id={`toggle-page-drawer-${idx}`}
                              onClick={() => setExpandedPageUrl(isExpanded ? null : page.url)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
                                isExpanded
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30'
                              }`}
                            >
                              {isExpanded ? 'Hide' : 'Laps Detail'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Per-Page Deep Lap Telemetry Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={7} className="p-4 md:p-6">
                            <div className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-5 space-y-5">
                              {/* Header & Page Overview */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-sm font-bold text-white">
                                      Granular Time Lap Breakdown & Session Histogram for {page.campaignTitle}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Destination: <span className="font-mono text-indigo-300">{page.url}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-slate-300">
                                    Total Dwell Time: <strong className="text-emerald-400">{page.totalTimeSpentFormatted}</strong>
                                  </span>
                                  <span className="text-xs font-mono text-slate-300">
                                    Avg: <strong className="text-cyan-400">{page.avgDwellSeconds}s</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Lap Brackets Detailed Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                {page.laps.map(lap => {
                                  const lapDef = data.overallLaps.find(o => o.id === lap.lapId);
                                  return (
                                    <div
                                      key={lap.lapId}
                                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-col justify-between"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getBadgeClass(lapDef?.badgeColor || 'emerald')}`}>
                                          {lap.shortLabel}
                                        </span>
                                        <span className="text-xs font-bold text-white font-mono">{lap.percentage}%</span>
                                      </div>
                                      <div className="text-lg font-black text-white font-mono mt-1.5">
                                        {lap.count.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">hits</span>
                                      </div>
                                      <div className="text-[11px] text-indigo-300 font-mono mt-1">
                                        {lap.timeSpentFormatted}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Two Columns: Country & Device Breakdown + Recent Live Sessions */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                                {/* Country & Device Distribution */}
                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> Dwell by Origin Country
                                  </h5>
                                  <div className="space-y-2">
                                    {page.geoDistribution.slice(0, 5).map(geo => (
                                      <div key={geo.country} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span>{geo.flag}</span>
                                          <span className="text-slate-300 truncate">{geo.country}</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono">
                                          <span className="text-slate-400">{geo.visits} visits</span>
                                          <span className="text-emerald-400 font-semibold">{geo.avgDwell}s avg</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="border-t border-slate-800/80 pt-3">
                                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <Laptop className="w-3.5 h-3.5 text-indigo-400" /> Device Dwell Share
                                    </h5>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                                        <Laptop className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                                        <span className="text-[10px] text-slate-400 block">Desktop</span>
                                        <span className="font-mono font-bold text-white">{page.deviceBreakdown.desktop}%</span>
                                      </div>
                                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                                        <Smartphone className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                                        <span className="text-[10px] text-slate-400 block">Mobile</span>
                                        <span className="font-mono font-bold text-white">{page.deviceBreakdown.mobile}%</span>
                                      </div>
                                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                                        <Tablet className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                                        <span className="text-[10px] text-slate-400 block">Tablet</span>
                                        <span className="font-mono font-bold text-white">{page.deviceBreakdown.tablet}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Recent Sessions for this Page */}
                                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <Radio className="w-3.5 h-3.5 text-emerald-400" /> Recent Page Visitor Sessions with Time Laps
                                    </h5>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      Showing latest {page.recentSessions.length} sessions
                                    </span>
                                  </div>

                                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                                    {page.recentSessions.map(session => (
                                      <div
                                        key={session.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs hover:border-slate-700 transition"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span>{session.countryFlag}</span>
                                          <span className="font-mono text-slate-300 truncate">
                                            {session.visitorSubnet}
                                          </span>
                                          <span className="text-[10px] text-slate-500 uppercase">
                                            {session.device}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2.5 font-mono">
                                          <span className="text-indigo-300 font-bold">
                                            {session.dwellSeconds}s dwell
                                          </span>
                                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                                            Lap: {session.lapLabel}
                                          </span>
                                          {session.ga4Reported ? (
                                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                                              <ShieldCheck className="w-3 h-3" /> GA4
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-amber-400">
                                              Transport
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.pages.map((page, idx) => (
            <div
              key={page.campaignId || idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-white text-sm truncate">{page.campaignTitle}</h3>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-indigo-400 font-mono flex items-center gap-1 truncate mt-1"
                  >
                    {page.url} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                  page.campaignStatus === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {page.campaignStatus}
                </span>
              </div>

              {/* Time Spent and Avg Dwell Row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Visits</span>
                  <span className="font-mono font-bold text-white text-base">
                    {page.totalVisits.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Time Spent</span>
                  <span className="font-mono font-bold text-indigo-300 text-base">
                    {page.totalTimeSpentFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Avg Dwell</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    {page.avgDwellSeconds}s
                  </span>
                </div>
              </div>

              {/* Laps Breakdown Segmented */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Time Lap Distribution</span>
                <div className="flex h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  {page.laps.map(lap => {
                    if (lap.count === 0) return null;
                    const lapDef = data.overallLaps.find(o => o.id === lap.lapId);
                    return (
                      <div
                        key={lap.lapId}
                        className={`${getBarColorClass(lapDef?.badgeColor || 'emerald')}`}
                        style={{ width: `${lap.percentage}%` }}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  {page.laps.map(lap => {
                    const lapDef = data.overallLaps.find(o => o.id === lap.lapId);
                    return (
                      <div
                        key={lap.lapId}
                        className={`p-1.5 rounded border ${getBadgeClass(lapDef?.badgeColor || 'emerald')} flex justify-between`}
                      >
                        <span>{lap.shortLabel}</span>
                        <strong>{lap.count} ({lap.percentage}%)</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Top Origin: <strong className="text-slate-200">{page.geoDistribution[0]?.flag} {page.geoDistribution[0]?.country || 'Global'}</strong></span>
                <span>Bounce: <strong className="text-rose-400">{page.bounceRate}%</strong> · Deep: <strong className="text-emerald-400">{page.highEngagementRate}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Observation Notice Box */}
      <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 flex items-start gap-3 text-xs text-slate-400">
        <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">How Time Laps & User Time Spent are Measured:</strong>
          <p className="mt-1">
            Every browsing session on your pages tracks the exact dwell time countdown (in active seconds) from the moment the HTTP transport response is rendered until session completion. Visits are categorized into time lap intervals so you can analyze user retention, quick glance exits, and deep engagement duration across different countries and device profiles.
          </p>
        </div>
      </div>
    </div>
  );
}
