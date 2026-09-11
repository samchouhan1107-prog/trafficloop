import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { SurfSessionPayload, SurfCompleteResult, SurfEngineDiagnostics } from '../types.js';
import { SurfViewer } from '../components/surf/SurfViewer.js';
import { SurfSidebar } from '../components/surf/SurfSidebar.js';
import { SurfControls } from '../components/surf/SurfControls.js';
import { LiveCyclePoolMonitor } from '../components/surf/LiveCyclePoolMonitor.js';
import { Flame, AlertCircle, RefreshCw, Plus, Sparkles, CheckCircle2, Gift, Cpu, ShieldCheck, Activity, Trophy, Monitor } from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { formatCredits, formatInr, formatNumber } from '../utils/formatters.js';

interface SurfPageProps {
  onNavigate: (path: string) => void;
}

export function SurfPage({ onNavigate }: SurfPageProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<SurfSessionPayload | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [emptyPool, setEmptyPool] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string>('');

  // Timing & Active Dwell state
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [totalDuration, setTotalDuration] = useState<number>(15);
  const [activeDwellSeconds, setActiveDwellSeconds] = useState<number>(0);
  const [isTabActive, setIsTabActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTimerFinished, setIsTimerFinished] = useState<boolean>(false);

  // Verification & Claiming state
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedReward, setClaimedReward] = useState<{
    amount: number;
    message: string;
    mysteryReward?: SurfCompleteResult['mysteryReward'];
  } | null>(null);

  // Mystery Box celebration modal
  const [showMysteryModal, setShowMysteryModal] = useState<boolean>(false);
  const [unlockedMystery, setUnlockedMystery] = useState<SurfCompleteResult['mysteryReward'] | null>(null);

  // Engine Diagnostics State
  const [engineDiag, setEngineDiag] = useState<SurfEngineDiagnostics | null>(null);

  // Preferences
  const [autoSurf, setAutoSurf] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Track window visibility & focus for authentic dwell time
  useEffect(() => {
    const updateTabActive = () => {
      const active = !document.hidden && document.hasFocus();
      setIsTabActive(active);
    };

    window.addEventListener('visibilitychange', updateTabActive);
    window.addEventListener('focus', updateTabActive);
    window.addEventListener('blur', updateTabActive);

    return () => {
      window.removeEventListener('visibilitychange', updateTabActive);
      window.removeEventListener('focus', updateTabActive);
      window.removeEventListener('blur', updateTabActive);
    };
  }, []);

  // Heartbeat loop (Every 2.5s) to record active vs background dwell server-side
  useEffect(() => {
    if (!session || isLoadingSession || isTimerFinished || isPaused) return;

    heartbeatRef.current = setInterval(async () => {
      const isVisible = !document.hidden;
      const isFocused = document.hasFocus();
      try {
        const hbResult = await api.sendSurfHeartbeat(session.session_token, isVisible, isFocused);
        if (hbResult && typeof hbResult.activeDwellSeconds === 'number') {
          setActiveDwellSeconds(Math.round(hbResult.activeDwellSeconds));
        }
      } catch {
        // Non-blocking
      }
    }, 2500);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [session, isLoadingSession, isTimerFinished, isPaused]);

  // Fetch engine diagnostics on load
  const loadDiagnostics = async () => {
    try {
      const diag = await api.getEngineDiagnostics();
      setEngineDiag(diag);
    } catch {
      // Non-blocking fallback
    }
  };

  // Audio chime
  const playRewardAudio = (isMystery = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isMystery ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isMystery ? 784 : 587.33, audioCtx.currentTime); // G5 / D5
      osc.frequency.exponentialRampToValueAtTime(isMystery ? 1174.66 : 880, audioCtx.currentTime + 0.2); // D6 / A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isMystery ? 0.6 : 0.4));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (isMystery ? 0.6 : 0.4));
    } catch {
      // Audio context might be restricted
    }
  };

  // Start next session
  const startNextSession = async (preferredCampaignId?: string) => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoadingSession(true);
      setEmptyPool(false);
      setClaimError(null);
      setSelectedChallengeId(null);
      setIsTimerFinished(false);
      setIsPaused(false);
      setClaimedReward(null);

      const data = await api.startSurfSession(preferredCampaignId);
      setSession(data);
      setTimeLeft(data.campaign.duration_seconds);
      setTotalDuration(data.campaign.duration_seconds);
    } catch (err: any) {
      setEmptyPool(true);
      setEmptyMessage(err.message || 'No eligible campaigns available at this moment.');
      setSession(null);
    } finally {
      setIsLoadingSession(false);
      loadDiagnostics();
    }
  };

  // Initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCampaignId = params.get('campaignId') || undefined;
    startNextSession(initialCampaignId);
    loadDiagnostics();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Tick - strictly requires active window focus and visibility
  useEffect(() => {
    if (isLoadingSession || !session || isPaused || isTimerFinished) return;

    timerRef.current = setInterval(() => {
      const isVisibleAndFocused = !document.hidden && document.hasFocus();
      if (!isVisibleAndFocused) {
        setIsTabActive(false);
        return; // Pause timer progression while tab is unfocused/inactive
      }
      setIsTabActive(true);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoadingSession, session, isPaused, isTimerFinished]);

  // Claim Reward Handler
  const handleClaimReward = async () => {
    if (!session || !selectedChallengeId || isClaiming) return;

    try {
      setIsClaiming(true);
      setClaimError(null);

      const effectiveDwell = Math.max(totalDuration, activeDwellSeconds);
      const result = await api.completeSurfSession(session.session_token, selectedChallengeId, effectiveDwell);
      
      const isMystery = Boolean(result.mysteryReward && result.mysteryReward.unlocked);
      playRewardAudio(isMystery);

      setClaimedReward({
        amount: result.creditsEarned,
        message: result.message,
        mysteryReward: result.mysteryReward
      });

      // Visual feedback via Global Toast
      toast.surfSuccess({
        creditsEarned: result.creditsEarned,
        multiplier: session.algorithm_metadata?.multiplier || 1,
        streak: result.streakCount || (user?.total_visits_made || 0) + 1,
        campaignTitle: session.campaign.title,
        onViewLedger: () => onNavigate('/analytics')
      });

      if (isMystery && result.mysteryReward) {
        setUnlockedMystery(result.mysteryReward);
        setShowMysteryModal(true);
        toast.mysteryReward(
          result.mysteryReward.badgeName,
          result.mysteryReward.amount,
          result.streakCount || 10
        );
      }

      refreshUser();

      // If auto surf is enabled, advance after brief reward showcase
      if (autoSurf && !isMystery) {
        setTimeout(() => {
          startNextSession();
        }, 1500);
      }
    } catch (err: any) {
      setClaimError(err.message || 'Failed to verify reward. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-3 pb-6 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Engine Status / Algorithm HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Splash & TrafficPeak Weighted V3 Engine</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <LiveCyclePoolMonitor
            onSelectSite={(id) => startNextSession(id)}
            currentCampaignId={session?.campaign?.id}
          />
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => onNavigate('/tri-station')}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-950 px-2.5 py-1 text-[11px] font-bold text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
          >
            <Monitor className="h-3 w-3 text-cyan-400" />
            <span>Switch to 3-Station Engine</span>
          </button>
        </div>
      </div>

      {/* Active Spend-time Verification Status Banner */}
      {!isTabActive && session && !isTimerFinished && (
        <div className="flex items-center justify-between rounded-xl bg-amber-950/80 border border-amber-600/70 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>Tab Inactive · Spend-time verification paused. Please focus this tab to continue countdown.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-300">
            Active Dwell: {activeDwellSeconds}s / {totalDuration}s
          </span>
        </div>
      )}

      {/* Top Banner if reward claimed */}
      {claimedReward && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-950/90 border border-emerald-600 px-4 py-2 text-xs text-emerald-200 shadow-lg">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Success! Verified Visit Complete: +{claimedReward.amount.toFixed(2)} Credits (₹{(claimedReward.amount * 1.5).toFixed(2)})</span>
          </div>
          <span className="text-[11px] text-emerald-300 font-semibold">
            {autoSurf ? '⚡ Loading next website in queue...' : 'Click Next Website when ready'}
          </span>
        </div>
      )}

      {/* Main Surf Arena */}
      {isLoadingSession ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 p-12 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white">Matching Next Campaign via Multi-Factor Algorithm...</h3>
          <p className="text-xs text-slate-400 mt-1">Applying weighted fair distribution, anti-starvation, and fresh launch boost.</p>
        </div>
      ) : emptyPool ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Flame className="mx-auto h-12 w-12 text-cyan-400 opacity-80 mb-3" />
          <h3 className="text-lg font-bold text-white">Traffic Engine Ready</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {emptyMessage || 'The exchange pool is synchronizing. Click Retry to immediately cycle through active campaigns or create your own campaign!'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => startNextSession()}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md shadow-cyan-950"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Search Pool</span>
            </button>

            <button
              onClick={() => onNavigate('/campaigns')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      ) : session ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
          {/* Main Website Viewport (takes 3 cols) */}
          <div className="lg:col-span-3 h-full min-h-[380px]">
            <SurfViewer
              url={session.campaign.url}
              title={session.campaign.title}
              isPaused={isPaused}
              category={session.campaign.category}
              isNetworkShowcase={session.campaign.is_network_showcase}
              canEmbedInIframe={session.campaign.canEmbedInIframe}
              sessionToken={session.session_token}
            />
          </div>

          {/* Verification & Timer Sidebar (takes 1 col) */}
          <div className="lg:col-span-1 h-full">
            <SurfSidebar
              session={session}
              timeLeft={timeLeft}
              totalDuration={totalDuration}
              isTimerFinished={isTimerFinished}
              selectedChallengeId={selectedChallengeId}
              isClaiming={isClaiming}
              errorMessage={claimError}
              onSelectChallenge={(id) => {
                setSelectedChallengeId(id);
                setClaimError(null);
              }}
              onClaimReward={handleClaimReward}
              onSkipNext={() => startNextSession()}
              autoSurf={autoSurf}
              onToggleAutoSurf={(val) => setAutoSurf(val)}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Controls Bar */}
      <SurfControls
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onSkipNext={() => startNextSession()}
        onExit={() => onNavigate('/dashboard')}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentCampaignId={session?.campaign?.id}
      />

      {/* Milestone Mystery Box Modal */}
      <Modal
        isOpen={showMysteryModal}
        onClose={() => {
          setShowMysteryModal(false);
          startNextSession();
        }}
        title="🏆 Milestone Mystery Prize Box Unlocked!"
        subtitle="Congratulations! You have reached a dedicated surfing milestone in the network."
        maxWidth="md"
      >
        <div className="space-y-4 text-center py-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-xl animate-bounce">
            <Trophy className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">{unlockedMystery?.badgeName}</h3>
            <p className="text-xs text-slate-400 mt-1">{unlockedMystery?.message}</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4">
            <div className="text-2xl font-black text-amber-400">
              +{formatCredits(unlockedMystery?.amount)} Bonus Credits
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5">
              Valuation: {formatInr((unlockedMystery?.amount || 0) * 1.5)} Real-Time
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowMysteryModal(false);
              startNextSession();
            }}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-950 transition-all"
          >
            Claim Bonus & Continue Surfing
          </button>
        </div>
      </Modal>
    </div>
  );
}
