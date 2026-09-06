import React, { useEffect, useState } from 'react';
import {
  Play,
  Flame,
  ShieldCheck,
  Zap,
  Coins,
  Globe,
  Users,
  ArrowRight,
  Eye,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sparkles,
  Server,
  Clock,
  ChevronRight,
  Activity,
  Award,
  Shield,
  BarChart3,
  RefreshCw,
  Layers,
  Check,
  ArrowUpRight,
  Cpu,
  HelpCircle,
  TrendingUp,
  MousePointerClick
} from 'lucide-react';
import { api } from '../services/api.js';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeCampaigns: number;
    totalVisitsCompleted: number;
    visitsToday: number;
    totalCreditsExchanged: number;
  } | null>(null);

  // Pricing display currency state
  const [pricingCurrency, setPricingCurrency] = useState<'INR' | 'BWP' | 'USD'>('INR');

  // Interactive "Point-to-Point Work Window" Simulator state
  const [simActive, setSimActive] = useState<boolean>(false);
  const [simSeconds, setSimSeconds] = useState<number>(15);
  const [simStep, setSimStep] = useState<'browsing' | 'challenge' | 'settled'>('browsing');
  const [simChallengeSolved, setSimChallengeSolved] = useState<boolean>(false);
  const [simCreditsEarned, setSimCreditsEarned] = useState<number>(0);
  const [simDestination, setSimDestination] = useState<{
    name: string;
    url: string;
    description: string;
    tag: string;
  }>({
    name: 'WebZoneBW Enterprise Solutions',
    url: 'https://webzonebw.in',
    description: 'Cloud architectures, web portals, and software engineering platforms.',
    tag: 'Anchor Receiver'
  });

  // Simulator interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (simActive && simStep === 'browsing') {
      interval = setInterval(() => {
        setSimSeconds((prev) => {
          if (prev <= 1) {
            setSimStep('challenge');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simActive, simStep]);

  const handleSimSolveChallenge = () => {
    setSimChallengeSolved(true);
    setTimeout(() => {
      setSimStep('settled');
      setSimCreditsEarned((prev) => prev + 1.0);
    }, 400);
  };

  const handleRestartSim = () => {
    setSimActive(true);
    setSimSeconds(15);
    setSimStep('browsing');
    setSimChallengeSolved(false);
  };

  useEffect(() => {
    api.getPublicStats().then(setStats).catch(() => {});
  }, []);

  const currencySymbol = pricingCurrency === 'INR' ? '₹' : pricingCurrency === 'BWP' ? 'P' : '$';

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-14 text-center bg-glow-cyan">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[340px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-6 shadow-sm animate-rise">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Point-to-Point Visitor Exchange · WebZoneBW Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] animate-rise">
            Verified Human Traffic <br className="hidden sm:inline" />
            <span className="text-gradient-cyan">
              Without Ad Intermediaries
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed animate-rise">
            TrafficLoop is a reciprocal visitor exchange network where website owners explore participating platforms, earn verified traffic credits, and direct genuine human audiences to their own web tools and destinations.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              id="hero-get-started-btn"
              onClick={() => onNavigate('/register')}
              className="pressable w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/80 transition-all hover:scale-[1.02]"
            >
              <span>Join TrafficLoop (+15 Bonus Credits)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="hero-rewards-btn"
              onClick={() => onNavigate('/rewards')}
              className="pressable w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-600/70 bg-emerald-950/70 px-5 py-3.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-500 transition-all shadow-lg shadow-emerald-950/60"
            >
              <span className="text-base">🇮🇳</span>
              <span>Sign In & Rewards (450K Target)</span>
            </button>
          </div>

          {/* Key Proof Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>100% Real Human Dwell Time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Cryptographic Double-Entry Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Instant AI Safety Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME PLATFORM METRICS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div className="pt-3 sm:pt-0">
              <span className="text-xs uppercase font-semibold text-slate-400">Verified Visits Delivered</span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {stats?.totalVisitsCompleted?.toLocaleString() || '1,480+'}
              </p>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1 mt-0.5">
                <Activity className="w-3 h-3" />
                <span>15s – 60s Human Dwell</span>
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-xs uppercase font-semibold text-slate-400">Active Website Campaigns</span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-cyan-400">
                {stats?.activeCampaigns || '19'}
              </p>
              <span className="text-[11px] text-slate-400">In Real-Time Surf Pool</span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-xs uppercase font-semibold text-slate-400">Credits Exchanged</span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-400">
                {stats?.totalCreditsExchanged?.toFixed(0) || '2,940'} CR
              </p>
              <span className="text-[11px] text-slate-400">Strict Atomic Balances</span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="text-xs uppercase font-semibold text-slate-400">Active Surfers & Nodes</span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {stats?.totalUsers || '48'}
              </p>
              <span className="text-[11px] text-sky-400">Global Geographic Mesh</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE POINT-TO-POINT WORK WINDOW SIMULATOR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-cyan-800/50 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-cyan-950 px-2.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-800/60 mb-2">
                <Cpu className="w-3.5 h-3.5" />
                <span>Feature Spotlight</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Interactive Point-to-Point Work Window
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Experience how TrafficLoop seamlessly routes visiting members through the dwell countdown, performs server challenge verification, and settles atomic ledger credits directly with destination receivers like <strong>WebZoneBW</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!simActive ? (
                <button
                  type="button"
                  onClick={handleRestartSim}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-bold shadow-md transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Point-to-Point Test</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRestartSim}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Workflow</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Simulation Window */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Surfer Control Bar & Status */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Work Window Monitor
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    simStep === 'settled' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : simActive 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {simStep === 'settled' ? 'Session Completed' : simActive ? 'Active Dwell' : 'Idle'}
                  </span>
                </div>

                {/* Progress bar / Timer */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Human Dwell Timer:</span>
                    <span className="font-mono font-bold text-cyan-300">{simSeconds}s remaining</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${
                        simSeconds <= 5 && simStep === 'browsing'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-300 animate-pulse'
                          : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                      }`}
                      style={{ width: `${((15 - simSeconds) / 15) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{15 - simSeconds}s elapsed</span>
                    <span className="text-slate-600">per-second tick</span>
                  </div>
                </div>

                {/* Challenge step */}
                {simStep === 'challenge' && (
                  <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-3.5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Human Verification Challenge</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Click the matching security token to confirm active viewing:
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSimSolveChallenge}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow transition-all"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Confirm Real Visitor</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Settled state */}
                {simStep === 'settled' && (
                  <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3.5 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Settlement Confirmed!</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      +1.00 Credit credited to Surfer Ledger. Visit verified and recorded for <strong>{simDestination.name}</strong>.
                    </p>
                  </div>
                )}

                {/* Ledger tally */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Simulation Credits:</span>
                  <span className="font-bold text-amber-400 font-mono">+{simCreditsEarned.toFixed(2)} CR</span>
                </div>
              </div>
            </div>

            {/* Right: Mock Safe Viewport Preview */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
                {/* Browser top-bar */}
                <div className="flex h-10 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[11px] font-semibold text-slate-300 truncate max-w-[150px]">
                      {simDestination.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[10px] text-slate-400 font-mono">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>{simDestination.url}</span>
                  </div>

                  <a
                    href={simDestination.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
                    title="Open destination in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Viewport content */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 text-left min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold">
                        {simDestination.tag}
                      </span>
                      <span className="text-[11px] text-slate-400">Live Traffic Exchange Receiver</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {simDestination.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-xl">
                      {simDestination.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Node Target: Global / India / Southern Africa</span>
                    </div>
                    <a
                      href={simDestination.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      <span>Explore Destination ({simDestination.url})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED VERIFIED RECEIVER & PLATFORM ANCHOR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-xs font-semibold text-slate-300">
            Verified Ecosystem Receivers
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
            Legitimate Web Properties in the Exchange
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            TrafficLoop does not host junk popunders or spam traps. All participating campaigns are actively audited and verified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WebZoneBW Card */}
          <div className="relative rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div className="absolute -top-3 right-6 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-950 shadow-md">
              Anchor Campaign
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">WebZoneBW</h3>
                  <p className="text-[11px] text-cyan-300 font-mono">https://webzonebw.in</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full-suite digital development hub delivering enterprise cloud architectures, software engineering, and modern web application platforms.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Enterprise Web</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Cloud Infrastructure</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Verified Target</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-medium">100% Active in Pool</span>
              <a
                href="https://webzonebw.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Visit Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* SaaS & Web Utilities */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950 border border-sky-800/80 text-sky-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">SaaS & Developer Tools</h3>
                  <p className="text-[11px] text-slate-400">API Documentation & Dashboards</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Independent developers and SaaS builders use TrafficLoop to gather genuine product discovery, test landing page usability, and boost real user engagement.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Fast Indexing</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">UX Validation</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Audience Growth</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Category Verified</span>
              <span>15s – 60s Dwell</span>
            </div>
          </div>

          {/* Regional Portals & Commerce */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Regional Business Portals</h3>
                  <p className="text-[11px] text-slate-400">Global & Local Markets</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Publishers, directory owners, and e-commerce stores direct targeted traffic by location and device, building organic authority and visitor retention.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Geo Targeting</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Safe Sandboxing</span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">Daily Pacing</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Audited Campaigns</span>
              <span>Clean Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (4 STEPS) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">How the TrafficLoop Engine Operates</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            A transparent 4-stage lifecycle ensuring real human dwell time and fair credit exchange.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 mb-4 font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-white">Register Free</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Create your account in seconds and immediately receive +15 Welcome Credits to bootstrap your initial campaigns.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-cyan-400 font-semibold">
              Instant Activation
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400 mb-4 font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-white">Submit Campaigns</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Add your website URLs with custom dwell durations (15s to 60s), daily limits, and geographic targeting preferences.
              </p>
              <div className="mt-3 rounded-lg border border-amber-700/40 bg-gradient-to-r from-amber-950/50 to-cyan-950/40 px-2.5 py-2">
                <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  +500,000 LIFETIME FREE VISITS per new URL
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-sky-400 font-semibold">
              Automated AI Scanner
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950 border border-amber-800/60 text-amber-400 mb-4 font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-white">Earn via Work Window</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Explore member websites in the Surfer Work Window. Complete quick captcha challenges to claim continuous credit rewards.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-amber-400 font-semibold">
              Double-Entry Ledger
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 mb-4 font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-white">Receive Real Traffic</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Your websites automatically enter the active rotation pool, receiving real human visits with full analytics and dwell tracking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-emerald-400 font-semibold">
              Transparent Analytics
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING & CREDIT PACKAGES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <span className="rounded bg-amber-950 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-800/60">
                Optional Reserve Volume
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
                Competitive Global Traffic Pricing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Earn 100% of your credits for free by participating in the exchange, or purchase direct reserves to scale traffic volume instantly.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPricingCurrency('INR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  pricingCurrency === 'INR'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => setPricingCurrency('BWP')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  pricingCurrency === 'BWP'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BWP (P)
              </button>
              <button
                type="button"
                onClick={() => setPricingCurrency('USD')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  pricingCurrency === 'USD'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Booster</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {currencySymbol}{pricingCurrency === 'INR' ? '750' : pricingCurrency === 'BWP' ? '130' : '9.99'}
                  </span>
                  <span className="text-xs text-slate-400">{pricingCurrency}</span>
                </div>
                <div className="mt-1 text-sm font-bold text-amber-400">500 Traffic Credits</div>
                <p className="mt-2 text-xs text-slate-400">
                  Ideal for testing new landing pages, validating user feedback, and bootstrapping initial visitors.
                </p>

                <div className="mt-6 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>500 High-Dwell Human Visits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>15s Dwell Time Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Standard Rotation Priority</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Get Starter Reserve
              </button>
            </div>

            {/* Growth Tier (Popular) */}
            <div className="relative rounded-2xl border-2 border-cyan-500 bg-gradient-to-b from-cyan-950/40 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
              <span className="absolute -top-3 right-6 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">
                Most Popular
              </span>
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Growth Accelerator</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {currencySymbol}{pricingCurrency === 'INR' ? '2,700' : pricingCurrency === 'BWP' ? '480' : '34.99'}
                  </span>
                  <span className="text-xs text-slate-400">{pricingCurrency}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-amber-400">
                  <span>2,200 Credits</span>
                  <span className="text-[10px] text-emerald-400">(+200 Bonus)</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Recommended for growing SaaS applications, content creators, and regional platforms.
                </p>

                <div className="mt-6 space-y-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>2,200 Verified Human Visits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Custom 15s–60s Dwell Durations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Geographic & Device Pacing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Priority Review Queue</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="mt-6 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-colors"
              >
                Select Growth Package
              </button>
            </div>

            {/* Enterprise / Scale */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise Scale</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {currencySymbol}{pricingCurrency === 'INR' ? '11,250' : pricingCurrency === 'BWP' ? '2,000' : '149.99'}
                  </span>
                  <span className="text-xs text-slate-400">{pricingCurrency}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-amber-400">
                  <span>11,500 Credits</span>
                  <span className="text-[10px] text-emerald-400">(+1,500 Bonus)</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Maximum liquidity for high-volume networks, agencies, and large-scale web services.
                </p>

                <div className="mt-6 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>11,500 High-Intent Visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Highest Surf Pool Rotation Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Direct Bank Wire / Instant UPI & Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Dedicated Admin Support</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Order Enterprise Scale
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Everything you need to know about TrafficLoop and our visitor exchange ecosystem.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>How does TrafficLoop differ from generic popunder or ad networks?</span>
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-6">
              Unlike blind ad networks that inflate numbers with automated headless bots and hidden iframes, TrafficLoop requires active human viewing in an authenticated browser window with strict dwell countdown timers and cryptographic challenge verification.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>What is the relationship between TrafficLoop and WebZoneBW?</span>
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-6">
              TrafficLoop is engineered by WebZoneBW (<strong>https://webzonebw.in</strong>). WebZoneBW participates directly as an anchor receiver in the traffic pool, providing continuous exchange liquidity and infrastructure backing.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Can I use TrafficLoop completely free?</span>
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-6">
              Yes! You can explore member websites using the Surfer Work Window to earn credits continuously. You receive +15 Welcome Credits upon registration, and every verified visit you perform earns credits to promote your own links.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>What payment methods are supported for credit deposits?</span>
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-6">
              We support official linked Bank Wire Transfers / EFT / NEFT / IMPS, Instant Visa & Mastercard checkout, Mobile Money (Orange Money / Smega / eWallet), and USDT TRC-20 decentralized treasury.
            </p>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-sky-950/80 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Accelerate Your Platform Discovery?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join web developers and platform owners participating in the TrafficLoop exchange. Claim your +15 welcome credits and launch your first campaign in minutes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/80 transition-all hover:scale-[1.02]"
              >
                <span>Create Free Account (+15 Credits)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
              >
                <span>Sign In to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
