import crypto from 'node:crypto';

// Comprehensive list of known temporary/disposable and burner email domains
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'tempmail.com',
  'temp-mail.org',
  'tempmail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'grr.la',
  'sharklasers.com',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trashmail.io',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'crazymailing.com',
  'mytemp.email',
  'tempinbox.com',
  'generator.email',
  'maildrop.cc',
  'mohmal.com',
  'emailondeck.com',
  'inboxbear.com',
  'burnerdirect.com',
  'nada.ltd',
  'getnada.com',
  'tempail.com',
  'minuteinbox.com',
  'tmpmail.net',
  'tmpmail.org',
  'burnermail.io',
  'fakemailgenerator.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
  'binkmail.com',
  'safetymail.info',
  'mailcatch.com',
  'dropmail.me',
  'emailfake.com',
  'fakeemail.net',
  'fakemail.net',
  'temporarymail.com',
  'throwawayemailaddress.com',
  'inboxkitten.com',
  'trashmail.org',
  'trashymail.com',
  'burner.email',
  'guerrillamail.info'
]);

const PIN_SECRET = process.env.SESSION_SECRET || 'webzonebw_signup_antispam_pin_secret_key_2026';

/**
 * Validates whether an email domain is real/legitimate and not a disposable spam domain.
 */
export function validateRealEmailDomain(email: string): { isValid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Please enter a valid email address.' };
  }

  const clean = email.trim().toLowerCase();
  const atIndex = clean.lastIndexOf('@');

  if (atIndex <= 0 || atIndex === clean.length - 1) {
    return { isValid: false, reason: 'Invalid email format.' };
  }

  const domain = clean.substring(atIndex + 1);

  // Check disposable domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason: `Temporary/disposable email domains (${domain}) are blocked to protect reward credit distribution. Please use a permanent email address (e.g. Gmail, Outlook, Yahoo, or your company domain).`
    };
  }

  // Check for invalid domain structure
  if (!domain.includes('.')) {
    return { isValid: false, reason: 'Email domain must contain a valid top-level domain extension (e.g. .com, .org, .co.bw).' };
  }

  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return { isValid: false, reason: 'Invalid top-level domain (TLD) extension.' };
  }

  // Check for random gibberish or spam patterns (e.g. no vowels in long domain labels or pure digit domains)
  const sld = parts[0];
  if (sld.length >= 8 && !/[aeiouy0-9]/i.test(sld)) {
    return { isValid: false, reason: 'Suspicious random domain name detected. Please use a verified email address.' };
  }

  return { isValid: true };
}

/**
 * Generates a signed anti-bot Security PIN for the signup flow.
 */
export function generateSignupSecurityPin(): { pin: string; pinToken: string; expiresAt: number } {
  // Generate random 6-digit human verification PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload = `${pin}:${expiresAt}:${nonce}`;
  const hmac = crypto.createHmac('sha256', PIN_SECRET).update(payload).digest('hex');
  const pinToken = Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');

  return { pin, pinToken, expiresAt };
}

/**
 * Validates that the submitted PIN matches the HMAC signed token and has not expired.
 */
export function verifySignupSecurityPin(userPin: string, pinToken: string): { isValid: boolean; error?: string } {
  if (!userPin || !pinToken) {
    return { isValid: false, error: 'Anti-spam Security Verification PIN is required.' };
  }

  try {
    const raw = Buffer.from(pinToken, 'base64').toString('utf-8');
    const { payload, hmac } = JSON.parse(raw);

    const expectedHmac = crypto.createHmac('sha256', PIN_SECRET).update(payload).digest('hex');
    if (expectedHmac !== hmac) {
      return { isValid: false, error: 'Invalid Security PIN token. Please refresh the PIN and try again.' };
    }

    const [realPin, expiresAtStr] = payload.split(':');
    const expiresAt = Number(expiresAtStr);

    if (Date.now() > expiresAt) {
      return { isValid: false, error: 'Security PIN has expired. Please refresh the PIN to continue.' };
    }

    if (String(userPin).trim() !== String(realPin).trim()) {
      return { isValid: false, error: 'Incorrect Security PIN entered. Please type the 6-digit verification PIN displayed.' };
    }

    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: 'Malformed Security PIN signature. Please refresh the code.' };
  }
}
