import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Campaign } from '../../types.js';
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
  Flag
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

  // UTM builder states
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('trafficloop');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('webzone_boost');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when campaign changes
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title || '');
      setUrl(campaign.url || '');
      setCategory(campaign.category || 'Tech & Software');
      setDailyLimit(campaign.daily_visit_limit || 100);
      setDuration(campaign.duration_seconds || 15);
      setDeviceTargeting(campaign.device_targeting || 'all');
      setTargetLocations(campaign.target_locations || 'Worldwide');
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
    const cleanUrl = url.trim();

    if (!cleanTitle) {
      setError('Campaign title is required.');
      return;
    }

    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
      setError('Destination URL must start with http:// or https://');
      return;
    }

    const finalTargetLocations = targetLocations.trim() || 'Worldwide';

    try {
      setIsSaving(true);
      const res = await api.updateCampaignSettings(campaign.id, {
        title: cleanTitle,
        url: cleanUrl,
        targetLocations: finalTargetLocations,
        deviceTargeting,
        category,
        dailyVisitLimit: Number(dailyLimit),
        durationSeconds: Number(duration)
      });

      toast({
        title: 'Settings Saved',
        description: 'Destination URL & Country targeting updated successfully.',
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

          <div className="flex items-center gap-2">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com/page"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
                title="Open destination URL in a new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Test Link</span>
              </a>
            )}
          </div>

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
