import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useInactivityDetector } from '../../hooks/useInactivityDetector.js';
import { AlertTriangle, Zap, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function InactivityBanner() {
  const { user } = useAuth();
  const { isInactive, inactivityReason, reactivateAccount } = useInactivityDetector();
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  if (!isInactive || user?.status !== 'inactive') {
    return null;
  }

  const handleReactivate = async () => {
    try {
      setIsReactivating(true);
      await reactivateAccount();
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <>
      <div
        id="global-inactivity-banner"
        className="w-full bg-gradient-to-r from-amber-950 via-amber-900/90 to-yellow-950 border-b border-amber-700/60 px-4 py-2.5 text-amber-200 shadow-md z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-white tracking-wide mr-1.5 uppercase text-[11px]">
                Account Status: Inactive
              </span>
              <span className="text-amber-200/90 hidden md:inline">
                Exchange surfing & credit consumption are safely paused. {inactivityReason ? `(${inactivityReason})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowDefinitionModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-white underline underline-offset-2 transition"
            >
              <Info className="h-3 w-3" />
              <span>Inactivity Rules</span>
            </button>

            <button
              id="btn-banner-reactivate"
              onClick={handleReactivate}
              disabled={isReactivating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 font-bold text-xs shadow-sm transition disabled:opacity-60"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              <span>{isReactivating ? 'Reactivating...' : 'Reactivate Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inactivity Rules & Definition Modal */}
      {showDefinitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-600/40 bg-slate-900 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Understanding Inactive User State</h3>
                <p className="text-xs text-amber-300/80">TrafficLoop Automated Safety Sentinel</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Idle Browser Protection:</strong> After 5 minutes without mouse movement or clicks, your session automatically sleeps to avoid wasting exchange resources.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Credit Shield:</strong> While inactive, your campaign budget and credits are protected from unattended balance depletion.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Instant 1-Click Reactivation:</strong> Click the "Reactivate Now" button at any time to immediately restore active status and resume live traffic delivery.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDefinitionModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDefinitionModal(false);
                  handleReactivate();
                }}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition"
              >
                Reactivate Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
