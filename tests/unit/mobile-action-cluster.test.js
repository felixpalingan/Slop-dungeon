import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUltimateInfo, getNearbyInteractable, updateMobileClusterDOM } from '../../src/mobileHUD.js';
import { InputManager } from '../../src/input.js';

describe('Phase 2: Mobile Action Cluster & Smart Interact [E]', () => {
  describe('getUltimateInfo', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        lastAbilityTime: 0,
        equipment: {}
      };
    });

    it('identifies Full Set Ultimates and formats icons and labels', () => {
      // Gojo
      const gojo = getUltimateInfo(mockPlayer, { ultimateQ: 'hollow_purple' });
      expect(gojo.icon).toBe('🔮');
      expect(gojo.label).toBe('PURPLE');
      expect(gojo.cooldown).toBe(8.0);
      expect(gojo.isReady).toBe(true);

      // Sukuna
      const sukuna = getUltimateInfo(mockPlayer, { ultimateQ: 'world_cutting_slash' });
      expect(sukuna.icon).toBe('🗡️');
      expect(sukuna.label).toBe('SLASH');

      // Toji
      const toji = getUltimateInfo(mockPlayer, { ultimateQ: 'inverted_chain_rampage' });
      expect(toji.icon).toBe('⛓️');
      expect(toji.label).toBe('CHAINS');

      // Guts
      const guts = getUltimateInfo(mockPlayer, { ultimateQ: 'berserker_rage' });
      expect(guts.icon).toBe('🩸');
      expect(guts.label).toBe('BERSERK');

      // Levi
      const levi = getUltimateInfo(mockPlayer, { ultimateQ: 'levi_grapple_whirlwind' });
      expect(levi.icon).toBe('🦅');
      expect(levi.label).toBe('OVERDRIVE');

      // David
      const david = getUltimateInfo(mockPlayer, { ultimateQ: 'sandevistan_time_dilation' });
      expect(david.icon).toBe('⚡');
      expect(david.label).toBe('SANDEV');

      // Saitama
      const saitama = getUltimateInfo(mockPlayer, { ultimateQ: 'serious_punch' });
      expect(saitama.icon).toBe('💥');
      expect(saitama.label).toBe('PUNCH');
    });

    it('falls back to Chest Piece Base Q when no Full Set is equipped', () => {
      mockPlayer.equipment = { chest: { visual: 'gojo_chest' } };
      const res = getUltimateInfo(mockPlayer, null);
      expect(res.icon).toBe('🔮');
      expect(res.label).toBe('MUGEN');
      expect(res.cooldown).toBe(5.0);

      mockPlayer.equipment = { chest: { visual: 'sukuna_chest' } };
      const res2 = getUltimateInfo(mockPlayer, null);
      expect(res2.icon).toBe('🗡️');
      expect(res2.label).toBe('CLEAVE');
    });

    it('correctly tracks cooldown elapsed and remaining duration', () => {
      const now = performance.now() / 1000;
      mockPlayer.lastAbilityTime = now - 3.0; // 3 seconds ago
      const info = getUltimateInfo(mockPlayer, { ultimateQ: 'hollow_purple' }); // 8.0s cd

      expect(info.isReady).toBe(false);
      expect(info.remaining).toBeCloseTo(5.0, 1);
      expect(info.progress).toBeCloseTo(3.0 / 8.0, 1);
    });
  });

  describe('getNearbyInteractable', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = { x: 0, y: 0, isDowned: false, isDead: false };
    });

    it('prioritizes Downed Teammate revive above all else', () => {
      const remotePlayers = new Map([
        ['peer1', { x: 30, y: 40, isDowned: true, isDead: false }] // dist = 50 <= 75
      ]);
      const groundItems = new Map([
        ['item1', { isNear: () => true }]
      ]);

      const prompt = getNearbyInteractable({
        player: mockPlayer,
        currentFloor: 1,
        remotePlayers,
        groundItems
      });

      expect(prompt.type).toBe('revive');
      expect(prompt.icon).toBe('💉');
      expect(prompt.label).toBe('REVIVE');
      expect(prompt.active).toBe(true);
    });

    it('detects nearby ground loot when no teammate is downed', () => {
      const groundItems = new Map([
        ['item1', { isNear: (p) => true }]
      ]);

      const prompt = getNearbyInteractable({
        player: mockPlayer,
        currentFloor: 1,
        groundItems
      });

      expect(prompt.type).toBe('loot');
      expect(prompt.icon).toBe('🪙');
      expect(prompt.label).toBe('LOOT');
      expect(prompt.active).toBe(true);
    });

    it('detects Base Camp stations in Floor 0', () => {
      const floorStation = { isPlayerNearby: () => true };
      const wardrobeStation = { isPlayerNearby: () => false };
      const devArmoryChest = { isNear: () => false };

      const prompt = getNearbyInteractable({
        player: mockPlayer,
        currentFloor: 0,
        floorStation,
        wardrobeStation,
        devArmoryChest
      });

      expect(prompt.type).toBe('floor');
      expect(prompt.icon).toBe('🪜');
      expect(prompt.label).toBe('FLOORS');
      expect(prompt.active).toBe(true);
    });

    it('detects Dungeon NPC and Casino props in Floor >= 1', () => {
      const slopMerchant = { isNear: () => true };
      const wheelAltar = { isNear: () => false };
      const blackjackTable = { isNear: () => false };

      const prompt = getNearbyInteractable({
        player: mockPlayer,
        currentFloor: 2,
        slopMerchant,
        wheelAltar,
        blackjackTable
      });

      expect(prompt.type).toBe('merchant');
      expect(prompt.icon).toBe('🛍️');
      expect(prompt.label).toBe('SHOP');
      expect(prompt.active).toBe(true);
    });

    it('returns idle non-active state when nothing is in range', () => {
      const prompt = getNearbyInteractable({
        player: mockPlayer,
        currentFloor: 1
      });

      expect(prompt.type).toBe('none');
      expect(prompt.icon).toBe('✋');
      expect(prompt.label).toBe('INTERACT');
      expect(prompt.active).toBe(false);
    });
  });

  describe('updateMobileClusterDOM', () => {
    let elements;

    function createMockElement(id) {
      const classListSet = new Set();
      return {
        id,
        classList: {
          add: (cls) => classListSet.add(cls),
          remove: (cls) => classListSet.delete(cls),
          contains: (cls) => classListSet.has(cls)
        },
        style: {},
        textContent: ''
      };
    }

    beforeEach(() => {
      elements = {
        'touch-btn-ult': createMockElement('touch-btn-ult'),
        'touch-ult-icon': createMockElement('touch-ult-icon'),
        'touch-ult-label': createMockElement('touch-ult-label'),
        'touch-ult-cd': createMockElement('touch-ult-cd'),
        'touch-btn-interact': createMockElement('touch-btn-interact'),
        'touch-interact-icon': createMockElement('touch-interact-icon'),
        'touch-interact-label': createMockElement('touch-interact-label'),
        'touch-btn-reload': createMockElement('touch-btn-reload'),
        'touch-reload-ammo': createMockElement('touch-reload-ammo'),
        'touch-respawn-btn': createMockElement('touch-respawn-btn')
      };

      global.document = {
        getElementById: (id) => elements[id] || null
      };
    });

    it('updates Ultimate button to ready state with neon styling', () => {
      const player = { lastAbilityTime: 0, equipment: {} };
      updateMobileClusterDOM({
        player,
        activeSet: { ultimateQ: 'hollow_purple' },
        interactable: { active: false, icon: '✋', label: 'INTERACT' }
      });

      expect(elements['touch-btn-ult'].classList.contains('ult-ready')).toBe(true);
      expect(elements['touch-btn-ult'].classList.contains('ult-cooldown')).toBe(false);
      expect(elements['touch-ult-icon'].textContent).toBe('🔮');
      expect(elements['touch-ult-label'].textContent).toBe('PURPLE');
      expect(elements['touch-ult-cd'].style.display).toBe('none');
    });

    it('updates Ultimate button to cooldown state with countdown text', () => {
      const now = performance.now() / 1000;
      const player = { lastAbilityTime: now - 2.0, equipment: {} };
      updateMobileClusterDOM({
        player,
        activeSet: { ultimateQ: 'world_cutting_slash' },
        interactable: { active: false, icon: '✋', label: 'INTERACT' }
      });

      expect(elements['touch-btn-ult'].classList.contains('ult-cooldown')).toBe(true);
      expect(elements['touch-btn-ult'].classList.contains('ult-ready')).toBe(false);
      expect(elements['touch-ult-cd'].style.display).toBe('flex');
      expect(elements['touch-ult-cd'].textContent).toMatch(/^[0-9.]+s$/);
    });

    it('activates and highlights Smart Interact button when an object is in range', () => {
      const player = { lastAbilityTime: 0, equipment: {} };
      updateMobileClusterDOM({
        player,
        activeSet: null,
        interactable: { active: true, icon: '🪙', label: 'LOOT' }
      });

      expect(elements['touch-btn-interact'].classList.contains('interact-active')).toBe(true);
      expect(elements['touch-btn-interact'].classList.contains('interact-idle')).toBe(false);
      expect(elements['touch-interact-icon'].textContent).toBe('🪙');
      expect(elements['touch-interact-label'].textContent).toBe('LOOT');
    });

    it('toggles Carnage Shotgun reload button visibility and ammo count', () => {
      const playerWithShotgun = {
        equipment: { weapon: { visual: 'david_shotgun' } },
        shotgunAmmo: 2,
        maxShotgunAmmo: 4,
        isReloadingShotgun: false
      };

      updateMobileClusterDOM({
        player: playerWithShotgun,
        activeSet: null,
        interactable: { active: false, icon: '✋', label: 'INTERACT' }
      });

      expect(elements['touch-btn-reload'].style.display).toBe('flex');
      expect(elements['touch-reload-ammo'].textContent).toBe('2/4');

      // Player with normal sword
      const playerWithSword = {
        equipment: { weapon: { visual: 'rusty_sword' } }
      };

      updateMobileClusterDOM({
        player: playerWithSword,
        activeSet: null,
        interactable: { active: false, icon: '✋', label: 'INTERACT' }
      });

      expect(elements['touch-btn-reload'].style.display).toBe('none');
    });

    it('displays Lobby Respawn button when player is dead at Floor 0', () => {
      const deadPlayer = { isDead: true, currentFloor: 0 };
      updateMobileClusterDOM({
        player: deadPlayer,
        activeSet: null,
        interactable: { active: false, icon: '✋', label: 'INTERACT' },
        currentFloor: 0
      });

      expect(elements['touch-respawn-btn'].style.display).toBe('flex');
    });
  });
});
