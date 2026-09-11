import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, ShieldCheck, Lock, AlertCircle, RefreshCw, Globe, Sparkles, Monitor, Layers, MousePointerClick, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../../services/api.js';

interface SurfViewerProps {
  url: string;
  title: string;
  isPaused: boolean;
  category?: string;
  isNetworkShowcase?: boolean;
  canEmbedInIframe?: boolean;
  sessionToken?: string;
  onRegisterClick?: (newClicks: number, bonusCredits: number) => void;
}

const KNOWN_FRAME_RESTRICTED_HOSTS = [
  'developer.mozilla.org',
  'github.com',
  'google.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'youtube.com',
  'instagram.com',
  'linkedin.com'
];

export function SurfViewer({
  url,
  title,
  isPaused,
  category,
  isNetworkShowcase,
  canEmbedInIframe,
  sessionToken,
  onRegisterClick
}: SurfViewerProps) {
  let domain = 'destination-site.com';
  try {
    domain = new URL(url).hostname.toLowerCase();
  } catch {
    domain = url.toLowerCase();
  }

  const isRestrictedByPolicy = KNOWN_FRAME_RESTRICTED_HOSTS.some(h => domain === h || domain.endsWith(`.${h}`));
  const shouldDefaultToCard = canEmbedInIframe === false || isRestrictedByPolicy;

  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'embed' | 'direct_card'>(shouldDefaultToCard ? 'direct_card' : 'embed');
  const [clicksCount, setClicksCount] = useState(0);
  const [isRegisteringClick, setIsRegisteringClick] = useState(false);
  const [clickNotice, setClickNotice] = useState<string | null>(null);
  const [isHoveringIframe, setIsHoveringIframe] = useState(false);
  const noticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode and reset clicks on URL change
  useEffect(() => {
    setClicksCount(0);
    setClickNotice(null);
    setIframeError(false);
    if (shouldDefaultToCard) {
      setViewMode('direct_card');
    } else {
      setViewMode('embed');
    }
  }, [url, sessionToken, shouldDefaultToCard]);

  // Handle registering an authentic visitor click on the webpage
  const handleRegisterClick = async (
    clickType: 'in_frame' | 'companion_tab' | 'quick_action' = 'in_frame',
    linkUrl?: string,
    linkText?: string
  ) => {
    if (!sessionToken || isRegisteringClick) return;

    try {
      setIsRegisteringClick(true);
      const res = await api.registerSurfClick({
        sessionToken,
        clickType,
        linkUrl: linkUrl || url,
        linkText: linkText || `Visitor click on ${domain}`
      });

      if (res && res.success) {
        setClicksCount(res.clicksCount);
        if (onRegisterClick) {
          onRegisterClick(res.clicksCount, res.bonusCredits);
        }

        const noticeText = res.bonusCredits > 0
          ? `🖱️ Verified Webpage Click! (+${res.bonusCredits.toFixed(2)} Credit Bonus & GA4 Event)`
          : `🖱️ Webpage Click Verified & Logged to GA4 Realtime!`;

        setClickNotice(noticeText);

        if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = setTimeout(() => {
          setClickNotice(null);
        }, 4000);
      }
    } catch (err: any) {
      console.warn('Click tracking notification:', err.message);
    } finally {
      setIsRegisteringClick(false);
    }
  };

  // Detect visitor clicks inside the cross-origin iframe via window blur while mouse is over iframe
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isHoveringIframe && !isPaused && sessionToken) {
        handleRegisterClick('in_frame', url, 'In-Page Element Click');
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, [isHoveringIframe, isPaused, sessionToken, url]);

  const reloadIframe = () => {
    setIframeError(false);
    setViewMode('embed');
    setIframeKey(prev => prev + 1);
  };

  const handleOpenCompanionTab = () => {
    handleRegisterClick('companion_tab', url, 'Interactive Companion Tab Click');
    window.open(url, '_blank', 'noopener,noreferrer');
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
          <button
            type="button"
            onClick={handleOpenCompanionTab}
            className="flex items-center gap-1 rounded bg-cyan-950 border border-cyan-800/80 px-2 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-900 transition-colors shadow-sm cursor-pointer"
            title="Open in new interactive window & register visitor click"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Click & Open</span>
          </button>
        </div>
      </div>

      {/* Interactive Click Bar (Empowers Visitors to Click on Webpage & Explore Links) */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-900/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-3.5 py-1.5 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1">
              <MousePointerClick className="h-3.5 w-3.5 text-cyan-400 inline" />
              Clickable Webpage:
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click anywhere on the webpage to browse links & interact!
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Clicks counter badge */}
          <div className="flex items-center gap-1.5 rounded-md bg-slate-950/80 border border-cyan-700/40 px-2 py-0.5 text-[11px]">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400/20" />
            <span className="text-slate-400">Visitor Clicks:</span>
            <span className="font-extrabold text-cyan-300 font-mono">{clicksCount}</span>
            {clicksCount > 0 && (
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1 rounded border border-emerald-800/40">
                +{(Math.min(clicksCount, 5) * 0.05).toFixed(2)} Bonus
              </span>
            )}
          </div>

          {/* Quick Click & Explore Button */}
          <button
            type="button"
            onClick={() => handleRegisterClick('quick_action', `${url}#engage-${Date.now()}`, 'Webpage Engagement Interaction')}
            disabled={isRegisteringClick}
            className="flex items-center gap-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 px-2 py-0.5 text-[11px] font-bold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Click to register active visitor interaction on this webpage"
          >
            <MousePointerClick className="h-3 w-3" />
            <span>Click Webpage Element</span>
          </button>
        </div>
      </div>

      {/* Floating Click Verification Notification Toast */}
      {clickNotice && (
        <div className="absolute top-20 right-4 z-30 flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-slate-900/95 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{clickNotice}</span>
        </div>
      )}

      {/* Frame / Viewport */}
      <div
        className="relative flex-1 bg-slate-950 w-full overflow-hidden"
        onMouseEnter={() => setIsHoveringIframe(true)}
        onMouseLeave={() => setIsHoveringIframe(false)}
      >
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
                  <span>Interaction Status:</span>
                  <span className="text-emerald-400 font-semibold">Ready for Visitor Clicks</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Clicks Registered:</span>
                  <span className="text-cyan-300 font-semibold font-mono">{clicksCount} Clicks</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenCompanionTab}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-950 transition-all cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Click & Open Webpage</span>
                </button>
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
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-presentation allow-modals allow-downloads allow-pointer-lock"
            referrerPolicy="no-referrer"
            onError={() => setIframeError(true)}
          />
        )}

        {/* Floating Safe Mode & Click Status */}
        <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 rounded-lg border border-slate-800/90 bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Safe Frame Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <MousePointerClick className="h-3.5 w-3.5" />
            <span>Webpage Clicks: <strong className="text-white">{clicksCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
