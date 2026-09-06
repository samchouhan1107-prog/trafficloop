import React, { useState } from 'react';
import {
  StationControlPayload,
  StationId,
  TriStationOverallMetrics
} from '../../types.js';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
  Cpu,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  Send,
  Megaphone,
  Zap,
  Clock
} from 'lucide-react';

interface TriStationMasterControlsProps {
  metrics: TriStationOverallMetrics;
  isGlobalRunning: boolean;
  supportedCountries: Array<{ code: string; name: string; flag: string; region: string }>;
  onControl: (payload: StationControlPayload) => void;
  onSelectGlobalGeo: (countryCode: string) => void;
  onApplyPreset: (presetName: 'ecommerce' | 'cdn' | 'apac' | 'tier1' | 'repair_tech') => void;
  onGlobalPushUrl?: (url: string, keyword: string) => void;
}

export function TriStationMasterControls({
  metrics,
  isGlobalRunning,
  supportedCountries,
  onControl,
  onSelectGlobalGeo,
  onApplyPreset,
  onGlobalPushUrl
}: TriStationMasterControlsProps) {
  const [selectedGeo, setSelectedGeo] = useState<string>('');
  const [showGlobalPushModal, setShowGlobalPushModal] = useState(false);
  const [globalPushUrl, setGlobalPushUrl] = useState('https://example.com');
  const [globalPushKeyword, setGlobalPushKeyword] = useState('repair tech hiring');

  const handleGlobalGeoChange = (code: string) => {
    setSelectedGeo(code);
    if (code) {
      onSelectGlobalGeo(code);
    }
  };

  const handleGlobalPushSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalPushUrl.trim()) return;

    if (onGlobalPushUrl) {
      onGlobalPushUrl(globalPushUrl.trim(), globalPushKeyword.trim() || 'repair tech hiring');
    } else {
      onControl({
        action: 'push_url',
        config: {
          targetUrl: globalPushUrl.trim(),
          searchKeyword: globalPushKeyword.trim() || 'repair tech hiring',
          searchTheme: globalPushKeyword.trim() || 'repair tech hiring'
        }
      });
    }
    setShowGlobalPushModal(false);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Status & Compliance Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Tri-Station Multi-Browser Engine
              </h2>
              <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800">
                3 Independent Runtimes
              </span>
              <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                24h Rotational Extra Slot Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Concurrent remote browser testing, cookies jar injection, ad display preview, and 24h rolling reset.
            </p>
          </div>
        </div>

        {/* 4K Limit Bypass Indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>4,000 Visit/Day Bypassed · 24h Rotational Class (5K/hr Capacity)</span>
        </div>
      </div>

      {/* Main Control Actions & Master Sync Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start All */}
          <button
            type="button"
            id="start-all-stations-btn"
            onClick={() => onControl({ action: 'start' })}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-950/60 transition-all active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Launch All 3 Stations</span>
          </button>

          {/* Global Push URL Button */}
          <button
            type="button"
            onClick={() => setShowGlobalPushModal(!showGlobalPushModal)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-600/70 bg-amber-950/70 hover:bg-amber-900/70 px-3 py-2 text-xs font-bold text-amber-300 transition-colors shadow-md"
          >
            <Send className="h-3.5 w-3.5 text-amber-400" />
            <span>Push URL to All 3 Windows</span>
          </button>

          {/* Pause All */}
          <button
            type="button"
            onClick={() => onControl({ action: 'pause' })}
            className="flex items-center gap-1.5 rounded-xl border border-amber-700/60 bg-amber-950/60 hover:bg-amber-900/60 px-3 py-2 text-xs font-bold text-amber-300 transition-colors"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Pause All</span>
          </button>

          {/* Resume All */}
          <button
            type="button"
            onClick={() => onControl({ action: 'resume' })}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/60 hover:bg-emerald-900/60 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-emerald-300" />
            <span>Resume All</span>
          </button>

          {/* Stop All */}
          <button
            type="button"
            onClick={() => onControl({ action: 'stop' })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Square className="h-3.5 w-3.5" />
            <span>Halt All</span>
          </button>

          {/* Reset All */}
          <button
            type="button"
            onClick={() => onControl({ action: 'reset' })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            title="Clear all station logs & run statistics"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Stats</span>
          </button>
        </div>

        {/* Global Target Country Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="text-slate-400 font-medium hidden sm:inline">Set All Targets:</span>
          <select
            value={selectedGeo}
            onChange={(e) => handleGlobalGeoChange(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Sync All Target Countries...</option>
            {supportedCountries.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Push URL Modal Form */}
      {showGlobalPushModal && (
        <form onSubmit={handleGlobalPushSubmit} className="rounded-xl border border-amber-600/50 bg-slate-950 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Megaphone className="h-4 w-4" />
              <span>Broadcast URL & Theme to All 3 Station Windows</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Unrestricted 24h Rotational Extra Slot
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Website URL</label>
              <input
                type="url"
                required
                value={globalPushUrl}
                onChange={(e) => setGlobalPushUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Theme / Keyword (e.g. "repair tech hiring")</label>
              <input
                type="text"
                required
                value={globalPushKeyword}
                onChange={(e) => setGlobalPushKeyword(e.target.value)}
                placeholder="repair tech hiring"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              Pushes live Google SERP ad display format, seeds browser cookies, and dispatches GA4 telemetry across all 3 stations simultaneously.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGlobalPushModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Broadcast to All 3 Windows</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preset Strategy Buttons Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300 text-[11px]">Testing Presets:</span>
          
          <button
            type="button"
            onClick={() => onApplyPreset('repair_tech')}
            className="rounded-lg border border-cyan-500/60 bg-cyan-950/80 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-900/80 hover:text-white transition-colors shadow-sm"
          >
            🔍 Repair Tech Hiring (3-Node Organic Loop)
          </button>

          <button
            type="button"
            onClick={() => onApplyPreset('tier1')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-cyan-500/60 hover:text-white transition-colors"
          >
            💎 Tier-1 (US/DE/GB)
          </button>

          <button
            type="button"
            onClick={() => onApplyPreset('apac')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-cyan-500/60 hover:text-white transition-colors"
          >
            🌏 APAC Regional (IN/SG/JP)
          </button>

          <button
            type="button"
            onClick={() => onApplyPreset('cdn')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-cyan-500/60 hover:text-white transition-colors"
          >
            ⚡ Edge CDN Benchmark
          </button>
        </div>

        {/* Live Aggregated Telemetry Counter */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>Active: <strong className="text-emerald-400">{metrics.activeSessions} / 3 Stations</strong></span>
          <span className="text-slate-600">|</span>
          <span>Avg TTFB: <strong className="text-cyan-300">{metrics.avgTtfbMs}ms</strong></span>
          <span className="text-slate-600">|</span>
          <span>Success: <strong className="text-emerald-400">{metrics.successRatePercent}%</strong></span>
        </div>
      </div>
    </div>
  );
}
