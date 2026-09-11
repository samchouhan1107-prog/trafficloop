import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, Building2, CreditCard, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api.js';

interface PlatformSettingsProps {
  settings: any;
  onRefresh: () => void;
}

export function PlatformSettings({ settings, onRefresh }: PlatformSettingsProps) {
  const [formData, setFormData] = useState({
    base_credit_reward: settings?.base_credit_reward || 1.0,
    cost_per_second: settings?.cost_per_second || 0.05,
    min_duration_seconds: settings?.min_duration_seconds || 10,
    max_duration_seconds: settings?.max_duration_seconds || 60,
    welcome_bonus_credits: settings?.welcome_bonus_credits || 15.0,
    daily_bonus_credits: settings?.daily_bonus_credits || 5.0,
    cooldown_between_same_campaign_mins: settings?.cooldown_between_same_campaign_mins || 30,
    auto_approval_enabled: settings?.auto_approval_enabled !== 0,
    auto_approval_min_score: settings?.auto_approval_min_score || 85,
    max_visits_per_user_hourly: settings?.max_visits_per_user_hourly || 120,
    maintenance_mode: settings?.maintenance_mode === 1,
    // Bank & Financial Settings
    bank_name: settings?.bank_name || 'First National Bank Botswana (FNB BW)',
    bank_account_name: settings?.bank_account_name || 'WebZoneBW TrafficLoop Ltd',
    bank_account_number: settings?.bank_account_number || '62849201948',
    bank_branch_code: settings?.bank_branch_code || '281467',
    bank_swift_code: settings?.bank_swift_code || 'FIRNBWGX',
    bank_currency: settings?.bank_currency || 'BWP',
    bank_payment_instructions: settings?.bank_payment_instructions || 'Please include your unique Order Payment Reference in the transfer narrative.',
    credit_price_per_unit: settings?.credit_price_per_unit || 0.27,
    mobile_money_details: settings?.mobile_money_details || 'Orange Money / Smega / FNB eWallet: +267 71 234 567',
    crypto_wallet_address: settings?.crypto_wallet_address || 'TTrafficLoopOfficialTreasury99X',
    // Kotak 811 UPI Settings
    upi_id: settings?.upi_id || '8198091036@kotakbank',
    upi_name: settings?.upi_name || 'Sameer Chouhan',
    upi_bank_name: settings?.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
    upi_instructions: settings?.upi_instructions || 'Scan with GPay, PhonePe, Paytm, BHIM or any UPI app. Enter 12-digit UTR for instant auto-credit.',
    upi_enabled: settings?.upi_enabled !== 0
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        base_credit_reward: settings.base_credit_reward ?? 1.0,
        cost_per_second: settings.cost_per_second ?? 0.05,
        min_duration_seconds: settings.min_duration_seconds ?? 10,
        max_duration_seconds: settings.max_duration_seconds ?? 60,
        welcome_bonus_credits: settings.welcome_bonus_credits ?? 15.0,
        daily_bonus_credits: settings.daily_bonus_credits ?? 5.0,
        cooldown_between_same_campaign_mins: settings.cooldown_between_same_campaign_mins ?? 30,
        auto_approval_enabled: settings.auto_approval_enabled !== 0,
        auto_approval_min_score: settings.auto_approval_min_score ?? 85,
        max_visits_per_user_hourly: settings.max_visits_per_user_hourly ?? 120,
        maintenance_mode: settings.maintenance_mode === 1,
        bank_name: settings.bank_name || 'First National Bank Botswana (FNB BW)',
        bank_account_name: settings.bank_account_name || 'WebZoneBW TrafficLoop Ltd',
        bank_account_number: settings.bank_account_number || '62849201948',
        bank_branch_code: settings.bank_branch_code || '281467',
        bank_swift_code: settings.bank_swift_code || 'FIRNBWGX',
        bank_currency: settings.bank_currency || 'BWP',
        bank_payment_instructions: settings.bank_payment_instructions || 'Please include your unique Order Payment Reference in the transfer narrative.',
        credit_price_per_unit: settings.credit_price_per_unit ?? 0.27,
        mobile_money_details: settings.mobile_money_details || 'Orange Money / Smega / FNB eWallet: +267 71 234 567',
        crypto_wallet_address: settings.crypto_wallet_address || 'TTrafficLoopOfficialTreasury99X',
        upi_id: settings.upi_id || '8198091036@kotakbank',
        upi_name: settings.upi_name || 'Sameer Chouhan',
        upi_bank_name: settings.upi_bank_name || 'Kotak Mahindra Bank (Kotak 811)',
        upi_instructions: settings.upi_instructions || 'Scan with GPay, PhonePe, Paytm, BHIM or any UPI app. Enter 12-digit UTR for instant auto-credit.',
        upi_enabled: settings.upi_enabled !== 0
      });
    }
  }, [settings]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateAdminSettings(formData);
      setSuccessMessage('Platform parameters and bank account details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Platform System & Exchange Rules</h3>
          <p className="text-xs text-slate-400">Configure global exchange reward rates, safety thresholds, and official banking gateways.</p>
        </div>
        {successMessage && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Exchange Rewards & Pricing */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            1. Exchange Economics & Rewards
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Base Visit Reward (Credits)</label>
            <input
              type="number"
              step="0.1"
              value={formData.base_credit_reward}
              onChange={(e) => setFormData({ ...formData, base_credit_reward: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">Credits awarded for a standard 15-second verified visit.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Welcome Registration Bonus (Credits)</label>
            <input
              type="number"
              step="1"
              value={formData.welcome_bonus_credits}
              onChange={(e) => setFormData({ ...formData, welcome_bonus_credits: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Active Surfer Bonus (Credits)</label>
            <input
              type="number"
              step="1"
              value={formData.daily_bonus_credits}
              onChange={(e) => setFormData({ ...formData, daily_bonus_credits: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Safety & Anti-Abuse */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            2. Anti-Abuse & Automation Protection
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Same Campaign Surfing Cooldown (Minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={formData.cooldown_between_same_campaign_mins}
              onChange={(e) => setFormData({ ...formData, cooldown_between_same_campaign_mins: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">Surfer cannot view the same website again until this interval expires.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Auto-Approval Min Safety Score (0 - 100)</label>
            <input
              type="number"
              min="50"
              max="100"
              value={formData.auto_approval_min_score}
              onChange={(e) => setFormData({ ...formData, auto_approval_min_score: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="block text-xs font-semibold text-slate-300">Enable Automated Review Approval</span>
              <span className="text-[11px] text-slate-500">Auto-approve safe HTTPS URLs exceeding safety threshold</span>
            </div>
            <input
              type="checkbox"
              checked={formData.auto_approval_enabled}
              onChange={(e) => setFormData({ ...formData, auto_approval_enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Linked Bank Account & Payments Section */}
      <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            3. Linked Official Bank Account & Deposit Settings (WebZoneBW Payment Gateway)
          </h4>
        </div>
        <p className="text-xs text-slate-300">
          This bank account is displayed to all platform users when paying for traffic packages and credit reserves.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Holder Full Name</label>
            <input
              type="text"
              value={formData.bank_account_name}
              onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number</label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Code & SWIFT Code</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Branch Code"
                value={formData.bank_branch_code}
                onChange={(e) => setFormData({ ...formData, bank_branch_code: e.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="SWIFT"
                value={formData.bank_swift_code}
                onChange={(e) => setFormData({ ...formData, bank_swift_code: e.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Money / Pula Pay Contact</label>
            <input
              type="text"
              value={formData.mobile_money_details}
              onChange={(e) => setFormData({ ...formData, mobile_money_details: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Crypto Treasury Wallet (USDT TRC-20)</label>
            <input
              type="text"
              value={formData.crypto_wallet_address}
              onChange={(e) => setFormData({ ...formData, crypto_wallet_address: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Kotak 811 UPI Payment Gateway Section */}
      <div className="rounded-xl border border-red-800/60 bg-red-950/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600 font-bold text-white text-[10px]">
              811
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
              4. Kotak 811 UPI Instant Payment Gateway
            </h4>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.upi_enabled}
              onChange={(e) => setFormData({ ...formData, upi_enabled: e.target.checked })}
              className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-0"
            />
            <span className="font-semibold">Enable UPI Method</span>
          </label>
        </div>

        <p className="text-xs text-slate-300">
          Enables seamless 1-tap QR scanning and instant auto-credit via NPCI UPI apps (Google Pay, PhonePe, Paytm, BHIM, Kotak Mobile).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant UPI ID / VPA</label>
            <input
              type="text"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payee Name (as registered with Bank)</label>
            <input
              type="text"
              value={formData.upi_name}
              onChange={(e) => setFormData({ ...formData, upi_name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">UPI Bank Provider</label>
            <input
              type="text"
              value={formData.upi_bank_name}
              onChange={(e) => setFormData({ ...formData, upi_bank_name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">UPI Instructions / Helper Text</label>
          <input
            type="text"
            value={formData.upi_instructions}
            onChange={(e) => setFormData({ ...formData, upi_instructions: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving Platform Configuration...' : 'Save Configuration & Bank Link'}</span>
        </button>
      </div>
    </form>
  );
}
