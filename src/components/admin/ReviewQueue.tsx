import React, { useState } from 'react';
import { ShieldCheck, Check, X, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { Modal } from '../common/Modal.js';

interface ReviewQueueProps {
  reviews: any[];
  onDecision: (reviewId: string, decision: 'approve' | 'reject', reason?: string) => Promise<void>;
  onRefresh: () => void;
}

export function ReviewQueue({ reviews, onDecision, onRefresh }: ReviewQueueProps) {
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Safety guidelines mismatch');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (reviewId: string) => {
    try {
      setIsProcessing(true);
      await onDecision(reviewId, 'approve');
      onRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedReview) return;
    try {
      setIsProcessing(true);
      await onDecision(selectedReview.id, 'reject', rejectReason);
      setSelectedReview(null);
      onRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Campaign Safety Review Queue</h3>
          <p className="text-xs text-slate-400">
            Verify pending website campaigns before they become eligible for network traffic exchange.
          </p>
        </div>
        <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-800/60">
          {reviews.length} Pending
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400 opacity-60 mb-2" />
          <p className="text-sm font-semibold text-white">Review queue is completely clear!</p>
          <p className="mt-1 text-xs text-slate-500">All submitted campaigns have been processed or auto-approved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((r) => {
            const checks = r.automated_checks || {};
            return (
              <div
                key={r.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur shadow-md hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left campaign details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-slate-700">
                        {r.category || 'Tech'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        by {r.user_name} ({r.user_email})
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-bold text-white truncate">{r.campaign_title}</h4>

                    <div className="mt-1 flex items-center gap-2">
                      <a
                        href={r.campaign_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline truncate max-w-md"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{r.campaign_url}</span>
                      </a>
                    </div>

                    {/* Automated check badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold text-[10px] border ${
                        r.automated_score >= 80 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                      }`}>
                        <ShieldCheck className="h-3 w-3" />
                        Safety Score: {r.automated_score}/100
                      </span>

                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] border ${
                        checks.https_valid 
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900' 
                          : 'bg-rose-950/50 text-rose-400 border-rose-900'
                      }`}>
                        {checks.https_valid ? 'HTTPS Verified' : 'No HTTPS'}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        Duration: {r.duration_seconds}s | Budget: {r.credit_budget} CR
                      </span>
                    </div>

                    {/* Check details */}
                    {checks.details && checks.details.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Scanner notes: </span>
                        {checks.details.join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedReview(r)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 rounded-lg border border-rose-800/60 bg-rose-950/60 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve & Activate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with reason */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Reject Campaign Submission"
        subtitle="The campaign creator will receive this rejection reason and have their unspent credits refunded."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Reason</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none mb-2"
            >
              <option value="Prohibited or inappropriate content">Prohibited or inappropriate content</option>
              <option value="Broken destination URL (404 or unreachable)">Broken destination URL (404 or unreachable)</option>
              <option value="Severe framing restrictions / X-Frame-Options block">Severe framing restrictions / X-Frame-Options block</option>
              <option value="Malicious or deceptive landing page pattern">Malicious or deceptive landing page pattern</option>
              <option value="Non-HTTPS plain HTTP protocol unsupported">Non-HTTPS plain HTTP protocol unsupported</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRejectConfirm}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
            >
              Confirm Rejection & Refund
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
