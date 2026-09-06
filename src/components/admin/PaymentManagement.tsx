import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { PaymentOrder } from '../../types.js';
import { 
  Building2, 
  CreditCard, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Check, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface PaymentManagementProps {
  onRefresh?: () => void;
}

export function PaymentManagement({ onRefresh }: PaymentManagementProps) {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<{ [orderId: string]: string }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAdminPaymentOrders(filterStatus);
      setOrders(res.orders || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDecision = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingOrderId(orderId);
      const notes = actionNotes[orderId] || (action === 'approve' ? 'Approved & verified by administrator' : 'Deposit verification rejected');
      await api.reviewPaymentOrder(orderId, action, notes);
      loadOrders();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} payment order`);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.payment_reference.toLowerCase().includes(q) ||
      o.user_email.toLowerCase().includes(q) ||
      (o.user_name && o.user_name.toLowerCase().includes(q)) ||
      (o.proof_reference && o.proof_reference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Payment & Bank Deposit Orders</h3>
          <p className="text-xs text-slate-400">
            Verify user bank wire transfers, mobile money, and card transactions to credit user balances.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search reference, user, proof..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 text-center text-xs text-slate-500">
          No payment orders found matching criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-md"
            >
              {/* Top Row: Ref, User, Status, Amount */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cyan-300">
                      {order.payment_reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.payment_reference, `ref-${order.id}`)}
                      className="text-slate-400 hover:text-white"
                      title="Copy Reference"
                    >
                      {copiedField === `ref-${order.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      order.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : order.status === 'pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    }`}>
                      {order.status === 'approved' ? 'Credited' : order.status === 'pending' ? 'Pending Admin Action' : 'Rejected'}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-300">
                    User: <strong>{order.user_name || 'Member'}</strong> ({order.user_email}) • Balance: <span className="font-mono text-amber-400">{order.current_user_credits?.toFixed(2) || '0.00'} CR</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-white">
                    {order.fiat_amount.toFixed(2)} {order.currency}
                  </div>
                  <div className="text-xs font-bold text-amber-400">
                    +{order.credits_amount.toLocaleString()} Credits ({order.package_name})
                  </div>
                </div>
              </div>

              {/* Middle Row: Payment Method, Proof Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Method & Date</span>
                  <div className="font-medium text-slate-200 capitalize mt-0.5">
                    {order.payment_method.replace('_', ' ')} • {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Deposit Proof / Narrative</span>
                  <div className="font-mono font-semibold text-cyan-400 mt-0.5 break-all">
                    {order.proof_reference || '(Awaiting proof submission)'}
                  </div>
                  {order.proof_notes && (
                    <div className="text-[11px] text-slate-400 mt-0.5 italic">{order.proof_notes}</div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Actions for pending orders */}
              {order.status === 'pending' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Optional admin approval/rejection note..."
                    value={actionNotes[order.id] || ''}
                    onChange={(e) => setActionNotes({ ...actionNotes, [order.id]: e.target.value })}
                    className="w-full sm:w-80 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={processingOrderId === order.id}
                      onClick={() => handleDecision(order.id, 'reject')}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingOrderId === order.id}
                      onClick={() => handleDecision(order.id, 'approve')}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/60 hover:bg-emerald-500 disabled:opacity-50 transition-all"
                    >
                      {processingOrderId === order.id ? (
                        <span>Crediting...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Credit Balance (+{order.credits_amount} CR)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Already reviewed info */}
              {order.status !== 'pending' && order.reviewed_at && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Reviewed by {order.reviewed_by_name || 'Admin'} at {new Date(order.reviewed_at).toLocaleString()}</span>
                  {order.admin_notes && <span className="italic text-slate-400">Note: {order.admin_notes}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
