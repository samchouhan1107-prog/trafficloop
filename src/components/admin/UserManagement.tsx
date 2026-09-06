import React, { useState } from 'react';
import { User } from '../../types.js';
import { Badge } from '../common/Badge.js';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { Search, Sliders, Shield, Ban, CheckCircle2, User as UserIcon, Coins } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
}

export function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Administrative loyalty grant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      const res = await api.adjustUserCredits(selectedUser.id, Number(adjustAmount), adjustReason);
      setMessage(res.message);
      setTimeout(() => {
        setMessage(null);
        setSelectedUser(null);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change ${user.email} status to ${nextStatus}?`)) return;
    try {
      await api.updateUserStatus(user.id, nextStatus);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleRole = async (user: User) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role of ${user.email} to ${nextRole}?`)) return;
    try {
      await api.updateUserStatus(user.id, undefined, nextRole);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Platform User Accounts</h3>
          <p className="text-xs text-slate-400">Manage network members, credit reserves, and access privileges.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">User Details</th>
              <th className="px-4 py-3 font-semibold">Role & Status</th>
              <th className="px-4 py-3 font-semibold text-right">Balance</th>
              <th className="px-4 py-3 font-semibold text-center">Surfed / Received</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{u.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                  <div className="text-[10px] text-slate-500">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Badge status={u.role} />
                    <Badge status={u.status} />
                  </div>
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="font-bold text-amber-400">{u.credits.toFixed(2)} CR</div>
                  <div className="text-[10px] text-slate-500">Earned: {u.total_earned_credits.toFixed(1)}</div>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="text-cyan-300 font-semibold">{u.total_visits_made}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-emerald-300 font-semibold">{u.total_visits_received}</span>
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setAdjustAmount(10);
                        setAdjustReason('Administrative loyalty grant');
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-slate-700 transition-colors"
                      title="Adjust Credits"
                    >
                      Adjust CR
                    </button>

                    <button
                      onClick={() => handleToggleRole(u)}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                      title={u.role === 'admin' ? 'Demote to regular User' : 'Promote to Admin'}
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`rounded-lg border p-1.5 transition-colors ${
                        u.status === 'active'
                          ? 'border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400'
                          : 'border-emerald-800 bg-emerald-950 text-emerald-400'
                      }`}
                      title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust Credits Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Adjust Credits for ${selectedUser?.name || ''}`}
        subtitle={`Current balance: ${selectedUser?.credits.toFixed(2)} CR (${selectedUser?.email})`}
        maxWidth="md"
      >
        {message ? (
          <div className="py-6 text-center text-emerald-400 font-semibold text-sm">
            {message}
          </div>
        ) : (
          <form onSubmit={handleAdjustCredits} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Amount (+ to add, - to deduct)</label>
              <input
                type="number"
                step="0.5"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Trail Reason</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                {isSubmitting ? 'Applying Adjustment...' : 'Apply Credit Change'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
