/**
 * CurrencyConversionService
 * 
 * Calculates real-time credit value and fiat currency conversions based on
 * current market exchange rates (INR, BWP, USD, EUR, GBP).
 * 
 * Features:
 * - Real-time market exchange rate caching with auto-refresh
 * - Real-time credit value calculation in INR and other currencies
 * - Accurate bidirectional conversion (Credit <-> INR / BWP / USD)
 * - Formatted localized currency representations
 */

export interface MarketRates {
  base: string;
  timestamp: string;
  rates: {
    INR: number;
    USD: number;
    BWP: number;
    EUR: number;
    GBP: number;
    [key: string]: number;
  };
  creditBenchmark: {
    baseCreditUsd: number;
    ratePerCreditInr: number;
    ratePerCreditBwp: number;
    ratePerCreditUsd: number;
    ratePerCreditEur: number;
    ratePerCreditGbp: number;
  };
}

export interface CreditValuation {
  credits: number;
  ratePerCreditInr: number;
  ratePerCreditBwp: number;
  ratePerCreditUsd: number;
  ratePerCreditEur: number;
  ratePerCreditGbp: number;
  inrValue: number;
  bwpValue: number;
  usdValue: number;
  eurValue: number;
  gbpValue: number;
  formattedInr: string;
  formattedBwp: string;
  formattedUsd: string;
  formattedEur: string;
  formattedGbp: string;
  preferredCurrency: string;
  preferredValue: number;
  formattedPreferredValue: string;
  marketRateTimestamp: string;
}

export class CurrencyConversionService {
  // Benchmark value of 1 credit in USD ($0.018 USD ≈ ₹1.50 INR ≈ 0.245 BWP)
  private static BASE_CREDIT_USD = 0.01735; // Calibrated so 1 credit = exactly ₹1.50 INR at ~86.45 USD/INR

  // Standard market rates against USD
  private static exchangeRates = {
    USD: 1.0,
    INR: 86.45,  // 1 USD = ~86.45 INR -> 1 credit = ₹1.50 INR
    BWP: 13.65,  // 1 USD = ~13.65 BWP -> 1 credit = ~0.24 BWP
    EUR: 0.92,   // 1 USD = ~0.92 EUR
    GBP: 0.79    // 1 USD = ~0.79 GBP
  };

  private static lastRateUpdate = new Date().toISOString();
  private static cacheExpiryMs = 15 * 60 * 1000; // 15 minutes cache
  private static isUpdating = false;

  /**
   * Fetches or updates current live market exchange rates.
   * Uses resilient fallback with live API fetch if network is available.
   */
  public static async refreshMarketRates(): Promise<MarketRates> {
    if (this.isUpdating) {
      return this.getMarketRates();
    }

    try {
      this.isUpdating = true;
      // Attempt to fetch fresh rates from a public open endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json() as any;
        if (data && data.rates) {
          if (data.rates.INR) this.exchangeRates.INR = Number(data.rates.INR);
          if (data.rates.BWP) this.exchangeRates.BWP = Number(data.rates.BWP);
          if (data.rates.EUR) this.exchangeRates.EUR = Number(data.rates.EUR);
          if (data.rates.GBP) this.exchangeRates.GBP = Number(data.rates.GBP);
          this.lastRateUpdate = new Date().toISOString();
        }
      }
    } catch {
      // Retain stable benchmark rates on network fallback
    } finally {
      this.isUpdating = false;
    }

    return this.getMarketRates();
  }

  /**
   * Returns current market exchange rates and credit benchmark pricing
   */
  public static getMarketRates(): MarketRates {
    const ratePerCreditUsd = this.BASE_CREDIT_USD;
    const ratePerCreditInr = Number((ratePerCreditUsd * this.exchangeRates.INR).toFixed(4));
    const ratePerCreditBwp = Number((ratePerCreditUsd * this.exchangeRates.BWP).toFixed(4));
    const ratePerCreditEur = Number((ratePerCreditUsd * this.exchangeRates.EUR).toFixed(4));
    const ratePerCreditGbp = Number((ratePerCreditUsd * this.exchangeRates.GBP).toFixed(4));

    return {
      base: 'USD',
      timestamp: this.lastRateUpdate,
      rates: { ...this.exchangeRates },
      creditBenchmark: {
        baseCreditUsd: this.BASE_CREDIT_USD,
        ratePerCreditInr,
        ratePerCreditBwp,
        ratePerCreditUsd,
        ratePerCreditEur,
        ratePerCreditGbp
      }
    };
  }

  /**
   * Calculates comprehensive real-time value for a given amount of credits in INR and other currencies
   */
  public static calculateCreditValue(credits: number, preferredCurrency = 'INR'): CreditValuation {
    const cleanCredits = Math.max(0, Number(credits) || 0);
    const rates = this.getMarketRates().creditBenchmark;

    const inrValue = Number((cleanCredits * rates.ratePerCreditInr).toFixed(2));
    const bwpValue = Number((cleanCredits * rates.ratePerCreditBwp).toFixed(2));
    const usdValue = Number((cleanCredits * rates.ratePerCreditUsd).toFixed(2));
    const eurValue = Number((cleanCredits * rates.ratePerCreditEur).toFixed(2));
    const gbpValue = Number((cleanCredits * rates.ratePerCreditGbp).toFixed(2));

    const pref = (preferredCurrency || 'INR').toUpperCase();
    let preferredValue = inrValue;
    let formattedPreferredValue = this.formatCurrency(inrValue, 'INR');

    if (pref === 'BWP') {
      preferredValue = bwpValue;
      formattedPreferredValue = this.formatCurrency(bwpValue, 'BWP');
    } else if (pref === 'USD') {
      preferredValue = usdValue;
      formattedPreferredValue = this.formatCurrency(usdValue, 'USD');
    } else if (pref === 'EUR') {
      preferredValue = eurValue;
      formattedPreferredValue = this.formatCurrency(eurValue, 'EUR');
    } else if (pref === 'GBP') {
      preferredValue = gbpValue;
      formattedPreferredValue = this.formatCurrency(gbpValue, 'GBP');
    }

    return {
      credits: cleanCredits,
      ratePerCreditInr: rates.ratePerCreditInr,
      ratePerCreditBwp: rates.ratePerCreditBwp,
      ratePerCreditUsd: rates.ratePerCreditUsd,
      ratePerCreditEur: rates.ratePerCreditEur,
      ratePerCreditGbp: rates.ratePerCreditGbp,
      inrValue,
      bwpValue,
      usdValue,
      eurValue,
      gbpValue,
      formattedInr: this.formatCurrency(inrValue, 'INR'),
      formattedBwp: this.formatCurrency(bwpValue, 'BWP'),
      formattedUsd: this.formatCurrency(usdValue, 'USD'),
      formattedEur: this.formatCurrency(eurValue, 'EUR'),
      formattedGbp: this.formatCurrency(gbpValue, 'GBP'),
      preferredCurrency: pref,
      preferredValue,
      formattedPreferredValue,
      marketRateTimestamp: this.lastRateUpdate
    };
  }

  /**
   * Converts credits directly to INR value
   */
  public static convertCreditsToInr(credits: number): number {
    const valuation = this.calculateCreditValue(credits, 'INR');
    return valuation.inrValue;
  }

  /**
   * Converts INR amount to equivalent credits based on real-time rates
   */
  public static convertInrToCredits(inrAmount: number): number {
    const rates = this.getMarketRates().creditBenchmark;
    if (rates.ratePerCreditInr <= 0) return 0;
    const creds = inrAmount / rates.ratePerCreditInr;
    return Number((creds % 1 === 0 ? creds : Number(creds.toFixed(2))));
  }

  /**
   * Converts between any two fiat currencies
   */
  public static convertCurrency(amount: number, from: string, to: string): number {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    if (fromUpper === toUpper) return amount;

    const fromRate = this.exchangeRates[fromUpper as keyof typeof this.exchangeRates] || 1.0;
    const toRate = this.exchangeRates[toUpper as keyof typeof this.exchangeRates] || 1.0;

    // Convert from source to USD then USD to target
    const amountInUsd = amount / fromRate;
    return Number((amountInUsd * toRate).toFixed(2));
  }

  /**
   * Formats a fiat amount according to currency standards without awkward decimal zeroes
   */
  public static formatCurrency(amount: number, currency = 'INR'): string {
    const curr = currency.toUpperCase();
    const isWhole = amount % 1 === 0;

    if (curr === 'INR') {
      const numStr = isWhole
        ? amount.toLocaleString('en-IN')
        : amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      return `₹${numStr}`;
    }
    if (curr === 'BWP') {
      return `P${isWhole ? amount.toLocaleString() : amount.toFixed(2)}`;
    }
    if (curr === 'USD') {
      return `$${isWhole ? amount.toLocaleString() : amount.toFixed(2)}`;
    }
    if (curr === 'EUR') {
      return `€${isWhole ? amount.toLocaleString() : amount.toFixed(2)}`;
    }
    if (curr === 'GBP') {
      return `£${isWhole ? amount.toLocaleString() : amount.toFixed(2)}`;
    }
    return `${isWhole ? amount.toLocaleString() : amount.toFixed(2)} ${curr}`;
  }
}
