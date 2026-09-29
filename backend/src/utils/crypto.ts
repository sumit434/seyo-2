import crypto from 'crypto';

/**
 * Generate a cryptographically secure hex token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Compute SHA-256 hash of a string (e.g. for magic tokens)
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Hash a password with salt using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a salt:hash string
 */
export function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, originalHash] = combined.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Hash a 4-digit staff PIN
 */
export function hashPin(pin: string): string {
  return hashPassword(pin);
}

/**
 * Verify a 4-digit staff PIN
 */
export function verifyPin(pin: string, combined: string): boolean {
  return verifyPassword(pin, combined);
}

/**
 * Cryptographically secure random integer in range [min, max)
 */
export function secureRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max);
}

/**
 * Cryptographically secure weighted selection for Spin Wheel
 * Total weights must sum to 100
 */
export function selectWeightedReward<T extends { weight: number }>(items: T[]): T {
  if (!items || items.length === 0) {
    throw new Error('Cannot select from empty item list');
  }

  const roll = crypto.randomInt(0, 100); // 0 to 99
  let accumulated = 0;

  for (const item of items) {
    accumulated += item.weight;
    if (roll < accumulated) {
      return item;
    }
  }

  // Fallback to last item in rare floating point rounding edge
  return items[items.length - 1];
}

/**
 * Generate a 6-character alphanumeric voucher code (e.g. 'SY-7X9K')
 */
export function generateVoucherCode(prefix: string = 'SY'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0,1,I,O
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return `${prefix}-${code}`;
}

/**
 * Mask mobile number: e.g. "+1 (555) 123-4567" -> "******4567"
 */
export function maskMobile(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length <= 4) return '****' + cleaned;
  const last4 = cleaned.slice(-4);
  return '******' + last4;
}
