/**
 * Mobile HUD & Action Cluster Manager
 * Handles contextual prompts for [E], Ultimate [Q] cooldowns and icons,
 * Carnage Shotgun [R] reload status, and Lobby Respawn buttons.
 */

/**
 * Returns active ultimate/ability info and cooldown state
 * @param {Object} player
 * @param {Object|null} activeSet
 * @returns {{ icon: string, label: string, cooldown: number, remaining: number, isReady: boolean, progress: number }}
 */
export function getUltimateInfo(player, activeSet = null) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  const cooldownDuration = activeSet ? 8.0 : 5.0;
  const lastTime = player?.lastAbilityTime || 0;
  const elapsed = lastTime ? now - lastTime : Infinity;
  const isReady = elapsed >= cooldownDuration;
  const remaining = isReady ? 0 : Math.max(0, cooldownDuration - elapsed);
  const progress = isReady ? 1 : Math.min(1, Math.max(0, elapsed / cooldownDuration));

  let icon = '⚡';
  let label = 'ABILITY';

  if (activeSet && activeSet.ultimateQ) {
    switch (activeSet.ultimateQ) {
      case 'hollow_purple':
        icon = '🔮';
        label = 'PURPLE';
        break;
      case 'world_cutting_slash':
        icon = '🗡️';
        label = 'SLASH';
        break;
      case 'inverted_chain_rampage':
        icon = '⛓️';
        label = 'CHAINS';
        break;
      case 'berserker_rage':
        icon = '🩸';
        label = 'BERSERK';
        break;
      case 'levi_grapple_whirlwind':
        icon = '🦅';
        label = 'OVERDRIVE';
        break;
      case 'sandevistan_time_dilation':
        icon = '⚡';
        label = 'SANDEV';
        break;
      case 'serious_punch':
        icon = '💥';
        label = 'PUNCH';
        break;
      default:
        icon = '🔮';
        label = 'ULTIMATE';
    }
  } else if (player?.equipment?.chest) {
    const chestVisual = player.equipment.chest.visual;
    if (chestVisual === 'gojo_chest') {
      icon = '🔮';
      label = 'MUGEN';
    } else if (chestVisual === 'sukuna_chest') {
      icon = '🗡️';
      label = 'CLEAVE';
    } else if (chestVisual === 'guts_chest') {
      icon = '🩸';
      label = 'RAGE';
    } else if (chestVisual === 'toji_chest') {
      icon = '⛓️';
      label = 'STRIKE';
    } else if (chestVisual === 'david_jacket') {
      icon = '⚡';
      label = 'SANDEV';
    } else if (chestVisual === 'opm_suit') {
      icon = '👊';
      label = 'PUNCH';
    } else if (chestVisual === 'odm_harness') {
      icon = '🦅';
      label = 'ODM';
    } else {
      icon = '⚡';
      label = 'Q';
    }
  }

  return {
    icon,
    label,
    cooldown: cooldownDuration,
    remaining,
    isReady,
    progress
  };
}

/**
 * Evaluates nearest interactable in range of the player
 * @param {Object} ctx
 * @returns {{ type: string, icon: string, label: string, active: boolean }}
 */
export function getNearbyInteractable({
  player,
  currentFloor = 0,
  groundItems = null,
  remotePlayers = null,
  slopMerchant = null,
  wheelAltar = null,
  blackjackTable = null,
  floorStation = null,
  wardrobeStation = null,
  devArmoryChest = null
}) {
  if (!player) return { type: 'none', icon: '✋', label: 'INTERACT', active: false };

  // 1. Downed Teammates (Highest Priority - Revive)
  if (remotePlayers && !player.isDowned && !player.isDead) {
    for (const [_, remote] of remotePlayers) {
      if (remote && remote.isDowned && !remote.isDead) {
        const dist = Math.hypot(remote.x - player.x, remote.y - player.y);
        if (dist <= 75) {
          return { type: 'revive', icon: '💉', label: 'REVIVE', active: true };
        }
      }
    }
  }

  // 2. Ground Loot Items
  if (groundItems) {
    for (const [_, loot] of groundItems) {
      if (loot && typeof loot.isNear === 'function' && loot.isNear(player)) {
        return { type: 'loot', icon: '🪙', label: 'LOOT', active: true };
      }
    }
  }

  // 3. Base Camp Stations (Floor 0)
  if (currentFloor === 0) {
    if (devArmoryChest && typeof devArmoryChest.isNear === 'function' && devArmoryChest.isNear(player)) {
      return { type: 'armory', icon: '⚔️', label: 'ARMORY', active: true };
    }
    if (floorStation && typeof floorStation.isPlayerNearby === 'function' && floorStation.isPlayerNearby(player)) {
      return { type: 'floor', icon: '🪜', label: 'FLOORS', active: true };
    }
    if (wardrobeStation && typeof wardrobeStation.isPlayerNearby === 'function' && wardrobeStation.isPlayerNearby(player)) {
      return { type: 'wardrobe', icon: '👔', label: 'WARDROBE', active: true };
    }
  }

  // 4. Dungeon Props (Floor >= 1)
  if (currentFloor >= 1) {
    if (slopMerchant && typeof slopMerchant.isNear === 'function' && slopMerchant.isNear(player)) {
      return { type: 'merchant', icon: '🛍️', label: 'SHOP', active: true };
    }
    if (wheelAltar && typeof wheelAltar.isNear === 'function' && wheelAltar.isNear(player)) {
      return { type: 'wheel', icon: '🎰', label: 'SPIN', active: true };
    }
    if (blackjackTable && typeof blackjackTable.isNear === 'function' && blackjackTable.isNear(player)) {
      return { type: 'blackjack', icon: '🃏', label: 'PLAY', active: true };
    }
  }

  return { type: 'none', icon: '✋', label: 'INTERACT', active: false };
}

/**
 * Updates DOM representations for the mobile action cluster
 * @param {Object} options
 */
export function updateMobileClusterDOM({
  player,
  activeSet,
  interactable,
  currentFloor = 0
}) {
  if (typeof document === 'undefined' || !player) return;

  // 1. Ultimate Button
  const ultBtn = document.getElementById('touch-btn-ult');
  const ultIcon = document.getElementById('touch-ult-icon');
  const ultLabel = document.getElementById('touch-ult-label');
  const ultCd = document.getElementById('touch-ult-cd');

  if (ultBtn) {
    const info = getUltimateInfo(player, activeSet);
    if (ultIcon && ultIcon.textContent !== info.icon) ultIcon.textContent = info.icon;
    if (ultLabel && ultLabel.textContent !== info.label) ultLabel.textContent = info.label;

    if (info.isReady) {
      ultBtn.classList.add('ult-ready');
      ultBtn.classList.remove('ult-cooldown');
      if (ultCd) ultCd.style.display = 'none';
    } else {
      ultBtn.classList.remove('ult-ready');
      ultBtn.classList.add('ult-cooldown');
      if (ultCd) {
        ultCd.style.display = 'flex';
        ultCd.textContent = `${info.remaining.toFixed(1)}s`;
      }
    }
  }

  // 2. Smart Interact Button
  const interactBtn = document.getElementById('touch-btn-interact');
  const interactIcon = document.getElementById('touch-interact-icon');
  const interactLabel = document.getElementById('touch-interact-label');

  if (interactBtn) {
    if (interactIcon && interactIcon.textContent !== interactable.icon) interactIcon.textContent = interactable.icon;
    if (interactLabel && interactLabel.textContent !== interactable.label) interactLabel.textContent = interactable.label;

    if (interactable.active) {
      interactBtn.classList.add('interact-active');
      interactBtn.classList.remove('interact-idle');
    } else {
      interactBtn.classList.remove('interact-active');
      interactBtn.classList.add('interact-idle');
    }
  }

  // 3. Carnage Shotgun Reload Button
  const reloadBtn = document.getElementById('touch-btn-reload');
  const reloadAmmo = document.getElementById('touch-reload-ammo');
  const isShotgun = player.equipment?.weapon?.visual === 'david_shotgun';

  if (reloadBtn) {
    if (isShotgun && !player.isDead && !player.isDowned) {
      reloadBtn.style.display = 'flex';
      if (reloadAmmo) {
        if (player.isReloadingShotgun) {
          reloadAmmo.textContent = '...';
          reloadBtn.classList.add('reloading-pulse');
        } else {
          reloadAmmo.textContent = `${player.shotgunAmmo || 0}/${player.maxShotgunAmmo || 4}`;
          reloadBtn.classList.remove('reloading-pulse');
        }
      }
    } else {
      reloadBtn.style.display = 'none';
    }
  }

  // 4. Lobby Respawn Button
  const respawnBtn = document.getElementById('touch-respawn-btn');
  if (respawnBtn) {
    if (player.isDead && currentFloor === 0) {
      respawnBtn.style.display = 'flex';
    } else {
      respawnBtn.style.display = 'none';
    }
  }
}
