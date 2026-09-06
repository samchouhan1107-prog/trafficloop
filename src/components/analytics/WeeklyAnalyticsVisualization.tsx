import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Coins,
  Eye,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Activity,
  Globe
} from 'lucide-react';
import { WeeklyAnalyticsData } from '../../types.js';
import { formatCredits, formatInr, formatNumber } from '../../utils/formatters.js';

interface WeeklyAnalyticsVisualizationProps {
  data: WeeklyAnalyticsData | null;
  isLoading?: boolean;
}

export function WeeklyAnalyticsVisualization({ data, isLoading }: WeeklyAnalyticsVisualizationProps) {
  const [chartView, setChartView] = useState<'credits' | 'visits' | 'combined'>('credits');
  const [pieHoveredIndex, setPieHoveredIndex] = useState<number | null>(null);

  if (isLoading || !data) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-800/80 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-48 rounded bg-slate-800/80 animate-pulse" />
              <div className="h-3 w-64 rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="mt-6 h-72 w-full rounded-lg bg-slate-800/30 animate-pulse" />
      </div>
    );
  }

  const { dailyBreakdown, trafficSources, summary } = data;

  // Custom Dark Tooltip for Line/Area/Bar Charts
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = dailyBreakdown.find(d => d.shortDay === label || d.dayLabel.startsWith(label));
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md min-w-[200px]">
          <div className="text-xs font-bold text-white border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
            <span>{dayData?.dayLabel || label}</span>
            <span className="text-[10px] text-slate-400 font-normal">{dayData?.date}</span>
          </div>

          <div className="space-y-2 text-xs">
            {payload.map((entry: any, index: number) => {
              const isCredits = entry.dataKey === 'creditsSpent' || entry.dataKey === 'creditsEarned';
              const isSpend = entry.dataKey === 'creditsSpent' || entry.dataKey === 'visitsReceived';
              return (
                <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-slate-300 font-medium">{entry.name}:</span>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span style={{ color: entry.color || entry.fill }}>
                      {isCredits ? `${formatCredits(entry.value)} CR` : formatNumber(entry.value)}
                    </span>
                    {isCredits && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        ≈ {formatInr(entry.value * 1.5)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {dayData && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Net Flow:</span>
                <span className={`font-mono font-bold ${(dayData.creditsEarned - dayData.creditsSpent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(dayData.creditsEarned - dayData.creditsSpent) >= 0 ? '+' : ''}
                  {formatCredits(dayData.creditsEarned - dayData.creditsSpent)} CR
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Traffic Sources Donut
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as typeof trafficSources[0];
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md min-w-[170px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-bold text-white">{item.name}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Traffic Volume:</span>
              <span className="font-bold text-white font-mono">{formatNumber(item.visits)} visits</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Share:</span>
              <span className="font-bold text-cyan-400 font-mono">{item.percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Credits Spent:</span>
              <span className="font-bold text-amber-400 font-mono">{formatCredits(item.creditsSpent)} CR</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="weekly-analytics-visualization" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 backdrop-blur-md shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Weekly Traffic & Credit Spend Analytics
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5" /> 7-Day Window
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual analysis of daily credit expenditures, traffic distribution channels, and visit completions.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartView('credits')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              chartView === 'credits'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            Credits Flow
          </button>
          <button
            type="button"
            onClick={() => setChartView('visits')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              chartView === 'visits'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Traffic Visits
          </button>
          <button
            type="button"
            onClick={() => setChartView('combined')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              chartView === 'combined'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Combined
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">7-Day Spend</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-rose-400 font-mono">
              -{formatCredits(summary.totalCreditsSpent)} CR
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            ≈ {formatInr(summary.totalCreditsSpent * 1.5)} invested
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">7-Day Earned</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-emerald-400 font-mono">
              +{formatCredits(summary.totalCreditsEarned)} CR
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            ≈ {formatInr(summary.totalCreditsEarned * 1.5)} from surfing
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Delivered Visits</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-cyan-400 font-mono">
              {formatNumber(summary.totalVisitsReceived)}
            </span>
            <span className="text-xs text-slate-400">visits</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Peak day: <strong className="text-slate-300">{summary.peakVisitsDay}</strong>
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Top Traffic Channel</span>
          <div className="mt-1 text-sm font-bold text-white truncate" title={summary.topTrafficSource}>
            {summary.topTrafficSource}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Daily avg spend: <strong className="text-slate-300 font-mono">{formatCredits(summary.avgDailySpend)} CR</strong>
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Main 7-Day Timeline Chart (2 cols on large screen) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {chartView === 'credits' && 'Daily Credits Spent vs. Credits Earned'}
                {chartView === 'visits' && 'Daily Traffic Delivered vs. Surfed Visits'}
                {chartView === 'combined' && '7-Day Combined Flow: Credits Spent & Traffic Delivery'}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {chartView === 'credits' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" /> Spent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" /> Earned
                  </span>
                </>
              )}
              {chartView === 'visits' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block" /> Delivered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 inline-block" /> Surfed
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'credits' ? (
                <AreaChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="shortDay"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `${val} CR`}
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="creditsSpent"
                    name="Credits Spent"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="creditsEarned"
                    name="Credits Earned"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEarned)"
                  />
                </AreaChart>
              ) : chartView === 'visits' ? (
                <BarChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="shortDay"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Bar
                    dataKey="visitsReceived"
                    name="Visits Delivered"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="visitsMade"
                    name="Visits Surfed"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCombinedSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCombinedVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="shortDay"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="creditsSpent"
                    name="Credits Spent (CR)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCombinedSpent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitsReceived"
                    name="Traffic Delivered"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCombinedVisits)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Breakdown (Pie / List) */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Traffic Sources Breakdown</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">By Category</span>
          </div>

          {/* Donut Chart */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="visits"
                  onMouseEnter={(_, index) => setPieHoveredIndex(index)}
                  onMouseLeave={() => setPieHoveredIndex(null)}
                >
                  {trafficSources.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={pieHoveredIndex === index ? '#ffffff' : '#0f172a'}
                      strokeWidth={pieHoveredIndex === index ? 2 : 1}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-base font-black text-white font-mono">
                {formatNumber(trafficSources.reduce((sum, s) => sum + s.visits, 0))}
              </span>
              <span className="text-[9px] text-slate-500">visits</span>
            </div>
          </div>

          {/* Traffic Channel Ranked List */}
          <div className="mt-3 space-y-2.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
            {trafficSources.map((source, idx) => (
              <div
                key={`src-row-${idx}`}
                className={`group rounded-lg p-2 transition-all border ${
                  pieHoveredIndex === idx
                    ? 'border-slate-700 bg-slate-800/80'
                    : 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/50'
                }`}
                onMouseEnter={() => setPieHoveredIndex(idx)}
                onMouseLeave={() => setPieHoveredIndex(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate max-w-[140px]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="font-semibold text-slate-200 truncate">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white font-mono">{formatNumber(source.visits)} v</span>
                    <span className="text-[10px] font-bold text-cyan-400 font-mono min-w-[28px] text-right">
                      {source.percentage}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, source.percentage)}%`,
                      backgroundColor: source.color
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Spend: <strong className="text-amber-400/90 font-mono font-medium">{formatCredits(source.creditsSpent)} CR</strong></span>
                  <span className="text-emerald-400/90 font-mono font-medium">≈ {formatInr(source.creditsSpent * 1.5)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
