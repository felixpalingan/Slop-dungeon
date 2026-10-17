import { describe, it, expect } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';

describe('CinematicManager Tactical Cover & Obstacle Collisions', () => {
  it('blocks kinetic and elemental projectiles when colliding with room obstacles / pillars', () => {
    const cm = new CinematicManager();
    const pillar = { x: 200, y: 100, radius: 22, type: 'pillar' };

    // Fire a shotgun pellet directly through the pillar
    cm.spawnProjectile({
      type: 'shotgun_pellet',
      x: 150,
      y: 100,
      vx: 400,
      vy: 0,
      radius: 6,
      damage: 18,
      life: 1.0
    });

    expect(cm.projectiles.length).toBe(1);

    let hitRecorded = null;
    let projRecorded = null;

    // Simulate 0.2s of flight -> projectile advances from 150 to 230, crossing through pillar at 200
    cm.update(
      0.2,
      [],
      null,
      [pillar],
      (obs, proj) => {
        hitRecorded = obs;
        projRecorded = proj;
      }
    );

    // Projectile should be intercepted and consumed by the pillar
    expect(hitRecorded).toBe(pillar);
    expect(projRecorded).toBeDefined();
    expect(projRecorded.type).toBe('shotgun_pellet');
    expect(cm.projectiles.length).toBe(0);
  });

  it('prevents tunneling for high-speed projectiles using continuous segment detection', () => {
    const cm = new CinematicManager();
    const pillar = { x: 300, y: 300, radius: 20, type: 'pillar' };

    // Very high speed laser projectile that would jump over the pillar in a single frame without segment math
    cm.spawnProjectile({
      type: 'bot_laser_bolt',
      x: 100,
      y: 300,
      vx: 2000,
      vy: 0,
      radius: 6,
      life: 1.0
    });

    let intercepted = false;
    cm.update(
      0.2, // advances from x=100 to x=500 in 1 frame
      [],
      null,
      [pillar],
      () => {
        intercepted = true;
      }
    );

    expect(intercepted).toBe(true);
    expect(cm.projectiles.length).toBe(0);
  });

  it('allows piercing ultimates like Hollow Purple to pass straight through obstacles', () => {
    const cm = new CinematicManager();
    const pillar = { x: 200, y: 200, radius: 22, type: 'pillar' };

    cm.spawnProjectile({
      type: 'hollow_purple',
      x: 100,
      y: 200,
      vx: 600,
      vy: 0,
      radius: 40,
      life: 1.5
    });

    let intercepted = false;
    cm.update(
      0.2,
      [],
      null,
      [pillar],
      () => {
        intercepted = true;
      }
    );

    // Hollow Purple should NOT be blocked
    expect(intercepted).toBe(false);
    expect(cm.projectiles.length).toBe(1);
    expect(cm.projectiles[0].x).toBe(220);
  });

  it('leaves targets unharmed when projectiles are blocked by cover before reaching them', () => {
    const cm = new CinematicManager();
    const pillar = { x: 200, y: 100, radius: 20, type: 'pillar' };
    const targetBehindPillar = { id: 'player-1', x: 280, y: 100, radius: 22 };

    cm.spawnProjectile({
      type: 'bot_energy_orb',
      x: 100,
      y: 100,
      vx: 500,
      vy: 0,
      radius: 12,
      damage: 25,
      life: 1.0
    });

    let targetHit = false;
    let obstacleHit = false;

    cm.update(
      0.25, // moves from 100 to 225, hitting pillar at 200
      [targetBehindPillar],
      () => {
        targetHit = true;
      },
      [pillar],
      () => {
        obstacleHit = true;
      }
    );

    expect(obstacleHit).toBe(true);
    expect(targetHit).toBe(false);
    expect(cm.projectiles.length).toBe(0);
  });
});
