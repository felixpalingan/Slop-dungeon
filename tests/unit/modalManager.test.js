import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModalManager } from '../../src/modalManager.js';

describe('ModalManager (LIFO Stack & Universal Dismiss)', () => {
  let modalManager;
  let elements;
  let origDocument;

  function createMockElement(id) {
    const classListSet = new Set(['hidden']);
    return {
      id,
      classList: {
        add: (cls) => classListSet.add(cls),
        remove: (cls) => classListSet.delete(cls),
        contains: (cls) => classListSet.has(cls)
      },
      style: {},
      addEventListener: vi.fn()
    };
  }

  beforeEach(() => {
    modalManager = new ModalManager();
    elements = {
      'modal-a': createMockElement('modal-a'),
      'modal-b': createMockElement('modal-b'),
      'modal-c': createMockElement('modal-c')
    };

    origDocument = global.document;
    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => Object.values(elements)
    };
  });

  afterEach(() => {
    global.document = origDocument;
  });

  it('pushes modal to LIFO stack and unhides element', () => {
    const opened = modalManager.open('modal-a');
    expect(opened).toBe(true);
    expect(modalManager.isOpen('modal-a')).toBe(true);
    expect(modalManager.isOpen()).toBe(true);
    expect(modalManager.getTopModal()).toBe('modal-a');
    expect(elements['modal-a'].classList.contains('hidden')).toBe(false);
  });

  it('maintains strict LIFO pop order when closing', () => {
    modalManager.open('modal-a');
    modalManager.open('modal-b');
    modalManager.open('modal-c');

    expect(modalManager.getTopModal()).toBe('modal-c');

    // Pop top (modal-c)
    modalManager.close();
    expect(modalManager.getTopModal()).toBe('modal-b');
    expect(elements['modal-c'].classList.contains('hidden')).toBe(true);
    expect(elements['modal-b'].classList.contains('hidden')).toBe(false);

    // Pop top (modal-b)
    modalManager.close();
    expect(modalManager.getTopModal()).toBe('modal-a');

    // Pop top (modal-a)
    modalManager.close();
    expect(modalManager.getTopModal()).toBeNull();
    expect(modalManager.isOpen()).toBe(false);
  });

  it('can close a specific modal regardless of stack depth', () => {
    modalManager.open('modal-a');
    modalManager.open('modal-b');
    modalManager.open('modal-c');

    modalManager.close('modal-b'); // close middle
    expect(modalManager.isOpen('modal-b')).toBe(false);
    expect(modalManager.isOpen('modal-c')).toBe(true);
    expect(modalManager.isOpen('modal-a')).toBe(true);
    expect(modalManager.getTopModal()).toBe('modal-c');
  });

  it('closes all open modals with closeAll()', () => {
    modalManager.open('modal-a');
    modalManager.open('modal-b');
    modalManager.closeAll();

    expect(modalManager.isOpen()).toBe(false);
    expect(elements['modal-a'].classList.contains('hidden')).toBe(true);
    expect(elements['modal-b'].classList.contains('hidden')).toBe(true);
  });

  it('toggles modal state on demand', () => {
    expect(modalManager.isOpen('modal-a')).toBe(false);
    modalManager.toggle('modal-a');
    expect(modalManager.isOpen('modal-a')).toBe(true);
    modalManager.toggle('modal-a');
    expect(modalManager.isOpen('modal-a')).toBe(false);
  });

  it('executes registered onOpen and onClose hooks', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    modalManager.register('modal-a', { onOpen, onClose });
    modalManager.open('modal-a');
    expect(onOpen).toHaveBeenCalledTimes(1);

    modalManager.close('modal-a');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key events by dismissing the top modal', () => {
    modalManager.open('modal-a');
    modalManager.open('modal-b');

    const escapeEvent = {
      key: 'Escape',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };

    const handled = modalManager.handleEscapeKey(escapeEvent);
    expect(handled).toBe(true);
    expect(escapeEvent.preventDefault).toHaveBeenCalled();
    expect(modalManager.getTopModal()).toBe('modal-a');
    expect(elements['modal-b'].classList.contains('hidden')).toBe(true);
  });
});
