import React, { useEffect, useState } from 'react';
import { useToast, ToastItem } from '../../context/ToastContext.js';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Flame, 
  Sparkles, 
  X, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight
} from 'lucide-react';

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    
    const startTime = Date.now();
    const duration = toast.duration;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 40);

    const dismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const renderIcon = () => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case 'surf':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 animate-pulse">
            <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
        );
      case 'upi':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-black shadow-lg shadow-red-900/40 text-xs">
            811
          </div>
        );
      case 'mystery':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-bounce">
            <Gift className="w-5 h-5" />
          </div>
        );
      case 'success':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'error':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getContainerStyle = () => {
    switch (toast.type) {
      case 'surf':
        return 'bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-950 border-cyan-500/40 shadow-xl shadow-cyan-950/50';
      case 'upi':
        return 'bg-gradient-to-r from-slate-900 via-red-950/60 to-slate-950 border-red-500/40 shadow-xl shadow-red-950/50';
      case 'mystery':
        return 'bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-950/50';
      case 'success':
        return 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/30';
      case 'error':
        return 'bg-slate-900 border-rose-500/40 shadow-lg shadow-rose-950/30';
      case 'warning':
        return 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/30';
      case 'info':
      default:
        return 'bg-slate-900 border-slate-700 shadow-lg shadow-slate-950/40';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'surf':
        return 'bg-cyan-400';
      case 'upi':
        return 'bg-red-500';
      case 'mystery':
        return 'bg-amber-400';
      case 'success':
        return 'bg-emerald-400';
      case 'error':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-400';
      default:
        return 'bg-cyan-400';
    }
  };

  return (
    <div
      id={toast.id}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-white backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] ${getContainerStyle()}`}
    >
      <div className="flex items-start gap-3.5">
        {renderIcon()}

        <div className="min-w-0 flex-1">
          {/* Header Row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
              {toast.title}
            </h4>

            {toast.badge && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                  toast.type === 'upi'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : toast.type === 'surf'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : toast.type === 'mystery'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {toast.badge}
              </span>
            )}
          </div>

          {/* Description */}
          {toast.description && (
            <div className="text-[11px] sm:text-xs text-slate-300 leading-relaxed break-words">
              {toast.description}
            </div>
          )}

          {/* Specific Meta details for UPI */}
          {toast.type === 'upi' && toast.metadata && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-emerald-300 border border-emerald-900/60">
                +{(toast.metadata.credits || 0).toLocaleString()} Traffic Credits
              </span>
              {toast.metadata.amountInr && (
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-amber-300 border border-amber-900/60">
                  ₹{toast.metadata.amountInr.toFixed(2)} INR
                </span>
              )}
              {toast.metadata.utr && (
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-cyan-300 border border-cyan-900/60">
                  UTR: {toast.metadata.utr}
                </span>
              )}
            </div>
          )}

          {/* Specific Meta details for Surf */}
          {toast.type === 'surf' && toast.metadata && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-cyan-300 border border-cyan-800/60 flex items-center gap-1 font-bold">
                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                <span>+{(toast.metadata.credits || 0).toFixed(2)} CR</span>
              </span>
              {toast.metadata.multiplier && toast.metadata.multiplier > 1 && (
                <span className="rounded bg-amber-950/80 px-2 py-0.5 text-amber-300 border border-amber-800/60 font-bold">
                  {toast.metadata.multiplier}x Multiplier
                </span>
              )}
              {toast.metadata.streak && (
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300 border border-slate-700">
                  Streak: #{toast.metadata.streak}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 shadow-sm"
              >
                <span>{toast.action.label}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/60">
          <div
            className={`h-full transition-all duration-75 ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm sm:max-w-md flex-col gap-2.5 p-4 sm:p-0"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full transition-all transform animate-in slide-in-from-top-4 duration-200">
          <ToastCard toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
