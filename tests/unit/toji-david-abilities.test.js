import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { CombatSystem } from '../../src/combat.js';

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
});

