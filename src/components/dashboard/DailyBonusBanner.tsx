import React from 'react';
import { Gift, Sparkles, Clock, Flame, CheckCircle2, Rocket, ArrowRight, Coins } from 'lucide-react';
import { DailyBonusStatus } from '../../types.js';
import { formatCredits, formatInr, formatNumber } from '../../utils/formatters.js';

interface DailyBonusBannerProps {
  status: DailyBonusStatus | null;
  onOpenModal: () => void;
  onQuickClaim: (optionId?: string) => Promise<void>;
  isClaiming: boolean;
  successMessage?: string | null;
}

export function DailyBonusBanner({
  status,
  onOpenModal,
  onQuickClaim,
  isClaiming,
  successMessage
}: DailyBonusBannerProps) {
  if (!status) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
        <div className="h-10 w-48 rounded bg-slate-800" />
      </div>
    );
  }

  const isEligible = status.eligible;
  const streak = status.streakDays || 1;

  return (
    <div
      id="daily-bonus-dashboard-banner"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
        isEligible
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/20 shadow-lg shadow-amber-500/5'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${
              isEligible
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            {isEligible ? (
              <Gift className="h-6 w-6 animate-pulse" />
            ) : (
              <Clock className="h-6 w-6 text-slate-400" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                24-Hour Sign-In & Daily Traffic Bonus
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                <Flame className="h-3 w-3 text-orange-400" /> Day {streak} Streak
              </span>
              {isEligible && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" /> 10,000 Visits Option Available
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1">
              {isEligible
                ? 'Your 24-hour return bonus is ready! Choose from instant wallet credits, surf multipliers, or 10,000 traffic visits package.'
                : status.message}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {successMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          ) : !isEligible ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Next claim ready in 24h</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="open-bonus-options-modal-btn"
                onClick={onOpenModal}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
              >
                <span>View All Options</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                id="quick-claim-daily-bonus-btn"
                disabled={isClaiming}
                onClick={() => onQuickClaim('ten_thousand_visits_boost')}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 transition-all"
              >
                <Rocket className="h-3.5 w-3.5" />
                <span>{isClaiming ? 'Claiming...' : 'Claim 10,000 Visits Bonus'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
