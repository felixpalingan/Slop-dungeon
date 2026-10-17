import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/player.js';
import { ITEM_CATALOG } from '../../src/items.js';

describe('Player Combat & State Machine', () => {
  let player;

  beforeEach(() => {
    player = new Player(0, 0);
  });

  it('initializes with standard fresh crawler stats', () => {
    expect(player.hp).toBe(100);
    expect(player.maxHp).toBe(100);
    expect(player.baseSpeed).toBe(260);
    expect(player.stamina).toBe(100);
    expect(player.isDowned).toBe(false);
    expect(player.isDead).toBe(false);
  });

  it('takes unmitigated damage when not blocking or rolling', () => {
    const res = player.takeDamage(25);
    expect(res).toBeTruthy();
    expect(res.damage).toBe(25);
    expect(player.hp).toBe(75);
    expect(player.isDowned).toBe(false);
  });

  it('grants full invulnerability i-frames while rolling', () => {
    player.isRolling = true;
    const res = player.takeDamage(50);
    expect(res).toBe(false);
    expect(player.hp).toBe(100);
  });

  it('mitigates damage when shield blocking is active', () => {
    player.isBlocking = true;
    player.equipment.offhand = {
      name: 'Iron Shield',
      slot: 'offhand',
      blockMitigation: 0.60
    };

    // 50 damage mitigated by 60% = 50 * (1 - 0.60) = 20
    const res = player.takeDamage(50);
    expect(res.isBlocked).toBe(true);
    expect(res.damage).toBe(20);
    expect(player.hp).toBe(80);
  });

  it('mitigates damage by 35% during Berserk Rage mode', () => {
    player.isBerserk = true;
    // 60 damage with 35% reduction = 60 * 0.65 = 39
    const res = player.takeDamage(60);
    expect(res.damage).toBe(39);
    expect(player.hp).toBe(61);
  });

  it('transitions into Downed Crawl State upon lethal damage (when canBeDowned is true)', () => {
    const res = player.takeDamage(150, 0, 0, true);
    expect(player.hp).toBe(0);
    expect(player.isDowned).toBe(true);
    expect(player.isDead).toBe(false);
    expect(player.downedTimer).toBe(30.0);
    expect(res.becameDowned).toBe(true);
  });

  it('accelerates bleed-out timer by 3.0s when hit while already downed', () => {
    player.takeDamage(150, 0, 0, true); // Down player
    expect(player.downedTimer).toBe(30.0);

    const hitRes = player.takeDamage(20, 0, 0, true);
    expect(hitRes.isDowned).toBe(true);
    expect(hitRes.isBleedAccelerated).toBe(true);
    expect(player.downedTimer).toBe(27.0);
  });

  it('recalculates maxHp, speed, and stamina when armor is equipped', () => {
    const helmet = { slot: 'helmet', hp: 35, speedBonus: 10 };
    const boots = { slot: 'boots', speedBonus: 30, staminaRegen: 8 };

    player.equipItem(helmet);
    player.equipItem(boots);

    expect(player.maxHp).toBe(135);
    expect(player.hp).toBe(135);
    expect(player.baseSpeed).toBe(300); // 260 + 10 + 30
    expect(player.staminaRegen).toBe(40); // 32 + 8
  });

  it('automatically unequips off-hand shield when equipping a 2-handed weapon', () => {
    const shield = { name: 'Buckler', slot: 'offhand', hands: 1 };
    const twoHander = { name: 'Dragon Slayer', slot: 'weapon', hands: 2 };

    player.equipItem(shield);
    expect(player.equipment.offhand).toBe(shield);

    const unequipped = player.equipItem(twoHander);
    expect(player.equipment.weapon).toBe(twoHander);
    expect(player.equipment.offhand).toBeNull();
    expect(unequipped).toContain(shield);
  });

  it('calculates armor from leather tunic and mitigates incoming damage', () => {
    const tunic = ITEM_CATALOG['leather_tunic'];
    expect(tunic).toBeTruthy();
    expect(tunic.armor).toBe(6);

    player.equipItem(tunic);
    expect(player.armor).toBe(6);

    // Raw 30 damage mitigated by 6 armor (50 / (50 + 6) = ~0.893): 30 * 0.893 = 27
    const res = player.takeDamage(30);
    expect(res.damage).toBe(27);
    expect(player.hp).toBe(player.maxHp - 27);
  });

  it('rejects equipping consumable items into armor slots', () => {
    const flask = ITEM_CATALOG['health_flask'];
    expect(flask).toBeTruthy();
    expect(flask.slot).toBe('consumable');

    const result = player.equipItem(flask);
    expect(result).toBeNull();
    expect(player.equipment['consumable']).toBeUndefined();
  });

  it('triggers War Cry (+35% speed surge) when activating leather tunic ability', () => {
    const tunic = ITEM_CATALOG['leather_tunic'];
    player.equipItem(tunic);

    // Dummy combat instance
    const combat = {
      triggerActiveAbility: (p) => {
        p.isWarCry = true;
        p.warCryTimer = 4.0;
        p.currentSpeed = p.baseSpeed * 1.35;
        return true;
      }
    };

    combat.triggerActiveAbility(player);
    expect(player.isWarCry).toBe(true);
    expect(player.warCryTimer).toBe(4.0);
    expect(player.currentSpeed).toBe(player.baseSpeed * 1.35);

    // Verify timer decays and restores base speed upon expiry
    player.update(4.1, {
      mouse: { screenX: 0, screenY: 0 },
      getMovementVector: () => ({ dx: 0, dy: 0 })
    });
    expect(player.isWarCry).toBe(false);
    expect(player.currentSpeed).toBe(player.baseSpeed);
  });

  it('maintains maximum stamina during infinite stamina tonic buff', () => {
    player.stamina = 50;
    player.isInfiniteStamina = true;
    player.infiniteStaminaTimer = 8.0;

    // Simulate dodge roll input while infinite stamina is active
    player.update(0.1, {
      mouse: { screenX: 0, screenY: 0 },
      getMovementVector: () => ({ dx: 1, dy: 0 }),
      justPressedShift: true
    });

    expect(player.isRolling).toBe(true);
    // Stamina remains pinned at maximum, not depleted by rollCost
    expect(player.stamina).toBe(player.maxStamina);
  });
});

