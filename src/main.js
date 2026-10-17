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
import { ITEM_CATALOG, ItemRarity, checkSetBonus, getRandomDungeonLoot, executeTradeUp, executeGachaSpin, getItemSellPrice, SLOP_SELL_VALUES, NEXT_RARITY_TIER } from './items.js';
import { CombatSystem } from './combat.js';
import { GroundLoot } from './groundLoot.js';
import { CinematicManager } from './cinematics.js';
import { Dungeon, DUNGEON_THEMES } from './dungeon.js';
import { Monster, MonsterManager } from './monster.js';
import { SlopMerchant } from './slopMerchant.js';
import { WheelAltar } from './wheelAltar.js';
import { BlackjackTable } from './blackjackTable.js';
import { DevArmoryChest } from './devArmoryChest.js';
import { SettingsManager } from './settings.js';
import { sanitizePlayerName, validateCombatDamage, validatePosition, validateSlopsAmount } from './security.js';
import { defaultModalManager as modalManager } from './modalManager.js';
import { ModalController } from './controllers/modalController.js';
import { StationController } from './controllers/stationController.js';
import { defaultEventBus } from './eventBus.js';
import { initHudPresenter } from './presenters/hudPresenter.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const input = new InputManager();
const player = new Player(0, 0);

// Initialize decoupled Presentation Adapter for Domain HUD events (ADR-001)
initHudPresenter(defaultEventBus);

// Start with standard starter adventurer gear (clean roguelike progression)
player.equipItem(ITEM_CATALOG['rusty_sword']);
player.equipItem(ITEM_CATALOG['leather_tunic']);
player.equipItem(ITEM_CATALOG['cloth_pants']);
player.equipItem(ITEM_CATALOG['travel_boots']);

// Store backup wooden buckler in backpack inventory
player.inventory.push(
  ITEM_CATALOG['wooden_buckler']
);

const settings = new SettingsManager();
const audio = new AudioManager();
audio.setMasterVolume(settings.settings.masterVolume / 100);
audio.setSfxVolume(settings.settings.sfxVolume / 100);
audio.setBgmVolume(settings.settings.bgmVolume / 100);
audio.setMuted(settings.settings.isMuted);

const particles = new ParticleManager(settings);
const network = new NetworkManager();
const combat = new CombatSystem(audio, particles);
const cinematics = new CinematicManager(settings);

// Lobby entities
const dummy = new Dummy(0, -180);
const readyCircle = new ReadyCircle(0, 160, 75);
const wardrobeStation = new CustomizationStation(-240, -120);
const floorStation = new FloorSelectStation(240, -120);
const devArmoryChest = new DevArmoryChest(-240, 160);

// Ground loot items in world (trading & dungeon drops) - clean base camp floor
const groundItems = new Map();

const dungeonBounds = { minX: -600, minY: -600, maxX: 600, maxY: 600 };

// Auto-initialize audio and procedural BGM on user gesture
const unlockAudio = () => {
  audio.init();
  if (audio.initialized) {
    if (currentFloor === 0) {
      audio.updateBgmTrack('lobby');
    } else if (currentFloor >= 1) {
      if (currentDungeon && currentDungeon.currentRoom && currentDungeon.currentRoom.type === 'boss') {
        audio.updateBgmTrack('boss');
      } else {
        audio.updateBgmTrack('dungeon');
      }
    }
  }
};
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('mousedown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('click', unlockAudio, { passive: true });

// Floor Progression & Monster Management
let currentFloor = 0; // 0 = Safe Lobby Base Camp, 1+ = Procedural Dungeon Floors
let currentDungeon = null;
let slopMerchant = null;
let wheelAltar = null;
let blackjackTable = null;
let blackjackGame = null;
async function getBlackjackGame() {
  if (!blackjackGame) {
    const { BlackjackGame } = await import('./blackjack.js');
    blackjackGame = new BlackjackGame();
  }
  return blackjackGame;
}
const monsterManager = new MonsterManager();

// --- SHARED SLOPS PARTY WALLET & COIN DROPS ---
let sharedSlops = 100; // Starter party funds
const slopCoins = [];

function updateSlopsUI() {
  const hudSlops = document.getElementById('hud-slops-amount');
  if (hudSlops) hudSlops.textContent = sharedSlops.toLocaleString();
  const merchantSlops = document.getElementById('merchant-slops-amount');
  if (merchantSlops) merchantSlops.textContent = `${sharedSlops.toLocaleString()} SLOPS`;
}

function broadcastSlops() {
  const msg = { type: 'SLOPS_SYNC', amount: sharedSlops };
  if (network.isHost) network.broadcast(msg);
  else network.sendToHost(msg);
}

// --- RUN STATISTICS TRACKER (STEP 5.2) ---
const runStats = {
  startTime: null,
  totalKills: 0,
  slopsEarned: 0,
  damageDealt: new Map(), // peerId or 'local' -> damage number
  isRunOver: false,
  highestFloor: 0
};

function recordDamageDealt(source = 'local', amount = 0) {
  if (!amount || amount <= 0) return;
  const current = runStats.damageDealt.get(source) || 0;
  runStats.damageDealt.set(source, current + amount);
}

function getRunMvp() {
  let highestDmg = 0;
  let mvpName = player.name || 'Hero';

  for (const [peerId, dmg] of runStats.damageDealt.entries()) {
    if (dmg > highestDmg) {
      highestDmg = dmg;
      if (peerId === 'local') {
        mvpName = player.name || 'Hero';
      } else {
        const remote = network.remotePlayers.get(peerId);
        mvpName = remote ? (remote.name || `Player ${peerId.slice(0, 4)}`) : 'Teammate';
      }
    }
  }
  return { name: mvpName, damage: highestDmg };
}

class SlopCoin {
  constructor(x, y, value = 5, targetPlayer = null) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 140;
    this.vy = (Math.random() - 0.5) * 140;
    this.value = value;
    this.radius = 8;
    this.magnetRange = 95;
    this.bounce = Math.random() * Math.PI * 2;
    this.targetPlayer = targetPlayer;
    this.homingDelay = 1.0; // 1 second after dropping, fly directly to killer player!
    this.homingSpeed = 220;
  }
  update(dt, localPlayer) {
    this.vx *= 0.91;
    this.vy *= 0.91;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.bounce += dt * 6;

    // Normal local proximity magnet (within 95px)
    if (localPlayer) {
      const dist = Math.hypot(localPlayer.x - this.x, localPlayer.y - this.y);
      if (dist <= this.magnetRange && dist > 1) {
        const pull = (1 - dist / this.magnetRange) * 520;
        this.x += ((localPlayer.x - this.x) / dist) * pull * dt;
        this.y += ((localPlayer.y - this.y) / dist) * pull * dt;
      }
    }

    // Homing flight towards the killer player if left uncollected!
    if (this.homingDelay > 0) {
      this.homingDelay -= dt;
    }
    if (this.homingDelay <= 0) {
      const dest = (this.targetPlayer && !this.targetPlayer.isDead) ? this.targetPlayer : localPlayer;
      if (dest) {
        const dx = dest.x - this.x;
        const dy = dest.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          this.homingSpeed = Math.min(880, this.homingSpeed + dt * 1100);
          this.x += (dx / dist) * this.homingSpeed * dt;
          this.y += (dy / dist) * this.homingSpeed * dt;
        }
      }
    }
  }
  draw(ctx) {
    ctx.save();
    const bobY = Math.sin(this.bounce) * 3;
    ctx.translate(this.x, this.y + bobY);
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = (this.homingDelay <= 0) ? 14 : 8;
    ctx.fillStyle = (this.homingDelay <= 0) ? '#fde047' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, 0);
    ctx.restore();
  }
}

function spawnSlopCoins(x, y, count, valuePerCoin = 5, targetPlayer = null) {
  for (let i = 0; i < count; i++) {
    slopCoins.push(new SlopCoin(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, valuePerCoin, targetPlayer));
  }
}

// Initial UI sync
updateSlopsUI();

// Monster Death Callbacks
monsterManager.onMonsterKilled = (monster) => {
  if (currentFloor >= 1) {
    runStats.totalKills++;
  }
  const isCyber = monster.theme === 'cyberpunk' || (currentDungeon && currentDungeon.themeKey === 'cyberpunk');
  const isAot = monster.theme === 'aot' || (currentDungeon && currentDungeon.themeKey === 'aot');
  const isBerserk = monster.theme === 'berserk' || (currentDungeon && currentDungeon.themeKey === 'berserk');
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
    } else if (isBerserk) {
      killText = 'APOSTLE PURGED! 🩸';
      killColor = '#ef4444';
      burstColor = '#dc2626';
    }
    particles.spawnComicText(monster.x, monster.y - 20, killText, killColor);
    particles.spawnDashBurst(monster.x, monster.y, 0, burstColor);
  }
  cinematics.addScreenShake(3);

  // Drop Slops coins from defeated monster! (Will home towards the killer player if left uncollected)
  const killer = monster.lastAttacker || player;

  if (monster.archetype === 'exploder' && !monster.hasExploded) {
    particles.spawnComicText(monster.x, monster.y - 38, 'DISARMED! +4 SLOPS 🪙', '#fde047');
    spawnSlopCoins(monster.x, monster.y, 4, 5, killer);
  } else if (monster.archetype === 'shaman') {
    particles.spawnComicText(monster.x, monster.y - 38, 'WARD CRUSHED! +3 SLOPS 🪙', '#38bdf8');
    spawnSlopCoins(monster.x, monster.y, 3, 5, killer);
  }

  spawnSlopCoins(monster.x, monster.y, 2 + Math.floor(Math.random() * 3), 5, killer);

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
  } else if (currentDungeon && currentDungeon.themeKey === 'berserk') {
    bossTitle = 'NOSFERATU ZODD SLAIN! 🏆🩸';
    bossColor = '#ef4444';
  }
  particles.spawnComicText(boss.x, boss.y - 40, bossTitle, bossColor);

  if (currentDungeon) {
    // Drop fountain of diverse Mythic / Legendary anime loot!
    if (!network.isJoined || network.isHost) {
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
        const dropId = `boss_drop_${idx}_${Date.now()}`;
        const lootObj = new GroundLoot(item, lx, ly, dropId);
        groundItems.set(lootObj.id, lootObj);

        if (network.isHost && network.peers.size > 0) {
          network.broadcast({
            type: 'LOOT_SPAWNED',
            item,
            x: lx,
            y: ly,
            id: dropId
          });
        }
      });
    }

    // Shower of Slops coins for vanquishing the Floor Guardian!
    spawnSlopCoins(boss.x, boss.y, 14, 15);

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
      else if (currentDungeon.themeKey === 'berserk') clearTitle = 'NOSFERATU ZODD SLAIN!';
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
      else if (currentDungeon.themeKey === 'berserk') pendingTitle = 'IMMORTAL APOSTLE DOWN!';
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

function hasStandingTeammates() {
  if (!network.remotePlayers || network.remotePlayers.size === 0) {
    return false;
  }
  return [...network.remotePlayers.values()].some(r => r && !r.isDowned && !r.isDead);
}

function hitPlayer(damage, angle, knockback, sourceLabel = null, color = '#ef4444') {
  const canBeDowned = hasStandingTeammates();
  const res = player.takeDamage(damage, angle, knockback, canBeDowned);
  if (!res) return false;

  if (res.becameDead) {
    audio.playBonk();
    cinematics.addScreenShake(12);
    particles.spawnComicText(player.x, player.y - 28, 'YOU DIED! 💀', '#ef4444');
  } else if (res.becameDowned) {
    audio.playPlayerDowned();
    cinematics.addScreenShake(12);
    particles.spawnComicText(player.x, player.y - 28, 'DOWNED! 🩸 CRAWL TO TEAMMATES!', '#ef4444');
  } else if (res.isBleedAccelerated) {
    audio.playBonk();
    cinematics.addScreenShake(4);
    particles.spawnComicText(player.x, player.y - 22, `-3.0s BLEED! 🩸 (${Math.ceil(res.downedTimer)}s)`, '#ef4444');
  } else {
    audio.playBonk();
    const statusText = player.isBerserk ? `-${res.damage} (UNSTOPPABLE! 🩸)` : (res.isBlocked ? 'BLOCKED! 🛡️' : (sourceLabel || `-${res.damage}`));
    particles.spawnComicText(player.x, player.y - 24, statusText, player.isBerserk ? '#ef4444' : (res.isBlocked ? '#38bdf8' : color));
  }
  player.syncHUD();
  broadcastMyState();
  return res;
}

function applyDamageToTarget(target, damage, angle, knockback, sourceLabel, color) {
  if (!target) return;
  if (target === player) {
    hitPlayer(damage, angle, knockback, sourceLabel, color);
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

  // Authoritative loot spawn: Host spawns and broadcasts to all clients
  if (network.isJoined && !network.isHost) return;

  // Spawn diverse, theme-appropriate room clear reward directly on the ground (no obstacle pots!)
  const roomLoot = getRandomDungeonLoot(currentDungeon ? currentDungeon.themeKey : 'jjk', {
    minRarity: 'RARE'
  });

  if (roomLoot) {
    const lootObj = new GroundLoot(roomLoot, room.centerX, room.centerY, `room_reward_${room.id}_${Date.now()}`);
    groundItems.set(lootObj.id, lootObj);
    particles.spawnComicText(room.centerX, room.centerY - 24, `${roomLoot.name.toUpperCase()}! 🎁`, '#00ff88');

    if (network.isHost && network.peers.size > 0) {
      network.broadcast({
        type: 'LOOT_SPAWNED',
        item: roomLoot,
        x: room.centerX,
        y: room.centerY,
        id: lootObj.id
      });
    }

    // 45% chance of a second diverse drop
    if (Math.random() < 0.45) {
      const extraLoot = getRandomDungeonLoot(currentDungeon ? currentDungeon.themeKey : 'jjk', {
        excludeIds: [roomLoot.id]
      });
      if (extraLoot) {
        const lootObj2 = new GroundLoot(extraLoot, room.centerX + 36, room.centerY, `extra_reward_${room.id}_${Date.now()}`);
        groundItems.set(lootObj2.id, lootObj2);
        if (network.isHost && network.peers.size > 0) {
          network.broadcast({
            type: 'LOOT_SPAWNED',
            item: extraLoot,
            x: room.centerX + 36,
            y: room.centerY,
            id: lootObj2.id
          });
        }
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
        } else if (m === 3) {
          // 1 Kamikaze Exploder
          monsterType = 'arasaka_drone_suicide';
          archetype = 'exploder';
          hp = 48;
          radius = 18;
          speed = 230;
          name = 'Arasaka Suicide Drone';
        } else if (m === 4) {
          // 1 Support Shaman Buffer
          monsterType = 'netrunner_overseer';
          archetype = 'shaman';
          hp = 125;
          radius = 22;
          speed = 135;
          name = 'Netrunner Overseer';
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
        } else if (m === 3) {
          // 1 Kamikaze Exploder
          monsterType = 'pure_titan_bomb';
          archetype = 'exploder';
          hp = 50;
          radius = 19;
          speed = 225;
          name = 'Volatile Abnormal Titan';
        } else if (m === 4) {
          // 1 Support Shaman Buffer
          monsterType = 'marleyan_commander';
          archetype = 'shaman';
          hp = 130;
          radius = 23;
          speed = 130;
          name = 'Marleyan Signal Commander';
        } else {
          // Pure Titan Swarmers
          monsterType = 'crawler_titan';
          archetype = 'swarmer';
          hp = 44;
          radius = 18;
          speed = 185;
          name = 'Pure Titan Crawler';
        }
      } else if (theme === 'berserk') {
        if (m === 0) {
          // 1 Heavy Brute per chamber
          monsterType = 'executioner_brute';
          archetype = 'brute';
          hp = 290;
          radius = 30;
          speed = 78;
          name = 'Torturer Executioner';
        } else if (m === 1 || m === 2) {
          // 2 Ranged Casters per chamber
          monsterType = 'eclipse_heretic';
          archetype = 'ranged';
          hp = 78;
          radius = 20;
          speed = 115;
          name = 'Eclipse Heretic';
        } else if (m === 3) {
          // 1 Kamikaze Exploder
          monsterType = 'apostle_hound';
          archetype = 'exploder';
          hp = 50;
          radius = 19;
          speed = 230;
          name = 'Apostle Demonic Hound';
        } else if (m === 4) {
          // 1 Support Shaman Buffer
          monsterType = 'apostle_shaman';
          archetype = 'shaman';
          hp = 135;
          radius = 23;
          speed = 125;
          name = 'Egg Apostle Shaman';
        } else {
          // Possessed Corpse Swarmers
          monsterType = 'corpse_legionary';
          archetype = 'swarmer';
          hp = 46;
          radius = 18;
          speed = 180;
          name = 'Possessed Corpse Legionary';
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
        } else if (m === 3) {
          // 1 Kamikaze Exploder
          monsterType = 'cursed_bomb_bug';
          archetype = 'exploder';
          hp = 46;
          radius = 18;
          speed = 230;
          name = 'Volatile Curse Beetle';
        } else if (m === 4) {
          // 1 Support Shaman Buffer
          monsterType = 'cursed_shaman';
          archetype = 'shaman';
          hp = 120;
          radius = 22;
          speed = 130;
          name = 'Cursed Ward Shaman';
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
          } else if (theme === 'berserk') {
            audio.playClang();
            applyDamageToTarget(target, 14, monster.angle, 170, '-14 (RUSTED FALCHION)', '#ef4444');
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
          } else if (theme === 'berserk') {
            audio.playCursedEnergyBeam();
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: monster.x,
              y: monster.y,
              vx: Math.cos(monster.angle) * 310,
              vy: Math.sin(monster.angle) * 310,
              damage: 24,
              caster: monster,
              color: '#ef4444',
              radius: 11,
              life: 2.2,
              maxDist: 520
            });
            particles.spawnComicText(monster.x, monster.y - 24, 'BLOOD CURSE!', '#dc2626');
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
          } else if (theme === 'berserk') {
            audio.playClang();
            audio.playCleaverSlash();
            cinematics.addScreenShake(11);
            particles.spawnDashBurst(monster.x, monster.y, 0, '#ef4444');
            particles.spawnComicText(monster.x, monster.y - 30, 'EXECUTIONER CLEAVE! 🪓', '#ef4444');
            if (target) {
              const dist = Math.hypot(target.x - monster.x, target.y - monster.y);
              if (dist <= monster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 44, monster.angle, 580, '-44 HEAVY CLEAVE!', '#ef4444');
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
      } else if (archetype === 'exploder') {
        monster.onPrimeStart = () => {
          particles.spawnComicText(monster.x, monster.y - 30, '⚠️ PRIMING! 1.0s', '#ef4444');
        };
        monster.onBeep = () => {
          audio.playFuseBeep();
        };
        monster.onExplode = (m) => {
          audio.playExplosion();
          cinematics.addScreenShake(16);
          particles.spawnDashBurst(m.x, m.y, 0, '#ef4444');
          particles.spawnComicText(m.x, m.y - 36, '💥 KAMIKAZE DETONATION! 65 DMG', '#ef4444');

          // AoE damage to players
          const allPlayers = [player, ...network.remotePlayers.values()].filter(p => p && !p.isDead);
          for (const p of allPlayers) {
            const pDist = Math.hypot(p.x - m.x, p.y - m.y);
            if (pDist <= m.explosionRadius + (p.radius || 22)) {
              const pAng = Math.atan2(p.y - m.y, p.x - m.x);
              applyDamageToTarget(p, m.explosionDamage, pAng, 650, '-65 KAMIKAZE BLAST! 💥', '#ef4444');
            }
          }

          // AoE damage to other monsters within radius!
          const otherMonsters = monsterManager.getNearbyMonsters(m.x, m.y, m.explosionRadius);
          for (const other of otherMonsters) {
            if (other !== m && !other.isDead) {
              const oAng = Math.atan2(other.y - m.y, other.x - m.x);
              other.takeHit(m.explosionDamage, oAng, 550, true);
              particles.spawnComicText(other.x, other.y - 20, '-65 BLAST! 💥', '#f97316');
            }
          }
        };
      } else if (archetype === 'shaman') {
        monster.onChannelStart = (m) => {
          particles.spawnComicText(m.x, m.y - 32, '✨ CHANTING WARD... ✨', '#fbbf24');
        };
        monster.onShamanBuff = (m, buffedTargets) => {
          audio.playShamanBuff();
          cinematics.addScreenShake(7);
          particles.spawnDashBurst(m.x, m.y, 0, '#fbbf24');
          particles.spawnComicText(m.x, m.y - 36, '🛡️ PROTECTIVE WARD! +40', '#fde047');
          for (const target of buffedTargets) {
            particles.spawnComicText(target.x, target.y - 24, 'WARDED! +40 🛡️', '#38bdf8');
            particles.spawnDashBurst(target.x, target.y, 0, '#38bdf8');
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
    } else if (theme === 'berserk') {
      // Floor 4 Boss: Nosferatu Zodd (The Immortal Apostle)
      const boss = new Monster({
        id: `boss_fl${dungeon.floorNumber}_${Date.now()}`,
        type: 'nosferatu_zodd',
        name: 'Nosferatu Zodd (The Immortal)',
        theme,
        archetype: 'boss',
        x: dungeon.bossRoom.centerX,
        y: dungeon.bossRoom.centerY - 50,
        hp: 1250,
        radius: 48,
        speed: 92,
        deathType: 'apostle_dissolve',
        roomId: dungeon.bossRoom.id,
        isActive: false // Dormant until player enters Boss Sanctum!
      });

      boss.onPhase2Trigger = (b) => {
        audio.playBerserkRoar();
        audio.playClang();
        cinematics.addScreenShake(20);
        particles.spawnComicText(b.x, b.y - 55, 'APOSTLE AWAKENING: BEAST OF DARKNESS! 🦇🩸', '#ef4444');
        particles.spawnDashBurst(b.x, b.y, 0, '#dc2626');
        b.radius = 58;
        b.baseSpeed = 115;
      };

      boss.onBossStartDying = (b) => {
        audio.playBerserkRoar();
        cinematics.addScreenShake(16);
        particles.spawnComicText(b.x, b.y - 45, 'APOSTLE DISSOLUTION... 🩸', '#ef4444');
      };

      // Boss Windup Telegraph Callbacks
      boss.onBossWindup = (attackIndex, phase, duration) => {
        if (attackIndex === 1) {
          const text = phase === 2 ? '🦇 SUPERSONIC APOSTLE DIVE! 🩸' : '⚠️ SCIMITAR HEAVY CLEAVE!';
          const col = phase === 2 ? '#dc2626' : '#f97316';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 2) {
          const text = phase === 2 ? '🩸 CONCUSSIVE BLOODLUST ROAR! 📢' : '⚠️ FLYING CLEAVER THROW! 🪓';
          const col = phase === 2 ? '#b91c1c' : '#fb923c';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        } else if (attackIndex === 3) {
          const text = phase === 2 ? '🌌 ECLIPSE MAELSTROM 12-ORB NOVA! 🩸' : '⚠️ 4-WAY SEISMIC STOMP! 💥';
          const col = phase === 2 ? '#7f1d1d' : '#ef4444';
          particles.spawnComicText(boss.x, boss.y - 48, text, col);
        }
      };

      // Attack 1: Melee / Dive (Phase 1: Colossal Scimitar Cleave -> Phase 2: Supersonic Winged Dive Tackle)
      boss.onBossAttack1 = (target, phase) => {
        if (phase === 2) {
          audio.playBerserkRoar();
          audio.playClang();
          boss.vx = Math.cos(boss.angle) * 450;
          boss.vy = Math.sin(boss.angle) * 450;
          cinematics.addScreenShake(18);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#dc2626');
          particles.spawnComicText(boss.x, boss.y - 40, 'APOSTLE DIVE TACKLE! 🦇🩸', '#dc2626');
          applyDamageToTarget(target, 48, boss.angle, 650, '-48 APOSTLE TACKLE!', '#dc2626');
        } else {
          audio.playClang();
          cinematics.addScreenShake(8);
          particles.spawnDashBurst(boss.x, boss.y, boss.angle, '#f97316');
          applyDamageToTarget(target, 34, boss.angle, 450, '-34 SCIMITAR CLEAVE!', '#f97316');
        }
      };

      // Attack 2: Ranged / Wave (Phase 1: Flying Cleaver Throw -> Phase 2: Concussive Bloodlust Roar 5-Orb Wave)
      boss.onBossAttack2 = (target, phase) => {
        if (phase === 2) {
          audio.playBerserkRoar();
          cinematics.addScreenShake(16);
          particles.spawnComicText(boss.x, boss.y - 50, 'BLOODLUST ROAR! 📢🩸', '#ef4444');
          for (let b = -2; b <= 2; b++) {
            const beamAngle = boss.angle + b * 0.28;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(beamAngle) * 36,
              y: boss.y + Math.sin(beamAngle) * 36,
              vx: Math.cos(beamAngle) * 440,
              vy: Math.sin(beamAngle) * 440,
              damage: 38,
              caster: boss,
              color: '#ef4444',
              radius: 18,
              life: 2.6,
              maxDist: 850
            });
          }
        } else {
          audio.playCleaverSlash();
          cinematics.addScreenShake(7);
          particles.spawnComicText(boss.x, boss.y - 50, 'FLYING CLEAVER! 🪓', '#f97316');
          cinematics.spawnProjectile({
            type: 'bot_energy_orb',
            x: boss.x + Math.cos(boss.angle) * 32,
            y: boss.y + Math.sin(boss.angle) * 32,
            vx: Math.cos(boss.angle) * 380,
            vy: Math.sin(boss.angle) * 380,
            damage: 32,
            caster: boss,
            color: '#f97316',
            radius: 16,
            life: 2.4,
            maxDist: 800
          });
        }
      };

      // Attack 3: Ground Stomp / AoE Nova (Phase 1: 4-Way Seismic Stomp -> Phase 2: 12-Orb Eclipse Maelstrom Nova)
      boss.onBossAttack3 = (target, phase) => {
        if (phase === 2) {
          audio.playEnrageRoar();
          cinematics.addScreenShake(18);
          particles.spawnComicText(boss.x, boss.y - 50, 'ECLIPSE MAELSTROM NOVA! 🌌🩸', '#dc2626');
          for (let k = 0; k < 12; k++) {
            const kAngle = (k / 12) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 36,
              y: boss.y + Math.sin(kAngle) * 36,
              vx: Math.cos(kAngle) * 310,
              vy: Math.sin(kAngle) * 310,
              damage: 36,
              caster: boss,
              color: '#dc2626',
              radius: 16,
              life: 2.8,
              maxDist: 800
            });
          }
        } else {
          audio.playTitanThud();
          cinematics.addScreenShake(10);
          particles.spawnComicText(boss.x, boss.y - 50, 'SEISMIC STOMP! 💥', '#ef4444');
          for (let k = 0; k < 4; k++) {
            const kAngle = (k / 4) * Math.PI * 2;
            cinematics.spawnProjectile({
              type: 'bot_energy_orb',
              x: boss.x + Math.cos(kAngle) * 30,
              y: boss.y + Math.sin(kAngle) * 30,
              vx: Math.cos(kAngle) * 260,
              vy: Math.sin(kAngle) * 260,
              damage: 30,
              caster: boss,
              color: '#ef4444',
              radius: 14,
              life: 2.2,
              maxDist: 600
            });
          }
        }
      };

      monsterManager.addMonster(boss);

      // Spawn 3 Elite Apostle Escort guards (1 Executioner Brute, 2 Eclipse Heretics)
      const escorts = [
        { type: 'executioner_brute', archetype: 'brute', hp: 280, radius: 28, speed: 82, ox: -160, oy: 60, name: 'Elite Apostle Executioner' },
        { type: 'eclipse_heretic', archetype: 'ranged', hp: 85, radius: 20, speed: 120, ox: 160, oy: -80, name: 'Elite Eclipse Heretic' },
        { type: 'eclipse_heretic', archetype: 'ranged', hp: 85, radius: 20, speed: 120, ox: -160, oy: -80, name: 'Elite Eclipse Heretic' }
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
              type: 'bot_energy_orb',
              x: escortMonster.x,
              y: escortMonster.y,
              vx: Math.cos(escortMonster.angle) * 350,
              vy: Math.sin(escortMonster.angle) * 350,
              damage: 24,
              caster: escortMonster,
              color: '#ef4444',
              radius: 12,
              life: 2.4,
              maxDist: 650
            });
            particles.spawnComicText(escortMonster.x, escortMonster.y - 24, 'BLOOD CURSE! 🩸', '#ef4444');
          };
        } else if (esc.archetype === 'brute') {
          escortMonster.onBruteSlam = (target) => {
            audio.playClang();
            audio.playHammerSmash();
            cinematics.addScreenShake(10);
            particles.spawnDashBurst(escortMonster.x, escortMonster.y, 0, '#ef4444');
            particles.spawnComicText(escortMonster.x, escortMonster.y - 30, 'EXECUTION CLEAVE! 🩸', '#ef4444');
            if (target) {
              const dist = Math.hypot(target.x - escortMonster.x, target.y - escortMonster.y);
              if (dist <= escortMonster.radius * 2.2 + (target.radius || 24)) {
                applyDamageToTarget(target, 40, escortMonster.angle, 520, '-40 EXECUTION CLEAVE!', '#ef4444');
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

function resetPlayerToStarterGear() {
  if (player.equipment) {
    player.equipment.helmet = null;
    player.equipment.chest = null;
    player.equipment.pants = null;
    player.equipment.boots = null;
    player.equipment.weapon = null;
    player.equipment.offhand = null;
  }
  player.inventory = [];

  if (ITEM_CATALOG['rusty_sword']) player.equipItem(ITEM_CATALOG['rusty_sword']);
  if (ITEM_CATALOG['leather_tunic']) player.equipItem(ITEM_CATALOG['leather_tunic']);
  if (ITEM_CATALOG['cloth_pants']) player.equipItem(ITEM_CATALOG['cloth_pants']);
  if (ITEM_CATALOG['travel_boots']) player.equipItem(ITEM_CATALOG['travel_boots']);
  if (ITEM_CATALOG['wooden_buckler']) player.inventory.push(ITEM_CATALOG['wooden_buckler']);

  player.odmGasCharges = player.maxOdmGasCharges || 10;
  player.shotgunAmmo = player.maxShotgunAmmo || 4;

  player.syncHUD();
  if (invModal && !invModal.classList.contains('hidden')) renderInventoryUI();
  broadcastMyState();
}

function dropAllPlayerItemsOnDeath(deadPlayer) {
  if (currentFloor === 0) return; // Only in dungeon floors

  const itemsToDrop = [];

  // Drop all equipped gear
  if (deadPlayer.equipment) {
    const slots = ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand'];
    for (const slot of slots) {
      if (deadPlayer.equipment[slot]) {
        itemsToDrop.push(deadPlayer.equipment[slot]);
        deadPlayer.equipment[slot] = null;
      }
    }
  }

  // Drop all backpack inventory items
  if (deadPlayer.inventory && deadPlayer.inventory.length > 0) {
    while (deadPlayer.inventory.length > 0) {
      itemsToDrop.push(deadPlayer.inventory.pop());
    }
  }

  if (itemsToDrop.length === 0) return;

  // Scatter items around death position
  itemsToDrop.forEach((item, idx) => {
    const angle = (idx / itemsToDrop.length) * Math.PI * 2;
    const dist = 36 + (idx % 2) * 16;
    const dropX = deadPlayer.x + Math.cos(angle) * dist;
    const dropY = deadPlayer.y + Math.sin(angle) * dist;
    const dropId = `death_drop_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;
    const newDrop = new GroundLoot(item, dropX, dropY, dropId);
    groundItems.set(newDrop.id, newDrop);

    const dropMsg = {
      type: 'LOOT_SPAWNED',
      id: newDrop.id,
      item: newDrop.item,
      x: dropX,
      y: dropY
    };
    if (network.isHost) network.broadcast(dropMsg);
    else network.sendToHost(dropMsg);
  });

  audio.playBonk();
  cinematics.addScreenShake(8);
  particles.spawnComicText(deadPlayer.x, deadPlayer.y - 40, '💥 DROPPED GEAR! 🎒', '#f87171');

  deadPlayer.syncHUD();
  if (invModal && !invModal.classList.contains('hidden')) renderInventoryUI();
  broadcastMyState();
}

function startFloorDescent(floorNumber, broadcast = true) {
  readyCircle.reset();
  // Ensure any dev or floor menus are closed
  closeDevArmoryModal();
  closeFloorModal();

  const wasFromLobby = currentFloor === 0;
  // If descending from lobby (currentFloor === 0), reset lobby armor to starter gear!
  if (wasFromLobby) {
    resetPlayerToStarterGear();
    particles.spawnComicText(player.x, player.y - 30, 'LOBBY GEAR RESET TO STARTER! 🛡️', '#38bdf8');
  }

  currentFloor = floorNumber;
  audio.playDescentFanfare();
  cinematics.addScreenShake(10);

  // Initialize or reset run stats when entering any dungeon floor from base camp or on Floor 1
  if (wasFromLobby || floorNumber === 1 || !runStats.startTime) {
    runStats.startTime = performance.now();
    runStats.totalKills = 0;
    runStats.slopsEarned = 0;
    runStats.damageDealt.clear();
    runStats.damageDealt.set('local', 0);
  }
  runStats.isRunOver = false;
  runStats.highestFloor = Math.max(runStats.highestFloor, floorNumber);

  // Restore player from downed or dead state upon starting a new floor/run
  const wasDead = player.isDead || player.isDowned;
  player.isDowned = false;
  player.isDead = false;
  player.hasDroppedLootOnDeath = false;
  player.downedTimer = 0;
  player.reviveProgress = 0;
  player.hp = player.maxHp;
  player.syncHUD();

  // If player was dead on previous floor and dropped gear, re-equip starter gear so they can fight!
  if (wasDead && !player.equipment?.weapon) {
    if (ITEM_CATALOG['rusty_sword']) player.equipItem(ITEM_CATALOG['rusty_sword']);
    if (ITEM_CATALOG['leather_tunic'] && !player.equipment?.chest) player.equipItem(ITEM_CATALOG['leather_tunic']);
    if (ITEM_CATALOG['cloth_pants'] && !player.equipment?.pants) player.equipItem(ITEM_CATALOG['cloth_pants']);
    if (ITEM_CATALOG['travel_boots'] && !player.equipment?.boots) player.equipItem(ITEM_CATALOG['travel_boots']);
  }

  const gameOverModalEl = document.getElementById('game-over-modal');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');

  // Dynamic Theme Cycling: Floor 1 = JJK, Floor 2 = Cyberpunk, Floor 3 = Attack on Titan, Floor 4 = Berserk, subsequent cycle
  const themePool = ['jjk', 'cyberpunk', 'aot', 'berserk'];
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
  slopCoins.length = 0;

  // Spawn Slop Merchant, Wheel Altar & Blackjack Table in Merchant Sanctum
  if (currentDungeon.merchantRoom) {
    const mx = currentDungeon.merchantRoom.centerX;
    const my = currentDungeon.merchantRoom.centerY;
    slopMerchant = new SlopMerchant(mx, my);
    slopMerchant.generateWares(currentFloor, ITEM_CATALOG);
    wheelAltar = new WheelAltar(mx - 240, my - 40);
    blackjackTable = new BlackjackTable(mx + 240, my - 40);
  } else {
    slopMerchant = null;
    wheelAltar = null;
    blackjackTable = null;
  }

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

  // Broadcast floor generation and synced run timer to connected peers if host
  if (broadcast && network.isHost) {
    network.broadcast({
      type: 'DUNGEON_FLOOR_SYNC',
      floorNumber: currentFloor,
      runElapsedMs: runStats.startTime ? Math.max(0, performance.now() - runStats.startTime) : 0,
      dungeonData: currentDungeon.getSyncData(),
      merchantStock: slopMerchant ? slopMerchant.stock.map(s => ({ itemId: s.item.id, price: s.price })) : null
    });
  }

  // Hide LOBBY button and dev hints inside the dungeon (keep settings button & FPS counter visible)
  const btnOpenLobby = document.getElementById('btn-open-lobby');
  if (btnOpenLobby) {
    btnOpenLobby.style.display = 'none';
  }
  const hudDevHint = document.getElementById('hud-dev-hint');
  if (hudDevHint) {
    hudDevHint.classList.add('hidden');
  }

  audio.updateBgmTrack('dungeon');
  particles.spawnComicText(player.x, player.y - 40, `FLOOR ${currentFloor} - ${currentDungeon.theme.shortName}`, currentDungeon.theme.torchColor);
}

window.startFloorDescent = startFloorDescent;

readyCircle.onDescentTriggered = () => {
  if (network.isHost || !network.peer || network.remotePlayers.size === 0) {
    startFloorDescent(1, true);
  } else {
    network.sendToHost({ type: 'REQUEST_FLOOR_DESCENT', floorNumber: 1 });
  }
};

function returnToLobby(broadcast = true) {
  readyCircle.reset();
  if (!readyCircle.onDescentTriggered) {
    readyCircle.onDescentTriggered = () => {
      if (network.isHost || !network.peer || network.remotePlayers.size === 0) {
        startFloorDescent(1, true);
      } else {
        network.sendToHost({ type: 'REQUEST_FLOOR_DESCENT', floorNumber: 1 });
      }
    };
  }
  modalManager.close('game-over-modal');

  currentFloor = 0;
  currentDungeon = null;
  slopMerchant = null;
  wheelAltar = null;
  blackjackTable = null;
  slopCoins.length = 0;
  monsterManager.clear();
  groundItems.clear();

  runStats.isRunOver = false;
  runStats.startTime = null;
  const hudRunTimer = document.getElementById('hud-run-timer');
  if (hudRunTimer) hudRunTimer.classList.add('hidden');

  player.isDowned = false;
  player.isDead = false;
  player.hasDroppedLootOnDeath = false;
  player.downedTimer = 0;
  player.reviveProgress = 0;
  player.hp = player.maxHp;
  player.syncHUD();

  // Reset remote players to healthy lobby state
  for (const [_, remote] of network.remotePlayers.entries()) {
    if (remote) {
      remote.isDead = false;
      remote.isDowned = false;
      remote.hp = remote.maxHp || 100;
      remote.x = 0;
      remote.y = 0;
    }
  }

  const gameOverModalEl = document.getElementById('game-over-modal');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');

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

  // Restore LOBBY button and dev hints when returning to lobby
  const btnOpenLobby = document.getElementById('btn-open-lobby');
  if (btnOpenLobby) {
    btnOpenLobby.style.display = '';
  }
  const hudDevHint = document.getElementById('hud-dev-hint');
  if (hudDevHint) {
    hudDevHint.classList.remove('hidden');
  }

  audio.playDescentFanfare();
  audio.updateBgmTrack('lobby');
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
  modalManager.open('floor-modal');
}

function closeFloorModal() {
  modalManager.close('floor-modal');
}

function toggleFloorModal() {
  modalManager.toggle('floor-modal');
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
  modalManager.toggle('inventory-modal');
}

function openInventory() {
  modalManager.open('inventory-modal');
}

function closeInventory() {
  modalManager.close('inventory-modal');
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
      const ultName = activeSet.ultimateTitle || activeSet.ultimateQ.toUpperCase().replace(/_/g, ' ');
      setBadge.innerHTML = `✨ SET BONUS ACTIVE: ${activeSet.name} — [Q] REPLACED WITH ${ultName}!`;
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
      el.innerHTML = `<span style="color:#94a3b8;font-weight:500;">(Empty)</span>`;
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
    backpackGrid.innerHTML = `<span style="grid-column: span 2; color:#94a3b8; padding:12px; font-size:0.8rem;">Your backpack is empty. Find loot on the ground!</span>`;
  }

  player.inventory.forEach((item, index) => {
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    const isConsumable = item.slot === 'consumable';
    const card = document.createElement('div');
    card.className = 'backpack-item-card';
    card.innerHTML = `
      <div>
        <strong style="color:${rarity.color}">${item.name}</strong>
        <div style="font-size:0.7rem; color:#94a3b8;">${item.desc || ''}</div>
      </div>
      <div class="backpack-actions">
        ${isConsumable
          ? `<button class="item-action-btn use-item-btn" style="background:#059669; border-color:#10b981; color:#fff;" data-idx="${index}">USE</button>`
          : `<button class="item-action-btn equip-item-btn" data-idx="${index}">EQUIP</button>`
        }
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

  // Consumable USE listeners
  document.querySelectorAll('.use-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const itemToUse = player.inventory[idx];
      if (!itemToUse) return;

      player.inventory.splice(idx, 1);
      if (itemToUse.id === 'health_flask' || itemToUse.healAmount) {
        const heal = itemToUse.healAmount || 50;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        player.syncHUD();
        audio.playShopBuy();
        particles.spawnComicText(player.x, player.y - 32, `+${heal} HP 💚 (FLASK)`, '#22c55e');
      } else if (itemToUse.id === 'stamina_tonic' || itemToUse.staminaDuration) {
        const duration = itemToUse.staminaDuration || 8.0;
        player.stamina = player.maxStamina;
        player.isInfiniteStamina = true;
        player.infiniteStaminaTimer = duration;
        player.syncHUD();
        audio.playGravitationalSurge?.();
        particles.spawnComicText(player.x, player.y - 32, `STAMINA SURGE! ⚡ (${Math.round(duration)}s)`, '#38bdf8');
        particles.spawnDashBurst(player.x, player.y, 0, '#38bdf8');
      }

      renderInventoryUI();
      broadcastMyState();
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

// Pick up nearby ground loot with [E] - ALWAYS targets the closest item!
function tryPickupNearbyLoot() {
  let closestLoot = null;
  let closestDist = Infinity;
  let closestId = null;

  for (const [id, loot] of groundItems.entries()) {
    if (loot.isNear(player)) {
      const dist = Math.hypot(player.x - loot.x, player.y - loot.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestLoot = loot;
        closestId = id;
      }
    }
  }

  if (closestLoot) {
    if (player.inventory.length >= player.maxInventorySize) {
      particles.spawnComicText(player.x, player.y - 30, 'BACKPACK FULL!', '#ef4444');
      return;
    }

    // Add deep cloned item to inventory
    player.inventory.push({ ...closestLoot.item });
    groundItems.delete(closestId);

    // Sync pickup
    const pickupMsg = { type: 'LOOT_PICKED_UP', id: closestId };
    if (network.isHost) network.broadcast(pickupMsg);
    else network.sendToHost(pickupMsg);

    audio.playDescentFanfare();
    particles.spawnComicText(player.x, player.y - 28, `GOT ${closestLoot.item.name}!`, '#fbbf24');
    if (!invModal.classList.contains('hidden')) renderInventoryUI();
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
  modalManager.open('wardrobe-modal');
}

function closeWardrobe() {
  modalManager.close('wardrobe-modal');
}

btnCloseWardrobe.addEventListener('click', closeWardrobe);

inputPlayerName.addEventListener('input', (e) => {
  player.name = sanitizePlayerName(e.target.value);
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

// --- SLOP MERCHANT MODAL LOGIC ---
const merchantModal = document.getElementById('merchant-modal');
const btnCloseMerchant = document.getElementById('btn-close-merchant');
const shopItemsGrid = document.getElementById('shop-items-grid');
const sellItemsGrid = document.getElementById('sell-items-grid');
const forgeInventoryGrid = document.getElementById('forge-inventory-grid');
const btnExecuteForge = document.getElementById('btn-execute-forge');
const btnClearForge = document.getElementById('btn-clear-forge');
const forgeSlotResult = document.getElementById('forge-slot-result');

let activeMerchantTab = 'shop';
let forgeSlots = [null, null, null];

function openMerchantModal() {
  modalManager.open('merchant-modal');
}

function closeMerchantModal() {
  modalManager.close('merchant-modal');
}

if (btnCloseMerchant) {
  btnCloseMerchant.addEventListener('click', closeMerchantModal);
}

// Tab Switching
document.querySelectorAll('.merchant-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    switchMerchantTab(tab);
  });
});

function switchMerchantTab(tabName) {
  activeMerchantTab = tabName;
  document.querySelectorAll('.merchant-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.merchant-tab-pane').forEach(p => {
    p.classList.remove('active');
  });
  const targetPane = document.getElementById(`pane-${tabName}`);
  if (targetPane) targetPane.classList.add('active');

  updateSlopsUI();

  if (tabName === 'shop') renderShopTab();
  else if (tabName === 'sell') renderSellTab();
  else if (tabName === 'forge') renderForgeTab();
}

// 1. SUPPLIES SHOP
function renderShopTab() {
  if (!shopItemsGrid) return;
  shopItemsGrid.innerHTML = '';

  if (slopMerchant && (!slopMerchant.stock || slopMerchant.stock.length === 0)) {
    slopMerchant.generateWares(currentFloor, ITEM_CATALOG);
  }

  const shopStock = slopMerchant ? slopMerchant.stock : [];

  const btnRefresh = document.getElementById('btn-refresh-shop');
  const refreshCostText = document.getElementById('refresh-cost-text');
  if (btnRefresh && slopMerchant) {
    const cost = slopMerchant.refreshCost || 25;
    if (refreshCostText) refreshCostText.textContent = cost;
    btnRefresh.disabled = sharedSlops < cost;
  }

  shopStock.forEach(({ item, price }) => {
    if (!item) return;
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    const card = document.createElement('div');
    card.className = 'shop-item-card';
    const canAfford = sharedSlops >= price;
    const hasSpace = player.inventory.length < player.maxInventorySize;

    card.innerHTML = `
      <div class="shop-card-top">
        <div class="shop-item-header">
          <span class="shop-item-name" style="color: ${rarity.color}" title="${item.name}">${item.name}</span>
          <span class="shop-item-price">🪙 ${price}</span>
        </div>
        <div class="shop-item-desc">${item.desc || (item.slot + ' equipment')}</div>
      </div>
      <button class="shop-buy-btn uniform-action-btn" ${(!canAfford || !hasSpace) ? 'disabled' : ''} data-item-id="${item.id}" data-price="${price}">
        ${!canAfford ? 'NOT ENOUGH SLOPS' : (!hasSpace ? 'BACKPACK FULL' : `BUY FOR ${price} SLOPS`)}
      </button>
    `;
    shopItemsGrid.appendChild(card);
  });

  shopItemsGrid.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const price = parseInt(btn.getAttribute('data-price'));
      if (sharedSlops < price) return;
      if (player.inventory.length >= player.maxInventorySize) return;

      const item = ITEM_CATALOG[itemId];
      if (!item) return;

      sharedSlops -= price;
      // If it's a health flask, heal immediately or add to inventory
      if (item.id === 'health_flask') {
        player.hp = Math.min(player.maxHp, player.hp + 45);
        player.syncHUD();
        particles.spawnComicText(player.x, player.y - 32, '+45 HP 💚 (FLASK)', '#22c55e');
      } else {
        player.inventory.push({ ...item });
      }

      audio.playShopBuy();
      particles.spawnComicText(player.x, player.y - 30, `BOUGHT ${item.name}! 🛍️`, '#fbbf24');
      if (slopMerchant) slopMerchant.sayRandomBuy(item.name);
      updateSlopsUI();
      broadcastSlops();
      renderShopTab();
    });
  });
}

const btnRefreshShop = document.getElementById('btn-refresh-shop');
if (btnRefreshShop) {
  btnRefreshShop.addEventListener('click', () => {
    if (!slopMerchant) return;
    const cost = slopMerchant.refreshCost || 25;
    if (sharedSlops < cost) return;

    sharedSlops -= cost;
    updateSlopsUI();
    broadcastSlops();

    slopMerchant.refreshStock(currentFloor, ITEM_CATALOG);
    if (audio.playCashReroll) audio.playCashReroll();
    particles.spawnComicText(player.x, player.y - 35, `-${cost} SLOPS (REROLLED 🔄)`, '#facc15');

    const refreshMsg = {
      type: 'SHOP_WARES_REFRESH',
      stock: slopMerchant.stock.map(s => ({ itemId: s.item.id, price: s.price }))
    };
    if (network.isHost) network.broadcast(refreshMsg);
    else network.sendToHost(refreshMsg);

    renderShopTab();
  });
}

// 2. SELL ITEMS
function renderSellTab() {
  if (!sellItemsGrid) return;
  sellItemsGrid.innerHTML = '';

  if (player.inventory.length === 0) {
    sellItemsGrid.innerHTML = '<span style="grid-column: 1 / -1; color:#94a3b8; padding:24px; text-align:center; font-size:0.85rem;">Backpack is empty! Explore the dungeon and find loot to sell.</span>';
    return;
  }

  player.inventory.forEach((item, idx) => {
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    const sellPrice = getItemSellPrice(item);
    const card = document.createElement('div');
    card.className = 'sell-item-card';

    card.innerHTML = `
      <div class="shop-card-top">
        <div class="sell-item-header">
          <span class="sell-item-name" style="color: ${rarity.color}" title="${item.name}">${item.name}</span>
          <span class="sell-item-price">+${sellPrice} SLOPS</span>
        </div>
        <div class="shop-item-desc">${item.desc || (item.slot + ' equipment')}</div>
      </div>
      <button class="sell-btn uniform-action-btn" data-idx="${idx}" data-price="${sellPrice}">
        SELL FOR ${sellPrice} SLOPS 🪙
      </button>
    `;
    sellItemsGrid.appendChild(card);
  });

  sellItemsGrid.querySelectorAll('.sell-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      const price = parseInt(btn.getAttribute('data-price'));
      const soldItem = player.inventory.splice(idx, 1)[0];
      if (soldItem) {
        sharedSlops += price;
        audio.playShopSell();
        particles.spawnComicText(player.x, player.y - 30, `+${price} SLOPS 🪙`, '#4ade80');
        if (slopMerchant) slopMerchant.sayRandomSell();
        updateSlopsUI();
        broadcastSlops();
        renderSellTab();
      }
    });
  });
}

// Slot Icon Helper for Clear UI Categorization
function getItemSlotIcon(slot) {
  switch (slot) {
    case 'helmet': return '👑';
    case 'chest': return '🥋';
    case 'pants': return '👖';
    case 'boots': return '🥾';
    case 'weapon': return '⚔️';
    case 'offhand': return '🛡️';
    case 'consumable': return '🧪';
    default: return '📦';
  }
}

// 3. TRADE-UP FORGE
function renderForgeTab() {
  if (!forgeInventoryGrid) return;

  // Render 3 slots with spacious, legible cards
  for (let s = 0; s < 3; s++) {
    const slotEl = document.getElementById(`forge-slot-${s}`);
    if (!slotEl) continue;
    const item = forgeSlots[s];
    if (item) {
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      slotEl.className = 'forge-slot filled';
      slotEl.innerHTML = `
        <div class="forge-slot-item-content">
          <div class="forge-slot-item-icon">${getItemSlotIcon(item.slot)}</div>
          <strong class="forge-slot-item-name" style="color:${rarity.color}" title="${item.name}">${item.name}</strong>
          <div class="forge-slot-item-tags">
            <span class="forge-slot-item-rarity" style="color:${rarity.color}; border-color:${rarity.color}60; background:${rarity.color}15;">${item.rarity}</span>
          </div>
          <span class="forge-slot-remove-hint">✕ remove</span>
        </div>
      `;
    } else {
      slotEl.className = 'forge-slot';
      slotEl.innerHTML = `
        <div class="forge-slot-empty-content">
          <span class="forge-slot-empty-icon">➕</span>
          <span class="forge-slot-empty-label">SLOT ${s + 1}</span>
          <span class="forge-slot-empty-hint">Select Below</span>
        </div>
      `;
    }
  }

  // Check valid trade-up condition: exactly 3 items, all of the exact same rarity, not Mythic
  const allFilled = forgeSlots.every(it => it !== null);
  const sameRarity = allFilled && (forgeSlots[0].rarity === forgeSlots[1].rarity && forgeSlots[1].rarity === forgeSlots[2].rarity);
  const notMythic = allFilled && forgeSlots[0].rarity !== 'MYTHIC';
  const isValid = allFilled && sameRarity && notMythic;

  if (btnExecuteForge) {
    btnExecuteForge.disabled = !isValid;
  }

  // Update Result Preview Slot
  if (forgeSlotResult) {
    if (isValid) {
      const targetRarityKey = NEXT_RARITY_TIER[forgeSlots[0].rarity] || 'EPIC';
      const targetRarity = ItemRarity[targetRarityKey] || ItemRarity.EPIC;
      forgeSlotResult.className = 'forge-slot forge-result-slot ready';
      forgeSlotResult.innerHTML = `
        <div class="forge-slot-item-content">
          <div class="forge-slot-item-icon">✨</div>
          <strong class="forge-slot-item-name" style="color:${targetRarity.color}">1x ${targetRarityKey}</strong>
          <div class="forge-slot-item-tags">
            <span class="forge-slot-item-rarity" style="color:${targetRarity.color}; border-color:${targetRarity.color}60; background:${targetRarity.color}20;">NEXT TIER</span>
          </div>
        </div>
      `;
    } else if (allFilled && !sameRarity) {
      forgeSlotResult.className = 'forge-slot forge-result-slot';
      forgeSlotResult.innerHTML = `
        <div class="forge-slot-empty-content">
          <span class="forge-slot-empty-icon" style="color:#ef4444">⚠️</span>
          <span class="forge-slot-empty-label" style="color:#ef4444; font-size:0.65rem;">MISMATCH</span>
          <span class="forge-slot-empty-hint" style="color:#f87171">Same rarity only</span>
        </div>
      `;
    } else {
      forgeSlotResult.className = 'forge-slot forge-result-slot';
      forgeSlotResult.innerHTML = `
        <div class="forge-slot-empty-content">
          <span class="forge-slot-empty-icon">🎲</span>
          <span class="forge-slot-empty-label">NEXT TIER</span>
          <span class="forge-slot-empty-hint">1x Random Item</span>
        </div>
      `;
    }
  }

  // Render mini backpack picker (excluding items already placed in forge slots)
  forgeInventoryGrid.innerHTML = '';
  const placedIndices = new Set();
  forgeSlots.forEach(sl => {
    if (sl) {
      const idx = player.inventory.indexOf(sl);
      if (idx !== -1) placedIndices.add(idx);
    }
  });

  const availableItems = player.inventory.filter((item, idx) => !placedIndices.has(idx) && item.slot !== 'consumable');
  
  const countEl = document.getElementById('forge-picker-count');
  if (countEl) {
    countEl.textContent = `${availableItems.length} Available`;
  }

  if (availableItems.length === 0) {
    forgeInventoryGrid.innerHTML = `
      <div class="forge-empty-notice">
        <span class="forge-empty-icon">🎒</span>
        <div class="forge-empty-title">No Available Gear in Backpack</div>
        <div class="forge-empty-sub">Collect gear in the dungeon or buy from Supplies Shop to trade up!</div>
      </div>
    `;
    return;
  }

  player.inventory.forEach((item, idx) => {
    if (placedIndices.has(idx) || item.slot === 'consumable') return;
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    const card = document.createElement('div');
    card.className = 'backpack-item-card mini-card forge-pick-card';
    card.style.cursor = 'pointer';
    card.style.borderLeft = `3px solid ${rarity.color}`;
    card.innerHTML = `
      <div class="mini-card-left">
        <div class="mini-card-icon-badge">${getItemSlotIcon(item.slot)}</div>
        <div class="mini-card-info">
          <strong class="mini-card-name" style="color:${rarity.color}" title="${item.name}">${item.name}</strong>
          <div class="mini-card-tags">
            <span class="mini-rarity-pill" style="color:${rarity.color}; border-color:${rarity.color}50; background:${rarity.color}15;">${item.rarity}</span>
            <span class="mini-slot-label">${item.slot.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <button class="mini-action-btn forge-insert-action">INSERT ➕</button>
    `;
    card.addEventListener('click', () => {
      // Put in first empty forge slot
      const emptyIdx = forgeSlots.findIndex(sl => sl === null);
      if (emptyIdx !== -1) {
        forgeSlots[emptyIdx] = item;
        audio.playSwing();
        renderForgeTab();
      }
    });
    forgeInventoryGrid.appendChild(card);
  });
}

// Clear individual forge slot on click
[0, 1, 2].forEach(slotIdx => {
  const el = document.getElementById(`forge-slot-${slotIdx}`);
  if (el) {
    el.addEventListener('click', () => {
      if (forgeSlots[slotIdx]) {
        forgeSlots[slotIdx] = null;
        audio.playFootstep();
        renderForgeTab();
      }
    });
  }
});

if (btnClearForge) {
  btnClearForge.addEventListener('click', () => {
    forgeSlots = [null, null, null];
    if (forgeSlotResult) forgeSlotResult.innerHTML = '?';
    audio.playFootstep();
    renderForgeTab();
  });
}

if (btnExecuteForge) {
  btnExecuteForge.addEventListener('click', () => {
    if (!forgeSlots.every(it => it !== null)) return;
    const res = executeTradeUp(forgeSlots);
    if (res.success && res.resultItem) {
      // Remove consumed items from inventory
      forgeSlots.forEach(itemToConsume => {
        const idx = player.inventory.indexOf(itemToConsume);
        if (idx !== -1) player.inventory.splice(idx, 1);
      });

      // Add upgraded item
      player.inventory.push({ ...res.resultItem });

      // Audio & VFX
      audio.playForgeHammer();
      cinematics.addScreenShake(14);
      particles.spawnComicText(player.x, player.y - 35, `FORGED: ${res.resultItem.name}! ⚒️✨`, '#c084fc');
      particles.spawnDashBurst(player.x, player.y, 0, '#a855f7');

      if (forgeSlotResult) {
        const rarity = ItemRarity[res.resultItem.rarity] || ItemRarity.COMMON;
        forgeSlotResult.innerHTML = `<span style="color:${rarity.color}">${res.resultItem.name}</span>`;
      }

      forgeSlots = [null, null, null];
      renderForgeTab();
    } else {
      alert(res.error || 'Trade-up requirements not met!');
    }
  });
}

// --- IN-WORLD WHEEL OF SLOP ALTAR MODAL LOGIC ---
const wheelAltarModal = document.getElementById('wheel-altar-modal');
const btnCloseWheelAltar = document.getElementById('btn-close-wheel-altar');
const altarWagerSlot = document.getElementById('altar-wager-slot');
const btnAltarSpinWheel = document.getElementById('btn-altar-spin-wheel');
const altarInventoryGrid = document.getElementById('altar-inventory-grid');
let altarWagerItem = null;

function openWheelAltarModal() {
  if (wheelAltar && wheelAltar.isSpinning) {
    particles.spawnComicText(player.x, player.y - 35, `⚠️ IN USE BY ${wheelAltar.activeSpinnerName || 'FRIEND'}!`, '#f59e0b');
    return;
  }
  modalManager.open('wheel-altar-modal');
}

function closeWheelAltarModal() {
  modalManager.close('wheel-altar-modal');
}

if (btnCloseWheelAltar) {
  btnCloseWheelAltar.addEventListener('click', closeWheelAltarModal);
}

function renderWheelAltarModal() {
  if (altarWagerSlot) {
    if (altarWagerItem) {
      const rarity = ItemRarity[altarWagerItem.rarity] || ItemRarity.COMMON;
      altarWagerSlot.className = 'forge-slot wager-slot filled';
      altarWagerSlot.innerHTML = `<span style="color:${rarity.color}">${altarWagerItem.name}</span><span style="font-size:0.65rem; color:#94a3b8;">(${altarWagerItem.rarity})</span>`;
    } else {
      altarWagerSlot.className = 'forge-slot wager-slot';
      altarWagerSlot.innerHTML = 'Select Item Below';
    }
  }

  if (btnAltarSpinWheel) {
    btnAltarSpinWheel.disabled = !altarWagerItem || (wheelAltar && wheelAltar.isSpinning);
  }

  if (altarInventoryGrid) {
    altarInventoryGrid.innerHTML = '';
    const gearItems = player.inventory.filter(it => it.slot !== 'consumable');

    if (gearItems.length === 0) {
      altarInventoryGrid.innerHTML = `
        <div class="forge-empty-notice">
          <span class="forge-empty-icon">🎒</span>
          <div class="forge-empty-title">No Gear in Backpack</div>
          <div class="forge-empty-sub">Collect gear from monsters or the shop to wager on the wheel!</div>
        </div>
      `;
    } else {
      gearItems.forEach((item) => {
        const isSelected = altarWagerItem === item;
        const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
        const card = document.createElement('div');
        card.className = `backpack-item-card mini-card wheel-pick-card ${isSelected ? 'selected' : ''}`;
        card.style.cursor = 'pointer';
        card.style.borderLeft = `3px solid ${rarity.color}`;
        card.innerHTML = `
          <div class="mini-card-left">
            <div class="mini-card-icon-badge">${getItemSlotIcon(item.slot)}</div>
            <div class="mini-card-info">
              <strong class="mini-card-name" style="color:${rarity.color}" title="${item.name}">${item.name}</strong>
              <div class="mini-card-tags">
                <span class="mini-rarity-pill" style="color:${rarity.color}; border-color:${rarity.color}50; background:${rarity.color}15;">${item.rarity}</span>
                <span class="mini-slot-label">${item.slot.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button class="mini-action-btn" style="border-color:${isSelected ? '#10b981' : '#f59e0b'}; color:${isSelected ? '#4ade80' : '#fbbf24'};">
            ${isSelected ? 'WAGERED' : 'WAGER'}
          </button>
        `;
        card.addEventListener('click', () => {
          if (wheelAltar && wheelAltar.isSpinning) return;
          altarWagerItem = item;
          audio.playSwing();
          renderWheelAltarModal();
        });
        altarInventoryGrid.appendChild(card);
      });
    }
  }
}

if (btnAltarSpinWheel) {
  btnAltarSpinWheel.addEventListener('click', () => {
    if (!altarWagerItem || !wheelAltar || wheelAltar.isSpinning) return;

    const wageredItemRef = altarWagerItem;
    closeWheelAltarModal();

    // Calculate outcome mathematically: 50% ancur, 45% upgrade, 5% jackpot
    const spinResult = executeGachaSpin(wageredItemRef);

    // 10 sectors on wheelAltar:
    // 0: shatter, 1: upgrade, 2: shatter, 3: upgrade, 4: shatter, 5: upgrade, 6: shatter, 7: upgrade, 8: shatter, 9: jackpot
    let targetSectorIdx = 0;
    if (spinResult.outcome === 'upgrade') {
      const upgradeSectors = [1, 3, 5, 7];
      targetSectorIdx = upgradeSectors[Math.floor(Math.random() * upgradeSectors.length)];
    } else if (spinResult.outcome === 'jackpot') {
      targetSectorIdx = 9;
    } else {
      const shatterSectors = [0, 2, 4, 6, 8];
      targetSectorIdx = shatterSectors[Math.floor(Math.random() * shatterSectors.length)];
    }

    const sectorAngle = (Math.PI * 2) / 10;
    const midSectorAngle = targetSectorIdx * sectorAngle + sectorAngle / 2;
    const targetWheelAngle = (-Math.PI / 2 - midSectorAngle);
    const fullSpins = 6 * Math.PI * 2;
    const startAngle = wheelAltar.currentAngle;
    const finalAngle = startAngle + fullSpins + ((targetWheelAngle - (startAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2));

    const spinnerId = network.myPeerId || 'local_crawler';
    const spinnerName = player.name || 'SlopCrawler';
    const duration = 4.5;
    const resultType = spinResult.outcome === 'ancur' ? 'shattered' : spinResult.outcome;

    const spinMsg = {
      type: 'WHEEL_SPIN_START',
      spinnerId,
      spinnerName,
      wagerItemName: wageredItemRef.name,
      targetAngle: finalAngle,
      duration,
      result: resultType
    };
    if (network.isHost) network.broadcast(spinMsg);
    else network.sendToHost(spinMsg);

    if (slopMerchant) {
      slopMerchant.sayRandomWheelStart(spinnerName);
    }

    wheelAltar.startSpin(spinnerId, spinnerName, wageredItemRef, finalAngle, duration, resultType, (res) => {
      const wagerIdx = player.inventory.indexOf(wageredItemRef);
      if (res === 'shattered') {
        if (wagerIdx !== -1) player.inventory.splice(wagerIdx, 1);
      } else if (res === 'upgrade' || res === 'jackpot') {
        if (wagerIdx !== -1) player.inventory[wagerIdx] = { ...spinResult.resultItem };
      }
      if (slopMerchant) slopMerchant.sayRandomWheelResult(res, spinResult.resultItem?.name, spinnerName);
      player.syncHUD();
    });
  });
}

// --- IN-WORLD BLACKJACK CASINO MODAL LOGIC ---
const blackjackModal = document.getElementById('blackjack-modal');
const btnCloseBlackjack = document.getElementById('btn-close-blackjack');
const bjSlopsAmount = document.getElementById('bj-slops-amount');
const bjDealerBubble = document.getElementById('bj-dealer-bubble');
const bjDealerScore = document.getElementById('bj-dealer-score');
const bjDealerCards = document.getElementById('bj-dealer-cards');
const bjStatusBanner = document.getElementById('bj-status-banner');
const bjCurrentBetVal = document.getElementById('bj-current-bet-val');
const bjPlayerCards = document.getElementById('bj-player-cards');
const bjPlayerScore = document.getElementById('bj-player-score');
const bjBetControls = document.getElementById('bj-bet-controls');
const bjActionControls = document.getElementById('bj-action-controls');
const bjResolvedControls = document.getElementById('bj-resolved-controls');
const btnBjDeal = document.getElementById('btn-bj-deal');
const btnBjHit = document.getElementById('btn-bj-hit');
const btnBjStand = document.getElementById('btn-bj-stand');
const btnBjDouble = document.getElementById('btn-bj-double');
const btnBjPlayAgain = document.getElementById('btn-bj-play-again');
const btnBjClearBet = document.getElementById('btn-bj-clear-bet');
const btnBjMaxBet = document.getElementById('btn-bj-max-bet');

let selectedBjBet = 25;

async function openBlackjackModal() {
  await getBlackjackGame();
  modalManager.open('blackjack-modal');
}

function closeBlackjackModal() {
  modalManager.close('blackjack-modal');
}

if (btnCloseBlackjack) {
  btnCloseBlackjack.addEventListener('click', closeBlackjackModal);
}

function createCardDom(card, isHoleCard = false) {
  const cardEl = document.createElement('div');
  if (isHoleCard) {
    cardEl.className = 'bj-card hole-card';
    cardEl.innerHTML = '<div class="hole-card-inner">🂠</div>';
    return cardEl;
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  cardEl.className = `bj-card ${isRed ? 'red' : 'black'}`;
  cardEl.innerHTML = `
    <div class="card-top">${card.rank}${card.suit}</div>
    <div class="card-mid">${card.suit}</div>
    <div class="card-bot">${card.rank}${card.suit}</div>
  `;
  return cardEl;
}

function renderBlackjackUI() {
  if (!blackjackGame) return;
  if (bjSlopsAmount) bjSlopsAmount.textContent = `${sharedSlops.toLocaleString()} SLOPS`;
  if (bjCurrentBetVal) bjCurrentBetVal.textContent = selectedBjBet;
  const dealBtnAmt = document.getElementById('bj-deal-btn-amount');
  if (dealBtnAmt) dealBtnAmt.textContent = selectedBjBet;

  // Hand & Dealer Cards
  if (bjDealerCards) {
    bjDealerCards.innerHTML = '';
    blackjackGame.dealerHand.forEach((card, idx) => {
      const isHole = idx === 1 && !blackjackGame.dealerHoleCardRevealed;
      bjDealerCards.appendChild(createCardDom(card, isHole));
    });
  }

  if (bjPlayerCards) {
    bjPlayerCards.innerHTML = '';
    blackjackGame.playerHand.forEach((card) => {
      bjPlayerCards.appendChild(createCardDom(card, false));
    });
  }

  // Scores
  if (bjPlayerScore) {
    const pScore = blackjackGame.calculateScore(blackjackGame.playerHand);
    bjPlayerScore.textContent = blackjackGame.playerHand.length > 0 ? (pScore.isSoft && pScore.score <= 21 ? `Soft ${pScore.score}` : pScore.score) : '0';
  }

  if (bjDealerScore) {
    if (blackjackGame.dealerHand.length === 0) {
      bjDealerScore.textContent = '?';
    } else if (!blackjackGame.dealerHoleCardRevealed) {
      const dUp = blackjackGame.calculateScore(blackjackGame.dealerHand, true);
      bjDealerScore.textContent = `${dUp.score} + ?`;
    } else {
      const dScore = blackjackGame.calculateScore(blackjackGame.dealerHand, false);
      bjDealerScore.textContent = dScore.score;
    }
  }

  // State phases visibility
  if (bjBetControls) bjBetControls.classList.toggle('hidden', blackjackGame.gameState !== 'BETTING');
  if (bjActionControls) bjActionControls.classList.toggle('hidden', blackjackGame.gameState !== 'PLAYER_TURN');
  if (bjResolvedControls) bjResolvedControls.classList.toggle('hidden', blackjackGame.gameState !== 'RESOLVED');

  if (btnBjDeal) {
    btnBjDeal.disabled = sharedSlops < selectedBjBet || selectedBjBet <= 0;
  }
  if (btnBjDouble) {
    btnBjDouble.disabled = sharedSlops < blackjackGame.currentBet;
  }

  // Dealer Speech & Status Banner
  if (bjStatusBanner) {
    if (blackjackGame.gameState === 'BETTING') {
      bjStatusBanner.textContent = 'PLACE YOUR BET & DEAL';
      bjStatusBanner.style.color = '#ffffff';
    } else if (blackjackGame.gameState === 'PLAYER_TURN') {
      bjStatusBanner.textContent = 'YOUR TURN: HIT, STAND, OR DOUBLE DOWN';
      bjStatusBanner.style.color = '#38bdf8';
    } else if (blackjackGame.gameState === 'DEALER_TURN') {
      bjStatusBanner.textContent = 'DEALER DRAWING...';
      bjStatusBanner.style.color = '#f59e0b';
    } else if (blackjackGame.gameState === 'RESOLVED') {
      const res = blackjackGame.result;
      if (res === 'BLACKJACK') {
        bjStatusBanner.textContent = 'BLACKJACK! NATURAL 21! 💰';
        bjStatusBanner.style.color = '#fbbf24';
      } else if (res === 'WIN' || res === 'DEALER_BUST') {
        bjStatusBanner.textContent = res === 'DEALER_BUST' ? 'DEALER BUST! YOU WIN! ✨' : 'YOU WIN! ✨';
        bjStatusBanner.style.color = '#4ade80';
      } else if (res === 'PUSH') {
        bjStatusBanner.textContent = 'PUSH! BET RETURNED 🤝';
        bjStatusBanner.style.color = '#94a3b8';
      } else {
        bjStatusBanner.textContent = res === 'BUST' ? 'BUSTED! YOU LOSE! 💀' : 'DEALER WINS! 💀';
        bjStatusBanner.style.color = '#ef4444';
      }
    }
  }

  if (bjDealerBubble) {
    bjDealerBubble.textContent = `"${blackjackGame.getMerchantQuip()}"`;
  }
}

// Chip Betting Buttons
document.querySelectorAll('.bj-chip-btn[data-amount]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'BETTING') return;
    const addAmt = parseInt(btn.getAttribute('data-amount'));
    selectedBjBet = Math.min(sharedSlops, selectedBjBet + addAmt);
    if (audio.playChipClink) audio.playChipClink();
    renderBlackjackUI();
  });
});

if (btnBjClearBet) {
  btnBjClearBet.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'BETTING') return;
    selectedBjBet = Math.min(10, sharedSlops);
    if (audio.playChipClink) audio.playChipClink();
    renderBlackjackUI();
  });
}

if (btnBjMaxBet) {
  btnBjMaxBet.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'BETTING') return;
    selectedBjBet = Math.max(10, sharedSlops);
    if (audio.playChipClink) audio.playChipClink();
    renderBlackjackUI();
  });
}

// Deal Cards
if (btnBjDeal) {
  btnBjDeal.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'BETTING') return;
    if (sharedSlops < selectedBjBet) return;

    sharedSlops -= selectedBjBet;
    updateSlopsUI();
    broadcastSlops();

    blackjackGame.startRound(selectedBjBet);
    if (audio.playCardFlip) audio.playCardFlip();
    renderBlackjackUI();

    if (blackjackGame.gameState === 'RESOLVED') {
      handleBlackjackResolution();
    }
  });
}

// Hit
if (btnBjHit) {
  btnBjHit.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'PLAYER_TURN') return;
    if (audio.playCardFlip) audio.playCardFlip();
    blackjackGame.hit();
    renderBlackjackUI();

    if (blackjackGame.gameState === 'RESOLVED') {
      handleBlackjackResolution();
    }
  });
}

// Stand
if (btnBjStand) {
  btnBjStand.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'PLAYER_TURN') return;
    if (audio.playCardFlip) audio.playCardFlip();
    blackjackGame.stand();
    renderBlackjackUI();
    handleBlackjackResolution();
  });
}

// Double Down
if (btnBjDouble) {
  btnBjDouble.addEventListener('click', () => {
    if (blackjackGame.gameState !== 'PLAYER_TURN') return;
    if (sharedSlops < blackjackGame.currentBet) return;

    sharedSlops -= blackjackGame.currentBet;
    updateSlopsUI();
    broadcastSlops();

    if (audio.playChipClink) audio.playChipClink();
    if (audio.playCardFlip) audio.playCardFlip();
    blackjackGame.doubleDown();
    renderBlackjackUI();
    handleBlackjackResolution();
  });
}

// Play Again
if (btnBjPlayAgain) {
  btnBjPlayAgain.addEventListener('click', () => {
    blackjackGame.gameState = 'BETTING';
    blackjackGame.playerHand = [];
    blackjackGame.dealerHand = [];
    blackjackGame.dealerHoleCardRevealed = false;
    blackjackGame.result = null;
    selectedBjBet = Math.min(25, sharedSlops > 0 ? sharedSlops : 25);
    renderBlackjackUI();
  });
}

function handleBlackjackResolution() {
  const payout = blackjackGame.payout;
  if (payout > 0) {
    sharedSlops += payout;
    updateSlopsUI();
    broadcastSlops();
  }

  const res = blackjackGame.result;
  const quip = blackjackGame.getMerchantQuip();
  if (slopMerchant) slopMerchant.say(quip, res === 'WIN' || res === 'BLACKJACK' ? '#4ade80' : '#ef4444', 4.0);

  if (res === 'BLACKJACK') {
    if (audio.playCasinoWin) audio.playCasinoWin(true);
    cinematics.addScreenShake(12);
    if (blackjackTable) particles.spawnComicText(blackjackTable.x, blackjackTable.y - 45, `BLACKJACK! +${payout} 🪙`, '#fbbf24');
  } else if (res === 'WIN' || res === 'DEALER_BUST') {
    if (audio.playCasinoWin) audio.playCasinoWin(false);
    cinematics.addScreenShake(6);
    if (blackjackTable) particles.spawnComicText(blackjackTable.x, blackjackTable.y - 45, `YOU WIN! +${payout} 🪙`, '#4ade80');
  } else if (res === 'PUSH') {
    if (audio.playChipClink) audio.playChipClink();
    if (blackjackTable) particles.spawnComicText(blackjackTable.x, blackjackTable.y - 45, 'PUSH! REFUND 🤝', '#94a3b8');
  } else {
    if (audio.playCasinoBust) audio.playCasinoBust();
    if (blackjackTable) particles.spawnComicText(blackjackTable.x, blackjackTable.y - 45, 'BUSTED! 💀', '#ef4444');
  }

  renderBlackjackUI();
}

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

btnOpenLobby.addEventListener('click', () => modalManager.open('lobby-modal'));
btnCloseLobby.addEventListener('click', () => modalManager.close('lobby-modal'));

function updatePartyRoster() {
  partyRoster.innerHTML = '';

  const myLi = document.createElement('li');
  myLi.className = 'lobby-player-item';
  const myDot = document.createElement('span');
  myDot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${player.color || '#00f0ff'};margin-right:8px;`;
  myLi.appendChild(myDot);

  const myName = document.createElement('span');
  myName.textContent = `${player.name || 'SlopCrawler'} (You)${network.isHost ? ' 👑' : ''}`;
  myName.style.fontWeight = '700';
  myLi.appendChild(myName);
  partyRoster.appendChild(myLi);

  for (const [peerId, remote] of network.remotePlayers.entries()) {
    const li = document.createElement('li');
    li.className = 'lobby-player-item';

    const dot = document.createElement('span');
    dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${remote.color || '#ffffff'};margin-right:8px;`;
    li.appendChild(dot);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = remote.name || `Friend (${peerId.slice(0, 4)})`;
    nameSpan.style.fontWeight = '700';
    li.appendChild(nameSpan);

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

// --- GAME OVER SUMMARY MODAL (STEP 5.2) ---
const gameOverModal = document.getElementById('game-over-modal');
const btnRetryRun = document.getElementById('btn-retry-run');
const btnReturnLobbyFromGo = document.getElementById('btn-return-lobby-from-go');

function triggerPartyWipe(syncedStats = null) {
  if (runStats.isRunOver) return;
  runStats.isRunOver = true;

  if (player.isDowned) {
    player.isDowned = false;
    player.isDead = true;
    player.downedTimer = 0;
    player.vx = 0;
    player.vy = 0;
  }
  player.syncHUD();
  broadcastMyState();

  audio.playGameOverGong();
  audio.stopBgm();
  cinematics.addScreenShake(20);

  const elapsedSec = runStats.startTime ? Math.max(1, Math.floor((performance.now() - runStats.startTime) / 1000)) : 0;
  const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
  const secs = (elapsedSec % 60).toString().padStart(2, '0');
  const timeFormatted = `${mins}:${secs}`;
  const mvp = getRunMvp();

  const floorText = syncedStats?.floor 
    ? `FLOOR ${syncedStats.floor}`
    : `FLOOR ${currentFloor} - ${currentDungeon?.theme?.shortName || 'DUNGEON'}`;
  const timeText = syncedStats?.duration || timeFormatted;
  const killsText = syncedStats ? syncedStats.kills : runStats.totalKills;
  const slopsText = syncedStats ? `+${syncedStats.slops} SLOPS` : `+${runStats.slopsEarned} SLOPS`;
  const mvpNameText = syncedStats ? syncedStats.mvpName : mvp.name;
  const mvpDmgText = syncedStats ? `${(syncedStats.mvpDamage || 0).toLocaleString()} Total DMG` : `${(mvp.damage || 0).toLocaleString()} Total DMG`;

  const statFloorEl = document.getElementById('go-stat-floor');
  const statTimeEl = document.getElementById('go-stat-time');
  const statKillsEl = document.getElementById('go-stat-kills');
  const statSlopsEl = document.getElementById('go-stat-slops');
  const mvpNameEl = document.getElementById('go-mvp-name');
  const mvpDmgEl = document.getElementById('go-mvp-dmg');
  if (statFloorEl) statFloorEl.textContent = floorText;
  if (statTimeEl) statTimeEl.textContent = timeText;
  if (statKillsEl) statKillsEl.textContent = killsText;
  if (statSlopsEl) statSlopsEl.textContent = slopsText;
  if (mvpNameEl) mvpNameEl.textContent = mvpNameText;
  if (mvpDmgEl) mvpDmgEl.textContent = mvpDmgText;

  // Render Fallen Party Roster (Safe from XSS)
  const rosterContainer = document.getElementById('go-party-roster');
  if (rosterContainer) {
    rosterContainer.innerHTML = '';

    const localPill = document.createElement('div');
    localPill.className = 'party-member-pill';

    const localAvatar = document.createElement('div');
    localAvatar.className = 'member-avatar-mini';
    localAvatar.style.background = player.color || '#00f0ff';
    localPill.appendChild(localAvatar);

    const localName = document.createElement('span');
    localName.style.fontWeight = '700';
    localName.textContent = player.name || 'You';
    localPill.appendChild(localName);

    const localStatus = document.createElement('span');
    localStatus.className = 'member-status-dead';
    localStatus.textContent = '[SLAIN 💀]';
    localPill.appendChild(localStatus);

    rosterContainer.appendChild(localPill);

    for (const [peerId, remote] of network.remotePlayers.entries()) {
      const remPill = document.createElement('div');
      remPill.className = 'party-member-pill';

      const remAvatar = document.createElement('div');
      remAvatar.className = 'member-avatar-mini';
      remAvatar.style.background = remote.color || '#f59e0b';
      remPill.appendChild(remAvatar);

      const remName = document.createElement('span');
      remName.style.fontWeight = '700';
      remName.textContent = remote.name || `Player ${peerId.slice(0, 4)}`;
      remPill.appendChild(remName);

      const remStatus = document.createElement('span');
      remStatus.className = 'member-status-dead';
      remStatus.textContent = '[SLAIN 💀]';
      remPill.appendChild(remStatus);

      rosterContainer.appendChild(remPill);
    }
  }

  const isSolo = !network.peer || network.remotePlayers.size === 0;
  const isAuthority = network.isHost || isSolo;
  const hostNotice = document.getElementById('go-host-notice');
  if (hostNotice) {
    hostNotice.style.display = isAuthority ? 'none' : 'block';
  }
  if (btnRetryRun && btnReturnLobbyFromGo) {
    btnRetryRun.disabled = !isAuthority;
    btnReturnLobbyFromGo.disabled = false;
    btnRetryRun.style.opacity = isAuthority ? '1' : '0.45';
    btnReturnLobbyFromGo.style.opacity = '1';
    btnRetryRun.style.cursor = isAuthority ? 'pointer' : 'not-allowed';
    btnReturnLobbyFromGo.style.cursor = 'pointer';
  }

  if (gameOverModal) modalManager.open('game-over-modal');

  if (isAuthority && network.isHost) {
    network.broadcast({
      type: 'PARTY_WIPE',
      stats: {
        floor: currentFloor,
        duration: timeText,
        kills: killsText,
        slops: runStats.slopsEarned,
        mvpName: mvpNameText,
        mvpDamage: mvp.damage
      }
    });
  }
}

if (btnRetryRun) {
  btnRetryRun.addEventListener('click', () => {
    const isSolo = !network.peer || network.remotePlayers.size === 0;
    const isAuthority = network.isHost || isSolo;
    if (!isAuthority) return;
    modalManager.close('game-over-modal');
    runStats.startTime = performance.now();
    runStats.totalKills = 0;
    runStats.slopsEarned = 0;
    if (network.isHost) {
      network.broadcast({ type: 'DUNGEON_RETRY' });
    }
    startFloorDescent(1);
  });
}

if (btnReturnLobbyFromGo) {
  btnReturnLobbyFromGo.addEventListener('click', () => {
    modalManager.close('game-over-modal');
    if (network.isHost) {
      network.broadcast({ type: 'RETURN_TO_LOBBY' });
      returnToLobby();
    } else if (network.peer && network.isConnected) {
      network.sendToHost({ type: 'REQUEST_RETURN_TO_LOBBY' });
      returnToLobby();
    } else {
      returnToLobby();
    }
  });
}

// --- DEV ARMORY SANDBOX MODAL LOGIC ---
const devArmoryModal = document.getElementById('dev-armory-modal');
const btnCloseDevArmory = document.getElementById('btn-close-dev-armory');
const btnCloseDevArmoryBottom = document.getElementById('btn-close-dev-armory-bottom');
let currentArmoryFilter = 'all';

function openDevArmoryModal() {
  if (currentFloor >= 1) {
    particles.spawnComicText(player.x, player.y - 30, 'DEV ARMORY DISABLED IN DUNGEON!', '#ef4444');
    audio.playBonk();
    return;
  }
  modalManager.open('dev-armory-modal');
}

function closeDevArmoryModal() {
  modalManager.close('dev-armory-modal');
}

function toggleDevArmoryModal() {
  if (currentFloor >= 1) return;
  modalManager.toggle('dev-armory-modal');
}

if (btnCloseDevArmory) {
  btnCloseDevArmory.addEventListener('click', closeDevArmoryModal);
}
if (btnCloseDevArmoryBottom) {
  btnCloseDevArmoryBottom.addEventListener('click', closeDevArmoryModal);
}

// --- SETTINGS & GRAPHICS / AUDIO CONFIG LOGIC ---
const settingsModal = document.getElementById('settings-modal');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');

function openSettingsModal() {
  modalManager.open('settings-modal');
}

function closeSettingsModal() {
  modalManager.close('settings-modal');
}

function toggleSettingsModal() {
  modalManager.toggle('settings-modal');
}

function updateSettingsUIFromState() {
  if (!settings || !settings.settings) return;
  const current = settings.settings;

  // Preset Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === current.preset);
  });

  // Toggle Glow
  const toggleGlow = document.getElementById('toggle-glow');
  if (toggleGlow) {
    toggleGlow.textContent = current.enableGlow ? 'ON (BERKILAU)' : 'OFF (CEPAT)';
    toggleGlow.classList.toggle('active', !!current.enableGlow);
  }

  // Particle Quality
  document.querySelectorAll('#group-particles .choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === current.particleQuality);
  });

  // Damage Text (syncs with damageNumbers and showDamageText)
  const dmgVal = current.damageNumbers || (current.showDamageText === false ? 'off' : 'full');
  document.querySelectorAll('#group-damage-text .choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === dmgVal);
  });

  // Screen Shake
  document.querySelectorAll('#group-screen-shake .choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === current.screenShake);
  });

  // FPS Counter Toggle
  const toggleFps = document.getElementById('toggle-fps');
  if (toggleFps) {
    toggleFps.textContent = current.showFps ? 'HIDUP' : 'MATI';
    toggleFps.classList.toggle('active', !!current.showFps);
  }
  const hudBadge = document.getElementById('hud-fps-badge');
  if (hudBadge) {
    hudBadge.classList.toggle('hidden', !current.showFps);
  }

  // Sliders
  const sliderMaster = document.getElementById('slider-master-vol');
  const valMaster = document.getElementById('val-master-vol');
  if (sliderMaster && valMaster) {
    sliderMaster.value = current.masterVolume ?? 80;
    valMaster.textContent = `${sliderMaster.value}%`;
  }

  const sliderBgm = document.getElementById('slider-bgm-vol');
  const valBgm = document.getElementById('val-bgm-vol');
  if (sliderBgm && valBgm) {
    sliderBgm.value = current.bgmVolume !== undefined ? current.bgmVolume : 60;
    valBgm.textContent = `${sliderBgm.value}%`;
  }

  const sliderSfx = document.getElementById('slider-sfx-vol');
  const valSfx = document.getElementById('val-sfx-vol');
  if (sliderSfx && valSfx) {
    sliderSfx.value = current.sfxVolume ?? 80;
    valSfx.textContent = `${sliderSfx.value}%`;
  }

  // Mute Button
  const toggleMute = document.getElementById('toggle-mute');
  if (toggleMute) {
    toggleMute.textContent = current.isMuted ? 'MUTED: ON' : 'MUTE: OFF';
    toggleMute.classList.toggle('active', !!current.isMuted);
  }
}

function initSettingsUI() {
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openSettingsModal();
    });
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closeSettingsModal();
    });
  }
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closeSettingsModal();
    });
  }

  // Close when clicking directly on backdrop
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetKey = btn.getAttribute('data-preset');
      settings.applyPreset(presetKey);
      audio.playCoinPickup();
      updateSettingsUIFromState();
    });
  });

  // Glow Toggle
  const toggleGlow = document.getElementById('toggle-glow');
  if (toggleGlow) {
    toggleGlow.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.update({ enableGlow: !settings.settings.enableGlow });
      audio.playFootstep();
      updateSettingsUIFromState();
    });
  }

  // Particle Quality
  document.querySelectorAll('#group-particles .choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-val');
      settings.update({ particleQuality: val });
      audio.playFootstep();
      updateSettingsUIFromState();
    });
  });

  // Damage Text
  document.querySelectorAll('#group-damage-text .choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-val');
      settings.update({ damageNumbers: val, showDamageText: val !== 'off' });
      audio.playFootstep();
      updateSettingsUIFromState();
    });
  });

  // Screen Shake
  document.querySelectorAll('#group-screen-shake .choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-val');
      settings.update({ screenShake: val });
      audio.playFootstep();
      updateSettingsUIFromState();
    });
  });

  // FPS Counter Toggle
  const toggleFps = document.getElementById('toggle-fps');
  if (toggleFps) {
    toggleFps.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.update({ showFps: !settings.settings.showFps });
      audio.playFootstep();
      updateSettingsUIFromState();
    });
  }

  // Sliders
  const sliderMaster = document.getElementById('slider-master-vol');
  if (sliderMaster) {
    sliderMaster.addEventListener('input', (e) => {
      const vol = Number(e.target.value);
      settings.update({ masterVolume: vol });
      audio.setMasterVolume(vol / 100);
      const valMaster = document.getElementById('val-master-vol');
      if (valMaster) valMaster.textContent = `${vol}%`;
    });
  }

  const sliderBgm = document.getElementById('slider-bgm-vol');
  if (sliderBgm) {
    sliderBgm.addEventListener('input', (e) => {
      const vol = Number(e.target.value);
      settings.update({ bgmVolume: vol });
      audio.setBgmVolume(vol / 100);
      const valBgm = document.getElementById('val-bgm-vol');
      if (valBgm) valBgm.textContent = `${vol}%`;
    });
  }

  const sliderSfx = document.getElementById('slider-sfx-vol');
  if (sliderSfx) {
    sliderSfx.addEventListener('input', (e) => {
      const vol = Number(e.target.value);
      settings.update({ sfxVolume: vol });
      audio.setSfxVolume(vol / 100);
      const valSfx = document.getElementById('val-sfx-vol');
      if (valSfx) valSfx.textContent = `${vol}%`;
    });
  }

  // Mute Toggle
  const toggleMute = document.getElementById('toggle-mute');
  if (toggleMute) {
    toggleMute.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextMuted = !settings.settings.isMuted;
      settings.update({ isMuted: nextMuted });
      audio.setMuted(nextMuted);
      updateSettingsUIFromState();
    });
  }

  // Initialize UI state
  updateSettingsUIFromState();
}

initSettingsUI();

// --- MODAL MANAGER REGISTRATION & LIFECYCLE HOOKS ---
modalManager.register('floor-modal', {
  onOpen: () => audio.playSwing(),
  onClose: () => audio.playFootstep()
});
modalManager.register('inventory-modal', {
  onOpen: () => { renderInventoryUI(); audio.playSwing(); },
  onClose: () => audio.playFootstep()
});
modalManager.register('wardrobe-modal', {
  onOpen: () => { inputPlayerName.focus(); inputPlayerName.select(); audio.playSwing(); },
  onClose: () => audio.playFootstep()
});
modalManager.register('merchant-modal', {
  onOpen: () => {
    updateSlopsUI();
    switchMerchantTab(activeMerchantTab);
    audio.playSwing();
    if (slopMerchant) slopMerchant.sayRandomGreeting();
  },
  onClose: () => audio.playFootstep()
});
modalManager.register('wheel-altar-modal', {
  onOpen: () => {
    altarWagerItem = null;
    renderWheelAltarModal();
    audio.playSwing();
  }
});
modalManager.register('blackjack-modal', {
  onOpen: async () => {
    await getBlackjackGame();
    if (blackjackTable) {
      blackjackTable.setOccupant(network.myPeerId || 'local', player.name);
      const occMsg = { type: 'BJ_TABLE_OCCUPANT', playerId: network.myPeerId || 'local', playerName: player.name, isLeaving: false };
      if (network.isHost) network.broadcast(occMsg);
      else network.sendToHost(occMsg);
    }
    selectedBjBet = Math.min(25, sharedSlops > 0 ? sharedSlops : 25);
    renderBlackjackUI();
    if (audio.playCardFlip) audio.playCardFlip();
    if (slopMerchant) slopMerchant.sayRandomBjWelcome(player.name);
  },
  onClose: () => {
    if (blackjackTable) {
      blackjackTable.clearOccupant();
      const occMsg = { type: 'BJ_TABLE_OCCUPANT', playerId: network.myPeerId || 'local', playerName: player.name, isLeaving: true };
      if (network.isHost) network.broadcast(occMsg);
      else network.sendToHost(occMsg);
    }
  }
});
modalManager.register('dev-armory-modal', {
  onOpen: () => {
    audio.playChestOpen();
    renderArmoryItems(currentArmoryFilter);
  },
  onClose: () => audio.playFootstep()
});
modalManager.register('settings-modal', {
  onOpen: () => {
    try { updateSettingsUIFromState(); } catch (e) {}
    try { audio.playFootstep(); } catch (e) {}
  },
  onClose: () => {
    try { audio.playFootstep(); } catch (e) {}
  }
});
modalManager.initBackdropDismiss();

function closeAnyOpenModal() {
  return modalManager.close();
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modalManager.handleEscapeKey(e);
  }
});

// Quick Set Equippers
document.querySelectorAll('.armory-set-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const setName = btn.getAttribute('data-set');
    equipFullSet(setName);
  });
});

function equipFullSet(setName) {
  ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand'].forEach(slot => {
    player.unequipSlot(slot);
  });

  if (setName === 'strip') {
    player.syncHUD();
    renderInventoryUI();
    broadcastMyState();
    audio.playSwing();
    particles.spawnComicText(player.x, player.y - 30, '🚫 STRIPPED ALL GEAR', '#f87171');
    return;
  }

  let itemsToEquip = [];
  let bannerText = '';
  let bannerColor = '#facc15';

  if (setName === 'gojo') {
    itemsToEquip = ['gojo_blindfold', 'gojo_tunic', 'gojo_slacks', 'gojo_loafers', 'lapse_blue', 'reversal_red'];
    bannerText = '⚡ EQUIPPED THE HONORED ONE SET!';
    bannerColor = '#00f0ff';
  } else if (setName === 'sukuna') {
    itemsToEquip = ['sukuna_crown', 'sukuna_robe', 'sukuna_hakama', 'sukuna_zori', 'sukuna_cleaver', 'sukuna_kamutoke'];
    bannerText = '🗡️ EQUIPPED KING OF CURSES SET!';
    bannerColor = '#ff2a5f';
  } else if (setName === 'toji') {
    itemsToEquip = ['toji_worm', 'toji_shirt', 'toji_pants', 'toji_slippers', 'inverted_spear_chain'];
    bannerText = '⛓️ EQUIPPED SORCERER KILLER SET!';
    bannerColor = '#38bdf8';
  } else if (setName === 'guts') {
    itemsToEquip = ['guts_beast_helm', 'guts_berserker_plate', 'guts_greaves', 'guts_sollerets', 'dragon_slayer'];
    bannerText = '⚔️ EQUIPPED THE BLACK SWORDSMAN SET!';
    bannerColor = '#ef4444';
  } else if (setName === 'levi') {
    itemsToEquip = ['scout_hood', 'odm_harness', 'scout_trousers', 'scout_boots', 'dual_snap_blades'];
    bannerText = '🌪️ EQUIPPED HUMANITY\'S STRONGEST SET!';
    bannerColor = '#10b981';
  } else if (setName === 'david') {
    itemsToEquip = ['david_kiroshi', 'david_jacket', 'david_pants', 'david_sneakers', 'david_shotgun', 'david_gorilla_arms'];
    bannerText = '⚡ EQUIPPED NIGHT CITY LEGEND SET!';
    bannerColor = '#00ff88';
  } else if (setName === 'starter') {
    itemsToEquip = ['iron_visor', 'leather_tunic', 'cloth_pants', 'travel_boots', 'rusty_sword', 'wooden_buckler'];
    bannerText = '🛡️ EQUIPPED STARTER GEAR!';
    bannerColor = '#cbd5e1';
  }

  itemsToEquip.forEach(id => {
    if (ITEM_CATALOG[id]) {
      player.equipItem(ITEM_CATALOG[id]);
    }
  });

  player.syncHUD();
  renderInventoryUI();
  broadcastMyState();
  audio.playChestOpen();
  particles.spawnComicText(player.x, player.y - 30, bannerText, bannerColor);
}

// Filter Tabs
document.querySelectorAll('.armory-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.armory-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentArmoryFilter = btn.getAttribute('data-filter') || 'all';
    renderArmoryItems(currentArmoryFilter);
  });
});

function renderArmoryItems(filter = 'all') {
  const grid = document.getElementById('armory-items-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const allItems = Object.values(ITEM_CATALOG);
  const animeIds = [
    'gojo_blindfold', 'gojo_tunic', 'gojo_slacks', 'gojo_loafers', 'lapse_blue', 'reversal_red',
    'sukuna_crown', 'sukuna_robe', 'sukuna_hakama', 'sukuna_zori', 'sukuna_kamutoke', 'sukuna_cleaver', 'sukuna_finger', 'sukuna_hiten',
    'toji_worm', 'toji_shirt', 'toji_pants', 'toji_slippers', 'inverted_spear_chain',
    'guts_beast_helm', 'guts_berserker_plate', 'guts_greaves', 'guts_sollerets', 'dragon_slayer',
    'scout_hood', 'odm_harness', 'scout_trousers', 'scout_boots', 'dual_snap_blades',
    'david_kiroshi', 'david_jacket', 'david_pants', 'david_sneakers', 'david_shotgun', 'david_gorilla_arms'
  ];

  const filtered = allItems.filter(item => {
    if (!item || !item.slot || item.slot === 'consumable') return false;
    if (filter === 'all') return true;
    if (filter === 'weapon') return item.slot === 'weapon' || item.slot === 'offhand';
    if (filter === 'armor') return ['helmet', 'chest', 'pants', 'boots'].includes(item.slot);
    if (filter === 'anime') return animeIds.includes(item.id);
    return true;
  });

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'armory-item-card';
    const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
    card.style.borderColor = rarity.border;

    const stats = [];
    if (item.damage) stats.push(`DMG: ${item.damage}`);
    if (item.defense) stats.push(`DEF: +${item.defense}`);
    if (item.hpBonus) stats.push(`HP: +${item.hpBonus}`);
    if (item.speedBonus) stats.push(`SPD: +${item.speedBonus}`);
    if (item.hands === 2) stats.push(`2H`);

    card.innerHTML = `
      <div class="armory-item-header">
        <span class="armory-item-title" style="color: ${rarity.color};">${item.name}</span>
        <span class="armory-item-slot-badge">${item.slot}</span>
      </div>
      <div class="armory-item-stats">
        ${stats.join(' | ') || item.desc || 'Standard Equipment'}
      </div>
      <div class="armory-item-actions">
        <button class="armory-action-btn armory-equip-btn" data-id="${item.id}">EQUIP</button>
        <button class="armory-action-btn armory-bag-btn" data-id="${item.id}">+ BAG</button>
      </div>
    `;

    card.querySelector('.armory-equip-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      player.equipItem(item);
      player.syncHUD();
      renderInventoryUI();
      broadcastMyState();
      audio.playSwing();
      particles.spawnComicText(player.x, player.y - 20, `EQUIPPED ${item.name}!`, rarity.color);
    });

    card.querySelector('.armory-bag-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (player.inventory.length >= player.maxInventorySize) {
        particles.spawnComicText(player.x, player.y - 20, 'BACKPACK FULL!', '#ef4444');
        audio.playBonk();
        return;
      }
      player.inventory.push(item);
      renderInventoryUI();
      audio.playCoinPickup();
      particles.spawnComicText(player.x, player.y - 20, `+1 ${item.name}`, '#facc15');
    });

    grid.appendChild(card);
  });
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
    isDowned: player.isDowned,
    downedTimer: player.downedTimer,
    maxDownedTimer: player.maxDownedTimer,
    isDead: player.isDead,
    reviveProgress: player.reviveProgress,
    invulnerableTimer: player.invulnerableTimer,
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
  if (!network.isHost && network.peer) return;
  cinematics.projectiles.push(proj);
  audio.playLightningDagger();
  particles.spawnComicText(dummy.x, dummy.y - 32, 'ENERGY BLAST! 💥', '#f59e0b');
  const shootMsg = { type: 'BOT_SHOOT', proj: { ...proj, caster: null } };
  if (network.isHost) network.broadcast(shootMsg);
};

dummy.onMeleeHit = (target, dmg, angle) => {
  if (!network.isHost && network.peer) return;
  if (target === player) {
    hitPlayer(dmg, angle, 480);
  } else {
    for (const [peerId, remote] of network.remotePlayers.entries()) {
      if (remote === target) {
        if (network.isHost) {
          network.broadcast({
            type: 'BOT_MELEE_HIT',
            targetPeerId: peerId,
            damage: dmg,
            angle: angle
          });
        }
        break;
      }
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
    network.sendTo(joinedPeerId, { type: 'SLOPS_SYNC', amount: sharedSlops });
    setTimeout(() => {
      sendFullLootSync(joinedPeerId);
      network.sendTo(joinedPeerId, { type: 'SLOPS_SYNC', amount: sharedSlops });
    }, 250);
  }
};

network.onPlayerLeft = () => {
  updatePartyRoster();
};

network.onHostMigration = (newHostId, isSelf) => {
  updatePartyRoster();
  if (isSelf) {
    if (audio.playChestOpen) audio.playChestOpen();
    if (cinematics.addScreenShake) cinematics.addScreenShake(8);
    particles.spawnComicText(player.x, player.y - 35, '👑 YOU ARE NOW THE ROOM HOST!', '#fbbf24');
    if (currentFloor >= 1 && currentDungeon) {
      network.broadcast({
        type: 'MONSTER_BATCH_UPDATE',
        batch: monsterManager.getBatchNetworkState()
      });
      network.broadcast({
        type: 'DESCENT_SYNC',
        floorNumber: currentFloor,
        seed: currentDungeon.seed || 'migrated-seed',
        theme: currentDungeon.theme ? currentDungeon.theme.id : 'crypt'
      });
    }
  } else {
    if (audio.playFootstep) audio.playFootstep();
    const newHostPlayer = network.remotePlayers.get(newHostId);
    const hostName = newHostPlayer ? newHostPlayer.name : 'Teammate';
    particles.spawnComicText(player.x, player.y - 35, `👑 HOST MIGRATED TO ${hostName.toUpperCase()}`, '#38bdf8');
  }
};

network.onMessageReceived = (fromPeerId, msg) => {
  if (msg.type === 'PLAYER_STATE') {
    const safeName = sanitizePlayerName(msg.name);
    const safeX = validatePosition(msg.x, 0);
    const safeY = validatePosition(msg.y, 0);
    network.remotePlayers.set(fromPeerId, {
      ...msg,
      name: safeName,
      x: safeX,
      y: safeY,
      peerId: fromPeerId,
      lastSeen: performance.now()
    });
    updatePartyRoster();
  } else if (msg.type === 'REVIVE_PROGRESS') {
    if (msg.targetPeerId === network.myPeerId) {
      player.reviveProgress = msg.progress;
      if (msg.progress > 0 && Math.random() < 0.25) {
        audio.playRevivingPulse();
      }
    } else {
      const rem = network.remotePlayers.get(msg.targetPeerId);
      if (rem) {
        rem.reviveProgress = msg.progress;
      }
    }
  } else if (msg.type === 'PLAYER_REVIVED') {
    if (msg.targetPeerId === network.myPeerId) {
      player.revive(0.40);
      audio.playRevivedFanfare();
      cinematics.addScreenShake(8);
      particles.spawnComicText(player.x, player.y - 32, 'REVIVED! 💚 40% HP', '#22c55e');
      broadcastMyState();
    } else {
      const rem = network.remotePlayers.get(msg.targetPeerId);
      if (rem) {
        rem.isDowned = false;
        rem.isDead = false;
        rem.hp = Math.round((rem.maxHp || 100) * 0.40);
        rem.reviveProgress = 0;
      }
      audio.playRevivedFanfare();
      cinematics.addScreenShake(6);
    }
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
    const sanitizedDamage = validateCombatDamage(msg.damage, 2500);
    if (sanitizedDamage !== null) {
      dummy.takeHit(sanitizedDamage, msg.angle, msg.knockback || (msg.isPull ? -480 : 0));
      if (msg.isPull) {
        dummy.pullTowards(msg.pullX || 0, msg.pullY || 0, 45);
      }
      audio.playBonk();
      const hitLabel = msg.isCrit ? `CRIT! -${sanitizedDamage}` : (msg.isPull ? `PULL! -${sanitizedDamage}` : `-${sanitizedDamage}`);
      particles.spawnComicText(dummy.x, dummy.y - 24, hitLabel, msg.isCrit ? '#ff0055' : (msg.isPull ? '#00f0ff' : '#ffea00'));
    }
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
          dungeonData: currentDungeon.getSyncData(),
          merchantStock: slopMerchant ? slopMerchant.stock.map(s => ({ itemId: s.item.id, price: s.price })) : null
        });
      }
    }
  } else if (msg.type === 'DUNGEON_FLOOR_SYNC') {
    closeDevArmoryModal();
    if (currentFloor === 0) {
      resetPlayerToStarterGear();
      particles.spawnComicText(player.x, player.y - 30, 'LOBBY GEAR RESET TO STARTER! 🛡️', '#38bdf8');
    }
    currentFloor = msg.floorNumber;
    runStats.isRunOver = false;
    if (msg.runElapsedMs !== undefined) {
      runStats.startTime = performance.now() - msg.runElapsedMs;
    } else if (!runStats.startTime) {
      runStats.startTime = performance.now();
    }
    const wasDead = player.isDead || player.isDowned;
    player.isDowned = false;
    player.isDead = false;
    player.hasDroppedLootOnDeath = false;
    player.downedTimer = 0;
    player.reviveProgress = 0;
    player.hp = player.maxHp;
    player.syncHUD();
    const gameOverModalEl = document.getElementById('game-over-modal');
    if (gameOverModalEl) gameOverModalEl.classList.add('hidden');

    if (wasDead && !player.equipment?.weapon) {
      if (ITEM_CATALOG['rusty_sword']) player.equipItem(ITEM_CATALOG['rusty_sword']);
      if (ITEM_CATALOG['leather_tunic'] && !player.equipment?.chest) player.equipItem(ITEM_CATALOG['leather_tunic']);
      if (ITEM_CATALOG['cloth_pants'] && !player.equipment?.pants) player.equipItem(ITEM_CATALOG['cloth_pants']);
      if (ITEM_CATALOG['travel_boots'] && !player.equipment?.boots) player.equipItem(ITEM_CATALOG['travel_boots']);
    }

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

    if (currentDungeon.merchantRoom) {
      const mx = currentDungeon.merchantRoom.centerX;
      const my = currentDungeon.merchantRoom.centerY;
      slopMerchant = new SlopMerchant(mx, my);
      if (msg.merchantStock && msg.merchantStock.length > 0) {
        slopMerchant.stock = msg.merchantStock.map(s => {
          const item = ITEM_CATALOG[s.itemId] || { id: s.itemId, name: s.itemId, slot: 'gear', rarity: 'COMMON' };
          return { item, price: s.price };
        });
      } else {
        slopMerchant.generateWares(currentFloor, ITEM_CATALOG);
      }
      wheelAltar = new WheelAltar(mx - 240, my - 40);
      blackjackTable = new BlackjackTable(mx + 240, my - 40);
    } else {
      slopMerchant = null;
      wheelAltar = null;
      blackjackTable = null;
    }

    const hudFloor = document.getElementById('hud-floor');
    if (hudFloor) {
      hudFloor.textContent = `FLOOR ${currentFloor}: ${currentDungeon.theme.shortName}`;
      hudFloor.style.color = currentDungeon.theme.torchColor;
      hudFloor.style.textShadow = `0 0 15px ${currentDungeon.theme.torchColor}`;
    }

    // Hide LOBBY button and dev hints inside the dungeon
    const btnOpenLobby = document.getElementById('btn-open-lobby');
    if (btnOpenLobby) {
      btnOpenLobby.style.display = 'none';
    }
    const hudDevHint = document.getElementById('hud-dev-hint');
    if (hudDevHint) {
      hudDevHint.classList.add('hidden');
    }

    particles.spawnComicText(player.x, player.y - 40, `FLOOR ${currentFloor} - ${currentDungeon.theme.shortName}`, currentDungeon.theme.torchColor);
  } else if (msg.type === 'RETURN_TO_LOBBY') {
    returnToLobby(false);
  } else if (msg.type === 'REQUEST_RETURN_TO_LOBBY') {
    if (network.isHost) {
      returnToLobby(true);
    }
  } else if (msg.type === 'REQUEST_FLOOR_DESCENT') {
    if (network.isHost) {
      startFloorDescent(msg.floorNumber || (currentFloor + 1), true);
    }
  } else if (msg.type === 'PARTY_WIPE') {
    triggerPartyWipe(msg.stats);
  } else if (msg.type === 'DUNGEON_RETRY') {
    const gameOverModalEl = document.getElementById('game-over-modal');
    if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
    runStats.isRunOver = false;
    runStats.startTime = performance.now();
    runStats.totalKills = 0;
    runStats.slopsEarned = 0;
    player.isDowned = false;
    player.isDead = false;
    player.hp = player.maxHp;
    player.syncHUD();
  } else if (msg.type === 'ROOM_TRANSITION') {
    if (currentDungeon) {
      const room = currentDungeon.rooms.find(r => r.id === msg.roomId);
      if (room) {
        room.hasVisited = true;
        currentDungeon.currentRoom = room;
        currentDungeon.showRoomBanner(room);
        if (room.type === 'boss') {
          audio.updateBgmTrack('boss');
        } else {
          audio.updateBgmTrack('dungeon');
        }
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
    const sanitizedDamage = validateCombatDamage(msg.damage, 2500);
    if (sanitizedDamage !== null) {
      const monster = monsterManager.getMonsterById(msg.monsterId);
      if (monster) {
        monster.takeHit(sanitizedDamage, msg.angle, msg.knockback || 0, msg.isCrit);
        recordDamageDealt(fromPeerId, sanitizedDamage);
        particles.spawnComicText(monster.x, monster.y - 20, msg.isCrit ? `CRIT! -${sanitizedDamage}` : `-${sanitizedDamage}`, msg.isCrit ? '#ff0055' : '#fbbf24');
      }
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
      particles.spawnComicText(dummy.x, dummy.y - 32, 'ENERGY BLAST! 💥', '#f59e0b');
    }
  } else if (msg.type === 'BOT_MELEE_HIT') {
    if (msg.targetPeerId === network.myPeerId) {
      hitPlayer(msg.damage, msg.angle, 480);
    }
  } else if (msg.type === 'SHOTGUN_FIRE') {
    if (msg.peerId === network.myPeerId) return;
    const caster = network.remotePlayers.get(msg.peerId) || { x: msg.x, y: msg.y, angle: msg.angle };
    spawnShotgunPellets(caster, true);
    if (audio.playCarnageShotgun) audio.playCarnageShotgun();
  } else if (msg.type === 'SLOPS_SYNC') {
    const safeAmount = validateSlopsAmount(msg.amount, 999999);
    if (safeAmount !== null) {
      sharedSlops = safeAmount;
      updateSlopsUI();
    }
  } else if (msg.type === 'MERCHANT_ATTACKED') {
    if (slopMerchant) {
      const attacker = network.remotePlayers.get(msg.attackerPeerId) || player;
      slopMerchant.handleAttacked(attacker, audio, cinematics, particles);
    }
  } else if (msg.type === 'SHOP_WARES_REFRESH') {
    if (slopMerchant) {
      slopMerchant.stock = msg.stock.map(s => {
        const item = ITEM_CATALOG[s.itemId] || { id: s.itemId, name: s.itemId, slot: 'gear', rarity: 'COMMON' };
        return { item, price: s.price };
      });
      if (audio.playCashReroll) audio.playCashReroll();
      if (merchantModal && !merchantModal.classList.contains('hidden') && activeMerchantTab === 'shop') {
        renderShopTab();
      }
    }
  } else if (msg.type === 'WHEEL_SPIN_START') {
    if (wheelAltar) {
      const wagerItem = { name: msg.wagerItemName, rarity: 'COMMON' };
      if (slopMerchant) {
        slopMerchant.sayRandomWheelStart(msg.spinnerName);
      }
      wheelAltar.startSpin(msg.spinnerId, msg.spinnerName, wagerItem, msg.targetAngle, msg.duration, msg.result, (res) => {
        if (slopMerchant) slopMerchant.sayRandomWheelResult(res, null, msg.spinnerName);
      });
    }
  } else if (msg.type === 'BJ_TABLE_OCCUPANT') {
    if (blackjackTable) {
      if (msg.isLeaving) {
        blackjackTable.clearOccupant();
      } else {
        blackjackTable.setOccupant(msg.playerId, msg.playerName);
      }
    }
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
  const merchantTarget = (currentFloor >= 1 && slopMerchant && Math.hypot(player.x - slopMerchant.x, player.y - slopMerchant.y) <= 450) ? [slopMerchant] : [];
  const targets = currentFloor === 0
    ? [dummy, ...network.remotePlayers.values()]
    : [...monsterManager.getNearbyMonsters(player.x, player.y, 450), ...merchantTarget, ...network.remotePlayers.values()];
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
        // Drop 1-3 Slop coins from smashed pot!
        spawnSlopCoins(container.x, container.y, 1 + Math.floor(Math.random() * 3), 4, player);
      }
    }
  }

  for (const hit of hits) {
    if (hit.target === slopMerchant) {
      slopMerchant.handleAttacked(player, audio, cinematics, particles);
      const attackMsg = { type: 'MERCHANT_ATTACKED', attackerPeerId: network.myPeerId };
      if (network.isHost) network.broadcast(attackMsg);
      else network.sendToHost(attackMsg);
    } else if (hit.target === dummy) {
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
      recordDamageDealt('local', hit.damage);
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
  const merchantTarget = (currentFloor >= 1 && slopMerchant && Math.hypot(player.x - slopMerchant.x, player.y - slopMerchant.y) <= 450) ? [slopMerchant] : [];
  const targets = currentFloor === 0
    ? [dummy, ...network.remotePlayers.values()]
    : [...monsterManager.getNearbyMonsters(player.x, player.y, 450), ...merchantTarget, ...network.remotePlayers.values()];
  const hits = combat.performOffhandAttack(player, targets);

  for (const hit of hits) {
    if (hit.target === slopMerchant) {
      slopMerchant.handleAttacked(player, audio, cinematics, particles);
      const attackMsg = { type: 'MERCHANT_ATTACKED', attackerPeerId: network.myPeerId };
      if (network.isHost) network.broadcast(attackMsg);
      else network.sendToHost(attackMsg);
    } else if (hit.target === dummy) {
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
      recordDamageDealt('local', hit.damage);

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
let revivePulseSoundTimer = 0;
let frameCount = 0;
let lastFpsUpdateTime = performance.now();
const hudFpsBadge = document.getElementById('hud-fps-badge');

function gameLoop(now) {
  try {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Real-time FPS calculation & HUD update
    frameCount++;
    if (now - lastFpsUpdateTime >= 400) {
      const currentFps = Math.round((frameCount * 1000) / Math.max(1, (now - lastFpsUpdateTime)));
      frameCount = 0;
      lastFpsUpdateTime = now;
      if (hudFpsBadge) {
        if (settings.settings.showFps) {
          hudFpsBadge.classList.remove('hidden');
          hudFpsBadge.textContent = `${currentFps} FPS`;
          if (currentFps >= 50) {
            hudFpsBadge.style.color = '#22c55e';
            hudFpsBadge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
          } else if (currentFps >= 30) {
            hudFpsBadge.style.color = '#eab308';
            hudFpsBadge.style.borderColor = 'rgba(234, 179, 8, 0.4)';
          } else {
            hudFpsBadge.style.color = '#ef4444';
            hudFpsBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }
        } else {
          hudFpsBadge.classList.add('hidden');
        }
      }
    }

    // Live Run Survival Timer update
    const hudRunTimer = document.getElementById('hud-run-timer');
    const hudRunTimerVal = document.getElementById('hud-run-timer-val');
    if (hudRunTimer && hudRunTimerVal) {
      if (currentFloor >= 1 && runStats.startTime && !runStats.isRunOver) {
        hudRunTimer.classList.remove('hidden');
        const curSec = Math.max(0, Math.floor((now - runStats.startTime) / 1000));
        const m = Math.floor(curSec / 60).toString().padStart(2, '0');
        const s = (curSec % 60).toString().padStart(2, '0');
        hudRunTimerVal.textContent = `${m}:${s}`;
      } else {
        hudRunTimer.classList.add('hidden');
      }
    }

  const wasRolling = player.isRolling;
  const modalsOpen = modalManager.isOpen();

  // Inventory toggle hotkeys: I or Tab
  if (input.justPressedI || input.justPressedTab || (input.keys.tab && !input.tabHandled)) {
    input.tabHandled = true;
    toggleInventory();
  }
  if (!input.keys.tab) input.tabHandled = false;

  // Settings toggle hotkey: O
  if (input.justPressedO) {
    toggleSettingsModal();
  }

  // ESC closes any open modal
  if (input.justPressedEscape || input.keys.escape) {
    closeAnyOpenModal();
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
    const isBotAuthority = network.isHost || !network.peer;
    dummy.update(worldDt, [player, ...network.remotePlayers.values()], isBotAuthority);
    readyCircle.update(worldDt, player, network.remotePlayers);
    wardrobeStation.update(worldDt);
    floorStation.update(worldDt);
    devArmoryChest.update(worldDt);
  } else if (currentFloor >= 1 && currentDungeon) {
    // Update Slop Merchant (with RPG windup, laser aiming, and rocket launch)
    if (slopMerchant) {
      slopMerchant.update(worldDt, audio, cinematics, particles);
    }
    if (wheelAltar) {
      wheelAltar.update(worldDt, audio, cinematics, particles);
    }
    if (blackjackTable) {
      blackjackTable.update(worldDt);
    }

    // Update Slop Coins (with auto magnetic pull towards nearby players & homing to killer)
    const allLivingPlayers = [player, ...network.remotePlayers.values()].filter(p => p && !p.isDead);
    for (let cIdx = slopCoins.length - 1; cIdx >= 0; cIdx--) {
      const coin = slopCoins[cIdx];
      coin.update(worldDt, player);

      for (const p of allLivingPlayers) {
        const dist = Math.hypot(p.x - coin.x, p.y - coin.y);
        if (dist <= (p.radius || 22) + coin.radius + 8) {
          sharedSlops += coin.value;
          if (currentFloor >= 1) {
            runStats.slopsEarned += coin.value;
          }
          updateSlopsUI();
          audio.playCoinPickup();
          particles.spawnComicText(p.x, p.y - 25, `+${coin.value} SLOPS 🪙`, '#fbbf24');
          broadcastSlops();
          slopCoins.splice(cIdx, 1);
          break;
        }
      }
    }

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

      if (doorTrans.targetRoom.type === 'boss') {
        audio.updateBgmTrack('boss');
      } else {
        audio.updateBgmTrack('dungeon');
      }

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
        currentDungeon.currentRoom.type !== 'spawn' && currentDungeon.currentRoom.type !== 'treasure' && currentDungeon.currentRoom.type !== 'merchant') {
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

      // Only LIVING players count towards portal readiness!
      const livingRemotes = [...network.remotePlayers.values()].filter(r => !r.isDead);
      let allLivingRemotesInside = true;
      for (const remote of livingRemotes) {
        const rDist = Math.hypot(remote.x - portal.x, remote.y - portal.y);
        if (rDist > portal.radius) {
          allLivingRemotesInside = false;
          break;
        }
      }

      const localCounts = !player.isDead;
      const localReady = !localCounts || localInside;
      const someoneInside = (localCounts && localInside) || livingRemotes.some(r => Math.hypot(r.x - portal.x, r.y - portal.y) <= portal.radius);

      portal.allReady = someoneInside && localReady && allLivingRemotesInside;

      if (portal.allReady) {
        portal.isCountingDown = true;
        portal.countdown = (portal.countdown !== undefined ? portal.countdown : 3.0) - worldDt;
        if (portal.countdown <= 0) {
          portal.countdown = 0;
          portal.isCountingDown = false;
          if (network.isHost || !network.isConnected) {
            startFloorDescent(currentFloor + 1);
          } else {
            network.sendToHost({ type: 'REQUEST_FLOOR_DESCENT', floorNumber: currentFloor + 1 });
          }
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
    // Spelunky Slop Merchant RPG Rocket Detonation
    if (proj.type === 'merchant_rpg_rocket') {
      proj.life = 0; // consumed on impact
      audio.playRocketExplosion();
      cinematics.addScreenShake(18);
      particles.spawnDashBurst(proj.x, proj.y, 0, '#f97316');
      particles.spawnComicText(proj.x, proj.y - 32, '💥 RPG BLAST!', '#ef4444');

      // AoE Splash: damages instigator and anyone caught in splash radius!
      const splashRadius = proj.aoeRadius || 130;
      const pDist = Math.hypot(player.x - proj.x, player.y - proj.y);
      if (pDist <= splashRadius) {
        const splashAngle = Math.atan2(player.y - proj.y, player.x - proj.x);
        hitPlayer(proj.damage || 65, splashAngle, 650, 'RPG DETONATION! 💥');
      }

      // Blast nearby remote peers
      for (const [peerId, remote] of network.remotePlayers.entries()) {
        const rDist = Math.hypot(remote.x - proj.x, remote.y - proj.y);
        if (rDist <= splashRadius) {
          const splashAngle = Math.atan2(remote.y - proj.y, remote.x - proj.x);
          const kx = Math.cos(splashAngle) * 600;
          const ky = Math.sin(splashAngle) * 600;
          const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
          if (network.isHost) network.broadcast(slapMsg);
          else network.sendToHost(slapMsg);
        }
      }
      return;
    }

    if (target === player) {
      if (proj.type === 'shotgun_pellet') {
        hitPlayer(proj.damage || 14, Math.atan2(proj.vy || 0, proj.vx || 0), proj.knockback || 120);
        return;
      }
      if (proj.type === 'bot_laser_bolt') {
        hitPlayer(proj.damage || 20, Math.atan2(proj.vy || 0, proj.vx || 0), 220, '-20 (LASER!)', '#06b6d4');
        return;
      }
      if (proj.type === 'bot_micro_missile') {
        audio.playHammerSmash();
        cinematics.addScreenShake(10);
        particles.spawnDashBurst(player.x, player.y, 0, '#ef4444');
        hitPlayer(proj.damage || 28, Math.atan2(proj.vy || 0, proj.vx || 0), 480, 'MISSILE BLAST! 🚀', '#f59e0b');
        return;
      }
      if (proj.type === 'bot_energy_orb' || proj.caster === dummy || (proj.caster instanceof Monster)) {
        hitPlayer(proj.damage || 22, Math.atan2(proj.vy || 0, proj.vx || 0), 450);
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
      recordDamageDealt('local', proj.damage);
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
          if (proj.caster === player && (proj.vx || proj.vy || proj.knockback)) {
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
  }, (dungeon && dungeon.currentRoom && dungeon.currentRoom.obstacles) ? dungeon.currentRoom.obstacles : [], (obstacle, proj) => {
    // Tactical cover: Obstacle / pillar blocks projectile!
    if (proj.type === 'merchant_rpg_rocket') {
      audio.playRocketExplosion();
      cinematics.addScreenShake(18);
      particles.spawnDashBurst(proj.x, proj.y, 0, '#f97316');
      particles.spawnComicText(proj.x, proj.y - 32, '💥 RPG BLAST!', '#ef4444');

      // AoE Splash: damages instigator and anyone caught in splash radius!
      const splashRadius = proj.aoeRadius || 130;
      const pDist = Math.hypot(player.x - proj.x, player.y - proj.y);
      if (pDist <= splashRadius) {
        const splashAngle = Math.atan2(player.y - proj.y, player.x - proj.x);
        hitPlayer(proj.damage || 65, splashAngle, 650, 'RPG DETONATION! 💥');
      }

      // Blast nearby remote peers
      for (const [peerId, remote] of network.remotePlayers.entries()) {
        const rDist = Math.hypot(remote.x - proj.x, remote.y - proj.y);
        if (rDist <= splashRadius) {
          const splashAngle = Math.atan2(remote.y - proj.y, remote.x - proj.x);
          const kx = Math.cos(splashAngle) * 600;
          const ky = Math.sin(splashAngle) * 600;
          const slapMsg = { type: 'SLAP_KNOCKBACK', targetPeerId: peerId, kx, ky };
          if (network.isHost) network.broadcast(slapMsg);
          else network.sendToHost(slapMsg);
        }
      }
      return;
    }

    if (proj.type === 'cannon_arm') {
      audio.playHammerSmash();
      cinematics.addScreenShake(14);
      particles.spawnDashBurst(proj.x, proj.y, 0, '#f59e0b');
      particles.spawnComicText(proj.x, proj.y - 28, '💥 IMPACT!', '#ef4444');
      return;
    }

    if (proj.type === 'bot_micro_missile') {
      audio.playHammerSmash();
      cinematics.addScreenShake(8);
      particles.spawnDashBurst(proj.x, proj.y, 0, '#ef4444');
      particles.spawnComicText(proj.x, proj.y - 24, '💥 DEFLECTED!', '#f59e0b');
      return;
    }

    if (proj.type === 'bot_laser_bolt') {
      audio.playBonk();
      particles.spawnDashBurst(proj.x, proj.y, Math.atan2(proj.vy || 0, proj.vx || 0) + Math.PI, '#06b6d4');
      particles.spawnComicText(proj.x, proj.y - 18, 'BLOCKED! 🛡️', '#06b6d4');
      return;
    }

    if (proj.type === 'bot_energy_orb') {
      audio.playBonk();
      particles.spawnDashBurst(proj.x, proj.y, Math.atan2(proj.vy || 0, proj.vx || 0) + Math.PI, '#a855f7');
      particles.spawnComicText(proj.x, proj.y - 18, 'ABSORBED! 🛡️', '#a855f7');
      return;
    }

    // Default: shotgun pellets, slashes, other kinetic projectiles
    audio.playBonk();
    cinematics.addScreenShake(2);
    particles.spawnDashBurst(proj.x, proj.y, Math.atan2(proj.vy || 0, proj.vx || 0) + Math.PI, '#cbd5e1');
    particles.spawnComicText(proj.x, proj.y - 18, 'CLANG! 🛡️', '#94a3b8');
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

  // --- DOWNED & REVIVE CO-OP CHANNELING LOOP ---
  let isRevivingTeammate = false;
  if (!player.isDowned && !player.isDead) {
    let nearestDownedPeer = null;
    let nearestDownedDist = 75; // 75px revive interaction radius

    for (const [peerId, remote] of network.remotePlayers.entries()) {
      if (remote.isDowned && !remote.isDead) {
        const dist = Math.hypot(remote.x - player.x, remote.y - player.y);
        if (dist <= 75) {
          remote.showRevivePrompt = true;
          if (dist < nearestDownedDist) {
            nearestDownedDist = dist;
            nearestDownedPeer = { peerId, remote };
          }
        } else {
          remote.showRevivePrompt = false;
        }
      } else {
        remote.showRevivePrompt = false;
      }
    }

    if (nearestDownedPeer) {
      if (input.keys.e && !modalsOpen) {
        isRevivingTeammate = true;
        const target = nearestDownedPeer.remote;
        target.reviveProgress = (target.reviveProgress || 0) + dt;

        revivePulseSoundTimer -= dt;
        if (revivePulseSoundTimer <= 0) {
          revivePulseSoundTimer = 0.28;
          audio.playRevivingPulse();
        }

        if (Math.random() < 0.45) {
          particles.spawnDashBurst(target.x, target.y, Math.random() * Math.PI * 2, '#22c55e');
        }

        const progMsg = {
          type: 'REVIVE_PROGRESS',
          targetPeerId: nearestDownedPeer.peerId,
          progress: target.reviveProgress
        };
        if (network.isHost) network.broadcast(progMsg);
        else network.sendToHost(progMsg);

        if (target.reviveProgress >= 2.5) {
          target.isDowned = false;
          target.isDead = false;
          target.hp = Math.round((target.maxHp || 100) * 0.40);
          target.reviveProgress = 0;
          target.showRevivePrompt = false;

          audio.playRevivedFanfare();
          cinematics.addScreenShake(8);
          particles.spawnComicText(target.x, target.y - 30, 'TEAMMATE REVIVED! 💚 40% HP', '#22c55e');

          const revMsg = {
            type: 'PLAYER_REVIVED',
            targetPeerId: nearestDownedPeer.peerId
          };
          if (network.isHost) network.broadcast(revMsg);
          else network.sendToHost(revMsg);
        }
      } else {
        const target = nearestDownedPeer.remote;
        if (target.reviveProgress > 0) {
          target.reviveProgress = Math.max(0, target.reviveProgress - dt * 2.5);
          const progMsg = {
            type: 'REVIVE_PROGRESS',
            targetPeerId: nearestDownedPeer.peerId,
            progress: target.reviveProgress
          };
          if (network.isHost) network.broadcast(progMsg);
          else network.sendToHost(progMsg);
        }
      }
    }
  }

  // If local player is downed and not being channeled, slowly decay revive progress
  if (player.isDowned && player.reviveProgress > 0) {
    player.reviveProgress = Math.max(0, player.reviveProgress - dt * 1.5);
  }

  // --- PLAYER DEATH GEAR DROP DETECTION ---
  if (player.isDead) {
    if (!player.hasDroppedLootOnDeath) {
      player.hasDroppedLootOnDeath = true;
      dropAllPlayerItemsOnDeath(player);
    }
  } else {
    player.hasDroppedLootOnDeath = false;
  }

  // --- RUN CONCLUSION: PARTY WIPE DETECTION (STEP 5.2) ---
  if (currentFloor >= 1 && currentDungeon && !runStats.isRunOver) {
    const isLocalDownedOrDead = player.isDowned || player.isDead;
    if (isLocalDownedOrDead) {
      let isWiped = false;
      if (network.remotePlayers.size === 0) {
        // Solo mode: wiped when dead or downed
        isWiped = player.isDead || player.isDowned;
      } else {
        // Co-op mode: wiped when all active teammates are downed or dead
        const allRemotesDownOrDead = [...network.remotePlayers.values()].every(r => r.isDowned || r.isDead);
        isWiped = allRemotesDownOrDead;
      }

      if (isWiped) {
        triggerPartyWipe();
      }
    }
  }

  // Dead Player Respawn check (Lobby only)
  if (player.isDead && currentFloor === 0) {
    if (input.justPressedSpace || input.justPressedR) {
      player.revive(1.0);
      readyCircle.reset();
      particles.spawnComicText(player.x, player.y - 30, 'RESPAWNED! 🏕️', '#38bdf8');
      player.x = 0;
      player.y = 0;
      broadcastMyState();
    }
  }

  // [E] Key interactions (Pick up loot OR Open Mirror OR Open Floor Gateway OR Dev Armory OR Open Merchant OR Casino Props)
  if (input.justPressedE && !modalsOpen && !isRevivingTeammate && !player.isDowned && !player.isDead) {
    if (currentFloor === 0 && devArmoryChest.isNear(player)) {
      openDevArmoryModal();
    } else if (currentFloor === 0 && floorStation.isPlayerNearby(player)) {
      openFloorModal();
    } else if (currentFloor === 0 && wardrobeStation.isPlayerNearby(player)) {
      openWardrobe();
    } else if (currentFloor >= 1 && slopMerchant && slopMerchant.isNear(player)) {
      openMerchantModal();
    } else if (currentFloor >= 1 && wheelAltar && wheelAltar.isNear(player)) {
      openWheelAltarModal();
    } else if (currentFloor >= 1 && blackjackTable && blackjackTable.isNear(player)) {
      openBlackjackModal();
    } else {
      tryPickupNearbyLoot();
    }
  }

  // [F] Key: Toggle Floor Selection Modal anytime for instant level testing!
  if (input.justPressedF && !modalsOpen && !player.isDowned && !player.isDead) {
    toggleFloorModal();
  }

  // [G] Key: Toggle Dev Armory Sandbox Gear ONLY at Base Camp (currentFloor === 0)!
  if (input.justPressedG && currentFloor === 0 && !modalsOpen && !player.isDowned && !player.isDead) {
    toggleDevArmoryModal();
  }

  // [Q] Key: Active ability (Checks for Full Set Ultimate first, then Base Chest ability)
  if (input.justPressedQ && !modalsOpen && !player.isDowned && !player.isDead) {
    combat.triggerActiveAbility(player, activeSet, onTriggerCinematic);
  }

  // [R] Key: Manual Reload for Carnage Shotgun
  if (input.justPressedR && !modalsOpen && !player.isDowned && !player.isDead) {
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
    if (player.isDowned || player.isDead) return false;
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
  if (input.justPressedLeft && !modalsOpen && !player.isStunned && !player.isDowned && !player.isDead) {
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
  if (input.justPressedRight && !modalsOpen && !player.isBlocking && !player.isStunned && !player.isDowned && !player.isDead) {
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
  let targetCamX = player.x;
  let targetCamY = player.y;

  // In dungeon, if local player is dead in multiplayer, spectate living teammate!
  if (currentFloor >= 1 && player.isDead && network.remotePlayers.size > 0) {
    const livingTeammate = [...network.remotePlayers.values()].find(r => !r.isDead);
    if (livingTeammate) {
      targetCamX = livingTeammate.x;
      targetCamY = livingTeammate.y;
    }
  }

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

    // Dev Armory Sandbox Chest (Southwest)
    devArmoryChest.draw(renderer.ctx, player);

    // Training Dummy / Combat Automaton
    dummy.draw(renderer.ctx, Math.hypot(player.x - dummy.x, player.y - dummy.y) <= 180);
  } else if (currentFloor >= 1 && currentDungeon) {
    // Procedural Anime Dungeon (Isaac-style discrete rooms & cardinal doors)
    renderer.drawDungeon(currentDungeon, targetCamX, targetCamY, renderer.width, renderer.height, now * 0.001);

    // In-World Wheel of Slop Altar
    if (wheelAltar) {
      wheelAltar.draw(renderer.ctx, wheelAltar.isNear(player), now * 0.001);
    }

    // In-World Blackjack Table
    if (blackjackTable) {
      blackjackTable.draw(renderer.ctx, blackjackTable.isNear(player), now * 0.001);
    }

    // Slop Merchant (with rug, goods, speech bubble, and RPG)
    if (slopMerchant) {
      slopMerchant.draw(renderer.ctx, slopMerchant.isNear(player), now * 0.001);
    }

    // Slop Coins (frustum culled)
    for (const coin of slopCoins) {
      if (renderer.isEntityVisible(coin.x, coin.y, 25)) {
        coin.draw(renderer.ctx);
      }
    }

    // Themed Anime Monsters (Fly Heads, Masked Ino, Cursed Brutes, Boss Finger Bearer)
    renderer.drawMonsters(monsterManager.monsters, now * 0.001);
  }

  // Ground Loot Items (frustum culled with glowing rarity beams and closest-item [E] pickup highlight)
  let closestNearbyLoot = null;
  let closestDist = Infinity;
  for (const [_, loot] of groundItems.entries()) {
    if (loot.isNear(player)) {
      const d = Math.hypot(player.x - loot.x, player.y - loot.y);
      if (d < closestDist) {
        closestDist = d;
        closestNearbyLoot = loot;
      }
    }
  }

  for (const [_, loot] of groundItems.entries()) {
    if (renderer.isEntityVisible(loot.x, loot.y, 45)) {
      loot.draw(renderer.ctx, loot === closestNearbyLoot);
    }
  }

  // Dash after-images & particles
  renderer.drawAfterImages(player.afterImages);
  particles.draw(renderer.ctx);

  // Draw in-world cinematic projectiles (Hollow Purple, World Cutting Slash, Chains)
  cinematics.drawWorld(renderer.ctx, renderer);

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

  // Screen-space UI banners for Downed and Dead states
  if (player.isDowned) {
    const ctx = renderer.ctx;
    const w = renderer.width;
    const h = renderer.height;

    // Pulsing blood-red vignette
    const pulse = Math.sin(Date.now() * 0.006) * 0.15 + 0.35;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, 'rgba(185, 28, 28, 0)');
    grad.addColorStop(1, `rgba(185, 28, 28, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Downed Banner Bar
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 180, h - 110, 360, 48, [12]);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 14px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`🩸 DOWNED [${Math.ceil(player.downedTimer)}s] - CRAWL TO TEAMMATES!`, w / 2, h - 86);

    if (player.reviveProgress > 0) {
      const revPct = Math.max(0, Math.min(1, player.reviveProgress / 2.5));
      ctx.fillStyle = '#22c55e';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(`💚 BEING REVIVED... ${Math.round(revPct * 100)}%`, w / 2, h - 68);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px "Outfit", sans-serif';
      ctx.fillText('Teammates hold [E] nearby to revive you', w / 2, h - 68);
    }
    ctx.restore();
  } else if (player.isDead) {
    const ctx = renderer.ctx;
    const w = renderer.width;
    const h = renderer.height;

    // In multiplayer dungeon with living teammates: render spectator HUD banner!
    const livingTeammates = [...network.remotePlayers.values()].filter(r => !r.isDead);
    if (currentFloor >= 1 && livingTeammates.length > 0) {
      const living = livingTeammates[0];
      // Subtle tint so dead player can watch teammate fight
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, w, h);

      // Top Spectator Header Banner
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 270, 20, 540, 54, [12]);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 16px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`💀 YOU DIED (GEAR DROPPED) • SPECTATING: ${living.name || 'Teammate'}`, w / 2, 42);

      ctx.font = '600 12px "Outfit", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Surviving team can reach Floor ${currentFloor + 1} portal to respawn you!`, w / 2, 60);
      ctx.restore();
    } else {
      // Dark death tint
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, w, h);

      // Death Banner
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 200, h / 2 - 50, 400, 100, [16]);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 24px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('💀 YOU DIED', w / 2, h / 2 - 14);

      ctx.font = '600 13px "Outfit", sans-serif';
      ctx.fillStyle = '#38bdf8';
      if (currentFloor === 0) {
        ctx.fillText('Press [SPACE] or [R] to Respawn at Base Camp', w / 2, h / 2 + 18);
      } else {
        ctx.fillText('Party Wiped! Return to Base Camp or Retry', w / 2, h / 2 + 18);
      }
      ctx.restore();
    }
  }

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
