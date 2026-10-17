import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { Player } from '../../src/player.js';
import { CombatSystem } from '../../src/combat.js';
import { ITEM_CATALOG, checkSetBonus } from '../../src/items.js';

describe('Phase 4: One Punch Man Abilities & Serious Punch Mechanics', () => {
  let cinematics;
  let player;
  let mockAudio;

  beforeEach(() => {
    mockAudio = {
      playConsecutivePunches: vi.fn(),
      playSeriousPunchWindup: vi.fn(),
      playSeriousPunchImpact: vi.fn(),
      playBonk: vi.fn(),
      playClang: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
    cinematics.audio = mockAudio;
    player = new Player(100, 100);
    player.angle = 0;
  });

  describe('Consecutive Normal Punches (Base Q)', () => {
    it('triggers cinematic and spawns 8 staggered red fist projectiles over 0.6 seconds', () => {
      cinematics.trigger('consecutive_normal_punches', player);
      expect(cinematics.activeCinematics.length).toBe(1);
      expect(cinematics.activeCinematics[0].type).toBe('consecutive_normal_punches');

      const spawnedPunches = [];
      // Intercept or accumulate punches as they spawn across time steps
      for (let step = 0; step < 6; step++) {
        cinematics.update(0.1, []);
        for (const p of cinematics.projectiles) {
          if (p.type === 'normal_punch' && !spawnedPunches.includes(p)) {
            spawnedPunches.push(p);
          }
        }
      }

      // Total punches fired by the ability should be 8
      expect(spawnedPunches.length).toBe(8);

      for (const p of spawnedPunches) {
        expect(p.damage).toBe(32);
        expect(p.knockback).toBe(600);
        expect(p.radius).toBe(26);
        expect(p.caster).toBe(player);
      }
    });

    it('is blocked by obstacles/pillars (tactical cover)', () => {
      const pillar = { x: 180, y: 100, radius: 24, type: 'pillar' };

      cinematics.spawnProjectile({
        type: 'normal_punch',
        x: 120,
        y: 100,
        vx: 800,
        vy: 0,
        radius: 26,
        damage: 32,
        life: 0.35,
        angle: 0
      });

      expect(cinematics.projectiles.length).toBe(1);

      let blockedObstacle = null;
      let blockedProj = null;

      // Update flight: advances through the pillar at x=180
      cinematics.update(0.1, [], null, [pillar], (obs, proj) => {
        blockedObstacle = obs;
        blockedProj = proj;
      });

      expect(blockedObstacle).toBe(pillar);
      expect(blockedProj.type).toBe('normal_punch');
      expect(cinematics.projectiles.length).toBe(0);
    });
  });

  describe('Serious Punch (Set Ultimate Q)', () => {
    it('initiates monochrome windup freeze during the first 0.45s (progress < 0.30)', () => {
      cinematics.trigger('serious_punch', player);
      expect(cinematics.activeCinematics.length).toBe(1);
      const c = cinematics.activeCinematics[0];
      expect(c.type).toBe('serious_punch');

      // Right after trigger: timer = 1.5, duration = 1.5, progress = 0
      expect(cinematics.isSeriousPunchFreezing()).toBe(true);

      // Advance by 0.3s (progress = 0.20 < 0.30)
      cinematics.update(0.3, []);
      expect(cinematics.isSeriousPunchFreezing()).toBe(true);
      expect(cinematics.projectiles.filter(p => p.type === 'serious_punch_beam').length).toBe(0);
    });

    it('freezes world projectiles in mid-air during the windup freeze', () => {
      cinematics.trigger('serious_punch', player);

      // Spawn a generic projectile
      cinematics.spawnProjectile({
        type: 'bot_energy_orb',
        x: 100,
        y: 100,
        vx: 500,
        vy: 0,
        life: 2.0
      });

      const initialProj = cinematics.projectiles.find(p => p.type === 'bot_energy_orb');
      expect(initialProj.x).toBe(100);

      // Advance while frozen (0.2s)
      cinematics.update(0.2, []);

      // Projectile should NOT have moved because world is frozen!
      expect(initialProj.x).toBe(100);
    });

    it('unfreezes at 0.45s, triggers playSeriousPunchImpact audio, and fires devastating piercing beam', () => {
      cinematics.trigger('serious_punch', player);

      // Advance past 0.45s threshold (0.46s -> progress = 0.46 / 1.5 = 0.306 >= 0.30)
      cinematics.update(0.46, []);

      expect(cinematics.isSeriousPunchFreezing()).toBe(false);
      expect(mockAudio.playSeriousPunchImpact).toHaveBeenCalledTimes(1);

      const beam = cinematics.projectiles.find(p => p.type === 'serious_punch_beam');
      expect(beam).toBeDefined();
      expect(beam.damage).toBe(400);
      expect(beam.width).toBe(180);
      expect(beam.piercesObstacles).toBe(true);
    });

    it('serious_punch_beam pierces straight through obstacles/pillars without being destroyed', () => {
      const pillar = { x: 250, y: 100, radius: 24, type: 'pillar' };

      cinematics.spawnProjectile({
        type: 'serious_punch_beam',
        x: 150,
        y: 100,
        vx: 1100,
        vy: 0,
        width: 180,
        radius: 140,
        damage: 400,
        piercesObstacles: true,
        life: 0.75,
        angle: 0
      });

      let obstacleHit = false;
      // Advance beam through pillar
      cinematics.update(0.15, [], null, [pillar], () => {
        obstacleHit = true;
      });

      // Piercing beam should NOT be stopped by the pillar
      expect(obstacleHit).toBe(false);
      const remainingBeam = cinematics.projectiles.find(p => p.type === 'serious_punch_beam');
      expect(remainingBeam).toBeDefined();
      expect(remainingBeam.x).toBeGreaterThan(250);
    });
  });

  describe('Combat System Q Key Integration', () => {
    let combat;

    beforeEach(() => {
      combat = new CombatSystem(mockAudio, null);
    });

    it('fires Consecutive Normal Punches when only saitama_suit is equipped (without full set)', () => {
      player.equipItem(ITEM_CATALOG['saitama_suit']);

      let triggeredType = null;
      const triggerCb = (type) => {
        triggeredType = type;
      };

      const setBonus = checkSetBonus(player.equipment);
      const handled = combat.triggerActiveAbility(player, setBonus, triggerCb);

      expect(handled).toBe(true);
      expect(triggeredType).toBe('consecutive_normal_punches');
      expect(mockAudio.playConsecutivePunches).toHaveBeenCalledTimes(1);
    });

    it('fires Serious Punch when all 6 Saitama set pieces are equipped', () => {
      player.equipItem(ITEM_CATALOG['saitama_bald']);
      player.equipItem(ITEM_CATALOG['saitama_suit']);
      player.equipItem(ITEM_CATALOG['saitama_tights']);
      player.equipItem(ITEM_CATALOG['saitama_boots']);
      player.equipItem(ITEM_CATALOG['saitama_glove']);
      player.equipItem(ITEM_CATALOG['saitama_groceries']);

      let triggeredType = null;
      const triggerCb = (type) => {
        triggeredType = type;
      };

      const setBonus = checkSetBonus(player.equipment);
      const handled = combat.triggerActiveAbility(player, setBonus, triggerCb);

      expect(handled).toBe(true);
      expect(triggeredType).toBe('serious_punch');
      expect(mockAudio.playSeriousPunchWindup).toHaveBeenCalledTimes(1);
    });
  });
});
