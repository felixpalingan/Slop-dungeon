import { describe, it, expect } from 'vitest';
import { RandomProvider, hashStringSeed } from '../../src/prng.js';

describe('Seeded RandomProvider (Mulberry32 PRNG)', () => {
  it('hashes string seeds consistently', () => {
    const h1 = hashStringSeed('slop-dungeon-seed-42');
    const h2 = hashStringSeed('slop-dungeon-seed-42');
    const h3 = hashStringSeed('different-seed');

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(typeof h1).toBe('number');
  });

  it('produces 100% identical sequence for identical seeds', () => {
    const rngA = new RandomProvider('reproducible-run-seed');
    const rngB = new RandomProvider('reproducible-run-seed');

    const seqA = Array.from({ length: 25 }, () => rngA.random());
    const seqB = Array.from({ length: 25 }, () => rngB.random());

    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const rngA = new RandomProvider('seed-alpha');
    const rngB = new RandomProvider('seed-beta');

    const seqA = Array.from({ length: 10 }, () => rngA.random());
    const seqB = Array.from({ length: 10 }, () => rngB.random());

    expect(seqA).not.toEqual(seqB);
  });

  it('keeps intRange within [min, max] inclusive bounds', () => {
    const rng = new RandomProvider('bounds-test-seed');
    for (let i = 0; i < 200; i++) {
      const val = rng.intRange(3, 7);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('picks valid choices from array', () => {
    const rng = new RandomProvider('choice-test');
    const options = ['apple', 'banana', 'cherry', 'durian'];

    for (let i = 0; i < 50; i++) {
      const picked = rng.choice(options);
      expect(options).toContain(picked);
    }
  });

  it('shuffles arrays deterministically without losing elements', () => {
    const rngA = new RandomProvider('shuffle-seed');
    const rngB = new RandomProvider('shuffle-seed');
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const shuffledA = rngA.shuffle(source);
    const shuffledB = rngB.shuffle(source);

    expect(shuffledA).toEqual(shuffledB);
    expect([...shuffledA].sort((a, b) => a - b)).toEqual(source);
  });
});
