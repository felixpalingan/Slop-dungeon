import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { Player } from '../../src/player.js';
import { CombatSystem } from '../../src/combat.js';
import { ITEM_CATALOG, checkSetBonus } from '../../src/items.js';

describe('Sukuna King of Curses Rework: World Cutting Slash Cone & Reality Freeze', () => {
  let cinematics;
  let player;
  let mockAudio;

  beforeEach(() => {
    mockAudio = {
      playWorldCuttingSlashWindup: vi.fn(),
      playWorldCuttingSlashImpact: vi.fn(),
      playWorldCuttingSlash: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
    cinematics.audio = mockAudio;
    player = new Player(100, 100);
    player.angle = 0;
  });

  describe('World Cutting Slash Windup Freeze (0.0s - 0.36s)', () => {
    it('initiates reality freeze during the first 0.36s (progress < 0.28)', () => {
      cinematics.trigger('world_cutting_slash', player);
      expect(cinematics.activeCinematics.length).toBe(1);
      const c = cinematics.activeCinematics[0];
      expect(c.type).toBe('world_cutting_slash');

      // Right after trigger: progress = 0 < 0.28
      expect(cinematics.isWorldCuttingSlashFreezing()).toBe(true);

      // Advance by 0.2s (progress = 0.2 / 1.3 = 0.154 < 0.28)
      cinematics.update(0.2, []);
      expect(cinematics.isWorldCuttingSlashFreezing()).toBe(true);
      expect(cinematics.projectiles.filter(p => p.type === 'world_cutting_slash').length).toBe(0);
    });

    it('freezes world projectiles in mid-air during the windup freeze', () => {
      cinematics.trigger('world_cutting_slash', player);

      // Spawn a generic world projectile
      cinematics.spawnProjectile({
        type: 'bot_energy_orb',
        x: 100,
        y: 100,
        vx: 600,
        vy: 0,
        life: 2.0
      });

      const orb = cinematics.projectiles.find(p => p.type === 'bot_energy_orb');
      expect(orb.x).toBe(100);

      // Advance 0.2s while frozen
      cinematics.update(0.2, []);
      expect(orb.x).toBe(100);
    });
  });

  describe('Cataclysmic Spatial Cone Release & Expansion (progress >= 0.28)', () => {
    it('unfreezes at 0.37s, plays impact audio, and spawns the colossal cone wave', () => {
      cinematics.trigger('world_cutting_slash', player);

      // Advance past 0.364s threshold (0.38s -> progress = 0.38 / 1.3 = 0.292 >= 0.28)
      cinematics.update(0.38, []);

      expect(cinematics.isWorldCuttingSlashFreezing()).toBe(false);
      expect(mockAudio.playWorldCuttingSlashImpact).toHaveBeenCalledTimes(1);

      const slash = cinematics.projectiles.find(p => p.type === 'world_cutting_slash');
      expect(slash).toBeDefined();
      expect(slash.damage).toBe(380);
      expect(slash.piercesObstacles).toBe(true);
      expect(slash.coneAngle).toBeGreaterThan(0.7); // wide cone angle (~50 deg half-angle)
      expect(slash.vx).toBe(0); // Anchored at caster origin, does not fly forward as whole cone
      expect(slash.vy).toBe(0);
      expect(slash.width).toBeGreaterThanOrEqual(280);
      expect(slash.maxWidth).toBe(1280);
      expect(slash.maxRadius).toBe(820);
    });

    it('pierces straight through obstacles/pillars without getting blocked or destroyed', () => {
      const pillar = { x: 220, y: 100, radius: 24, type: 'pillar' };

      cinematics.spawnProjectile({
        type: 'world_cutting_slash',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        radius: 160,
        maxRadius: 820,
        width: 320,
        maxWidth: 1280,
        damage: 380,
        piercesObstacles: true,
        life: 0.75,
        angle: 0
      });

      let obstacleIntercepted = false;
      // Advance projectile past obstacle (obstacle is within expanding cone radius)
      cinematics.update(0.15, [], null, [pillar], () => {
        obstacleIntercepted = true;
      });

      expect(obstacleIntercepted).toBe(false);
      expect(cinematics.projectiles.some(p => p.type === 'world_cutting_slash')).toBe(true);
    });

    it('hits targets in the forward cone arc and expands outward from caster', () => {
      const slash = {
        type: 'world_cutting_slash',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        radius: 160,
        maxRadius: 820,
        width: 320,
        maxWidth: 1280,
        damage: 380,
        coneAngle: 0.88, // ~50.4 deg
        life: 0.75,
        maxLife: 0.75,
        angle: 0,
        caster: player
      };
      cinematics.spawnProjectile(slash);

      // Target in the cone (forward-right: angle ~ 26 deg < 47 deg)
      const enemyInCone = { id: 'cursed_spirit_1', x: 200, y: 150, radius: 22 };
      // Target behind the player (x = 20, angle = 180 deg)
      const enemyBehind = { id: 'cursed_spirit_behind', x: 20, y: 100, radius: 22 };

      const hitList = [];
      cinematics.update(0.1, [enemyInCone, enemyBehind], (target, proj) => {
        hitList.push(target);
      });

      expect(hitList).toContain(enemyInCone);
      expect(hitList).not.toContain(enemyBehind);
    });
  });

  describe('CombatSystem Integration for King of Curses Set', () => {
    it('triggers windup audio and calls world_cutting_slash cinematic when full set is equipped', () => {
      const combat = new CombatSystem(mockAudio);
      const triggerSpy = vi.fn();

      // Equip Sukuna set pieces
      player.equipment = {
        helmet: ITEM_CATALOG.sukuna_crown,
        chest: ITEM_CATALOG.sukuna_robe,
        pants: ITEM_CATALOG.sukuna_hakama,
        boots: ITEM_CATALOG.sukuna_zori,
        weapon: ITEM_CATALOG.sukuna_cleaver
      };

      const setBonus = checkSetBonus(player.equipment);
      expect(setBonus).not.toBeNull();
      expect(setBonus.ultimateQ).toBe('world_cutting_slash');

      const fired = combat.triggerActiveAbility(player, setBonus, triggerSpy);
      expect(fired).toBe(true);
      expect(mockAudio.playWorldCuttingSlashWindup).toHaveBeenCalledTimes(1);
      expect(triggerSpy).toHaveBeenCalledWith('world_cutting_slash', player);
    });
  });
});
