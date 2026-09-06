import React from 'react';
import { ShieldCheck, Activity, Globe, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer id="main-footer" className="w-full border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 border border-slate-800 text-cyan-400">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-300">TrafficLoop</span>
              <span className="ml-1 text-slate-500">· WebZoneBW Ecosystem Core</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Exchange Engine Operational</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Anti-Abuse Verification Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              <span>Global Node Network</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
          <p>© {new Date().getFullYear()} TrafficLoop by WebZoneBW. Real human website traffic exchange.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px]">Strict Double-Entry Credit Ledger</span>
            <span className="text-slate-700">|</span>
            <span className="text-[11px]">Server-Validated Dwell Timers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
