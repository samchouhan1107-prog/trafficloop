import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types.js';
import { Modal } from '../common/Modal.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { 
  Sparkles, 
  Rocket, 
  CheckCircle2, 
  Tag, 
  Coins, 
  ShieldCheck, 
  Zap, 
  TrendingUp 
} from 'lucide-react';
import { ACTIVE_BUSINESS_CATEGORIES } from './CampaignVisualBanner.js';
import { formatCredits } from '../../utils/formatters.js';

interface CampaignUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onUpgraded?: (updatedCampaign: Campaign) => void;
}

export function CampaignUpgradeModal({
  isOpen,
  onClose,
  campaign,
  onUpgraded
}: CampaignUpgradeModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [selectedTier, setSelectedTier] = useState<'pro_commercial' | 'enterprise_scale'>('pro_commercial');
  const [selectedCategory, setSelectedCategory] = useState<string>(ACTIVE_BUSINESS_CATEGORIES[0]);
  const [boostCredits, setBoostCredits] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (campaign) {
      // Pick matching active category or default to first
      const existing = ACTIVE_BUSINESS_CATEGORIES.find(c => c.toLowerCase().includes((campaign.category || '').toLowerCase()));
      setSelectedCategory(existing || ACTIVE_BUSINESS_CATEGORIES[0]);
      setSelectedTier((campaign.tier as any) === 'enterprise_scale' ? 'enterprise_scale' : 'pro_commercial');
    }
  }, [campaign]);

  if (!campaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.upgradeCampaign(campaign.id, {
        tier: selectedTier,
        category: selectedCategory,
        boostCredits: Number(boostCredits) || 0
      });

      refreshUser();
      if (onUpgraded && res.campaign) {
        onUpgraded(res.campaign);
      }

      toast({
        title: 'Campaign Upgraded Successfully!',
        description: res.message || `Campaign is now live with category ${selectedCategory}`,
        variant: 'success'
      });

      onClose();
    } catch (err: any) {
      toast({
        title: 'Upgrade Failed',
        description: err.message || 'Failed to upgrade campaign',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Campaign & Set Active Category"
      subtitle={`Campaign: "${campaign.title}"`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Explainer */}
        <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 p-3.5 text-xs text-indigo-200 flex items-start gap-3">
          <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Commercial Traffic Upgrade</h4>
            <p className="leading-relaxed text-indigo-200/90 text-xs">
              Transition out of test mode and set verified Active Business Category results. Active campaigns receive top priority in surfer queues with real-time GA4 engagement beacon delivery.
            </p>
          </div>
        </div>

        {/* Tier Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Select Campaign Tier</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedTier('pro_commercial')}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition ${
                selectedTier === 'pro_commercial'
                  ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/50'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-cyan-300">Pro Commercial</span>
                {selectedTier === 'pro_commercial' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Prioritized queue placement, deep 30s+ dwell delivery, and live visual status banners.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTier('enterprise_scale')}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition ${
                selectedTier === 'enterprise_scale'
                  ? 'border-purple-500 bg-purple-950/40 text-white ring-1 ring-purple-500/50'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-purple-300">Enterprise Scale</span>
                {selectedTier === 'enterprise_scale' && <CheckCircle2 className="h-4 w-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Maximum throughput, concurrent 3x Tri-Station bursts, and advanced geo-filtering.
              </p>
            </button>
          </div>
        </div>

        {/* Active Category Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span>Active Business Category (Rather than Test)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Active Status</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            {ACTIVE_BUSINESS_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Categorizing your campaign as active ensures high-relevance visitor matching from authentic human surfers.
          </p>
        </div>

        {/* Optional Boost Budget */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>Optional Boost Credits Allocation</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Balance: <strong className="text-white">{formatCredits(user?.credits)} CR</strong>
            </span>
          </div>
          <input
            type="number"
            min="0"
            max={user?.credits || 0}
            step="1"
            value={boostCredits}
            onChange={(e) => setBoostCredits(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
            placeholder="0"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || boostCredits > (user?.credits || 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            <span>{isSubmitting ? 'Upgrading...' : 'Apply Upgrade & Activate'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
