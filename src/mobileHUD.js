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

/**
 * Opens the mobile item inspection bottom sheet (Phase 3 Tap-to-Inspect)
 * @param {Object} item
 * @param {Object} options
 */
export function openItemInspectionSheet(item, options = {}) {
  if (typeof document === 'undefined' || !item) return;

  const sheet = document.getElementById('mobile-item-sheet');
  if (!sheet) return;

  const nameEl = document.getElementById('sheet-item-name');
  const slotEl = document.getElementById('sheet-item-slot');
  const descEl = document.getElementById('sheet-item-desc');
  const valEl = document.getElementById('sheet-item-value');
  const setEl = document.getElementById('sheet-item-set');
  const actionBtn = document.getElementById('sheet-btn-action');
  const dropBtn = document.getElementById('sheet-btn-drop');
  const closeBtn = document.getElementById('sheet-btn-close');
  const backdrop = sheet.querySelector ? sheet.querySelector('.sheet-backdrop') : null;

  const rarityColor = item.rarityColor || '#ffffff';
  if (nameEl) {
    nameEl.textContent = item.name || 'Unknown Item';
    nameEl.style.color = rarityColor;
  }
  if (slotEl) {
    slotEl.textContent = `[${(item.slot || 'ITEM').toUpperCase()}]`;
  }
  if (descEl) {
    descEl.textContent = item.desc || 'No description available.';
  }
  if (valEl) {
    const price = item.value || item.price || 15;
    valEl.textContent = `🪙 ${price} Slops`;
  }
  if (setEl) {
    if (item.setName || item.setKey) {
      setEl.style.display = 'inline-block';
      setEl.textContent = `✨ ${(item.setName || item.setKey).toUpperCase()} SET`;
    } else {
      setEl.style.display = 'none';
    }
  }

  const closeSheet = () => {
    sheet.classList.add('hidden');
  };

  if (closeBtn) closeBtn.onclick = closeSheet;
  if (backdrop) backdrop.onclick = closeSheet;

  if (actionBtn) {
    actionBtn.className = 'sheet-btn-action';
    if (options.isEquipped) {
      actionBtn.classList.add('unequip-action');
      actionBtn.textContent = 'UNEQUIP';
      actionBtn.onclick = () => {
        closeSheet();
        if (typeof options.onUnequip === 'function') options.onUnequip();
      };
    } else if (item.slot === 'consumable') {
      actionBtn.classList.add('use-action');
      actionBtn.textContent = 'USE';
      actionBtn.onclick = () => {
        closeSheet();
        if (typeof options.onUse === 'function') options.onUse();
      };
    } else {
      actionBtn.classList.add('primary-action');
      actionBtn.textContent = 'EQUIP';
      actionBtn.onclick = () => {
        closeSheet();
        if (typeof options.onEquip === 'function') options.onEquip();
      };
    }
  }

  if (dropBtn) {
    dropBtn.onclick = () => {
      closeSheet();
      if (typeof options.onDrop === 'function') options.onDrop();
    };
  }

  sheet.classList.remove('hidden');
}

/**
 * Closes the mobile item inspection sheet
 */
export function closeItemInspectionSheet() {
  if (typeof document === 'undefined') return;
  const sheet = document.getElementById('mobile-item-sheet');
  if (sheet) sheet.classList.add('hidden');
}

/**
 * Sets up landscape orientation detection and enforcement overlay (Phase 4)
 */
export function setupOrientationEnforcement() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const modal = document.getElementById('orientation-modal');
  const fullscreenBtn = document.getElementById('btn-fullscreen-toggle');

  const checkOrientation = () => {
    if (!modal) return;
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 1024;
    if (isPortrait) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  };

  window.addEventListener('resize', checkOrientation, { passive: true });
  window.addEventListener('orientationchange', checkOrientation, { passive: true });
  checkOrientation();

  if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
      const doc = document;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (doc.documentElement.requestFullscreen) {
          doc.documentElement.requestFullscreen().catch(() => {});
        } else if (doc.documentElement.webkitRequestFullscreen) {
          doc.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      }
    };
  }

  return { checkOrientation };
}

/**
 * Hardens touch gestures against double-tap zoom, pull-to-refresh, and pinch-zoom (Phase 4)
 */
export function setupGestureHardening() {
  if (typeof document === 'undefined') return;

  // Prevent double-tap to zoom on mobile devices
  document.addEventListener('dblclick', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Prevent pinch-to-zoom gestures on canvas and touch elements
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      e.preventDefault();
    }, { passive: false });
  });
}

