import React, { useState } from 'react';
import {
  StationState,
  StationControlPayload,
  StationId,
  DeviceTypeProfile,
  StationCookie,
  StationAdDisplayData
} from '../../types.js';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Activity,
  Gauge,
  Smartphone,
  Monitor,
  Tablet,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Wifi,
  ChevronDown,
  ChevronUp,
  BarChart3,
  MapPin,
  Search,
  Tag,
  KeyRound,
  Compass,
  Cookie,
  Megaphone,
  Send,
  Trash2,
  Star,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface SupportedCountryItem {
  code: string;
  name: string;
  flag: string;
  region: string;
  cities?: string[];
}

interface TriStationCardProps {
  station: StationState;
  supportedCountries: SupportedCountryItem[];
  availableCampaigns: Array<{ id: string; title: string; url: string; target_locations: string; duration_seconds: number }>;
  onControl: (payload: StationControlPayload) => void;
  isCompact?: boolean;
}

const PRESET_KEYWORDS = [
  'repair tech hiring',
  'appliance repair technician jobs',
  'hvac diagnostic specialist',
  'field service technician recruitment',
  'certified equipment repair tech'
];

export function TriStationCard({
  station,
  supportedCountries,
  availableCampaigns,
  onControl,
  isCompact = false
}: TriStationCardProps) {
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showPushUrlBar, setShowPushUrlBar] = useState(false);

  // Active view tab in station window: 'viewport' | 'ad_display' | 'cookies'
  const [activeWindowTab, setActiveWindowTab] = useState<'viewport' | 'ad_display' | 'cookies'>('viewport');

  // Quick Push URL bar local inputs
  const [quickPushUrl, setQuickPushUrl] = useState(station.targetUrl);
  const [quickPushKeyword, setQuickPushKeyword] = useState(station.searchKeyword || 'repair tech hiring');

  // Local editable draft config
  const [customUrl, setCustomUrl] = useState(station.targetUrl);
  const [selectedCountry, setSelectedCountry] = useState(station.selectedTargetCountry);
  const [selectedCity, setSelectedCity] = useState(station.selectedTargetCity || 'Auto-Rotate (All Cities)');
  const [customGaId, setCustomGaId] = useState(station.gaMeasurementId || '');
  const [searchKeyword, setSearchKeyword] = useState(station.searchKeyword || 'repair tech hiring');
  const [searchTheme, setSearchTheme] = useState(station.searchTheme || 'repair tech hiring');
  const [trafficMedium, setTrafficMedium] = useState<'organic' | 'referral' | 'direct' | 'cpc'>(station.trafficMedium || 'organic');
  const [customCid, setCustomCid] = useState(station.gaClientId || '');
  const [selectedDuration, setSelectedDuration] = useState(station.dwellDurationSeconds);
  const [selectedDevice, setSelectedDevice] = useState<DeviceTypeProfile>(station.deviceProfile);

  const activeCountryObj = supportedCountries.find(c => c.code === selectedCountry);
  const availableCities = activeCountryObj?.cities || ['Capital City', 'Central Metro'];

  const handleCopy = (text: string, type: 'session' | 'ip' | 'cid') => {
    navigator.clipboard.writeText(text);
    if (type === 'session') {
      setCopiedSession(true);
      setTimeout(() => setCopiedSession(false), 2000);
    } else if (type === 'ip') {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } else {
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    }
  };

  const handleGenerateFreshCid = () => {
    const randomPart = Math.floor(Math.random() * 899999999 + 100000000);
    const timePart = Math.floor(Date.now() / 1000);
    const newCid = `${randomPart}.${timePart}`;
    setCustomCid(newCid);
  };

  const handleStartWithConfig = () => {
    onControl({
      action: 'start',
      stationId: station.stationId,
      config: {
        targetUrl: customUrl,
        targetCountry: selectedCountry,
        targetCity: selectedCity,
        gaMeasurementId: customGaId.trim() || undefined,
        gaClientId: customCid.trim() || undefined,
        searchKeyword: searchKeyword.trim() || 'repair tech hiring',
        searchTheme: searchTheme.trim() || searchKeyword.trim() || 'repair tech hiring',
        trafficMedium,
        dwellDurationSeconds: selectedDuration,
        deviceProfile: selectedDevice
      }
    });
    setShowConfig(false);
  };

  const handleQuickPushUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPushUrl.trim()) return;

    onControl({
      action: 'push_url',
      stationId: station.stationId,
      config: {
        targetUrl: quickPushUrl.trim(),
        searchKeyword: quickPushKeyword.trim() || 'repair tech hiring',
        searchTheme: quickPushKeyword.trim() || 'repair tech hiring',
        targetCountry: station.selectedTargetCountry,
        targetCity: station.selectedTargetCity,
        deviceProfile: station.deviceProfile,
        dwellDurationSeconds: station.dwellDurationSeconds
      }
    });
    setShowPushUrlBar(false);
    setActiveWindowTab('ad_display');
  };

  const handleClearCookies = () => {
    onControl({
      action: 'clear_cookies',
      stationId: station.stationId
    });
  };

  const statusColors = {
    idle: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700', dot: 'bg-slate-400' },
    connecting: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/60', dot: 'bg-amber-400 animate-ping' },
    verifying_geo: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-700/60', dot: 'bg-cyan-400 animate-pulse' },
    navigating: { bg: 'bg-sky-950/80', text: 'text-sky-300', border: 'border-sky-700/60', dot: 'bg-sky-400 animate-pulse' },
    active: { bg: 'bg-emerald-950/90', text: 'text-emerald-300', border: 'border-emerald-500', dot: 'bg-emerald-400 animate-pulse' },
    completed: { bg: 'bg-teal-950/80', text: 'text-teal-300', border: 'border-teal-700/60', dot: 'bg-teal-400' },
    error: { bg: 'bg-rose-950/90', text: 'text-rose-300', border: 'border-rose-600', dot: 'bg-rose-500 animate-bounce' },
    paused: { bg: 'bg-amber-950/90', text: 'text-amber-300', border: 'border-amber-600', dot: 'bg-amber-500' }
  };

  const currentTheme = statusColors[station.status] || statusColors.idle;
  const dwellProgress = station.dwellDurationSeconds > 0
    ? Math.min(100, Math.round((station.elapsedSeconds / station.dwellDurationSeconds) * 100))
    : 0;
  const remainingSeconds = Math.max(0, station.dwellDurationSeconds - station.elapsedSeconds);
  const isNearComplete = station.status === 'active' && remainingSeconds <= 5;

  const geo = station.geoEndpoint;
  const perf = station.performance;
  const isMismatch = geo?.verificationStatus === 'mismatch_flagged';
  const effectiveCid = station.gaClientId || geo?.gaClientId || customCid || '1482910482.1725178492';
  const effectiveKeyword = station.searchKeyword || 'repair tech hiring';
  const effectiveTheme = station.searchTheme || effectiveKeyword;

  // Fallback ad display if not generated yet
  const adDisplay: StationAdDisplayData = station.adDisplay || {
    headline: `${effectiveKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} | Direct Certified Openings`,
    displayUrl: `${station.targetUrl.replace(/^https?:\/\//, '').split('/')[0]} > careers > ${effectiveKeyword.replace(/\s+/g, '-')}`,
    destinationUrl: station.targetUrl,
    description: `Now hiring certified ${effectiveKeyword} in ${station.selectedTargetCity || 'All Metros'}, ${station.selectedTargetCountry}. Immediate interview schedules, full benefits, and competitive compensation.`,
    searchKeyword: effectiveKeyword,
    searchTheme: effectiveTheme,
    callToAction: 'Apply Now / View Openings',
    snippetBadges: ['✓ Verified Employer Ad', '⚡ Direct Response', '🍪 Active Cookie Jar', '⭐ 4.9 Rating (142 reviews)'],
    rating: 4.9,
    reviewCount: 142,
    sitelinks: [
      { title: 'Job Openings', snippet: `View open ${effectiveKeyword} positions` },
      { title: 'Requirements & Pay', snippet: 'Diagnostic certifications & compensation' },
      { title: 'Service Areas', snippet: `Active routes in ${station.selectedTargetCity || 'All Cities'}` },
      { title: 'Apply in 2 Mins', snippet: 'Fast-track mobile application' }
    ]
  };

  // Fallback cookie jar if not populated yet
  const cookies: StationCookie[] = station.cookies && station.cookies.length > 0 ? station.cookies : [
    { name: '_ga', value: `GA1.2.${effectiveCid}`, domain: '.trafficloop.global', path: '/', expires: '1 year', category: 'analytics' },
    { name: '_gid', value: `GA1.2.${Math.floor(Date.now() / 1000)}`, domain: '.trafficloop.global', path: '/', expires: '24 hours', category: 'analytics' },
    { name: '_gcl_au', value: `1.1.492817294.${Math.floor(Date.now() / 1000)}`, domain: '.trafficloop.global', path: '/', expires: '1 year', category: 'advertising' },
    { name: 'search_intent_kw', value: encodeURIComponent(effectiveKeyword), domain: '.trafficloop.global', path: '/', expires: '24 hours', category: 'analytics' },
    { name: 'traffic_source', value: `${station.trafficMedium || 'organic'}_google_cpc`, domain: '.trafficloop.global', path: '/', expires: '24 hours', category: 'advertising' },
    { name: 'cookie_consent', value: 'accepted_strict_essential_ad_telemetry', domain: '.trafficloop.global', path: '/', expires: '1 year', category: 'essential' },
    { name: 'tl_station_node', value: station.stationTag, domain: '.trafficloop.global', path: '/', expires: '24 hours', category: 'functional' }
  ];

  return (
    <div
      id={`station-card-${station.stationId}`}
      className={`flex flex-col rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        station.status === 'active'
          ? 'border-cyan-500/70 bg-slate-900/90 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
          : station.status === 'error'
          ? 'border-rose-600/70 bg-slate-900/90 shadow-rose-950/30'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      {/* 1. Station Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-black text-xs font-mono">
            {station.stationTag.split('-')[0].charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{station.stationName}</h3>
              <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-slate-700">
                {station.stationTag}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 font-mono">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                24h Rotational
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {station.campaignTitle || station.targetUrl}
            </p>
          </div>
        </div>

        {/* Live Status Pill & Run Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span className="hidden sm:inline text-[10px] text-slate-500">Runs:</span>
            <span className="font-bold text-slate-200">#{station.completedRuns}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}
          >
            <span className={`h-2 w-2 rounded-full ${currentTheme.dot}`} />
            <span className="capitalize">{station.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* 2. Geographic Routing & IP Verification Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Target Country/City vs Detected Egress */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-slate-400">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px]">Target:</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                {supportedCountries.find(c => c.code === station.selectedTargetCountry)?.flag || '🌐'}{' '}
                {station.selectedTargetCountry} {station.selectedTargetCity ? `(${station.selectedTargetCity})` : ''}
              </span>
            </div>

            <span className="text-slate-600">→</span>

            {/* Verified Egress Geo */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">Egress:</span>
              {geo ? (
                <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  isMismatch
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                }`}>
                  <span>{geo.detectedFlag}</span>
                  <span>{geo.detectedCity}, {geo.detectedCountryCode}</span>
                </span>
              ) : (
                <span className="text-slate-500 font-mono text-[11px]">Unprobed</span>
              )}
            </div>
          </div>

          {/* Verification Status Pill */}
          {geo && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isMismatch
                  ? 'bg-amber-900/40 text-amber-300 border border-amber-700/60'
                  : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60'
              }`}
              title={geo.verificationMessage}
            >
              {isMismatch ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span>Geo Mismatch</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Match Verified (0%)</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Detailed IP, City & GA4 Status Strip */}
        {geo && (
          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Public IP:</span>
                <span className="font-bold text-cyan-300">{geo.publicIp}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(geo.publicIp, 'ip')}
                  className="text-slate-500 hover:text-cyan-300 transition-colors"
                  title="Copy Verified IP"
                >
                  {copiedIp ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="truncate max-w-[140px] sm:max-w-[200px]" title={`${geo.isp} (${geo.asn})`}>
                  {geo.isp}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400">{geo.dnsLatencyMs}ms</span>
              </div>
            </div>

            {/* Google Analytics Tag, Client ID & Hit Status Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <BarChart3 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400">GA4 Status:</span>
                {station.ga4HitStatus === 'dispatched' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-400" />
                    Realtime Measured ({station.gaMeasurementId || geo.ga4MeasurementId})
                  </span>
                ) : station.ga4HitStatus === 'not_detected' ? (
                  <span className="text-slate-400">Tag Auto-Dispatched (Protocol v2)</span>
                ) : station.ga4HitStatus === 'error' ? (
                  <span className="text-amber-400 font-medium">Tag Dispatch Error</span>
                ) : (
                  <span className="text-slate-400">Standby (Awaiting Navigation)</span>
                )}
              </div>

              {/* Client ID (cid) Badge */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                <KeyRound className="h-3 w-3 text-cyan-400" />
                <span className="text-slate-500">cid:</span>
                <span className="font-bold text-cyan-300">{effectiveCid}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(effectiveCid, 'cid')}
                  className="text-slate-500 hover:text-cyan-300 transition-colors ml-0.5"
                  title="Copy GA4 Client ID (cid)"
                >
                  {copiedCid ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Keyword / Theme Strip */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-900/50 text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <Search className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="text-cyan-300 font-semibold">Theme / Keyword:</span>
                <span className="font-mono font-bold text-white truncate bg-cyan-900/60 px-1.5 py-0.5 rounded border border-cyan-700/50">
                  "{effectiveKeyword}"
                </span>
              </div>
              <span className="text-cyan-400 font-mono text-[9px] uppercase tracking-wider shrink-0">
                {station.trafficMedium || 'organic'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Window Mode Switcher Tabs (Viewport | Ad Display | Cookies) */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveWindowTab('viewport')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeWindowTab === 'viewport'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Monitor className="h-3 w-3" />
            <span>Viewport</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWindowTab('ad_display')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeWindowTab === 'ad_display'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Megaphone className="h-3 w-3" />
            <span>Ad Display</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWindowTab('cookies')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeWindowTab === 'cookies'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cookie className="h-3 w-3" />
            <span>Cookies ({cookies.length})</span>
          </button>
        </div>

        {/* Quick Push URL Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPushUrlBar(!showPushUrlBar)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold border transition-colors ${
            showPushUrlBar
              ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
          }`}
          title="Push custom URL & keyword to this station"
        >
          <Send className="h-2.5 w-2.5" />
          <span>Push URL</span>
        </button>
      </div>

      {/* Quick Push URL Bar (Collapsible) */}
      {showPushUrlBar && (
        <form onSubmit={handleQuickPushUrl} className="bg-slate-950 border-b border-slate-800 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
            <span>⚡ Push Live Target URL to {station.stationName}</span>
            <span className="text-[10px] text-slate-500 font-mono">Bypasses 4K Limit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              required
              value={quickPushUrl}
              onChange={(e) => setQuickPushUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
            <input
              type="text"
              value={quickPushKeyword}
              onChange={(e) => setQuickPushKeyword(e.target.value)}
              placeholder="Theme / Keyword (e.g. repair tech hiring)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPushUrlBar(false)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 px-3 py-1 text-xs font-bold text-white shadow-md transition-all"
            >
              <Send className="h-3 w-3" />
              <span>Launch & Push Ad Display</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. Remote Simulated Browser Viewport / Ad Display / Cookies Panel */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col">
        {/* Browser Chrome URL bar */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono">
          <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          
          <span className="flex-1 truncate text-slate-300 text-[11px]" title={station.targetUrl}>
            {station.targetUrl}
          </span>

          {/* HTTP Status badge */}
          {perf && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                perf.httpStatusCode < 300
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : perf.httpStatusCode < 400
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {perf.httpStatusCode} {perf.httpStatusText}
            </span>
          )}

          <a
            href={station.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-300 transition-colors"
            title="Open URL directly in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: LIVE VIEWPORT                                     */}
        {/* ========================================================= */}
        {activeWindowTab === 'viewport' && (
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden min-h-[220px] flex-1 flex flex-col justify-between">
            {/* Top Loading / Dwell Progress Bar */}
            <div className="w-full bg-slate-850 h-1">
              <div
                className={`h-full transition-all duration-1000 ${
                  station.status === 'active'
                    ? isNearComplete
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400'
                    : station.status === 'navigating' || station.status === 'verifying_geo'
                    ? 'bg-cyan-500 animate-pulse'
                    : station.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${dwellProgress}%` }}
              />
            </div>

            {/* Viewport Interior */}
            <div className="p-3 flex-1 flex flex-col justify-center items-center text-center relative">
              {station.status === 'active' ? (
                <div className="space-y-2.5 w-full">
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-bold font-mono tracking-wider">
                      VIEWPORT ENGAGED · {station.elapsedSeconds}s / {station.dwellDurationSeconds}s
                      {station.status === 'active' && (
                        <span className={`ml-1.5 ${isNearComplete ? 'text-emerald-400 animate-pulse' : 'text-amber-300'}`}>
                          ({remainingSeconds}s left)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Visible Attribution & Keyword Banner on User's Window */}
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-2.5 text-left max-w-sm mx-auto shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <Search className="h-3 w-3 text-cyan-400" />
                        <span>Search Theme:</span>
                      </div>
                      <span className="font-bold text-white bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800 text-[10px]">
                        {effectiveKeyword}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500 block">CID:</span>
                        <span className="text-cyan-300 font-semibold truncate block" title={effectiveCid}>
                          {effectiveCid}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Geo Attribution:</span>
                        <span className="text-emerald-300 font-semibold truncate block">
                          {geo?.detectedCity || station.selectedTargetCity || 'Target'}, {geo?.detectedCountryCode || station.selectedTargetCountry}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate font-mono pt-0.5 border-t border-slate-800/80">
                      <span className="text-slate-500">Referrer: </span>
                      <span className="text-slate-300">
                        https://www.google.com/search?q={encodeURIComponent(effectiveKeyword)}
                      </span>
                    </div>
                  </div>

                  {/* Micro Network Waterfall */}
                  {perf && (
                    <div className="grid grid-cols-4 gap-1 pt-0.5 max-w-sm mx-auto text-[10px] font-mono">
                      <div className="bg-slate-900/90 rounded p-1 border border-slate-800">
                        <span className="text-slate-500 block">TTFB</span>
                        <span className="text-emerald-400 font-bold">{perf.ttfbMs}ms</span>
                      </div>
                      <div className="bg-slate-900/90 rounded p-1 border border-slate-800">
                        <span className="text-slate-500 block">DOM</span>
                        <span className="text-cyan-400 font-bold">{perf.domInteractiveMs}ms</span>
                      </div>
                      <div className="bg-slate-900/90 rounded p-1 border border-slate-800">
                        <span className="text-slate-500 block">Load</span>
                        <span className="text-sky-400 font-bold">{perf.pageLoadMs}ms</span>
                      </div>
                      <div className="bg-slate-900/90 rounded p-1 border border-slate-800">
                        <span className="text-slate-500 block">Size</span>
                        <span className="text-slate-300 font-bold">{perf.pageSizeKb}KB</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : station.status === 'navigating' ? (
                <div className="space-y-2">
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">Resolving DNS & Loading DOM...</p>
                  <p className="text-[11px] text-slate-400 font-mono">Theme: "{effectiveKeyword}" · IP: {geo?.publicIp || 'Egress Node'}</p>
                </div>
              ) : station.status === 'verifying_geo' ? (
                <div className="space-y-2">
                  <Radio className="h-6 w-6 text-cyan-400 animate-pulse mx-auto" />
                  <p className="text-xs font-bold text-white">Verifying Geolocation IP & City...</p>
                  <p className="text-[11px] text-slate-400 font-mono">Target: {station.selectedTargetCountry} ({station.selectedTargetCity || 'All Cities'})</p>
                </div>
              ) : station.status === 'completed' ? (
                <div className="space-y-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-emerald-300">Session Verified & Measured in GA4</p>
                  <p className="text-[11px] text-slate-400">CID: {effectiveCid} · Theme: "{effectiveKeyword}"</p>
                </div>
              ) : station.status === 'error' ? (
                <div className="space-y-2 text-rose-300">
                  <AlertTriangle className="h-6 w-6 text-rose-400 mx-auto" />
                  <p className="text-xs font-bold">Isolated Station Error</p>
                  <p className="text-[11px] text-rose-400/80 max-w-xs truncate">{station.lastErrorMessage || 'Request timed out'}</p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400 py-1">
                  <Monitor className="h-6 w-6 mx-auto text-slate-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Station Standby</p>
                    <p className="text-[11px] text-slate-400">Theme: <span className="text-cyan-300 font-semibold font-mono">"{effectiveKeyword}"</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Session ID & Client ID Footer Strip */}
            <div className="border-t border-slate-800/80 bg-slate-900/60 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Session:</span>
                <span className="text-slate-300 font-bold">
                  {station.sessionId ? `${station.sessionId.substring(0, 16)}...` : 'READY'}
                </span>
                {station.sessionId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(station.sessionId || '', 'session')}
                    className="text-slate-500 hover:text-cyan-300"
                    title="Copy full Session ID"
                  >
                    {copiedSession ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 capitalize">{station.deviceProfile}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-semibold">{station.dwellDurationSeconds}s dwell</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RICH AD DISPLAY (GOOGLE SERP / RESPONSIVE AD)     */}
        {/* ========================================================= */}
        {activeWindowTab === 'ad_display' && (
          <div className="rounded-xl border border-amber-600/40 bg-slate-950 p-3.5 space-y-3 min-h-[220px] flex-1 flex flex-col justify-between shadow-inner">
            {/* Google SERP Style Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-slate-900 bg-amber-400 px-1.5 py-0.2 rounded text-[10px] tracking-wide uppercase">
                    Sponsored
                  </span>
                  <span className="text-slate-400 font-mono truncate max-w-[200px]" title={adDisplay.displayUrl}>
                    {adDisplay.displayUrl}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{adDisplay.rating}</span>
                  <span className="text-slate-500 font-normal">({adDisplay.reviewCount})</span>
                </div>
              </div>

              {/* Clickable Headline */}
              <a
                href={adDisplay.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm sm:text-base font-bold text-sky-400 hover:underline leading-snug"
              >
                {adDisplay.headline}
              </a>

              {/* Ad Description with location attribution */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {adDisplay.description}
              </p>

              {/* Badges strip */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {adDisplay.snippetBadges.map((b, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-800"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Sitelinks Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              {adDisplay.sitelinks.map((link, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-900/80 p-2 border border-slate-800 hover:border-sky-500/50 transition-colors"
                >
                  <p className="text-xs font-bold text-sky-400">{link.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{link.snippet}</p>
                </div>
              ))}
            </div>

            {/* Direct CTA Action Button */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">
                Theme: <strong className="text-amber-300">{effectiveKeyword}</strong>
              </span>

              <button
                type="button"
                onClick={() => onControl({ action: 'start', stationId: station.stationId })}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all"
              >
                <Megaphone className="h-3.5 w-3.5" />
                <span>{adDisplay.callToAction}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACTIVE COOKIES (COOKIE JAR)                       */}
        {/* ========================================================= */}
        {activeWindowTab === 'cookies' && (
          <div className="rounded-xl border border-sky-600/40 bg-slate-950 p-3 space-y-2.5 min-h-[220px] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                  <Cookie className="h-3.5 w-3.5 text-sky-400" />
                  <span>Station Sandbox Cookie Jar ({cookies.length} Keys)</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCookies}
                  className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300 transition-colors"
                  title="Clear & Re-seed fresh cookies and CID"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                  <span>Re-seed Cookies</span>
                </button>
              </div>

              {/* Cookies List */}
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[10px] pr-1">
                {cookies.map((ck, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-1.5 rounded bg-slate-900/90 border border-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-cyan-300">{ck.name}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-slate-300 truncate max-w-[130px] sm:max-w-[180px]" title={ck.value}>
                        {ck.value}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[9px]">
                      <span className={`px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                        ck.category === 'analytics'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                          : ck.category === 'advertising'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                          : ck.category === 'essential'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ck.category}
                      </span>
                      <span className="text-slate-500">Exp: {ck.expires.split(' ')[0] || '24h'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              Cookies persist session state, Google Analytics attribution, ad click IDs, and search keyword telemetry across 24h rotational cycles.
            </div>
          </div>
        )}

        {/* Configuration Accordion Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-400 hover:text-slate-200 py-1"
          >
            <span>Target, Theme/Keywords & GA4 Settings</span>
            {showConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showConfig && (
            <div className="mt-2 space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              {/* Target URL */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Target Website URL</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              {/* Theme & Search Keywords Section */}
              <div className="space-y-1.5 border-t border-b border-slate-800/80 py-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                    <Search className="h-3 w-3 text-cyan-400" />
                    <span>Search Theme / Keywords (e.g., "repair tech hiring")</span>
                  </label>
                  <span className="text-[9px] text-slate-500">Google Organic Referrer</span>
                </div>

                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setSearchTheme(e.target.value);
                  }}
                  placeholder="e.g. repair tech hiring"
                  className="w-full rounded-lg border border-cyan-800/60 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />

                {/* Preset Keyword Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setSearchKeyword(kw);
                        setSearchTheme(kw);
                      }}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                        searchKeyword === kw
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* GA4 Client ID (cid) & Traffic Medium */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-semibold text-slate-400">GA4 Client ID (cid)</label>
                    <button
                      type="button"
                      onClick={handleGenerateFreshCid}
                      className="text-[9px] text-cyan-400 hover:underline"
                    >
                      Fresh CID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customCid}
                    onChange={(e) => setCustomCid(e.target.value)}
                    placeholder="Auto (XXXXXXXXXX.XXXXXXXXXX)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Traffic Medium</label>
                  <select
                    value={trafficMedium}
                    onChange={(e) => setTrafficMedium(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none capitalize"
                  >
                    <option value="organic">Organic Search (Google)</option>
                    <option value="referral">Referral Traffic</option>
                    <option value="direct">Direct Visit</option>
                    <option value="cpc">Paid CPC</option>
                  </select>
                </div>
              </div>

              {/* Country & City Selection Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Target Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedCity('Auto-Rotate (All Cities)');
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {supportedCountries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Target City (GA4)</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Auto-Rotate (All Cities)">Auto-Rotate (All Cities)</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GA4 Measurement ID & Dwell Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">GA4 Tag ID (Optional)</label>
                  <input
                    type="text"
                    value={customGaId}
                    onChange={(e) => setCustomGaId(e.target.value.toUpperCase())}
                    placeholder="Auto-detect or G-XXXXX"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Dwell Time</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  >
                    <option value={10}>10 Seconds (Rapid QA)</option>
                    <option value={15}>15 Seconds (Standard)</option>
                    <option value={20}>20 Seconds (Extended)</option>
                    <option value={30}>30 Seconds (Deep Dwell)</option>
                    <option value={60}>60 Seconds (Long Soak)</option>
                  </select>
                </div>
              </div>

              {/* Device Profile */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Device Emulation Profile</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['desktop', 'mobile', 'tablet'] as DeviceTypeProfile[]).map((dev) => (
                    <button
                      key={dev}
                      type="button"
                      onClick={() => setSelectedDevice(dev)}
                      className={`flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold border transition-all ${
                        selectedDevice === dev
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {dev === 'desktop' && <Monitor className="h-3 w-3" />}
                      {dev === 'mobile' && <Smartphone className="h-3 w-3" />}
                      {dev === 'tablet' && <Tablet className="h-3 w-3" />}
                      <span className="capitalize">{dev}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply & Launch Button */}
              <button
                type="button"
                onClick={handleStartWithConfig}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-1.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Apply Settings & Start Session</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Logs Drawer Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-400 hover:text-slate-200 py-1"
          >
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>Live Station Console ({station.logs.length} events)</span>
            </div>
            {showLogs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showLogs && (
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[10px] space-y-1 max-h-36 overflow-y-auto">
              {station.logs.length === 0 ? (
                <div className="text-slate-600 text-center py-2">No activity events logged yet.</div>
              ) : (
                station.logs.map((log) => (
                  <div key={log.id} className="leading-tight flex items-start gap-1.5">
                    <span className="text-slate-600 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span
                      className={`break-words ${
                        log.level === 'error'
                          ? 'text-rose-400'
                          : log.level === 'warn'
                          ? 'text-amber-400'
                          : log.level === 'success'
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 5. Independent Station Action Controls */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
          {station.status === 'active' ? (
            <button
              type="button"
              onClick={() => onControl({ action: 'pause', stationId: station.stationId })}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-600/70 bg-amber-950/60 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </button>
          ) : station.status === 'paused' ? (
            <button
              type="button"
              onClick={() => onControl({ action: 'resume', stationId: station.stationId })}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/70 bg-emerald-950/60 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-emerald-300" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onControl({ action: 'start', stationId: station.stationId })}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 px-3 py-2 text-xs font-bold text-white shadow-md transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{station.status === 'error' ? 'Retry Session' : 'Start Station'}</span>
            </button>
          )}

          {/* Stop Button */}
          <button
            type="button"
            onClick={() => onControl({ action: 'stop', stationId: station.stationId })}
            disabled={station.status === 'idle'}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Halt session and reset to standby"
          >
            <Square className="h-3.5 w-3.5" />
          </button>

          {/* Reset Stats */}
          <button
            type="button"
            onClick={() => onControl({ action: 'reset', stationId: station.stationId })}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="Reset telemetry & logs for this station"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
