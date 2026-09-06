import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import {
  Gift,
  Rocket,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Coins,
  ShieldCheck,
  Award
} from 'lucide-react';
import { DailyBonusStatus, DailyBonusOption } from '../../types.js';
import { formatCredits, formatInr, formatNumber } from '../../utils/formatters.js';

interface DailySignInBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DailyBonusStatus | null;
  onClaim: (optionId: string) => Promise<void>;
  isClaiming: boolean;
}

export function DailySignInBonusModal({
  isOpen,
  onClose,
  status,
  onClaim,
  isClaiming
}: DailySignInBonusModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>('ten_thousand_visits_boost');
  const [claimedSuccessMessage, setClaimedSuccessMessage] = useState<string | null>(null);

  if (!status) return null;

  const currentStreak = status.streakDays || 1;
  const options = status.bonusOptions || [];

  const handleClaim = async () => {
    try {
      await onClaim(selectedOptionId);
      const selected = options.find(o => o.id === selectedOptionId);
      setClaimedSuccessMessage(
        `Successfully claimed ${selected?.title || 'Daily Bonus'}! Added +${formatNumber(selected?.creditAmount || status.bonusAmount)} credits.`
      );
    } catch {
      // Error handled by parent toast
    }
  };

  const getOptionIcon = (iconName: string) => {
    switch (iconName) {
      case 'rocket':
        return <Rocket className="h-5 w-5 text-amber-400" />;
      case 'zap':
        return <Zap className="h-5 w-5 text-cyan-400" />;
      case 'target':
        return <Target className="h-5 w-5 text-emerald-400" />;
      default:
        return <Gift className="h-5 w-5 text-amber-300" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Sign-In & 24-Hour Loyalty Reward"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-slate-900 to-cyan-950/40 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner">
                <Gift className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    24-Hour Return Gift
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <Sparkles className="h-3 w-3" /> Ready to Claim
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  Welcome Back! Choose Your Daily Sign-In Bonus
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Log in every 24 hours to build your streak and unlock high-volume traffic packages up to 10,000 visits!
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Streak Timeline */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                7-Day Sign-In Streak Progression
              </span>
              <span className="font-mono text-amber-400 font-bold">
                Current: Day {currentStreak} of 7
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const isCurrent = day === currentStreak;
                const isCompleted = day < currentStreak;
                const isFinalDay = day === 7;

                return (
                  <div
                    key={`streak-day-${day}`}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/20 shadow-md ring-1 ring-amber-400'
                        : isCompleted
                        ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Day {day}</span>
                    <div className="my-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      ) : isFinalDay ? (
                        <Award className="h-4 w-4 text-amber-500/60" />
                      ) : (
                        <Coins className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-semibold">
                      {day === 7 ? '10K PKG' : `+${day * 5} CR`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bonus Options Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Today's Sign-In Bonus Option
            </h4>
            <span className="text-[11px] text-cyan-400 font-medium">
              1 Option per 24-Hour Cycle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option: DailyBonusOption) => {
              const isSelected = selectedOptionId === option.id;
              const isHighlight = option.highlight;

              return (
                <div
                  key={option.id}
                  id={`bonus-option-${option.id}`}
                  onClick={() => !isClaiming && setSelectedOptionId(option.id)}
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? isHighlight
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40 shadow-lg'
                        : 'border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/40 shadow-lg'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isHighlight
                          ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300'
                          : 'border border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {option.badge}
                    </span>

                    {/* Radio Indicator */}
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? isHighlight
                            ? 'border-amber-400 bg-amber-500'
                            : 'border-cyan-400 bg-cyan-500'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 my-1">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 shrink-0">
                      {getOptionIcon(option.iconName)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white leading-snug">
                        {option.title}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {option.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {option.description}
                  </p>

                  {/* Valuation & Credit Metric Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Value</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatInr(option.inrValue)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Traffic Volume</span>
                      <span className="font-mono font-extrabold text-cyan-300">
                        +{formatNumber(option.visitsEquivalent)} visits
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claimed Success Banner */}
        {claimedSuccessMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-3.5 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{claimedSuccessMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            {claimedSuccessMessage ? 'Done' : 'Remind Me Later'}
          </button>

          {!claimedSuccessMessage && (
            <button
              id="confirm-claim-daily-bonus-btn"
              type="button"
              disabled={isClaiming || !status.eligible}
              onClick={handleClaim}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 transition-all"
            >
              <Gift className="h-4 w-4" />
              <span>{isClaiming ? 'Claiming Reward...' : 'Claim Selected Sign-In Bonus'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
