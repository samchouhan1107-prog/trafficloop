import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Share2, 
  Building2, 
  CreditCard, 
  Coins, 
  Smartphone, 
  History, 
  ExternalLink,
  Plus,
  MapPin,
  Globe,
  UserCheck,
  Save
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { BankDetails, PaymentOrder } from '../types.js';
import { BuyCreditsModal } from '../components/payments/BuyCreditsModal.js';
import { formatCredits, formatInr, formatCurrencyValue } from '../utils/formatters.js';

const AVAILABLE_COUNTRIES = [
  'Botswana',
  'India',
  'South Africa',
  'United States',
  'United Kingdom',
  'Namibia',
  'Zimbabwe',
  'Kenya',
  'Nigeria',
  'Germany',
  'Canada',
  'Australia',
  'Worldwide / Global'
];

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || 'Botswana');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'INR');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Bank and Payments state
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLocation(user.location || 'Botswana');
      setPreferredCurrency(user.preferred_currency || 'INR');
    }
  }, [user]);

  useEffect(() => {
    loadBankAndPaymentInfo();
  }, []);

  const loadBankAndPaymentInfo = async () => {
    try {
      setIsLoadingPayments(true);
      const pkgRes = await api.getPaymentPackages();
      if (pkgRes.bankDetails) {
        setBankDetails(pkgRes.bankDetails);
      }
      const myOrdersRes = await api.getMyPaymentOrders();
      setOrders(myOrdersRes.orders || []);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${user?.id?.slice(0, 8) || 'join'}` 
    : 'https://trafficloop.webzonebw.com/register';

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleCopyBank = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(field);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);

    if (!name.trim()) {
      setProfileStatus({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        location: location.trim(),
        preferredCurrency: preferredCurrency.trim()
      });
      setProfileStatus({ type: 'success', message: res.message || 'Profile updated successfully!' });
      await refreshUser();
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await api.updatePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Account Profile & Linked Payments</h1>
          <p className="text-xs text-slate-400">
            Manage your account security, official banking link for services, and credit purchases.
          </p>
        </div>

        <button
          onClick={() => setIsBuyModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 transition-all"
        >
          <Coins className="w-4 h-4" />
          <span>Top Up Traffic Credits</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Referral */}
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-lg">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">{user?.name}</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{user?.email}</p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Role</span>
                <Badge status={user?.role} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Primary Location</span>
                <span className="inline-flex items-center gap-1 font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {user?.location || 'Botswana'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Status</span>
                <Badge status={user?.status} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Available Credits</span>
                <div className="text-right">
                  <span className="font-bold text-amber-400 text-sm">{formatCredits(user?.credits)} CR</span>
                  <div className="text-[11px] font-semibold text-emerald-400">
                    ≈ {formatInr((user?.credits || 0) * 1.5)} (Real-Time INR)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Preferred Currency</span>
                <span className="font-bold text-emerald-300 font-mono">
                  {user?.preferred_currency || 'INR'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Member Since</span>
                <span className="font-mono text-slate-300">
                  {user ? new Date(user.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile & Location Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Profile & Location Settings</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Set your display identity and primary country/region for network verification and localized traffic exchange.
            </p>

            {profileStatus && (
              <div className={`mb-3 flex items-center gap-2 rounded-lg p-2.5 text-xs border ${
                profileStatus.type === 'success'
                  ? 'border-emerald-800 bg-emerald-950/70 text-emerald-300'
                  : 'border-rose-800 bg-rose-950/70 text-rose-300'
              }`}>
                {profileStatus.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{profileStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1 text-[11px]">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 text-[11px]">Primary Country / Region</label>
                <div className="relative">
                  <select
                    value={AVAILABLE_COUNTRIES.includes(location) ? location : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setLocation(e.target.value);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {AVAILABLE_COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                    {!AVAILABLE_COUNTRIES.includes(location) && (
                      <option value="custom" className="bg-slate-900 text-white">
                        Custom: {location}
                      </option>
                    )}
                  </select>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Or type custom country / city / territory"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-slate-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 text-[11px]">Preferred Currency Display</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value as 'INR' | 'USD' | 'BWP' | 'EUR' | 'GBP')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-semibold"
                >
                  <option value="INR">Indian Rupee (INR - ₹) [Default]</option>
                  <option value="USD">US Dollar (USD - $)</option>
                  <option value="BWP">Botswana Pula (BWP - P)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                  <option value="GBP">British Pound (GBP - £)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Credit transactions and balances will be benchmarked to this currency in real time.
                </p>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Referral Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Network Referral Link</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Share TrafficLoop across WebZoneBW. Earn instant bonus credits for every verified referral.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyReferral}
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shrink-0"
              >
                {copiedReferral ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedReferral ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Bank Details & Payment Options & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Bank Account Details for Payments */}
          <div className="rounded-2xl border border-cyan-800/60 bg-cyan-950/20 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-3 border-b border-cyan-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Official Linked Bank Account (Payment Gateway)</h3>
              </div>
              <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Verified Linked Account
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              To pay for traffic exchange campaigns, services, and credit bundles, direct payments can be made to our linked First National Bank Botswana business account:
            </p>

            {bankDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Bank Name</span>
                  <div className="font-bold text-white mt-0.5">{bankDetails.bankName}</div>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Account Holder</span>
                  <div className="font-bold text-white mt-0.5">{bankDetails.accountName}</div>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Account Number</span>
                    <div className="font-mono font-bold text-cyan-400 mt-0.5">{bankDetails.accountNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBank(bankDetails.accountNumber, 'acc')}
                    className="rounded p-1 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    title="Copy Account Number"
                  >
                    {copiedBankField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Branch Code / SWIFT</span>
                  <div className="font-bold text-white mt-0.5">{bankDetails.branchCode} • SWIFT: {bankDetails.swiftCode}</div>
                </div>
              </div>
            )}

            {/* Mobile money & alternative gateways info */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Orange Money / Smega: +267 71 234 567</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Instant Card & EFT Automation Supported</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Purchase Credit Package via Bank / Card</span>
              </button>
            </div>
          </div>

          {/* Deposit & Payment Orders History */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Recent Payment & Deposit Orders</h3>
              </div>
              <button
                onClick={loadBankAndPaymentInfo}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 text-center text-xs text-slate-500">
                No payment transactions recorded yet. Click "Top Up Traffic Credits" to scale your traffic.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">{order.payment_reference}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          order.status === 'approved' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : order.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        }`}>
                          {order.status === 'approved' ? 'Credited' : order.status === 'pending' ? 'Pending Review' : 'Rejected'}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {order.package_name} • Method: {order.payment_method.replace('_', ' ')} • {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white">{formatCurrencyValue(order.fiat_amount, order.currency)} {order.currency}</div>
                      <div className="text-[11px] font-semibold text-amber-400">+{formatCredits(order.credits_amount)} CR</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Change Account Password</h3>
            </div>

            {passwordStatus && (
              <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs border ${
                passwordStatus.type === 'success'
                  ? 'border-emerald-800 bg-emerald-950/70 text-emerald-300'
                  : 'border-rose-800 bg-rose-950/70 text-rose-300'
              }`}>
                {passwordStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => {
          refreshUser();
          loadBankAndPaymentInfo();
        }}
      />
    </div>
  );
}
