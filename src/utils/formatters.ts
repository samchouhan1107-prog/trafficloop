/**
 * Shared number and currency formatting utilities
 * Ensures whole integers are displayed cleanly without awkward trailing decimal zeros (e.g., 15 CR, ₹500)
 */

export function formatCredits(credits: number | string | undefined | null): string {
  const num = Number(credits) || 0;
  if (num % 1 === 0) {
    return num.toLocaleString();
  }
  // Trim unnecessary trailing zeros if decimal is present
  return parseFloat(num.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatInr(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  if (num % 1 === 0) {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyValue(amount: number | string | undefined | null, currency = 'INR'): string {
  const num = Number(amount) || 0;
  const curr = (currency || 'INR').toUpperCase();
  const isWhole = num % 1 === 0;
  const numStr = isWhole
    ? num.toLocaleString(curr === 'INR' ? 'en-IN' : undefined)
    : num.toLocaleString(curr === 'INR' ? 'en-IN' : undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  switch (curr) {
    case 'INR':
      return `₹${numStr}`;
    case 'BWP':
      return `P${numStr}`;
    case 'USD':
      return `$${numStr}`;
    case 'EUR':
      return `€${numStr}`;
    case 'GBP':
      return `£${numStr}`;
    default:
      return `${numStr} ${curr}`;
  }
}

export function formatNumber(value: number | string | undefined | null): string {
  const num = Number(value) || 0;
  if (num % 1 === 0) {
    return num.toLocaleString();
  }
  return parseFloat(num.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
