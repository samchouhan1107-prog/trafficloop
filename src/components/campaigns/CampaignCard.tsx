import React, { useState } from 'react';
import { Play, Pause, PlusCircle, BarChart3, Trash2, Globe, Clock, Coins, Eye, CheckCircle2, Zap, ExternalLink, Settings2, Sliders, ShieldCheck, MapPin } from 'lucide-react';
import { Campaign } from '../../types.js';
import { Badge } from '../common/Badge.js';
import { formatCredits, formatNumber } from '../../utils/formatters.js';

interface CampaignCardProps {
  key?: string;
  campaign: Campaign;
  onToggleStatus: (id: string) => void;
  onAddBudget: (campaign: Campaign) => void;
  onViewStats: (id: string) => void;
  onDelete: (id: string) => void;
  onDispatchTraffic?: (campaign: Campaign, count: number) => void;
  onTestSurf?: (campaign: Campaign) => void;
  onOpenSettings?: (campaign: Campaign) => void;
  onVerifySettings?: (campaign: Campaign) => void;
}

export function CampaignCard({
  campaign,
  onToggleStatus,
  onAddBudget,
  onViewStats,
  onDelete,
  onDispatchTraffic,
  onTestSurf,
  onOpenSettings,
  onVerifySettings
}: CampaignCardProps) {
  const [isBoosting, setIsBoosting] = useState(false);
  const budgetProgress = Math.min(100, Math.round((campaign.spent_credits / campaign.credit_budget) * 100));
  const remainingCredits = Math.max(0, Number((campaign.credit_budget - campaign.spent_credits).toFixed(2)));

  const handleQuickBoost = async (count: number) => {
    if (!onDispatchTraffic || isBoosting) return;
    setIsBoosting(true);
    try {
      await onDispatchTraffic(campaign, count);
    } finally {
      setIsBoosting(false);
    }
  };

  const getGeoMeta = (targetLocations?: string) => {
    const loc = (targetLocations || 'Worldwide').trim();
    const l = loc.toLowerCase();
    
    if (l.includes('united states') || l === 'us' || l.includes('north america') || l.includes('us/ca')) {
      return { flag: '🇺🇸', label: loc, type: 'Strict North America', color: 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300' };
    }
    if (l.includes('canada') || l === 'ca') {
      return { flag: '🇨🇦', label: loc, type: 'Strict Canada', color: 'border-rose-700/60 bg-rose-950/60 text-rose-300' };
    }
    if (l.includes('india') || l === 'in') {
      return { flag: '🇮🇳', label: loc, type: 'Strict India', color: 'border-amber-700/60 bg-amber-950/60 text-amber-300' };
    }
    if (l.includes('europe') || l.includes('germany') || l.includes('uk')) {
      return { flag: '🇪🇺', label: loc, type: 'European Union / UK', color: 'border-blue-700/60 bg-blue-950/60 text-blue-300' };
    }
    if (l.includes('tier 1')) {
      return { flag: '💎', label: loc, type: 'Tier-1 High Value', color: 'border-purple-700/60 bg-purple-950/60 text-purple-300' };
    }
    if (l.includes('australia')) {
      return { flag: '🇦🇺', label: loc, type: 'Australia Regional', color: 'border-sky-700/60 bg-sky-950/60 text-sky-300' };
    }
    if (l.includes('asia-pacific') || l.includes('apac')) {
      return { flag: '🌏', label: loc, type: 'Asia-Pacific Pool', color: 'border-cyan-700/60 bg-cyan-950/60 text-cyan-300' };
    }
    if (l.includes('botswana')) {
      return { flag: '🇧🇼', label: loc, type: 'Botswana Regional', color: 'border-teal-700/60 bg-teal-950/60 text-teal-300' };
    }
    if (l.includes('south africa')) {
      return { flag: '🇿🇦', label: loc, type: 'South Africa Regional', color: 'border-green-700/60 bg-green-950/60 text-green-300' };
    }
    return { flag: '🌐', label: 'Worldwide (Global)', type: 'Global Unrestricted', color: 'border-slate-700 bg-slate-800 text-slate-300' };
  };

  const geoMeta = getGeoMeta(campaign.target_locations);

  return (
    <div
      id={`campaign-card-${campaign.id}`}
      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm transition-all hover:border-slate-700 shadow-md"
    >
      <div>
        {/* Header line */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-slate-700">
                {campaign.category || 'Tech'}
              </span>

              {/* Geo Restriction Visual Badge */}
              <button
                type="button"
                onClick={() => onVerifySettings ? onVerifySettings(campaign) : (onOpenSettings && onOpenSettings(campaign))}
                className={`rounded px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center gap-1 shadow-sm ${geoMeta.color} hover:brightness-125`}
                title={`Active Geo-Restriction: ${geoMeta.label} (${geoMeta.type}). Click to verify routing.`}
              >
                <span>{geoMeta.flag}</span>
                <span className="truncate max-w-[120px]">{geoMeta.label}</span>
                <ShieldCheck className="h-2.5 w-2.5 text-cyan-300 shrink-0" />
              </button>

              {campaign.device_targeting && campaign.device_targeting !== 'all' && (
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                  {campaign.device_targeting === 'desktop' ? '💻 Desktop' : '📱 Mobile'}
                </span>
              )}
              <Badge status={campaign.status} />
            </div>

            <h3 className="mt-2 text-base font-bold text-white truncate" title={campaign.title}>
              {campaign.title}
            </h3>

            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{campaign.url}</span>
              </div>
              {onOpenSettings && (
                <button
                  onClick={() => onOpenSettings(campaign)}
                  className="text-[11px] font-sans text-cyan-400 hover:text-cyan-300 underline underline-offset-2 shrink-0"
                >
                  Edit Destination
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Geo Restriction Summary Strip */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 truncate text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-500 font-medium">Geo Routing:</span>
            <span className="font-bold text-white truncate">{geoMeta.label}</span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {onVerifySettings && (
              <button
                type="button"
                onClick={() => onVerifySettings(campaign)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 hover:bg-cyan-900 transition-colors"
                title="Verify if current traffic rules align with system routing configurations"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>Verify Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 text-center">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Duration</span>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-white">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>{campaign.duration_seconds}s</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Cost/Visit</span>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-amber-400">
              <Coins className="h-3 w-3" />
              <span>{formatCredits(campaign.credit_cost_per_visit)}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Visits Recv</span>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(campaign.total_visits_received)}</span>
            </div>
          </div>
        </div>

        {/* Lifetime Bonus Quota Strip */}
        {(campaign.bonus_visit_limit || 0) > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-700/40 bg-gradient-to-r from-amber-950/40 to-cyan-950/30 px-2.5 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold">Lifetime URL Bonus:</span>
              <span className="font-mono font-semibold text-white">
                {formatNumber(Math.max(0, (campaign.bonus_visit_limit || 0) - (campaign.bonus_visits_delivered || 0)))}
              </span>
              <span className="text-amber-200/80">free visits left</span>
            </div>
            <span className="text-[10px] text-amber-200/70 font-semibold">of {formatNumber(campaign.bonus_visit_limit)} lifetime</span>
          </div>
        )}

        {/* Budget Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Budget Delivery</span>
            <span className="font-semibold text-white">
              {formatCredits(campaign.spent_credits)} / {formatCredits(campaign.credit_budget)} CR ({budgetProgress}%)
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetProgress >= 100
                  ? 'bg-sky-500'
                  : budgetProgress > 80
                  ? 'bg-amber-500'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Remaining: {remainingCredits} credits</span>
            <span>Limit: {campaign.daily_visit_limit}/day</span>
          </div>
        </div>

        {/* Live Traffic Delivery Actions */}
        {campaign.status === 'active' && (remainingCredits > 0 || ((campaign.bonus_visit_limit || 0) - (campaign.bonus_visits_delivered || 0)) > 0) && (
          <div className="mt-3.5 flex items-center justify-between gap-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 p-2 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold">Live Traffic Pool Active</span>
            </div>

            <div className="flex items-center gap-1.5">
              {onTestSurf && (
                <button
                  onClick={() => onTestSurf(campaign)}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Test surf viewing this website in the exchange viewer"
                >
                  <Eye className="h-3 w-3 text-cyan-400" />
                  <span>Test Surf</span>
                </button>
              )}
              {onDispatchTraffic && (
                <button
                  disabled={isBoosting}
                  onClick={() => handleQuickBoost(5)}
                  className="flex items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-sm"
                  title="Instantly dispatch +5 live exchange visitors to this campaign"
                >
                  <Zap className="h-3 w-3 fill-slate-950" />
                  <span>{isBoosting ? 'Sending...' : '+5 Visitors'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rejection Notice if any */}
        {campaign.status === 'rejected' && campaign.rejection_reason && (
          <div className="mt-3 rounded-lg bg-rose-950/60 p-2.5 text-xs text-rose-300 border border-rose-800/50">
            <span className="font-semibold">Review Rejection Reason: </span>
            {campaign.rejection_reason}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-1.5">
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <button
              onClick={() => onToggleStatus(campaign.id)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                campaign.status === 'active'
                  ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
              }`}
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-emerald-300" />
                  <span>Resume</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onAddBudget(campaign)}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>Add Credits</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {onVerifySettings && (
            <button
              onClick={() => onVerifySettings(campaign)}
              className="flex items-center gap-1 rounded-lg border border-cyan-900/60 bg-cyan-950/60 px-2 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 hover:text-white transition-colors"
              title="Verify traffic & routing rule alignment"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Verify</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={() => onOpenSettings(campaign)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/80 px-2 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
              title="Reset destination URL & country custom options"
            >
              <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Settings</span>
            </button>
          )}

          <button
            onClick={() => onViewStats(campaign.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            title="View detailed campaign visitor statistics"
          >
            <BarChart3 className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(campaign.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
            title="Delete campaign and refund unspent credits"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

