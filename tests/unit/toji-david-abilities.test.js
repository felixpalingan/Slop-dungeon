import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { CombatSystem } from '../../src/combat.js';
import { checkSetBonus, ITEM_CATALOG } from '../../src/items.js';

describe('Toji (Inverted Chain Rampage) & David (Sandevistan) Overhaul (Phase 5)', () => {
  let cinematics;
  let mockAudio;

  beforeEach(() => {
    mockAudio = {
      playChainRampageWindup: vi.fn(),
      playChainStormImpact: vi.fn(),
      playChainRampage: vi.fn(),
      playSandevistanBoot: vi.fn(),
      playSandevistanSnap: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
  });

  describe('Toji Fushiguro — Inverted Chain Rampage (天逆鉾・万浬の鎖)', () => {
    it('freezes reality for 0.28s and then unleashes a 240px storm that nullifies barriers and reflects projectiles', () => {
      const toji = { id: 'toji-1', x: 300, y: 300, angle: 0, radius: 22 };
      cinematics.trigger('inverted_chain_rampage', toji, false);

      expect(cinematics.isChainRampageFreezing()).toBe(true);

      // Advance 0.15s (still in 0.28s freeze)
      cinematics.update(0.15, [], () => {});
      expect(cinematics.isChainRampageFreezing()).toBe(true);

      // Spawn an incoming enemy projectile inside the 240px radius and an enemy with Limitless Barrier at 210px
      const enemy = { id: 'sorcerer-1', x: 510, y: 300, radius: 22, isBlocking: true, isLimitlessBarrier: true };
      cinematics.spawnProjectile({
        type: 'bot_energy_orb',
        caster: enemy,
        x: 460,
        y: 300,
        vx: -500,
        vy: 0,
        radius: 10,
        life: 2.0
      });

      const hits = [];
      // Advance 0.20s (total 0.35s >= 0.28s -> Storm active!)
      cinematics.update(0.20, [enemy], (target, hitInfo) => {
        hits.push({ target, hitInfo });
      });

      expect(cinematics.isChainRampageFreezing()).toBe(false);
      expect(mockAudio.playChainStormImpact).toHaveBeenCalledTimes(1);

      // Enemy at 210px (within 240px) has shield & Limitless barrier stripped and takes 95 damage
      expect(enemy.isBlocking).toBe(false);
      expect(enemy.isLimitlessBarrier).toBe(false);
      expect(hits.length).toBe(1);
      expect(hits[0].hitInfo.damage).toBe(95);

      // Enemy projectile inside 240px storm is reflected back!
      const orb = cinematics.projectiles[0];
      expect(orb.isReflectedByChain).toBe(true);
      expect(orb.caster).toBe(toji);
      expect(orb.vx).toBeGreaterThan(0);
    });
  });

  describe('David Martinez — Military-Grade Sandevistan Overclock (サンデヴィスタン)', () => {
    it('freezes reality for 0.28s during spine implant boot and records bullet-time shockwaves along movement', () => {
      const david = { id: 'david-1', x: 200, y: 200, angle: 0, radius: 22, baseSpeed: 220, currentSpeed: 220 };
      cinematics.trigger('sandevistan', david, false);

      expect(cinematics.isSandevistanFreezing()).toBe(true);
      expect(david.isSandevistan).toBe(true);

      // Advance 0.32s past the 0.28s neural boot freeze
      cinematics.update(0.32, [], () => {});
      expect(cinematics.isSandevistanFreezing()).toBe(false);
      expect(mockAudio.playSandevistanSnap).toHaveBeenCalledTimes(1);

      // Move David 80px right and update -> records a new bullet-time shockwave ring
      david.x = 280;
      cinematics.update(0.1, [], () => {});
      const c = cinematics.activeCinematics[0];
      expect(c.shockwaves.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Toji Fushiguro — Option B Modular Weapon Revamp (ISoH + Chain / Glock)', () => {
    let combat;

    beforeEach(() => {
      combat = new CombatSystem();
    });

    it('activates set bonus with modular loadouts: ISoH + Chain, ISoH + Glock, and backward-compatible inverted_spear_chain', () => {
      const baseTojiArmor = {
        helmet: ITEM_CATALOG['toji_worm'],
        chest: ITEM_CATALOG['toji_shirt'],
        pants: ITEM_CATALOG['toji_pants'],
        boots: ITEM_CATALOG['toji_slippers']
      };

      // 1. ISoH + Thousand-Mile Chain
      const setIsohChain = checkSetBonus({
        ...baseTojiArmor,
        weapon: ITEM_CATALOG['toji_isoh'],
        offhand: ITEM_CATALOG['toji_chain']
      });
      expect(setIsohChain).not.toBeNull();
      expect(setIsohChain.setKey).toBe('toji');

      // 2. ISoH + Tactical Glock
      const setIsohGlock = checkSetBonus({
        ...baseTojiArmor,
        weapon: ITEM_CATALOG['toji_isoh'],
        offhand: ITEM_CATALOG['toji_glock']
      });
      expect(setIsohGlock).not.toBeNull();
      expect(setIsohGlock.setKey).toBe('toji');

      // 3. Backward compatibility: Legacy 2H Inverted Spear of Heaven & Chain
      const setLegacy = checkSetBonus({
        ...baseTojiArmor,
        weapon: ITEM_CATALOG['inverted_spear_chain']
      });
      expect(setLegacy).not.toBeNull();
      expect(setLegacy.setKey).toBe('toji');

      // 4. Mismatch offhand should not trigger set bonus
      const setInvalid = checkSetBonus({
        ...baseTojiArmor,
        weapon: ITEM_CATALOG['toji_isoh'],
        offhand: ITEM_CATALOG['wooden_buckler']
      });
      expect(setInvalid).toBeNull();
    });

    it('transforms main attack into Long Whipping Attack (reach 155, 124° arc, whip momentum) when paired with Thousand-Mile Chain', () => {
      const toji = {
        id: 'toji-modular',
        x: 100,
        y: 100,
        angle: 0,
        radius: 22,
        equipment: {
          weapon: ITEM_CATALOG['toji_isoh'],
          offhand: ITEM_CATALOG['toji_chain']
        }
      };

      // Target at 145px away (beyond normal 62px dagger reach, within 155px whip reach)
      const distantEnemy = { id: 'dummy-far', x: 245, y: 100, radius: 24, hp: 100 };
      const hits = combat.performWeaponAttack(toji, [distantEnemy]);

      expect(hits.length).toBe(1);
      expect(hits[0].isWhip).toBe(true);
      expect(hits[0].knockback).toBe(560);
      expect(hits[0].damage).toBeGreaterThanOrEqual(75); // 65 + 20 damageBuff
    });

    it('reverts to fast jitte dagger slash (reach 62) and pierces shield when paired with Glock or solo', () => {
      const toji = {
        id: 'toji-glock-loadout',
        x: 100,
        y: 100,
        angle: 0,
        radius: 22,
        equipment: {
          weapon: ITEM_CATALOG['toji_isoh'],
          offhand: ITEM_CATALOG['toji_glock']
        }
      };

      // Distant target cannot be reached by dagger
      const distantEnemy = { id: 'dummy-far', x: 245, y: 100, radius: 24, hp: 100 };
      expect(combat.performWeaponAttack(toji, [distantEnemy]).length).toBe(0);

      // Close blocking enemy within 60px: ISoH pierces and breaks block!
      const blockingEnemy = { id: 'dummy-close', x: 155, y: 100, radius: 24, hp: 100, isBlocking: true };
      const hits = combat.performWeaponAttack(toji, [blockingEnemy]);

      expect(hits.length).toBe(1);
      expect(hits[0].isWhip).toBe(false);
      expect(hits[0].isShieldNullifying).toBe(true);
      expect(hits[0].isBlocked).toBe(false);
      expect(blockingEnemy.isBlocking).toBe(false); // Shield shattered/nullified
    });

    it('fires ballistic glock bullet on offhand attack (reach 220) and breaks Limitless sensory barriers', () => {
      const toji = {
        id: 'toji-gunner',
        x: 100,
        y: 100,
        angle: 0,
        radius: 22,
        equipment: {
          weapon: ITEM_CATALOG['toji_isoh'],
          offhand: ITEM_CATALOG['toji_glock']
        }
      };

      const distantGojo = {
        id: 'gojo-barrier',
        x: 310,
        y: 100,
        radius: 24,
        hp: 200,
        isLimitlessBarrier: true
      };

      const offhandHits = combat.performOffhandAttack(toji, [distantGojo]);
      expect(offhandHits.length).toBe(1);
      expect(offhandHits[0].attackType).toBe('toji_glock_shot');
      expect(offhandHits[0].knockback).toBe(440);
      expect(distantGojo.isLimitlessBarrier).toBe(false); // Non-cursed bullet bypasses barrier!
    });
  });
});

