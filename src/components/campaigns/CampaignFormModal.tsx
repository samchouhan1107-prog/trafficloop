import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { ShieldCheck, AlertCircle, Sparkles, Globe, Monitor, BarChart3, Search, CheckCircle2, HelpCircle } from 'lucide-react';
import { formatCredits } from '../../utils/formatters.js';
import { CustomCountryPicker } from '../common/CustomCountryPicker.js';
import { GA4TagScanResult } from '../../types.js';

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
  userCredits: number;
}

const CATEGORIES = [
  'Tech & Software (Active)',
  'E-Commerce & Retail (Active)',
  'SaaS & B2B (Active)',
  'Finance & Crypto (Active)',
  'News, Media & Blogs (Active)',
  'Local Services (Active)',
  'Education & Learning (Active)',
  'Health & Wellness (Active)'
];

export function CampaignFormModal({ isOpen, onClose, onCampaignCreated, userCredits }: CampaignFormModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [budget, setBudget] = useState(20);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [targetLocation, setTargetLocation] = useState('Worldwide');
  const [deviceTargeting, setDeviceTargeting] = useState('all');
  const [operationalMode, setOperationalMode] = useState<'active' | 'test'>('active');
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [isScanningGA4, setIsScanningGA4] = useState(false);
  const [ga4ScanResult, setGa4ScanResult] = useState<GA4TagScanResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-validation state
  const [preValidation, setPreValidation] = useState<{
    score: number;
    passed: boolean;
    checks: any;
    suggestedStatus: string;
    rejectionReason?: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced URL pre-validation
  useEffect(() => {
    if (!url || url.length < 8) {
      setPreValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidating(true);
        const res = await api.preValidateUrl(url, title);
        setPreValidation(res);
      } catch {
        // Ignore live typing errors
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url, title]);

  // Scan destination URL for GA4 tags
  const handleScanGA4 = async () => {
    if (!url || !url.startsWith('http')) {
      setError('Please enter a valid destination URL starting with https:// first.');
      return;
    }
    try {
      setIsScanningGA4(true);
      setError(null);
      const scan = await api.scanWebsiteForGA4Tags(url);
      setGa4ScanResult(scan);
      if (scan.detectedMeasurementId) {
        setGa4MeasurementId(scan.detectedMeasurementId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan website for Google Analytics tags.');
    } finally {
      setIsScanningGA4(false);
    }
  };

  const costPerVisit = Number((1.0 + Math.max(0, duration - 15) * 0.05).toFixed(2));
  const estimatedVisits = costPerVisit > 0 ? Math.floor(budget / costPerVisit) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !url.trim()) {
      setError('Please provide a campaign title and valid destination URL.');
      return;
    }

    if (budget < 5) {
      setError('Minimum initial budget is 5.0 credits.');
      return;
    }

    if (budget > userCredits) {
      setError(`Insufficient account balance (${formatCredits(userCredits)} credits available).`);
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

    try {
      setIsSubmitting(true);
      await api.createCampaign({
        title: title.trim(),
        url: parsedUrls[0],
        urls: parsedUrls,
        durationSeconds: duration,
        budget: Number(budget),
        category,
        dailyVisitLimit: Number(dailyLimit),
        targetLocations: targetLocation,
        deviceTargeting,
        ga4MeasurementId: ga4MeasurementId.trim() || undefined,
        initialStatus: operationalMode
      } as any);

      // Reset form
      setTitle('');
      setUrl('');
      setGa4MeasurementId('');
      setGa4ScanResult(null);
      setBudget(20);
      setDuration(15);
      setTargetLocation('Worldwide');
      setDeviceTargeting('all');
      setOperationalMode('active');
      setPreValidation(null);
      onCampaignCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Traffic Campaign"
      subtitle="Configure your website to receive genuine verified human visits from the network."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800/60">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Campaign Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Modern Developer Tooling Platform"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Destination URL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">Destination Website URL(s)</label>
            <span className="text-[11px] text-slate-400">One URL or multiple URLs (one per line) for sequential rotation</span>
          </div>
          <textarea
            required
            rows={2}
            placeholder="https://example.com/landing&#10;https://example.com/blog"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-600 font-mono focus:border-cyan-500 focus:outline-none resize-y"
          />

          {/* Live Pre-Validation Security Box */}
          {preValidation && (
            <div className={`mt-2 rounded-lg border p-2.5 text-xs ${
              preValidation.passed 
                ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300' 
                : 'border-amber-800/60 bg-amber-950/40 text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Automated Safety Score: {preValidation.score}/100</span>
                </div>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-900 border border-slate-800 text-emerald-300">
                  Status: Instant Live Activation
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Category and Daily Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Website Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Visit Limit</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Target Country & Geo Options with Initial Recall */}
        <CustomCountryPicker
          value={targetLocation}
          onChange={setTargetLocation}
          label="Country & Geo Targeting"
          helperText="Select preset regions, recall countries by initial letter (A-Z), or enter custom ISO country codes."
        />

        {/* Operational Mode Selection: Active Commercial vs Test Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Initial Operational Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setOperationalMode('active')}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                operationalMode === 'active'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5 rounded-full p-1 bg-emerald-500/20 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block">Active Commercial Mode</span>
                <span className="text-[11px] text-emerald-300/80 leading-snug block mt-0.5">
                  Immediate dispatch to real active surfers with verified dwell time.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOperationalMode('test')}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                operationalMode === 'test'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500/50'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5 rounded-full p-1 bg-amber-500/20 text-amber-400">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block">Test Mode (Pre-Flight)</span>
                <span className="text-[11px] text-amber-300/80 leading-snug block mt-0.5">
                  Dry-run test mode to verify beacons & GA4 before promoting to active.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Device Targeting */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Device Targeting</span>
          </label>
          <select
            value={deviceTargeting}
            onChange={(e) => setDeviceTargeting(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">🌐 All Devices (Desktop & Mobile)</option>
            <option value="desktop">💻 Desktop & Laptops Only</option>
            <option value="mobile">📱 Mobile & Tablets Only</option>
          </select>
        </div>

        {/* Google Analytics 4 (GA4) Realtime Tracking Configuration */}
        <div className="rounded-xl border border-cyan-800/40 bg-slate-900/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <label htmlFor="ga4-measurement-id-input" className="text-xs font-bold text-slate-200">
                Google Analytics 4 Tracking (Optional)
              </label>
            </div>
            <button
              type="button"
              onClick={handleScanGA4}
              disabled={isScanningGA4 || !url}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 disabled:opacity-50 transition-colors"
            >
              {isScanningGA4 ? (
                <>
                  <div className="h-3 w-3 rounded-full border border-cyan-300 border-t-transparent animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  <span>Auto-Detect Tag</span>
                </>
              )}
            </button>
          </div>

          <div>
            <input
              id="ga4-measurement-id-input"
              type="text"
              placeholder="G-XXXXXXXXXX (e.g., G-D74J4R43K3)"
              value={ga4MeasurementId}
              onChange={(e) => setGa4MeasurementId(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-cyan-200 font-mono focus:border-cyan-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Provide your GA4 Measurement ID so visits dispatched to this campaign reflect in your <strong>analytics.google.com &gt; Realtime &gt; Users in last 30 minutes</strong> report with targeted geolocation!
            </p>
          </div>

          {ga4ScanResult && (
            <div className="rounded-lg bg-slate-950/90 border border-slate-800 p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Scan Status:</span>
                <span className={ga4ScanResult.detectedMeasurementId ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {ga4ScanResult.detectedMeasurementId ? `Found ${ga4ScanResult.detectedMeasurementId}` : 'No tag in raw HTML (enter manually)'}
                </span>
              </div>
              {ga4ScanResult.isSpaOrClientSide && (
                <p className="text-[11px] text-amber-300/90">
                  ⚡ Client-side SPA / dynamic script detected. Entering your Measurement ID above ensures 100% beacon reception.
                </p>
              )}
              {ga4ScanResult.recommendations.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  Tip: {ga4ScanResult.recommendations[0]}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Daily Visit Limit & 24h Rotational Slots */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Daily Visit Capacity / Rotational Schedule
          </label>
          <select
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value={100}>100 visits / day (Standard Test)</option>
            <option value={500}>500 visits / day</option>
            <option value={1000}>1,000 visits / day</option>
            <option value={5000}>5,000 visits / day (5K/hr High Flow)</option>
            <option value={10000}>10,000 visits / day</option>
            <option value={50000}>50,000 visits / day (Burst Capacity)</option>
            <option value={100000}>100,000 visits / 24h Rotational Class</option>
            <option value={0}>♾️ Unrestricted 24h Continuous Rotational Flow</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            24h rolling rotation automatically balances visitor arrivals evenly across every hour with no 4K bottlenecks.
          </p>
        </div>

        {/* Visit Duration Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Visit Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 15, 20, 30].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDuration(sec)}
                className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                  duration === sec
                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{sec} Seconds</span>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                  {formatCredits(1.0 + Math.max(0, sec - 15) * 0.05)} CR/visit
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credit Budget Allocation */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">Credit Budget Allocation</label>
            <span className="text-xs text-slate-400">
              Account Balance: <strong className="text-white">{formatCredits(userCredits)} CR</strong>
            </span>
          </div>
          <input
            type="number"
            min="5"
            max={Math.max(5, userCredits)}
            step="1"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white font-bold focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Estimation Summary Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Estimated Guaranteed Human Visits:</span>
            <span className="text-sm font-bold text-cyan-400">~{estimatedVisits} visits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Targeting: <span className="text-slate-300 font-medium">{targetLocation}</span> | <span className="text-slate-300 font-medium">{deviceTargeting === 'all' ? 'All Devices' : deviceTargeting}</span>. Unused credits are automatically refunded if paused or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            id="submit-create-campaign-btn"
            type="submit"
            disabled={isSubmitting || budget > userCredits}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Creating Campaign...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch Campaign ({budget} CR)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
