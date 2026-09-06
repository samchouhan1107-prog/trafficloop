import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { Campaign } from '../../types.js';
import { 
  ShieldCheck, 
  Globe2, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ExternalLink, 
  Sliders, 
  Server, 
  Network, 
  FileCode2,
  Clock,
  Coins,
  Compass
} from 'lucide-react';
import { formatCredits } from '../../utils/formatters.js';

interface CampaignVerifySettingsModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: (campaign: Campaign) => void;
  onTestSurf?: (campaign: Campaign) => void;
}

export function CampaignVerifySettingsModal({
  campaign,
  isOpen,
  onClose,
  onOpenSettings,
  onTestSurf
}: CampaignVerifySettingsModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    if (!campaign) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifyCampaignRouting(campaign.id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to verify campaign routing configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaign) {
      runVerification();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, campaign?.id]);

  if (!campaign) return null;

  const getGeoFlag = (loc: string) => {
    const l = loc.toLowerCase();
    if (l.includes('united states') || l === 'us' || l.includes('north america')) return '🇺🇸';
    if (l.includes('canada') || l === 'ca') return '🇨🇦';
    if (l.includes('india') || l === 'in') return '🇮🇳';
    if (l.includes('europe') || l.includes('germany') || l.includes('uk')) return '🇪🇺';
    if (l.includes('australia')) return '🇦🇺';
    if (l.includes('botswana')) return '🇧🇼';
    if (l.includes('south africa')) return '🇿🇦';
    if (l.includes('tier 1')) return '💎';
    return '🌐';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Traffic & Geo Routing Verification"
      subtitle={`Diagnostics & routing rule alignment for "${campaign.title}"`}
      maxWidth="lg"
    >
      <div id="campaign-verify-settings-container" className="space-y-5 text-slate-200">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
            <h4 className="text-sm font-bold text-white">Verifying Traffic Routing Configurations...</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Validating geo profiles, Google Analytics protocol headers, proxy allocation, and destination reachability.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-rose-400 mb-2" />
            <h4 className="text-xs font-bold text-rose-200">Verification Inspection Error</h4>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            <button
              onClick={runVerification}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-900/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Check</span>
            </button>
          </div>
        )}

        {/* Verified Content */}
        {!isLoading && data && (
          <div className="space-y-4">
            {/* Top Overview Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800 text-xl">
                  {getGeoFlag(data.targetLocations)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{data.geoProfile.country}</span>
                    <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-800/80">
                      {data.routingMode === 'strict_geo' ? 'Strict Geo-Targeted' : data.routingMode === 'regional_pool' ? 'Regional Pool' : 'Global Network Pool'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                    {data.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={runVerification}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Re-run Live Routing Check"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings(campaign);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-cyan-800 bg-cyan-950 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Edit Rules</span>
                  </button>
                )}
              </div>
            </div>

            {/* Diagnostic Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Box 1: Geo Routing & IP Assignment */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Globe2 className="h-4 w-4 text-cyan-400" />
                    <span>Geo-Targeting Routing Engine</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    MATCH: 100%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Target Rule:</span>
                    <span className="text-cyan-300 font-semibold">{data.targetLocations}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Assigned Country:</span>
                    <span>{data.geoProfile.country} ({data.geoProfile.code})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Simulated IP:</span>
                    <span className="text-amber-300">{data.simulatedRouting.ipAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Browser Locale:</span>
                    <span>{data.geoProfile.locale}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Accept-Language:</span>
                    <span className="truncate max-w-[150px]">{data.geoProfile.languages}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Google Analytics & Header Attribution */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Radio className="h-4 w-4 text-indigo-400" />
                    <span>GA4 & Protocol Headers</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/60">
                    UIP OVERRIDE ON
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">GA4 Measurement ID:</span>
                    <span className={data.analytics.detectedGa4Tag ? 'text-emerald-400' : 'text-slate-500'}>
                      {data.analytics.detectedGa4Tag || 'No tag detected (UTM recommended)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">GA4 Attribution IP:</span>
                    <span className="text-cyan-300">{data.simulatedRouting.uipOverride}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">X-Forwarded-For:</span>
                    <span>{data.simulatedRouting.forwardedFor}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Target Country in GA:</span>
                    <span className="text-emerald-400 font-bold">{data.simulatedRouting.countryAttribution}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-sans">Referrer Header:</span>
                    <span className="text-slate-400">trafficloop.global/surf</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination URL Live Test & Throttle Alignment */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <span>Destination Deliverability & Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                    data.urlCheck.ok ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    HTTP {data.urlCheck.status || 'ERR'} ({data.urlCheck.responseTimeMs}ms)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Device Filter</span>
                  <span className="font-bold text-slate-200 capitalize mt-0.5 block">
                    {data.throttling.deviceTargeting === 'all' ? 'All (Desktop+Mobile)' : data.throttling.deviceTargeting}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Daily Cap</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {data.throttling.todayVisits} / {data.throttling.dailyLimit}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Dwell Duration</span>
                  <span className="font-bold text-cyan-300 mt-0.5 block">
                    {data.throttling.durationSeconds}s
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Remaining Credits</span>
                  <span className="font-bold text-amber-300 mt-0.5 block">
                    {formatCredits(data.throttling.remainingCredits)} CR
                  </span>
                </div>
              </div>
            </div>

            {/* System Alignment Checks List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Active Routing Alignments</span>
              </div>
              <div className="space-y-1.5">
                {data.systemHealth.checksPassed.map((chk: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{chk}</span>
                  </div>
                ))}
              </div>

              {data.systemHealth.recommendations && data.systemHealth.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Recommendations for Optimal Tracking:</span>
                  </div>
                  {data.systemHealth.recommendations.map((rec: string, idx: number) => (
                    <p key={idx} className="text-xs text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500">
                      {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {onTestSurf && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTestSurf(campaign);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Test Surf View</span>
                  </button>
                )}
                <a
                  href={campaign.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  <span>Open Destination</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow"
              >
                Done / Looks Good
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
