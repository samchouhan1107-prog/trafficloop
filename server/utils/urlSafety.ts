import { URL } from 'node:url';

const LOCALHOST_PATTERNS: RegExp[] = [
  /^127\./,
  /^localhost$/i,
  /^localhost:/,
  /^\[::1\]/,
  /^0\.0\.0\.0/,
  /^0\./,
];

export function isUrlSafe(targetUrl: string): { safe: boolean; reason?: string } {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { safe: false, reason: 'URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { safe: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Protocol "${parsed.protocol}" is not allowed.` };
  }

  const hostname = parsed.hostname;

  for (const pattern of LOCALHOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, reason: 'Requests to localhost or private addresses are not allowed.' };
    }
  }

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { safe: false, reason: 'Direct IP address requests are not allowed.' };
  }

  return { safe: true };
}

export function assertUrlSafe(targetUrl: string): void {
  const { safe, reason } = isUrlSafe(targetUrl);
  if (!safe) {
    throw new Error(reason || 'URL is not safe.');
  }
}
