import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import {
  TriStationEngineResponse,
  StationControlPayload,
  StationId
} from '../types.js';
import { TriStationCard } from '../components/triStation/TriStationCard.js';
import { TriStationMasterControls } from '../components/triStation/TriStationMasterControls.js';
import { TriStationMetricsPanel } from '../components/triStation/TriStationMetricsPanel.js';
import { LiveCyclePoolMonitor } from '../components/surf/LiveCyclePoolMonitor.js';
import {
  Monitor,
  Flame,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  Activity,
  Cpu
} from 'lucide-react';

interface TriStationPageProps {
  onNavigate: (path: string) => void;
}

export function TriStationPage({ onNavigate }: TriStationPageProps) {
  const { toast } = useToast();
  const [engineData, setEngineData] = useState<TriStationEngineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Tri-Station engine state
  const fetchState = async (isBackground = false) => {
    try {
      if (!isBackground) setIsRefreshing(true);
      const data = await api.getTriStationState();
      setEngineData(data);
    } catch (err: any) {
      console.error('Failed to fetch Tri-Station state:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and periodic polling
  useEffect(() => {
    fetchState(false);

    // Poll every 1.5s for smooth countdowns and live telemetry
    pollTimerRef.current = setInterval(() => {
      fetchState(true);
    }, 1500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Handle station control actions
  const handleControl = async (payload: StationControlPayload) => {
    try {
      const updated = await api.controlTriStation(payload);
      setEngineData(updated);

      if (payload.action === 'start') {
        const targetLabel = payload.stationId ? `Station ${payload.stationId}` : 'All 3 Stations';
        toast.info(`🚀 Launched ${targetLabel} remote browser session(s).`);
      } else if (payload.action === 'stop') {
        toast.info('Halted station session(s).');
      } else if (payload.action === 'reset') {
        toast.info('Reset station statistics.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch station control command');
    }
  };

  // Handle setting all stations to a specific country
  const handleSelectGlobalGeo = async (countryCode: string) => {
    if (!countryCode) return;
    try {
      // Configure all 3 stations
      const sIds: StationId[] = ['station-1', 'station-2', 'station-3'];
      for (const sId of sIds) {
        await api.controlTriStation({
          action: 'start',
          stationId: sId,
          config: { targetCountry: countryCode }
        });
      }
      toast.success(`🌍 Synced all 3 stations to route through ${countryCode} egress nodes!`);
      fetchState(false);
    } catch (err: any) {
      toast.error('Failed to sync global country routing');
    }
  };

  // Handle applying strategic presets
  const handleApplyPreset = async (presetName: 'ecommerce' | 'cdn' | 'apac' | 'tier1' | 'repair_tech') => {
    try {
      if (presetName === 'repair_tech') {
        await api.controlTriStation({
          action: 'start',
          stationId: 'station-1',
          config: {
            targetCountry: 'US',
            targetCity: 'New York',
            searchKeyword: 'repair tech hiring',
            searchTheme: 'repair tech hiring',
            trafficMedium: 'organic',
            dwellDurationSeconds: 15
          }
        });
        await api.controlTriStation({
          action: 'start',
          stationId: 'station-2',
          config: {
            targetCountry: 'IN',
            targetCity: 'Mumbai',
            searchKeyword: 'appliance repair technician jobs',
            searchTheme: 'appliance repair tech',
            trafficMedium: 'organic',
            dwellDurationSeconds: 20
          }
        });
        await api.controlTriStation({
          action: 'start',
          stationId: 'station-3',
          config: {
            targetCountry: 'DE',
            targetCity: 'Frankfurt',
            searchKeyword: 'hvac diagnostic specialist',
            searchTheme: 'hvac diagnostic specialist',
            trafficMedium: 'organic',
            dwellDurationSeconds: 25
          }
        });
        toast.success('🔍 Applied "Repair Tech Hiring" 3-Node Organic Search & Attribution Preset!');
      } else if (presetName === 'tier1') {
        await api.controlTriStation({ action: 'start', stationId: 'station-1', config: { targetCountry: 'US', dwellDurationSeconds: 15 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-2', config: { targetCountry: 'DE', dwellDurationSeconds: 20 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-3', config: { targetCountry: 'GB', dwellDurationSeconds: 25 } });
        toast.success('💎 Applied Tier-1 High Value Preset (US, DE, GB)');
      } else if (presetName === 'apac') {
        await api.controlTriStation({ action: 'start', stationId: 'station-1', config: { targetCountry: 'IN', dwellDurationSeconds: 15 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-2', config: { targetCountry: 'SG', dwellDurationSeconds: 15 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-3', config: { targetCountry: 'JP', dwellDurationSeconds: 20 } });
        toast.success('🌏 Applied APAC Regional Cluster Preset (IN, SG, JP)');
      } else if (presetName === 'cdn') {
        await api.controlTriStation({ action: 'start', stationId: 'station-1', config: { targetCountry: 'US', dwellDurationSeconds: 10 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-2', config: { targetCountry: 'SG', dwellDurationSeconds: 10 } });
        await api.controlTriStation({ action: 'start', stationId: 'station-3', config: { targetCountry: 'DE', dwellDurationSeconds: 10 } });
        toast.success('⚡ Applied Edge CDN TTFB Benchmark Preset (10s rapid cycles)');
      }
      fetchState(false);
    } catch (err: any) {
      toast.error('Failed to apply testing preset');
    }
  };

  // Handle global push URL to all 3 windows
  const handleGlobalPushUrl = async (url: string, keyword: string) => {
    try {
      const sIds: StationId[] = ['station-1', 'station-2', 'station-3'];
      for (const sId of sIds) {
        await api.pushUrlToTriStation({
          stationId: sId,
          url,
          searchKeyword: keyword,
          searchTheme: keyword
        });
      }
      toast.success(`🚀 Pushed ${url} with "${keyword}" theme to all 3 station windows with active cookies & ad display!`);
      fetchState(false);
    } catch (err: any) {
      toast.error('Failed to broadcast URL to all stations');
    }
  };

  if (isLoading || !engineData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <h3 className="text-base font-bold text-white">Initializing Tri-Station Multi-Browser Engine...</h3>
        <p className="text-xs text-slate-400">Instantiating Alpha, Beta, and Gamma independent runtime containers.</p>
      </div>
    );
  }

  const { stations, metrics, availableCampaigns, supportedCountries, isGlobalMasterRunning } = engineData;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Engine Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/surf')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Flame className="h-3.5 w-3.5 text-cyan-400" />
            <span>Single Surf Arena</span>
          </button>

          <span className="text-slate-600">/</span>

          <div className="flex items-center gap-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 px-3 py-1.5 text-xs font-bold text-cyan-300">
            <Monitor className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tri-Station Multi-Browser (3 Windows)</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">/</span>

          <LiveCyclePoolMonitor
            onSelectSite={(id) => onNavigate(`/surf?campaignId=${id}`)}
          />
        </div>

        {/* Live Refresh Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchState(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => onNavigate('/campaigns')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Manage Campaigns</span>
          </button>
        </div>
      </div>

      {/* 1. Master Control Panel */}
      <TriStationMasterControls
        metrics={metrics}
        isGlobalRunning={isGlobalMasterRunning}
        supportedCountries={supportedCountries}
        onControl={handleControl}
        onSelectGlobalGeo={handleSelectGlobalGeo}
        onApplyPreset={handleApplyPreset}
        onGlobalPushUrl={handleGlobalPushUrl}
      />

      {/* 2. Three Independent Browser Windows / Stations (Grid) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Concurrent Station Viewports (Alpha · Beta · Gamma)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {metrics.activeSessions} / 3 Stations Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TriStationCard
            station={stations['station-1']}
            supportedCountries={supportedCountries}
            availableCampaigns={availableCampaigns}
            onControl={handleControl}
          />

          <TriStationCard
            station={stations['station-2']}
            supportedCountries={supportedCountries}
            availableCampaigns={availableCampaigns}
            onControl={handleControl}
          />

          <TriStationCard
            station={stations['station-3']}
            supportedCountries={supportedCountries}
            availableCampaigns={availableCampaigns}
            onControl={handleControl}
          />
        </div>
      </div>

      {/* 3. Real-Time Telemetry & Measurement Panel */}
      <TriStationMetricsPanel
        metrics={metrics}
        stations={stations}
      />
    </div>
  );
}
