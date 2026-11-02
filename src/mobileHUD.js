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
      return { type: 'floor', icon: '🧪', label: 'TEST LAB', active: true };
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

  // 5. Controls Guide Visibility (Laptop/Desktop + Lobby only!)
  updateControlsHintVisibility(currentFloor);
}

/**
 * Toggles controls guide visibility:
 * Shown ONLY on laptop/desktop (not mobile) AND when in the Lobby (currentFloor === 0).
 * Hidden when in-game (dungeon, currentFloor >= 1) or on mobile devices.
 * @param {number} [currentFloor=0]
 */
export function updateControlsHintVisibility(currentFloor = 0) {
  if (typeof document === 'undefined') return;
  const hint = document.getElementById('hud-controls-hint');
  if (!hint) return;

  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth <= 900 ||
    window.innerHeight <= 550 ||
    ('ontouchstart' in window && window.innerWidth <= 1024)
  );

  // Show ONLY if on desktop/laptop AND in the safe lobby base camp (floor 0)
  if (currentFloor === 0 && !isMobile) {
    hint.classList.remove('hidden');
    hint.style.display = 'flex';
  } else {
    hint.classList.add('hidden');
    hint.style.display = 'none';
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

let toastTimeout = null;

/**
 * Displays a transient mobile toast notification for user feedback
 * @param {string} message
 * @param {number} [durationMs=3500]
 */
export function showMobileToast(message, durationMs = 3500) {
  if (typeof document === 'undefined') return;
  const toast = document.getElementById('mobile-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
    toastTimeout = null;
  }, durationMs);
}

/**
 * Checks whether the document is currently in fullscreen across browser variants
 * @returns {boolean}
 */
export function isFullscreen() {
  if (typeof document === 'undefined') return false;
  const doc = document;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Universal cross-browser fullscreen toggle supporting standard, WebKit, Moz, and MS prefixes,
 * Screen Orientation locking (Landscape), and iOS Safari fallbacks.
 * @returns {Promise<boolean>}
 */
export async function toggleFullscreen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const doc = document;
  const docEl = doc.documentElement;
  const currentlyFullscreen = isFullscreen();

  if (!currentlyFullscreen) {
    // 1. Enter Fullscreen
    const requestMethod =
      docEl?.requestFullscreen ||
      docEl?.webkitRequestFullscreen ||
      docEl?.mozRequestFullScreen ||
      docEl?.msRequestFullscreen ||
      (doc.body && (doc.body.requestFullscreen || doc.body.webkitRequestFullscreen));

    if (requestMethod) {
      try {
        const p = requestMethod.call(docEl, { navigationUI: 'hide' });
        if (p && typeof p.then === 'function') {
          await p.catch(async () => {
            // Older webkit engines reject the options object parameter
            try {
              const p2 = requestMethod.call(docEl);
              if (p2 && typeof p2.then === 'function') await p2;
            } catch (e) {
              console.warn('[Fullscreen] Direct fallback request failed:', e);
            }
          });
        }
      } catch (err) {
        try {
          requestMethod.call(docEl);
        } catch (e) {
          console.warn('[Fullscreen] Synchronous fallback failed:', e);
        }
      }
    } else {
      // iOS Safari fallback (element requestFullscreen is unsupported on iPhone)
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      const isIOS =
        /iPad|iPhone|iPod/.test(window.navigator?.userAgent || '') ||
        (window.navigator?.platform === 'MacIntel' && (window.navigator?.maxTouchPoints || 0) > 1);

      if (isIOS) {
        showMobileToast('📱 iOS Safari: Ketuk "Aa" di address bar ➔ "Hide Toolbar", atau Tambah ke Layar Utama (Add to Home Screen) untuk layar penuh!', 5000);
      }
    }

    // 2. Lock to Landscape Orientation (Crucial for mobile action gaming!)
    try {
      const orientation =
        window.screen?.orientation ||
        window.screen?.mozOrientation ||
        window.screen?.msOrientation;

      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape').catch(async () => {
          try {
            await orientation.lock('landscape-primary');
          } catch (e) {}
        });
      } else if (window.screen?.lockOrientation) {
        window.screen.lockOrientation('landscape');
      }
    } catch (err) {
      // Orientation lock requires standalone mode or active user interaction on some platforms
    }

    updateFullscreenDOMState(true);
    return true;
  } else {
    // Exit Fullscreen
    const exitMethod =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen;

    if (exitMethod) {
      try {
        const p = exitMethod.call(doc);
        if (p && typeof p.then === 'function') await p;
      } catch (err) {
        console.warn('[Fullscreen] Exit failed:', err);
      }
    }

    try {
      const orientation = window.screen?.orientation || window.screen?.mozOrientation;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      } else if (window.screen?.unlockOrientation) {
        window.screen.unlockOrientation();
      }
    } catch (e) {}

    updateFullscreenDOMState(false);
    return false;
  }
}

/**
 * Updates UI labels and active states for all fullscreen buttons across HUD, settings, and modal
 * @param {boolean} [forcedState]
 */
export function updateFullscreenDOMState(forcedState) {
  if (typeof document === 'undefined') return;

  const active = typeof forcedState === 'boolean' ? forcedState : isFullscreen();

  // 1. HUD Button
  const hudBtn = document.getElementById('btn-hud-fullscreen');
  if (hudBtn) {
    hudBtn.textContent = active ? '⛶ EXIT' : '⛶ FULLSCREEN';
    hudBtn.classList.toggle('active-fullscreen', active);
  }

  // 2. Settings Modal Button
  const settingsBtn = document.getElementById('btn-settings-fullscreen');
  if (settingsBtn) {
    settingsBtn.textContent = active ? 'AKTIF ⛶' : 'AKTIFKAN ⛶';
    settingsBtn.classList.toggle('active', active);
  }

  // 3. Orientation Modal Button
  const modalBtn = document.getElementById('btn-fullscreen-toggle');
  if (modalBtn) {
    modalBtn.textContent = active ? '⛶ EXIT FULLSCREEN' : '⛶ ENTER FULLSCREEN';
  }
}

/**
 * Sets up listeners on all fullscreen triggers and browser fullscreenchange events
 */
export function setupFullscreenController() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const hudBtn = document.getElementById('btn-hud-fullscreen');
  const settingsBtn = document.getElementById('btn-settings-fullscreen');
  const modalBtn = document.getElementById('btn-fullscreen-toggle');
  const dismissBtn = document.getElementById('btn-orientation-dismiss');
  const orientationModal = document.getElementById('orientation-modal');

  const onToggle = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleFullscreen();
  };

  if (hudBtn) {
    hudBtn.onclick = onToggle;
  }
  if (settingsBtn) {
    settingsBtn.onclick = onToggle;
  }
  if (modalBtn) {
    modalBtn.onclick = () => {
      onToggle();
      setTimeout(() => {
        if (orientationModal && window.innerWidth >= window.innerHeight) {
          orientationModal.classList.add('hidden');
        }
      }, 300);
    };
  }

  if (dismissBtn && orientationModal) {
    dismissBtn.onclick = (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      orientationModal.classList.add('hidden');
      if (orientationModal.dataset) {
        orientationModal.dataset.manuallyDismissed = 'true';
      }
    };
  }

  // Listen for browser fullscreen change events
  const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  fsEvents.forEach((evtName) => {
    document.addEventListener(evtName, () => {
      updateFullscreenDOMState();
    }, { passive: true });
  });

  updateFullscreenDOMState();
}

/**
 * Sets up landscape orientation detection and enforcement overlay (Phase 4)
 */
export function setupOrientationEnforcement() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const modal = document.getElementById('orientation-modal');
  const fullscreenBtn = document.getElementById('btn-fullscreen-toggle');
  const dismissBtn = document.getElementById('btn-orientation-dismiss');

  const checkOrientation = () => {
    if (!modal) return;
    if (modal.dataset?.manuallyDismissed === 'true') {
      modal.classList.add('hidden');
      return;
    }
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
      toggleFullscreen();
    };
  }

  if (dismissBtn && modal) {
    dismissBtn.onclick = (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      modal.classList.add('hidden');
      if (modal.dataset) {
        modal.dataset.manuallyDismissed = 'true';
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

