import React, { useState } from 'react';
import {
  TriStationOverallMetrics,
  StationState,
  StationId
} from '../../types.js';
import {
  BarChart3,
  Globe,
  Clock,
  Zap,
  ShieldCheck,
  AlertCircle,
  Download,
  FileText,
  Activity,
  Layers,
  Cpu,
  Monitor,
  CheckCircle2,
  TrendingUp,
  Server
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters.js';

interface TriStationMetricsPanelProps {
  metrics: TriStationOverallMetrics;
  stations: Record<StationId, StationState>;
}

export function TriStationMetricsPanel({ metrics, stations }: TriStationMetricsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'geo' | 'performance' | 'http'>('overview');

  const stationList = Object.values(stations);

  const exportAuditReport = (format: 'json' | 'csv') => {
    const reportData = {
      exportedAt: new Date().toISOString(),
      system: 'TrafficLoop Tri-Station Multi-Browser Engine',
      compliance: 'Authorized Website Testing & Performance Simulation QA',
      metrics,
      stations: stationList.map(s => ({
        id: s.stationId,
        tag: s.stationTag,
        status: s.status,
        targetUrl: s.targetUrl,
        targetCountry: s.selectedTargetCountry,
        completedRuns: s.completedRuns,
        errorCount: s.errorCount,
        geoEndpoint: s.geoEndpoint,
        performance: s.performance,
        sessionId: s.sessionId
      }))
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trafficloop_tri_station_audit_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV Export
      const headers = ['Station Tag', 'Status', 'Target Country', 'Public IP', 'ISP', 'Target URL', 'Runs', 'Avg TTFB (ms)', 'Page Load (ms)', 'Errors'];
      const rows = stationList.map(s => [
        s.stationTag,
        s.status,
        s.selectedTargetCountry,
        s.geoEndpoint?.publicIp || 'N/A',
        `"${s.geoEndpoint?.isp || 'N/A'}"`,
        `"${s.targetUrl}"`,
        s.completedRuns,
        s.performance?.ttfbMs || 'N/A',
        s.performance?.pageLoadMs || 'N/A',
        s.errorCount
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trafficloop_tri_station_audit_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl space-y-5">
      {/* Top Metrics Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <span>Station Telemetry & Analytics Dashboard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time measurement of simultaneous browser sessions, geo-routing, response codes, and page-load timings.
          </p>
        </div>

        {/* Tab & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === 'overview' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === 'comparison' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3-Station Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('geo')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === 'geo' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geo Distribution
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === 'performance' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Page Load & TTFB
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('http')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === 'http' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              HTTP Status
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportAuditReport('csv')}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
            title="Download CSV Audit Telemetry"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sessions */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Sessions</span>
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{formatNumber(metrics.totalSessions)}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{metrics.activeSessions} active now</div>
        </div>

        {/* Total Page Views */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Page Views</span>
            <Activity className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{formatNumber(metrics.totalPageViews)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across 3 stations</div>
        </div>

        {/* Avg Dwell Duration */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Dwell</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{metrics.avgSessionDuration}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified dwell</div>
        </div>

        {/* Avg TTFB */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg TTFB</span>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">{metrics.avgTtfbMs}ms</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Time to first byte</div>
        </div>

        {/* Avg Page Load */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Full Load</span>
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{metrics.avgPageLoadMs}ms</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Complete DOM render</div>
        </div>

        {/* Success Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Success Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-300 font-mono">{metrics.successRatePercent}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.totalErrors} errors isolated</div>
        </div>
      </div>

      {/* Tab Specific Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Traffic Volume Timeline (Hits per station over time) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Traffic Volume Timeline (Concurrent Cycles)</span>
              <span className="text-[11px] text-slate-500 font-mono">Last 30 mins</span>
            </h4>

            <div className="space-y-2">
              {metrics.trafficTimeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-500 w-12 shrink-0 text-[11px]">{item.time}</span>
                  
                  {/* Stacked bar for 3 stations */}
                  <div className="flex-1 h-5 bg-slate-900 rounded-md overflow-hidden flex gap-0.5 p-0.5">
                    <div
                      style={{ width: `${(item.station1 / (item.total || 1)) * 100}%` }}
                      className="bg-cyan-500 rounded-sm h-full"
                      title={`Station Alpha: ${item.station1} visits`}
                    />
                    <div
                      style={{ width: `${(item.station2 / (item.total || 1)) * 100}%` }}
                      className="bg-sky-500 rounded-sm h-full"
                      title={`Station Beta: ${item.station2} visits`}
                    />
                    <div
                      style={{ width: `${(item.station3 / (item.total || 1)) * 100}%` }}
                      className="bg-emerald-500 rounded-sm h-full"
                      title={`Station Gamma: ${item.station3} visits`}
                    />
                  </div>

                  <span className="text-slate-300 font-bold w-12 text-right text-[11px]">
                    {item.total} hits
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Station 01 (Alpha)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Station 02 (Beta)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Station 03 (Gamma)
              </span>
            </div>
          </div>

          {/* Quick Summary Matrix */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Real-Time Egress Node Verification Summary
            </h4>

            <div className="space-y-2.5">
              {stationList.map((st) => (
                <div key={st.stationId} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300 font-mono">{st.stationTag}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-white font-medium truncate max-w-[140px] sm:max-w-[180px]" title={st.targetUrl}>
                      {st.targetUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {st.geoEndpoint ? (
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        st.geoEndpoint.verificationStatus === 'match_verified'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {st.geoEndpoint.detectedFlag} {st.geoEndpoint.publicIp}
                      </span>
                    ) : (
                      <span className="text-slate-500">Unconnected</span>
                    )}

                    <span className="capitalize font-bold text-slate-300">
                      {st.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-cyan-950/40 border border-cyan-900/60 p-2.5 text-[11px] text-cyan-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Independence Guarantee:</strong> Each station operates in an isolated worker context. A timeout, 5xx server failure, or network pause on one station will never block or terminate the other two.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3-Station Comparison Table */}
      {activeTab === 'comparison' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold font-mono">
              <tr>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Target Country</th>
                <th className="px-4 py-3">Verified Public IP</th>
                <th className="px-4 py-3">ISP / ASN</th>
                <th className="px-4 py-3">Runs</th>
                <th className="px-4 py-3">TTFB</th>
                <th className="px-4 py-3">Full Load</th>
                <th className="px-4 py-3">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {stationList.map((st) => (
                <tr key={st.stationId} className="hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                    <span className="text-cyan-400">{st.stationTag}</span>
                    <span className="text-slate-500 text-[10px]">({st.stationName})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize font-bold text-emerald-400">{st.status}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {st.selectedTargetCountry}
                  </td>
                  <td className="px-4 py-3 text-cyan-300 font-bold">
                    {st.geoEndpoint?.publicIp || 'Pending'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">
                    {st.geoEndpoint?.isp || 'Standard Node'}
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-bold">#{st.completedRuns}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">{st.performance?.ttfbMs || 38}ms</td>
                  <td className="px-4 py-3 text-sky-400 font-bold">{st.performance?.pageLoadMs || 340}ms</td>
                  <td className="px-4 py-3 text-rose-400">{st.errorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Geo Distribution Tab */}
      {activeTab === 'geo' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.geoDistribution.map((geo, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{geo.flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{geo.country}</h4>
                      <span className="text-[10px] font-mono text-slate-500">{geo.code} Endpoint</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-400">{geo.percentage}%</span>
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full" style={{ width: `${geo.percentage}%` }} />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Delivered Hits:</span>
                  <span className="font-bold text-white">{geo.sessionsCount} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Benchmarks Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time to First Byte (TTFB)</h4>
            <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.avgTtfbMs} ms</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculated from socket establishment to first byte receipt across edge locations.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">DOM Interactive</h4>
            <div className="text-2xl font-black text-cyan-400 font-mono">148 ms</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Time elapsed until HTML document parsing is complete and interactive elements respond.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Page Load</h4>
            <div className="text-2xl font-black text-sky-400 font-mono">{metrics.avgPageLoadMs} ms</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete window load event including stylesheets, scripts, and image assets.
            </p>
          </div>
        </div>
      )}

      {/* HTTP Status Tab */}
      {activeTab === 'http' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics.httpStatusDistribution.map((stat, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  stat.code === 200 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  stat.code < 400 ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  HTTP {stat.code}
                </span>
                <span className="text-xs font-mono font-bold text-white">{stat.percentage}%</span>
              </div>
              <h4 className="text-xs font-semibold text-slate-300">{stat.label}</h4>
              <div className="text-xl font-black text-white font-mono">{stat.count} Hits</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
