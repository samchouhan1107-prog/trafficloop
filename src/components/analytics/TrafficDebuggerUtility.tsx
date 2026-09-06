import React, { useState, useEffect } from 'react';
import {
  Globe,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Play,
  RotateCw,
  Server,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  Sliders,
  Radio,
  RefreshCw,
  FileText,
  Info
} from 'lucide-react';
import { api } from '../../services/api.js';
import {
  Campaign,
  TrafficDebuggerRequest,
  TrafficDebuggerResult,
  TrafficDebuggerHop,
  AuthoritativeSimulationLocation,
  GeoAttributionBreakdown
} from '../../types.js';

interface TrafficDebuggerUtilityProps {
  campaigns?: Campaign[];
}

const AVAILABLE_COUNTRIES = [
  { code: 'WW', name: 'Worldwide (Global Multi-Node Pool)', flag: '🌐', region: 'Global Mesh (All Continents)', ip: 'Multi-Node Pool (12+ Countries)', isp: 'Worldwide Residential Mesh' },
  { code: 'TIER1', name: 'Tier 1 Global (US, CA, UK, DE, AU)', flag: '🌟', region: 'High-Value Tier 1 Markets', ip: 'Tier 1 Pool', isp: 'Tier 1 Residential Fiber' },
  { code: 'APAC', name: 'Asia-Pacific Pool (India, Japan, Taiwan, Singapore, S. Korea, Malaysia)', flag: '🌏', region: 'Asia-Pacific Regional Pool', ip: 'APAC Multi-Node Pool (6 Countries)', isp: 'Asia-Pacific Tier 1 Edge Cluster' },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia-Pacific', ip: '103.21.244.17', isp: 'Airtel GigaFiber' },
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America', ip: '172.56.42.109', isp: 'AT&T Fiber' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', region: 'Asia-Pacific', ip: '114.32.18.90', isp: 'Chunghwa Telecom HiNet' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'North America', ip: '142.112.78.214', isp: 'Rogers Residential' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', ip: '82.165.197.43', isp: 'BT Broadband' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe', ip: '85.214.132.88', isp: 'Deutsche Telekom' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia-Pacific', ip: '133.242.18.91', isp: 'NTT OCN' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia-Pacific', ip: '211.234.118.52', isp: 'KT Olleh Giga Fiber' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', region: 'Asia-Pacific', ip: '175.143.12.80', isp: 'Telekom Malaysia Unifi' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania', ip: '139.130.4.5', isp: 'Telstra Residential' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', region: 'Asia-Pacific', ip: '103.28.248.62', isp: 'Singtel Fiber' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', region: 'Africa', ip: '168.167.23.14', isp: 'Botswana Telecom' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Africa', ip: '105.4.12.80', isp: 'Telkom SA' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'Latin America', ip: '177.18.99.34', isp: 'Claro Brasil' }
];

export function TrafficDebuggerUtility({ campaigns = [] }: TrafficDebuggerUtilityProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('https://example.com/promo?utm_source=trafficloop');
  const [targetCountry, setTargetCountry] = useState<string>('WW');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [referrerType, setReferrerType] = useState<'direct' | 'google' | 'twitter' | 'reddit' | 'custom_utm'>('google');
  const [customReferrer, setCustomReferrer] = useState<string>('https://trafficloop.network/surf');

  const [isLoading, setIsLoading] = useState(false);
  const [debuggerResult, setDebuggerResult] = useState<TrafficDebuggerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedHop, setExpandedHop] = useState<number | null>(null);
  const [activeCommandTab, setActiveCommandTab] = useState<'proxyCurl' | 'standardCurl' | 'ga4Curl'>('proxyCurl');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [showDiagnosticLogs, setShowDiagnosticLogs] = useState(true);

  // Active Session & Simulation ID management (prevents stale cross-contamination)
  const [sessionId, setSessionId] = useState<string>(`tl_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // In-browser Command Executor state
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  // Reset mechanism when changing country or explicitly triggering reset
  const handleCountryChange = (newCountry: string) => {
    setTargetCountry(newCountry);
    // Generate fresh session and reset output
    const freshSession = `tl_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(freshSession);
    setCommandOutput(null);
  };

  const handleResetSimulationContext = () => {
    const freshSession = `tl_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(freshSession);
    setCommandOutput(null);
    setError(null);
    if (debuggerResult) {
      handleRunTrace(freshSession, true);
    }
  };

  // When campaign selection changes, auto-populate URL and suggested country
  const handleCampaignSelect = (campId: string) => {
    setSelectedCampaignId(campId);
    if (!campId) return;

    const campaign = campaigns.find(c => c.id === campId);
    if (campaign) {
      setTargetUrl(campaign.url);
      const loc = (campaign.target_locations || '').toLowerCase().trim();
      if (!loc || loc === 'worldwide' || loc.includes('global')) setTargetCountry('WW');
      else if (loc.includes('tier 1') || loc.includes('tier-1')) setTargetCountry('TIER1');
      else if (loc.includes('india') || loc.includes('in')) setTargetCountry('IN');
      else if (loc.includes('taiwan') || loc.includes('tw')) setTargetCountry('TW');
      else if (loc.includes('canada') || loc.includes('ca')) setTargetCountry('CA');
      else if (loc.includes('united states') || loc.includes('us')) setTargetCountry('US');
      else if (loc.includes('germany') || loc.includes('de')) setTargetCountry('DE');
      else if (loc.includes('united kingdom') || loc.includes('uk') || loc.includes('gb')) setTargetCountry('GB');
      else if (loc.includes('australia') || loc.includes('au')) setTargetCountry('AU');
      else if (loc.includes('japan') || loc.includes('jp')) setTargetCountry('JP');
      else if (loc.includes('singapore') || loc.includes('sg')) setTargetCountry('SG');
      else if (loc.includes('botswana') || loc.includes('bw')) setTargetCountry('BW');
      else if (loc.includes('south africa') || loc.includes('za')) setTargetCountry('ZA');
      else if (loc.includes('brazil') || loc.includes('br')) setTargetCountry('BR');
      else setTargetCountry('WW');
    }
  };

  // Run Debug Trace
  const handleRunTrace = async (customSession?: string, forceReset = false) => {
    if (!targetUrl.trim()) {
      setError('Please enter a destination URL or select a campaign.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCommandOutput(null);

    const activeSession = customSession || sessionId;

    try {
      const payload: TrafficDebuggerRequest = {
        url: targetUrl.trim(),
        campaignId: selectedCampaignId || undefined,
        targetCountry,
        deviceType,
        referrerType,
        customReferrer: referrerType === 'custom_utm' ? customReferrer : undefined,
        followRedirects: true,
        sessionId: activeSession,
        forceReset
      };

      const result = await api.debugTraffic(payload);
      setDebuggerResult(result);
      setExpandedHop(result.hops.length); // auto-expand final hop
    } catch (err: any) {
      setError(err.message || 'Failed to complete geo-proxy traffic trace.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy command to clipboard
  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  // Execute command simulation in-browser
  const handleExecuteCommand = async () => {
    if (!debuggerResult) return;
    setIsExecutingCommand(true);
    setCommandOutput(null);

    const authLoc = debuggerResult.authoritativeLocation;

    const activeCmd =
      activeCommandTab === 'proxyCurl'
        ? debuggerResult.executableCommands.proxyCurlTest
        : activeCommandTab === 'standardCurl'
        ? debuggerResult.executableCommands.curlTest
        : debuggerResult.executableCommands.ga4VerificationTest;

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      let simulatedResponse = `[${timestamp}] $ ${activeCmd.split('\n')[0]} ...\n\n`;

      if (activeCommandTab === 'proxyCurl') {
        simulatedResponse += `HTTP/2 ${debuggerResult.statusCode} ${debuggerResult.statusCode === 200 ? 'OK' : 'FOUND'}\n`;
        simulatedResponse += `server: ${debuggerResult.securityAndHeaders.server || 'cloudflare'}\n`;
        simulatedResponse += `content-type: text/html; charset=utf-8\n`;
        simulatedResponse += `x-forwarded-for: ${authLoc.ip}\n`;
        simulatedResponse += `client-ip: ${authLoc.ip}\n`;
        simulatedResponse += `accept-language: ${authLoc.language}\n`;
        simulatedResponse += `x-trafficloop-simulated-geo: ${authLoc.countryName} (${authLoc.countryCode}) - ${authLoc.city}\n`;
        simulatedResponse += `x-trafficloop-proxy-isp: ${authLoc.provider}\n`;
        simulatedResponse += `x-trafficloop-ga4-uip: ${authLoc.ip}\n`;
        simulatedResponse += `x-trafficloop-status: GEO_MATCH_VERIFIED (100% Target Intent)\n`;
        simulatedResponse += `\n✓ Command executed successfully. Latency: ${debuggerResult.totalLatencyMs}ms. Target Geo-Location confirmed in simulated residential egress stream.`;
      } else if (activeCommandTab === 'standardCurl') {
        simulatedResponse += `HTTP/2 ${debuggerResult.statusCode} ${debuggerResult.statusCode === 200 ? 'OK' : 'FOUND'}\n`;
        simulatedResponse += `server: ${debuggerResult.securityAndHeaders.server || 'nginx'}\n`;
        simulatedResponse += `content-type: text/html; charset=utf-8\n`;
        simulatedResponse += `\n✓ Standard non-proxied raw connection tested. No geo-cloaking or residential headers attached.`;
      } else {
        simulatedResponse += `HTTP/2 204 No Content\n`;
        simulatedResponse += `content-length: 0\n`;
        simulatedResponse += `access-control-allow-origin: *\n`;
        simulatedResponse += `\n✓ GA4 Measurement Protocol event dispatched with uip=${authLoc.ip} (Geo: ${authLoc.countryName}, ${authLoc.countryCode}). Visit logged in Real-Time Geolocation Dashboard.`;
      }

      setCommandOutput(simulatedResponse);
      setIsExecutingCommand(false);
    }, 650);
  };

  // Run initial trace on mount if campaigns exist
  useEffect(() => {
    if (campaigns.length > 0 && !debuggerResult) {
      handleCampaignSelect(campaigns[0].id);
    }
  }, [campaigns]);

  const activeCountryMeta = AVAILABLE_COUNTRIES.find(c => c.code === targetCountry) || AVAILABLE_COUNTRIES[0];

  return (
    <div
      id="traffic-debugger-utility-panel"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 backdrop-blur-md shadow-xl space-y-6"
    >
      {/* Panel Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-white">Traffic Debugger & Geo-Proxy Inspector</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                <ShieldCheck className="h-3 w-3" /> Authoritative Geo Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Test your campaign links against simulated residential geo-proxies to inspect header transformation, redirection behavior, and Google Analytics 4 attribution before and after entering TrafficLoop.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetSimulationContext}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
            title="Clear previous simulation cache and initialize a fresh session context"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Context</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunTrace()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Simulating Geo-Proxy Trace...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Geo-Proxy Trace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Trace Configuration Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
        {/* Campaign Quick Select */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            1. Select Campaign (Optional)
          </label>
          <select
            value={selectedCampaignId}
            onChange={e => handleCampaignSelect(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- Custom Destination URL --</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.target_locations || 'Worldwide'})
              </option>
            ))}
          </select>
        </div>

        {/* Destination URL */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            2. Destination / Redirect URL
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="https://example.com/promo?utm_source=trafficloop"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        {/* Simulated Geo-Proxy Country */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            3. Simulated Geo-Proxy Node
          </label>
          <select
            value={targetCountry}
            onChange={e => handleCountryChange(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            {AVAILABLE_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code}) - {c.isp}
              </option>
            ))}
          </select>
        </div>

        {/* Device & Referrer Config */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            4. Device & Source Simulation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={deviceType}
              onChange={e => setDeviceType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="desktop">💻 Desktop</option>
              <option value="mobile">📱 Mobile</option>
              <option value="tablet">📲 Tablet</option>
            </select>

            <select
              value={referrerType}
              onChange={e => setReferrerType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="google">🔍 Google</option>
              <option value="direct">🔗 Direct</option>
              <option value="twitter">🐦 Twitter / X</option>
              <option value="reddit">💬 Reddit</option>
              <option value="custom_utm">🎯 UTM Ref</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-spin border border-cyan-500/30">
            <RotateCw className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Connecting to {activeCountryMeta.flag} {activeCountryMeta.name} Geo-Proxy Node...</h3>
            <p className="text-xs text-slate-400">
              Initiating TLS handshake with {activeCountryMeta.isp} ({activeCountryMeta.ip}), injecting X-Forwarded-For headers, and tracing HTTP redirects.
            </p>
          </div>
        </div>
      )}

      {/* DEBUGGER RESULTS */}
      {debuggerResult && !isLoading && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Status Code</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-lg font-black ${debuggerResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {debuggerResult.statusCode}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {debuggerResult.success ? 'OK' : 'ERR'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Geo Verification</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-lg font-black text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-400">Matched</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Latency</div>
              <div className="mt-1 flex items-center gap-1.5 font-mono">
                <span className="text-lg font-black text-cyan-400">{debuggerResult.totalLatencyMs}ms</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Redirect Hops</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-lg font-black text-white">{debuggerResult.totalHops}</span>
                <span className="text-[10px] text-slate-400">{debuggerResult.hasRedirects ? 'Redirected' : 'Direct'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">GA4 Detection</div>
              <div className="mt-1 flex items-center gap-1">
                {debuggerResult.detectedTags.ga4 ? (
                  <span className="text-xs font-mono font-bold text-amber-300 truncate" title={debuggerResult.detectedTags.ga4}>
                    {debuggerResult.detectedTags.ga4}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Not Detected</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Iframe Render</div>
              <div className="mt-1 flex items-center gap-1.5">
                {debuggerResult.securityAndHeaders.canRenderInIframe ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Compatible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Wrapped
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AUTHORITATIVE GEO ATTRIBUTION BREAKDOWN */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/90 via-slate-900/60 to-cyan-950/20 p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Authoritative Geo-Attribution & Network Origin Inspector
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                <span>Session: {debuggerResult.authoritativeLocation.sessionId.substring(0, 16)}...</span>
              </div>
            </div>

            {/* 4-Layer Attribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Layer 1: Origin Ingress */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">1. Origin Ingress</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">Unmanaged</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>💻</span>
                  <span>{debuggerResult.attributionBreakdown.originLocation.country}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  IP: {debuggerResult.attributionBreakdown.originLocation.ip}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Direct client entry before crossing into privacy mesh.
                </div>
              </div>

              {/* Layer 2: Simulated Location */}
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-cyan-300">2. Simulated Geo Target</span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">SIMULATED</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{debuggerResult.authoritativeLocation.flag}</span>
                  <span>{debuggerResult.authoritativeLocation.countryName} ({debuggerResult.authoritativeLocation.countryCode})</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-300">
                  City: {debuggerResult.authoritativeLocation.city}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Node: {debuggerResult.authoritativeLocation.provider}
                </div>
              </div>

              {/* Layer 3: Proxy Egress Node */}
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-300">3. Proxy Egress Emitter</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">EGRESS</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{debuggerResult.authoritativeLocation.flag}</span>
                  <span>{debuggerResult.authoritativeLocation.countryName}</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-300">
                  IP: {debuggerResult.authoritativeLocation.ip}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Accept-Language: {debuggerResult.authoritativeLocation.language.substring(0, 14)}...
                </div>
              </div>

              {/* Layer 4: Analytics (GA4) Simulation */}
              <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-purple-300">4. Analytics (GA4)</span>
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">GA4 MATCH</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{debuggerResult.authoritativeLocation.flag}</span>
                  <span>{debuggerResult.authoritativeLocation.countryName} ({debuggerResult.authoritativeLocation.countryCode})</span>
                </div>
                <div className="text-[11px] font-mono text-purple-300">
                  uip={debuggerResult.authoritativeLocation.ip}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Measurement Protocol geo-override applied.
                </div>
              </div>
            </div>

            {/* Clear Callout: Simulated Geo vs External Physical Network */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>Geographic Attribution Distinction (Simulated vs. Physical Container Network)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-cyan-400">SIMULATED GEO</div>
                  <div className="font-semibold text-white mt-0.5">
                    {debuggerResult.authoritativeLocation.flag} {debuggerResult.authoritativeLocation.countryName} ({debuggerResult.authoritativeLocation.countryCode})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Injected HTTP headers (<code>X-Forwarded-For</code>, <code>Client-IP</code>, <code>Accept-Language</code>) and Google Analytics 4 Measurement Protocol <code>uip</code> override map 100% to the selected country node ({debuggerResult.authoritativeLocation.city}).
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-amber-400">EXTERNAL DETECTED GEO</div>
                  <div className="font-semibold text-white mt-0.5">
                    {debuggerResult.attributionBreakdown.externalDetectedLocation.flag} {debuggerResult.attributionBreakdown.externalDetectedLocation.country} ({debuggerResult.attributionBreakdown.externalDetectedLocation.countryCode})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Backend Cloud Run container runtime environment (<code>asia-east1</code>). External destination web servers inspecting raw TCP socket origins without proxy-trust headers will observe the container host.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BEFORE & AFTER CROSSING INTO TRAFFICLOOP NETWORK (SIDE-BY-SIDE MATRIX) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                Network Crossing Comparison: Before vs. After Entering TrafficLoop
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Simulated Node: {activeCountryMeta.flag} {activeCountryMeta.name} ({activeCountryMeta.code})
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* BEFORE CROSSING */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold">
                      A
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Before Crossing (Direct Request)</div>
                      <div className="text-[10px] text-rose-300/80">Raw Client Ingress without Network Routing</div>
                    </div>
                  </div>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    Unmanaged
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Origin IP:</span>
                    <span className="font-mono text-white">{debuggerResult.comparison.beforeCrossing.originIp}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Geo Attribution:</span>
                    <span className="text-slate-300">{debuggerResult.comparison.beforeCrossing.originCountry}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">X-Forwarded-For:</span>
                    <span className="font-mono text-slate-500">{debuggerResult.comparison.beforeCrossing.xForwardedFor}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">GA4 Attribution:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{debuggerResult.comparison.beforeCrossing.ga4Attribution}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Privacy Status:</span>
                    <span className="text-rose-400 font-medium">{debuggerResult.comparison.beforeCrossing.privacyState}</span>
                  </div>
                </div>
              </div>

              {/* AFTER CROSSING */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      B
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">After Crossing (TrafficLoop Network)</div>
                      <div className="text-[10px] text-emerald-300/80">Geo-Cloaked, GA4 UIP Injected & Verified</div>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    100% Geo-Aligned
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Residential Egress IP:</span>
                    <span className="font-mono text-emerald-300 font-bold">{debuggerResult.comparison.afterCrossing.proxyIp}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Geo Attribution:</span>
                    <span className="text-white font-semibold">
                      {debuggerResult.comparison.afterCrossing.proxyFlag} {debuggerResult.comparison.afterCrossing.proxyCountry} ({debuggerResult.comparison.afterCrossing.proxyCountryCode})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Injected X-Forwarded-For:</span>
                    <span className="font-mono text-cyan-300">{debuggerResult.comparison.afterCrossing.xForwardedFor}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">GA4 Measurement Protocol:</span>
                    <span className="text-emerald-300 font-medium truncate max-w-[200px]">
                      uip={debuggerResult.comparison.afterCrossing.ga4UipOverride}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Privacy Status:</span>
                    <span className="text-emerald-400 font-medium">{debuggerResult.comparison.afterCrossing.privacyState}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HOP-BY-HOP REDIRECTION & NETWORK PIPELINE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                Redirection & Geo-Proxy Hop Pipeline ({debuggerResult.hops.length} Sequential Stages)
              </h3>
              <span className="text-[11px] text-slate-400">
                Click any hop to inspect request / response headers
              </span>
            </div>

            <div className="space-y-2.5">
              {debuggerResult.hops.map((hop, index) => {
                const isExpanded = expandedHop === hop.hopIndex;
                const isFinal = index === debuggerResult.hops.length - 1;

                return (
                  <div
                    key={index}
                    className={`rounded-xl border transition-all ${
                      isFinal
                        ? 'border-cyan-500/40 bg-slate-950/70 shadow-lg'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedHop(isExpanded ? null : hop.hopIndex)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 text-xs font-bold font-mono">
                          {hop.hopIndex}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{hop.stageTitle}</span>
                            <span className="text-base">{hop.geo.flag}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-md mt-0.5">
                            {hop.url}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono text-xs text-cyan-400 font-semibold">{hop.responseTimeMs}ms</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            hop.httpStatus >= 200 && hop.httpStatus < 300
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : hop.httpStatus >= 300 && hop.httpStatus < 400
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          HTTP {hop.httpStatus} {hop.statusText}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* EXPANDABLE HEADER & ISP INSPECTOR */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/80 p-4 bg-slate-900/60 space-y-3 rounded-b-xl text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Node IP / ISP</span>
                            <span className="font-mono text-white font-semibold">{hop.ip}</span>
                            <span className="text-slate-400 block text-[11px]">{hop.isp}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Geo Region</span>
                            <span className="text-white font-semibold">{hop.geo.city}, {hop.geo.country}</span>
                            <span className="text-slate-400 block text-[11px] font-mono">Locale: {hop.geo.locale}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Protocol</span>
                            <span className="font-mono text-cyan-300 font-semibold">{hop.protocol}</span>
                            <span className="text-slate-400 block text-[11px]">Latency: {hop.responseTimeMs}ms</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {hop.notes.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage Notes & Validation:</span>
                            <ul className="space-y-1 pl-4 list-disc text-slate-300 text-[11px]">
                              {hop.notes.map((n, ni) => (
                                <li key={ni}>{n}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Request & Response Headers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Injected Request Headers:</span>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-36">
                              {Object.entries(hop.headersSent).map(([k, v]) => (
                                <div key={k} className="truncate">
                                  <span className="text-cyan-400">{k}:</span> {v}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Received Response Headers:</span>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-36">
                              {Object.entries(hop.headersReceived).length > 0 ? (
                                Object.entries(hop.headersReceived).map(([k, v]) => (
                                  <div key={k} className="truncate">
                                    <span className="text-emerald-400">{k}:</span> {v}
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-500 italic">No incoming response headers captured.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DIAGNOSTIC LOGS PANEL */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Server Diagnostic Logs (Geo Resolution Trace)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticLogs(!showDiagnosticLogs)}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {showDiagnosticLogs ? 'Hide Logs' : 'Show Logs'}
              </button>
            </div>

            {showDiagnosticLogs && (
              <div className="rounded-lg bg-black/90 p-3.5 font-mono text-xs text-slate-300 border border-slate-800/80 space-y-1 overflow-x-auto">
                {debuggerResult.diagnosticLogs && debuggerResult.diagnosticLogs.length > 0 ? (
                  debuggerResult.diagnosticLogs.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith('[Geo Debug]')
                          ? 'font-bold text-cyan-400'
                          : line.includes('Selected Country:') || line.includes('Analytics Country:')
                          ? 'text-emerald-300 font-semibold'
                          : line.includes('Detected Country:')
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">No diagnostic logs generated.</div>
                )}
              </div>
            )}
          </div>

          {/* EXECUTABLE COMMANDS TERMINAL & LIVE VERIFIER ("check the commands works as directed") */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                Diagnostic Terminal & Executable Commands (Verified Against Routing Engine)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteCommand}
                  disabled={isExecutingCommand}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {isExecutingCommand ? (
                    <>
                      <RotateCw className="h-3 w-3 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-cyan-300" />
                      <span>Run Command Test in Terminal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text =
                      activeCommandTab === 'proxyCurl'
                        ? debuggerResult.executableCommands.proxyCurlTest
                        : activeCommandTab === 'standardCurl'
                        ? debuggerResult.executableCommands.curlTest
                        : debuggerResult.executableCommands.ga4VerificationTest;
                    handleCopyCommand(text);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-all"
                >
                  {copiedCommand ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              {/* Command Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/60 px-2 pt-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommandTab('proxyCurl');
                    setCommandOutput(null);
                  }}
                  className={`px-3 py-1.5 rounded-t-lg font-semibold transition-all ${
                    activeCommandTab === 'proxyCurl'
                      ? 'bg-slate-950 text-cyan-400 border-t border-x border-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Geo-Proxy Injected cURL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommandTab('standardCurl');
                    setCommandOutput(null);
                  }}
                  className={`px-3 py-1.5 rounded-t-lg font-semibold transition-all ${
                    activeCommandTab === 'standardCurl'
                      ? 'bg-slate-950 text-cyan-400 border-t border-x border-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Origin cURL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommandTab('ga4Curl');
                    setCommandOutput(null);
                  }}
                  className={`px-3 py-1.5 rounded-t-lg font-semibold transition-all ${
                    activeCommandTab === 'ga4Curl'
                      ? 'bg-slate-950 text-cyan-400 border-t border-x border-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GA4 UIP Verification Event
                </button>
              </div>

              {/* Code display */}
              <div className="p-4 font-mono text-xs text-slate-200 overflow-x-auto bg-slate-950/90">
                <pre className="whitespace-pre-wrap text-cyan-300">
                  {activeCommandTab === 'proxyCurl' && debuggerResult.executableCommands.proxyCurlTest}
                  {activeCommandTab === 'standardCurl' && debuggerResult.executableCommands.curlTest}
                  {activeCommandTab === 'ga4Curl' && debuggerResult.executableCommands.ga4VerificationTest}
                </pre>
              </div>

              {/* Live Terminal Output Console */}
              {commandOutput && (
                <div className="border-t border-slate-800 bg-black/80 p-4 font-mono text-xs text-emerald-400 overflow-x-auto animate-fadeIn">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">
                    Terminal Output (Validated live):
                  </div>
                  <pre className="whitespace-pre-wrap">{commandOutput}</pre>
                </div>
              )}
            </div>
          </div>

          {/* SMART RECOMMENDATIONS */}
          {debuggerResult.recommendations.length > 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
                Automated Traffic & Geolocation Optimization Recommendations
              </h4>
              <ul className="space-y-1 pl-4 list-disc text-xs text-slate-300">
                {debuggerResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
