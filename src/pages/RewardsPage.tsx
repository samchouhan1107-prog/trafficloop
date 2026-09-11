import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { 
  Gift, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Coins, 
  Globe, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Lock, 
  AlertCircle,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Award,
  Layers,
  BarChart3,
  Calendar,
  IndianRupee,
  CheckCheck,
  UserCheck,
  Target,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  RewardsSummaryResponse, 
  RewardsActivityResponse, 
  RewardsEligibilityResponse, 
  RewardLedgerEntry,
  ClaimRewardResult 
} from '../types.js';
import { formatCredits, formatInr } from '../utils/formatters.js';

interface RewardsPageProps {
  onNavigate: (path: string) => void;
}

export function RewardsPage({ onNavigate }: RewardsPageProps) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();
  const token = api.getToken();

  const [summary, setSummary] = useState<RewardsSummaryResponse | null>(null);
  const [activity, setActivity] = useState<RewardsActivityResponse | null>(null);
  const [eligibility, setEligibility] = useState<RewardsEligibilityResponse | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'activity' | 'ledger' | 'anti-fraud'>('activity');

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [lastClaimResult, setLastClaimResult] = useState<ClaimRewardResult | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Load summary and user data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      const currentToken = api.getToken();
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // Fetch summary
      const sumRes = await fetch('/api/rewards/summary', { headers });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      // If authenticated, fetch activity and eligibility
      if (currentToken) {
        const [actRes, eligRes] = await Promise.all([
          fetch('/api/rewards/activity', { headers }),
          fetch('/api/rewards/eligibility?limit=50', { headers })
        ]);

        if (actRes.ok) {
          const actData = await actRes.json();
          setActivity(actData);
        }
        if (eligRes.ok) {
          const eligData = await eligRes.json();
          setEligibility(eligData);
        }
      }
    } catch (err: any) {
      console.error('Failed to load rewards data:', err);
      toast.error('Failed to load rewards data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();

    const handlePointsUpdated = () => {
      fetchData();
    };

    window.addEventListener('rewards_points_updated', handlePointsUpdated);
    return () => {
      window.removeEventListener('rewards_points_updated', handlePointsUpdated);
    };
  }, [fetchData]);

  // Claim Single or All Eligible Rewards
  const handleClaim = async (rewardId?: string) => {
    if (!isAuthenticated) {
      onNavigate('/login');
      return;
    }

    setIsClaiming(true);
    if (rewardId) {
      setClaimingItemId(rewardId);
    }

    try {
      const currentToken = api.getToken();
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(rewardId ? { rewardId } : { claimAll: true })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to collect rewards');
      }

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setLastClaimResult(data);
      toast.success(data.message || `Successfully collected ₹${data.claimedInr} INR!`);

      // Refresh data
      await fetchData();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Reward collection failed');
    } finally {
      setIsClaiming(false);
      setClaimingItemId(null);
    }
  };

  const indiaCampaign = summary?.indiaCampaign;
  const userRewards = summary?.userRewards;
  const analytics = summary?.analytics;
  const monthlyPoints = summary?.monthlyPoints;

  const filteredLedger = eligibility?.items.filter(item => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  }) || [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Refresh Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Gift className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Sign In & Rewards Engine
            </h1>
            <span className="rounded-full bg-cyan-950/90 border border-cyan-800/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              Live Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track verified activity, support legitimate traffic campaigns, and collect immutable ledger rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-rewards-btn"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                id="rewards-top-signin-btn"
                onClick={() => onNavigate('/login')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Sign In
              </button>
              <button
                id="rewards-top-register-btn"
                onClick={() => onNavigate('/register')}
                className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-950/50"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs text-slate-400">
                Logged in as <strong className="text-slate-200">{user?.name}</strong>
              </span>
              <button
                id="rewards-top-surf-btn"
                onClick={() => onNavigate('/surf')}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-md shadow-cyan-950/40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Earn More Rewards</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: WELCOME & AUTHENTICATION STATE */}
      <div 
        id="section-welcome-auth" 
        className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-lg relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        {!isAuthenticated ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <UserCheck className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Welcome to TrafficLoop Rewards
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Sign in or create your free account to track your verified dwell visits, qualify for regional campaign rewards, and collect available balances in your tamper-proof ledger.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Cryptographic Session Verification
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Coins className="h-3.5 w-3.5" />
                  Welcome Bonus: +15 CR (₹22.50 INR)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  Anti-Replay Fraud Protection
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                id="welcome-signin-action-btn"
                onClick={() => onNavigate('/login')}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 hover:border-slate-600 transition-all shadow-sm"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
              <button
                id="welcome-register-action-btn"
                onClick={() => onNavigate('/register')}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-lg shadow-cyan-950/60"
              >
                <span>Create Account</span>
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Welcome back, {user?.name}!
                </h2>
                <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800/80">
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected: <span className="text-slate-300">{user?.email}</span> · Primary Region: <span className="text-slate-300">{user?.location || 'India'}</span> · Preferred Currency: <span className="text-cyan-400 font-semibold">{user?.preferred_currency || 'INR'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-400">Total Credits</span>
                <span className="text-sm font-bold text-white">{formatCredits(user?.credits)} CR</span>
                <span className="text-[11px] text-emerald-400 font-medium ml-1.5">({user?.formatted_inr_balance || formatInr((user?.credits || 0) * 1.5)})</span>
              </div>
              <button
                id="welcome-profile-btn"
                onClick={() => onNavigate('/profile')}
                className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Profile & Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: MONTHLY TARGET & POINTS PROJECTION ENGINE */}
      <div 
        id="section-monthly-points-engine"
        className="rounded-xl border border-cyan-900/60 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header with Title and Dynamic Month Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-700/60 text-cyan-400 shadow-md">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  MONTHLY TARGET & POINTS PROJECTION
                </h2>
                <span className="rounded-full bg-cyan-950/80 border border-cyan-700/70 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                  {(monthlyPoints?.monthlyTarget || 450000).toLocaleString()} PTS Target
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic daily pacing & verified qualifying activity extrapolation for {monthlyPoints?.monthLabel || 'Current Month'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-300 flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>{monthlyPoints?.daysInCurrentMonth || 30} Days in Month</span>
            </span>
            <span className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-300 font-medium">
              Day <strong className="text-cyan-300">{monthlyPoints?.elapsedDays || 1}</strong> of {monthlyPoints?.daysInCurrentMonth || 30} ({monthlyPoints?.remainingDays || 0} remaining)
            </span>
          </div>
        </div>

        {/* Key Metrics Grid (All 9 Server-Derived Variables) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Monthly Target */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Monthly Target
            </span>
            <span className="text-xl sm:text-2xl font-black text-white block">
              {(monthlyPoints?.monthlyTarget || 450000).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Points goal
            </span>
          </div>

          {/* 2. Daily Target (Dynamic: monthlyTarget / daysInCurrentMonth) */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
              Daily Target Pace
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 block">
              {(monthlyPoints?.dailyTarget || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              pts/day ({monthlyPoints?.monthlyTarget || 450000} ÷ {monthlyPoints?.daysInCurrentMonth || 30}d)
            </span>
          </div>

          {/* 3. Current-Month Points */}
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
              Current-Month Points
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300 block">
              {(monthlyPoints?.currentMonthPoints || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400/80 font-medium block">
              {monthlyPoints?.qualifyingEventsCount || 0} qualifying events
            </span>
          </div>

          {/* 4. Daily Average */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
              Daily Average
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 block">
              {(monthlyPoints?.dailyAverage || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              pts/day earned so far
            </span>
          </div>

          {/* 5. Projected Monthly Points */}
          <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/30 p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Projected Monthly
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-200 block">
              {(monthlyPoints?.projectedMonthlyPoints || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-indigo-400 font-medium block">
              Paced forecast (extrapolated)
            </span>
          </div>
        </div>

        {/* Secondary Row: Current Points, Today's Points, This Week's Points, Remaining Points, Target Progress % */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
          {/* Current Points (Total Persisted Account Balance) */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Total Points</span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {(monthlyPoints?.currentPoints || 0).toLocaleString()} PTS
            </span>
            <span className="text-[10px] text-slate-400">Persisted balance</span>
          </div>

          {/* Today's Points */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Points</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              +{(monthlyPoints?.todayPoints || 0).toLocaleString()} PTS
            </span>
            <span className="text-[10px] text-slate-400">Earned today</span>
          </div>

          {/* This Week's Points */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">This Week's Points</span>
            <span className="text-lg font-bold text-cyan-400 mt-0.5 block">
              +{(monthlyPoints?.thisWeekPoints || 0).toLocaleString()} PTS
            </span>
            <span className="text-[10px] text-slate-400">Current calendar week</span>
          </div>

          {/* Remaining Points */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining to Target</span>
            <span className="text-lg font-bold text-slate-200 mt-0.5 block">
              {(monthlyPoints?.remainingPoints || 0).toLocaleString()} PTS
            </span>
            <span className="text-[10px] text-slate-400">Points remaining</span>
          </div>

          {/* Target Progress Percentage */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Progress</span>
            <span className="text-lg font-bold text-cyan-300 mt-0.5 block">
              {(monthlyPoints?.targetProgressPercentage || 0).toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400">Of 450K goal reached</span>
          </div>
        </div>

        {/* Progress Bar & Pace Comparison */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Monthly Points Progress</span>
              <span className="text-slate-400">
                ({(monthlyPoints?.currentMonthPoints || 0).toLocaleString()} / {(monthlyPoints?.monthlyTarget || 450000).toLocaleString()} PTS)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Current Earned: {(monthlyPoints?.currentMonthPoints || 0).toLocaleString()} PTS
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Projected: {(monthlyPoints?.projectedMonthlyPoints || 0).toLocaleString()} PTS
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5 relative">
            {/* Projected indicator */}
            <div 
              className="bg-indigo-500/40 h-full rounded-full absolute top-0.5 left-0.5 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, ((monthlyPoints?.projectedMonthlyPoints || 0) / (monthlyPoints?.monthlyTarget || 450000)) * 100))}%` }}
            />
            {/* Actual earned points */}
            <div 
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 relative z-10"
              style={{ width: `${Math.min(100, Math.max(0.5, ((monthlyPoints?.currentMonthPoints || 0) / (monthlyPoints?.monthlyTarget || 450000)) * 100))}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
            <span>
              Dynamic Daily Target: <strong className="text-slate-200">{(monthlyPoints?.dailyTarget || 0).toLocaleString()} PTS / day</strong> dynamically calculated for {monthlyPoints?.daysInCurrentMonth || 30} days in {monthlyPoints?.monthLabel || 'the month'}.
            </span>
            <span className="text-slate-400">
              Extrapolation Formula: <code className="text-cyan-300 font-mono">(Current Qualifying Points ÷ Elapsed Days) × Total Month Days</code>
            </span>
          </div>
        </div>

        {/* Transparency Notice & Live Earning Callouts */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Authentic User Activity Rule</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Points originate solely from authentic, verifiable user actions (feature exploration, verified surf session dwells, tri-station rotation, campaign management). Projected monthly points is a statistical extrapolation based on elapsed days and does not count as earned points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="monthly-points-explore-btn"
              onClick={() => onNavigate('/dashboard')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Explore Dashboard
            </button>
            <button
              id="monthly-points-surf-btn"
              onClick={() => onNavigate('/surf')}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-md shadow-cyan-950/50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Surf & Earn Points</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: GRID (INDIA CAMPAIGN 450K TARGET + YOUR REWARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 🇮🇳 INDIA CAMPAIGN TARGET (450,000 Verified Monthly Visitors) */}
        <div 
          id="section-india-campaign" 
          className="lg:col-span-6 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-lg space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" role="img" aria-label="India Flag">🇮🇳</span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>INDIA CAMPAIGN</span>
                  <span className="rounded bg-indigo-950/80 px-2 py-0.2 text-[10px] font-semibold text-indigo-300 border border-indigo-800/80">
                    Regional Target
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Target: 450,000 Verified Monthly Visitors from India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>GA4 Connected</span>
            </div>
          </div>

          {/* Target Counter Box */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/90 p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Verified Monthly Visitors ({indiaCampaign?.currentMonthLabel || 'This Month'})
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {(indiaCampaign?.verifiedMonthlyVisitors || 0).toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    / 450,000 Target
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold text-cyan-400">
                  {indiaCampaign?.progressPercentage ? indiaCampaign.progressPercentage.toFixed(3) : '0.000'}%
                </span>
                <span className="block text-[10px] text-slate-400">Paced Delivery</span>
              </div>
            </div>

            {/* High Precision Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 via-white to-emerald-500 h-full rounded-full transition-all duration-500 relative"
                style={{ width: `${Math.min(100, Math.max(0.5, indiaCampaign?.progressPercentage || 0.5))}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Verification Metadata Footnote */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">Avg Dwell Duration</span>
                <strong className="text-slate-200">{indiaCampaign?.avgDwellSeconds || 24}s / session</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Active India Campaigns</span>
                <strong className="text-slate-200">{indiaCampaign?.activeCampaignsTargetingIndia || 3} Campaigns</strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block">Status</span>
                <strong className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Real Verified Only
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/60">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Strict Anti-Spoof Policy: The 450,000 monthly metric is calculated solely from authentic, verified HTTP/200 completed dwell observations (`visitor_country_code = 'IN'`). Synthetic scripts, health checks, and unverified bots are strictly excluded.
            </p>
          </div>
        </div>

        {/* 🎁 YOUR REWARDS & COLLECTION ENGINE */}
        <div 
          id="section-your-rewards" 
          className="lg:col-span-6 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-lg flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-400 shadow-inner">
                <Gift className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">YOUR REWARDS</h3>
                <p className="text-xs text-slate-400">Available verified balances & collection</p>
              </div>
            </div>

            {userRewards?.eligibleRewardsCount && userRewards.eligibleRewardsCount > 0 ? (
              <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700/60 animate-bounce">
                {userRewards.eligibleRewardsCount} Available
              </span>
            ) : null}
          </div>

          {/* Reward Metrics 3-Column Box */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Activity</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-1 block">
                {isAuthenticated ? (userRewards?.verifiedActivityCount || 0) : 0}
              </span>
              <span className="text-[10px] text-slate-400">Sessions</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Eligible Rewards</span>
              <span className="text-lg sm:text-xl font-bold text-cyan-400 mt-1 block">
                {isAuthenticated ? (userRewards?.eligibleRewardsCount || 0) : 0}
              </span>
              <span className="text-[10px] text-slate-400">Unclaimed</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available to Collect</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1 block">
                ₹{isAuthenticated ? (userRewards?.availableToCollectInr || 0) : 0}
              </span>
              <span className="text-[10px] text-slate-400">
                +{isAuthenticated ? (userRewards?.availableToCollectCredits || 0) : 0} CR
              </span>
            </div>
          </div>

          {/* Success Banner if recently claimed */}
          {lastClaimResult && (
            <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/50 p-3 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{lastClaimResult.message}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 opacity-80">
                Ref: {lastClaimResult.transactionId.slice(0, 8)}...
              </span>
            </div>
          )}

          {/* Collection CTA Button */}
          <div className="pt-2">
            {!isAuthenticated ? (
              <button
                id="rewards-claim-login-cta-btn"
                onClick={() => onNavigate('/login')}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-all shadow-md"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Sign In to Collect Rewards</span>
              </button>
            ) : (
              <button
                id="rewards-collect-all-btn"
                onClick={() => handleClaim()}
                disabled={isClaiming || !userRewards || userRewards.availableToCollectInr <= 0}
                className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  {isClaiming ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing Settlement...</span>
                    </>
                  ) : userRewards && userRewards.availableToCollectInr > 0 ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Collect All Available Rewards (₹{userRewards.availableToCollectInr} INR)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>All Eligible Rewards Collected</span>
                    </>
                  )}
                </div>
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>Total Lifetime Collected: <strong className="text-slate-200">₹{userRewards?.totalCollectedInr || 0} INR</strong></span>
              <span>Settlement: <strong className="text-cyan-400">Instant Double-Entry Ledger</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: SEPARATED PLATFORM ANALYTICS (Strictly Separate Counters) */}
      <div 
        id="section-separated-analytics" 
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Network Analytics & Verification Metrics
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Strictly Independent Counters (No Combined Aggregations)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 1. Real Verified Visitors */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-cyan-400" />
              Real Verified Visitors
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white block">
              {(analytics?.realVerifiedVisitors || 0).toLocaleString()}
            </span>
            <p className="text-[10px] text-slate-400">Autonomous verified HTTP/200</p>
          </div>

          {/* 2. Authenticated Users */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <UserCheck className="h-3 w-3 text-emerald-400" />
              Authenticated Users
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white block">
              {(analytics?.authenticatedUsers || 0).toLocaleString()}
            </span>
            <p className="text-[10px] text-slate-400">Active member accounts</p>
          </div>

          {/* 3. Eligible Users */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Award className="h-3 w-3 text-amber-400" />
              Eligible Users
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white block">
              {(analytics?.eligibleUsers || 0).toLocaleString()}
            </span>
            <p className="text-[10px] text-slate-400">Holding unclaimed rewards</p>
          </div>

          {/* 4. Reward Claims */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-sky-400" />
              Reward Claims
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white block">
              {(analytics?.rewardClaims || 0).toLocaleString()}
            </span>
            <p className="text-[10px] text-slate-400">Settled ledger transactions</p>
          </div>
        </div>
      </div>

      {/* SECTION 5: ACTIVITY & REWARD ELIGIBILITY LEDGER */}
      <div 
        id="section-activity-ledger" 
        className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden"
      >
        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              id="subtab-activity-btn"
              onClick={() => setActiveSubTab('activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'activity'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Verified Activity Stream</span>
            </button>

            <button
              id="subtab-ledger-btn"
              onClick={() => setActiveSubTab('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'ledger'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Reward Eligibility Ledger</span>
              {eligibility?.total ? (
                <span className="rounded bg-slate-900 px-1.5 py-0.2 text-[10px] font-mono text-slate-300 border border-slate-700">
                  {eligibility.total}
                </span>
              ) : null}
            </button>

            <button
              id="subtab-antifraud-btn"
              onClick={() => setActiveSubTab('anti-fraud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'anti-fraud'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Anti-Fraud Specs</span>
            </button>
          </div>

          {/* Activity summary pills */}
          {isAuthenticated && activity && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-slate-900 px-2 py-1 text-slate-400 border border-slate-800">
                Today: <strong className="text-white">{activity.todayCount}</strong>
              </span>
              <span className="rounded bg-slate-900 px-2 py-1 text-slate-400 border border-slate-800">
                This Month: <strong className="text-white">{activity.monthCount}</strong>
              </span>
              <span className="rounded bg-slate-900 px-2 py-1 text-slate-400 border border-slate-800">
                All-Time: <strong className="text-cyan-400">{activity.totalVerifiedVisits}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5">
          {!isAuthenticated ? (
            <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center space-y-3">
              <Lock className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="text-base font-semibold text-white">Sign In Required to View Personal Ledger</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in to view your real-time verified activity records, time stamps, and reward eligibility entries.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('/login')}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors"
                >
                  Sign In Now
                </button>
                <button
                  onClick={() => onNavigate('/register')}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : activeSubTab === 'activity' ? (
            /* 1. VERIFIED ACTIVITY STREAM */
            <div className="space-y-4">
              {activity && activity.recentActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Session & Target</th>
                        <th className="py-2.5 px-3">Dwell & Device</th>
                        <th className="py-2.5 px-3">Origin Location</th>
                        <th className="py-2.5 px-3">Reward Value</th>
                        <th className="py-2.5 px-3">Verification</th>
                        <th className="py-2.5 px-3">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activity.recentActivity.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white max-w-xs truncate">
                              {item.campaignTitle}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono max-w-xs truncate">
                              {item.targetUrl}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              {item.device === 'mobile' ? (
                                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                              ) : item.device === 'tablet' ? (
                                <Tablet className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <Laptop className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span className="font-medium text-slate-200">{item.dwellSeconds}s Dwell</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-slate-300">{item.country}</span>
                              <span className="rounded bg-slate-800 px-1 py-0.2 text-[10px] text-slate-400">
                                {item.countryCode}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-emerald-400">
                              ₹{item.earnedInr} INR
                            </div>
                            <div className="text-[10px] text-slate-400">
                              +{item.earnedCredits} CR
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              VERIFIED
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(item.completedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center space-y-2">
                  <Activity className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-400">No verified activity recorded yet for your account.</p>
                  <button
                    onClick={() => onNavigate('/surf')}
                    className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
                  >
                    Start Surfing to Generate Activity
                  </button>
                </div>
              )}
            </div>
          ) : activeSubTab === 'ledger' ? (
            /* 2. REWARD ELIGIBILITY LEDGER */
            <div className="space-y-4">
              {/* Status Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">Status Filter:</span>
                  {['ALL', 'ELIGIBLE', 'CLAIMED', 'PENDING'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        statusFilter === status
                          ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400">
                  Total Eligible: <strong className="text-emerald-400">₹{eligibility?.eligibleTotalInr || 0} INR</strong> · Total Claimed: <strong className="text-slate-200">₹{eligibility?.claimedTotalInr || 0} INR</strong>
                </div>
              </div>

              {filteredLedger.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Reward ID & Source</th>
                        <th className="py-2.5 px-3">Qualifying Event</th>
                        <th className="py-2.5 px-3">Reward Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Created / Claimed</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLedger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-200 font-semibold">{entry.id}</div>
                            <div className="text-[11px] text-cyan-400 font-medium">{entry.eligibility_source}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                            {entry.qualifying_event_id.slice(0, 16)}...
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-emerald-400">₹{entry.amount_inr} INR</div>
                            <div className="text-[10px] text-slate-400">+{entry.amount_credits} CR</div>
                          </td>
                          <td className="py-3 px-3">
                            {entry.status === 'ELIGIBLE' ? (
                              <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                                ELIGIBLE
                              </span>
                            ) : entry.status === 'CLAIMED' ? (
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                                CLAIMED
                              </span>
                            ) : (
                              <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800">
                                {entry.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400">
                            <div>Created: {new Date(entry.created_at).toLocaleDateString()}</div>
                            {entry.claimed_at && (
                              <div className="text-emerald-400">Claimed: {new Date(entry.claimed_at).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {entry.status === 'ELIGIBLE' ? (
                              <button
                                id={`claim-item-${entry.id}`}
                                onClick={() => handleClaim(entry.id)}
                                disabled={isClaiming}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                              >
                                {claimingItemId === entry.id ? 'Collecting...' : 'Collect'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {entry.transaction_id ? `${entry.transaction_id.slice(0, 8)}...` : 'Settled'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center space-y-2">
                  <Layers className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-400">No ledger records found matching filter "{statusFilter}".</p>
                </div>
              )}
            </div>
          ) : (
            /* 3. ANTI-FRAUD SPECIFICATIONS */
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Reward Ledger Integrity & Anti-Fraud Architecture
                </h4>
                <p>
                  The TrafficLoop Reward Engine enforces stringent cryptographic, relational, and behavioral controls to protect platform treasury and ensure only authentic visitors receive rewards:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                    <strong className="text-cyan-300 block">1. Anti-Duplicate & Anti-Replay Guard</strong>
                    <p className="text-[11px] text-slate-400">
                      Every reward ledger record is bound to a unique qualifying event ID (`UNIQUE(qualifying_event_id)`). Replaying or re-submitting previously claimed sessions is physically rejected at the database level.
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                    <strong className="text-emerald-300 block">2. Geographic Verification (India 450K)</strong>
                    <p className="text-[11px] text-slate-400">
                      Regional campaign qualification requires verified residential egress nodes and HTTP/200 confirmation. Server health checks, headless bots, and synthetic ping scripts are filtered out.
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                    <strong className="text-amber-300 block">3. Token-Bucket Rate Limiting</strong>
                    <p className="text-[11px] text-slate-400">
                      API endpoints for reward claims are wrapped with strict per-IP and per-user token-bucket rate limiters to prevent rapid automated scripting and bot drains.
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                    <strong className="text-indigo-300 block">4. Double-Entry Accounting</strong>
                    <p className="text-[11px] text-slate-400">
                      All reward claims generate linked immutable double-entry records in `credit_transactions` and audit logs in `activity_logs`, providing complete traceability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
