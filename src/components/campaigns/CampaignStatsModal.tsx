import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { Badge } from '../common/Badge.js';
import { Eye, Clock, CheckCircle2, ShieldCheck, Coins, Globe, Calendar } from 'lucide-react';

interface CampaignStatsModalProps {
  campaignId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignStatsModal({ campaignId, isOpen, onClose }: CampaignStatsModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || !isOpen) return;

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.getCampaignDetails(campaignId);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [campaignId, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.campaign?.title || 'Campaign Statistics & Delivery'}
      subtitle={data?.campaign?.url || ''}
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-rose-950/80 p-4 text-xs text-rose-300 border border-rose-800">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Delivered Visits</span>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-lg font-bold text-white">
                <Eye className="h-4 w-4 text-cyan-400" />
                <span>{data.metrics.completed_visits}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Completion Rate</span>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-lg font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{data.metrics.completion_rate}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Avg Dwell Time</span>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-lg font-bold text-sky-400">
                <Clock className="h-4 w-4" />
                <span>{data.metrics.avg_dwell_seconds}s</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Remaining Budget</span>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-lg font-bold text-amber-400">
                <Coins className="h-4 w-4" />
                <span>{data.metrics.remaining_credits} CR</span>
              </div>
            </div>
          </div>

          {/* Automated Safety Review Card */}
          {data.review && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Automated Safety Engine Verification</span>
                </div>
                <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-800/60">
                  Score: {data.review.automated_score}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${data.review.automated_checks?.https_valid ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>HTTPS Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${data.review.automated_checks?.private_ip_blocked ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>Public DNS Valid</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${data.review.automated_checks?.malicious_pattern_free ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>Threat Scan Clean</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Visitor Activity Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Recent Verified Human Visits ({data.recent_visits.length})
            </h4>

            {data.recent_visits.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-center text-xs text-slate-500">
                No visitor sessions recorded yet. Visits will appear here in real-time as network surfers view your page.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                      <th className="px-4 py-2.5 font-semibold">Visitor</th>
                      <th className="px-4 py-2.5 font-semibold">Dwell Duration</th>
                      <th className="px-4 py-2.5 font-semibold">Credits Charged</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {data.recent_visits.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                          {new Date(v.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-white">
                          {v.visitor_name || 'Network Surfer'}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-cyan-300">
                          {v.actual_dwell_seconds || v.duration_seconds}s
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-amber-400">
                          -{Number(v.credits_charged).toFixed(2)} CR
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            v.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {v.status === 'completed' ? 'Verified' : v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
