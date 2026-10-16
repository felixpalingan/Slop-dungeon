/**
 * Security & Network Packet Validation Helper Functions
 * Provides input sanitization, DOM XSS prevention, and anti-cheat bounds checking.
 */

/**
 * Sanitizes player names by stripping script tags, quotes, brackets, and clamping length.
 * @param {any} raw
 * @returns {string}
 */
export function sanitizePlayerName(raw) {
  if (!raw || typeof raw !== 'string') return 'SlopCrawler';
  return raw
    .replace(/[<>'"&/\\{}`]/g, '')
    .trim()
    .slice(0, 20) || 'SlopCrawler';
}

/**
 * Validates incoming combat damage packets to prevent client damage manipulation.
 * @param {any} rawDamage
 * @param {number} [maxCap=2500]
 * @returns {number|null} Validated damage integer or null if invalid
 */
export function validateCombatDamage(rawDamage, maxCap = 2500) {
  const num = Number(rawDamage);
  if (isNaN(num) || num <= 0 || !isFinite(num)) {
    return null;
  }
  return Math.min(maxCap, Math.round(num));
}

/**
 * Validates coordinate positions sent over network.
 * @param {any} val
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function validatePosition(val, fallback = 0) {
  if (typeof val === 'number' && !isNaN(val) && isFinite(val) && Math.abs(val) < 100000) {
    return val;
  }
  return fallback;
}

/**
 * Validates shared party currency amounts.
 * @param {any} amount
 * @param {number} [maxCap=999999]
 * @returns {number|null}
 */
export function validateSlopsAmount(amount, maxCap = 999999) {
  const num = Number(amount);
  if (isNaN(num) || num < 0 || !isFinite(num)) {
    return null;
  }
  return Math.min(maxCap, Math.floor(num));
}
