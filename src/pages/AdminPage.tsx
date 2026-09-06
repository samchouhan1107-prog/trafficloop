import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ReviewQueue } from '../components/admin/ReviewQueue.js';
import { UserManagement } from '../components/admin/UserManagement.js';
import { PlatformSettings } from '../components/admin/PlatformSettings.js';
import { PaymentManagement } from '../components/admin/PaymentManagement.js';
import { StatCard } from '../components/common/StatCard.js';
import { Badge } from '../components/common/Badge.js';
import { Shield, Users, Layers, Sliders, BarChart3, AlertTriangle, CheckCircle2, Globe, RefreshCw, CreditCard } from 'lucide-react';
import { User, Campaign } from '../types.js';

export function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'payments' | 'users' | 'campaigns' | 'settings'>('overview');

  const [stats, setStats] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsData, reviewsData, usersData, campaignsData, settingsData, paymentsData] = await Promise.all([
        api.getAdminStats(),
        api.getReviewQueue(),
        api.getAdminUsers(),
        api.getAdminCampaigns(),
        api.getAdminSettings(),
        api.getAdminPaymentOrders('pending').catch(() => ({ pendingCount: 0, orders: [] }))
      ]);
      setStats(statsData);
      setReviews(reviewsData);
      setUsers(usersData);
      setAllCampaigns(campaignsData);
      setSettings(settingsData);
      setPendingPaymentsCount(paymentsData.pendingCount || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-rose-800 bg-rose-950/40 p-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="mt-1 text-xs text-slate-400">You must be logged into an Administrator account to view this portal.</p>
      </div>
    );
  }

  const handleReviewDecision = async (reviewId: string, decision: 'approve' | 'reject', reason?: string) => {
    await api.reviewCampaign(reviewId, decision, reason);
    loadAdminData();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-950 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>WebZoneBW Administrative Hub</span>
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">TrafficLoop Operations Center</h1>
          <p className="text-xs text-slate-400">
            Platform governance, automated threat reviews, credit reserves, and exchange integrity.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'queue'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Safety Review Queue</span>
          {reviews.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400 border border-amber-500/40">
              {reviews.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'payments'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Bank Deposits & Payments</span>
          {pendingPaymentsCount > 0 && (
            <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
              {pendingPaymentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All Campaigns ({allCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>System Parameters</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Registered Members"
              value={stats?.stats?.total_users || users.length}
              subtitle="Network accounts"
              icon={<Users className="h-5 w-5" />}
            />

            <StatCard
              title="Active Campaigns"
              value={stats?.stats?.active_campaigns || 0}
              subtitle="In real-time surf rotation"
              icon={<Globe className="h-5 w-5" />}
            />

            <StatCard
              title="Exchange Visits Today"
              value={stats?.stats?.visits_today || 0}
              subtitle="Verified human views completed"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            />

            <StatCard
              title="Circulating Credits"
              value={`${(stats?.stats?.circulating_credits || 0).toFixed(0)} CR`}
              subtitle="Total balance in user reserves"
              icon={<Shield className="h-5 w-5 text-amber-400" />}
            />
          </div>

          {/* Pending Reviews alert preview if any */}
          {reviews.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    {reviews.length} Website Campaign{reviews.length > 1 ? 's' : ''} Awaiting Manual Inspection
                  </h4>
                  <p className="text-xs text-amber-200/80">
                    Campaigns scored below automated threshold require admin verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('queue')}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Inspect Queue
              </button>
            </div>
          )}

          {/* Recent Audit Logs */}
          {stats?.recent_audit_logs && stats.recent_audit_logs.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Platform Administrative Audit Trail
              </h3>
              <div className="divide-y divide-slate-800/60 text-xs">
                {stats.recent_audit_logs.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{log.admin_name || 'Admin'}</span>
                      <span className="text-slate-400 ml-2">{log.action}</span>
                      {log.target_user_id && <span className="text-[11px] font-mono text-slate-500 ml-1">({log.target_user_id.slice(0, 8)})</span>}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <ReviewQueue
          reviews={reviews}
          onDecision={handleReviewDecision}
          onRefresh={loadAdminData}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentManagement
          onRefresh={loadAdminData}
        />
      )}

      {activeTab === 'users' && (
        <UserManagement
          users={users}
          onRefresh={loadAdminData}
        />
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Network-Wide Campaigns</h3>
            <span className="text-xs text-slate-400">{allCampaigns.length} Total Submissions</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title & Destination</th>
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Duration & Cost</th>
                  <th className="px-4 py-3 font-semibold text-right">Budget Spent / Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {allCampaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white truncate max-w-xs">{c.title}</div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate max-w-xs">{c.url}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{c.user_name || 'Member'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.user_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {c.duration_seconds}s ({c.credit_cost_per_visit.toFixed(2)} CR/visit)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-200">
                      {c.spent_credits.toFixed(2)} / {c.credit_budget.toFixed(2)} CR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <PlatformSettings
          settings={settings}
          onRefresh={loadAdminData}
        />
      )}
    </div>
  );
}
