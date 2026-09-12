import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { AudioManager } from './audio.js';
import { ParticleManager } from './particles.js';
import { NetworkManager } from './network.js';
import { Dummy } from './dummy.js';
import { ReadyCircle } from './readyCircle.js';
import { CustomizationStation } from './customizationStation.js';
import { ITEM_CATALOG, ItemRarity, checkSetBonus } from './items.js';
import { CombatSystem } from './combat.js';
import { GroundLoot } from './groundLoot.js';
import { CinematicManager } from './cinematics.js';

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

readyCircle.onDescentTriggered = () => {
  audio.playDescentFanfare();
  particles.spawnComicText(readyCircle.x, readyCircle.y - 30, 'DESCENDING!', '#00ff88');

  const hudFloor = document.getElementById('hud-floor');
  if (hudFloor) {
    hudFloor.textContent = '1 (READY)';
    hudFloor.style.color = '#00ff88';
    hudFloor.style.textShadow = '0 0 15px #00ff88';
  }
};

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
  const targets = [dummy, ...network.remotePlayers.values()];
  const hits = combat.performWeaponAttack(player, targets);

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
  const targets = [dummy, ...network.remotePlayers.values()];
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
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  const wasRolling = player.isRolling;
  const modalsOpen =
    !wardrobeModal.classList.contains('hidden') ||
    !lobbyModal.classList.contains('hidden') ||
    !invModal.classList.contains('hidden');

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
  player.update(playerDt, input, dungeonBounds);
  dummy.update(worldDt, [player, ...network.remotePlayers.values()]);
  readyCircle.update(worldDt, player, network.remotePlayers);
  wardrobeStation.update(worldDt);
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
    const sliceTargets = [dummy, ...network.remotePlayers.values()];
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

  // Update Cinematics & Projectiles (collision with training dummy, player, and remote peers)
  const cinematicTargets = [dummy, player, ...network.remotePlayers.values()];
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
      if (proj.type === 'bot_energy_orb' || proj.caster === dummy) {
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

  // [E] Key interactions (Pick up loot OR Open Mirror)
  if (input.justPressedE && !modalsOpen) {
    if (wardrobeStation.isPlayerNearby(player)) {
      openWardrobe();
    } else {
      tryPickupNearbyLoot();
    }
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

      const launched = player.fireOdmCable(worldMouseX, worldMouseY, audio, particles, dungeonBounds);
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

      const launched = player.fireOdmCable(worldMouseX, worldMouseY, audio, particles, dungeonBounds);
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
  renderer.beginCamera(player.x + shake.x, player.y + shake.y);

  // Background stone floor
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

  // Ground Loot Items (with glowing rarity beams and proximity [E] pickup)
  for (const [_, loot] of groundItems.entries()) {
    loot.draw(renderer.ctx, loot.isNear(player));
  }

  // Training Dummy / Combat Automaton
  dummy.draw(renderer.ctx, Math.hypot(player.x - dummy.x, player.y - dummy.y) <= 180);

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

  // Full-screen post-processing cinematic overlays (Dark purple vortex, screen bisection cut, blood-red vignette)
  cinematics.drawScreenOverlay(renderer.ctx, renderer.width, renderer.height);

  // 4. Clear single-frame input flags
  input.endFrame();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('Step 3.4.3: Cinematic ultimates, projectile math, and set bonus attacks active');
