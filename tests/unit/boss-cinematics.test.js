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
    rotate: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
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

  describe('Phase 2: Dynamic Ground Telegraph Hazard Zones', () => {
    it('automatically configures corridor, cone, and radial telegraph parameters during attack windup', () => {
      const titan = new Monster({
        id: 'titan-test',
        type: 'armored_titan',
        name: 'Armored Titan',
        archetype: 'boss',
        x: 100,
        y: 100,
        radius: 52,
        hp: 1400,
        speed: 75
      });

      const player = { x: 150, y: 100 }; // close distance

      // 1. Force cooldown expiration to pick attack 1 (Melee / Rush)
      titan.bossActionCooldown = 0;
      titan.bossAttackIndex = 0;
      titan.updateBoss(0.016, player);

      expect(titan.windupTimer).toBeGreaterThan(0);
      expect(titan.chosenAttack).toBe(1);
      expect(titan.telegraphType).toBe('corridor');
      expect(titan.telegraphRange).toBeGreaterThan(200);
      expect(titan.telegraphWidth).toBeGreaterThan(50);

      // 2. Advance until attack 1 fires and reset cooldown
      titan.updateBoss(1.0, player);
      expect(titan.telegraphType).toBeNull();

      // 3. Force cooldown expiration to pick attack 2 (Ranged / Cone)
      titan.bossActionCooldown = 0;
      titan.bossAttackIndex = 1;
      titan.updateBoss(0.016, player);

      expect(titan.chosenAttack).toBe(2);
      expect(titan.telegraphType).toBe('cone');
      expect(titan.telegraphRange).toBeGreaterThan(300);
      expect(titan.telegraphSpread).toBeGreaterThan(0.5);

      // 4. Force attack 3 (Radial Nova)
      titan.updateBoss(1.0, player);
      titan.bossActionCooldown = 0;
      titan.bossAttackIndex = 2;
      titan.updateBoss(0.016, player);

      expect(titan.chosenAttack).toBe(3);
      expect(titan.telegraphType).toBe('radial');
      expect(titan.telegraphRange).toBeGreaterThan(150);
    });

    it('sets cone claw telegraph for Finger Bearer on attack 1', () => {
      const fingerBearer = new Monster({
        id: 'fb-test',
        type: 'finger_bearer',
        name: 'Finger Bearer',
        archetype: 'boss',
        x: 100,
        y: 100,
        hp: 950,
        speed: 95
      });
      const player = { x: 140, y: 100 };

      fingerBearer.bossActionCooldown = 0;
      fingerBearer.bossAttackIndex = 0;
      fingerBearer.updateBoss(0.016, player);

      expect(fingerBearer.chosenAttack).toBe(1);
      expect(fingerBearer.telegraphType).toBe('cone');
      expect(fingerBearer.telegraphSpread).toBeGreaterThan(1.0);
    });

    it('renders corridor, cone, and radial ground telegraph zones without error on Canvas', async () => {
      const { Renderer } = await import('../../src/renderer.js');
      const ctx = createMockCtx();
      ctx.setLineDash = vi.fn();
      const mockCanvas = {
        getContext: () => ctx,
        width: 1280,
        height: 720
      };
      const renderer = new Renderer(mockCanvas);

      const testMonster = {
        type: 'nosferatu_zodd',
        archetype: 'boss',
        phase: 1,
        windupTimer: 0.35,
        maxWindupTimer: 0.70,
        animTime: 2.5,
        radius: 48,
        angle: 0.5,
        isDying: false
      };

      // Test Corridor
      testMonster.telegraphType = 'corridor';
      testMonster.telegraphRange = 250;
      testMonster.telegraphWidth = 90;
      expect(() => {
        renderer.drawBossTelegraphZone(ctx, testMonster);
      }).not.toThrow();
      expect(ctx.strokeRect).toHaveBeenCalled();

      // Test Cone
      testMonster.telegraphType = 'cone';
      testMonster.telegraphRange = 350;
      testMonster.telegraphSpread = Math.PI * 0.45;
      expect(() => {
        renderer.drawBossTelegraphZone(ctx, testMonster);
      }).not.toThrow();
      expect(ctx.arc).toHaveBeenCalled();

      // Test Radial
      testMonster.telegraphType = 'radial';
      testMonster.telegraphRange = 200;
      expect(() => {
        renderer.drawBossTelegraphZone(ctx, testMonster);
      }).not.toThrow();
    });
  });

  describe('Phase 3: Visual Evolutions & Boss Animation Overhaul', () => {
    it('renders all 5 floor bosses in Phase 1 and Phase 2 without errors', async () => {
      const { Renderer } = await import('../../src/renderer.js');
      const ctx = createMockCtx();
      const mockCanvas = {
        getContext: () => ctx,
        width: 1280,
        height: 720
      };
      const renderer = new Renderer(mockCanvas);

      const bossTypes = [
        'finger_bearer',
        'adam_smasher_prototype',
        'armored_titan',
        'nosferatu_zodd',
        'carnage_kabuto'
      ];

      for (const bType of bossTypes) {
        for (const phase of [1, 2]) {
          const boss = {
            type: bType,
            archetype: 'boss',
            phase,
            x: 200,
            y: 200,
            radius: 48,
            angle: 0.8,
            animTime: 3.5,
            hp: 800,
            maxHp: 1000,
            windupTimer: 0,
            isDying: false
          };

          expect(() => {
            renderer.drawMonsters([boss], 3.5);
          }).not.toThrow();
        }
      }
    });

    it('renders attack windup visual evolutions (laser lock-on, crystal fists, cyclone horn, missile exhaust) across all bosses', async () => {
      const { Renderer } = await import('../../src/renderer.js');
      const ctx = createMockCtx();
      const mockCanvas = {
        getContext: () => ctx,
        width: 1280,
        height: 720
      };
      const renderer = new Renderer(mockCanvas);

      const bossWindupConfigs = [
        {
          type: 'adam_smasher_prototype',
          phase: 2,
          windupTimer: 0.4,
          maxWindupTimer: 0.8,
          telegraphAngle: 0.5,
          telegraphRange: 350
        },
        {
          type: 'armored_titan',
          phase: 2,
          windupTimer: 0.5,
          maxWindupTimer: 0.9,
          telegraphAngle: 0,
          telegraphRange: 280
        },
        {
          type: 'carnage_kabuto',
          phase: 2,
          windupTimer: 0.3,
          maxWindupTimer: 0.6,
          telegraphAngle: -0.5,
          telegraphRange: 300
        },
        {
          type: 'finger_bearer',
          phase: 2,
          windupTimer: 0.45,
          maxWindupTimer: 0.75,
          telegraphAngle: 1.2,
          telegraphRange: 220
        },
        {
          type: 'nosferatu_zodd',
          phase: 2,
          windupTimer: 0.35,
          maxWindupTimer: 0.7,
          telegraphAngle: 0.2,
          telegraphRange: 260
        }
      ];

      for (const config of bossWindupConfigs) {
        const boss = {
          archetype: 'boss',
          x: 300,
          y: 300,
          radius: 48,
          angle: 0.3,
          animTime: 4.2,
          hp: 400,
          maxHp: 1000,
          isDying: false,
          ...config
        };

        expect(() => {
          renderer.drawMonsters([boss], 4.2);
        }).not.toThrow();
      }
    });

    it('renders Sandevistan and hypersonic after-images seamlessly', async () => {
      const { Renderer } = await import('../../src/renderer.js');
      const ctx = createMockCtx();
      const mockCanvas = {
        getContext: () => ctx,
        width: 1280,
        height: 720
      };
      const renderer = new Renderer(mockCanvas);

      const smasherWithTrail = {
        type: 'adam_smasher_prototype',
        archetype: 'boss',
        phase: 2,
        x: 400,
        y: 400,
        radius: 48,
        angle: 0.5,
        animTime: 2.0,
        hp: 500,
        maxHp: 1200,
        afterImages: [
          { x: 380, y: 380, angle: 0.45, alpha: 0.6, color: '#00ff88' },
          { x: 360, y: 360, angle: 0.40, alpha: 0.3, color: '#00ff88' }
        ]
      };

      const kabutoWithTrail = {
        type: 'carnage_kabuto',
        archetype: 'boss',
        phase: 2,
        x: 500,
        y: 500,
        radius: 50,
        angle: -0.2,
        animTime: 2.5,
        hp: 400,
        maxHp: 1500,
        afterImages: [
          { x: 480, y: 490, angle: -0.2, alpha: 0.7, color: '#ef4444' },
          { x: 460, y: 480, angle: -0.2, alpha: 0.4, color: '#22c55e' }
        ]
      };

      expect(() => {
        renderer.drawMonsters([smasherWithTrail, kabutoWithTrail], 2.5);
      }).not.toThrow();
    });
  });
});

