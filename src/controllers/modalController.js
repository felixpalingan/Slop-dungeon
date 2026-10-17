import { checkSetBonus, ItemRarity } from '../items.js';
import { sanitizePlayerName } from '../security.js';

/**
 * ModalController
 * Orchestrates modal lifecycle, DOM updates, inventory rendering, wardrobe color customization,
 * settings UI sync, and floor descent selection.
 */
export class ModalController {
  /**
   * @param {Object} deps
   * @param {import('../modalManager.js').ModalManager} deps.modalManager
   * @param {any} deps.player
   * @param {any} deps.audio
   * @param {any} [deps.settings]
   * @param {any} [deps.particles]
   * @param {() => void} [deps.broadcastMyState]
   * @param {(broadcast?: boolean) => void} [deps.returnToLobby]
   * @param {(floor: number, broadcast?: boolean) => void} [deps.startFloorDescent]
   * @param {() => number} [deps.getCurrentFloor]
   */
  constructor(deps) {
    this.modalManager = deps.modalManager;
    this.player = deps.player;
    this.audio = deps.audio;
    this.settings = deps.settings;
    this.particles = deps.particles;
    this.broadcastMyState = deps.broadcastMyState || (() => {});
    this.returnToLobby = deps.returnToLobby || (() => {});
    this.startFloorDescent = deps.startFloorDescent || (() => {});
    this.getCurrentFloor = deps.getCurrentFloor || (() => 0);
  }

  // --- FLOOR MODAL ---
  openFloorModal() {
    this.modalManager.open('floor-modal');
  }

  closeFloorModal() {
    this.modalManager.close('floor-modal');
  }

  toggleFloorModal() {
    this.modalManager.toggle('floor-modal');
  }

  // --- INVENTORY MODAL ---
  openInventory() {
    this.modalManager.open('inventory-modal');
  }

  closeInventory() {
    this.modalManager.close('inventory-modal');
  }

  toggleInventory() {
    this.modalManager.toggle('inventory-modal');
  }

  renderInventoryUI() {
    if (!this.player) return;

    // Check active set bonus
    const activeSet = checkSetBonus(this.player.equipment);
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
      const item = this.player.equipment[slot];
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
        if (this.player.inventory.length >= this.player.maxInventorySize) {
          alert('Backpack is full!');
          return;
        }
        const unequipped = this.player.unequipSlot(slot);
        if (unequipped) {
          this.player.inventory.push(unequipped);
          if (this.audio) this.audio.playSwing();
          this.renderInventoryUI();
          this.broadcastMyState();
        }
      });
    });

    // 2. Render Backpack items
    const backpackGrid = document.getElementById('backpack-grid');
    const invCount = document.getElementById('inv-count');
    if (!backpackGrid) return;

    backpackGrid.innerHTML = '';
    if (invCount) invCount.textContent = this.player.inventory.length;

    if (this.player.inventory.length === 0) {
      backpackGrid.innerHTML = `<span style="grid-column: span 2; color:#94a3b8; padding:12px; font-size:0.8rem;">Your backpack is empty. Find loot on the ground!</span>`;
    }

    this.player.inventory.forEach((item, index) => {
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      const isConsumable = item.slot === 'consumable';
      const card = document.createElement('div');
      card.className = 'backpack-item-card';
      card.innerHTML = `
        <div>
          <strong style="color:${rarity.color}">${item.name}</strong>
          <span style="font-size:0.75rem; color:#888;"> [${item.slot.toUpperCase()}]</span>
        </div>
        <div class="backpack-btn-group">
          ${isConsumable
            ? `<button class="item-action-btn use-item-btn" style="background:#059669; border-color:#10b981; color:#fff;" data-idx="${index}">USE</button>`
            : `<button class="item-action-btn equip-item-btn" data-idx="${index}">EQUIP</button>`
          }
          <button class="item-action-btn drop-item-btn" style="border-color:#ef4444;" data-idx="${index}">DROP</button>
        </div>
      `;
      backpackGrid.appendChild(card);
    });

    // Attach equip and drop listeners
    document.querySelectorAll('.equip-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const itemToEquip = this.player.inventory[idx];
        if (!itemToEquip) return;

        this.player.inventory.splice(idx, 1);
        const oldItem = this.player.equipItem(itemToEquip);
        if (oldItem) {
          this.player.inventory.push(oldItem);
        }

        if (this.audio) this.audio.playSwing();
        this.renderInventoryUI();
        this.broadcastMyState();
      });
    });

    // Attach consumable use listeners
    document.querySelectorAll('.use-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const itemToUse = this.player.inventory[idx];
        if (!itemToUse) return;

        this.player.inventory.splice(idx, 1);
        if (itemToUse.id === 'health_flask' || itemToUse.healAmount) {
          const heal = itemToUse.healAmount || 50;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
          this.player.syncHUD();
          if (this.audio) this.audio.playShopBuy?.();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 32, `+${heal} HP 💚 (FLASK)`, '#22c55e');
          }
        } else if (itemToUse.id === 'stamina_tonic' || itemToUse.staminaDuration) {
          const duration = itemToUse.staminaDuration || 8.0;
          this.player.stamina = this.player.maxStamina;
          this.player.isInfiniteStamina = true;
          this.player.infiniteStaminaTimer = duration;
          this.player.syncHUD();
          if (this.audio) this.audio.playGravitationalSurge?.();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 32, `STAMINA SURGE! ⚡ (${Math.round(duration)}s)`, '#38bdf8');
            this.particles.spawnDashBurst(this.player.x, this.player.y, 0, '#38bdf8');
          }
        }

        this.renderInventoryUI();
        this.broadcastMyState();
      });
    });

    document.querySelectorAll('.drop-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const dropped = this.player.inventory.splice(idx, 1)[0];
        if (dropped) {
          if (this.audio) this.audio.playBonk();
          this.renderInventoryUI();
          this.broadcastMyState();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 20, `DROPPED ${dropped.name.toUpperCase()}`, '#ef4444');
          }
        }
      });
    });
  }

  // --- WARDROBE MODAL ---
  openWardrobe() {
    this.modalManager.open('wardrobe-modal');
  }

  closeWardrobe() {
    this.modalManager.close('wardrobe-modal');
  }

  // --- DEV ARMORY MODAL ---
  openDevArmoryModal() {
    if (this.getCurrentFloor() >= 1) {
      if (this.particles) {
        this.particles.spawnComicText(this.player.x, this.player.y - 30, 'DEV ARMORY DISABLED IN DUNGEON!', '#ef4444');
      }
      if (this.audio) this.audio.playBonk();
      return;
    }
    this.modalManager.open('dev-armory-modal');
  }

  closeDevArmoryModal() {
    this.modalManager.close('dev-armory-modal');
  }

  toggleDevArmoryModal() {
    if (this.getCurrentFloor() >= 1) return;
    this.modalManager.toggle('dev-armory-modal');
  }

  // --- SETTINGS MODAL ---
  openSettingsModal() {
    this.modalManager.open('settings-modal');
  }

  closeSettingsModal() {
    this.modalManager.close('settings-modal');
  }

  toggleSettingsModal() {
    this.modalManager.toggle('settings-modal');
  }

  updateSettingsUIFromState() {
    if (!this.settings || !this.settings.settings) return;
    const current = this.settings.settings;

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

    // Damage Text
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

  /**
   * Initializes event listeners for all primary modals
   */
  initDOMListeners() {
    // Floor badge and close
    const btnFloorBadge = document.getElementById('btn-floor-badge');
    if (btnFloorBadge) {
      btnFloorBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFloorModal();
      });
    }
    const btnCloseFloorModal = document.getElementById('btn-close-floor-modal');
    if (btnCloseFloorModal) {
      btnCloseFloorModal.addEventListener('click', () => this.closeFloorModal());
    }

    document.querySelectorAll('.floor-warp-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetFloor = parseInt(btn.getAttribute('data-floor'), 10);
        this.closeFloorModal();
        if (targetFloor === 0) {
          this.returnToLobby(true);
        } else {
          this.startFloorDescent(targetFloor, true);
        }
      });
    });

    // Inventory close
    const btnCloseInventory = document.getElementById('btn-close-inventory');
    if (btnCloseInventory) {
      btnCloseInventory.addEventListener('click', () => this.closeInventory());
    }

    // Wardrobe
    const btnCloseWardrobe = document.getElementById('btn-close-wardrobe');
    if (btnCloseWardrobe) {
      btnCloseWardrobe.addEventListener('click', () => this.closeWardrobe());
    }

    const inputPlayerName = document.getElementById('input-player-name');
    const hudPlayerName = document.getElementById('hud-player-name');
    if (inputPlayerName && hudPlayerName) {
      inputPlayerName.addEventListener('input', (e) => {
        this.player.name = sanitizePlayerName(e.target.value);
        hudPlayerName.textContent = this.player.name;
        this.broadcastMyState();
      });
    }

    const wardrobePreviewCircle = document.getElementById('wardrobe-avatar-preview');
    const hudAvatar = document.getElementById('hud-avatar');
    document.querySelectorAll('.color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.player.color = btn.getAttribute('data-color');

        if (wardrobePreviewCircle) {
          wardrobePreviewCircle.style.background = this.player.color;
          wardrobePreviewCircle.style.boxShadow = `0 0 16px ${this.player.color}`;
        }
        if (hudAvatar) {
          hudAvatar.style.background = this.player.color;
          hudAvatar.style.boxShadow = `0 0 12px ${this.player.color}`;
        }

        if (this.audio) this.audio.playSwing();
        if (this.particles) {
          this.particles.spawnComicText(this.player.x, this.player.y - 20, 'DYE APPLIED!', this.player.color);
        }
        this.broadcastMyState();
      });
    });

    // Settings
    const btnOpenSettings = document.getElementById('btn-open-settings');
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.openSettingsModal();
      });
    }
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => this.closeSettingsModal());
    }
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => this.closeSettingsModal());
    }

    // Dev Armory
    const btnCloseDevArmory = document.getElementById('btn-close-dev-armory');
    if (btnCloseDevArmory) {
      btnCloseDevArmory.addEventListener('click', () => this.closeDevArmoryModal());
    }
    const btnCloseDevArmoryBottom = document.getElementById('btn-close-dev-armory-bottom');
    if (btnCloseDevArmoryBottom) {
      btnCloseDevArmoryBottom.addEventListener('click', () => this.closeDevArmoryModal());
    }

    // Modal Manager backdrop dismiss
    this.modalManager.initBackdropDismiss();
  }
}
