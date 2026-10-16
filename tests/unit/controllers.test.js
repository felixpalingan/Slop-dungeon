import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModalController } from '../../src/controllers/modalController.js';
import { StationController } from '../../src/controllers/stationController.js';
import { ModalManager } from '../../src/modalManager.js';
import { ITEM_CATALOG } from '../../src/items.js';

describe('ModalController & StationController Unit Tests', () => {
  let modalManager;
  let mockPlayer;
  let mockAudio;
  let mockParticles;
  let modalCtrl;
  let stationCtrl;
  let sharedSlops = 100;
  let origDocument;
  let elements;

  function createMockElement(id) {
    const classListSet = new Set(['hidden']);
    return {
      id,
      classList: {
        add: (cls) => classListSet.add(cls),
        remove: (cls) => classListSet.delete(cls),
        contains: (cls) => classListSet.has(cls),
        toggle: vi.fn()
      },
      style: {},
      addEventListener: vi.fn(),
      getAttribute: vi.fn(() => ''),
      setAttribute: vi.fn()
    };
  }

  beforeEach(() => {
    origDocument = global.document;
    elements = {
      'inventory-modal': createMockElement('inventory-modal'),
      'dev-armory-modal': createMockElement('dev-armory-modal'),
      'pane-forge': createMockElement('pane-forge'),
      'pane-sell': createMockElement('pane-sell')
    };

    global.document = {
      getElementById: (id) => elements[id] || createMockElement(id),
      querySelectorAll: () => [createMockElement('btn')]
    };
    modalManager = new ModalManager();
    mockPlayer = {
      x: 0,
      y: 0,
      color: '#00f0ff',
      name: 'Tester',
      equipment: {},
      inventory: [],
      maxInventorySize: 10,
      equipItem: vi.fn((item) => {
        const old = mockPlayer.equipment[item.slot] || null;
        mockPlayer.equipment[item.slot] = item;
        return old;
      }),
      unequipSlot: vi.fn((slot) => {
        const old = mockPlayer.equipment[slot] || null;
        delete mockPlayer.equipment[slot];
        return old;
      }),
      syncHUD: vi.fn()
    };

    mockAudio = {
      playSwing: vi.fn(),
      playFootstep: vi.fn(),
      playBonk: vi.fn(),
      playChestOpen: vi.fn()
    };

    mockParticles = {
      spawnComicText: vi.fn()
    };

    modalCtrl = new ModalController({
      modalManager,
      player: mockPlayer,
      audio: mockAudio,
      particles: mockParticles,
      broadcastMyState: vi.fn(),
      getCurrentFloor: () => 0
    });

    stationCtrl = new StationController({
      modalManager,
      player: mockPlayer,
      audio: mockAudio,
      particles: mockParticles,
      getSharedSlops: () => sharedSlops,
      setSharedSlops: (amt) => { sharedSlops = amt; },
      getCurrentFloor: () => 0,
      updateSlopsUI: vi.fn(),
      broadcastSlops: vi.fn(),
      broadcastMyState: vi.fn(),
      renderInventoryUI: vi.fn()
    });
  });

  afterEach(() => {
    global.document = origDocument;
  });

  describe('ModalController', () => {
    it('opens, closes, and toggles inventory modal through modalManager', () => {
      modalCtrl.openInventory();
      expect(modalManager.isOpen('inventory-modal')).toBe(true);

      modalCtrl.closeInventory();
      expect(modalManager.isOpen('inventory-modal')).toBe(false);

      modalCtrl.toggleInventory();
      expect(modalManager.isOpen('inventory-modal')).toBe(true);
    });

    it('blocks opening Dev Armory modal inside dungeon (floor >= 1)', () => {
      const dungeonModalCtrl = new ModalController({
        modalManager,
        player: mockPlayer,
        audio: mockAudio,
        particles: mockParticles,
        getCurrentFloor: () => 1
      });

      dungeonModalCtrl.openDevArmoryModal();
      expect(modalManager.isOpen('dev-armory-modal')).toBe(false);
      expect(mockParticles.spawnComicText).toHaveBeenCalledWith(
        0, -30, 'DEV ARMORY DISABLED IN DUNGEON!', '#ef4444'
      );
    });
  });

  describe('StationController', () => {
    it('manages Dev Armory quick set equipment', () => {
      stationCtrl.equipFullSet('gojo');

      expect(mockPlayer.equipItem).toHaveBeenCalledWith(ITEM_CATALOG['gojo_blindfold']);
      expect(mockPlayer.equipItem).toHaveBeenCalledWith(ITEM_CATALOG['gojo_tunic']);
      expect(mockPlayer.equipItem).toHaveBeenCalledWith(ITEM_CATALOG['lapse_blue']);
      expect(mockParticles.spawnComicText).toHaveBeenCalledWith(
        0, -30, '⚡ EQUIPPED THE HONORED ONE SET!', '#00f0ff'
      );
    });

    it('strips all equipment on strip set command', () => {
      stationCtrl.equipFullSet('strip');

      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('helmet');
      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('chest');
      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('pants');
      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('boots');
      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('weapon');
      expect(mockPlayer.unequipSlot).toHaveBeenCalledWith('offhand');
      expect(mockParticles.spawnComicText).toHaveBeenCalledWith(
        0, -30, '🚫 STRIPPED ALL GEAR', '#f87171'
      );
    });

    it('dynamically loads the blackjack engine on demand', async () => {
      expect(stationCtrl.blackjackGame).toBeNull();

      const engine = await stationCtrl.getBlackjackEngine();
      expect(engine).toBeDefined();
      expect(stationCtrl.blackjackGame).toBe(engine);
      expect(typeof engine.startRound).toBe('function');
    });

    it('switches merchant tabs properly', () => {
      stationCtrl.switchMerchantTab('forge');
      expect(stationCtrl.activeMerchantTab).toBe('forge');

      stationCtrl.switchMerchantTab('sell');
      expect(stationCtrl.activeMerchantTab).toBe('sell');
    });
  });
});
