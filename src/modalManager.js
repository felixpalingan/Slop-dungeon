/**
 * Unified LIFO Modal Stack Manager for Slop Dungeon
 * Eliminates modal layering bugs, hotkey collisions, and trapped pointer events.
 * Provides universal backdrop-click dismiss and Escape key handling.
 */

export class ModalManager {
  constructor() {
    /** @type {string[]} LIFO stack of open modal IDs */
    this.stack = [];
    /** @type {Map<string, { onOpen?: () => void, onClose?: () => void }>} */
    this.registry = new Map();
    /** @type {boolean} */
    this.isBackdropInitialized = false;
  }

  /**
   * Registers modal lifecycle hooks
   * @param {string} modalId
   * @param {{ onOpen?: () => void, onClose?: () => void }} [hooks={}]
   */
  register(modalId, hooks = {}) {
    this.registry.set(modalId, hooks);
  }

  /**
   * Opens a modal and pushes it to top of the LIFO stack
   * @param {string} modalId
   * @returns {boolean} True if successfully opened
   */
  open(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return false;

    // If modal is already in stack, remove it so it can be pushed to the top
    const existingIdx = this.stack.indexOf(modalId);
    if (existingIdx !== -1) {
      this.stack.splice(existingIdx, 1);
    }

    el.classList.remove('hidden');
    this.stack.push(modalId);

    // Ensure highest z-index on top of other open modals
    el.style.zIndex = `${1000 + this.stack.length * 10}`;

    const hooks = this.registry.get(modalId);
    if (hooks && typeof hooks.onOpen === 'function') {
      try {
        hooks.onOpen();
      } catch (err) {
        console.error(`Error in onOpen hook for modal ${modalId}:`, err);
      }
    }

    return true;
  }

  /**
   * Closes the topmost modal (or a specific modal if modalId is provided)
   * @param {string} [modalId]
   * @returns {boolean} True if a modal was closed
   */
  close(modalId = null) {
    let targetId = modalId;

    if (!targetId) {
      if (this.stack.length === 0) return false;
      targetId = this.stack.pop();
    } else {
      const idx = this.stack.indexOf(targetId);
      if (idx === -1) return false;
      this.stack.splice(idx, 1);
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.classList.add('hidden');
      el.style.zIndex = '';
    }

    const hooks = this.registry.get(targetId);
    if (hooks && typeof hooks.onClose === 'function') {
      try {
        hooks.onClose();
      } catch (err) {
        console.error(`Error in onClose hook for modal ${targetId}:`, err);
      }
    }

    return true;
  }

  /**
   * Toggles modal open/close state
   * @param {string} modalId
   * @returns {boolean} New open state
   */
  toggle(modalId) {
    if (this.isOpen(modalId)) {
      this.close(modalId);
      return false;
    } else {
      this.open(modalId);
      return true;
    }
  }

  /**
   * Closes all currently open modals in LIFO order
   */
  closeAll() {
    let count = 0;
    while (this.stack.length > 0) {
      this.close();
      count++;
    }
    return count > 0;
  }

  /**
   * Checks whether a specific modal (or any modal) is open
   * @param {string} [modalId]
   * @returns {boolean}
   */
  isOpen(modalId = null) {
    if (modalId) {
      return this.stack.includes(modalId);
    }
    return this.stack.length > 0;
  }

  /**
   * Returns topmost open modal ID or null
   * @returns {string|null}
   */
  getTopModal() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  /**
   * Initializes universal backdrop dismiss on all .modal-backdrop containers.
   * Clicking directly on the backdrop closes the top modal.
   */
  initBackdropDismiss() {
    if (this.isBackdropInitialized || typeof document === 'undefined') return;
    this.isBackdropInitialized = true;

    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
      backdrop.addEventListener('pointerdown', (e) => {
        // Only trigger dismiss when clicking directly on the backdrop, not modal cards or dialogs
        if (e.target === backdrop) {
          e.preventDefault();
          e.stopPropagation();
          const modalId = backdrop.id;
          if (modalId) {
            this.close(modalId);
          } else {
            this.close();
          }
        }
      });
    });
  }

  /**
   * Handles keyboard ESC dismiss
   * @param {KeyboardEvent} e
   * @returns {boolean} True if a modal was dismissed
   */
  handleEscapeKey(e) {
    if (e.key === 'Escape' && this.isOpen()) {
      e.preventDefault();
      e.stopPropagation();
      return this.close();
    }
    return false;
  }
}

export const defaultModalManager = new ModalManager();
