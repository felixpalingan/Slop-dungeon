import { describe, it, expect } from 'vitest';
import {
  sanitizePlayerName,
  validateCombatDamage,
  validatePosition,
  validateSlopsAmount
} from '../../src/security.js';

describe('Security & Packet Validation', () => {
  describe('sanitizePlayerName', () => {
    it('strips HTML and script injection tags and clamps length', () => {
      const malicious = '<script>alert("XSS")</script>Gojo';
      expect(sanitizePlayerName(malicious)).toBe('scriptalert(XSS)scri');
      expect(sanitizePlayerName('<img src=x onerror=alert(1)>')).toBe('img src=x onerror=al');
    });

    it('strips dangerous formatting characters (<, >, \', ", &, /, \\, {, }, `)', () => {
      const input = '`Hero{"team":\'A\'}&<admin>\\`';
      expect(sanitizePlayerName(input)).toBe('Heroteam:Aadmin');
    });

    it('clamps length to 20 characters maximum', () => {
      const longName = 'SuperExtremelyLongGamerNameThatExceedsLimits';
      const sanitized = sanitizePlayerName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(20);
      expect(sanitized).toBe('SuperExtremelyLongGa');
    });

    it('falls back to "SlopCrawler" for empty, non-string, or fully stripped names', () => {
      expect(sanitizePlayerName('')).toBe('SlopCrawler');
      expect(sanitizePlayerName(null)).toBe('SlopCrawler');
      expect(sanitizePlayerName(undefined)).toBe('SlopCrawler');
      expect(sanitizePlayerName(12345)).toBe('SlopCrawler');
      expect(sanitizePlayerName('<>""//\\')).toBe('SlopCrawler');
    });
  });

  describe('validateCombatDamage', () => {
    it('accepts valid damage numbers within cap', () => {
      expect(validateCombatDamage(50)).toBe(50);
      expect(validateCombatDamage('120')).toBe(120);
      expect(validateCombatDamage(2500)).toBe(2500);
    });

    it('clamps excessive damage to cap', () => {
      expect(validateCombatDamage(999999, 2500)).toBe(2500);
      expect(validateCombatDamage(5000)).toBe(2500);
    });

    it('rejects zero, negative, NaN, and non-numeric damage', () => {
      expect(validateCombatDamage(0)).toBeNull();
      expect(validateCombatDamage(-100)).toBeNull();
      expect(validateCombatDamage('invalid')).toBeNull();
      expect(validateCombatDamage(NaN)).toBeNull();
      expect(validateCombatDamage(Infinity)).toBeNull();
    });
  });

  describe('validatePosition', () => {
    it('accepts finite coordinate numbers within bounds', () => {
      expect(validatePosition(120.5)).toBe(120.5);
      expect(validatePosition(-450)).toBe(-450);
      expect(validatePosition(0)).toBe(0);
    });

    it('falls back when coordinate is NaN, Infinity, or out of bounds', () => {
      expect(validatePosition(NaN, 10)).toBe(10);
      expect(validatePosition(Infinity, 10)).toBe(10);
      expect(validatePosition('100', 0)).toBe(0);
      expect(validatePosition(999999999, 0)).toBe(0);
    });
  });

  describe('validateSlopsAmount', () => {
    it('accepts valid non-negative slop integers', () => {
      expect(validateSlopsAmount(50)).toBe(50);
      expect(validateSlopsAmount(0)).toBe(0);
      expect(validateSlopsAmount('250')).toBe(250);
    });

    it('caps slop amount to 999,999', () => {
      expect(validateSlopsAmount(10000000)).toBe(999999);
    });

    it('rejects negative or NaN slop values', () => {
      expect(validateSlopsAmount(-50)).toBeNull();
      expect(validateSlopsAmount('slops')).toBeNull();
      expect(validateSlopsAmount(NaN)).toBeNull();
    });
  });
});
