import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/player.js';
import { SET_DEFINITIONS, ITEM_CATALOG, checkSetBonus, getRandomDungeonLoot } from '../../src/items.js';

describe('Phase 3: The Caped Baldy Equipment Set (One Punch Man)', () => {
  let player;

  beforeEach(() => {
    player = new Player(0, 0);
  });

  it('defines the 6-piece Saitama set in SET_DEFINITIONS and ITEM_CATALOG', () => {
    const setDef = SET_DEFINITIONS['saitama'];
    expect(setDef).toBeDefined();
    expect(setDef.name).toBe('The Caped Baldy');
    expect(setDef.title).toBe('One-Punch Hero');
    expect(setDef.anime).toBe('One Punch Man');
    expect(setDef.color).toBe('#facc15');
    expect(setDef.ultimateQ).toBe('serious_punch');
    expect(setDef.ultimateTitle).toBe('SERIOUS PUNCH');
    expect(setDef.requiredItems).toEqual([
      'saitama_bald',
      'saitama_suit',
      'saitama_tights',
      'saitama_boots',
      'saitama_glove',
      'saitama_groceries'
    ]);

    for (const itemId of setDef.requiredItems) {
      const item = ITEM_CATALOG[itemId];
      expect(item).toBeDefined();
      expect(item.id).toBe(itemId);
      expect(item.set).toBe('saitama');
      expect(item.visual).toBe(itemId);
    }
  });

  it('detects complete set bonus when all 6 Saitama items are equipped', () => {
    expect(checkSetBonus(player.equipment)).toBeNull();

    // Equip 5 pieces (incomplete)
    player.equipItem(ITEM_CATALOG['saitama_bald']);
    player.equipItem(ITEM_CATALOG['saitama_suit']);
    player.equipItem(ITEM_CATALOG['saitama_tights']);
    player.equipItem(ITEM_CATALOG['saitama_boots']);
    player.equipItem(ITEM_CATALOG['saitama_glove']);
    expect(checkSetBonus(player.equipment)).toBeNull();

    // Equip 6th piece (complete)
    player.equipItem(ITEM_CATALOG['saitama_groceries']);
    const setBonus = checkSetBonus(player.equipment);
    expect(setBonus).not.toBeNull();
    expect(setBonus.setKey).toBe('saitama');
    expect(setBonus.name).toBe('The Caped Baldy');
    expect(setBonus.ultimateQ).toBe('serious_punch');
    expect(setBonus.ultimateTitle).toBe('SERIOUS PUNCH');
  });

  it('correctly recalculates player stats when equipped with Saitama gear', () => {
    player.equipItem(ITEM_CATALOG['saitama_bald']); // hp: +45
    player.equipItem(ITEM_CATALOG['saitama_suit']); // hp: +70, armor: +22
    player.equipItem(ITEM_CATALOG['saitama_tights']); // hp: +30, speed: +30, rollCostReduction: 15
    player.equipItem(ITEM_CATALOG['saitama_boots']); // speed: +35
    player.equipItem(ITEM_CATALOG['saitama_groceries']); // armor: +16

    // Base: hp 100, baseSpeed 260, rollCost 35
    expect(player.maxHp).toBe(100 + 45 + 70 + 30); // 245
    expect(player.baseSpeed).toBe(260 + 30 + 35); // 325
    expect(player.armor).toBe(22 + 16); // 38
    expect(player.rollCost).toBe(20); // 35 - 15 = 20
  });

  it('grants knockback immunity when Hero’s Polished Scalp (saitama_bald) is equipped', () => {
    // Without helmet: takes knockback
    player.takeDamage(10, Math.PI, 300);
    expect(player.knockbackVx).toBeCloseTo(-300, 0);

    // Reset knockback
    player.knockbackVx = 0;
    player.knockbackVy = 0;

    // Equip polished scalp
    player.equipItem(ITEM_CATALOG['saitama_bald']);
    expect(player.equipment.helmet.knockbackImmunity).toBe(true);

    // Hit with massive knockback: should be completely ignored
    player.takeDamage(20, Math.PI, 600);
    expect(player.knockbackVx).toBe(0);
    expect(player.knockbackVy).toBe(0);

    player.applyKnockback(500, -500);
    expect(player.knockbackVx).toBe(0);
    expect(player.knockbackVy).toBe(0);
  });

  it('generates guaranteed OPM loot via getRandomDungeonLoot for theme opm', () => {
    for (let i = 0; i < 15; i++) {
      const loot = getRandomDungeonLoot('opm', { guaranteeTheme: true });
      expect(loot).toBeDefined();
      expect(loot.set).toBe('saitama');
      expect([
        'saitama_bald',
        'saitama_suit',
        'saitama_tights',
        'saitama_boots',
        'saitama_glove',
        'saitama_groceries'
      ]).toContain(loot.id);
    }
  });
});
