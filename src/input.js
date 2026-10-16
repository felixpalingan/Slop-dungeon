/**
 * Input Manager for Dungeon Slop
 * Handles WASD keyboard movement, Left Shift for Roll/Dash, and mouse aim.
 */

export class InputManager {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false,
      e: false,
      q: false,
      i: false,
      t: false,
      tab: false,
      r: false,
      f: false,
      g: false,
      o: false,
      escape: false,
      space: false
    };

    this.mouse = {
      screenX: window.innerWidth / 2,
      screenY: window.innerHeight / 2,
      leftDown: false,
      rightDown: false
    };

    this.justPressedShift = false;
    this.justPressedE = false;
    this.justPressedQ = false;
    this.justPressedI = false;
    this.justPressedT = false;
    this.justPressedR = false;
    this.justPressedF = false;
    this.justPressedG = false;
    this.justPressedO = false;
    this.justPressedEscape = false;
    this.justPressedSpace = false;
    this.justPressedLeft = false;
    this.justPressedRight = false;
    this.justPressedTab = false;

    this.joystickVector = { dx: 0, dy: 0 };

    this.setupListeners();
    this.setupTouchControls();
  }

  setupListeners() {
    const isTextInput = (target) => {
      const active = document.activeElement;
      const check = (el) => el && (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      );
      return check(target) || check(active);
    };

    window.addEventListener('focusin', (e) => {
      if (isTextInput(e.target)) {
        for (const k in this.keys) {
          this.keys[k] = false;
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.keys.escape && !e.repeat) this.justPressedEscape = true;
        this.keys.escape = true;
        if (isTextInput(e.target) && e.target && typeof e.target.blur === 'function') {
          e.target.blur();
        }
        return;
      }
      if (isTextInput(e.target)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.keys.w = true;
      if (key === 'a' || key === 'arrowleft') this.keys.a = true;
      if (key === 's' || key === 'arrowdown') this.keys.s = true;
      if (key === 'd' || key === 'arrowright') this.keys.d = true;
      if (key === 'e') {
        if (!this.keys.e && !e.repeat) this.justPressedE = true;
        this.keys.e = true;
      }
      if (key === 'q' || e.code === 'KeyQ') {
        if (!this.keys.q && !e.repeat) this.justPressedQ = true;
        this.keys.q = true;
      }
      if (key === 't') {
        if (!this.keys.t && !e.repeat) this.justPressedT = true;
        this.keys.t = true;
      }
      if (key === 'i') {
        if (!this.keys.i && !e.repeat) this.justPressedI = true;
        this.keys.i = true;
      }
      if (key === 'r') {
        if (!this.keys.r && !e.repeat) this.justPressedR = true;
        this.keys.r = true;
      }
      if (key === 'f') {
        if (!this.keys.f && !e.repeat) this.justPressedF = true;
        this.keys.f = true;
      }
      if (key === 'g') {
        if (!this.keys.g && !e.repeat) this.justPressedG = true;
        this.keys.g = true;
      }
      if (key === 'o' || e.code === 'KeyO') {
        if (!this.keys.o && !e.repeat) this.justPressedO = true;
        this.keys.o = true;
      }
      if (key === 'escape') {
        if (!this.keys.escape && !e.repeat) this.justPressedEscape = true;
        this.keys.escape = true;
      }
      if (key === ' ' || e.code === 'Space') {
        if (!this.keys.space && !e.repeat) this.justPressedSpace = true;
        this.keys.space = true;
      }
      if (key === 'tab') {
        e.preventDefault();
        this.keys.tab = true;
      }
      if (e.code === 'ShiftLeft' || key === 'shift') {
        if (!this.keys.shift && !e.repeat) this.justPressedShift = true;
        this.keys.shift = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        this.keys.escape = false;
        return;
      }
      if (isTextInput(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.keys.w = false;
      if (key === 'a' || key === 'arrowleft') this.keys.a = false;
      if (key === 's' || key === 'arrowdown') this.keys.s = false;
      if (key === 'd' || key === 'arrowright') this.keys.d = false;
      if (key === 'e') this.keys.e = false;
      if (key === 'q' || e.code === 'KeyQ') this.keys.q = false;
      if (key === 't') this.keys.t = false;
      if (key === 'i') this.keys.i = false;
      if (key === 'r') this.keys.r = false;
      if (key === 'f') this.keys.f = false;
      if (key === 'g') this.keys.g = false;
      if (key === 'o' || e.code === 'KeyO') this.keys.o = false;
      if (key === 'escape') this.keys.escape = false;
      if (key === ' ' || e.code === 'Space') this.keys.space = false;
      if (key === 'tab') this.keys.tab = false;
      if (e.code === 'ShiftLeft' || key === 'shift') this.keys.shift = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.justPressedLeft = true;
      }
      if (e.button === 2) {
        this.mouse.rightDown = true;
        this.justPressedRight = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    // Disable default right-click context menu on game canvas
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Sets up touch listeners for virtual joystick and mobile action buttons
   */
  setupTouchControls() {
    if (typeof document === 'undefined') return;

    const zone = document.getElementById('virtual-joystick-zone');
    const knob = document.getElementById('virtual-joystick-knob');
    if (zone && knob) {
      let touchId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 45;

      const updateKnob = (clientX, clientY) => {
        let diffX = clientX - startX;
        let diffY = clientY - startY;
        const dist = Math.hypot(diffX, diffY);
        if (dist > maxRadius) {
          diffX = (diffX / dist) * maxRadius;
          diffY = (diffY / dist) * maxRadius;
        }
        knob.style.transform = `translate(calc(-50% + ${diffX}px), calc(-50% + ${diffY}px))`;
        this.joystickVector = {
          dx: diffX / maxRadius,
          dy: diffY / maxRadius
        };
      };

      const onTouchStart = (e) => {
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = zone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        updateKnob(touch.clientX, touch.clientY);
      };

      const onTouchMove = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      };

      const onTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            knob.style.transform = 'translate(-50%, -50%)';
            this.joystickVector = { dx: 0, dy: 0 };
            break;
          }
        }
      };

      zone.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: false });
      window.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }

    const bindTouchBtn = (id, onDown, onUp) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onDown();
      }, { passive: false });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (onUp) onUp();
      }, { passive: false });
      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        if (onUp) onUp();
      }, { passive: false });
    };

    bindTouchBtn('touch-btn-attack',
      () => { this.mouse.leftDown = true; this.justPressedLeft = true; },
      () => { this.mouse.leftDown = false; }
    );
    bindTouchBtn('touch-btn-block',
      () => { this.mouse.rightDown = true; this.justPressedRight = true; },
      () => { this.mouse.rightDown = false; }
    );
    bindTouchBtn('touch-btn-roll',
      () => { this.keys.shift = true; this.justPressedShift = true; },
      () => { this.keys.shift = false; }
    );
    bindTouchBtn('touch-btn-bag',
      () => { this.justPressedI = true; this.justPressedTab = true; }
    );
  }

  /**
   * Returns normalized movement vector from WASD and virtual joystick
   */
  getMovementVector() {
    let dx = this.joystickVector.dx;
    let dy = this.joystickVector.dy;

    if (this.keys.w) dy -= 1;
    if (this.keys.s) dy += 1;
    if (this.keys.a) dx -= 1;
    if (this.keys.d) dx += 1;

    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  /**
   * Resets single-frame trigger flags
   */
  endFrame() {
    this.justPressedShift = false;
    this.justPressedE = false;
    this.justPressedQ = false;
    this.justPressedT = false;
    this.justPressedI = false;
    this.justPressedR = false;
    this.justPressedF = false;
    this.justPressedG = false;
    this.justPressedO = false;
    this.justPressedEscape = false;
    this.justPressedSpace = false;
    this.justPressedLeft = false;
    this.justPressedRight = false;
    this.justPressedTab = false;
  }
}
