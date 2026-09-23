import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { AudioManager } from './audio.js';
import { ParticleManager } from './particles.js';
import { NetworkManager } from './network.js';
import { Dummy } from './dummy.js';
import { ReadyCircle } from './readyCircle.js';
import { CustomizationStation } from './customizationStation.js';
import { FloorSelectStation } from './floorSelectStation.js';
import { ITEM_CATALOG, ItemRarity, checkSetBonus, getRandomDungeonLoot } from './items.js';
import { CombatSystem } from './combat.js';
import { GroundLoot } from './groundLoot.js';
import { CinematicManager } from './cinematics.js';
import { Dungeon, DUNGEON_THEMES } from './dungeon.js';
import { Monster, MonsterManager } from './monster.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const input = new InputManager();
const player = new Player(0, 0);

// Start equipped as Humanity's Strongest Soldier (Levi Ackerman)
player.equipItem(ITEM_CATALOG['scout_hood']);
player.equipItem(ITEM_CATALOG['odm_harness']);
player.equipItem(ITEM_CATALOG['scout_trousers']);
player.equipItem(ITEM_CATALOG['scout_boots']);
player.equipItem(ITEM_CATALOG['dual_snap_blades']);

// Store starter dungeon gear in backpack inventory
player.inventory.push(
  ITEM_CATALOG['rusty_sword'],
  ITEM_CATALOG['wooden_buckler'],
  ITEM_CATALOG['iron_visor'],
  ITEM_CATALOG['leather_tunic'],
  ITEM_CATALOG['cloth_pants'],
  ITEM_CATALOG['travel_boots']
);

const audio = new AudioManager();
const particles = new ParticleManager();
const network = new NetworkManager();
const combat = new CombatSystem(audio, particles);
const cinematics = new CinematicManager();

// Lobby entities
const dummy = new Dummy(0, -180);
const readyCircle = new ReadyCircle(0, 160, 75);
const wardrobeStation = new CustomizationStation(-240, -120);
const floorStation = new FloorSelectStation(240, -120);

// Ground loot items in world (trading & drops)
const groundItems = new Map();

// Spawn Batch 1 Anime Demo Sets across the lobby!
const batch1Loot = [
  // Gojo items
  new GroundLoot(ITEM_CATALOG['gojo_blindfold'], -160, -40, 'loot_gojo_blindfold'),
  new GroundLoot(ITEM_CATALOG['gojo_tunic'], -120, -40, 'loot_gojo_tunic'),
  new GroundLoot(ITEM_CATALOG['gojo_slacks'], -80, -40, 'loot_gojo_slacks'),
  new GroundLoot(ITEM_CATALOG['gojo_loafers'], -40, -40, 'loot_gojo_loafers'),
  new GroundLoot(ITEM_CATALOG['lapse_blue'], 0, -40, 'loot_lapse_blue'),
  new GroundLoot(ITEM_CATALOG['reversal_red'], 40, -40, 'loot_reversal_red'),

  // Sukuna items
  new GroundLoot(ITEM_CATALOG['sukuna_crown'], -160, 20, 'loot_sukuna_crown'),
  new GroundLoot(ITEM_CATALOG['sukuna_robe'], -120, 20, 'loot_sukuna_robe'),
  new GroundLoot(ITEM_CATALOG['sukuna_hakama'], -80, 20, 'loot_sukuna_hakama'),
  new GroundLoot(ITEM_CATALOG['sukuna_zori'], -40, 20, 'loot_sukuna_zori'),
  new GroundLoot(ITEM_CATALOG['sukuna_kamutoke'], 0, 20, 'loot_sukuna_kamutoke'),
  new GroundLoot(ITEM_CATALOG['sukuna_cleaver'], 40, 20, 'loot_sukuna_cleaver'),

  // Toji items
  new GroundLoot(ITEM_CATALOG['toji_worm'], 100, -40, 'loot_toji_worm'),
  new GroundLoot(ITEM_CATALOG['toji_shirt'], 140, -40, 'loot_toji_shirt'),
  new GroundLoot(ITEM_CATALOG['toji_pants'], 180, -40, 'loot_toji_pants'),
  new GroundLoot(ITEM_CATALOG['toji_slippers'], 220, -40, 'loot_toji_slippers'),
  new GroundLoot(ITEM_CATALOG['inverted_spear_chain'], 260, -40, 'loot_inverted_spear_chain'),

  // Guts items
  new GroundLoot(ITEM_CATALOG['guts_beast_helm'], 100, 20, 'loot_guts_beast_helm'),
  new GroundLoot(ITEM_CATALOG['guts_berserker_plate'], 140, 20, 'loot_guts_berserker_plate'),
  new GroundLoot(ITEM_CATALOG['guts_greaves'], 180, 20, 'loot_guts_greaves'),
  new GroundLoot(ITEM_CATALOG['guts_sollerets'], 220, 20, 'loot_guts_sollerets'),
  new GroundLoot(ITEM_CATALOG['dragon_slayer'], 260, 20, 'loot_dragon_slayer'),

  // Levi items (Attack on Titan)
  new GroundLoot(ITEM_CATALOG['scout_hood'], -160, 80, 'loot_scout_hood'),
  new GroundLoot(ITEM_CATALOG['odm_harness'], -120, 80, 'loot_odm_harness'),
  new GroundLoot(ITEM_CATALOG['scout_trousers'], -80, 80, 'loot_scout_trousers'),
  new GroundLoot(ITEM_CATALOG['scout_boots'], -40, 80, 'loot_scout_boots'),
  new GroundLoot(ITEM_CATALOG['dual_snap_blades'], 0, 80, 'loot_dual_snap_blades'),

  // David Martinez items (Cyberpunk: Edgerunners)
  new GroundLoot(ITEM_CATALOG['david_kiroshi'], 60, 80, 'loot_david_kiroshi'),
  new GroundLoot(ITEM_CATALOG['david_jacket'], 100, 80, 'loot_david_jacket'),
  new GroundLoot(ITEM_CATALOG['david_pants'], 140, 80, 'loot_david_pants'),
  new GroundLoot(ITEM_CATALOG['david_sneakers'], 180, 80, 'loot_david_sneakers'),
  new GroundLoot(ITEM_CATALOG['david_shotgun'], 220, 80, 'loot_david_shotgun'),
  new GroundLoot(ITEM_CATALOG['david_gorilla_arms'], 260, 80, 'loot_david_gorilla_arms')
];

batch1Loot.forEach((loot) => groundItems.set(loot.id, loot));

const dungeonBounds = { minX: -600, minY: -600, maxX: 600, maxY: 600 };

// Auto-initialize audio on user gesture
const unlockAudio = () => {
  audio.init();
};
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('mousedown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('click', unlockAudio, { passive: true });

// Floor Progression & Monster Management
let currentFloor = 0; // 0 = Safe Lobby Base Camp, 1+ = Procedural Dungeon Floors
let currentDungeon = null;
const monsterManager = new MonsterManager();

// Monster Death Callbacks
monsterManager.onMonsterKilled = (monster) => {
  const isCyber = monster.theme === 'cyberpunk' || (currentDungeon && currentDungeon.themeKey === 'cyberpunk');
  const isAot = monster.theme === 'aot' || (currentDungeon && currentDungeon.themeKey === 'aot');
  const isBoss = monster.archetype === 'boss';

  // Only spawn mob kill text if not the final boss (boss has dedicated onBossKilled banner)
  if (!isBoss) {
    let killText = 'EXORCISED! 💥';
    let killColor = '#c084fc';
    let burstColor = '#a855f7';
    if (isCyber) {
      killText = 'FLATLINED! ⚡';
      killColor = '#00f0ff';
      burstColor = '#06b6d4';
    } else if (isAot) {
      killText = 'TITAN SLAIN! ⚔️';
      killColor = '#22c55e';
      burstColor = '#16a34a';
    }
    particles.spawnComicText(monster.x, monster.y - 20, killText, killColor);
    particles.spawnDashBurst(monster.x, monster.y, 0, burstColor);
  }
  cinematics.addScreenShake(3);

  // 35% chance to drop a minor heal orb
  if (Math.random() < 0.35) {
    player.hp = Math.min(player.maxHp, player.hp + 15);
    particles.spawnComicText(player.x, player.y - 32, '+15 HP 💚', '#22c55e');
    player.syncHUD();
  }
};

function getAliveMonstersInChamber(room) {
  if (!room) return [];
  return monsterManager.monsters.filter(m => {
    if (!m || m.isDead || m.hp <= 0) return false;
    // Match by assigned roomId
    if (m.roomId === room.id) return true;
    // Also match if physically within chamber bounding box
    if (room.bounds &&
        m.x >= room.bounds.minX - 10 && m.x <= room.bounds.maxX + 10 &&
        m.y >= room.bounds.minY - 10 && m.y <= room.bounds.maxY + 10) {
      return true;
    }
    return false;
  });
}

monsterManager.onBossKilled = (boss) => {
  audio.playBossVictoryFanfare();
  cinematics.addScreenShake(18);
  let bossTitle = 'SPECIAL GRADE EXORCISED! 🏆';
  let bossColor = '#c084fc';
  if (currentDungeon && currentDungeon.themeKey === 'cyberpunk') {
    bossTitle = 'CHROME TITAN FLATLINED! 🏆';
    bossColor = '#00f0ff';
  } else if (currentDungeon && currentDungeon.themeKey === 'aot') {
    bossTitle = 'ARMORED TITAN VANQUISHED! 🏆';
    bossColor = '#22c55e';
  }
  particles.spawnComicText(boss.x, boss.y - 40, bossTitle, bossColor);

  if (currentDungeon) {
    // Drop fountain of diverse Mythic / Legendary anime loot!
    const bossLoot = [];
    const excludedIds = [];
    for (let b = 0; b < 3; b++) {
      const item = getRandomDungeonLoot(currentDungeon.themeKey, {
        minRarity: 'LEGENDARY',
        guaranteeTheme: true,
        excludeIds: excludedIds
      });
      if (item) {
        bossLoot.push(item);
        excludedIds.push(item.id);
      }
    }

    bossLoot.forEach((item, idx) => {
      if (!item) return;
      const dropAngle = (idx / bossLoot.length) * Math.PI * 2;
      const lx = boss.x + Math.cos(dropAngle) * 55;
      const ly = boss.y + Math.sin(dropAngle) * 55;
      const lootObj = new GroundLoot(item, lx, ly, `boss_drop_${idx}_${Date.now()}`);
      groundItems.set(lootObj.id, lootObj);
    });

    // Check if all escorts in the boss chamber are also defeated
    const remainingInBossRoom = getAliveMonstersInChamber(currentDungeon.bossRoom);
    if (remainingInBossRoom.length === 0) {
      currentDungeon.bossRoom.isLocked = false;
      currentDungeon.bossRoom.isCleared = true;
      if (currentDungeon.exitPortal) {
        currentDungeon.exitPortal.isActive = true;
      }
      let clearTitle = 'SPECIAL GRADE EXORCISED!';
      if (currentDungeon.themeKey === 'cyberpunk') clearTitle = 'CHROME TITAN FLATLINED!';
      else if (currentDungeon.themeKey === 'aot') clearTitle = 'ARMORED TITAN VANQUISHED!';
      currentDungeon.activeBanner = {
        title: clearTitle,
        subtitle: 'ALL FOES DEFEATED • DESCENT PORTAL UNLOCKED',
        color: '#00ff88',
        timer: 4.5,
        maxTimer: 4.5
      };
    } else {
      let pendingTitle = 'BOSS EXORCISED!';
      if (currentDungeon.themeKey === 'cyberpunk') pendingTitle = 'TITAN FLATLINED!';
      else if (currentDungeon.themeKey === 'aot') pendingTitle = 'ARMORED TITAN DOWN!';
      currentDungeon.activeBanner = {
        title: pendingTitle,
        subtitle: `ELIMINATE REMAINING GUARDS (${remainingInBossRoom.length} REMAINING)`,
        color: '#f59e0b',
        timer: 3.5,
        maxTimer: 3.5
      };
    }
  }
};

function applyDamageToTarget(target, damage, angle, knockback, sourceLabel, color) {
  if (!target) return;
  if (target === player) {
    const res = player.takeDamage(damage, angle, knockback);
    if (res) {
      const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : sourceLabel);
      particles.spawnComicText(player.x, player.y - 20, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : color));
      broadcastMyState();
    }
  } else if (typeof target.takeDamage === 'function') {
    target.takeDamage(damage, angle, knockback);
    particles.spawnComicText(target.x, target.y - 20, sourceLabel, color);
  } else if (typeof target.takeHit === 'function') {
    target.takeHit(damage, angle, knockback);
    particles.spawnComicText(target.x, target.y - 20, sourceLabel, color);
  } else {
    // Check if remote peer
    for (const [peerId, remote] of network.remotePlayers.entries()) {
      if (remote === target) {
        const kx = Math.cos(angle) * knockback;
        const ky = Math.sin(angle) * knockback;
        const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
        if (network.isHost) network.broadcast(slapMsg);
        else network.sendToHost(slapMsg);
        particles.spawnComicText(remote.x, remote.y - 20, sourceLabel, color);
        break;
      }
    }
  }
}

function spawnRoomReward(room) {
  if (!room) return;
  particles.spawnDashBurst(room.centerX, room.centerY, 0, '#00ff88');

  // Spawn diverse, theme-appropriate room clear reward directly on the ground (no obstacle pots!)
  const roomLoot = getRandomDungeonLoot(currentDungeon ? currentDungeon.themeKey : 'jjk', {
    minRarity: 'RARE'
  });

  if (roomLoot) {
    const lootObj = new GroundLoot(roomLoot, room.centerX, room.centerY, `room_reward_${room.id}_${Date.now()}`);
    groundItems.set(lootObj.id, lootObj);
    particles.spawnComicText(room.centerX, room.centerY - 24, `${roomLoot.name.toUpperCase()}! 🎁`, '#00ff88');

    // 45% chance of a second diverse drop
    if (Math.random() < 0.45) {
      const extraLoot = getRandomDungeonLoot(currentDungeon ? currentDungeon.themeKey : 'jjk', {
        excludeIds: [roomLoot.id]
      });
      if (extraLoot) {
        const lootObj2 = new GroundLoot(extraLoot, room.centerX + 36, room.centerY, `extra_reward_${room.id}_${Date.now()}`);
        groundItems.set(lootObj2.id, lootObj2);
      }
    }
  }
}

function populateFloorMonsters(dungeon) {
  monsterManager.clear();
  const theme = dungeon.themeKey;

  // In each combat chamber, spawn a squad of 7 to 10 theme-specific anime mobs!
  for (let i = 0; i < dungeon.combatRooms.length; i++) {
    const room = dungeon.combatRooms[i];
    const mobCount = 7 + Math.floor(Math.random() * 4); // 7 to 10 mobs per chamber

    for (let m = 0; m < mobCount; m++) {
      const offsetX = (Math.random() - 0.5) * (room.width - 400);
      const offsetY = (Math.random() - 0.5) * (room.height - 300);
      const spawnX = room.centerX + offsetX;
      const spawnY = room.centerY + offsetY;

      let monsterType = 'fly_head';
      let archetype = 'swarmer';
      let hp = 45;
      let radius = 18;
      let speed = 165;
      let name = 'Fly Head Cursed Spirit';

      if (theme === 'cyberpunk') {
        if (m === 0) {
          // 1 Heavy Brute per chamber
          monsterType = 'maelstrom_cyberpsycho';
          archetype = 'brute';
          hp = 250;
          radius = 28;
          speed = 85;
          name = 'Maelstrom Cyberpsycho';
        } else if (m === 1 || m === 2) {
          // 2 Ranged Snipers per chamber
          monsterType = 'tyger_claw_sniper';
          archetype = 'ranged';
          hp = 75;
          radius = 20;
          speed = 115;
          name = 'Tyger Claw Cyber-Gunner';
        } else {
          // Swarmers
          monsterType = 'arasaka_drone';
          archetype = 'swarmer';
          hp = 42;
          radius = 18;
          speed = 175;
          name = 'Arasaka Security Drone';
        }
      } else if (theme === 'aot') {
        if (m === 0) {
          // 1 Heavy Hardened Titan per chamber
          monsterType = 'hardened_brute';
          archetype = 'brute';
          hp = 270;
          radius = 30;
          speed = 80;
          name = 'Hardened Fist Titan';
        } else if (m === 1 || m === 2) {
          // 2 Marleyan Snipers per chamber
          monsterType = 'marleyan_rifleman';
          archetype = 'ranged';
          hp = 75;
          radius = 20;
          speed = 110;
          name = 'Marleyan Heavy Rifleman';
        } else {
          // Pure Titan Swarmers
          monsterType = 'crawler_titan';
          archetype = 'swarmer';
          hp = 44;
          radius = 18;
          speed = 185;
          name = 'Pure Titan Crawler';
        }
      } else {
        // Default JJK Theme
        if (m === 0) {
          // 1 Heavy Brute per chamber
          monsterType = 'cursed_brute';
          archetype = 'brute';
          hp = 240;
          radius = 28;
          speed = 80;
          name = 'Cursed Womb Brute';
        } else if (m === 1 || m === 2) {
          // 2 Ranged Snipers per chamber
          monsterType = 'masked_ino';
          archetype = 'ranged';
          hp = 70;
          radius = 20;
          speed = 120;
          name = 'Masked Ino Cursed Spirit';
        }
      }

      const monster = new Monster({
        id: `mob_${room.id}_${m}_${Date.now()}`,
        type: monsterType,
        name,
        theme,
        archetype,
        x: spawnX,
        y: spawnY,
        hp,
        radius,
        speed,
        roomId: room.id,
        isActive: false // Awakens only when player enters this chamber!
      });

      if (archetype === 'swarmer') {
        monster.onAttack = (target) => {
          if (theme === 'cyberpunk') {
            audio.playDroneHum();
            applyDamageToTarget(target, 11, monster.angle, 140, '-11 (LASER TAZER)', '#06b6d4');
          } else if (theme === 'aot') {
            audio.playTitanThud();
            applyDamageToTarget(target, 12, monster.angle, 150, '-12 (TITAN BITE)', '#22c55e');
          } else {
            audio.playFlyHeadBuzz();
            applyDamageToTarget(target, 12, monster.angle, 160, '-12 (CURSE BITE)', '#c084fc');
          }
        };
      } else if (archetype === 'ranged') {
        monster.onRangedAttack = (target) => {
          if (theme === 'cyberpunk') {
            audio.playLaserShot();
            cinematics.spawnProjectile({
              type: 'bot_laser_bolt',
              x: monster.x,
              y: monster.y,
              vx: Math.cos(monster.angle) * 340,
              vy: Math.sin(monster.angle) * 340,
              damage: 20,
              caster: monster,
              color: '#06b6d4',
              radius: 10,
              life: 2.0,
              maxDist: 520
            });
            particles.spawnComicText(monster.x, monster.y - 24, 'LASER BOLT!', '#06b6d4');
          } else if (theme === 'aot') {
            audio.playLaserShot();
            cinematics.spawnProjectile({
              type: 'bot_laser_bolt',
              x: monster.x,
              y: monster.y,
              vx: Math.cos(monster.angle) * 370,
              vy: Math.sin(monster.angle) * 370,
              damage: 22,
              caster: monster,
              color: '#ef4444',
              radius: 9,
              life: 2.2,
              maxDist: 580
            });
            particles.spawnComicText(monster.x, monster.y - 24, 'SNIPER ROUND!', '#ef4444');
          } else {
            audio.playFlyHeadBuzz();
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: monster.x,
              y: monster.y,
              vx: Math.cos(monster.angle) * 220,
              vy: Math.sin(monster.angle) * 220,
              damage: 18,
              caster: monster,
              color: '#a855f7',
              radius: 9,
              life: 2.5,
              maxDist: 450
            });
            particles.spawnComicText(monster.x, monster.y - 24, 'CURSE ORB!', '#c084fc');
          }
        };
      } else if (archetype === 'brute') {
        monster.onBruteSlam = (target) => {
          if (theme === 'cyberpunk') {
            audio.playCyberSlam();
            cinematics.addScreenShake(10);
            particles.spawnDashBurst(monster.x, monster.y, 0, '#ef4444');
            particles.spawnComicText(monster.x, monster.y - 30, 'GORILLA SMASH! ⚡', '#06b6d4');
            if (target) {
              const dist = Math.hypot(target.x - monster.x, target.y - monster.y);
              if (dist <= monster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 40, monster.angle, 540, '-40 GORILLA SLAM!', '#06b6d4');
              }
            }
          } else if (theme === 'aot') {
            audio.playTitanThud();
            audio.playArmorShatter();
            cinematics.addScreenShake(11);
            particles.spawnDashBurst(monster.x, monster.y, 0, '#38bdf8');
            particles.spawnComicText(monster.x, monster.y - 30, 'CRYSTAL SMASH! 💎', '#38bdf8');
            if (target) {
              const dist = Math.hypot(target.x - monster.x, target.y - monster.y);
              if (dist <= monster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 42, monster.angle, 560, '-42 CRYSTAL SMASH!', '#38bdf8');
              }
            }
          } else {
            audio.playHammerSmash();
            cinematics.addScreenShake(9);
            particles.spawnDashBurst(monster.x, monster.y, 0, '#f97316');
            particles.spawnComicText(monster.x, monster.y - 30, 'EARTH SLAM! 💥', '#f97316');
            if (target) {
              const dist = Math.hypot(target.x - monster.x, target.y - monster.y);
              if (dist <= monster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 38, monster.angle, 520, '-38 SLAM!', '#f97316');
              }
            }
          }
        };
      }

      monsterManager.addMonster(monster);
    }
  }

  // In Boss Sanctum, spawn the Floor Guardian Boss + Elite Escorts!
  if (dungeon.bossRoom) {
    if (theme === 'cyberpunk') {
      const boss = new Monster({
        id: `boss_fl${dungeon.floorNumber}_${Date.now()}`,
        type: 'adam_smasher_prototype',
        name: 'Adam Smasher Prototype',
        theme,
        archetype: 'boss',
        x: dungeon.bossRoom.centerX,
        y: dungeon.bossRoom.centerY - 50,
        hp: 1200,
        radius: 48,
        speed: 75,
        roomId: dungeon.bossRoom.id,
        isActive: false // Dormant until player enters Boss Sanctum!
      });

      boss.onPhase2Trigger = (b) => {
        audio.playEnrageRoar();
        cinematics.addScreenShake(18);
        particles.spawnComicText(b.x, b.y - 50, 'PHASE 2: SANDEVISTAN OVERCLOCK! ⚡', '#00ff88');
        particles.spawnDashBurst(b.x, b.y, 0, '#00ff88');
      };

      boss.onBossStartDying = (b) => {
        audio.playCoreOverload();
        cinematics.addScreenShake(16);
        particles.spawnComicText(b.x, b.y - 45, 'CRITICAL OVERLOAD: CORE MELTDOWN! 💥', '#ff003c');
      };

      // Boss Windup Telegraph Callbacks
      boss.onBossWindup = (attackIndex, phase, duration) => {
        if (attackIndex === 1) {
          const text = phase === 2 ? '⚡ SANDEVISTAN BLINK SLAM! 🚨' : '⚠️ HYDRAULIC SLAM WINDUP!';
          const col = phase === 2 ? '#00ff88' : '#f59e0b';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 2) {
          const text = phase === 2 ? '🚀 FULL SALVO 8-MISSILE LOCK! 💥' : '⚠️ MICRO-MISSILE LOCK! 🚀';
          const col = phase === 2 ? '#ff003c' : '#ef4444';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 3) {
          const text = phase === 2 ? '⚡ LASER SWEEP ARRAY! ⚡' : '⚠️ ROTARY CANNON SPOOLING! ⚙️';
          const col = phase === 2 ? '#00f0ff' : '#06b6d4';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        }
      };

      // Attack 1: Melee / Slam (Phase 1: Chrome Heavy Slam -> Phase 2: Sandevistan Blink Slam)
      boss.onBossAttack1 = (target, phase) => {
        if (phase === 2) {
          // Phase 2 Upgraded: Blink dash right beside target followed by supersonic impact slam!
          if (target) {
            boss.x = target.x + Math.cos(boss.angle + Math.PI) * 60;
            boss.y = target.y + Math.sin(boss.angle + Math.PI) * 60;
          }
          audio.playCyberSlam();
          cinematics.addScreenShake(16);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#00ff88');
          applyDamageToTarget(target, 48, boss.angle, 600, '-48 SUPERSONIC BLINK SLAM! ⚡', '#00ff88');
        } else {
          // Phase 1: Heavy Chrome Slam
          audio.playCyberSlam();
          cinematics.addScreenShake(8);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#ef4444');
          applyDamageToTarget(target, 32, boss.angle, 450, '-32 CHROME SLAM!', '#ef4444');
        }
      };

      // Attack 2: Missile Artillery (Phase 1: 4 Micro-Missiles -> Phase 2: 8 Full Salvo Apocalypse)
      boss.onBossAttack2 = (target, phase) => {
        audio.playMissileLaunch();
        if (phase === 2) {
          // Phase 2 Upgraded: 8-Missile Full Salvo Apocalypse
          cinematics.addScreenShake(16);
          particles.spawnComicText(boss.x, boss.y - 50, 'FULL SALVO APOCALYPSE! 🚀💥', '#ff003c');
          for (let f = 0; f < 8; f++) {
            const spreadAngle = boss.angle + (f - 3.5) * 0.28;
            cinematics.spawnProjectile({
              type: 'bot_micro_missile',
              x: boss.x + Math.cos(spreadAngle) * 32,
              y: boss.y + Math.sin(spreadAngle) * 32,
              vx: Math.cos(spreadAngle) * 350,
              vy: Math.sin(spreadAngle) * 350,
              damage: 32,
              caster: boss,
              color: '#ff003c',
              radius: 12,
              life: 3.2,
              maxDist: 900
            });
          }
        } else {
          // Phase 1: 4 Micro-Missile Barrage
          cinematics.addScreenShake(10);
          particles.spawnComicText(boss.x, boss.y - 50, 'MICRO-MISSILE BARRAGE! 🚀', '#f59e0b');
          for (let f = -1.5; f <= 1.5; f += 1) {
            const spreadAngle = boss.angle + f * 0.22;
            cinematics.spawnProjectile({
              type: 'bot_micro_missile',
              x: boss.x + Math.cos(spreadAngle) * 30,
              y: boss.y + Math.sin(spreadAngle) * 30,
              vx: Math.cos(spreadAngle) * 310,
              vy: Math.sin(spreadAngle) * 310,
              damage: 26,
              caster: boss,
              color: '#ef4444',
              radius: 12,
              life: 3.0,
              maxDist: 850
            });
          }
        }
      };

      // Attack 3: Kinetic Cannon / Laser Sweep (Phase 1: 3-Burst -> Phase 2: 6-Bolt Laser Sweep Array)
      boss.onBossAttack3 = (target, phase) => {
        if (phase === 2) {
          // Phase 2 Upgraded: 6-Bolt High-Density Laser Sweep Array
          cinematics.addScreenShake(12);
          particles.spawnComicText(boss.x, boss.y - 50, 'LASER SWEEP ARRAY! ⚡', '#00f0ff');
          for (let b = 0; b < 6; b++) {
            const sweepAngle = boss.angle + (b - 2.5) * 0.16;
            audio.playLaserShot();
            cinematics.spawnProjectile({
              type: 'bot_laser_bolt',
              x: boss.x + Math.cos(sweepAngle) * 28,
              y: boss.y + Math.sin(sweepAngle) * 28,
              vx: Math.cos(sweepAngle) * 480,
              vy: Math.sin(sweepAngle) * 480,
              damage: 28,
              caster: boss,
              color: '#00f0ff',
              radius: 9,
              life: 2.2,
              maxDist: 800
            });
          }
        } else {
          // Phase 1: 3-Round Kinetic Gatling Burst
          cinematics.addScreenShake(6);
          particles.spawnComicText(boss.x, boss.y - 50, 'ROTARY BURST! ⚙️', '#06b6d4');
          for (let b = -1; b <= 1; b++) {
            const boltAngle = boss.angle + b * 0.1;
            audio.playLaserShot();
            cinematics.spawnProjectile({
              type: 'bot_laser_bolt',
              x: boss.x + Math.cos(boltAngle) * 26,
              y: boss.y + Math.sin(boltAngle) * 26,
              vx: Math.cos(boltAngle) * 430,
              vy: Math.sin(boltAngle) * 430,
              damage: 20,
              caster: boss,
              color: '#06b6d4',
              radius: 8,
              life: 2.0,
              maxDist: 750
            });
          }
        }
      };

      monsterManager.addMonster(boss);

      // Spawn 3 Elite Escort guards with Adam Smasher (1 Cyberpsycho, 2 Drones)
      const escorts = [
        { type: 'maelstrom_cyberpsycho', archetype: 'brute', hp: 270, radius: 28, speed: 85, ox: -160, oy: 60, name: 'Cyberpsycho Vanguard' },
        { type: 'arasaka_drone', archetype: 'swarmer', hp: 50, radius: 18, speed: 180, ox: 160, oy: -80, name: 'Arasaka Escort Drone' },
        { type: 'arasaka_drone', archetype: 'swarmer', hp: 50, radius: 18, speed: 180, ox: -160, oy: -80, name: 'Arasaka Escort Drone' }
      ];

      for (let e = 0; e < escorts.length; e++) {
        const esc = escorts[e];
        const escortMonster = new Monster({
          id: `boss_escort_${e}_${Date.now()}`,
          type: esc.type,
          name: esc.name,
          theme,
          archetype: esc.archetype,
          x: dungeon.bossRoom.centerX + esc.ox,
          y: dungeon.bossRoom.centerY + esc.oy,
          hp: esc.hp,
          radius: esc.radius,
          speed: esc.speed,
          roomId: dungeon.bossRoom.id,
          isActive: false
        });

        if (esc.archetype === 'swarmer') {
          escortMonster.onAttack = (target) => {
            audio.playDroneHum();
            applyDamageToTarget(target, 12, escortMonster.angle, 150, '-12 (LASER TAZER)', '#06b6d4');
          };
        } else if (esc.archetype === 'brute') {
          escortMonster.onBruteSlam = (target) => {
            audio.playCyberSlam();
            cinematics.addScreenShake(9);
            particles.spawnDashBurst(escortMonster.x, escortMonster.y, 0, '#ef4444');
            if (target) {
              applyDamageToTarget(target, 36, escortMonster.angle, 500, '-36 GORILLA SLAM!', '#06b6d4');
            }
          };
        }

        monsterManager.addMonster(escortMonster);
      }
    } else if (theme === 'aot') {
      // Floor 3 Boss: Armored Titan (Reiner Braun Prototype)
      const boss = new Monster({
        id: `boss_fl${dungeon.floorNumber}_${Date.now()}`,
        type: 'armored_titan',
        name: 'Armored Titan (Reiner Braun Prototype)',
        theme,
        archetype: 'boss',
        x: dungeon.bossRoom.centerX,
        y: dungeon.bossRoom.centerY - 50,
        hp: 1450,
        radius: 52,
        speed: 75,
        deathType: 'titan_evaporate',
        roomId: dungeon.bossRoom.id,
        isActive: false // Dormant until player enters Boss Sanctum!
      });

      boss.onPhase2Trigger = (b) => {
        audio.playEnrageRoar();
        audio.playTitanRoar();
        cinematics.addScreenShake(20);
        particles.spawnComicText(b.x, b.y - 50, 'PHASE 2: ARMOR SHED & UNSTOPPABLE BLITZ! ⚠️', '#eab308');
        particles.spawnDashBurst(b.x, b.y, 0, '#f59e0b');
      };

      boss.onBossStartDying = (b) => {
        audio.playArmorShatter();
        audio.playSteamHiss();
        cinematics.addScreenShake(16);
        particles.spawnComicText(b.x, b.y - 45, 'TITAN EVAPORATION... 💨', '#e2e8f0');
      };

      // Boss Windup Telegraph Callbacks
      boss.onBossWindup = (attackIndex, phase, duration) => {
        if (attackIndex === 1) {
          const text = phase === 2 ? '⚡ DUAL CRYSTAL CROSS-SMASH! 💥' : '⚠️ HARDENED IRON FIST!';
          const col = phase === 2 ? '#eab308' : '#f59e0b';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 2) {
          const text = phase === 2 ? '⚡ SUPERSONIC WALL BLITZ! 💨' : '⚠️ BULL RUSH TACKLE! 💥';
          const col = phase === 2 ? '#f97316' : '#ea580c';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 3) {
          const text = phase === 2 ? '🔥 TITAN ROAR & STEAM WAVE! 🌊' : '⚠️ SCALDING STEAM VENT! 💨';
          const col = phase === 2 ? '#ef4444' : '#fde047';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        }
      };

      // Attack 1: Melee / Fists (Phase 1: Hardened Fist -> Phase 2: Dual Crystal Cross-Smash)
      boss.onBossAttack1 = (target, phase) => {
        if (phase === 2) {
          audio.playTitanThud();
          audio.playArmorShatter();
          cinematics.addScreenShake(16);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#fde047');
          applyDamageToTarget(target, 52, boss.angle, 650, '-52 DUAL CRYSTAL CROSS-SMASH! 💥', '#fde047');
        } else {
          audio.playTitanThud();
          cinematics.addScreenShake(9);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#f59e0b');
          applyDamageToTarget(target, 34, boss.angle, 460, '-34 HARDENED FIST!', '#f59e0b');
        }
      };

      // Attack 2: Charge / Bull Rush (Phase 1: Bull Rush -> Phase 2: Supersonic Wall Blitz)
      boss.onBossAttack2 = (target, phase) => {
        audio.playTitanThud();
        if (phase === 2) {
          boss.vx = Math.cos(boss.angle) * 440;
          boss.vy = Math.sin(boss.angle) * 440;
          cinematics.addScreenShake(18);
          particles.spawnComicText(boss.x, boss.y - 50, 'SUPERSONIC WALL BLITZ! 💨', '#f97316');
          for (let f = 0; f < 4; f++) {
            const spreadAngle = boss.angle + (f - 1.5) * 0.28;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(spreadAngle) * 32,
              y: boss.y + Math.sin(spreadAngle) * 32,
              vx: Math.cos(spreadAngle) * 360,
              vy: Math.sin(spreadAngle) * 360,
              damage: 36,
              caster: boss,
              color: '#d97706',
              radius: 14,
              life: 2.8,
              maxDist: 850
            });
          }
          if (target) {
            applyDamageToTarget(target, 48, boss.angle, 700, '-48 BLITZ CRASH!', '#f97316');
          }
        } else {
          boss.vx = Math.cos(boss.angle) * 320;
          boss.vy = Math.sin(boss.angle) * 320;
          cinematics.addScreenShake(12);
          particles.spawnComicText(boss.x, boss.y - 50, 'BULL RUSH! 💥', '#ea580c');
          for (let f = -1; f <= 1; f += 2) {
            const spreadAngle = boss.angle + f * 0.22;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(spreadAngle) * 30,
              y: boss.y + Math.sin(spreadAngle) * 30,
              vx: Math.cos(spreadAngle) * 310,
              vy: Math.sin(spreadAngle) * 310,
              damage: 28,
              caster: boss,
              color: '#b45309',
              radius: 12,
              life: 2.5,
              maxDist: 750
            });
          }
          if (target) {
            applyDamageToTarget(target, 36, boss.angle, 550, '-36 TACKLE SLAM!', '#ea580c');
          }
        }
      };

      // Attack 3: AoE / Steam (Phase 1: Steam Vent -> Phase 2: Roar & 8-Direction Steam Wave)
      boss.onBossAttack3 = (target, phase) => {
        if (phase === 2) {
          audio.playTitanRoar();
          audio.playSteamHiss();
          cinematics.addScreenShake(18);
          particles.spawnComicText(boss.x, boss.y - 50, 'TITAN ROAR & STEAM WAVE! 🌊', '#fde047');
          for (let k = 0; k < 8; k++) {
            const kAngle = (k / 8) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 32,
              y: boss.y + Math.sin(kAngle) * 32,
              vx: Math.cos(kAngle) * 320,
              vy: Math.sin(kAngle) * 320,
              damage: 36,
              caster: boss,
              color: '#fef08a',
              radius: 16,
              life: 2.6,
              maxDist: 800
            });
          }
        } else {
          audio.playSteamHiss();
          cinematics.addScreenShake(9);
          particles.spawnComicText(boss.x, boss.y - 50, 'SCALDING STEAM VENT! 💨', '#e2e8f0');
          for (let k = 0; k < 4; k++) {
            const kAngle = (k / 4) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 28,
              y: boss.y + Math.sin(kAngle) * 28,
              vx: Math.cos(kAngle) * 270,
              vy: Math.sin(kAngle) * 270,
              damage: 26,
              caster: boss,
              color: '#e2e8f0',
              radius: 14,
              life: 2.2,
              maxDist: 600
            });
          }
        }
      };

      monsterManager.addMonster(boss);

      // Spawn 3 Elite Escort guards with Armored Titan (1 Hardened Brute, 2 Marleyan Riflemen)
      const escorts = [
        { type: 'hardened_brute', archetype: 'brute', hp: 280, radius: 30, speed: 85, ox: -160, oy: 60, name: 'Armored Vanguard Titan' },
        { type: 'marleyan_rifleman', archetype: 'ranged', hp: 85, radius: 20, speed: 115, ox: 160, oy: -80, name: 'Marleyan Elite Sniper' },
        { type: 'marleyan_rifleman', archetype: 'ranged', hp: 85, radius: 20, speed: 115, ox: -160, oy: -80, name: 'Marleyan Elite Sniper' }
      ];

      for (let e = 0; e < escorts.length; e++) {
        const esc = escorts[e];
        const escortMonster = new Monster({
          id: `boss_escort_${e}_${Date.now()}`,
          type: esc.type,
          name: esc.name,
          theme,
          archetype: esc.archetype,
          x: dungeon.bossRoom.centerX + esc.ox,
          y: dungeon.bossRoom.centerY + esc.oy,
          hp: esc.hp,
          radius: esc.radius,
          speed: esc.speed,
          roomId: dungeon.bossRoom.id,
          isActive: false
        });

        if (esc.archetype === 'ranged') {
          escortMonster.onRangedAttack = (target) => {
            audio.playLaserShot();
            cinematics.spawnProjectile({
              type: 'bot_laser_bolt',
              x: escortMonster.x,
              y: escortMonster.y,
              vx: Math.cos(escortMonster.angle) * 370,
              vy: Math.sin(escortMonster.angle) * 370,
              damage: 22,
              caster: escortMonster,
              color: '#ef4444',
              radius: 9,
              life: 2.2,
              maxDist: 580
            });
            particles.spawnComicText(escortMonster.x, escortMonster.y - 24, 'SNIPER SHOT!', '#ef4444');
          };
        } else if (esc.archetype === 'brute') {
          escortMonster.onBruteSlam = (target) => {
            audio.playTitanThud();
            audio.playArmorShatter();
            cinematics.addScreenShake(10);
            particles.spawnDashBurst(escortMonster.x, escortMonster.y, 0, '#38bdf8');
            particles.spawnComicText(escortMonster.x, escortMonster.y - 30, 'CRYSTAL SMASH! 💎', '#38bdf8');
            if (target) {
              const dist = Math.hypot(target.x - escortMonster.x, target.y - escortMonster.y);
              if (dist <= escortMonster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 42, escortMonster.angle, 550, '-42 CRYSTAL SMASH!', '#38bdf8');
              }
            }
          };
        }

        monsterManager.addMonster(escortMonster);
      }
    } else {
      // Default JJK Boss: Special Grade Finger Bearer
      const boss = new Monster({
        id: `boss_fl${dungeon.floorNumber}_${Date.now()}`,
        type: 'finger_bearer',
        name: 'Special Grade: Finger Bearer',
        theme,
        archetype: 'boss',
        x: dungeon.bossRoom.centerX,
        y: dungeon.bossRoom.centerY - 50,
        hp: 950,
        radius: 46,
        speed: 95,
        roomId: dungeon.bossRoom.id,
        isActive: false // Dormant until player enters Boss Sanctum!
      });

      boss.onPhase2Trigger = (b) => {
        audio.playEnrageRoar();
        cinematics.addScreenShake(16);
        particles.spawnComicText(b.x, b.y - 50, 'PHASE 2: DOMAIN AWAKENING! ⚠️', '#c084fc');
        particles.spawnDashBurst(b.x, b.y, 0, '#a855f7');
      };

      boss.onBossStartDying = (b) => {
        audio.playCleaverSlash();
        cinematics.addScreenShake(12);
        particles.spawnComicText(b.x, b.y - 45, 'CURSE DISSOLUTION... 🌀', '#c084fc');
      };

      // Boss Windup Telegraph Callbacks
      boss.onBossWindup = (attackIndex, phase, duration) => {
        if (attackIndex === 1) {
          const text = phase === 2 ? '⚡ BLACK FLASH TWIN CLAWS! 🩸' : '⚠️ CURSE CLAW WINDUP!';
          const col = phase === 2 ? '#dc2626' : '#ef4444';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 2) {
          const text = phase === 2 ? '🌌 TRIPLE DIVERGENT BEAMS! ⚡' : '⚠️ CURSED BEAM CHARGING! ⚡';
          const col = phase === 2 ? '#9333ea' : '#c084fc';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 3) {
          const text = phase === 2 ? '🌀 DOMAIN MAELSTROM 12-ORB NOVA! 🌌' : '⚠️ 4-WAY CURSED SPIKE STOMP! 💥';
          const col = phase === 2 ? '#7e22ce' : '#a855f7';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        }
      };

      // Attack 1: Melee / Claws (Phase 1: Curse Claw Swipe -> Phase 2: Black Flash Twin-Claw Cross)
      boss.onBossAttack1 = (target, phase) => {
        if (phase === 2) {
          // Phase 2 Upgraded: Black Flash Twin-Claw Cross Strike
          audio.playBlackFlash();
          cinematics.addScreenShake(15);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#dc2626');
          particles.spawnComicText(boss.x, boss.y - 35, 'BLACK FLASH! ⚡🩸', '#000000');
          applyDamageToTarget(target, 46, boss.angle, 600, '-46 BLACK FLASH CROSS CLAW!', '#dc2626');
        } else {
          // Phase 1: Cursed Claw Swipe
          audio.playCleaverSlash();
          cinematics.addScreenShake(6);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#ef4444');
          applyDamageToTarget(target, 26, boss.angle, 420, '-26 CURSE CLAW!', '#ef4444');
        }
      };

      // Attack 2: Ranged Beams (Phase 1: Single Beam -> Phase 2: Triple Divergent Cursed Beams)
      boss.onBossAttack2 = (target, phase) => {
        audio.playCursedEnergyBeam();
        if (phase === 2) {
          // Phase 2 Upgraded: Triple Divergent Cursed Beams
          cinematics.addScreenShake(14);
          particles.spawnComicText(boss.x, boss.y - 50, 'TRIPLE DIVERGENT BEAMS! 🌌', '#9333ea');
          for (let b = -1; b <= 1; b++) {
            const beamAngle = boss.angle + b * 0.35;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(beamAngle) * 32,
              y: boss.y + Math.sin(beamAngle) * 32,
              vx: Math.cos(beamAngle) * 420,
              vy: Math.sin(beamAngle) * 420,
              damage: 42,
              caster: boss,
              color: '#9333ea',
              radius: 18,
              life: 2.6,
              maxDist: 850
            });
          }
        } else {
          // Phase 1: Single Focused Cursed Energy Beam
          cinematics.addScreenShake(8);
          particles.spawnComicText(boss.x, boss.y - 50, 'CURSED ENERGY BEAM! ⚡', '#c084fc');
          cinematics.spawnProjectile({
            type: 'bot_energy_orb',
            x: boss.x + Math.cos(boss.angle) * 30,
            y: boss.y + Math.sin(boss.angle) * 30,
            vx: Math.cos(boss.angle) * 370,
            vy: Math.sin(boss.angle) * 370,
            damage: 34,
            caster: boss,
            color: '#c084fc',
            radius: 18,
            life: 2.5,
            maxDist: 800
          });
        }
      };

      // Attack 3: Ground Stomp / AoE Nova (Phase 1: 4-Way Stomp -> Phase 2: Domain 12-Orb Maelstrom)
      boss.onBossAttack3 = (target, phase) => {
        if (phase === 2) {
          // Phase 2 Upgraded: Domain Expansion 12-Orb Omnidirectional Maelstrom
          audio.playDomainShockwave();
          cinematics.addScreenShake(18);
          particles.spawnComicText(boss.x, boss.y - 50, 'DOMAIN EXPANSION MAELSTROM! 🌌', '#7e22ce');
          for (let k = 0; k < 12; k++) {
            const kAngle = (k / 12) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 32,
              y: boss.y + Math.sin(kAngle) * 32,
              vx: Math.cos(kAngle) * 290,
              vy: Math.sin(kAngle) * 290,
              damage: 38,
              caster: boss,
              color: '#7e22ce',
              radius: 15,
              life: 2.8,
              maxDist: 750
            });
          }
        } else {
          // Phase 1: 4-Way Cursed Spike Ground Stomp
          audio.playCursedStomp();
          cinematics.addScreenShake(10);
          particles.spawnComicText(boss.x, boss.y - 50, 'CURSED SPIKE STOMP! 💥', '#a855f7');
          for (let k = 0; k < 4; k++) {
            const kAngle = (k / 4) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 28,
              y: boss.y + Math.sin(kAngle) * 28,
              vx: Math.cos(kAngle) * 250,
              vy: Math.sin(kAngle) * 250,
              damage: 28,
              caster: boss,
              color: '#a855f7',
              radius: 14,
              life: 2.2,
              maxDist: 550
            });
          }
        }
      };

      monsterManager.addMonster(boss);

      // Spawn 3 Elite Escort guards with the Boss (1 Brute, 2 Masked Inos)
      const escorts = [
        { type: 'cursed_brute', archetype: 'brute', hp: 260, radius: 28, speed: 85, ox: -160, oy: 60, name: 'Elite Womb Guard' },
        { type: 'masked_ino', archetype: 'ranged', hp: 80, radius: 20, speed: 125, ox: 160, oy: -80, name: 'Elite Ino Archer' },
        { type: 'masked_ino', archetype: 'ranged', hp: 80, radius: 20, speed: 125, ox: -160, oy: -80, name: 'Elite Ino Archer' }
      ];

      for (let e = 0; e < escorts.length; e++) {
        const esc = escorts[e];
        const escortMonster = new Monster({
          id: `boss_escort_${e}_${Date.now()}`,
          type: esc.type,
          name: esc.name,
          theme,
          archetype: esc.archetype,
          x: dungeon.bossRoom.centerX + esc.ox,
          y: dungeon.bossRoom.centerY + esc.oy,
          hp: esc.hp,
          radius: esc.radius,
          speed: esc.speed,
          roomId: dungeon.bossRoom.id,
          isActive: false
        });

        if (esc.archetype === 'ranged') {
          escortMonster.onRangedAttack = (target) => {
            audio.playFlyHeadBuzz();
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: escortMonster.x,
              y: escortMonster.y,
              vx: Math.cos(escortMonster.angle) * 240,
              vy: Math.sin(escortMonster.angle) * 240,
              damage: 22,
              caster: escortMonster,
              color: '#ef4444',
              radius: 10,
              life: 2.5,
              maxDist: 500
            });
          };
        } else if (esc.archetype === 'brute') {
          escortMonster.onBruteSlam = (target) => {
            audio.playHammerSmash();
            cinematics.addScreenShake(8);
            particles.spawnDashBurst(escortMonster.x, escortMonster.y, 0, '#ef4444');
            if (target) {
              applyDamageToTarget(target, 34, escortMonster.angle, 480, '-34 SLAM!', '#ef4444');
            }
          };
        }

        monsterManager.addMonster(escortMonster);
      }
    }
  }

  // In Treasure Vault, spawn theme-locked equipment across different slots!
  if (dungeon.treasureRoom) {
    const slots = ['weapon', 'chest', 'helmet', 'offhand'];
    const chosenItems = [];
    const usedIds = [];
    for (const s of slots) {
      const item = getRandomDungeonLoot(dungeon.themeKey, {
        slot: s,
        minRarity: 'EPIC',
        excludeIds: usedIds
      });
      if (item) {
        chosenItems.push(item);
        usedIds.push(item.id);
      }
    }
    chosenItems.forEach((item, idx) => {
      const lx = dungeon.treasureRoom.centerX + (idx - 1.5) * 48;
      const ly = dungeon.treasureRoom.centerY;
      const lootObj = new GroundLoot(item, lx, ly, `vault_loot_${idx}_${Date.now()}`);
      groundItems.set(lootObj.id, lootObj);
    });
  }
}

function startFloorDescent(floorNumber, broadcast = true) {
  currentFloor = floorNumber;
  audio.playDescentFanfare();
  cinematics.addScreenShake(10);

  // Dynamic Theme Cycling: Floor 1 = JJK, Floor 2 = Cyberpunk, Floor 3 = Attack on Titan, subsequent cycle
  const themePool = ['jjk', 'cyberpunk', 'aot'];
  const themeKey = themePool[(floorNumber - 1) % themePool.length];
  currentDungeon = new Dungeon({ floorNumber, theme: themeKey }).generate();

  // Teleport player to Spawn Room Center
  player.x = currentDungeon.spawnRoom.centerX;
  player.y = currentDungeon.spawnRoom.centerY;
  player.vx = 0;
  player.vy = 0;
  currentDungeon.currentRoom = currentDungeon.spawnRoom;
  currentDungeon.spawnRoom.hasVisited = true;
  currentDungeon.spawnRoom.isCleared = true;

  // Clear previous floor ground loot and spawn new floor content
  groundItems.clear();

  if (network.isHost || !network.isConnected) {
    populateFloorMonsters(currentDungeon);
  }

  // Update HUD Floor Text
  const hudFloor = document.getElementById('hud-floor');
  if (hudFloor) {
    hudFloor.textContent = `FLOOR ${currentFloor}: ${currentDungeon.theme.shortName}`;
    hudFloor.style.color = currentDungeon.theme.torchColor;
    hudFloor.style.textShadow = `0 0 15px ${currentDungeon.theme.torchColor}`;
  }

  // Broadcast floor generation to connected peers if host
  if (broadcast && network.isHost) {
    network.broadcast({
      type: 'DUNGEON_FLOOR_SYNC',
      floorNumber: currentFloor,
      dungeonData: currentDungeon.getSyncData()
    });
  }

  particles.spawnComicText(player.x, player.y - 40, `FLOOR ${currentFloor} - ${currentDungeon.theme.shortName}`, currentDungeon.theme.torchColor);
}

window.startFloorDescent = startFloorDescent;

readyCircle.onDescentTriggered = () => {
  startFloorDescent(1);
};

function returnToLobby(broadcast = true) {
  currentFloor = 0;
  currentDungeon = null;
  monsterManager.clear();
  groundItems.clear();

  // Re-spawn batch 1 demo gear in lobby
  batch1Loot.forEach((loot) => groundItems.set(loot.id, loot));

  player.x = 0;
  player.y = 0;
  player.vx = 0;
  player.vy = 0;

  const hudFloor = document.getElementById('hud-floor');
  if (hudFloor) {
    hudFloor.textContent = '0 (LOBBY)';
    hudFloor.style.color = '#38bdf8';
    hudFloor.style.textShadow = 'none';
  }

  audio.playDescentFanfare();
  particles.spawnComicText(player.x, player.y - 40, 'RETURNED TO BASE CAMP! 🏕️', '#38bdf8');

  if (broadcast && network.isHost) {
    network.broadcast({
      type: 'RETURN_TO_LOBBY'
    });
  }

  broadcastMyState();
}

window.returnToLobby = returnToLobby;

// --- FLOOR SELECTOR MODAL LOGIC ---
const floorModal = document.getElementById('floor-modal');
const btnFloorBadge = document.getElementById('btn-floor-badge');
const btnCloseFloorModal = document.getElementById('btn-close-floor-modal');

function openFloorModal() {
  if (floorModal) {
    floorModal.classList.remove('hidden');
    audio.playSwing();
  }
}

function closeFloorModal() {
  if (floorModal) {
    floorModal.classList.add('hidden');
    audio.playFootstep();
  }
}

function toggleFloorModal() {
  if (!floorModal) return;
  if (floorModal.classList.contains('hidden')) {
    openFloorModal();
  } else {
    closeFloorModal();
  }
}

window.openFloorModal = openFloorModal;
window.closeFloorModal = closeFloorModal;
window.toggleFloorModal = toggleFloorModal;

if (btnFloorBadge) {
  btnFloorBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFloorModal();
  });
}

if (btnCloseFloorModal) {
  btnCloseFloorModal.addEventListener('click', closeFloorModal);
}

document.querySelectorAll('.floor-warp-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetFloor = parseInt(btn.getAttribute('data-floor'), 10);
    closeFloorModal();
    if (targetFloor === 0) {
      returnToLobby(true);
    } else {
      startFloorDescent(targetFloor, true);
    }
  });
});

// --- INVENTORY UI & GROUND LOOT TRADING ---
const invModal = document.getElementById('inventory-modal');
const btnCloseInventory = document.getElementById('btn-close-inventory');
const backpackGrid = document.getElementById('backpack-grid');
const invCount = document.getElementById('inv-count');

function toggleInventory() {
  if (invModal.classList.contains('hidden')) {
    openInventory();
  } else {
    closeInventory();
  }
}

function openInventory() {
  invModal.classList.remove('hidden');
  renderInventoryUI();
  audio.playSwing();
}

function closeInventory() {
  invModal.classList.add('hidden');
  audio.playFootstep();
}

btnCloseInventory.addEventListener('click', closeInventory);

function renderInventoryUI() {
  // Check active set bonus
  const activeSet = checkSetBonus(player.equipment);
  const setBadge = document.getElementById('set-bonus-badge');
  if (setBadge) {
    if (activeSet) {
      setBadge.style.display = 'block';
      setBadge.style.background = `${activeSet.color}22`;
      setBadge.style.border = `1px solid ${activeSet.color}`;
      setBadge.style.color = activeSet.color;
      setBadge.innerHTML = `✨ SET BONUS ACTIVE: ${activeSet.name} — [Q] REPLACED WITH ${activeSet.ultimateQ.toUpperCase().replace(/_/g, ' ')}!`;
    } else {
      setBadge.style.display = 'none';
    }
  }

  // 1. Render 6 Equipment slots
  const slots = ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand'];
  slots.forEach((slot) => {
    const el = document.getElementById(`slot-${slot}`);
    if (!el) return;
    const item = player.equipment[slot];
    if (item) {
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      el.innerHTML = `
        <span style="color:${rarity.color}">${item.name}</span>
        <button class="item-action-btn unequip-btn" data-slot="${slot}">UNEQUIP</button>
      `;
    } else {
      el.innerHTML = `<span style="color:#64748b;font-weight:500;">(Empty)</span>`;
    }
  });

  // Attach unequip listeners
  document.querySelectorAll('.unequip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-slot');
      if (player.inventory.length >= player.maxInventorySize) {
        alert('Backpack is full!');
        return;
      }
      const unequipped = player.unequipSlot(slot);
      if (unequipped) {
        player.inventory.push(unequipped);
        audio.playSwing();
        renderInventoryUI();
        broadcastMyState();
      }
    });
  });

  // 2. Render Backpack items
  backpackGrid.innerHTML = '';
  invCount.textContent = player.inventory.length;

  if (player.inventory.length === 0) {
    backpackGrid.innerHTML = `<span style="grid-column: span 2; color:#64748b; padding:12px; font-size:0.8rem;">Your backpack is empty. Find loot on the ground!</span>`;
  }

  player.inventory.forEach((item, index) => {
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    const card = document.createElement('div');
    card.className = 'backpack-item-card';
    card.innerHTML = `
      <div>
        <strong style="color:${rarity.color}">${item.name}</strong>
        <div style="font-size:0.7rem; color:#94a3b8;">${item.desc || ''}</div>
      </div>
      <div class="backpack-actions">
        <button class="item-action-btn equip-item-btn" data-idx="${index}">EQUIP</button>
        <button class="item-action-btn drop-item-btn" style="border-color:#ef4444;" data-idx="${index}">DROP</button>
      </div>
    `;
    backpackGrid.appendChild(card);
  });

  // Equip listeners
  document.querySelectorAll('.equip-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      const item = player.inventory.splice(idx, 1)[0];
      if (item) {
        const displaced = player.equipItem(item);
        if (displaced && displaced.length > 0) {
          player.inventory.push(...displaced);
        }
        audio.playSwing();
        particles.spawnComicText(player.x, player.y - 28, `EQUIPPED!`, '#00ff88');
        renderInventoryUI();
        broadcastMyState();
      }
    });
  });

  // Drop listeners (Drops item onto dungeon ground for friends!)
  document.querySelectorAll('.drop-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      const item = player.inventory.splice(idx, 1)[0];
      if (item) {
        // Drop on ground slightly in front of player
        const dropX = player.x + Math.cos(player.angle) * 35;
        const dropY = player.y + Math.sin(player.angle) * 35;
        const newDrop = new GroundLoot(item, dropX, dropY);
        groundItems.set(newDrop.id, newDrop);

        // Sync drop to peers
        const dropMsg = {
          type: 'LOOT_SPAWNED',
          id: newDrop.id,
          item: newDrop.item,
          x: dropX,
          y: dropY
        };
        if (network.isHost) network.broadcast(dropMsg);
        else network.sendToHost(dropMsg);

        audio.playBonk();
        particles.spawnComicText(player.x, player.y - 28, `DROPPED!`, '#ffb800');
        renderInventoryUI();
        broadcastMyState();
      }
    });
  });
}

// Pick up nearby ground loot with [E]
function tryPickupNearbyLoot() {
  for (const [id, loot] of groundItems.entries()) {
    if (loot.isNear(player)) {
      if (player.inventory.length >= player.maxInventorySize) {
        particles.spawnComicText(player.x, player.y - 30, 'BACKPACK FULL!', '#ef4444');
        return;
      }

      // Add to inventory
      player.inventory.push(loot.item);
      groundItems.delete(id);

      // Sync pickup
      const pickupMsg = { type: 'LOOT_PICKED_UP', id };
      if (network.isHost) network.broadcast(pickupMsg);
      else network.sendToHost(pickupMsg);

      audio.playDescentFanfare();
      particles.spawnComicText(player.x, player.y - 28, `GOT ${loot.item.name}!`, '#fbbf24');
      if (!invModal.classList.contains('hidden')) renderInventoryUI();
      return;
    }
  }
}

// --- WARDROBE & DRESSING MIRROR LOGIC ---
const wardrobeModal = document.getElementById('wardrobe-modal');
const btnCloseWardrobe = document.getElementById('btn-close-wardrobe');
const wardrobePreviewCircle = document.getElementById('wardrobe-avatar-preview');
const inputPlayerName = document.getElementById('input-player-name');
const hudAvatar = document.getElementById('hud-avatar');
const hudPlayerName = document.getElementById('hud-player-name');

function openWardrobe() {
  wardrobeModal.classList.remove('hidden');
  inputPlayerName.focus();
  inputPlayerName.select();
  audio.playSwing();
}

function closeWardrobe() {
  wardrobeModal.classList.add('hidden');
  audio.playFootstep();
}

btnCloseWardrobe.addEventListener('click', closeWardrobe);

inputPlayerName.addEventListener('input', (e) => {
  player.name = e.target.value.trim() || 'SlopCrawler';
  hudPlayerName.textContent = player.name;
  broadcastMyState();
});

document.querySelectorAll('.color-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    player.color = btn.getAttribute('data-color');

    wardrobePreviewCircle.style.background = player.color;
    wardrobePreviewCircle.style.boxShadow = `0 0 16px ${player.color}`;
    hudAvatar.style.background = player.color;
    hudAvatar.style.boxShadow = `0 0 12px ${player.color}`;

    audio.playSwing();
    particles.spawnComicText(player.x, player.y - 20, 'DYE APPLIED!', player.color);
    broadcastMyState();
  });
});

// --- LOBBY CO-OP NETWORKING UI ---
const lobbyModal = document.getElementById('lobby-modal');
const btnOpenLobby = document.getElementById('btn-open-lobby');
const btnCloseLobby = document.getElementById('btn-close-lobby');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const inputRoomCode = document.getElementById('input-room-code');
const activeRoomBox = document.getElementById('lobby-active-room');
const displayRoomCode = document.getElementById('display-room-code');
const btnCopyLink = document.getElementById('btn-copy-link');
const partyCount = document.getElementById('party-count');
const partyRoster = document.getElementById('party-roster');
const hudNetworkStatus = document.getElementById('hud-network-status');

btnOpenLobby.addEventListener('click', () => lobbyModal.classList.remove('hidden'));
btnCloseLobby.addEventListener('click', () => lobbyModal.classList.add('hidden'));

function updatePartyRoster() {
  partyRoster.innerHTML = '';
  const myLi = document.createElement('li');
  myLi.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${player.color}"></span> ${player.name} (You) ${network.isHost ? '👑' : ''}`;
  partyRoster.appendChild(myLi);

  for (const [_, remote] of network.remotePlayers.entries()) {
    const li = document.createElement('li');
    li.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${remote.color || '#fff'}"></span> ${remote.name || 'Friend'}`;
    partyRoster.appendChild(li);
  }

  partyCount.textContent = network.remotePlayers.size + 1;
}

btnCreateRoom.addEventListener('click', async () => {
  btnCreateRoom.disabled = true;
  btnCreateRoom.textContent = 'CREATING...';
  try {
    const code = await network.createRoom();
    displayRoomCode.textContent = code;
    activeRoomBox.classList.remove('hidden');
    hudNetworkStatus.textContent = `HOST [${code}]`;
    updatePartyRoster();
  } catch (err) {
    alert('Failed to host room: ' + err.message);
  } finally {
    btnCreateRoom.disabled = false;
    btnCreateRoom.textContent = 'CREATE ROOM (HOST)';
  }
});

btnJoinRoom.addEventListener('click', async () => {
  const code = inputRoomCode.value.trim();
  if (!code) return alert('Please enter a room code (e.g. SLOP-XXXX)');

  btnJoinRoom.disabled = true;
  btnJoinRoom.textContent = 'JOINING...';
  try {
    await network.joinRoom(code);
    displayRoomCode.textContent = code;
    activeRoomBox.classList.remove('hidden');
    hudNetworkStatus.textContent = `CO-OP [${code}]`;
    updatePartyRoster();
    broadcastMyState();

    // Immediately request authoritative room loot & state sync from host
    network.sendToHost({
      type: 'REQUEST_ROOM_SYNC',
      peerId: network.myPeerId
    });
    setTimeout(() => {
      if (!network.isHost && network.connections.size > 0) {
        network.sendToHost({
          type: 'REQUEST_ROOM_SYNC',
          peerId: network.myPeerId
        });
      }
    }, 350);
  } catch (err) {
    alert('Could not join room. Make sure the host has created it!');
  } finally {
    btnJoinRoom.disabled = false;
    btnJoinRoom.textContent = 'JOIN';
  }
});

btnCopyLink.addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?room=${network.roomCode}`;
  navigator.clipboard.writeText(url);
  btnCopyLink.textContent = 'COPIED TO CLIPBOARD!';
  setTimeout(() => (btnCopyLink.textContent = 'COPY INVITE LINK'), 2000);
});

const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  inputRoomCode.value = roomParam;
  lobbyModal.classList.remove('hidden');
}

function broadcastMyState() {
  const payload = {
    type: 'PLAYER_STATE',
    x: player.x,
    y: player.y,
    angle: player.angle,
    color: player.color,
    name: player.name,
    isRolling: player.isRolling,
    isAttacking: player.isAttacking,
    attackProgress: player.attackProgress,
    isSlapping: player.isSlapping,
    slapProgress: player.slapProgress,
    isBlocking: player.isBlocking,
    hp: player.hp,
    maxHp: player.maxHp,
    isStunned: player.isStunned,
    isBerserk: player.isBerserk,
    isOdmMode: player.isOdmMode,
    isAirborne: player.isAirborne,
    activeCables: player.activeCables,
    spinTimer: player.spinTimer,
    isLeftAttacking: player.isLeftAttacking,
    leftAttackProgress: player.leftAttackProgress,
    isRightAttacking: player.isRightAttacking,
    rightAttackProgress: player.rightAttackProgress,
    isSandevistan: player.isSandevistan,
    sandevistanTimer: player.sandevistanTimer,
    shotgunAmmo: player.shotgunAmmo,
    isReloadingShotgun: player.isReloadingShotgun,
    shotgunReloadTimer: player.shotgunReloadTimer,
    equipment: player.equipment
  };

  if (network.isHost) {
    network.broadcast(payload);
  } else {
    network.sendToHost(payload);
  }
}

// Universal Comic Text Broadcast Hook (Damage numbers, skills, stuns, dodges to all clients)
particles.onComicTextSpawned = (x, y, text, color) => {
  const comicMsg = { type: 'COMIC_TEXT', x, y, text, color };
  if (network.isHost) network.broadcast(comicMsg);
  else network.sendToHost(comicMsg);
};

// David Martinez Carnage Shotgun Reload Hook
player.onShotgunReloadComplete = () => {
  if (audio.playShotgunPump) audio.playShotgunPump();
  else audio.playShieldLock();
  particles.spawnComicText(player.x, player.y - 28, 'SHELLS FULL! [4/4] 💥', '#00ff88');
  broadcastMyState();
};

// Combat Automaton / Training Dummy Callbacks
dummy.onShoot = (proj) => {
  cinematics.projectiles.push(proj);
  audio.playLightningDagger();
  particles.spawnComicText(dummy.x, dummy.y - 32, 'ENERGY BLAST! 💥', '#f59e0b');
  const shootMsg = { type: 'BOT_SHOOT', proj: { ...proj, caster: null } };
  if (network.isHost) network.broadcast(shootMsg);
  else network.sendToHost(shootMsg);
};

dummy.onMeleeHit = (target, dmg, angle) => {
  if (target === player) {
    const res = player.takeDamage(dmg, angle, 480);
    if (res) {
      audio.playBonk();
      cinematics.addScreenShake(8);
      const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : `-${res.damage}`);
      particles.spawnComicText(player.x, player.y - 28, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : '#ef4444'));
      broadcastMyState();
    }
  }
};

function sendFullLootSync(targetPeerId = null) {
  const lootList = [];
  for (const [id, loot] of groundItems.entries()) {
    lootList.push({
      id: loot.id,
      item: loot.item,
      x: loot.x,
      y: loot.y
    });
  }
  const syncMsg = {
    type: 'FULL_LOOT_SYNC',
    items: lootList
  };
  const modeMsg = {
    type: 'BOT_MODE_CHANGED',
    mode: dummy.mode
  };

  if (targetPeerId) {
    network.sendTo(targetPeerId, syncMsg);
    network.sendTo(targetPeerId, modeMsg);
  } else {
    network.broadcast(syncMsg);
    network.broadcast(modeMsg);
  }
}

network.onPlayerJoined = (joinedPeerId) => {
  updatePartyRoster();
  broadcastMyState();

  // If host, sync all ground loot and bot mode to newly joined player
  if (network.isHost) {
    sendFullLootSync(joinedPeerId);
    setTimeout(() => {
      sendFullLootSync(joinedPeerId);
    }, 250);
  }
};

network.onPlayerLeft = () => {
  updatePartyRoster();
};

network.onMessageReceived = (fromPeerId, msg) => {
  if (msg.type === 'PLAYER_STATE') {
    network.remotePlayers.set(fromPeerId, {
      ...msg,
      lastSeen: performance.now()
    });
    updatePartyRoster();
  } else if (msg.type === 'SLAP_KNOCKBACK') {
    if (msg.targetPeerId === network.myPeerId) {
      if (player.isBerserk) {
        particles.spawnComicText(player.x, player.y - 20, 'UNSTOPPABLE! 🩸', '#ef4444');
        return;
      }
      player.applyKnockback(msg.kx, msg.ky);
      audio.playBonk();
      particles.spawnComicText(player.x, player.y - 20, 'BONK!', '#ff0055');
    }
  } else if (msg.type === 'DUMMY_HIT') {
    dummy.takeHit(msg.damage, msg.angle, msg.knockback || (msg.isPull ? -480 : 0));
    if (msg.isPull) {
      dummy.pullTowards(msg.pullX || 0, msg.pullY || 0, 45);
    }
    audio.playBonk();
    const hitLabel = msg.isCrit ? `CRIT! -${msg.damage}` : (msg.isPull ? `PULL! -${msg.damage}` : `-${msg.damage}`);
    particles.spawnComicText(dummy.x, dummy.y - 24, hitLabel, msg.isCrit ? '#ff0055' : (msg.isPull ? '#00f0ff' : '#ffea00'));
  } else if (msg.type === 'CINEMATIC_ULTIMATE') {
    // If this cinematic was initiated by ME, do not re-trigger!
    if (msg.peerId && msg.peerId === network.myPeerId) return;

    // Find the actual caster using msg.peerId or fallback to sender/coordinates
    const caster = (msg.peerId ? network.remotePlayers.get(msg.peerId) : null) 
      || network.remotePlayers.get(fromPeerId) 
      || { x: msg.x, y: msg.y, angle: msg.angle };

    // Remote cinematics are purely visual on other peers (isRemote = true)
    cinematics.trigger(msg.ultimateType, caster, true);
    if (msg.ultimateType === 'hollow_purple') audio.playHollowPurple();
    else if (msg.ultimateType === 'world_cutting_slash') audio.playWorldCuttingSlash();
    else if (msg.ultimateType === 'inverted_chain_rampage') audio.playChainRampage();
    else if (msg.ultimateType === 'berserker_rage') { audio.playBerserkRoar(); audio.playClang(); }
    else if (msg.ultimateType === 'spartan_kick') audio.playSpartanKick();
    else if (msg.ultimateType === 'dismantle') audio.playDismantleCuts();
    else if (msg.ultimateType === 'cannon_arm') audio.playExplosion();
    else if (msg.ultimateType === 'levi_grapple_whirlwind') audio.playGrappleWireLaunch();
    else if (msg.ultimateType === 'odm_gas_boost') audio.playOdmGasHiss();
    else if (msg.ultimateType === 'sandevistan') {
      if (audio.playSandevistanBoot) audio.playSandevistanBoot();
    } else if (msg.ultimateType === 'overcharge_boost') {
      if (audio.playGravitationalSurge) audio.playGravitationalSurge();
    }
    // Note: network.handleIncomingData already relays to other peers on the host; no duplicate broadcast here!
  } else if (msg.type === 'TARGET_STUNNED') {
    if (msg.targetPeerId === network.myPeerId) {
      if (player.isBerserk) {
        particles.spawnComicText(player.x, player.y - 32, 'UNSTOPPABLE! 🩸', '#ef4444');
        return;
      }
      player.applyStun(msg.duration || 2.5);
      audio.playBonk();
      particles.spawnComicText(player.x, player.y - 32, 'STUNNED! 💫', '#fde047');
    } else {
      const remote = network.remotePlayers.get(msg.targetPeerId);
      if (remote) {
        if (remote.isBerserk) {
          particles.spawnComicText(remote.x, remote.y - 32, 'UNSTOPPABLE! 🩸', '#ef4444');
          return;
        }
        remote.isStunned = true;
        particles.spawnComicText(remote.x, remote.y - 32, 'STUNNED! 💫', '#fde047');
      }
    }
  } else if (msg.type === 'LOOT_SPAWNED') {
    const dropped = new GroundLoot(msg.item, msg.x, msg.y, msg.id);
    groundItems.set(dropped.id, dropped);
    audio.playBonk();
  } else if (msg.type === 'LOOT_PICKED_UP') {
    groundItems.delete(msg.id);
  } else if (msg.type === 'FULL_LOOT_SYNC') {
    groundItems.clear();
    for (const lootData of msg.items) {
      const dropped = new GroundLoot(lootData.item, lootData.x, lootData.y, lootData.id);
      groundItems.set(dropped.id, dropped);
    }
    console.log(`[Client] Synced ${groundItems.size} ground items from host.`);
  } else if (msg.type === 'REQUEST_ROOM_SYNC') {
    if (network.isHost) {
      sendFullLootSync(fromPeerId);
      if (currentFloor >= 1 && currentDungeon) {
        network.sendTo(fromPeerId, {
          type: 'DUNGEON_FLOOR_SYNC',
          floorNumber: currentFloor,
          dungeonData: currentDungeon.getSyncData()
        });
      }
    }
  } else if (msg.type === 'DUNGEON_FLOOR_SYNC') {
    currentFloor = msg.floorNumber;
    if (!currentDungeon) {
      currentDungeon = new Dungeon({ floorNumber: msg.floorNumber, theme: msg.dungeonData.themeKey });
    }
    currentDungeon.applySyncData(msg.dungeonData);
    player.x = currentDungeon.spawnRoom.centerX;
    player.y = currentDungeon.spawnRoom.centerY;
    player.vx = 0;
    player.vy = 0;
    currentDungeon.currentRoom = currentDungeon.spawnRoom;
    currentDungeon.spawnRoom.hasVisited = true;
    currentDungeon.spawnRoom.isCleared = true;
    groundItems.clear();
    monsterManager.clear();

    const hudFloor = document.getElementById('hud-floor');
    if (hudFloor) {
      hudFloor.textContent = `FLOOR ${currentFloor}: ${currentDungeon.theme.shortName}`;
      hudFloor.style.color = currentDungeon.theme.torchColor;
      hudFloor.style.textShadow = `0 0 15px ${currentDungeon.theme.torchColor}`;
    }
    particles.spawnComicText(player.x, player.y - 40, `FLOOR ${currentFloor} - ${currentDungeon.theme.shortName}`, currentDungeon.theme.torchColor);
  } else if (msg.type === 'RETURN_TO_LOBBY') {
    returnToLobby(false);
  } else if (msg.type === 'ROOM_TRANSITION') {
    if (currentDungeon) {
      const room = currentDungeon.rooms.find(r => r.id === msg.roomId);
      if (room) {
        room.hasVisited = true;
        currentDungeon.currentRoom = room;
        currentDungeon.showRoomBanner(room);
        if (!room.isCleared) {
          room.isLocked = true;
          monsterManager.activateRoom(room.id);
        }
      }
    }
  } else if (msg.type === 'ROOM_CLEARED') {
    if (currentDungeon) {
      const room = currentDungeon.rooms.find(r => r.id === msg.roomId);
      if (room) {
        room.isLocked = false;
        room.isCleared = true;
        audio.playDoorUnlock();
        audio.playRoomClear();
        if (room.type === 'boss' && currentDungeon.exitPortal) {
          currentDungeon.exitPortal.isActive = true;
        }
      }
    }
  } else if (msg.type === 'ROOM_DISCOVERED') {
    if (currentDungeon) {
      const room = currentDungeon.rooms.find(r => r.id === msg.roomId);
      if (room) {
        room.hasVisited = true;
        currentDungeon.showRoomBanner(room);
      }
    }
  } else if (msg.type === 'MONSTER_UPDATE_BATCH') {
    if (!network.isHost) {
      monsterManager.applyBatchNetworkState(msg.batch);
    }
  } else if (msg.type === 'MONSTER_HIT') {
    const monster = monsterManager.getMonsterById(msg.monsterId);
    if (monster) {
      monster.takeHit(msg.damage, msg.angle, msg.knockback || 0, msg.isCrit);
      particles.spawnComicText(monster.x, monster.y - 20, msg.isCrit ? `CRIT! -${msg.damage}` : `-${msg.damage}`, msg.isCrit ? '#ff0055' : '#fbbf24');
    }
  } else if (msg.type === 'COMIC_TEXT') {
    particles.spawnComicText(msg.x, msg.y, msg.text, msg.color, false);
  } else if (msg.type === 'BOT_MODE_CHANGED') {
    dummy.setMode(msg.mode);
    particles.spawnComicText(dummy.x, dummy.y - 36, `BOT: ${msg.mode}!`, '#fde047', false);
  } else if (msg.type === 'BOT_SHOOT') {
    if (!network.isHost) {
      cinematics.projectiles.push({
        ...msg.proj,
        caster: dummy
      });
      audio.playLightningDagger();
    }
  } else if (msg.type === 'SHOTGUN_FIRE') {
    if (msg.peerId === network.myPeerId) return;
    const caster = network.remotePlayers.get(msg.peerId) || { x: msg.x, y: msg.y, angle: msg.angle };
    spawnShotgunPellets(caster, true);
    if (audio.playCarnageShotgun) audio.playCarnageShotgun();
  }
};

setInterval(() => {
  if (network.connections.size > 0) {
    broadcastMyState();
    if (network.isHost && currentFloor >= 1 && currentDungeon) {
      network.broadcast({
        type: 'MONSTER_UPDATE_BATCH',
        batch: monsterManager.getBatchNetworkState()
      });
    }
  }
}, 50);

// --- COMBAT WEAPON & BLOCKING LOGIC ---
function playWeaponAttackSound(weapon) {
  audio.init();
  if (!weapon) {
    audio.playSwing();
    return;
  }
  switch (weapon.visual) {
    case 'lapse_blue':
      audio.playGravitationalSurge();
      break;
    case 'sukuna_kamutoke':
      audio.playLightningDagger();
      break;
    case 'sukuna_cleaver':
      audio.playCleaverSlash();
      break;
    case 'inverted_spear_chain':
      audio.playChainThrust();
      break;
    case 'dragon_slayer':
      audio.playHeavyGreatswordSwing();
      break;
    case 'warhammer_2h':
      audio.playHammerSmash();
      break;
    case 'crystal_blade':
      audio.playCrystalSlash();
      break;
    case 'dual_snap_blades':
      audio.playSnapBladesSlash();
      break;
    case 'david_shotgun':
      if (audio.playCarnageShotgun) audio.playCarnageShotgun();
      else audio.playExplosion();
      break;
    default:
      audio.playSwing();
      break;
  }
}

function spawnShotgunPellets(caster, isRemote = false) {
  const muzzleDist = (caster.radius || 22) + 16;
  const spreadAngle = 0.38; // ~22° conical spread
  const totalPellets = 6;
  const baseSpeed = 1250;
  const attackAngle = caster.angle !== undefined ? caster.angle : 0;
  const weapon = caster.equipment?.weapon;
  const perPelletDmg = weapon?.damage || 14;
  const critBonus = (caster.equipment?.helmet?.critChance || 0) + (weapon?.critChance || 0);

  for (let i = 0; i < totalPellets; i++) {
    const coneAngle = -spreadAngle / 2 + (spreadAngle / (totalPellets - 1)) * i;
    const jitter = (Math.random() - 0.5) * 0.04;
    const pelletAngle = attackAngle + coneAngle + jitter;
    const speed = baseSpeed + (Math.random() - 0.5) * 120;

    const isCrit = Math.random() < (0.08 + critBonus);
    const damage = Math.round(perPelletDmg * (0.88 + Math.random() * 0.24) * (isCrit ? 1.85 : 1.0));

    cinematics.projectiles.push({
      type: 'shotgun_pellet',
      caster,
      isRemote,
      x: caster.x + Math.cos(attackAngle) * muzzleDist,
      y: caster.y + Math.sin(attackAngle) * muzzleDist,
      vx: Math.cos(pelletAngle) * speed,
      vy: Math.sin(pelletAngle) * speed,
      angle: pelletAngle,
      radius: 8,
      damage,
      isCrit,
      knockback: 110,
      life: 0.35, // ~440px travel distance
      maxLife: 0.35,
      color: '#f59e0b'
    });
  }
}

function handleAttacks() {
  const targets = currentFloor === 0
    ? [dummy, ...network.remotePlayers.values()]
    : [...monsterManager.getNearbyMonsters(player.x, player.y, 450), ...network.remotePlayers.values()];
  const hits = combat.performWeaponAttack(player, targets);

  // Destructible containers in dungeon
  if (currentFloor >= 1 && currentDungeon) {
    for (const container of currentDungeon.containers) {
      if (container.isBroken) continue;
      const dist = Math.hypot(player.x - container.x, player.y - container.y);
      if (dist <= (player.radius || 22) + container.radius + 35) {
        container.isBroken = true;
        audio.playContainerShatter();
        particles.spawnDashBurst(container.x, container.y, 0, '#c084fc');
        particles.spawnComicText(container.x, container.y - 18, 'SMASH! 🏺', '#e2e8f0');
        if (Math.random() < 0.5) {
          player.hp = Math.min(player.maxHp, player.hp + 20);
          particles.spawnComicText(player.x, player.y - 32, '+20 HP 💚', '#22c55e');
          player.syncHUD();
        }
      }
    }
  }

  for (const hit of hits) {
    if (hit.target === dummy) {
      dummy.takeHit(hit.damage, hit.angle, hit.knockback || 0);
      if (hit.isPull) {
        dummy.pullTowards(player.x, player.y, 45);
      }
      
      // Weapon specific impact sound fx!
      const weaponVisual = player.equipment?.weapon?.visual;
      if (weaponVisual === 'dragon_slayer') {
        audio.playClang();
        cinematics.addScreenShake(12);
      } else if (weaponVisual === 'warhammer_2h') {
        audio.playHammerSmash();
        cinematics.addScreenShake(10);
      } else if (weaponVisual === 'sukuna_kamutoke') {
        audio.playLightningDagger();
      } else if (weaponVisual === 'sukuna_cleaver') {
        audio.playCleaverSlash();
        cinematics.addScreenShake(6);
      } else if (weaponVisual === 'lapse_blue') {
        audio.playGravitationalSurge();
      } else if (weaponVisual === 'inverted_spear_chain') {
        audio.playChainThrust();
      } else if (weaponVisual === 'crystal_blade') {
        audio.playCrystalSlash();
      } else if (weaponVisual === 'dual_snap_blades') {
        audio.playSnapBladesSlash();
        cinematics.addScreenShake(7);
        particles.spawnDashBurst(dummy.x, dummy.y, hit.angle, '#10b981');
      } else if (weaponVisual === 'david_shotgun') {
        audio.playBonk();
        const shake = Math.min(14, 6 + (hit.pelletsHit || 1) * 1.4);
        cinematics.addScreenShake(shake);
        particles.spawnDashBurst(dummy.x, dummy.y, hit.angle, '#f59e0b');
      } else {
        audio.playBonk();
      }

      let popupText = hit.isCrit ? `CRIT! -${hit.damage}` : (hit.isPull ? `PULL! -${hit.damage}` : `HIT! -${hit.damage}`);
      let popupColor = hit.isCrit ? '#ff0055' : (hit.isPull ? '#00f0ff' : '#fbbf24');
      if (weaponVisual === 'dual_snap_blades') {
        popupText = hit.isCrit ? `CRIT DUAL SLICE! -${hit.damage} ⚔️` : `DUAL SLICE! -${hit.damage} ⚔️`;
        popupColor = hit.isCrit ? '#ff0055' : '#10b981';
      } else if (weaponVisual === 'david_shotgun') {
        const pellets = hit.pelletsHit || 6;
        popupText = hit.isCrit ? `CRIT [${pellets}/6]! -${hit.damage} 💥` : `BLAST [${pellets}/6]! -${hit.damage} 💥`;
        popupColor = hit.isCrit ? '#ff0055' : (pellets >= 5 ? '#00ff88' : '#fbbf24');
      }
      particles.spawnComicText(dummy.x, dummy.y - 24, popupText, popupColor);

      const hitMsg = {
        type: 'DUMMY_HIT',
        damage: hit.damage,
        angle: hit.angle,
        isCrit: hit.isCrit,
        isPull: !!hit.isPull,
        pullX: player.x,
        pullY: player.y
      };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else if (hit.target instanceof Monster) {
      hit.target.takeHit(hit.damage, hit.angle, hit.knockback || 0, hit.isCrit, player);
      if (hit.isPull) {
        hit.target.pullTowards(player.x, player.y, 45);
      }

      const weaponVisual = player.equipment?.weapon?.visual;
      if (weaponVisual === 'dragon_slayer') {
        audio.playClang();
        cinematics.addScreenShake(12);
      } else if (weaponVisual === 'warhammer_2h') {
        audio.playHammerSmash();
        cinematics.addScreenShake(10);
      } else if (weaponVisual === 'sukuna_kamutoke') {
        audio.playLightningDagger();
      } else if (weaponVisual === 'sukuna_cleaver') {
        audio.playCleaverSlash();
        cinematics.addScreenShake(6);
      } else if (weaponVisual === 'dual_snap_blades') {
        audio.playSnapBladesSlash();
        cinematics.addScreenShake(7);
        particles.spawnDashBurst(hit.target.x, hit.target.y, hit.angle, '#10b981');
      } else if (weaponVisual === 'david_shotgun') {
        audio.playBonk();
        const shake = Math.min(14, 6 + (hit.pelletsHit || 1) * 1.4);
        cinematics.addScreenShake(shake);
        particles.spawnDashBurst(hit.target.x, hit.target.y, hit.angle, '#f59e0b');
      } else {
        audio.playBonk();
      }

      let popupText = hit.isCrit ? `CRIT! -${hit.damage}` : `-${hit.damage}`;
      let popupColor = hit.isCrit ? '#ff0055' : '#fbbf24';
      if (weaponVisual === 'dual_snap_blades') {
        popupText = hit.isCrit ? `CRIT DUAL SLICE! -${hit.damage} ⚔️` : `DUAL SLICE! -${hit.damage} ⚔️`;
        popupColor = hit.isCrit ? '#ff0055' : '#10b981';
      } else if (weaponVisual === 'david_shotgun') {
        const pellets = hit.pelletsHit || 6;
        popupText = hit.isCrit ? `CRIT [${pellets}/6]! -${hit.damage} 💥` : `BLAST [${pellets}/6]! -${hit.damage} 💥`;
        popupColor = hit.isCrit ? '#ff0055' : (pellets >= 5 ? '#00ff88' : '#fbbf24');
      }
      particles.spawnComicText(hit.target.x, hit.target.y - 24, popupText, popupColor);

      const hitMsg = {
        type: 'MONSTER_HIT',
        monsterId: hit.target.id,
        damage: hit.damage,
        angle: hit.angle,
        knockback: hit.knockback || 0,
        isCrit: hit.isCrit
      };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else {
      for (const [peerId, remote] of network.remotePlayers.entries()) {
        if (remote === hit.target) {
          const kx = Math.cos(hit.angle) * hit.knockback;
          const ky = Math.sin(hit.angle) * hit.knockback;

          const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
          if (network.isHost) network.broadcast(slapMsg);
          else network.sendToHost(slapMsg);

          const weaponVisual = player.equipment?.weapon?.visual;
          if (weaponVisual === 'dual_snap_blades') {
            audio.playSnapBladesSlash();
          } else {
            audio.playBonk();
          }
          const effectLabel = hit.isBlocked
            ? 'BLOCKED!'
            : (weaponVisual === 'dual_snap_blades'
                ? 'DUAL SLICE! ⚔️'
                : (weaponVisual === 'david_shotgun'
                    ? `BLAST [${hit.pelletsHit || 6}/6]! 💥`
                    : (hit.isPull ? 'PULLED! 🌀' : 'WHACK!')));
          particles.spawnComicText(remote.x, remote.y - 20, effectLabel, weaponVisual === 'dual_snap_blades' ? '#10b981' : (weaponVisual === 'david_shotgun' ? '#00ff88' : (hit.isPull ? '#00f0ff' : '#ff3366')));
        }
      }
    }
  }

  // Guts Berserker Beast Life Steal (+35% damage siphon or min 14 HP)
  if (player.isBerserk && hits.length > 0) {
    const totalDmg = hits.reduce((sum, h) => sum + (h.damage || 0), 0);
    const lifesteal = Math.max(14, Math.round(totalDmg * 0.35));
    const oldHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + lifesteal);
    const healed = player.hp - oldHp;
    if (healed > 0) {
      particles.spawnComicText(player.x, player.y - 44, `+${healed} HP 🩸 LIFE STEAL`, '#22c55e');
      particles.spawnDashBurst(player.x, player.y, 0, '#ef4444');
      player.syncHUD();
      broadcastMyState();
    } else {
      particles.spawnComicText(player.x, player.y - 44, `MAX HP 🩸 LIFE STEAL`, '#22c55e');
    }
  }
}

function handleOffhandAttack() {
  const targets = currentFloor === 0
    ? [dummy, ...network.remotePlayers.values()]
    : [...monsterManager.getNearbyMonsters(player.x, player.y, 450), ...network.remotePlayers.values()];
  const hits = combat.performOffhandAttack(player, targets);

  for (const hit of hits) {
    if (hit.target === dummy) {
      dummy.takeHit(hit.damage, hit.angle, hit.knockback);

      if (hit.attackType === 'reversal_red') {
        audio.playRepulsionBurst();
        cinematics.addScreenShake(12);
        particles.spawnComicText(dummy.x, dummy.y - 24, `REVERSAL RED! -${hit.damage}`, '#ff2a5f');
        particles.spawnDashBurst(dummy.x, dummy.y, hit.angle, '#ff2a5f');
      } else if (hit.attackType === 'sukuna_hiten') {
        audio.playFireSpear();
        particles.spawnComicText(dummy.x, dummy.y - 24, `FIRE HITEN! -${hit.damage}`, '#f97316');
      } else if (hit.attackType === 'shield_bash') {
        audio.playHammerSmash();
        particles.spawnComicText(dummy.x, dummy.y - 24, `SHIELD BASH! -${hit.damage}`, '#38bdf8');
      } else {
        audio.playBonk();
        particles.spawnComicText(dummy.x, dummy.y - 24, `WHACK! -${hit.damage}`, '#ff3366');
      }

      const hitMsg = {
        type: 'DUMMY_HIT',
        damage: hit.damage,
        angle: hit.angle,
        isCrit: hit.isCrit,
        knockback: hit.knockback,
        isPull: false
      };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else if (hit.target instanceof Monster) {
      hit.target.takeHit(hit.damage, hit.angle, hit.knockback, hit.isCrit, player);

      if (hit.attackType === 'reversal_red') {
        audio.playRepulsionBurst();
        cinematics.addScreenShake(12);
        particles.spawnComicText(hit.target.x, hit.target.y - 24, `REVERSAL RED! -${hit.damage}`, '#ff2a5f');
        particles.spawnDashBurst(hit.target.x, hit.target.y, hit.angle, '#ff2a5f');
      } else if (hit.attackType === 'sukuna_hiten') {
        audio.playFireSpear();
        particles.spawnComicText(hit.target.x, hit.target.y - 24, `FIRE HITEN! -${hit.damage}`, '#f97316');
      } else if (hit.attackType === 'shield_bash') {
        audio.playHammerSmash();
        particles.spawnComicText(hit.target.x, hit.target.y - 24, `SHIELD BASH! -${hit.damage}`, '#38bdf8');
      } else {
        audio.playBonk();
        particles.spawnComicText(hit.target.x, hit.target.y - 24, `WHACK! -${hit.damage}`, '#ff3366');
      }

      const hitMsg = {
        type: 'MONSTER_HIT',
        monsterId: hit.target.id,
        damage: hit.damage,
        angle: hit.angle,
        knockback: hit.knockback || 0,
        isCrit: hit.isCrit
      };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else {
      for (const [peerId, remote] of network.remotePlayers.entries()) {
        if (remote === hit.target) {
          const kx = Math.cos(hit.angle) * hit.knockback;
          const ky = Math.sin(hit.angle) * hit.knockback;

          const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
          if (network.isHost) network.broadcast(slapMsg);
          else network.sendToHost(slapMsg);

          audio.playBonk();
          const effectLabel = hit.attackType === 'reversal_red'
            ? 'REPULSED! 💥'
            : (hit.isBlocked ? 'BLOCKED!' : 'WHACK!');
          particles.spawnComicText(remote.x, remote.y - 20, effectLabel, '#ff2a5f');
        }
      }
    }
  }

  // Guts Berserker Beast Life Steal for offhand attack
  if (player.isBerserk && hits.length > 0) {
    const totalDmg = hits.reduce((sum, h) => sum + (h.damage || 0), 0);
    const lifesteal = Math.max(14, Math.round(totalDmg * 0.35));
    const oldHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + lifesteal);
    const healed = player.hp - oldHp;
    if (healed > 0) {
      particles.spawnComicText(player.x, player.y - 44, `+${healed} HP 🩸 LIFE STEAL`, '#22c55e');
      particles.spawnDashBurst(player.x, player.y, 0, '#ef4444');
      player.syncHUD();
      broadcastMyState();
    } else {
      particles.spawnComicText(player.x, player.y - 44, `MAX HP 🩸 LIFE STEAL`, '#22c55e');
    }
  }
}

// Cinematic ultimate trigger handler
function onTriggerCinematic(ultimateType, triggeringPlayer) {
  cinematics.trigger(ultimateType, triggeringPlayer);

  // Sync ultimate activation to remote peers
  const ultimateMsg = {
    type: 'CINEMATIC_ULTIMATE',
    ultimateType,
    peerId: network.myPeerId,
    x: triggeringPlayer.x,
    y: triggeringPlayer.y,
    angle: triggeringPlayer.angle
  };

  if (network.isHost) network.broadcast(ultimateMsg);
  else network.sendToHost(ultimateMsg);
}

// --- MAIN GAME LOOP ---
let lastTime = performance.now();
let wasSandevistanActive = false;
let slowMoTickTimer = 0;

function gameLoop(now) {
  try {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

  const wasRolling = player.isRolling;
  const modalsOpen =
    !wardrobeModal.classList.contains('hidden') ||
    !lobbyModal.classList.contains('hidden') ||
    !invModal.classList.contains('hidden') ||
    (floorModal && !floorModal.classList.contains('hidden'));

  // Inventory toggle hotkeys: I or Tab
  if (input.justPressedI || (input.keys.tab && !input.tabHandled)) {
    input.tabHandled = true;
    toggleInventory();
  }
  if (!input.keys.tab) input.tabHandled = false;

  // ESC closes any open modal
  if (input.keys.escape) {
    if (!invModal.classList.contains('hidden')) closeInventory();
    if (!wardrobeModal.classList.contains('hidden')) closeWardrobe();
    if (!lobbyModal.classList.contains('hidden')) lobbyModal.classList.add('hidden');
    if (floorModal && !floorModal.classList.contains('hidden')) closeFloorModal();
  }

  // Handle Shield Blocking
  if (!modalsOpen && input.mouse.rightDown && player.equipment?.offhand?.visual?.includes('shield')) {
    if (!player.isBlocking) {
      player.isBlocking = true;
      audio.playSwing();
      broadcastMyState();
    }
  } else {
    if (player.isBlocking) {
      player.isBlocking = false;
      broadcastMyState();
    }
  }

  // --- SANDEVISTAN TIME DILATION CHECK ---
  // Check if local player OR any remote peer has Sandevistan active
  let isAnySandevistan = player.isSandevistan && player.sandevistanTimer > 0;
  if (!isAnySandevistan) {
    for (const [_, remote] of network.remotePlayers.entries()) {
      if (remote.isSandevistan && remote.sandevistanTimer > 0) {
        isAnySandevistan = true;
        break;
      }
    }
  }

  // Sandevistan Audio Feedback: Power-down sound when ending, and deep slow-mo heartbeat ticks
  if (wasSandevistanActive && !isAnySandevistan) {
    if (audio.playSandevistanEnd) audio.playSandevistanEnd();
  }
  if (isAnySandevistan) {
    slowMoTickTimer -= dt;
    if (slowMoTickTimer <= 0) {
      slowMoTickTimer = 0.65;
      if (audio.playSlowMoTick) audio.playSlowMoTick();
    }
  } else {
    slowMoTickTimer = 0;
  }
  wasSandevistanActive = isAnySandevistan;

  // If Sandevistan is active, everyone else (enemies, projectiles, other players) is slowed to 10% speed!
  const worldTimeScale = isAnySandevistan ? 0.10 : 1.0;
  const worldDt = dt * worldTimeScale;

  // 1. Update entities
  // David (the caster) moves at normal/boosted dt; all others update at worldDt!
  const playerDt = player.isSandevistan ? dt : worldDt;
  const activeBounds = (currentFloor >= 1 && currentDungeon) ? currentDungeon : dungeonBounds;
  player.update(playerDt, input, activeBounds);

  if (currentFloor === 0) {
    dummy.update(worldDt, [player, ...network.remotePlayers.values()]);
    readyCircle.update(worldDt, player, network.remotePlayers);
    wardrobeStation.update(worldDt);
    floorStation.update(worldDt);
  } else if (currentFloor >= 1 && currentDungeon) {
    // 1. Check Door Transitions
    const doorTrans = currentDungeon.checkDoorTransition(player.x, player.y, player.radius || 22);
    if (doorTrans) {
      player.x = doorTrans.newX;
      player.y = doorTrans.newY;
      player.vx = 0;
      player.vy = 0;
      currentDungeon.currentRoom = doorTrans.targetRoom;
      doorTrans.targetRoom.hasVisited = true;
      currentDungeon.showRoomBanner(doorTrans.targetRoom);

      // Check if targetRoom has monsters and is not cleared -> trigger combat lockdown!
      if (!doorTrans.targetRoom.isCleared) {
        const mobsInRoom = getAliveMonstersInChamber(doorTrans.targetRoom);
        if (mobsInRoom.length > 0) {
          doorTrans.targetRoom.isLocked = true;
          audio.playDoorLock();
          cinematics.addScreenShake(12);
          const isCyber = currentDungeon && currentDungeon.themeKey === 'cyberpunk';
          const isAot = currentDungeon && currentDungeon.themeKey === 'aot';
          let lockText = 'ROOM LOCKED! DEFEAT ALL CURSES! ⚔️';
          if (isCyber) lockText = 'SECTOR LOCKDOWN! NEUTRALIZE HOSTILES! 🚨';
          else if (isAot) lockText = 'WALL BREACHED! EXTERMINATE ALL TITANS! ⚔️';
          particles.spawnComicText(player.x, player.y - 45, lockText, '#ef4444');
          monsterManager.activateRoom(doorTrans.targetRoom.id);
        } else {
          doorTrans.targetRoom.isCleared = true;
        }
      }

      const transMsg = {
        type: 'ROOM_TRANSITION',
        roomId: doorTrans.targetRoom.id,
        x: player.x,
        y: player.y
      };
      if (network.isHost) network.broadcast(transMsg);
      else network.sendToHost(transMsg);
    }

    // 2. Enforce Room Lockdown & Clearance: ALL monsters must be dead before doors/portal unlock!
    if (currentDungeon.currentRoom && !currentDungeon.currentRoom.isCleared &&
        currentDungeon.currentRoom.type !== 'spawn' && currentDungeon.currentRoom.type !== 'treasure') {
      const aliveMobsInRoom = getAliveMonstersInChamber(currentDungeon.currentRoom);
      if (aliveMobsInRoom.length > 0) {
        if (!currentDungeon.currentRoom.isLocked) {
          currentDungeon.currentRoom.isLocked = true;
          audio.playDoorLock();
          cinematics.addScreenShake(12);
          const isCyber = currentDungeon && currentDungeon.themeKey === 'cyberpunk';
          const isAot = currentDungeon && currentDungeon.themeKey === 'aot';
          let lockText = 'ROOM LOCKED! DEFEAT ALL CURSES! ⚔️';
          if (isCyber) lockText = 'SECTOR LOCKDOWN! NEUTRALIZE HOSTILES! 🚨';
          else if (isAot) lockText = 'WALL BREACHED! EXTERMINATE ALL TITANS! ⚔️';
          particles.spawnComicText(player.x, player.y - 45, lockText, '#ef4444');
          monsterManager.activateRoom(currentDungeon.currentRoom.id);
        }
      } else {
        // Every single mob in this room is dead!
        const isCyber = currentDungeon && currentDungeon.themeKey === 'cyberpunk';
        const isAot = currentDungeon && currentDungeon.themeKey === 'aot';
        currentDungeon.currentRoom.isLocked = false;
        currentDungeon.currentRoom.isCleared = true;
        audio.playDoorUnlock();
        audio.playRoomClear();
        cinematics.addScreenShake(8);
        let clearText = 'ROOM CLEARED! ✨';
        if (isCyber) clearText = 'SECTOR CLEARED! ⚡';
        else if (isAot) clearText = 'DISTRICT SECURED! 🛡️';
        particles.spawnComicText(player.x, player.y - 45, clearText, '#00ff88');

        if (currentDungeon.currentRoom.type === 'combat') {
          spawnRoomReward(currentDungeon.currentRoom);
        } else if (currentDungeon.currentRoom.type === 'boss') {
          if (currentDungeon.exitPortal) {
            currentDungeon.exitPortal.isActive = true;
          }
          audio.playDescentFanfare();
          let clearBannerTitle = 'SANCTUM CLEARED!';
          if (isCyber) clearBannerTitle = 'ARASAKA SUBLEVEL CLEARED!';
          else if (isAot) clearBannerTitle = 'WALL MARIA DISTRICT LIBERATED!';
          currentDungeon.activeBanner = {
            title: clearBannerTitle,
            subtitle: 'DESCENT PORTAL UNLOCKED • STEP TO DESCEND',
            color: '#00ff88',
            timer: 4.5,
            maxTimer: 4.5
          };
        }

        const clearMsg = { type: 'ROOM_CLEARED', roomId: currentDungeon.currentRoom.id };
        if (network.isHost) network.broadcast(clearMsg);
        else network.sendToHost(clearMsg);
      }
    }

    currentDungeon.update(worldDt);
    monsterManager.update(worldDt, [player, ...network.remotePlayers.values()], currentDungeon, network.isHost || !network.isConnected);

    // Check Exit Portal trigger with lobby-style countdown
    if (currentDungeon.exitPortal && currentDungeon.exitPortal.isActive) {
      const portal = currentDungeon.exitPortal;
      const distToPortal = Math.hypot(player.x - portal.x, player.y - portal.y);
      const localInside = distToPortal <= portal.radius;

      // Check all connected remote party members
      let allRemotesInside = true;
      for (const [_, remote] of network.remotePlayers.entries()) {
        const rDist = Math.hypot(remote.x - portal.x, remote.y - portal.y);
        if (rDist > portal.radius) {
          allRemotesInside = false;
          break;
        }
      }

      portal.allReady = localInside && allRemotesInside;

      if (portal.allReady) {
        portal.isCountingDown = true;
        portal.countdown = (portal.countdown !== undefined ? portal.countdown : 3.0) - worldDt;
        if (portal.countdown <= 0) {
          portal.countdown = 0;
          portal.isCountingDown = false;
          startFloorDescent(currentFloor + 1);
        }
      } else {
        portal.isCountingDown = false;
        portal.countdown = 3.0; // reset countdown if someone steps out
      }
    }
  }
  player.syncHUD();

  // Update ground loot bobbing
  for (const [_, loot] of groundItems.entries()) {
    loot.update(worldDt);
  }

  // Check Set Bonus & Levi Gear
  const activeSet = checkSetBonus(player.equipment);
  const isLeviGearEquipped = (activeSet && activeSet.setKey === 'levi') ||
    (player.equipment?.weapon?.visual === 'dual_snap_blades') ||
    (player.equipment?.chest?.visual === 'odm_harness') ||
    (player.equipment?.helmet?.visual === 'scout_hood') ||
    (player.equipment?.pants?.visual === 'scout_trousers') ||
    (player.equipment?.boots?.visual === 'scout_boots');

  if (!isLeviGearEquipped) {
    if (player.isOdmMode) {
      player.isOdmMode = false;
      player.activeCables = [];
      player.isAirborne = false;
    }
  }

  // --- LEVI ODM AIRBORNE PASS-THROUGH SLICING (HE ONLY SPINS ONCE HE HITS AN ENEMY!) ---
  if (player.isAirborne && (player.activeCables.length > 0 || Math.hypot(player.vx, player.vy) > 180)) {
    const nowTime = performance.now();
    const sliceTargets = currentFloor === 0
      ? [dummy, ...network.remotePlayers.values()]
      : [...monsterManager.getNearbyMonsters(player.x, player.y, 250), ...network.remotePlayers.values()];
    for (const target of sliceTargets) {
      if (!target) continue;
      const dist = Math.hypot(target.x - player.x, target.y - player.y);
      const hitRadius = (target.radius || 22) + player.radius + 20; // ~64px reach
      if (dist <= hitRadius) {
        const lastSlice = player.lastSliceMap.get(target) || 0;
        if (nowTime - lastSlice >= 160) {
          player.lastSliceMap.set(target, nowTime);

          // Levi only spins once he hits an enemy!
          player.spinTimer = 0.22;
          audio.playSnapBladesSlash();
          cinematics.addScreenShake(8);
          particles.spawnBladeWhirlwind(target.x, target.y, '#10b981');
          particles.spawnDashBurst(target.x, target.y, player.angle, '#10b981');

          // Damage calculation (Levi snap blades high-velocity pass-through slice)
          const isCrit = Math.random() < (player.equipment?.weapon?.critChance || 0.25);
          let sliceDamage = 62 + Math.floor(Math.random() * 8);
          if (isCrit) sliceDamage = Math.round(sliceDamage * 1.6);

          if (target === dummy) {
            dummy.takeHit(sliceDamage, player.angle, 0);
            const sliceMsg = isCrit ? `CRIT SLICE! -${sliceDamage} 🌀` : `BLADE SLICE! -${sliceDamage} 🌀`;
            particles.spawnComicText(dummy.x, dummy.y - 30, sliceMsg, isCrit ? '#ff0055' : '#10b981');
            const hitMsg = { type: 'DUMMY_HIT', damage: sliceDamage, angle: player.angle, isCrit };
            if (network.isHost) network.broadcast(hitMsg);
            else network.sendToHost(hitMsg);
          } else if (target instanceof Monster) {
            target.takeHit(sliceDamage, player.angle, 0, isCrit, player);
            const sliceMsg = isCrit ? `CRIT SLICE! -${sliceDamage} 🌀` : `BLADE SLICE! -${sliceDamage} 🌀`;
            particles.spawnComicText(target.x, target.y - 30, sliceMsg, isCrit ? '#ff0055' : '#10b981');
            const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: sliceDamage, angle: player.angle, knockback: 0, isCrit };
            if (network.isHost) network.broadcast(hitMsg);
            else network.sendToHost(hitMsg);
          } else {
            for (const [peerId, remote] of network.remotePlayers.entries()) {
              if (remote === target) {
                const sliceMsg = isCrit ? `CRIT SLICE! -${sliceDamage} 🌀` : `BLADE SLICE! -${sliceDamage} 🌀`;
                particles.spawnComicText(remote.x, remote.y - 30, sliceMsg, isCrit ? '#ff0055' : '#10b981');
                const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx: 0, ky: 0 };
                if (network.isHost) network.broadcast(slapMsg);
                else network.sendToHost(slapMsg);
                break;
              }
            }
          }
          broadcastMyState();
        }
      }
    }
  }

  // Update Cinematics & Projectiles (collision with training dummy, monsters, player, and remote peers)
  const cinematicTargets = currentFloor === 0
    ? [dummy, player, ...network.remotePlayers.values()]
    : [player, ...monsterManager.getAliveMonsters(), ...network.remotePlayers.values()];
  cinematics.update(worldDt, cinematicTargets, (target, proj) => {
    if (target === player) {
      if (proj.type === 'shotgun_pellet') {
        const res = player.takeDamage(proj.damage || 14, Math.atan2(proj.vy || 0, proj.vx || 0), proj.knockback || 120);
        if (res) {
          audio.playBonk();
          cinematics.addScreenShake(3);
          const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : `-${res.damage}`);
          particles.spawnComicText(player.x, player.y - 28, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : '#ef4444'));
          broadcastMyState();
        }
        return;
      }
      if (proj.type === 'bot_laser_bolt') {
        const res = player.takeDamage(proj.damage || 20, Math.atan2(proj.vy || 0, proj.vx || 0), 220);
        if (res) {
          audio.playBonk();
          cinematics.addScreenShake(5);
          const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : `-${res.damage} (LASER!)`);
          particles.spawnComicText(player.x, player.y - 28, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : '#06b6d4'));
          broadcastMyState();
        }
        return;
      }
      if (proj.type === 'bot_micro_missile') {
        const res = player.takeDamage(proj.damage || 28, Math.atan2(proj.vy || 0, proj.vx || 0), 480);
        if (res) {
          audio.playHammerSmash();
          cinematics.addScreenShake(10);
          particles.spawnDashBurst(player.x, player.y, 0, '#ef4444');
          const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : `-${res.damage} (MISSILE BLAST! 🚀)`);
          particles.spawnComicText(player.x, player.y - 28, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : '#f59e0b'));
          broadcastMyState();
        }
        return;
      }
      if (proj.type === 'bot_energy_orb' || proj.caster === dummy || (proj.caster instanceof Monster)) {
        const res = player.takeDamage(proj.damage || 22, Math.atan2(proj.vy || 0, proj.vx || 0), 450);
        if (res) {
          audio.playBonk();
          cinematics.addScreenShake(6);
          const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : `-${res.damage}`);
          particles.spawnComicText(player.x, player.y - 28, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : '#ef4444'));
          broadcastMyState();
        }
      }
      return;
    }

    // Guts Berserker projectile life steal (e.g. shockwaves or deflected projectiles)
    if (proj.caster === player && player.isBerserk && proj.damage) {
      const lifesteal = Math.max(12, Math.round(proj.damage * 0.35));
      const oldHp = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + lifesteal);
      const healed = player.hp - oldHp;
      if (healed > 0) {
        particles.spawnComicText(player.x, player.y - 44, `+${healed} HP 🩸 LIFE STEAL`, '#22c55e');
        particles.spawnDashBurst(player.x, player.y, 0, '#ef4444');
        player.syncHUD();
        broadcastMyState();
      }
    }
    if (target === dummy) {
      if (proj.type === 'shotgun_pellet') {
        dummy.takeHit(proj.damage, Math.atan2(proj.vy || 0, proj.vx || 0), proj.knockback || 120);
        audio.playBonk();
        cinematics.addScreenShake(Math.min(10, 3 + (proj.isCrit ? 3 : 1)));
        particles.spawnDashBurst(dummy.x, dummy.y, Math.atan2(proj.vy || 0, proj.vx || 0), '#f59e0b');
        const hitLabel = proj.isCrit ? `CRIT! -${proj.damage} 💥` : `-${proj.damage}`;
        particles.spawnComicText(dummy.x, dummy.y - 24, hitLabel, proj.isCrit ? '#ff0055' : '#f59e0b');
        const hitMsg = { type: 'DUMMY_HIT', damage: proj.damage, angle: Math.atan2(proj.vy || 0, proj.vx || 0), isCrit: proj.isCrit };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      if (proj.type === 'limitless_repulsion') {
        dummy.takeHit(proj.damage, proj.angle, proj.knockback);
        audio.playRepulsionBurst();
        particles.spawnComicText(dummy.x, dummy.y - 28, `REPULSED! -${proj.damage}`, '#00f0ff');
        return;
      }
      if (proj.type === 'levi_whirlwind') {
        dummy.takeHit(proj.damage, proj.angle, proj.knockback);
        audio.playSnapBladesSlash();
        cinematics.addScreenShake(8);
        const spinMsg = proj.isFirstHit ? 'BLENDER WHIRLWIND! 🌀' : `SLICE! -${proj.damage}`;
        particles.spawnComicText(dummy.x, dummy.y - 28, spinMsg, '#10b981');
        particles.spawnDashBurst(dummy.x, dummy.y, proj.angle, '#10b981');
        const hitMsg = { type: 'DUMMY_HIT', damage: proj.damage, angle: proj.angle, isCrit: true };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      if (proj.type === 'odm_gas_boost') {
        dummy.takeHit(proj.damage, proj.angle, proj.knockback);
        audio.playOdmGasHiss();
        cinematics.addScreenShake(6);
        particles.spawnComicText(dummy.x, dummy.y - 28, `GAS BLAST! -${proj.damage}`, '#10b981');
        particles.spawnDashBurst(dummy.x, dummy.y, proj.angle, '#ffffff');
        const hitMsg = { type: 'DUMMY_HIT', damage: proj.damage, angle: proj.angle, isCrit: false };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      dummy.takeHit(proj.damage, Math.atan2(proj.vy || 0, proj.vx || 0), proj.isStun ? 0 : 350);
      if (proj.isStun) {
        dummy.applyStun(proj.stunDuration || 2.5);
        particles.spawnComicText(dummy.x, dummy.y - 40, 'STUNNED! 💫', '#fde047');
      }
      audio.playClang();
      particles.spawnComicText(dummy.x, dummy.y - 28, `${(proj.type || 'ULTIMATE').toUpperCase().replace(/_/g, ' ')}! -${proj.damage}`, '#ff2a5f');
      cinematics.addScreenShake(16);

      const hitMsg = { type: 'DUMMY_HIT', damage: proj.damage, angle: 0, isCrit: true };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else if (target instanceof Monster) {
      if (proj.type === 'shotgun_pellet') {
        target.takeHit(proj.damage, Math.atan2(proj.vy || 0, proj.vx || 0), proj.knockback || 120, proj.isCrit, proj.caster);
        audio.playBonk();
        cinematics.addScreenShake(Math.min(10, 3 + (proj.isCrit ? 3 : 1)));
        particles.spawnDashBurst(target.x, target.y, Math.atan2(proj.vy || 0, proj.vx || 0), '#f59e0b');
        const hitLabel = proj.isCrit ? `CRIT! -${proj.damage} 💥` : `-${proj.damage}`;
        particles.spawnComicText(target.x, target.y - 24, hitLabel, proj.isCrit ? '#ff0055' : '#f59e0b');
        const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: proj.damage, angle: Math.atan2(proj.vy || 0, proj.vx || 0), knockback: proj.knockback || 120, isCrit: proj.isCrit };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      if (proj.type === 'limitless_repulsion') {
        target.takeHit(proj.damage, proj.angle, proj.knockback, true, proj.caster);
        audio.playRepulsionBurst();
        particles.spawnComicText(target.x, target.y - 28, `REPULSED! -${proj.damage}`, '#00f0ff');
        const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: proj.damage, angle: proj.angle, knockback: proj.knockback, isCrit: true };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      if (proj.type === 'levi_whirlwind') {
        target.takeHit(proj.damage, proj.angle, proj.knockback, true, proj.caster);
        audio.playSnapBladesSlash();
        cinematics.addScreenShake(8);
        const spinMsg = proj.isFirstHit ? 'BLENDER WHIRLWIND! 🌀' : `SLICE! -${proj.damage}`;
        particles.spawnComicText(target.x, target.y - 28, spinMsg, '#10b981');
        particles.spawnDashBurst(target.x, target.y, proj.angle, '#10b981');
        const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: proj.damage, angle: proj.angle, knockback: proj.knockback, isCrit: true };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      if (proj.type === 'odm_gas_boost') {
        target.takeHit(proj.damage, proj.angle, proj.knockback, false, proj.caster);
        audio.playOdmGasHiss();
        cinematics.addScreenShake(6);
        particles.spawnComicText(target.x, target.y - 28, `GAS BLAST! -${proj.damage}`, '#10b981');
        particles.spawnDashBurst(target.x, target.y, proj.angle, '#ffffff');
        const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: proj.damage, angle: proj.angle, knockback: proj.knockback, isCrit: false };
        if (network.isHost) network.broadcast(hitMsg);
        else network.sendToHost(hitMsg);
        return;
      }
      target.takeHit(proj.damage, Math.atan2(proj.vy || 0, proj.vx || 0), proj.isStun ? 0 : 350, true, proj.caster);
      if (proj.isStun) {
        target.applyStun(proj.stunDuration || 2.5);
        particles.spawnComicText(target.x, target.y - 40, 'STUNNED! 💫', '#fde047');
      }
      audio.playClang();
      particles.spawnComicText(target.x, target.y - 28, `${(proj.type || 'ULTIMATE').toUpperCase().replace(/_/g, ' ')}! -${proj.damage}`, '#ff2a5f');
      cinematics.addScreenShake(16);

      const hitMsg = { type: 'MONSTER_HIT', monsterId: target.id, damage: proj.damage, angle: 0, knockback: proj.isStun ? 0 : 350, isCrit: true };
      if (network.isHost) network.broadcast(hitMsg);
      else network.sendToHost(hitMsg);
    } else {
      for (const [peerId, remote] of network.remotePlayers.entries()) {
        if (remote === target) {
          if (proj.isStun) {
            remote.isStunned = true;
            const stunMsg = { type: 'TARGET_STUNNED', targetPeerId: peerId, duration: proj.stunDuration || 2.5 };
            if (network.isHost) network.broadcast(stunMsg);
            else network.sendToHost(stunMsg);
          }
          if (proj.vx || proj.vy || proj.knockback) {
            const kx = proj.vx ? proj.vx * 0.35 : Math.cos(proj.angle || 0) * (proj.knockback || 450);
            const ky = proj.vy ? proj.vy * 0.35 : Math.sin(proj.angle || 0) * (proj.knockback || 450);
            const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
            if (network.isHost) network.broadcast(slapMsg);
            else network.sendToHost(slapMsg);
          }
          if (proj.type === 'shotgun_pellet') {
            audio.playBonk();
            cinematics.addScreenShake(3);
            const hitLabel = proj.isCrit ? `CRIT! -${proj.damage} 💥` : `-${proj.damage}`;
            particles.spawnComicText(remote.x, remote.y - 24, hitLabel, proj.isCrit ? '#ff0055' : '#f59e0b');
            particles.spawnDashBurst(remote.x, remote.y, Math.atan2(proj.vy || 0, proj.vx || 0), '#f59e0b');
            return;
          }
          if (proj.type === 'levi_whirlwind') {
            audio.playSnapBladesSlash();
            cinematics.addScreenShake(8);
            particles.spawnComicText(remote.x, remote.y - 24, `BLENDER SLICE! -${proj.damage}`, '#10b981');
            particles.spawnDashBurst(remote.x, remote.y, proj.angle, '#10b981');
          } else if (proj.type === 'odm_gas_boost') {
            audio.playOdmGasHiss();
            particles.spawnComicText(remote.x, remote.y - 24, `GAS BLAST! -${proj.damage}`, '#10b981');
            particles.spawnDashBurst(remote.x, remote.y, proj.angle, '#ffffff');
          } else {
            particles.spawnComicText(remote.x, remote.y - 24, `${(proj.type || 'HIT').toUpperCase().replace(/_/g, ' ')}!`, '#ff2a5f');
          }
        }
      }
    }
  });

  // [T] Key: Cycle Combat Bot / Training Dummy Mode
  if (input.justPressedT && !modalsOpen) {
    const distToDummy = Math.hypot(player.x - dummy.x, player.y - dummy.y);
    if (distToDummy <= 220) {
      const newMode = dummy.cycleMode();
      audio.playHammerSmash();
      particles.spawnComicText(dummy.x, dummy.y - 36, `BOT: ${newMode}!`, '#fde047');
      const modeMsg = { type: 'BOT_MODE_CHANGED', mode: newMode };
      if (network.isHost) network.broadcast(modeMsg);
      else network.sendToHost(modeMsg);
    }
  }

  // [E] Key interactions (Pick up loot OR Open Mirror OR Open Floor Gateway)
  if (input.justPressedE && !modalsOpen) {
    if (currentFloor === 0 && floorStation.isPlayerNearby(player)) {
      openFloorModal();
    } else if (currentFloor === 0 && wardrobeStation.isPlayerNearby(player)) {
      openWardrobe();
    } else {
      tryPickupNearbyLoot();
    }
  }

  // [F] Key: Toggle Floor Selection Modal anytime for instant level testing!
  if (input.justPressedF && !modalsOpen) {
    toggleFloorModal();
  }

  // [Q] Key: Active ability (Checks for Full Set Ultimate first, then Base Chest ability)
  if (input.justPressedQ && !modalsOpen) {
    combat.triggerActiveAbility(player, activeSet, onTriggerCinematic);
  }

  // [R] Key: Manual Reload for Carnage Shotgun
  if (input.justPressedR && !modalsOpen) {
    const isShotgun = player.equipment?.weapon?.visual === 'david_shotgun';
    if (isShotgun && !player.isReloadingShotgun && player.shotgunAmmo < player.maxShotgunAmmo) {
      player.startShotgunReload();
      if (audio.playShotgunPump) audio.playShotgunPump();
      else audio.playShieldLock();
      particles.spawnComicText(player.x, player.y - 30, 'RELOADING... 🔄', '#facc15');
      broadcastMyState();
    }
  }

  // Left Shift Roll
  if (!wasRolling && player.isRolling) {
    audio.playRoll();
    particles.spawnDashBurst(player.x, player.y, Math.atan2(player.rollDirY, player.rollDirX), player.color);
    particles.spawnComicText(player.x, player.y - 12, 'DODGE!', '#00f0ff');
    broadcastMyState();
  }

  // Left Click & Right Click Attacks
  const weaponVisual = player.equipment?.weapon?.visual;

  const performPrimaryAttack = () => {
    const currentWeapon = player.equipment?.weapon;
    const currentWeaponVisual = currentWeapon?.visual;
    const isShotgun = currentWeaponVisual === 'david_shotgun';
    const isDualBlades = currentWeaponVisual === 'dual_snap_blades';

    if (player.triggerAttack()) {
      playWeaponAttackSound(currentWeapon);
      if (isShotgun) {
        particles.spawnComicText(player.x, player.y - 28, `SHELLS: ${player.shotgunAmmo}/4`, '#00ff88');
        cinematics.addScreenShake(7);
        spawnShotgunPellets(player, false);

        const fireMsg = {
          type: 'SHOTGUN_FIRE',
          peerId: network.myPeerId,
          x: player.x,
          y: player.y,
          angle: player.angle
        };
        if (network.isHost) network.broadcast(fireMsg);
        else network.sendToHost(fireMsg);
      } else {
        if (isDualBlades) {
          cinematics.addScreenShake(5);
        }
        handleAttacks();
      }
      broadcastMyState();
      return true;
    } else if (isShotgun && player.isReloadingShotgun) {
      audio.playShieldLock();
      particles.spawnComicText(player.x, player.y - 30, 'RELOADING... 🔄', '#facc15');
      return false;
    }
    return false;
  };

  // Left Click: ODM Cable Launch (if in ODM Mode) OR Standard Weapon Attack (Dual Blades, Shotgun, Swords, etc.)
  if (input.justPressedLeft && !modalsOpen && !player.isStunned) {
    if (player.isOdmMode && isLeviGearEquipped) {
      // Launch high-tension ODM cable towards cursor in world coordinates
      const worldMouseX = (input.mouse.screenX - window.innerWidth / 2) + player.x;
      const worldMouseY = (input.mouse.screenY - window.innerHeight / 2) + player.y;

      const launched = player.fireOdmCable(worldMouseX, worldMouseY, audio, particles, activeBounds);
      if (launched) {
        cinematics.addScreenShake(3);
        player.syncHUD();
        broadcastMyState();
      } else {
        audio.playShieldLock();
        particles.spawnComicText(player.x, player.y - 32, 'OUT OF GAS! 💨', '#ef4444');
      }
    } else {
      performPrimaryAttack();
    }
  }

  // Right Click: ODM Cable Launch (if in ODM Mode) OR 2-Handed Weapon Attack OR Standard Off-hand Slap / Ability
  if (input.justPressedRight && !modalsOpen && !player.isBlocking && !player.isStunned) {
    if (player.isOdmMode && isLeviGearEquipped) {
      // In ODM Mode, Right Click ALSO launches an ODM cable (enables rapid dual cable maneuvering!)
      const worldMouseX = (input.mouse.screenX - window.innerWidth / 2) + player.x;
      const worldMouseY = (input.mouse.screenY - window.innerHeight / 2) + player.y;

      const launched = player.fireOdmCable(worldMouseX, worldMouseY, audio, particles, activeBounds);
      if (launched) {
        cinematics.addScreenShake(3);
        player.syncHUD();
        broadcastMyState();
      } else {
        audio.playShieldLock();
        particles.spawnComicText(player.x, player.y - 32, 'OUT OF GAS! 💨', '#ef4444');
      }
    } else if (player.equipment?.weapon?.hands === 2) {
      // TWO-HANDED WEAPON: Both Left Click and Right Click perform the exact same weapon attack (no barehanded punch!)
      performPrimaryAttack();
    } else {
      if (player.triggerSlap()) {
        const offhandVisual = player.equipment?.offhand?.visual;
        if (offhandVisual === 'reversal_red') {
          audio.playRepulsionBurst();
          cinematics.addScreenShake(6);
          particles.spawnComicText(
            player.x + Math.cos(player.angle) * 36,
            player.y + Math.sin(player.angle) * 36,
            'REVERSAL RED!',
            '#ef4444'
          );
        } else if (offhandVisual === 'sukuna_hiten') {
          audio.playFireSpear();
          cinematics.addScreenShake(5);
          particles.spawnComicText(
            player.x + Math.cos(player.angle) * 36,
            player.y + Math.sin(player.angle) * 36,
            'FIRE THRUST!',
            '#f97316'
          );
        } else if (offhandVisual === 'tome') {
          audio.playBarrierHum();
          particles.spawnComicText(
            player.x + Math.cos(player.angle) * 32,
            player.y + Math.sin(player.angle) * 32,
            'RUNE PULSE!',
            '#a855f7'
          );
        } else if (offhandVisual === 'david_gorilla_arms') {
          if (audio.playGorillaPunch) audio.playGorillaPunch();
          else audio.playHeavyGreatswordSwing();
          if (player.startLunge) {
            player.startLunge(player.angle, 620, 0.16); // rapid forward punch lunge
          }
          cinematics.addScreenShake(8);
          particles.spawnComicText(
            player.x + Math.cos(player.angle) * 36,
            player.y + Math.sin(player.angle) * 36,
            'GORILLA SMASH! 🦾',
            '#00ff88'
          );
          particles.spawnDashBurst(player.x, player.y, player.angle, '#00ff88');
        } else {
          audio.playBonk();
          particles.spawnComicText(
            player.x + Math.cos(player.angle) * 32,
            player.y + Math.sin(player.angle) * 32,
            'BONK!',
            '#ff0055'
          );
        }
        handleOffhandAttack();
        broadcastMyState();
      }
    }
  }

  // 2. Update particles
  particles.update(dt);

  // 3. Render frame with screen shake
  const shake = cinematics.getShakeOffset();
  renderer.clear();

  // Camera directly follows each individual player with screen shake
  const targetCamX = player.x;
  const targetCamY = player.y;

  renderer.beginCamera(targetCamX + shake.x, targetCamY + shake.y);

  if (currentFloor === 0) {
    // Safe Lobby Base Camp
    renderer.drawDungeonFloor(dungeonBounds);

    // Ready Ritual Circle
    readyCircle.draw(renderer.ctx);

    // Corner torches
    renderer.drawTorch(-560, -560, now * 0.001);
    renderer.drawTorch(560, -560, now * 0.001);
    renderer.drawTorch(-560, 560, now * 0.001);
    renderer.drawTorch(560, 560, now * 0.001);

    // Wardrobe Station
    wardrobeStation.draw(renderer.ctx, player);

    // Floor Selector Gateway Station
    floorStation.draw(renderer.ctx, player);

    // Training Dummy / Combat Automaton
    dummy.draw(renderer.ctx, Math.hypot(player.x - dummy.x, player.y - dummy.y) <= 180);
  } else if (currentFloor >= 1 && currentDungeon) {
    // Procedural Anime Dungeon (Isaac-style discrete rooms & cardinal doors)
    renderer.drawDungeon(currentDungeon, targetCamX, targetCamY, renderer.width, renderer.height, now * 0.001);

    // Themed Anime Monsters (Fly Heads, Masked Ino, Cursed Brutes, Boss Finger Bearer)
    renderer.drawMonsters(monsterManager.monsters, now * 0.001);
  }

  // Ground Loot Items (with glowing rarity beams and proximity [E] pickup)
  for (const [_, loot] of groundItems.entries()) {
    loot.draw(renderer.ctx, loot.isNear(player));
  }

  // Dash after-images & particles
  renderer.drawAfterImages(player.afterImages);
  particles.draw(renderer.ctx);

  // Draw in-world cinematic projectiles (Hollow Purple, World Cutting Slash, Chains)
  cinematics.drawWorld(renderer.ctx);

  // Draw remote peers
  for (const [_, remote] of network.remotePlayers.entries()) {
    renderer.drawCharacter(remote);
  }

  // Draw local player
  renderer.drawCharacter(player);

  renderer.endCamera();

  // Screen-space UI overlays for procedural dungeon
  if (currentFloor >= 1 && currentDungeon) {
    renderer.drawRoomBanner(currentDungeon, renderer.width, renderer.height);
    if (currentDungeon.currentRoom && currentDungeon.currentRoom.type === 'boss') {
      renderer.drawBossHUD(monsterManager.getBoss(), renderer.width);
    }
    renderer.drawMinimap(currentDungeon, renderer.width, renderer.height);
  }

  // Full-screen post-processing cinematic overlays (Dark purple vortex, screen bisection cut, blood-red vignette)
  cinematics.drawScreenOverlay(renderer.ctx, renderer.width, renderer.height);

    // 4. Clear single-frame input flags
    input.endFrame();
  } catch (err) {
    console.error('gameLoop tick error:', err);
  } finally {
    requestAnimationFrame(gameLoop);
  }
}

requestAnimationFrame(gameLoop);
console.log('Step 3.4.3: Cinematic ultimates, projectile math, and set bonus attacks active');
