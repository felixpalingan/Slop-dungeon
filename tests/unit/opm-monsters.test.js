import { describe, it, expect, vi } from 'vitest';
import { Monster } from '../../src/monster.js';
import { getRandomDungeonLoot } from '../../src/items.js';

describe('Phase 2: One Punch Man Monster Association & Carnage Kabuto', () => {
  it('instantiates all 5 OPM mob archetypes with correct attributes', () => {
    const mobs = [
      { type: 'black_sperm', archetype: 'swarmer', hp: 52, speed: 190, radius: 16 },
      { type: 'manako_stalker', archetype: 'disruptor', hp: 75, speed: 130, radius: 18 },
      { type: 'homeless_cultist', archetype: 'ranged', hp: 85, speed: 110, radius: 20 },
      { type: 'fuhrer_ugly', archetype: 'brute', hp: 310, speed: 75, radius: 30 },
      { type: 'rhino_wrestler', archetype: 'brute', hp: 220, speed: 140, radius: 26 },
    ];

    for (const def of mobs) {
      const monster = new Monster({
        type: def.type,
        theme: 'opm',
        archetype: def.archetype,
        hp: def.hp,
        speed: def.speed,
        radius: def.radius
      });

      expect(monster.type).toBe(def.type);
      expect(monster.theme).toBe('opm');
      expect(monster.archetype).toBe(def.archetype);
      expect(monster.maxHp).toBe(def.hp);
      expect(monster.hp).toBe(def.hp);
      expect(monster.baseSpeed).toBe(def.speed);
      expect(monster.radius).toBe(def.radius);
    }
  });

  it('correctly reduces frontal damage by 70% for rhino_wrestler', () => {
    const rhino = new Monster({
      type: 'rhino_wrestler',
      theme: 'opm',
      archetype: 'brute',
      hp: 200,
      radius: 26
    });

    // Face angle: facing right (angle = 0)
    rhino.angle = 0;

    // Attacker attacks from directly in front (hitAngle = Math.PI, meaning moving towards -x, hitting from front)
    // Math.atan2(Math.sin(hitAngle - angle - PI), Math.cos(hitAngle - angle - PI)) -> hitAngle - 0 - PI = 0 -> diff = 0 < PI * 0.45
    const frontalResult = rhino.takeHit(100, Math.PI);
    expect(frontalResult.damage).toBe(30); // 70% reduction: 100 * 0.3 = 30
    expect(rhino.isFrontShielded).toBe(true);
    expect(rhino.hp).toBe(170);

    // Flank attack (hitAngle = Math.PI * 0.5)
    rhino.isFrontShielded = false;
    const flankResult = rhino.takeHit(50, Math.PI * 0.5);
    expect(flankResult.damage).toBe(50); // Full damage
    expect(rhino.hp).toBe(120);

    // Rear attack (hitAngle = 0, hitting from behind)
    rhino.isFrontShielded = false;
    const rearResult = rhino.takeHit(50, 0);
    expect(rearResult.damage).toBe(50); // Full damage
    expect(rhino.hp).toBe(70);
  });

  it('instantiates Carnage Kabuto with correct boss defaults and deathType', () => {
    const kabuto = new Monster({
      type: 'carnage_kabuto',
      theme: 'opm',
      archetype: 'boss',
      hp: 1300,
      speed: 88,
      radius: 48
    });

    expect(kabuto.archetype).toBe('boss');
    expect(kabuto.deathType).toBe('kabuto_splatter');
    expect(kabuto.phase).toBe(1);
    expect(kabuto.phaseTransitionTriggered).toBe(false);
  });

  it('triggers Phase 2 Enraged Carnage Mode at <= 50% HP with 1.45x speed boost', () => {
    const kabuto = new Monster({
      type: 'carnage_kabuto',
      theme: 'opm',
      archetype: 'boss',
      hp: 1000,
      speed: 100,
      radius: 48
    });

    const phase2TriggerSpy = vi.fn();
    kabuto.onPhase2Trigger = phase2TriggerSpy;

    // Hit down to 600 HP (60% HP) -> Should still be Phase 1
    kabuto.takeHit(400);
    expect(kabuto.hp).toBe(600);
    expect(kabuto.phase).toBe(1);
    expect(kabuto.phaseTransitionTriggered).toBe(false);
    expect(phase2TriggerSpy).not.toHaveBeenCalled();

    // Hit down to 500 HP (50% HP) -> Should trigger Phase 2!
    kabuto.takeHit(100);
    expect(kabuto.hp).toBe(500);
    expect(kabuto.phase).toBe(2);
    expect(kabuto.phaseTransitionTriggered).toBe(true);
    expect(phase2TriggerSpy).toHaveBeenCalledTimes(1);
    expect(kabuto.baseSpeed).toBeCloseTo(145, 1); // 100 * 1.45 = 145
  });

  it('handles custom boss death sequence with kabuto_splatter', () => {
    const kabuto = new Monster({
      type: 'carnage_kabuto',
      theme: 'opm',
      archetype: 'boss',
      hp: 100,
      radius: 48
    });

    const dyingSpy = vi.fn();
    kabuto.onBossStartDying = dyingSpy;

    kabuto.takeHit(100);
    expect(kabuto.hp).toBe(0);
    expect(kabuto.isDying).toBe(true);
    expect(kabuto.deathTimer).toBe(kabuto.deathDuration);
    expect(kabuto.deathType).toBe('kabuto_splatter');
    expect(dyingSpy).toHaveBeenCalledWith(kabuto);
  });
});
