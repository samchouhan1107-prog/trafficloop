import React from 'react';
import { Clock, Zap, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Globe, Target, Cpu, Compass, Rocket, Flame, Gift } from 'lucide-react';
import { SurfSessionPayload } from '../../types.js';
import { formatCredits, formatInr } from '../../utils/formatters.js';

interface SurfSidebarProps {
  session: SurfSessionPayload | null;
  timeLeft: number;
  totalDuration: number;
  elapsedSeconds: number;
  isTimerFinished: boolean;
  selectedChallengeId: string | null;
  isClaiming: boolean;
  errorMessage: string | null;
  onSelectChallenge: (id: string) => void;
  onClaimReward: () => void;
  onSkipNext?: () => void;
  autoSurf: boolean;
  onToggleAutoSurf: (val: boolean) => void;
}

export function SurfSidebar({
  session,
  timeLeft,
  totalDuration,
  elapsedSeconds,
  isTimerFinished,
  selectedChallengeId,
  isClaiming,
  errorMessage,
  onSelectChallenge,
  onClaimReward,
  onSkipNext,
  autoSurf,
  onToggleAutoSurf
}: SurfSidebarProps) {
  if (!session) return null;

  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  // Zone coloring: start cyan → mid amber → last 5s emerald pulse
  const isNearComplete = !isTimerFinished && timeLeft <= 5;
  const isMidway = !isTimerFinished && timeLeft > 5 && progressPercent >= 40;
  const ringColor = isTimerFinished
    ? 'stroke-emerald-400'
    : isNearComplete
    ? 'stroke-emerald-400 animate-[pulse_1s_ease-in-out_infinite]'
    : isMidway
    ? 'stroke-amber-400'
    : 'stroke-cyan-400';

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="h-5 w-5" />;
      case 'Globe': return <Globe className="h-5 w-5" />;
      case 'Cpu': return <Cpu className="h-5 w-5" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5" />;
      case 'Target': return <Target className="h-5 w-5" />;
      case 'Compass': return <Compass className="h-5 w-5" />;
      case 'Rocket': return <Rocket className="h-5 w-5" />;
      default: return <ShieldCheck className="h-5 w-5" />;
    }
  };

  const streak = session.algorithm_metadata?.surfer_streak || 1;
  const multiplier = session.algorithm_metadata?.multiplier || 1.0;
  const milestoneTarget = session.algorithm_metadata?.mystery_milestone_target || 10;
  const milestoneProgress = streak % 10;
  const inrRewardEstimate = formatInr(session.campaign.credit_reward * 1.5);

  return (
    <div id="surf-sidebar" className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md shadow-xl">
      {/* Campaign Details Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-800/60">
            {session.campaign.category || 'Website'}
          </span>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>+{formatCredits(session.campaign.credit_reward)} CR</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400">≈ {inrRewardEstimate}</span>
          </div>
        </div>

        <h3 className="mt-2 text-sm font-bold text-white line-clamp-2 leading-snug">
          {session.campaign.title}
        </h3>
      </div>

      {/* Splash / TrafficPeak Gamified Streak HUD */}
      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>Streak: {streak} Sites</span>
          </div>
          {multiplier > 1.0 && (
            <span className="rounded bg-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-400/40">
              {multiplier}x Multiplier
            </span>
          )}
        </div>
        {/* Mystery Box Progress Bar */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Gift className="h-3 w-3 text-amber-400" />
            <span>Mystery Prize Box</span>
          </div>
          <span>{milestoneProgress}/10</span>
        </div>
        <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
            style={{ width: `${(milestoneProgress / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer / Progress Section */}
      <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-center">
        {/* Circular / Progress Indicator */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Background Ring */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`transition-all duration-300 ${ringColor}`}
              strokeWidth="7"
              strokeDasharray={251}
              strokeDashoffset={251 - (251 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            {isTimerFinished ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-bounce" />
            ) : (
              <div className="flex flex-col items-center">
                <span className={`text-2xl font-black tracking-tight tabular-nums ${isNearComplete ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>
                  {timeLeft}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Sec</span>
                <span className="mt-0.5 text-[9px] font-medium text-slate-500 tabular-nums">
                  {elapsedSeconds}s elapsed
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className={`h-3 w-3 ${isNearComplete ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
          <span>{isTimerFinished ? 'Dwell time fulfilled' : `Required: ${totalDuration}s · ${timeLeft}s left`}</span>
        </div>

        {/* Next campaign unlock countdown */}
        {isTimerFinished && typeof session.next_campaign_due_seconds === 'number' && session.next_campaign_due_seconds > 0 && (
          <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-cyan-400" />
                Next site unlocks in
              </span>
              <span className="font-mono font-bold text-cyan-300 tabular-nums">
                {session.next_campaign_due_seconds}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Human Verification Challenge Section */}
      <div className="flex-1 flex flex-col justify-center border-t border-slate-800/80 pt-3">
        {isTimerFinished ? (
          <div className="space-y-2.5">
            <div className="text-center">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Human Verification</span>
              <p className="mt-1 text-xs text-slate-300 font-medium leading-snug">
                {session.verification_challenge.prompt}
              </p>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-2">
              {session.verification_challenge.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectChallenge(option.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                    selectedChallengeId === option.id
                      ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-md shadow-cyan-950 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className={selectedChallengeId === option.id ? 'text-cyan-300' : 'text-slate-400'}>
                    {renderIcon(option.icon)}
                  </div>
                  <span className="truncate max-w-full text-[11px]">{option.label}</span>
                </button>
              ))}
            </div>

            {errorMessage && (
              <div className="space-y-1.5 rounded-lg bg-rose-950/80 p-2.5 text-xs text-rose-300 border border-rose-800/60 shadow-inner">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="text-[11px] font-medium leading-tight flex-1">{errorMessage}</span>
                </div>
                {(errorMessage.toLowerCase().includes('active') ||
                  errorMessage.toLowerCase().includes('invalidated') ||
                  errorMessage.toLowerCase().includes('expired') ||
                  errorMessage.toLowerCase().includes('already been claimed')) && onSkipNext && (
                  <button
                    type="button"
                    onClick={onSkipNext}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 rounded bg-rose-900/80 hover:bg-rose-800 px-2.5 py-1.5 text-[11px] font-bold text-white border border-rose-700/60 transition-colors"
                  >
                    <span>🔄 Load Next Website</span>
                  </button>
                )}
              </div>
            )}

            <button
              id="claim-surf-reward-btn"
              type="button"
              disabled={!selectedChallengeId || isClaiming}
              onClick={onClaimReward}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isClaiming ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying on Server...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  <span>Claim +{session.campaign.credit_reward.toFixed(2)} CR (₹{inrRewardEstimate})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-slate-400 space-y-2">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isNearComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-300 animate-pulse'
                    : isMidway
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full text-[10px] font-mono">
              <span className={isNearComplete ? 'text-emerald-400 font-bold animate-pulse' : 'text-cyan-400'}>
                {elapsedSeconds}s / {totalDuration}s
              </span>
              <span className="text-slate-500">live tick · 1s</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isNearComplete
                ? 'Almost there — timer completes in a few seconds!'
                : 'Surfing in progress... Select verification icon once timer completes.'}
            </p>
          </div>
        )}
      </div>

      {/* Auto-Advance Toggle */}
      <div className="mt-3 border-t border-slate-800 pt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">Auto-load next website</span>
        <button
          type="button"
          onClick={() => onToggleAutoSurf(!autoSurf)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoSurf ? 'bg-cyan-600' : 'bg-slate-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoSurf ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
