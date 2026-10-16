/**
 * In-Memory Domain EventBus for Slop Dungeon
 * Decouples Domain Entities (Player, Monster, Combat) from
 * Browser Presentation & Infrastructure APIs (DOM, Web Audio).
 * (Ref: ADR-001)
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe a callback to an event name.
   * Returns an unsubscribe function.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`EventBus.on: callback must be a function, received ${typeof callback}`);
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe a callback from an event name.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const set = this.listeners.get(event);
    set.delete(callback);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Register a one-time listener that auto-unsubscribes after first execution.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`EventBus.once: callback must be a function, received ${typeof callback}`);
    }
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event with an optional payload to all registered listeners.
   * Safeguarded against subscriber exceptions to preserve system resilience.
   * @param {string} event
   * @param {*} [payload]
   */
  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    const callbacks = Array.from(this.listeners.get(event));
    for (const cb of callbacks) {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for event "${event}":`, err);
      }
    }
  }

  /**
   * Clears listeners. If an event is provided, clears only that event.
   * Otherwise clears all events.
   * @param {string} [event]
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Returns the count of listeners registered for an event.
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).size : 0;
  }
}

export const defaultEventBus = new EventBus();
export const eventBus = defaultEventBus;
export default defaultEventBus;
