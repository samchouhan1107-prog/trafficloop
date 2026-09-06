import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie
} from 'recharts';
import {
  Globe,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  MapPin,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { GeoTrafficDistributionData, GeoCountryTraffic } from '../../types.js';
import { formatNumber, formatCredits } from '../../utils/formatters.js';

interface GeoTrafficHeatMapVisualizationProps {
  data: GeoTrafficDistributionData | null;
  isLoading?: boolean;
}

export function GeoTrafficHeatMapVisualization({ data, isLoading }: GeoTrafficHeatMapVisualizationProps) {
  const [viewMode, setViewMode] = useState<'heatMatrix' | 'coordinateMap' | 'regionalDonut'>('heatMatrix');
  const [filterTargetedOnly, setFilterTargetedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'visits' | 'heatScore' | 'matchRate' | 'dwell'>('visits');
  const [selectedCountry, setSelectedCountry] = useState<GeoCountryTraffic | null>(null);

  const filteredCountries = useMemo(() => {
    if (!data) return [];
    let list = [...data.countries];

    if (filterTargetedOnly) {
      list = list.filter(c => c.isTargeted || c.visits > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        c =>
          c.country.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'visits') return b.visits - a.visits;
      if (sortBy === 'heatScore') return b.heatScore - a.heatScore;
      if (sortBy === 'matchRate') return b.matchRate - a.matchRate;
      if (sortBy === 'dwell') return b.avgDwellSeconds - a.avgDwellSeconds;
      return 0;
    });

    return list;
  }, [data, filterTargetedOnly, searchQuery, sortBy]);

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-56 rounded bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-72 rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-80 w-full rounded-xl bg-slate-800/30 animate-pulse" />
      </div>
    );
  }

  const { summary, regions, campaignTargets } = data;

  // Custom Tooltip for Recharts Heat Matrix Bar Chart
  const CustomHeatMatrixTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as GeoCountryTraffic;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.flag}</span>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{item.country}</div>
                <div className="text-[10px] text-slate-400 font-mono">{item.countryCode} • {item.region}</div>
              </div>
            </div>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: `${item.heatColor}20`, color: item.heatColor }}
            >
              Heat {item.heatScore}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Delivered Visits:</span>
              <span className="font-mono font-bold text-white">{formatNumber(item.visits)} ({item.percentage}%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Target Status:</span>
              <span className={`font-semibold ${item.isTargeted ? 'text-emerald-400' : 'text-slate-400'}`}>
                {item.isTargeted ? 'Targeted Intent ✓' : 'Global Pool'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Target Compliance:</span>
              <span className="font-mono font-bold text-cyan-400">{item.matchRate}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Avg Dwell Time:</span>
              <span className="font-mono text-amber-300">{item.avgDwellSeconds}s</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
              <span>Credits Allocated:</span>
              <span className="font-mono text-emerald-400 font-bold">{formatCredits(item.creditsSpent)} CR</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Coordinate Scatter Chart
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as GeoCountryTraffic;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md min-w-[200px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="text-xl">{item.flag}</span>
            <div>
              <div className="text-xs font-bold text-white">{item.country}</div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {item.lat > 0 ? `${item.lat}°N` : `${Math.abs(item.lat)}°S`}, {item.lon > 0 ? `${item.lon}°E` : `${Math.abs(item.lon)}°W`}
              </div>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Traffic Volume:</span>
              <span className="font-mono font-bold text-white">{item.visits} visits</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Heat Density:</span>
              <span className="font-mono font-bold" style={{ color: item.heatColor }}>{item.heatScore}/100</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Target Match:</span>
              <span className="font-mono font-bold text-emerald-400">{item.matchRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="geographic-traffic-heat-map-panel"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 backdrop-blur-md shadow-xl space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Geographic Traffic Distribution & Heat Map</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> {summary.overallMatchRate}% Target Match
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recharts-powered global traffic visualization to verify if visits originate strictly from your intended campaign locations.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('heatMatrix')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'heatMatrix'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Heat Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('coordinateMap')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'coordinateMap'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Coordinate Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('regionalDonut')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'regionalDonut'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            <span>Regional Shares</span>
          </button>
        </div>
      </div>

      {/* Target Intent Verification Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Target Match</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{summary.overallMatchRate}%</span>
            <span className="text-[11px] text-slate-400">compliance</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {summary.intendedTargetVisits} of {summary.totalDeliveredVisits} visits from intended geo-zones
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Origin Node</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl">{summary.topCountryFlag}</span>
            <div>
              <div className="text-base font-black text-white leading-tight">{summary.topCountry}</div>
              <div className="text-[11px] text-cyan-400 font-mono">{summary.topCountryVisits} visits ({summary.topCountryPercentage}%)</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Heat Density Index</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{summary.heatIndex} Heat</span>
            <span className="text-[11px] text-slate-400">intensity</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1.5 flex-1 rounded-full bg-cyan-500" title="Cool" />
            <div className="h-1.5 flex-1 rounded-full bg-emerald-500" title="Moderate" />
            <div className="h-1.5 flex-1 rounded-full bg-amber-500" title="High" />
            <div className="h-1.5 flex-1 rounded-full bg-rose-500" title="Extreme" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Geo Campaigns</span>
            <MapPin className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{summary.activeGeoCampaignsCount}</span>
            <span className="text-[11px] text-slate-400">restricted</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Routing status: <span className="font-semibold text-emerald-300">{summary.routingIntegrity}</span>
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar: Filter, Search, Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search country, code or region..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFilterTargetedOnly(!filterTargetedOnly)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              filterTargetedOnly
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>{filterTargetedOnly ? 'Active / Targeted Only' : 'Show All Countries'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="visits">Traffic Volume</option>
              <option value="heatScore">Heat Intensity</option>
              <option value="matchRate">Match Compliance</option>
              <option value="dwell">Dwell Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN RECHARTS VISUALIZATION CONTAINER */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 md:p-5">
        {viewMode === 'heatMatrix' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Global Traffic Heat Density & Target Intent Alignment
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Extreme Heat (75-100%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> High (50-74%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Moderate (25-49%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" /> Cool (1-24%)
                </span>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredCountries}
                  margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="country"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={({ x, y, payload }) => {
                      const countryObj = filteredCountries.find(c => c.country === payload.value);
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={12}
                            textAnchor="end"
                            fill={countryObj?.isTargeted ? '#38bdf8' : '#94a3b8'}
                            fontSize={10}
                            fontWeight={countryObj?.isTargeted ? 'bold' : 'normal'}
                            transform="rotate(-25)"
                          >
                            {countryObj?.flag} {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}`}
                  />
                  <Tooltip content={<CustomHeatMatrixTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                    formatter={value => (
                      <span className="text-slate-300 font-medium">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="visits"
                    name="Delivered Visits (Heat Intensity)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1000}
                  >
                    {filteredCountries.map((entry, index) => (
                      <Cell
                        key={`cell-heat-${index}`}
                        fill={entry.heatColor}
                        cursor="pointer"
                        onClick={() => setSelectedCountry(entry)}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="intendedVisits"
                    name="Target Goal Volume"
                    fill="#334155"
                    stroke="#64748b"
                    strokeDasharray="2 2"
                    radius={[4, 4, 0, 0]}
                    opacity={0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'coordinateMap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Global Latitude & Longitude Coordinate Radar Plot
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Bubble size = Traffic Volume • Color = Heat Level
              </div>
            </div>

            <div className="relative h-[320px] w-full bg-slate-950/80 rounded-xl border border-slate-800 p-2">
              {/* Radar Grid Annotations */}
              <div className="absolute inset-x-4 top-2 flex justify-between text-[9px] text-slate-600 font-mono pointer-events-none">
                <span>WEST (Americas)</span>
                <span>PRIME MERIDIAN (EMEA)</span>
                <span>EAST (Asia-Pac)</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    dataKey="lon"
                    name="Longitude"
                    domain={[-180, 180]}
                    unit="°"
                    stroke="#64748b"
                    fontSize={10}
                    tickCount={7}
                  />
                  <YAxis
                    type="number"
                    dataKey="lat"
                    name="Latitude"
                    domain={[-60, 75]}
                    unit="°"
                    stroke="#64748b"
                    fontSize={10}
                    tickCount={5}
                  />
                  <ZAxis
                    type="number"
                    dataKey="visits"
                    range={[80, 600]}
                    name="Visits"
                  />
                  <Tooltip content={<CustomScatterTooltip />} />
                  <Scatter
                    name="Countries"
                    data={filteredCountries}
                    animationDuration={1000}
                  >
                    {filteredCountries.map((entry, index) => (
                      <Cell
                        key={`cell-scatter-${index}`}
                        fill={entry.heatColor}
                        stroke={entry.isTargeted ? '#ffffff' : '#64748b'}
                        strokeWidth={entry.isTargeted ? 1.5 : 0.5}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'regionalDonut' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regions}
                    dataKey="visits"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {regions.map((entry, index) => (
                      <Cell key={`cell-region-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${formatNumber(value)} visits (${item.payload.percentage}%) • ${item.payload.matchRate}% match`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Regional Distribution Breakdown & Match Rates
              </h3>
              <div className="space-y-2.5">
                {regions.map((reg, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: reg.color }} />
                        <span className="font-semibold text-white">{reg.region}</span>
                      </div>
                      <span className="font-mono text-cyan-300 font-bold">{reg.visits} visits ({reg.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${reg.percentage}%`, backgroundColor: reg.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Target Match: <strong className="text-emerald-400">{reg.matchRate}%</strong></span>
                      <span>Intended Goal: {reg.intendedVisits} visits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Intended Target Campaign Audit & Geo Status List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Active Campaigns Geo-Targeting Verification Status
          </h3>
          <span className="text-[11px] text-slate-400">
            {campaignTargets.length} total monitored campaigns
          </span>
        </div>

        {campaignTargets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaignTargets.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-xs text-white truncate flex-1" title={c.title}>
                    {c.title}
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Config:</span>
                    <span className="font-semibold text-cyan-300">{c.targetLocations}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Delivered / Matched:</span>
                    <span className="font-mono text-white font-bold">{c.matchedVisits} / {c.totalVisits} visits</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Accuracy Rate:</span>
                    <span className="font-mono font-bold text-emerald-400">{c.matchRate}% Match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center text-xs text-slate-400">
            No active campaigns found. Launch a campaign with custom geo-restrictions to monitor real-time delivery match metrics!
          </div>
        )}
      </div>

      {/* Detailed Country Geo-Distribution Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            Country-by-Country Heat Density & Intended Location Matching
          </h3>
          <span className="text-[11px] text-slate-400">
            Showing {filteredCountries.length} countries
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Country & Region</th>
                <th className="px-4 py-3">Traffic Volume</th>
                <th className="px-4 py-3">Share</th>
                <th className="px-4 py-3">Heat Density</th>
                <th className="px-4 py-3">Intended Status</th>
                <th className="px-4 py-3">Match Rate</th>
                <th className="px-4 py-3">Avg Dwell</th>
                <th className="px-4 py-3 text-right">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCountries.map((c, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{c.flag}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {c.country}
                          <span className="font-mono text-[10px] text-slate-400">({c.countryCode})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{c.region}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {formatNumber(c.visits)}
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-300 font-semibold">
                    {c.percentage}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.heatScore}%`, backgroundColor: c.heatColor }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold" style={{ color: c.heatColor }}>
                        {c.heatScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.isTargeted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Intended Target
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        Global Pool
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {c.matchRate}%
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-300">
                    {c.avgDwellSeconds}s
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                    {formatCredits(c.creditsSpent)} CR
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
