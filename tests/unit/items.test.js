import { describe, it, expect } from 'vitest';
import {
  ITEM_CATALOG,
  SET_DEFINITIONS,
  ItemRarity,
  NEXT_RARITY_TIER,
  executeTradeUp,
  executeGachaSpin
} from '../../src/items.js';

describe('Item Catalog & Economy Logic', () => {
  it('contains valid definitions for all items', () => {
    const validSlots = ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand', 'consumable'];
    const validRarities = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

    for (const [id, item] of Object.entries(ITEM_CATALOG)) {
      expect(item.name, `Item ${id} must have a name`).toBeDefined();
      expect(typeof item.name).toBe('string');
      expect(validSlots).toContain(item.slot);

      const rarityKey = (typeof item.rarity === 'string' ? item.rarity : item.rarity?.name).toUpperCase();
      expect(validRarities).toContain(rarityKey);
    }
  });

  it('contains valid set bonuses where all required items exist in catalog', () => {
    for (const [setId, setDef] of Object.entries(SET_DEFINITIONS)) {
      expect(setDef.name).toBeDefined();
      expect(setDef.ultimateQ).toBeDefined();

      if (setDef.requiredItems) {
        for (const itemId of setDef.requiredItems) {
          expect(ITEM_CATALOG[itemId], `Set ${setId} requires ${itemId} which must exist in ITEM_CATALOG`).toBeDefined();
        }
      }

      if (setDef.requiredWeaponOneOf) {
        for (const weaponId of setDef.requiredWeaponOneOf) {
          expect(ITEM_CATALOG[weaponId], `Set ${setId} alternative weapon ${weaponId} must exist`).toBeDefined();
        }
      }
    }
  });

  describe('executeTradeUp', () => {
    it('rejects arrays with length !== 3', () => {
      const res = executeTradeUp([ITEM_CATALOG['starter_sword']]);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/exactly 3 items/i);
    });

    it('rejects items with mismatched rarities', () => {
      const res = executeTradeUp([
        ITEM_CATALOG['rusty_sword'], // COMMON
        ITEM_CATALOG['rusty_sword'], // COMMON
        ITEM_CATALOG['crystal_blade'] // RARE
      ]);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/exact same rarity/i);
    });

    it('successfully consumes 3 Common items and yields a Rare item', () => {
      const commonA = ITEM_CATALOG['rusty_sword'];
      const commonB = ITEM_CATALOG['leather_tunic'];
      const commonC = ITEM_CATALOG['travel_boots'];

      const res = executeTradeUp([commonA, commonB, commonC]);
      expect(res.success).toBe(true);
      expect(res.targetRarity).toBe('RARE');
      expect(res.resultItem).toBeDefined();

      const resRarity = (typeof res.resultItem.rarity === 'string'
        ? res.resultItem.rarity
        : res.resultItem.rarity.name).toUpperCase();
      expect(resRarity).toBe('RARE');
    });
  });

  describe('executeGachaSpin (Deterministic via RNG)', () => {
    it('returns ancur (shattered) when roll < 50', () => {
      // Mock RNG that returns 0.25 (roll = 25)
      const mockRng = { random: () => 0.25 };
      const wager = ITEM_CATALOG['rusty_sword'];

      const res = executeGachaSpin(wager, mockRng);
      expect(res.success).toBe(true);
      expect(res.outcome).toBe('ancur');
      expect(res.resultItem).toBeNull();
    });

    it('returns upgrade when 50 <= roll < 95', () => {
      // Mock RNG that returns 0.60 (roll = 60)
      const mockRng = { random: () => 0.60 };
      const wager = ITEM_CATALOG['rusty_sword']; // COMMON

      const res = executeGachaSpin(wager, mockRng);
      expect(res.success).toBe(true);
      expect(res.outcome).toBe('upgrade');
      expect(res.resultItem).toBeDefined();

      const resRarity = (typeof res.resultItem.rarity === 'string'
        ? res.resultItem.rarity
        : res.resultItem.rarity.name).toUpperCase();
      expect(resRarity).toBe('RARE');
    });

    it('returns mythic jackpot when roll >= 95', () => {
      // Mock RNG that returns 0.98 (roll = 98)
      const mockRng = { random: () => 0.98 };
      const wager = ITEM_CATALOG['rusty_sword'];

      const res = executeGachaSpin(wager, mockRng);
      expect(res.success).toBe(true);
      expect(res.outcome).toBe('jackpot');
      expect(res.resultItem).toBeDefined();

      const resRarity = (typeof res.resultItem.rarity === 'string'
        ? res.resultItem.rarity
        : res.resultItem.rarity.name).toUpperCase();
      expect(resRarity).toBe('MYTHIC');
    });
  });
});
