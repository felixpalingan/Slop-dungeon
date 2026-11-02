import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openItemInspectionSheet, closeItemInspectionSheet } from '../../src/mobileHUD.js';

describe('Phase 3: Responsive UI & Tap-to-Inspect Sheet', () => {
  let elements;
  let mockSheet;

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
      querySelector: vi.fn((selector) => {
        if (selector === '.sheet-backdrop') return elements['sheet-backdrop'];
        return null;
      })
    };
  }

  beforeEach(() => {
    elements = {
      'mobile-item-sheet': createMockElement('mobile-item-sheet'),
      'sheet-backdrop': createMockElement('sheet-backdrop'),
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

  describe('openItemInspectionSheet', () => {
    it('populates gear details and displays sheet when inspecting equipped item', () => {
      const mockItem = {
        name: 'Inverted Spear of Heaven',
        slot: 'weapon',
        desc: 'Nullifies all cursed techniques and pierces barriers.',
        rarityColor: '#ef4444',
        price: 80,
        setKey: 'toji',
        setName: 'Toji Fushiguro'
      };

      const onUnequip = vi.fn();
      openItemInspectionSheet(mockItem, {
        isEquipped: true,
        slotKey: 'weapon',
        onUnequip
      });

      expect(elements['sheet-item-name'].textContent).toBe('Inverted Spear of Heaven');
      expect(elements['sheet-item-name'].style.color).toBe('#ef4444');
      expect(elements['sheet-item-slot'].textContent).toBe('[WEAPON]');
      expect(elements['sheet-item-desc'].textContent).toContain('Nullifies all cursed techniques');
      expect(elements['sheet-item-value'].textContent).toBe('🪙 80 Slops');
      expect(elements['sheet-item-set'].style.display).toBe('inline-block');
      expect(elements['sheet-item-set'].textContent).toContain('TOJI FUSHIGURO SET');

      // Primary button should be UNEQUIP
      const actionBtn = elements['sheet-btn-action'];
      expect(actionBtn.textContent).toBe('UNEQUIP');
      expect(actionBtn.classList.add).toHaveBeenCalledWith('unequip-action');

      // Tapping action button triggers unequip callback and closes sheet
      actionBtn.onclick();
      expect(onUnequip).toHaveBeenCalled();
      expect(elements['mobile-item-sheet'].classList.add).toHaveBeenCalledWith('hidden');
    });

    it('displays EQUIP button when inspecting backpack gear', () => {
      const mockItem = {
        name: 'Berserker Greaves',
        slot: 'boots',
        desc: '+25 Speed, +10 Armor',
        rarityColor: '#a855f7',
        price: 45
      };

      const onEquip = vi.fn();
      const onDrop = vi.fn();

      openItemInspectionSheet(mockItem, {
        isEquipped: false,
        inventoryIndex: 0,
        onEquip,
        onDrop
      });

      const actionBtn = elements['sheet-btn-action'];
      expect(actionBtn.textContent).toBe('EQUIP');
      expect(actionBtn.classList.add).toHaveBeenCalledWith('primary-action');

      // Tapping action triggers equip
      actionBtn.onclick();
      expect(onEquip).toHaveBeenCalled();

      // Drop button triggers drop callback
      const dropBtn = elements['sheet-btn-drop'];
      dropBtn.onclick();
      expect(onDrop).toHaveBeenCalled();
    });

    it('displays USE button for consumable items', () => {
      const flaskItem = {
        name: 'Health Flask',
        slot: 'consumable',
        desc: 'Restores 50 HP immediately',
        healAmount: 50,
        price: 15
      };

      const onUse = vi.fn();
      openItemInspectionSheet(flaskItem, {
        isEquipped: false,
        inventoryIndex: 2,
        onUse
      });

      const actionBtn = elements['sheet-btn-action'];
      expect(actionBtn.textContent).toBe('USE');
      expect(actionBtn.classList.add).toHaveBeenCalledWith('use-action');

      actionBtn.onclick();
      expect(onUse).toHaveBeenCalled();
    });

    it('can be dismissed via closeItemInspectionSheet', () => {
      closeItemInspectionSheet();
      expect(elements['mobile-item-sheet'].classList.add).toHaveBeenCalledWith('hidden');
    });
  });
});

