import React, { useState } from 'react';
import { Pause, Play, SkipForward, Flag, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Modal } from '../common/Modal.js';

interface SurfControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onSkipNext: () => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentCampaignId?: string;
}

export function SurfControls({
  isPaused,
  onTogglePause,
  onSkipNext,
  onExit,
  soundEnabled,
  onToggleSound,
  currentCampaignId
}: SurfControlsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('framing_issue');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = () => {
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      onSkipNext();
    }, 1200);
  };

  return (
    <div id="surf-controls-bar" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-lg">
      {/* Left exit */}
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Exit Surfing</span>
      </button>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        <button
          id="surf-pause-toggle-btn"
          onClick={onTogglePause}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            isPaused
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950'
              : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isPaused ? <Play className="h-4 w-4 fill-white" /> : <Pause className="h-4 w-4" />}
          <span>{isPaused ? 'Resume Timer' : 'Pause'}</span>
        </button>

        <button
          id="surf-skip-next-btn"
          onClick={onSkipNext}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          title="Skip to next campaign in queue"
        >
          <SkipForward className="h-4 w-4" />
          <span>Skip Website</span>
        </button>

        <button
          onClick={onToggleSound}
          className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
          title={soundEnabled ? 'Mute reward audio chime' : 'Enable reward audio chime'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Right report */}
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report Website</span>
      </button>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Website Issue"
        subtitle="Help maintain safety in the WebZoneBW TrafficLoop network."
        maxWidth="md"
      >
        {reportSubmitted ? (
          <div className="py-6 text-center text-emerald-400">
            <p className="text-sm font-semibold">Thank you. Report received by admin safety team.</p>
            <p className="mt-1 text-xs text-slate-400">Skipping to next website...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Issue Type</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="framing_issue">Blank frame / refuses connection (CSP/X-Frame-Options)</option>
                <option value="malicious">Suspected malware or phishing</option>
                <option value="broken_link">Broken 404 or inactive destination</option>
                <option value="inappropriate">Inappropriate or prohibited content</option>
                <option value="audio_popup">Obnoxious audio/popup overlay</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Submit Report & Skip
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
