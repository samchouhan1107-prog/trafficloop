import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Campaign } from '../types.js';
import { CampaignCard } from '../components/campaigns/CampaignCard.js';
import { CampaignFormModal } from '../components/campaigns/CampaignFormModal.js';
import { CampaignStatsModal } from '../components/campaigns/CampaignStatsModal.js';
import { CampaignSettingsModal } from '../components/campaigns/CampaignSettingsModal.js';
import { CampaignVerifySettingsModal } from '../components/campaigns/CampaignVerifySettingsModal.js';
import { BuyCreditsModal } from '../components/payments/BuyCreditsModal.js';
import { Modal } from '../components/common/Modal.js';
import { useVisibilityPoll } from '../hooks/useVisibilityPoll.js';
import { Plus, Search, Filter, Globe, Sparkles, Building2, Zap, ShieldCheck, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCredits } from '../utils/formatters.js';

interface CampaignsPageProps {
  onNavigate: (path: string) => void;
}

export function CampaignsPage({ onNavigate }: CampaignsPageProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedStatsCampaignId, setSelectedStatsCampaignId] = useState<string | null>(null);
  const [budgetModalCampaign, setBudgetModalCampaign] = useState<Campaign | null>(null);
  const [settingsModalCampaign, setSettingsModalCampaign] = useState<Campaign | null>(null);
  const [verifyModalCampaign, setVerifyModalCampaign] = useState<Campaign | null>(null);
  const [addBudgetAmount, setAddBudgetAmount] = useState<number>(10);
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  const fetchCampaigns = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await api.getUserCampaigns();
      setCampaigns(data);
    } catch {
      // Handled
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Poll while visible only (auto-pauses when tab hidden)
  useVisibilityPoll(() => fetchCampaigns(true), 6000, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleCampaignStatus(id);
      fetchCampaigns(true);
    } catch (err: any) {
      toast({
        title: 'Toggle Error',
        description: err.message,
        variant: 'error'
      });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? Unspent credits will be refunded to your balance.')) return;
    try {
      await api.deleteCampaign(id);
      refreshUser();
      fetchCampaigns(true);
      toast({
        title: 'Campaign Deleted',
        description: 'Unspent budget has been returned to your wallet.',
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
      fetchCampaigns(true);
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
      fetchCampaigns(true);
      toast({
        title: 'Credits Added',
        description: `Added +${addBudgetAmount} CR to ${budgetModalCampaign.title}`,
        variant: 'success'
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Add Credits',
        description: err.message,
        variant: 'error'
      });
    } finally {
      setIsAddingBudget(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Campaign Management</h1>
          <p className="text-xs text-slate-400">
            Create, monitor, and configure websites receiving verified traffic in the network.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="campaigns-buy-btn"
            onClick={() => setIsBuyModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-700/80 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-all"
          >
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Buy Credits</span>
          </button>

          <button
            id="campaigns-new-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Campaign</span>
          </button>
        </div>
      </div>

      {/* Geo Routing & Rule Alignment Helper Bar */}
      {campaigns.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">Geo-Targeting & Network Routing Engine</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/80">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>GA4 UIP Override Active</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                    {campaigns.filter(c => c.target_locations && c.target_locations.toLowerCase() !== 'worldwide').length} Geo-Targeted / {campaigns.length} Total
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Traffic delivery resolves residential/ISP pools matching your campaign geo-rules and sets real-time GA4 Measurement attribution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetCamp = campaigns.find(c => c.status === 'active') || campaigns[0];
                  if (targetCamp) setVerifyModalCampaign(targetCamp);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800 bg-cyan-950/80 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900 transition-colors shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verify Active Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'active', 'pending_review', 'paused', 'completed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of campaigns */}
      {filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-white">No campaigns found</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'No campaigns match your search and filter criteria.'
              : 'Submit your first website campaign to begin receiving real human traffic.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((camp) => (
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
              onVerifySettings={(c) => setVerifyModalCampaign(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CampaignFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={() => {
          refreshUser();
          fetchCampaigns();
        }}
        userCredits={user?.credits || 0}
      />

      <CampaignSettingsModal
        isOpen={!!settingsModalCampaign}
        onClose={() => setSettingsModalCampaign(null)}
        campaign={settingsModalCampaign}
        onCampaignUpdated={(updated) => {
          setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
          fetchCampaigns(true);
        }}
      />

      <CampaignVerifySettingsModal
        isOpen={!!verifyModalCampaign}
        onClose={() => setVerifyModalCampaign(null)}
        campaign={verifyModalCampaign}
        onOpenSettings={(c) => setSettingsModalCampaign(c)}
        onTestSurf={handleTestSurf}
      />

      <CampaignStatsModal
        campaignId={selectedStatsCampaignId}
        isOpen={!!selectedStatsCampaignId}
        onClose={() => setSelectedStatsCampaignId(null)}
      />

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
    </div>
  );
}
