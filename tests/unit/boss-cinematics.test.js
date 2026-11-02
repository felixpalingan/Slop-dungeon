import { describe, it, expect, vi } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { Monster } from '../../src/monster.js';

describe('Phase 1: Boss Cinematic Awakening Engine & Phase 2 Freeze', () => {
  const createMockAudio = () => ({
    playEnrageRoar: vi.fn(),
    playCyberSlam: vi.fn(),
    playTitanRoar: vi.fn(),
    playBerserkRoar: vi.fn(),
    playSteamHiss: vi.fn(),
    playClang: vi.fn()
  });

  const createMockCtx = () => ({
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    }))
  });

  it('registers boss_phase2 active cinematic and triggers initial screen shake', () => {
    const audio = createMockAudio();
    const cm = new CinematicManager({ audio });
    const mockBoss = {
      type: 'adam_smasher_prototype',
      name: 'Adam Smasher Prototype',
      x: 400,
      y: 350
    };

    const cinematic = cm.triggerBossPhase2(mockBoss);
    expect(cinematic).toBeDefined();
    expect(cinematic.type).toBe('boss_phase2');
    expect(cinematic.bossType).toBe('adam_smasher_prototype');
    expect(cinematic.duration).toBe(1.35);
    expect(cm.screenShake).toBeGreaterThanOrEqual(24);
    expect(audio.playCyberSlam).toHaveBeenCalledTimes(1);
    expect(cm.activeCinematics.length).toBe(1);
  });

  it('returns isBossPhase2Freezing() true during the initial ~0.5s freeze window and false afterwards', () => {
    const cm = new CinematicManager();
    const mockBoss = {
      type: 'carnage_kabuto',
      name: 'Carnage Kabuto',
      x: 300,
      y: 300
    };

    cm.triggerBossPhase2(mockBoss);

    // Initial state: progress = 0.0 -> Freezing should be true
    expect(cm.isBossPhase2Freezing()).toBe(true);

    // Advance 0.3s (progress = 0.3 / 1.35 = 0.222 < 0.38) -> Freezing still true
    cm.update(0.3);
    expect(cm.isBossPhase2Freezing()).toBe(true);

    // Advance another 0.3s (total elapsed 0.6s -> progress = 0.6 / 1.35 = 0.444 >= 0.38) -> Freezing ends!
    cm.update(0.3);
    expect(cm.isBossPhase2Freezing()).toBe(false);

    // Cinematic should still be active for unfreeze shockwave
    expect(cm.activeCinematics.length).toBe(1);

    // Advance beyond 1.35s total duration -> Cinematic completes and disposes
    cm.update(0.8);
    expect(cm.activeCinematics.length).toBe(0);
    expect(cm.isBossPhase2Freezing()).toBe(false);
  });

  it('freezes projectile movement while boss_phase2 freeze window is active', () => {
    const cm = new CinematicManager();
    const mockBoss = {
      type: 'armored_titan',
      name: 'Armored Titan',
      x: 200,
      y: 200
    };

    cm.spawnProjectile({
      type: 'bot_energy_orb',
      x: 100,
      y: 100,
      vx: 500,
      vy: 0,
      radius: 10,
      life: 2.0
    });

    cm.triggerBossPhase2(mockBoss);
    expect(cm.isBossPhase2Freezing()).toBe(true);

    // Update 0.2s: projectiles should NOT move because world is frozen!
    cm.update(0.2);
    expect(cm.projectiles[0].x).toBe(100);

    // Advance until freeze ends (0.4s more, total 0.6s)
    cm.update(0.4);
    expect(cm.isBossPhase2Freezing()).toBe(false);

    // Subsequent updates should advance the projectile normally
    cm.update(0.1);
    expect(cm.projectiles[0].x).toBeGreaterThan(100);
  });

  it('draws full manga cut-in screen overlay without errors for all 5 floor bosses', () => {
    const cm = new CinematicManager();
    const ctx = createMockCtx();
    const bosses = [
      { type: 'finger_bearer', name: 'Finger Bearer' },
      { type: 'adam_smasher_prototype', name: 'Adam Smasher' },
      { type: 'armored_titan', name: 'Armored Titan' },
      { type: 'nosferatu_zodd', name: 'Nosferatu Zodd' },
      { type: 'carnage_kabuto', name: 'Carnage Kabuto' }
    ];

    for (const boss of bosses) {
      cm.activeCinematics = [];
      cm.triggerBossPhase2(boss);

      // 1. Draw during Phase 1 freeze frame (progress < 0.38)
      expect(() => {
        cm.drawScreenOverlay(ctx, 1280, 720);
      }).not.toThrow();

      // Verify text rendering for Japanese and English headers
      expect(ctx.strokeText).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalled();

      // 2. Advance to unfreeze shockwave phase (progress >= 0.38)
      cm.update(0.65);
      expect(() => {
        cm.drawScreenOverlay(ctx, 1280, 720);
      }).not.toThrow();
    }
  });

  it('supports unified trigger("boss_phase2", boss) call signature', () => {
    const cm = new CinematicManager();
    const mockBoss = {
      type: 'nosferatu_zodd',
      name: 'Nosferatu Zodd',
      x: 150,
      y: 150
    };

    const cinematic = cm.trigger('boss_phase2', mockBoss);
    expect(cinematic).toBeDefined();
    expect(cinematic.type).toBe('boss_phase2');
    expect(cinematic.bossType).toBe('nosferatu_zodd');
  });

  it('triggers onPhase2Trigger on client peer when applying monster state with hp <= 50%', () => {
    const boss = new Monster({
      id: 'boss-peer-test',
      type: 'adam_smasher_prototype',
      name: 'Adam Smasher',
      archetype: 'boss',
      x: 200,
      y: 200,
      hp: 1200,
      radius: 48,
      speed: 75
    });

    let phase2Fired = false;
    boss.onPhase2Trigger = () => {
      phase2Fired = true;
    };

    expect(boss.phase).toBe(1);
    expect(boss.phaseTransitionTriggered).toBeFalsy();

    // Host reports hp dropping to 500 (below 50% of 1200)
    // stateArray: [id, type, x, y, angle, hp, isDead, isStunned, isWindingUp, wardHp, specialState, fuseTimer]
    boss.applyNetworkState([
      'boss-peer-test',
      'adam_smasher_prototype',
      200,
      200,
      0,
      500, // hp <= 600
      0,
      0,
      0,
      0,
      0,
      0
    ]);

    expect(boss.phase).toBe(2);
    expect(boss.phaseTransitionTriggered).toBe(true);
    expect(phase2Fired).toBe(true);
    expect(boss.baseSpeed).toBeGreaterThan(75);
  });
});
