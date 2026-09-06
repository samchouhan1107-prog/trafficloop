import { CreditValuation, MarketRates } from '../types.js';
import { api } from './api.js';

/**
 * Client-Side CurrencyConversionService
 * 
 * Provides real-time currency conversion calculations, INR display formatting,
 * and credit valuation helpers for React components.
 */
export class ClientCurrencyService {
  // Baseline rates calibrated to real-time market benchmark
  private static rates: MarketRates = {
    base: 'USD',
    timestamp: new Date().toISOString(),
    rates: {
      USD: 1.0,
      INR: 86.45,
      BWP: 13.65,
      EUR: 0.92,
      GBP: 0.79
    },
    creditBenchmark: {
      baseCreditUsd: 0.01735,
      ratePerCreditInr: 1.50,
      ratePerCreditBwp: 0.24,
      ratePerCreditUsd: 0.01735,
      ratePerCreditEur: 0.016,
      ratePerCreditGbp: 0.0137
    }
  };

  private static isInitialized = false;

  /**
   * Initializes and syncs real-time market rates from backend API
   */
  public static async syncRates(): Promise<MarketRates> {
    try {
      const data = await api.getMarketRates();
      if (data && data.rates) {
        this.rates = data;
        this.isInitialized = true;
      }
    } catch {
      // Fallback to baseline rates
    }
    return this.rates;
  }

  public static getRates(): MarketRates {
    return this.rates;
  }

  /**
   * Calculates real-time valuation for an amount of credits in INR, BWP, and USD
   */
  public static calculateCreditValuation(credits: number, preferredCurrency = 'INR'): CreditValuation {
    const cleanCredits = Math.max(0, Number(credits) || 0);
    const benchmark = this.rates.creditBenchmark;

    const inrValue = Number((cleanCredits * benchmark.ratePerCreditInr).toFixed(2));
    const bwpValue = Number((cleanCredits * benchmark.ratePerCreditBwp).toFixed(2));
    const usdValue = Number((cleanCredits * benchmark.ratePerCreditUsd).toFixed(2));
    const eurValue = Number((cleanCredits * benchmark.ratePerCreditEur).toFixed(2));
    const gbpValue = Number((cleanCredits * benchmark.ratePerCreditGbp).toFixed(2));

    const pref = (preferredCurrency || 'INR').toUpperCase();
    let preferredValue = inrValue;
    let formattedPreferredValue = `₹${inrValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (pref === 'BWP') {
      preferredValue = bwpValue;
      formattedPreferredValue = `P${bwpValue.toFixed(2)}`;
    } else if (pref === 'USD') {
      preferredValue = usdValue;
      formattedPreferredValue = `$${usdValue.toFixed(2)}`;
    } else if (pref === 'EUR') {
      preferredValue = eurValue;
      formattedPreferredValue = `€${eurValue.toFixed(2)}`;
    } else if (pref === 'GBP') {
      preferredValue = gbpValue;
      formattedPreferredValue = `£${gbpValue.toFixed(2)}`;
    }

    return {
      credits: cleanCredits,
      ratePerCreditInr: benchmark.ratePerCreditInr,
      ratePerCreditBwp: benchmark.ratePerCreditBwp,
      ratePerCreditUsd: benchmark.ratePerCreditUsd,
      ratePerCreditEur: benchmark.ratePerCreditEur,
      ratePerCreditGbp: benchmark.ratePerCreditGbp,
      inrValue,
      bwpValue,
      usdValue,
      eurValue,
      gbpValue,
      formattedInr: `₹${inrValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedBwp: `P${bwpValue.toFixed(2)}`,
      formattedUsd: `$${usdValue.toFixed(2)}`,
      formattedEur: `€${eurValue.toFixed(2)}`,
      formattedGbp: `£${gbpValue.toFixed(2)}`,
      preferredCurrency: pref,
      preferredValue,
      formattedPreferredValue,
      marketRateTimestamp: this.rates.timestamp
    };
  }

  /**
   * Formats INR currency string
   */
  public static formatInr(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats any currency
   */
  public static formatCurrency(amount: number, currency = 'INR'): string {
    const curr = currency.toUpperCase();
    if (curr === 'INR') {
      return this.formatInr(amount);
    }
    if (curr === 'BWP') {
      return `P${amount.toFixed(2)}`;
    }
    if (curr === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    if (curr === 'EUR') {
      return `€${amount.toFixed(2)}`;
    }
    if (curr === 'GBP') {
      return `£${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)} ${curr}`;
  }

  /**
   * Converts INR amount to credits
   */
  public static convertInrToCredits(inrAmount: number): number {
    const rate = this.rates.creditBenchmark.ratePerCreditInr;
    if (rate <= 0) return 0;
    return Number((inrAmount / rate).toFixed(2));
  }
}
