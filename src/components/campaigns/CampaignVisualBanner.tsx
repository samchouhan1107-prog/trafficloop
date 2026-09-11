import React, { useState } from 'react';
import { Campaign } from '../../types.js';
import { 
  Rocket, 
  Sparkles, 
  FlaskConical, 
  Activity, 
  Clock, 
  Globe, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters.js';

interface CampaignVisualBannerProps {
  campaign: Campaign;
  onActivateTestCampaign?: (campaignId: string) => Promise<void>;
  onOpenUpgradeModal?: (campaign: Campaign) => void;
  compact?: boolean;
}

export const ACTIVE_BUSINESS_CATEGORIES = [
  'E-Commerce & Retail (Active)',
  'SaaS & Software (Active)',
  'Finance & Banking (Active)',
  'Health & Wellness (Active)',
  'Media, News & Blogs (Active)',
  'Local Business & Services (Active)',
  'Crypto & Web3 (Active)',
  'Education & Learning (Active)'
];

export function CampaignVisualBanner({
  campaign,
  onActivateTestCampaign,
  onOpenUpgradeModal,
  compact = false
}: CampaignVisualBannerProps) {
  const [isActivating, setIsActivating] = useState(false);
  const isTest = campaign.status === 'test';
  const isActive = campaign.status === 'active';

  const handleQuickActivate = async () => {
    if (!onActivateTestCampaign) return;
    try {
      setIsActivating(true);
      await onActivateTestCampaign(campaign.id);
    } finally {
      setIsActivating(false);
    }
  };

  if (isTest) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 p-3 text-xs shadow-inner space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <FlaskConical className="h-4 w-4 animate-bounce text-amber-400" />
            <span className="tracking-wide uppercase text-[11px]">In Test Mode (Pre-Flight)</span>
          </div>

          <span className="rounded-full bg-amber-900/60 border border-amber-700/60 px-2 py-0.2 text-[10px] font-semibold text-amber-300">
            Dry-Run Beacons
          </span>
        </div>

        <p className="text-[11px] text-amber-200/80 leading-snug">
          Verifying destination and GA4 measurement tags. Real human surfer traffic is on standby.
        </p>

        {/* Upgrade & Transition Action Bar */}
        <div className="flex items-center justify-between pt-1 gap-2 border-t border-amber-800/40">
          <button
            id={`btn-upgrade-test-${campaign.id}`}
            onClick={() => onOpenUpgradeModal && onOpenUpgradeModal(campaign)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-white transition"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Set Active Category & Upgrade</span>
          </button>

          <button
            id={`btn-activate-test-${campaign.id}`}
            onClick={handleQuickActivate}
            disabled={isActivating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>{isActivating ? 'Activating...' : 'Activate Live'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Active / Live Banner
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 p-3 text-xs shadow-sm space-y-2">
      {/* Short Banner Top Strip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide uppercase text-[10px] font-mono">Live Traffic Active</span>
        </div>

        {/* Active Category Display */}
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-emerald-400" />
          <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.2 text-[10px] font-semibold text-emerald-300">
            {campaign.category.includes('Active') ? campaign.category : `Active: ${campaign.category}`}
          </span>
        </div>
      </div>

      {/* Visual Short Banner Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-1.5 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Verified Visits</span>
          <span className="text-xs font-bold text-white font-mono mt-0.5 block">
            {formatNumber(campaign.total_visits_received || 0)}
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-1.5 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Dwell Target</span>
          <span className="text-xs font-bold text-cyan-400 font-mono mt-0.5 block">
            {campaign.duration_seconds}s
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-1.5 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Tier Class</span>
          <span className="text-xs font-bold text-indigo-300 font-mono mt-0.5 block uppercase truncate">
            {campaign.tier || 'Standard'}
          </span>
        </div>
      </div>

      {/* Quick Upgrade Button */}
      {!compact && onOpenUpgradeModal && (
        <div className="flex items-center justify-end pt-1">
          <button
            onClick={() => onOpenUpgradeModal(campaign)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <Sparkles className="h-3 w-3" />
            <span>Upgrade Tier / Boost</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
