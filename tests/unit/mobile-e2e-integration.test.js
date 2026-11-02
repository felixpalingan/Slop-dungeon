import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateJoystickVector, InputManager } from '../../src/input.js';
import { Player } from '../../src/player.js';
import {
  getUltimateInfo,
  getNearbyInteractable,
  updateMobileClusterDOM,
  openItemInspectionSheet,
  closeItemInspectionSheet,
  setupOrientationEnforcement
} from '../../src/mobileHUD.js';
import { AudioManager } from '../../src/audio.js';
import { Renderer } from '../../src/renderer.js';

describe('Phase 5: Mobile End-to-End Integration & Verification', () => {
  describe('Full Mobile Touch Combat Lifecycle', () => {
    let player;
    let input;

    beforeEach(() => {
      player = new Player(0, 0);
      input = new InputManager();
      input.setTouchMode(true);
    });

    it('processes floating joystick deflection into smooth player movement', () => {
      // Joystick pushed right (dx = 1, dy = 0)
      const res = calculateJoystickVector(45, 0, 6, 45);
      input.joystickVector = { dx: res.dx, dy: res.dy };

      const move = input.getMovementVector();
      expect(move.dx).toBeCloseTo(1, 4);
      expect(move.dy).toBeCloseTo(0, 4);

      player.update(0.016, input, undefined, []);
      expect(player.vx).toBeGreaterThan(0);
      // Karakter otomatis menghadap kanan sesuai arah pergerakan joystick
      expect(player.angle).toBeCloseTo(0, 3);
    });

    it('auto-aim locks onto nearest enemy and synchronizes virtual mouse coordinates', () => {
      // Spawn two enemies: mobA at (0, 100) dist=100, mobB at (0, 300) dist=300
      const mobA = { id: 'mobA', x: 0, y: 100, isDead: false };
      const mobB = { id: 'mobB', x: 0, y: 300, isDead: false };

      player.update(0.016, input, undefined, [mobB, mobA]);

      // Should lock onto mobA (closest)
      expect(player.targetedEnemy).toBe(mobA);
      // Angle towards (0, 100) from (0, 0) is down (Math.PI / 2)
      expect(player.angle).toBeCloseTo(Math.PI / 2, 3);

      // Virtual mouse coordinates are synchronized for projectiles & cables
      expect(input.mouse.screenX).toBeCloseTo(400, 1);
      expect(input.mouse.screenY).toBeCloseTo(500, 1);
    });

    it('manual drag-to-aim overrides auto-aim during aim dragging', () => {
      const mob = { id: 'mob', x: 0, y: 100, isDead: false };

      // Player drags aim towards up-left (-3*PI/4)
      input.isTouchAiming = true;
      input.touchAimAngle = -Math.PI * 0.75;

      player.update(0.016, input, undefined, [mob]);

      expect(player.targetedEnemy).toBeNull();
      expect(player.angle).toBeCloseTo(-Math.PI * 0.75, 3);
    });
  });

  describe('Full Mobile Action Cluster & State Mapping', () => {
    let player;

    beforeEach(() => {
      player = new Player(0, 0);
    });

    it('formats correct Ultimate icons and labels for all anime full sets', () => {
      const sets = [
        { ultimateQ: 'hollow_purple', expectedIcon: '🔮', expectedLabel: 'PURPLE' },
        { ultimateQ: 'world_cutting_slash', expectedIcon: '🗡️', expectedLabel: 'SLASH' },
        { ultimateQ: 'inverted_chain_rampage', expectedIcon: '⛓️', expectedLabel: 'CHAINS' },
        { ultimateQ: 'berserker_rage', expectedIcon: '🩸', expectedLabel: 'BERSERK' },
        { ultimateQ: 'levi_grapple_whirlwind', expectedIcon: '🦅', expectedLabel: 'OVERDRIVE' },
        { ultimateQ: 'sandevistan_time_dilation', expectedIcon: '⚡', expectedLabel: 'SANDEV' },
        { ultimateQ: 'serious_punch', expectedIcon: '💥', expectedLabel: 'PUNCH' }
      ];

      for (const s of sets) {
        const info = getUltimateInfo(player, s);
        expect(info.icon).toBe(s.expectedIcon);
        expect(info.label).toBe(s.expectedLabel);
        expect(info.cooldown).toBe(8.0);
      }
    });

    it('dynamically adapts Smart Interact prompt based on priority hierarchy', () => {
      // 1. When downed peer is nearby -> REVIVE
      const downedPeer = { x: 40, y: 0, isDowned: true, isDead: false };
      const prompt1 = getNearbyInteractable({
        player,
        currentFloor: 1,
        remotePlayers: new Map([['p1', downedPeer]])
      });
      expect(prompt1.type).toBe('revive');
      expect(prompt1.icon).toBe('💉');

      // 2. When loot is nearby -> LOOT
      const loot = { isNear: () => true };
      const prompt2 = getNearbyInteractable({
        player,
        currentFloor: 1,
        groundItems: new Map([['l1', loot]])
      });
      expect(prompt2.type).toBe('loot');
      expect(prompt2.icon).toBe('🪙');

      // 3. When Merchant is nearby -> SHOP
      const merchant = { isNear: () => true };
      const prompt3 = getNearbyInteractable({
        player,
        currentFloor: 1,
        slopMerchant: merchant
      });
      expect(prompt3.type).toBe('merchant');
      expect(prompt3.icon).toBe('🛍️');

      // 4. When Base Camp Station is nearby -> STATIONS
      const devArmory = { isNear: () => true };
      const prompt4 = getNearbyInteractable({
        player,
        currentFloor: 0,
        devArmoryChest: devArmory
      });
      expect(prompt4.type).toBe('armory');
      expect(prompt4.icon).toBe('⚔️');
    });
  });

  describe('Mobile Inspection Sheet & Tap Actions', () => {
    let elements;

    function createMockElement(id) {
      const classListSet = new Set(['hidden']);
      return {
        id,
        classList: {
          add: vi.fn((cls) => classListSet.add(cls)),
          remove: vi.fn((cls) => classListSet.delete(cls)),
          contains: vi.fn((cls) => classListSet.has(cls))
        },
        style: {},
        textContent: '',
        onclick: null,
        querySelector: vi.fn(() => createMockElement('child'))
      };
    }

    beforeEach(() => {
      elements = {
        'mobile-item-sheet': createMockElement('mobile-item-sheet'),
        'sheet-item-name': createMockElement('sheet-item-name'),
        'sheet-item-slot': createMockElement('sheet-item-slot'),
        'sheet-item-desc': createMockElement('sheet-item-desc'),
        'sheet-item-value': createMockElement('sheet-item-value'),
        'sheet-item-set': createMockElement('sheet-item-set'),
        'sheet-btn-action': createMockElement('sheet-btn-action'),
        'sheet-btn-drop': createMockElement('sheet-btn-drop'),
        'sheet-btn-close': createMockElement('sheet-btn-close')
      };
      global.document = {
        getElementById: (id) => elements[id] || null
      };
    });

    it('allows tap-to-inspect and execution of actions on items', () => {
      const sword = {
        name: 'Guts Dragon Slayer',
        slot: 'weapon',
        desc: 'Massive iron slab that cleaves through armor',
        rarityColor: '#ef4444',
        price: 120,
        setKey: 'guts',
        setName: 'Berserk'
      };

      const onEquip = vi.fn();
      openItemInspectionSheet(sword, { isEquipped: false, onEquip });

      expect(elements['sheet-item-name'].textContent).toBe('Guts Dragon Slayer');
      expect(elements['sheet-item-set'].textContent).toContain('BERSERK SET');

      elements['sheet-btn-action'].onclick();
      expect(onEquip).toHaveBeenCalled();
      expect(elements['mobile-item-sheet'].classList.add).toHaveBeenCalledWith('hidden');
    });
  });

  describe('Orientation Enforcement & Audio Unlock Integration', () => {
    it('detects screen orientation transitions between portrait and landscape', () => {
      const modal = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      };

      global.window = {
        innerWidth: 390,
        innerHeight: 844,
        addEventListener: vi.fn()
      };
      global.document = {
        getElementById: (id) => (id === 'orientation-modal' ? modal : null),
        addEventListener: vi.fn()
      };

      const { checkOrientation } = setupOrientationEnforcement();
      expect(modal.classList.remove).toHaveBeenCalledWith('hidden');

      // Rotate to landscape
      global.window.innerWidth = 844;
      global.window.innerHeight = 390;
      checkOrientation();
      expect(modal.classList.add).toHaveBeenCalledWith('hidden');

      delete global.window;
      delete global.document;
    });
  });
});

