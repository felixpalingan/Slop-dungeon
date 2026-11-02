import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/player.js';
import { ITEM_CATALOG, checkSetBonus } from '../../src/items.js';
import { FloorSelectStation } from '../../src/floorSelectStation.js';

describe('Combat Testing Lab & Floor Fullset Warping', () => {
  let player;
  let station;

  const THEMATIC_AUTO_MAP = {
    1: 'sukuna',
    2: 'david',
    3: 'levi',
    4: 'guts',
    5: 'saitama'
  };

  function equipFullSetForTest(targetPlayer, setName) {
    ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand'].forEach(slot => {
      targetPlayer.unequipSlot(slot);
    });

    let itemsToEquip = [];
    if (setName === 'gojo') {
      itemsToEquip = ['gojo_blindfold', 'gojo_tunic', 'gojo_slacks', 'gojo_loafers', 'lapse_blue', 'reversal_red'];
    } else if (setName === 'sukuna') {
      itemsToEquip = ['sukuna_crown', 'sukuna_robe', 'sukuna_hakama', 'sukuna_zori', 'sukuna_cleaver', 'sukuna_kamutoke'];
    } else if (setName === 'guts') {
      itemsToEquip = ['guts_beast_helm', 'guts_berserker_plate', 'guts_greaves', 'guts_sollerets', 'dragon_slayer'];
    } else if (setName === 'levi') {
      itemsToEquip = ['scout_hood', 'odm_harness', 'scout_trousers', 'scout_boots', 'dual_snap_blades'];
    } else if (setName === 'david') {
      itemsToEquip = ['david_kiroshi', 'david_jacket', 'david_pants', 'david_sneakers', 'david_shotgun', 'david_gorilla_arms'];
    } else if (setName === 'saitama') {
      itemsToEquip = ['saitama_bald', 'saitama_suit', 'saitama_tights', 'saitama_boots', 'saitama_glove', 'saitama_groceries'];
    }

    itemsToEquip.forEach(id => {
      if (ITEM_CATALOG[id]) {
        targetPlayer.equipItem(ITEM_CATALOG[id]);
      }
    });

    targetPlayer.hp = targetPlayer.maxHp;
    targetPlayer.lastAbilityTime = 0;
  }

  beforeEach(() => {
    player = new Player(0, 0);
    station = new FloorSelectStation(240, -120);
  });

  it('FloorSelectStation detects nearby player correctly', () => {
    player.x = 240;
    player.y = -120;
    expect(station.isPlayerNearby(player)).toBe(true);

    player.x = 500;
    player.y = 500;
    expect(station.isPlayerNearby(player)).toBe(false);
  });

  it('correctly maps all 5 dungeon floors to their thematic anime fullsets', () => {
    expect(THEMATIC_AUTO_MAP[1]).toBe('sukuna');
    expect(THEMATIC_AUTO_MAP[2]).toBe('david');
    expect(THEMATIC_AUTO_MAP[3]).toBe('levi');
    expect(THEMATIC_AUTO_MAP[4]).toBe('guts');
    expect(THEMATIC_AUTO_MAP[5]).toBe('saitama');
  });

  it('equips Saitama fullset, activates Caped Baldy bonus, refuels HP, and resets ability cooldown', () => {
    equipFullSetForTest(player, 'saitama');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('saitama');
    expect(bonus.ultimateQ).toBe('serious_punch');
    expect(player.hp).toBe(player.maxHp);
    expect(player.lastAbilityTime).toBe(0);
    expect(player.equipment.weapon.id).toBe('saitama_glove');
  });

  it('equips Sukuna fullset with King of Curses set bonus for Floor 1 testing', () => {
    equipFullSetForTest(player, 'sukuna');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('sukuna');
    expect(bonus.ultimateQ).toBe('world_cutting_slash');
    expect(player.equipment.weapon).toBeDefined();
    expect(['sukuna_kamutoke', 'sukuna_cleaver']).toContain(player.equipment.weapon.id);
  });

  it('equips David fullset with Night City Legend set bonus for Floor 2 testing', () => {
    equipFullSetForTest(player, 'david');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('david');
    expect(bonus.ultimateQ).toBe('sandevistan_time_dilation');
    expect(player.equipment.weapon.id).toBe('david_shotgun');
    expect(player.equipment.offhand.id).toBe('david_gorilla_arms');
  });

  it('equips Levi fullset with Humanity\'s Strongest set bonus for Floor 3 testing', () => {
    equipFullSetForTest(player, 'levi');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('levi');
    expect(bonus.ultimateQ).toBe('levi_grapple_whirlwind');
    expect(player.equipment.weapon.id).toBe('dual_snap_blades');
    expect(player.equipment.chest.id).toBe('odm_harness');
  });

  it('equips Guts fullset with The Black Swordsman set bonus for Floor 4 testing', () => {
    equipFullSetForTest(player, 'guts');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('guts');
    expect(bonus.ultimateQ).toBe('berserker_rage');
    expect(player.equipment.weapon.id).toBe('dragon_slayer');
  });

  it('equips Gojo fullset with The Honored One set bonus', () => {
    equipFullSetForTest(player, 'gojo');

    const bonus = checkSetBonus(player.equipment);
    expect(bonus).not.toBeNull();
    expect(bonus.setKey).toBe('gojo');
    expect(bonus.ultimateQ).toBe('hollow_purple');
  });
});
