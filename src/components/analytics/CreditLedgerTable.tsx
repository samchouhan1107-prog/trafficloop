import React, { useState } from 'react';
import { CreditTransaction, TransactionType } from '../../types.js';
import { Coins, ArrowDownLeft, ArrowUpRight, Gift, Sliders, RotateCcw, Send } from 'lucide-react';
import { formatCredits, formatInr } from '../../utils/formatters.js';

interface CreditLedgerTableProps {
  transactions: CreditTransaction[];
  currentBalance: number;
}

export function CreditLedgerTable({ transactions, currentBalance }: CreditLedgerTableProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'visit_reward':
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      case 'campaign_spend':
        return <ArrowUpRight className="h-4 w-4 text-rose-400" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-amber-400" />;
      case 'adjustment':
        return <Sliders className="h-4 w-4 text-indigo-400" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4 text-sky-400" />;
      case 'transfer':
        return <Send className="h-4 w-4 text-purple-400" />;
      default:
        return <Coins className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    const map: Record<TransactionType, { label: string; class: string }> = {
      visit_reward: { label: 'Surfing Reward', class: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60' },
      campaign_spend: { label: 'Campaign Delivery', class: 'bg-rose-950/70 text-rose-300 border-rose-800/60' },
      bonus: { label: 'Bonus Gift', class: 'bg-amber-950/70 text-amber-300 border-amber-800/60' },
      streak_milestone_bonus: { label: 'Streak Mystery Box', class: 'bg-amber-900/80 text-amber-200 border-amber-600/70 font-bold' },
      adjustment: { label: 'Admin Adjustment', class: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60' },
      refund: { label: 'Budget Refund', class: 'bg-sky-950/70 text-sky-300 border-sky-800/60' },
      transfer: { label: 'Peer Transfer', class: 'bg-purple-950/70 text-purple-300 border-purple-800/60' }
    };
    const item = map[type] || { label: type, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${item.class}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div id="credit-ledger-container" className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white">Credit Transaction Ledger</h3>
          <p className="text-xs text-slate-400">
            Strict double-entry audit history of every credit earned, spent, and refunded.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="visit_reward">Surfing Rewards</option>
            <option value="campaign_spend">Campaign Spends</option>
            <option value="bonus">Bonuses</option>
            <option value="refund">Refunds</option>
            <option value="adjustment">Adjustments</option>
            <option value="transfer">Transfers</option>
          </select>

          <input
            type="text"
            placeholder="Search description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold text-right">Credits</th>
              <th className="px-4 py-3 font-semibold text-right text-emerald-400">INR Value (₹)</th>
              <th className="px-4 py-3 font-semibold text-right">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No credit transactions matching the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {getTypeBadge(tx.type)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span>{tx.description}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{formatCredits(tx.amount)} CR
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                      {isPositive ? '+' : '-'}{formatInr(Math.abs(tx.amount) * 1.5)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-300">
                      {formatCredits(tx.balance_after)} CR
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
