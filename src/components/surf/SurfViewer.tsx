import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Lock, AlertCircle, RefreshCw, Globe, Sparkles, Monitor, Layers } from 'lucide-react';

interface SurfViewerProps {
  url: string;
  title: string;
  isPaused: boolean;
  category?: string;
  isNetworkShowcase?: boolean;
}

export function SurfViewer({ url, title, isPaused, category, isNetworkShowcase }: SurfViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'embed' | 'direct_card'>('embed');

  let domain = 'destination-site.com';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url;
  }

  const reloadIframe = () => {
    setIframeError(false);
    setViewMode('embed');
    setIframeKey(prev => prev + 1);
  };

  return (
    <div id="surf-viewer-container" className="relative flex flex-col h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Top Browser Bar */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800/90 bg-slate-900/95 px-4">
        {/* Left window dots */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <div className="ml-2 hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate max-w-xs">
            <span className="truncate">{title}</span>
          </div>
        </div>

        {/* URL Pill */}
        <div className="flex flex-1 max-w-lg mx-4 items-center justify-center">
          <div className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-slate-300 font-mono text-[11px]">{url}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {isNetworkShowcase && (
                <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[10px] text-cyan-300 border border-cyan-800/50">
                  Showcase
                </span>
              )}
              <span className="rounded bg-emerald-950/60 px-1.5 py-0.2 text-[10px] text-emerald-400 border border-emerald-800/40">
                Safe Frame V3
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'embed' ? 'direct_card' : 'embed')}
            className="hidden md:flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Toggle iframe / Direct Mode"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>{viewMode === 'embed' ? 'Focus Card' : 'Embed View'}</span>
          </button>
          <button
            onClick={reloadIframe}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Reload website preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded bg-cyan-950 border border-cyan-800/80 px-2 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-900 transition-colors shadow-sm"
            title="Open in new window (Timer continues running here)"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Open Direct</span>
          </a>
        </div>
      </div>

      {/* Frame / Viewport */}
      <div className="relative flex-1 bg-slate-950 w-full overflow-hidden">
        {isPaused && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-400" />
              <h4 className="mt-3 text-base font-bold text-white">Surfing Paused</h4>
              <p className="mt-1 text-xs text-slate-400">Click Resume in the control bar to continue viewing and earning credits.</p>
            </div>
          </div>
        )}

        {viewMode === 'direct_card' ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
            <div className="max-w-md w-full rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 shadow-inner mb-4">
                <Globe className="h-7 w-7" />
              </div>
              <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-800/60">
                {category || 'Verified Network Destination'}
              </span>
              <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
              <p className="mt-1 text-xs text-slate-400 font-mono">{domain}</p>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300 text-left space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                  <span>Engine Security:</span>
                  <span className="text-emerald-400 font-semibold">Verified Safe Destination</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Timer Status:</span>
                  <span className="text-cyan-300 font-semibold">Counting Down In Background</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-950 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Website Tab</span>
                </a>
                <button
                  onClick={() => setViewMode('embed')}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Switch to Iframe
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            id="traffic-exchange-iframe"
            src={url}
            title={title}
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            referrerPolicy="no-referrer"
            onError={() => setIframeError(true)}
          />
        )}

        {/* Floating Safe Mode Status */}
        <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-slate-800/90 bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>TrafficPeak Algorithm V3 · Dwell Verification Active</span>
        </div>
      </div>
    </div>
  );
}
