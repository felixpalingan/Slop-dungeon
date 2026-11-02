import { describe, it, expect, vi } from 'vitest';
import { Monster, MonsterManager, BOSS_TYPES } from '../../src/monster.js';
import { CinematicManager } from '../../src/cinematics.js';

describe('Phase 5: Full Boss Encounter Simulation & End-to-End Combat Verification', () => {
  const createMockAudio = () => ({
    playEnrageRoar: vi.fn(),
    playCyberSlam: vi.fn(),
    playTitanRoar: vi.fn(),
    playTitanThud: vi.fn(),
    playArmorShatter: vi.fn(),
    playSteamHiss: vi.fn(),
    playBerserkRoar: vi.fn(),
    playClang: vi.fn(),
    playBlackFlash: vi.fn(),
    playCleaverSlash: vi.fn(),
    playCursedEnergyBeam: vi.fn(),
    playMissileLaunch: vi.fn(),
    playLaserShot: vi.fn(),
    playCoreOverload: vi.fn(),
    playHammerSmash: vi.fn(),
  });

  const createMockParticles = () => ({
    spawnComicText: vi.fn(),
    spawnDashBurst: vi.fn(),
  });

  it('simulates complete Floor 1: Finger Bearer boss fight from spawn to death', () => {
    const audio = createMockAudio();
    const particles = createMockParticles();
    const cinematics = new CinematicManager({ audio });
    const player = { x: 300, y: 300, radius: 24, hp: 100 };

    const boss = new Monster({
      id: 'fb-sim',
      type: 'finger_bearer',
      name: 'Special Grade: Finger Bearer',
      archetype: 'boss',
      hp: 950,
      radius: 46,
      speed: 95,
      x: 300,
      y: 200
    });

    let phase2TriggerCount = 0;
    boss.onPhase2Trigger = (b) => {
      phase2TriggerCount++;
      cinematics.triggerBossPhase2(b);
      audio.playEnrageRoar();
      audio.playBlackFlash();
      b.baseSpeed = 135;
      particles.spawnComicText(b.x, b.y - 50, 'PHASE 2: DOMAIN AWAKENING! ⚠️', '#c084fc');
    };

    // 1. Initial Phase 1 State
    expect(boss.phase).toBe(1);
    expect(boss.archetype).toBe('boss');
    expect(boss.hp).toBe(950);
    expect(boss.baseSpeed).toBe(95);

    // 2. Attack 1 Windup in Phase 1 (Cone Claw Swipe)
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 0;
    boss.updateBoss(0.016, player);
    expect(boss.windupTimer).toBeGreaterThan(0);
    expect(boss.chosenAttack).toBe(1);
    expect(boss.telegraphType).toBe('cone');
    expect(boss.telegraphSpread).toBeCloseTo(Math.PI * 0.65, 2);

    // 3. Take damage to 500 (> 50% of 950 = 475) -> Phase 1 remains
    boss.takeHit(450);
    expect(boss.hp).toBe(500);
    expect(boss.phase).toBe(1);
    expect(phase2TriggerCount).toBe(0);

    // 4. Take damage to 400 (<= 50%) -> Triggers Phase 2 Awakening Cut-In
    boss.takeHit(100);
    expect(boss.hp).toBe(400);
    expect(boss.phase).toBe(2);
    expect(phase2TriggerCount).toBe(1);
    expect(boss.baseSpeed).toBe(135);
    expect(cinematics.isBossPhase2Freezing()).toBe(true);

    // 5. Attack 2 in Phase 2 (Triple Divergent Cursed Beams)
    boss.updateBoss(1.0, player); // resolve previous attack
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 1;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(2);
    expect(boss.telegraphType).toBe('cone');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(420);

    // 6. Attack 3 in Phase 2 (Domain Maelstrom 12-Orb Nova)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 2;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(3);
    expect(boss.telegraphType).toBe('radial');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(260);

    // 7. Fatal Damage -> Enters Custom Curse Vaporization Death
    boss.takeHit(500);
    expect(boss.hp).toBe(0);
    expect(boss.isDying).toBe(true);
    expect(boss.deathType).toBe('curse_vaporize');
  });

  it('simulates complete Floor 2: Adam Smasher Prototype encounter and Sandevistan Overclock', () => {
    const audio = createMockAudio();
    const particles = createMockParticles();
    const cinematics = new CinematicManager({ audio });
    const player = { x: 400, y: 400, radius: 24, hp: 100 };

    const boss = new Monster({
      id: 'smasher-sim',
      type: 'adam_smasher_prototype',
      name: 'Adam Smasher Prototype',
      archetype: 'boss',
      hp: 1200,
      radius: 48,
      speed: 75,
      x: 400,
      y: 250
    });

    let phase2Triggered = false;
    boss.onPhase2Trigger = (b) => {
      phase2Triggered = true;
      cinematics.triggerBossPhase2(b);
      audio.playEnrageRoar();
      audio.playCyberSlam();
      b.baseSpeed = 115;
      particles.spawnComicText(b.x, b.y - 50, 'PHASE 2: SANDEVISTAN OVERCLOCK! ⚡', '#00ff88');
    };

    // 1. Initial State & Attack 1 (Corridor Hydraulic Slam)
    expect(boss.phase).toBe(1);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 0;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(1);
    expect(boss.telegraphType).toBe('corridor');
    expect(boss.telegraphWidth).toBeGreaterThanOrEqual(75);

    // 2. Attack 3 in Phase 1 (Rotary Cannon / Laser Sweep Fan)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 2;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(3);
    expect(boss.telegraphType).toBe('cone');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(300);

    // 3. Drop HP <= 50% (550 <= 600) -> Sandevistan Overclock & Time Freeze
    boss.takeHit(650);
    expect(boss.hp).toBe(550);
    expect(boss.phase).toBe(2);
    expect(phase2Triggered).toBe(true);
    expect(boss.baseSpeed).toBe(115);
    expect(cinematics.isBossPhase2Freezing()).toBe(true);

    // 4. Attack 2 in Phase 2 (8-Missile Full Salvo Apocalypse Cone)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 1;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(2);
    expect(boss.telegraphType).toBe('cone');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(420);

    // 5. Fatal Damage -> Enters Core Detonation Death
    boss.takeHit(700);
    expect(boss.hp).toBe(0);
    expect(boss.isDying).toBe(true);
    expect(boss.deathType).toBe('core_detonation');
  });

  it('simulates complete Floor 3: Armored Titan encounter, crystal hardening, and armor shedding', () => {
    const audio = createMockAudio();
    const cinematics = new CinematicManager({ audio });
    const player = { x: 250, y: 250, radius: 24, hp: 100 };

    const boss = new Monster({
      id: 'titan-sim',
      type: 'armored_titan',
      name: 'Armored Titan',
      archetype: 'boss',
      hp: 1450,
      radius: 52,
      speed: 75,
      x: 250,
      y: 100
    });

    let phase2Triggered = false;
    boss.onPhase2Trigger = (b) => {
      phase2Triggered = true;
      cinematics.triggerBossPhase2(b);
      audio.playEnrageRoar();
      audio.playTitanRoar();
      b.baseSpeed = 110;
    };

    // 1. Attack 1 in Phase 1: Hardened Fist (Corridor)
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 0;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(1);
    expect(boss.telegraphType).toBe('corridor');

    // 2. Damage below 50% (700 <= 725) -> Armor Shedding Phase 2
    boss.takeHit(750);
    expect(boss.hp).toBe(700);
    expect(boss.phase).toBe(2);
    expect(phase2Triggered).toBe(true);
    expect(boss.baseSpeed).toBe(110);
    expect(cinematics.isBossPhase2Freezing()).toBe(true);

    // 3. Attack 3 in Phase 2: Titan Roar & 8-Direction Steam Wave (Radial Nova)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 2;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(3);
    expect(boss.telegraphType).toBe('radial');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(260);

    // 4. Fatal Damage -> Titan Evaporation
    boss.takeHit(800);
    expect(boss.hp).toBe(0);
    expect(boss.isDying).toBe(true);
    expect(boss.deathType).toBe('titan_evaporate');
  });

  it('simulates complete Floor 4: Nosferatu Zodd encounter, apostle form, and winged dive', () => {
    const audio = createMockAudio();
    const cinematics = new CinematicManager({ audio });
    const player = { x: 350, y: 350, radius: 24, hp: 100 };

    const boss = new Monster({
      id: 'zodd-sim',
      type: 'nosferatu_zodd',
      name: 'Nosferatu Zodd',
      archetype: 'boss',
      hp: 1250,
      radius: 48,
      speed: 92,
      x: 350,
      y: 150
    });

    let phase2Triggered = false;
    boss.onPhase2Trigger = (b) => {
      phase2Triggered = true;
      cinematics.triggerBossPhase2(b);
      audio.playBerserkRoar();
      audio.playClang();
      b.radius = 58;
      b.baseSpeed = 115;
    };

    // 1. Phase 1 Attack 2: Flying Cleaver Throw (Cone)
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 1;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(2);
    expect(boss.telegraphType).toBe('cone');

    // 2. Damage below 50% (600 <= 625) -> Apostle Beast Transformation
    boss.takeHit(650);
    expect(boss.hp).toBe(600);
    expect(boss.phase).toBe(2);
    expect(phase2Triggered).toBe(true);
    expect(boss.radius).toBe(58);
    expect(boss.baseSpeed).toBe(115);
    expect(cinematics.isBossPhase2Freezing()).toBe(true);

    // 3. Attack 1 in Phase 2: Supersonic Winged Dive Tackle (Corridor)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 0;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(1);
    expect(boss.telegraphType).toBe('corridor');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(320);

    // 4. Fatal Damage -> Apostle Dissolution
    boss.takeHit(700);
    expect(boss.hp).toBe(0);
    expect(boss.isDying).toBe(true);
    expect(boss.deathType).toBe('apostle_dissolve');
  });

  it('simulates complete Floor 5: Carnage Kabuto encounter, Carnage Mode, and supersonic rampage', () => {
    const audio = createMockAudio();
    const cinematics = new CinematicManager({ audio });
    const player = { x: 500, y: 500, radius: 24, hp: 100 };

    const boss = new Monster({
      id: 'kabuto-sim',
      type: 'carnage_kabuto',
      name: 'Carnage Kabuto',
      archetype: 'boss',
      hp: 1300,
      radius: 48,
      speed: 88,
      x: 500,
      y: 300
    });

    let phase2Triggered = false;
    boss.onPhase2Trigger = (b) => {
      phase2Triggered = true;
      cinematics.triggerBossPhase2(b);
      audio.playEnrageRoar();
      b.radius = 54;
      b.baseSpeed = 160;
    };

    // 1. Phase 1 Attack 1: Hypersonic Beetle Dash (Corridor)
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 0;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(1);
    expect(boss.telegraphType).toBe('corridor');

    // 2. Damage below 50% (600 <= 650) -> Carnage Mode Unleashed!
    boss.takeHit(700);
    expect(boss.hp).toBe(600);
    expect(boss.phase).toBe(2);
    expect(phase2Triggered).toBe(true);
    expect(boss.radius).toBe(54);
    expect(boss.baseSpeed).toBe(160);
    expect(cinematics.isBossPhase2Freezing()).toBe(true);

    // 3. Attack 2 in Phase 2: Air Pressure Cyclone Barrage (Wide Cone)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 1;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(2);
    expect(boss.telegraphType).toBe('cone');
    expect(boss.telegraphSpread).toBeGreaterThanOrEqual(0.5);

    // 4. Attack 3 in Phase 2: Ceiling Smash Seismic Nova (Radial Nova)
    boss.updateBoss(1.0, player);
    boss.bossActionCooldown = 0;
    boss.bossAttackIndex = 2;
    boss.updateBoss(0.016, player);
    expect(boss.chosenAttack).toBe(3);
    expect(boss.telegraphType).toBe('radial');
    expect(boss.telegraphRange).toBeGreaterThanOrEqual(260);

    // 5. Fatal Damage -> Kabuto Splatter
    boss.takeHit(700);
    expect(boss.hp).toBe(0);
    expect(boss.isDying).toBe(true);
    expect(boss.deathType).toBe('kabuto_splatter');
  });

  it('verifies 4-peer multiplayer state synchronization round-trip for boss hazard zones', () => {
    const hostManager = new MonsterManager();
    const clientAlpha = new MonsterManager();
    const clientBeta = new MonsterManager();
    const clientGamma = new MonsterManager();

    const hostSmasher = new Monster({
      id: 'smasher-multi',
      type: 'adam_smasher_prototype',
      archetype: 'boss',
      hp: 1200,
      x: 350,
      y: 450
    });
    hostManager.addMonster(hostSmasher);

    // Host prepares Phase 2 Attack 2 (Missile Artillery Salvo Cone)
    hostSmasher.phase = 2;
    hostSmasher.windupTimer = 0.45;
    hostSmasher.maxWindupTimer = 0.45;
    hostSmasher.telegraphType = 'cone';
    hostSmasher.telegraphAngle = -0.52;
    hostSmasher.telegraphRange = 420;
    hostSmasher.telegraphSpread = Math.PI * 0.55;

    // Host packages state batch
    const batch = hostManager.getBatchNetworkState();
    expect(batch.length).toBe(1);

    // Clients receive batch
    clientAlpha.applyBatchNetworkState(batch);
    clientBeta.applyBatchNetworkState(batch);
    clientGamma.applyBatchNetworkState(batch);

    for (const client of [clientAlpha, clientBeta, clientGamma]) {
      const boss = client.getMonsterById('smasher-multi');
      expect(boss).toBeDefined();
      expect(boss.type).toBe('adam_smasher_prototype');
      expect(boss.archetype).toBe('boss');
      expect(boss.phase).toBe(2);
      expect(boss.isWindingUp).toBe(true);
      expect(boss.telegraphType).toBe('cone');
      expect(boss.telegraphRange).toBe(420);
      expect(boss.telegraphSpread).toBeCloseTo(Math.PI * 0.55, 2);
    }
  });
});

