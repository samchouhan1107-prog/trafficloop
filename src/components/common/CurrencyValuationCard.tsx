import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { MarketRates, CreditValuation } from '../../types.js';
import { Coins, TrendingUp, RefreshCw, ArrowRightLeft, DollarSign, Globe2 } from 'lucide-react';
import { formatCredits, formatInr, formatCurrencyValue } from '../../utils/formatters.js';

interface CurrencyValuationCardProps {
  creditBalance: number;
  preferredCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export function CurrencyValuationCard({
  creditBalance,
  preferredCurrency = 'INR',
  onCurrencyChange
}: CurrencyValuationCardProps) {
  const [rates, setRates] = useState<MarketRates | null>(null);
  const [valuation, setValuation] = useState<CreditValuation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Converter state
  const [convertAmount, setConvertAmount] = useState<number>(creditBalance || 100);
  const [fromType, setFromType] = useState<'credits' | 'inr' | 'usd' | 'bwp'>('credits');
  const [targetCurrency, setTargetCurrency] = useState<string>(preferredCurrency);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const [marketRates, userValuation] = await Promise.all([
        api.getMarketRates(),
        api.getCreditValuation()
      ]);
      setRates(marketRates);
      setValuation(userValuation);
    } catch {
      // Fallback calculation
      const inrRate = 1.50;
      setValuation({
        credits: creditBalance,
        ratePerCreditInr: inrRate,
        ratePerCreditBwp: 0.24,
        ratePerCreditUsd: 0.018,
        ratePerCreditEur: 0.016,
        ratePerCreditGbp: 0.014,
        inrValue: Number((creditBalance * inrRate).toFixed(2)),
        bwpValue: Number((creditBalance * 0.24).toFixed(2)),
        usdValue: Number((creditBalance * 0.018).toFixed(2)),
        eurValue: Number((creditBalance * 0.016).toFixed(2)),
        gbpValue: Number((creditBalance * 0.014).toFixed(2)),
        formattedInr: formatInr(creditBalance * inrRate),
        formattedBwp: formatCurrencyValue(creditBalance * 0.24, 'BWP'),
        formattedUsd: formatCurrencyValue(creditBalance * 0.018, 'USD'),
        formattedEur: formatCurrencyValue(creditBalance * 0.016, 'EUR'),
        formattedGbp: formatCurrencyValue(creditBalance * 0.014, 'GBP'),
        preferredCurrency: 'INR',
        preferredValue: Number((creditBalance * inrRate).toFixed(2)),
        formattedPreferredValue: formatInr(creditBalance * inrRate),
        marketRateTimestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [creditBalance]);

  const calculateConverted = () => {
    const rateInr = rates?.creditBenchmark?.ratePerCreditInr || 1.50;
    if (fromType === 'credits') {
      if (targetCurrency === 'INR') return formatInr(convertAmount * rateInr);
      if (targetCurrency === 'USD') return formatCurrencyValue(convertAmount * 0.018, 'USD');
      if (targetCurrency === 'BWP') return formatCurrencyValue(convertAmount * 0.24, 'BWP');
      return formatCurrencyValue(convertAmount * rateInr, targetCurrency);
    } else if (fromType === 'inr') {
      const credits = convertAmount / rateInr;
      return `${formatCredits(credits)} Credits (CR)`;
    }
    return `${formatCredits(convertAmount * 55.5)} CR`;
  };

  return (
    <div id="currency-valuation-card" className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 p-5 sm:p-6 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 shadow-inner">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Real-Time Credit Valuation & INR Market Rates</h3>
              <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/60 animate-pulse">
                Live Market
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live market value benchmarking across INR, USD, and BWP currency baskets.
            </p>
          </div>
        </div>

        <button
          id="refresh-market-rates-btn"
          type="button"
          disabled={isLoading}
          onClick={fetchRates}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Rates</span>
        </button>
      </div>

      {/* Primary Value Matrix */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* INR Value */}
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Indian Rupee (INR) Value</span>
            <span className="text-base font-black text-emerald-400">₹</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
            {valuation?.formattedInr || `₹${(creditBalance * 1.5).toFixed(2)}`}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/80 font-medium">
            1 CR = ₹{(rates?.creditBenchmark?.ratePerCreditInr || 1.50).toFixed(2)} INR
          </p>
        </div>

        {/* USD Value */}
        <div className="rounded-xl border border-sky-900/60 bg-sky-950/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">USD Equivalent</span>
            <DollarSign className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-sky-300 tracking-tight">
            {valuation?.formattedUsd || `$${(creditBalance * 0.018).toFixed(2)}`}
          </div>
          <p className="mt-1 text-[11px] text-sky-400/80 font-medium">
            1 USD ≈ ₹{(rates?.rates?.USD ? (rates.rates.INR / rates.rates.USD) : 83.5).toFixed(2)} INR
          </p>
        </div>

        {/* BWP Value */}
        <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Botswana Pula (BWP)</span>
            <Globe2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
            {valuation?.formattedBwp || `P${(creditBalance * 0.24).toFixed(2)}`}
          </div>
          <p className="mt-1 text-[11px] text-indigo-400/80 font-medium">
            1 BWP ≈ ₹{(rates?.rates?.BWP ? (rates.rates.INR / rates.rates.BWP) : 6.15).toFixed(2)} INR
          </p>
        </div>
      </div>

      {/* Quick Calculator / Conversion Widget */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Credit & INR Currency Converter
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Convert From</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="any"
                value={convertAmount}
                onChange={(e) => setConvertAmount(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-bold focus:border-cyan-500 focus:outline-none"
              />
              <select
                value={fromType}
                onChange={(e) => setFromType(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="credits">Credits (CR)</option>
                <option value="inr">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Currency</label>
            <select
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 font-semibold focus:border-cyan-500 focus:outline-none"
            >
              <option value="INR">Indian Rupee (INR - ₹)</option>
              <option value="USD">US Dollar (USD - $)</option>
              <option value="BWP">Botswana Pula (BWP - P)</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/90 px-4 py-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Valuation</span>
            <span className="text-sm font-black text-emerald-400 truncate">
              {calculateConverted()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
