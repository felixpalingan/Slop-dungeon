import { describe, it, expect, vi, beforeEach } from 'vitest';
import {CinematicManager} from '../../src/cinematics.js';
import {CombatSystem} from '../../src/combat.js';

describe('The Honored One (Gojo) — Hollow Purple Overhaul (Phase 3)', () => {
  let cinematics;
  let mockAudio;
  let player;

  beforeEach(() => {
    mockAudio = {
      playHollowPurpleWindup: vi.fn(),
      playHollowPurpleImpact: vi.fn(),
      playHollowPurple: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
    player = {
      id: 'gojo-1',
      x: 300,
      y: 300,
      angle: 0,
      radius: 24,
      hp: 100,
      maxHp: 100,
      equipment: {
        head: 'gojo_blindfold',
        body: 'gojo_uniform',
        accessory: 'six_eyes'
      },
      abilityCooldown: 0,
      maxAbilityCooldown: 10
    };
  });

  it('starts a 0.45s Blue & Red convergence reality freeze before spawning the projectile', () => {
    cinematics.trigger('hollow_purple', player, false);

    expect(cinematics.activeCinematics.length).toBe(1);
    expect(cinematics.isHollowPurpleFreezing()).toBe(true);
    // Projectile is deferred until Blue & Red collide at progress >= 0.30 (0.45s of 1.5s)
    expect(cinematics.projectiles.length).toBe(0);

    // Advance 0.25s (still in Phase 1 convergence freeze)
    cinematics.update(0.25, [], () => {});
    expect(cinematics.isHollowPurpleFreezing()).toBe(true);
    expect(cinematics.projectiles.length).toBe(0);

    // Advance past 0.45s (progress >= 0.30) -> Imaginary Mass Singularity fires!
    cinematics.update(0.25, [], () => {});
    expect(cinematics.isHollowPurpleFreezing()).toBe(false);
    expect(cinematics.projectiles.length).toBe(1);
    expect(mockAudio.playHollowPurpleImpact).toHaveBeenCalledTimes(1);

    const orb = cinematics.projectiles[0];
    expect(orb.type).toBe('hollow_purple');
    expect(orb.damage).toBe(360);
    expect(orb.piercesObstacles).toBe(true);
    expect(orb.pullRadius).toBe(280);
  });

  it('gravitationally pulls nearby enemies toward the Imaginary Mass core and records a cosmic void trail', () => {
    cinematics.trigger('hollow_purple', player, false);
    // Advance past the 0.45s windup to launch the orb
    cinematics.update(0.48, [], () => {});
    expect(cinematics.projectiles.length).toBe(1);

    const orb = cinematics.projectiles[0];
    // Place an enemy 180px above the orb's flight path (within pullRadius 280, outside initial hit radius)
    const enemy = { id: 'curse-1', x: orb.x + 80, y: orb.y - 180, radius: 20, hp: 500 };
    const initialY = enemy.y;

    // Update 0.1s while orb flies right (along y = 300)
    cinematics.update(0.1, [enemy], () => {});

    // Enemy should be pulled closer to y = 300 (so enemy.y increases)
    expect(enemy.y).toBeGreaterThan(initialY);
    // Orb should expand and record cosmic void trench nodes
    expect(orb.radius).toBeGreaterThan(65);
    expect(orb.trail.length).toBeGreaterThanOrEqual(2);
  });

  it('integrates with CombatSystem.triggerActiveAbility to trigger Hollow Purple windup audio and cinematic', () => {
    const combat = new CombatSystem(mockAudio);
    const triggerSpy = vi.fn((type, p) => cinematics.trigger(type, p));
    const setBonus = { id: 'gojo', ultimateQ: 'hollow_purple' };

    const result = combat.triggerActiveAbility(player, setBonus, triggerSpy);

    expect(result).toBe(true);
    expect(mockAudio.playHollowPurpleWindup).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith('hollow_purple', player);
    expect(cinematics.isHollowPurpleFreezing()).toBe(true);
  });
});
