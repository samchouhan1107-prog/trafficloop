import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { StatCard } from '../components/common/StatCard.js';
import { CampaignCard } from '../components/campaigns/CampaignCard.js';
import { CampaignFormModal } from '../components/campaigns/CampaignFormModal.js';
import { CampaignStatsModal } from '../components/campaigns/CampaignStatsModal.js';
import { CampaignSettingsModal } from '../components/campaigns/CampaignSettingsModal.js';
import { BuyCreditsModal } from '../components/payments/BuyCreditsModal.js';
import { CurrencyValuationCard } from '../components/common/CurrencyValuationCard.js';
import { DailySignInBonusModal } from '../components/dashboard/DailySignInBonusModal.js';
import { DailyBonusBanner } from '../components/dashboard/DailyBonusBanner.js';
import { Modal } from '../components/common/Modal.js';
import { Coins, Play, Eye, Flame, Plus, Gift, CheckCircle2, Clock, Globe, ArrowRight, Activity, Building2, Zap, Monitor, Timer, BarChart3, Layers } from 'lucide-react';
import { Campaign, DailyBonusStatus, TimeLapAnalyticsResponse } from '../types.js';
import { formatCredits, formatInr, formatNumber } from '../utils/formatters.js';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, refreshUser, claimDailyBonus } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [timeLapData, setTimeLapData] = useState<TimeLapAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [selectedStatsCampaignId, setSelectedStatsCampaignId] = useState<string | null>(null);
  const [budgetModalCampaign, setBudgetModalCampaign] = useState<Campaign | null>(null);
  const [settingsModalCampaign, setSettingsModalCampaign] = useState<Campaign | null>(null);
  const [addBudgetAmount, setAddBudgetAmount] = useState<number>(10);
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  // Daily Bonus State (Deterministic 24-hour cycle with bonus options)
  const [dailyBonusStatus, setDailyBonusStatus] = useState<DailyBonusStatus | null>(null);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [statsData, campaignsData, bonusStatusData, lapResp] = await Promise.all([
        api.getUserDashboardStats(),
        api.getUserCampaigns(),
        api.getDailyBonusStatus().catch(() => null),
        api.getTimeLapAnalytics({ timeRange: '7d' }).catch(() => null)
      ]);
      setStats(statsData);
      setCampaigns(campaignsData);
      if (lapResp) {
        setTimeLapData(lapResp);
      }
      if (bonusStatusData) {
        setDailyBonusStatus(bonusStatusData);
        // If eligible for daily return bonus and hasn't dismissed yet, prompt the user with bonus options
        const dismissedSession = sessionStorage.getItem('dismissed_daily_bonus_prompt');
        if (bonusStatusData.eligible && !dismissedSession) {
          setIsBonusModalOpen(true);
        }
      }
    } catch {
      // Handled
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimBonusOption = async (optionId: string = 'ten_thousand_visits_boost') => {
    try {
      setIsClaimingBonus(true);
      const res = await claimDailyBonus(optionId);
      if (res.success) {
        setBonusMessage(res.message);
        refreshUser();
        const updatedStatus = await api.getDailyBonusStatus().catch(() => null);
        if (updatedStatus) setDailyBonusStatus(updatedStatus);
      } else {
        setBonusMessage(res.message || 'Daily bonus already claimed for today.');
      }
    } catch (err: any) {
      setBonusMessage(err.message || 'Already claimed today.');
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const handleCloseBonusModal = () => {
    setIsBonusModalOpen(false);
    sessionStorage.setItem('dismissed_daily_bonus_prompt', 'true');
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleCampaignStatus(id);
      loadDashboard(true);
    } catch (err: any) {
      toast({
        title: 'Toggle Error',
        description: err.message,
        variant: 'error'
      });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? Any unspent credits will be refunded to your balance.')) return;
    try {
      await api.deleteCampaign(id);
      refreshUser();
      loadDashboard(true);
      toast({
        title: 'Campaign Deleted',
        description: 'Unspent credits refunded.',
        variant: 'success'
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message,
        variant: 'error'
      });
    }
  };

  const handleDispatchTraffic = async (campaign: Campaign, count: number) => {
    try {
      const res = await api.dispatchCampaignTraffic(campaign.id, count);
      toast({
        title: '⚡ Live Visitors Dispatched',
        description: res.message,
        variant: 'success'
      });
      loadDashboard(true);
      refreshUser();
    } catch (err: any) {
      toast({
        title: 'Dispatch Failed',
        description: err.message,
        variant: 'error'
      });
    }
  };

  const handleTestSurf = (campaign: Campaign) => {
    onNavigate(`/surf?campaignId=${campaign.id}`);
  };

  const handleAddBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetModalCampaign) return;
    try {
      setIsAddingBudget(true);
      await api.addCampaignBudget(budgetModalCampaign.id, Number(addBudgetAmount));
      setBudgetModalCampaign(null);
      refreshUser();
      loadDashboard(true);
      toast({
        title: 'Credits Added',
        description: `Successfully added ${addBudgetAmount} CR to ${budgetModalCampaign.title}`,
        variant: 'success'
      });
    } catch (err: any) {
      toast({
        title: 'Budget Error',
        description: err.message,
        variant: 'error'
      });
    } finally {
      setIsAddingBudget(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-950 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-800/60">
                Surfer Dashboard
              </span>
              <span className="text-xs text-slate-400">Welcome back, {user?.name}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Traffic Exchange Command
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              Earn credits by visiting websites in the network or deploy active campaigns to drive authentic human visitors to your projects.
            </p>
          </div>

          {/* Large Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-start-surf-btn"
              onClick={() => onNavigate('/surf')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/60 hover:from-cyan-400 hover:to-sky-400 transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch Surfer</span>
            </button>

            <button
              id="dash-rewards-btn"
              onClick={() => onNavigate('/rewards')}
              className="flex items-center gap-2 rounded-xl border border-emerald-700/80 bg-emerald-950/50 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-all shadow-md shadow-emerald-950"
            >
              <Gift className="h-4 w-4 text-emerald-400" />
              <span>Rewards & India (450K)</span>
            </button>

            <button
              id="dash-tri-station-btn"
              onClick={() => onNavigate('/tri-station')}
              className="flex items-center gap-2 rounded-xl border border-cyan-700/80 bg-cyan-950/50 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all shadow-md shadow-cyan-950"
            >
              <Monitor className="h-4 w-4 text-cyan-400" />
              <span>Tri-Station (3x)</span>
            </button>

            <button
              id="dash-create-campaign-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>New Campaign</span>
            </button>

            <button
              id="dash-buy-credits-btn"
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-emerald-700/80 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-all"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Buy Credits / Bank</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-credits-balance"
          title="Credit Balance"
          value={`${formatCredits(user?.credits)} CR`}
          subtitle={`Valuation: ${user?.formatted_inr_balance || formatInr((user?.credits || 0) * 1.5)} (Real-Time)`}
          icon={<Coins className="h-5 w-5" />}
          highlight={true}
        />

        <StatCard
          id="stat-visits-today"
          title="Surfed Today"
          value={formatNumber(stats?.stats?.visits_made_today || 0)}
          subtitle="Verified visits performed today"
          icon={<Eye className="h-5 w-5" />}
        />

        <StatCard
          id="stat-traffic-received"
          title="Visits Received"
          value={formatNumber(stats?.stats?.total_visits_received ?? user?.total_visits_received ?? 0)}
          subtitle={`Delivered to your active URLs (${stats?.stats?.today_visits_received || 0} today)`}
          icon={<Globe className="h-5 w-5" />}
        />

        <StatCard
          id="stat-lifetime-earned"
          title="Total Credits Earned"
          value={`${formatCredits(user?.total_earned_credits)} CR`}
          subtitle={`${formatInr((user?.total_earned_credits || 0) * 1.5)} equivalent earned`}
          icon={<Flame className="h-5 w-5" />}
        />
      </div>

      {/* Real-time Currency Valuation & Market Rates */}
      <CurrencyValuationCard
        creditBalance={user?.credits || 0}
        preferredCurrency={user?.preferred_currency || 'INR'}
      />

      {/* Daily Reward Banner (Deterministic 24-hour cycle with 10,000 visits options) */}
      <DailyBonusBanner
        status={dailyBonusStatus}
        onOpenModal={() => setIsBonusModalOpen(true)}
        onQuickClaim={(optionId) => handleClaimBonusOption(optionId || 'ten_thousand_visits_boost')}
        isClaiming={isClaimingBonus}
        successMessage={bonusMessage}
      />

      {/* Active Campaigns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Your Campaigns</h3>
            <p className="text-xs text-slate-400">Manage destination URLs, duration rules, and budget delivery.</p>
          </div>

          <button
            onClick={() => onNavigate('/campaigns')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <span>View All ({campaigns.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <Globe className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-white">No active campaigns yet</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Submit your website or blog to start receiving genuine verified human visits from surfers worldwide.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Campaign</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.slice(0, 3).map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                onToggleStatus={handleToggleStatus}
                onAddBudget={(c) => setBudgetModalCampaign(c)}
                onViewStats={(id) => setSelectedStatsCampaignId(id)}
                onDelete={handleDeleteCampaign}
                onDispatchTraffic={handleDispatchTraffic}
                onTestSurf={handleTestSurf}
                onOpenSettings={(c) => setSettingsModalCampaign(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Page Counts in Time Lap & User Dwell Duration Snapshot */}
      {timeLapData && timeLapData.pages.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-2 text-indigo-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Page Counts in Time Laps & Dwell Duration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown of how much active time users spent exploring your destination URLs.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/analytics')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <span>View Full Lap Matrix ({timeLapData.pages.length} Pages)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Total User Time Spent</span>
              <span className="text-base font-bold text-indigo-300 font-mono mt-0.5 block truncate">
                {timeLapData.summary.totalTimeSpentFormatted}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Avg Dwell Per User</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {timeLapData.summary.overallAvgDwellSeconds}s
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Deep Reads (≥30s)</span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
                {timeLapData.summary.deepEngagementRate}%
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Dominant Lap Tier</span>
              <span className="text-xs font-bold text-purple-300 font-mono mt-1 block truncate">
                {timeLapData.summary.mostPopularLapLabel}
              </span>
            </div>
          </div>

          {/* Top 2 Pages Mini-List */}
          <div className="space-y-2 pt-1">
            {timeLapData.pages.slice(0, 2).map((p, idx) => (
              <div
                key={p.campaignId || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="min-w-0 max-w-sm">
                  <div className="font-semibold text-white truncate">{p.campaignTitle}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{p.url}</div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px]">
                  <span className="text-slate-300"><strong>{p.totalVisits}</strong> visits</span>
                  <span className="text-indigo-300"><strong>{p.totalTimeSpentFormatted}</strong> spent</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    avg {p.avgDwellSeconds}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Recent Account Activity</span>
          </h3>

          <div className="divide-y divide-slate-800/60 text-xs">
            {stats.recent_activity.slice(0, 5).map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-300">{item.action}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Settings & Destination Reset Modal */}
      <CampaignSettingsModal
        isOpen={!!settingsModalCampaign}
        onClose={() => setSettingsModalCampaign(null)}
        campaign={settingsModalCampaign}
        onCampaignUpdated={(updated) => {
          setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
          loadDashboard(true);
        }}
      />

      {/* Campaign Creation Modal */}
      <CampaignFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={() => {
          refreshUser();
          loadDashboard();
        }}
        userCredits={user?.credits || 0}
      />

      {/* Campaign Stats Modal */}
      <CampaignStatsModal
        campaignId={selectedStatsCampaignId}
        isOpen={!!selectedStatsCampaignId}
        onClose={() => setSelectedStatsCampaignId(null)}
      />

      {/* Buy Credits / Bank Deposit Modal */}
      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false);
          refreshUser();
        }}
      />

      {/* Add Budget Modal */}
      <Modal
        isOpen={!!budgetModalCampaign}
        onClose={() => setBudgetModalCampaign(null)}
        title={`Add Credits to ${budgetModalCampaign?.title || ''}`}
        subtitle={`Available balance: ${formatCredits(user?.credits)} CR`}
        maxWidth="sm"
      >
        <form onSubmit={handleAddBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Credits to Add</label>
            <input
              type="number"
              min="1"
              max={user?.credits || 0}
              step="1"
              required
              value={addBudgetAmount}
              onChange={(e) => setAddBudgetAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white font-bold focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setBudgetModalCampaign(null)}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingBudget || addBudgetAmount > (user?.credits || 0)}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {isAddingBudget ? 'Adding...' : 'Allocate Credits'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Daily Sign-In & 24-Hour Return Bonus Options Modal */}
      <DailySignInBonusModal
        isOpen={isBonusModalOpen}
        onClose={handleCloseBonusModal}
        status={dailyBonusStatus}
        onClaim={handleClaimBonusOption}
        isClaiming={isClaimingBonus}
      />
    </div>
  );
}
