import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { CombatSystem } from '../../src/combat.js';

describe('The Black Swordsman (Guts) — Berserker Rage Overhaul (Phase 4)', () => {
  let cinematics;
  let mockAudio;
  let player;

  beforeEach(() => {
    mockAudio = {
      playBerserkWindup: vi.fn(),
      playBerserkArmorSnap: vi.fn(),
      playBerserkRoar: vi.fn(),
      playClang: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
    player = {
      id: 'guts-1',
      x: 300,
      y: 300,
      angle: 0,
      radius: 24,
      hp: 150,
      maxHp: 200,
      baseSpeed: 220,
      currentSpeed: 220,
      isBerserk: false,
      berserkTimer: 0
    };
  });

  it('initiates a 0.42s Miura manga reality freeze and then unleashes an AoE armor-snap ground slam', () => {
    cinematics.trigger('berserker_rage', player, false);

    expect(cinematics.activeCinematics.length).toBe(1);
    expect(cinematics.isBerserkerRageFreezing()).toBe(true);
    expect(player.isBerserk).toBe(true);

    // Advance 0.20s (progress = 0.20 / 6.0 = 0.033 < 0.07, still frozen)
    const nearbyEnemy = { id: 'apostle-1', x: 380, y: 300, radius: 24, hp: 500 };
    const hits = [];
    cinematics.update(0.20, [nearbyEnemy], (target, hitInfo) => {
      hits.push({ target, hitInfo });
    });

    expect(cinematics.isBerserkerRageFreezing()).toBe(true);
    expect(hits.length).toBe(0);

    // Advance another 0.25s (total 0.45s -> progress = 0.075 >= 0.07) -> Armor snaps shut!
    cinematics.update(0.25, [nearbyEnemy], (target, hitInfo) => {
      hits.push({ target, hitInfo });
    });

    expect(cinematics.isBerserkerRageFreezing()).toBe(false);
    expect(mockAudio.playBerserkArmorSnap).toHaveBeenCalledTimes(1);
    expect(hits.length).toBe(1);
    expect(hits[0].target).toBe(nearbyEnemy);
    expect(hits[0].hitInfo.type).toBe('berserk_awakening_slam');
    expect(hits[0].hitInfo.damage).toBe(140);

    const c = cinematics.activeCinematics[0];
    expect(c.rubbleCracks.length).toBeGreaterThanOrEqual(1);
  });

  it('spawns 180-degree Dragon Slayer crimson cleave waves that fracture the floor into stone rubble', () => {
    cinematics.trigger('berserker_rage', player, false);
    // Advance past the 0.42s freeze
    cinematics.update(0.45, [], () => {});

    const cleave = cinematics.spawnBerserkCleave(player, false);
    expect(cleave).not.toBeNull();
    expect(cleave.type).toBe('berserk_cleave');
    expect(cleave.damage).toBe(115);

    const enemyInFront = { id: 'apostle-2', x: player.x + 120, y: player.y, radius: 22, hp: 400 };
    const cleaveHits = [];
    cinematics.update(0.12, [enemyInFront], (target, proj) => {
      cleaveHits.push({ target, proj });
    });

    expect(cleaveHits.length).toBe(1);
    expect(cleaveHits[0].target).toBe(enemyInFront);
    expect(cleave.radius).toBeGreaterThan(82);

    const c = cinematics.activeCinematics[0];
    expect(c.rubbleCracks.length).toBeGreaterThanOrEqual(2);
  });

  it('integrates with CombatSystem.triggerActiveAbility to play Berserk windup audio and start cinematic', () => {
    const combat = new CombatSystem(mockAudio);
    const triggerSpy = vi.fn((type, p) => cinematics.trigger(type, p));
    const setBonus = { id: 'guts', ultimateQ: 'berserker_rage' };

    const result = combat.triggerActiveAbility(player, setBonus, triggerSpy);

    expect(result).toBe(true);
    expect(mockAudio.playBerserkWindup).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith('berserker_rage', player);
    expect(cinematics.isBerserkerRageFreezing()).toBe(true);
  });
});

