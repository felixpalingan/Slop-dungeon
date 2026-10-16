/**
 * Seeded Pseudo-Random Number Generator (PRNG) for Slop Dungeon
 * Uses 32-bit FNV-1a / Murmur-inspired string seed hashing combined with Mulberry32.
 * Guarantees 100% deterministic, reproducible outputs across Node.js and browser environments.
 */

export function hashStringSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class RandomProvider {
  /**
   * @param {string|number} [seed] - String or numeric seed. Defaults to deterministic default if omitted.
   */
  constructor(seed) {
    this.reseed(seed);
  }

  reseed(seed) {
    if (seed === undefined || seed === null) {
      this.seed = 'slop-default';
      this.state = hashStringSeed(this.seed);
    } else if (typeof seed === 'string') {
      this.seed = seed;
      this.state = hashStringSeed(seed);
    } else {
      this.seed = seed;
      this.state = (seed >>> 0) || 1;
    }
    // Warm up state to disperse initial entropy
    for (let i = 0; i < 4; i++) {
      this._next32();
    }
  }

  _next32() {
    let z = (this.state += 0x6D2B79F5) >>> 0;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return (z ^ (z >>> 14)) >>> 0;
  }

  /**
   * Returns a float in [0, 1) identical to Math.random()
   * @returns {number}
   */
  random() {
    return this._next32() / 4294967296;
  }

  /**
   * Returns float in [min, max)
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  range(min, max) {
    return min + this.random() * (max - min);
  }

  /**
   * Returns integer in [min, max] inclusive
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  intRange(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(this.random() * (high - low + 1)) + low;
  }

  /**
   * Pick random element from array
   * @template T
   * @param {T[]} array
   * @returns {T|null}
   */
  choice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(this.random() * array.length)];
  }

  /**
   * Deterministic Fisher-Yates shuffle
   * @template T
   * @param {T[]} array
   * @param {boolean} [inPlace=false]
   * @returns {T[]}
   */
  shuffle(array, inPlace = false) {
    const arr = inPlace ? array : [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Create a new branched child RandomProvider
   * @param {string} [subSeed='']
   * @returns {RandomProvider}
   */
  fork(subSeed = '') {
    const nextSeedVal = `${this.seed}::${subSeed}::${this._next32()}`;
    return new RandomProvider(nextSeedVal);
  }
}

export const defaultRng = new RandomProvider('slop-global-seed');
