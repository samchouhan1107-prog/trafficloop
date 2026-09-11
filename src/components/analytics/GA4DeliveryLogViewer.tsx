import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Globe,
  Clock,
  ShieldCheck,
  Filter,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  Check,
  Copy
} from 'lucide-react';
import { api } from '../../services/api.js';
import { GA4DeliveryLog, GA4TagScanResult, GA4TestPingResult, Campaign } from '../../types.js';

interface GA4DeliveryLogViewerProps {
  campaigns?: Campaign[];
}

export function GA4DeliveryLogViewer({ campaigns = [] }: GA4DeliveryLogViewerProps) {
  // Realtime Delivery Logs state
  const [logs, setLogs] = useState<GA4DeliveryLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live Test Beacon Dispatcher state
  const [testUrl, setTestUrl] = useState<string>('https://webzone1103.blogspot.com/');
  const [testMeasurementId, setTestMeasurementId] = useState<string>('');
  const [testCountry, setTestCountry] = useState<string>('IN');
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [pingResult, setPingResult] = useState<GA4TestPingResult | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  // Tag Scanner state
  const [scanUrl, setScanUrl] = useState<string>('https://webzone1103.blogspot.com/');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<GA4TagScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Prepopulate test measurement id from user campaigns if available
  useEffect(() => {
    const campaignWithGA4 = campaigns.find(c => c.ga4_measurement_id);
    if (campaignWithGA4) {
      if (!testMeasurementId && campaignWithGA4.ga4_measurement_id) {
        setTestMeasurementId(campaignWithGA4.ga4_measurement_id);
      }
      if (campaignWithGA4.url) {
        setTestUrl(campaignWithGA4.url);
        setScanUrl(campaignWithGA4.url);
      }
    }
  }, [campaigns]);

  // Fetch GA4 delivery logs
  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const campaignId = selectedCampaignFilter !== 'all' ? selectedCampaignFilter : undefined;
      const res = await api.getGA4DeliveryLogs(campaignId, 40);
      setLogs(res.logs || []);
    } catch {
      // Ignored
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCampaignFilter]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCampaignFilter]);

  // Handle Tag Scanner
  const handleScanWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl || !scanUrl.startsWith('http')) {
      setScanError('Please enter a valid URL starting with https://');
      return;
    }
    try {
      setIsScanning(true);
      setScanError(null);
      const res = await api.scanWebsiteForGA4Tags(scanUrl);
      setScanResult(res);
      if (res.detectedMeasurementId) {
        setTestMeasurementId(res.detectedMeasurementId);
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan target website.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Live Realtime Beacon Test
  const handleSendTestPing = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = testMeasurementId.trim().toUpperCase();
    if (!cleanId) {
      setPingError('Please specify a valid GA4 Measurement ID (e.g., G-XXXXXXXXXX)');
      return;
    }
    try {
      setIsSendingPing(true);
      setPingError(null);
      const res = await api.sendGA4TestPing({
        url: testUrl.trim(),
        measurementId: cleanId,
        countryCode: testCountry
      });
      setPingResult(res);
      // Refresh logs so new log entry appears
      setTimeout(() => fetchLogs(), 1000);
    } catch (err: any) {
      setPingError(err.message || 'Failed to send GA4 beacon.');
    } finally {
      setIsSendingPing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Key Guidance: Why are stats not immediately visible in GA4 standard reports? */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-amber-200">
                Understanding Google Analytics 4 (GA4) Reporting Latency
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                If you are looking at standard GA4 reports (like <em>Acquisition &gt; Traffic Acquisition</em> or <em>Engagement &gt; Pages and screens</em>), Google takes <strong>24 to 48 hours</strong> to aggregate and publish those data tables.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  To see your visitors right now:
                </span>
                <span className="text-slate-200">
                  Open <strong>analytics.google.com &gt; Reports &gt; Realtime &gt; Users in last 30 minutes</strong>.
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-2.5 text-xs font-bold transition-all shrink-0"
          >
            <span>Open Google Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Side-by-Side: Live Beacon Test & Tag Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Ping Dispatcher */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Live Realtime Beacon Test</h3>
                <p className="text-[11px] text-slate-400">
                  Fire an authoritative GA4 hit & watch it appear in your Realtime card
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendTestPing} className="space-y-3">
            {pingError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pingError}</span>
              </div>
            )}

            <div>
              <label htmlFor="test-measurement-id" className="block text-xs font-semibold text-slate-300 mb-1">
                GA4 Measurement ID (e.g. G-D74J4R43K3)
              </label>
              <input
                id="test-measurement-id"
                type="text"
                required
                value={testMeasurementId}
                onChange={(e) => setTestMeasurementId(e.target.value.toUpperCase().trim())}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Found in GA4: Admin ⚙️ &gt; Data Streams &gt; Web &gt; Measurement ID
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="test-url" className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination URL
                </label>
                <input
                  id="test-url"
                  type="url"
                  required
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://yourblog.blogspot.com/"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="test-country" className="block text-xs font-semibold text-slate-300 mb-1">
                  Visitor Geo Attribution
                </label>
                <select
                  id="test-country"
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="IN">🇮🇳 India (Strict Target)</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="SG">🇸🇬 Singapore</option>
                </select>
              </div>
            </div>

            <button
              id="send-realtime-beacon-btn"
              type="submit"
              disabled={isSendingPing || !testMeasurementId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 transition-all shadow-md shadow-emerald-950"
            >
              {isSendingPing ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Dispatching Beacon to Google...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Send Realtime Beacon Now</span>
                </>
              )}
            </button>
          </form>

          {/* Test Ping Result Card */}
          {pingResult && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Beacon Accepted by Google (HTTP {pingResult.httpStatus})
                </span>
                <span className="font-mono text-[11px] text-emerald-400/80">
                  {new Date(pingResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <div>Property: <strong className="text-white">{pingResult.measurementId}</strong></div>
                <div>Country: <strong className="text-white">{pingResult.countryCode || 'IN'}</strong> (UIP injected)</div>
                <div>URL: <span className="text-slate-400">{pingResult.url || pingResult.targetUrl}</span></div>
              </div>
              <div className="pt-1 flex items-center justify-between border-t border-emerald-500/20 text-[11px]">
                <span className="text-emerald-400 font-medium">Verify in your dashboard:</span>
                <a
                  href="https://analytics.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline inline-flex items-center gap-1"
                >
                  Realtime Report <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Website Tag Scanner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GA4 & GTM Tag Inspector</h3>
                <p className="text-[11px] text-slate-400">
                  Inspect your site's HTML to detect tags or check if scripts are blocked
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleScanWebsite} className="space-y-3">
            {scanError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            <div>
              <label htmlFor="scan-url" className="block text-xs font-semibold text-slate-300 mb-1">
                Website or Blog URL
              </label>
              <div className="flex gap-2">
                <input
                  id="scan-url"
                  type="url"
                  required
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="https://webzone1103.blogspot.com/"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
                <button
                  id="scan-website-tags-btn"
                  type="submit"
                  disabled={isScanning || !scanUrl}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 transition-all shadow-md shadow-cyan-950"
                >
                  {isScanning ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Scanner Output */}
          {scanResult ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-300">Detected Measurement ID:</span>
                {scanResult.detectedMeasurementId ? (
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {scanResult.detectedMeasurementId}
                  </span>
                ) : (
                  <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    Not in raw HTML
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Google Tag Manager (GTM):</span>
                  <span className={scanResult.hasGtmScript ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {scanResult.hasGtmScript ? `Found (${scanResult.detectedGtmId || 'GTM Active'})` : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Client-side SPA / Dynamic:</span>
                  <span className={scanResult.isSpaOrClientSide ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {scanResult.isSpaOrClientSide ? 'Yes (Delayed JS Render)' : 'Standard SSR'}
                  </span>
                </div>
              </div>

              {scanResult.recommendations.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommendations:</span>
                  {scanResult.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-[11px] text-cyan-300/90 leading-relaxed">
                      • {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
              Enter your blog or website URL above to verify if your GA4 gtag.js snippet is properly deployed.
            </div>
          )}
        </div>
      </div>

      {/* 3. Realtime GA4 Delivery Stream Log */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">GA4 Measurement Protocol Delivery Stream</h3>
              <p className="text-[11px] text-slate-400">
                Live verification log of every session start & page_view beacon transmitted to Google Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by campaign */}
            <select
              value={selectedCampaignFilter}
              onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No GA4 delivery logs recorded yet. Send a test beacon above or start a campaign with a configured Measurement ID to begin tracking!
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3">Measurement ID</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Client / Session ID</th>
                  <th className="py-2.5 px-3">Google HTTP Status</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap font-sans">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.event_name === 'click'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        <span>{log.event_name === 'click' ? '🖱️' : '👁️'}</span>
                        <span>{log.event_name || 'page_view'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-200" title={log.target_url}>
                      {log.target_url}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">
                      {log.measurement_id}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <span className="inline-flex items-center gap-1">
                        <span>{log.country_code === 'IN' ? '🇮🇳' : log.country_code === 'US' ? '🇺🇸' : '🌐'}</span>
                        <span className="font-semibold text-slate-300">{log.country_code}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {log.session_id ? `s_${log.session_id.substring(0, 8)}...` : 'standard'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.http_status === 204 || log.http_status === 200
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}>
                        HTTP {log.http_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      {(() => {
                        const statusVal = log.delivery_status || log.status || 'delivered';
                        const isOk = statusVal === 'delivered' || statusVal === 'dispatched' || statusVal === 'success';
                        const isPending = statusVal === 'pending';
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isOk
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}>
                            {statusVal}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
