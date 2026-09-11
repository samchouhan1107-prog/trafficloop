import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Campaign, GA4TestPingResult, GA4TagScanResult } from '../../types.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Globe,
  Settings2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  Coins,
  Link,
  Sliders,
  Flag,
  BarChart3,
  Search,
  Zap,
  Activity,
  AlertCircle,
  MousePointerClick,
  Rocket
} from 'lucide-react';
import { formatCredits } from '../../utils/formatters.js';
import { CustomCountryPicker } from '../common/CustomCountryPicker.js';

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onCampaignUpdated: (updated: Campaign) => void;
}

const CATEGORIES = [
  'Tech & Software',
  'News & Blogs',
  'Web Development',
  'Developer Tools',
  'Business & Startups',
  'Finance & Banking',
  'Crypto & Web3',
  'Education & Tech',
  'Design & UI',
  'E-Commerce',
  'Gaming & Entertainment',
  'Lifestyle & Health'
];

export function CampaignSettingsModal({
  isOpen,
  onClose,
  campaign,
  onCampaignUpdated
}: CampaignSettingsModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [targetLocations, setTargetLocations] = useState('Worldwide');
  const [deviceTargeting, setDeviceTargeting] = useState('all');
  const [category, setCategory] = useState('Tech & Software');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [duration, setDuration] = useState(15);
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [interactiveClicksEnabled, setInteractiveClicksEnabled] = useState(true);
  const [autoProgress, setAutoProgress] = useState(true);

  // UTM builder states
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('trafficloop');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('webzone_boost');

  // GA4 Diagnostics states
  const [isScanningGA4, setIsScanningGA4] = useState(false);
  const [ga4ScanResult, setGa4ScanResult] = useState<GA4TagScanResult | null>(null);
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [testPingResult, setTestPingResult] = useState<GA4TestPingResult | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when campaign changes
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title || '');
      const initialUrls = campaign.urls && campaign.urls.length > 0
        ? campaign.urls.join('\n')
        : (campaign.url || '');
      setUrl(initialUrls);
      setCategory(campaign.category || 'Tech & Software');
      setDailyLimit(campaign.daily_visit_limit || 100);
      setDuration(campaign.duration_seconds || 15);
      setDeviceTargeting(campaign.device_targeting || 'all');
      setTargetLocations(campaign.target_locations || 'Worldwide');
      setGa4MeasurementId(campaign.ga4_measurement_id || '');
      setInteractiveClicksEnabled(campaign.interactive_clicks_enabled !== false);
      setAutoProgress(campaign.auto_progress !== false);
      setGa4ScanResult(null);
      setTestPingResult(null);
    }
  }, [campaign]);

  if (!campaign) return null;

  // Calculate live cost per visit for selected duration
  const costPerVisit = Number((1.0 + Math.max(0, duration - 15) * 0.05).toFixed(2));

  // Reset URL to base domain / strip query params
  const handleResetUrlClean = () => {
    try {
      const parsed = new URL(url);
      const clean = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      setUrl(clean);
      toast({
        title: 'Destination URL Cleaned',
        description: 'Removed query parameters and UTM tags.',
        variant: 'info'
      });
    } catch {
      // Ignore if invalid url
    }
  };

  // Scan website for GA4 tag
  const handleScanGA4 = async () => {
    if (!url || !url.startsWith('http')) {
      setError('Destination URL must start with http:// or https:// to scan for tags.');
      return;
    }
    try {
      setIsScanningGA4(true);
      setError(null);
      const scan = await api.scanWebsiteForGA4Tags(url);
      setGa4ScanResult(scan);
      if (scan.detectedMeasurementId) {
        setGa4MeasurementId(scan.detectedMeasurementId);
        toast({
          title: 'GA4 Tag Detected!',
          description: `Found Measurement ID: ${scan.detectedMeasurementId}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'No Raw GA4 Tag Found',
          description: scan.isSpaOrClientSide ? 'Client-side SPA detected. Enter your Measurement ID manually.' : 'Please enter your Measurement ID manually.',
          variant: 'warning'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan website.');
    } finally {
      setIsScanningGA4(false);
    }
  };

  // Send live verification ping to Google Analytics Realtime
  const handleSendTestPing = async () => {
    const cleanId = ga4MeasurementId.trim();
    if (!cleanId) {
      setError('Please enter your Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX) before sending a test ping.');
      return;
    }
    try {
      setIsSendingPing(true);
      setError(null);
      const ping = await api.sendGA4TestPing({
        url: url.trim(),
        measurementId: cleanId,
        campaignId: campaign.id,
        countryCode: targetLocations.includes('US') ? 'US' : 'IN'
      });
      setTestPingResult(ping);
      toast({
        title: 'GA4 Beacon Dispatched!',
        description: `HTTP ${ping.httpStatus}: Check analytics.google.com > Realtime report now!`,
        variant: 'success'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch test ping to Google Analytics.');
    } finally {
      setIsSendingPing(false);
    }
  };

  // Apply UTM parameters to destination URL
  const handleApplyUtm = () => {
    try {
      const targetUrl = url.trim() || 'https://webzone1103.blogspot.com/';
      const parsed = new URL(targetUrl);
      if (utmSource) parsed.searchParams.set('utm_source', utmSource);
      if (utmMedium) parsed.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) parsed.searchParams.set('utm_campaign', utmCampaign);
      setUrl(parsed.toString());
      setShowUtmBuilder(false);
      toast({
        title: 'GA4 UTM Tracking Applied',
        description: `Source: ${utmSource} | Medium: ${utmMedium} | Campaign: ${utmCampaign}`,
        variant: 'success'
      });
    } catch (e: any) {
      setError('Invalid URL for UTM tags. Please ensure URL begins with http:// or https://');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Campaign title is required.');
      return;
    }

    const parsedUrls = url
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u));

    if (parsedUrls.length === 0) {
      setError('Please provide at least one valid destination URL starting with http:// or https://');
      return;
    }

    const cleanUrl = parsedUrls[0];
    const finalTargetLocations = targetLocations.trim() || 'Worldwide';

    try {
      setIsSaving(true);
      const res = await api.updateCampaignSettings(campaign.id, {
        title: cleanTitle,
        url: cleanUrl,
        urls: parsedUrls,
        targetLocations: finalTargetLocations,
        deviceTargeting,
        category,
        dailyVisitLimit: Number(dailyLimit),
        durationSeconds: Number(duration),
        ga4MeasurementId: ga4MeasurementId.trim() || null,
        interactiveClicksEnabled,
        autoProgress: Boolean(autoProgress)
      });

      toast({
        title: 'Settings Saved',
        description: 'Destination URL, GA4 Tracking & Country targeting updated successfully.',
        variant: 'success'
      });

      onCampaignUpdated(res.campaign);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Settings & Targeting"
      subtitle="Reset or update destination URL, Google Analytics parameters, country custom options, and delivery rules."
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-rose-950/70 p-3 text-xs text-rose-300 border border-rose-800">
            {error}
          </div>
        )}

        {/* 1. Destination URL & Actions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Link className="h-4 w-4 text-cyan-400" />
              <span>Destination URL</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetUrlClean}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
                title="Strip all query parameters and reset to clean destination"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Clean URL</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUtmBuilder(!showUtmBuilder)}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                <span>{showUtmBuilder ? 'Hide UTM' : 'GA4 / UTM Builder'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
            <textarea
              required
              rows={2}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com/page&#10;https://yourwebsite.com/page-2"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
            />
            {url && (
              <a
                href={url.split(/[\n,]+/)[0]?.trim()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
                title="Open primary destination URL in a new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Test Link</span>
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Enter a single URL or multiple URLs (one per line). Visits will automatically cycle through each URL sequentially.
          </p>

          {/* UTM Builder Panel */}
          {showUtmBuilder && (
            <div className="mt-3 rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs space-y-3">
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span>Google Analytics (GA4) Tracking Parameters</span>
                <span className="text-[10px] text-amber-400/80">Controls GA4 Traffic Acquisition Source/Medium</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">utm_source</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="trafficloop"
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">utm_medium</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="cpc / referral"
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">utm_campaign</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="webzone_boost"
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyUtm}
                  className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Apply UTM to URL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1.5 Google Analytics 4 (GA4) Realtime Tracking & Tag Scanner */}
        <div className="rounded-xl border border-cyan-700/50 bg-slate-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Google Analytics 4 (GA4) Realtime Verification</h4>
                <p className="text-[11px] text-slate-400">
                  Ensure all visits show up in your live GA4 Realtime report (users in last 30 minutes)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleScanGA4}
                disabled={isScanningGA4 || !url}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors"
              >
                {isScanningGA4 ? (
                  <>
                    <div className="h-3 w-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Detect Tag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label htmlFor="ga4-measurement-id-settings" className="block text-[11px] font-semibold text-slate-300 mb-1">
                GA4 Measurement ID (e.g., G-D74J4R43K3)
              </label>
              <input
                id="ga4-measurement-id-settings"
                type="text"
                value={ga4MeasurementId}
                onChange={(e) => setGa4MeasurementId(e.target.value.toUpperCase().trim())}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-lg border border-cyan-700/60 bg-slate-900 px-3 py-2 text-xs font-mono text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <button
                type="button"
                id="send-ga4-test-ping-btn"
                onClick={handleSendTestPing}
                disabled={isSendingPing || !ga4MeasurementId}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 transition-all"
              >
                {isSendingPing ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                    <span>Sending Beacon...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Send Test Ping to GA4</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Realtime test ping verification output */}
          {testPingResult && (
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Beacon Delivered (HTTP {testPingResult.httpStatus} OK)
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  {new Date(testPingResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                A verified session start & page_view beacon was transmitted to <strong>{testPingResult.measurementId}</strong> for <em>{testPingResult.url || testPingResult.targetUrl}</em> with targeted country <strong>{testPingResult.countryCode || 'IN'}</strong>.
              </p>
              <div className="pt-1 text-[11px] text-cyan-300 flex items-center gap-1">
                <span>👉 Check now:</span>
                <a
                  href="https://analytics.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-cyan-200 inline-flex items-center gap-0.5 font-medium"
                >
                  analytics.google.com &gt; Reports &gt; Realtime <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          )}

          {/* Auto scan output */}
          {ga4ScanResult && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Scanner Analysis:</span>
                <span className={ga4ScanResult.detectedMeasurementId ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {ga4ScanResult.detectedMeasurementId ? `Detected Tag ${ga4ScanResult.detectedMeasurementId}` : 'No inline gtag found in initial HTML'}
                </span>
              </div>
              {ga4ScanResult.isSpaOrClientSide && (
                <p className="text-[11px] text-amber-300">
                  Note: Your website uses dynamic or SPA hydration. Storing your Measurement ID ensures reliable direct Measurement Protocol tracking!
                </p>
              )}
            </div>
          )}

          <div className="rounded bg-slate-900/60 border border-slate-800/80 p-2 text-[11px] text-slate-400">
            💡 <strong>Why might Google Analytics take time?</strong>
            Standard GA4 reports (like Acquisition / Traffic) take 24–48 hours to process batch tables. Only the <strong>Realtime</strong> dashboard reflects live visitors within 10–30 seconds.
          </div>
        </div>

        {/* 2. Country & Geo-Targeting Custom Options with Initial Recall */}
        <CustomCountryPicker
          value={targetLocations}
          onChange={setTargetLocations}
          label="Country & Geo-Targeting Custom Options"
          helperText="Select preset regional corridors, recall countries alphabetically by initial (A-Z), or enter custom ISO country codes."
        />

        {/* 3. Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campaign Title / Identifier
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WebZone Blog & Tech Hub"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Niche Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Device Targeting & Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Device Targeting
            </label>
            <select
              value={deviceTargeting}
              onChange={(e) => setDeviceTargeting(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">🌐 All Devices (Responsive)</option>
              <option value="desktop">💻 Desktop Only</option>
              <option value="mobile">📱 Mobile / Tablet Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Daily Visit Cap
            </label>
            <select
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value={100}>100 visits / day</option>
              <option value={500}>500 visits / day</option>
              <option value={1000}>1,000 visits / day</option>
              <option value={5000}>5,000 visits / day (5K/hr Slot)</option>
              <option value={10000}>10,000 visits / day</option>
              <option value={50000}>50,000 visits / day (High Volume)</option>
              <option value={100000}>100,000 visits / 24h Rotational</option>
              <option value={0}>♾️ Unrestricted 24h Continuous Flow</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Visit Duration & Cost
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value={10}>10 Seconds ({formatCredits(1.0)} CR/visit)</option>
              <option value={15}>15 Seconds ({formatCredits(1.0)} CR/visit)</option>
              <option value={20}>20 Seconds ({formatCredits(1.25)} CR/visit)</option>
              <option value={30}>30 Seconds ({formatCredits(1.75)} CR/visit)</option>
              <option value={45}>45 Seconds ({formatCredits(2.5)} CR/visit)</option>
              <option value={60}>60 Seconds ({formatCredits(3.25)} CR/visit)</option>
            </select>
          </div>
        </div>

        {/* 5. Interactive Webpage Clicks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <MousePointerClick className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Interactive Webpage Clicks</h4>
                <p className="text-[11px] text-slate-400">
                  Allows visitors to click on links and explore your webpage elements while traffic is diverted.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={interactiveClicksEnabled}
                onChange={(e) => setInteractiveClicksEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-cyan-300/90 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span>Each verified visitor click emits a real-time Google Analytics (GA4) <code>click</code> event and earns the visitor engagement bonuses.</span>
          </div>
        </div>

        {/* 6. Autonomous Traffic Progression */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Autonomous Traffic Progression</h4>
                <p className="text-[11px] text-slate-400">
                  Automatically progress and dispatch visits according to your schedule and rotate through URLs/geos without manual intervention.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
