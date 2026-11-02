/**
 * Input Manager for Dungeon Slop
 * Handles WASD keyboard movement, Left Shift for Roll/Dash, and mouse aim.
 */

/**
 * Calculates normalized joystick vector from pixel offsets with deadzone and maxRadius clamping.
 * @param {number} diffX - X offset from touch center
 * @param {number} diffY - Y offset from touch center
 * @param {number} [deadzone=6] - Deadzone in pixels where no movement is registered
 * @param {number} [maxRadius=45] - Maximum deflection radius in pixels
 * @returns {{ dx: number, dy: number, clampedDist: number, angle: number }}
 */
export function calculateJoystickVector(diffX, diffY, deadzone = 6, maxRadius = 45) {
  const dist = Math.hypot(diffX, diffY);
  if (dist < deadzone) {
    return { dx: 0, dy: 0, clampedDist: 0, angle: 0 };
  }
  const clampedDist = Math.min(dist, maxRadius);
  const norm = Math.max(0, Math.min(1, (clampedDist - deadzone) / (maxRadius - deadzone)));
  const angle = Math.atan2(diffY, diffX);
  return {
    dx: Math.cos(angle) * norm,
    dy: Math.sin(angle) * norm,
    clampedDist,
    angle
  };
}

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
      screenX: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
      screenY: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
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

    // Mobile / Touch controls state
    this.isTouchActive = false;
    this.isTouchAiming = false;
    this.touchAimAngle = null;
    this.joystickVector = { dx: 0, dy: 0 };

    this.setupListeners();
    this.setupTouchControls();
  }

  setupListeners() {
    if (typeof window === 'undefined') return;

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
   * Sets or toggles touch controls mode
   * @param {boolean} active
   */
  setTouchMode(active = true) {
    this.isTouchActive = !!active;
    if (typeof document !== 'undefined') {
      const touchControls = document.getElementById('touch-controls');
      if (touchControls) {
        touchControls.style.display = this.isTouchActive ? 'block' : 'none';
      }
    }
  }

  /**
   * Sets up touch listeners for virtual joystick and mobile action buttons
   */
  setupTouchControls() {
    if (typeof document === 'undefined') return;

    if (typeof window !== 'undefined') {
      const isTouch = ('ontouchstart' in window) ||
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      if (isTouch) {
        this.setTouchMode(true);
      }
      window.addEventListener('touchstart', () => {
        if (!this.isTouchActive) {
          this.setTouchMode(true);
        }
      }, { passive: true });
    }

    const zone = document.getElementById('virtual-joystick-zone');
    const base = document.getElementById('virtual-joystick-base');
    const knob = document.getElementById('virtual-joystick-knob');
    if (zone && knob) {
      let touchId = null;
      let startX = 0;
      let startY = 0;
      const deadzone = 6;
      const maxRadius = 45;

      const updateKnob = (clientX, clientY) => {
        const diffX = clientX - startX;
        const diffY = clientY - startY;
        const res = calculateJoystickVector(diffX, diffY, deadzone, maxRadius);
        const dist = Math.hypot(diffX, diffY);
        const knobX = dist > 0 ? (diffX / dist) * res.clampedDist : 0;
        const knobY = dist > 0 ? (diffY / dist) * res.clampedDist : 0;

        knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        this.joystickVector = {
          dx: res.dx,
          dy: res.dy
        };
      };

      const onTouchStart = (e) => {
        if (touchId !== null) return;
        this.isTouchActive = true;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = zone.getBoundingClientRect();

        // Dynamic floating anchor: center base at touch point clamped inside touch zone
        if (base) {
          const baseW = base.offsetWidth || 130;
          const baseH = base.offsetHeight || 130;
          const halfW = baseW / 2;
          const halfH = baseH / 2;

          let relX = touch.clientX - rect.left - halfW;
          let relY = touch.clientY - rect.top - halfH;

          // Clamp base within zone bounds
          relX = Math.max(5, Math.min(rect.width - baseW - 5, relX));
          relY = Math.max(5, Math.min(rect.height - baseH - 5, relY));

          base.style.left = `${relX}px`;
          base.style.top = `${relY}px`;
          base.style.bottom = 'auto';

          startX = rect.left + relX + halfW;
          startY = rect.top + relY + halfH;
        } else {
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        }

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
            if (base) {
              base.style.left = '30px';
              base.style.bottom = '30px';
              base.style.top = 'auto';
            }
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

    // Attack Button: supports Quick Tap (auto-aim), Hold (auto-fire repeat), and Drag-to-Aim (directional preview & release)
    const attackBtn = document.getElementById('touch-btn-attack');
    if (attackBtn) {
      let attackTouchId = null;
      let startX = 0;
      let startY = 0;
      let isAimDragging = false;
      let holdInterval = null;
      const dragThreshold = 14;

      const triggerAttack = () => {
        this.mouse.leftDown = true;
        this.justPressedLeft = true;
      };

      attackBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isTouchActive = true;
        if (attackTouchId !== null) return;
        const touch = e.changedTouches[0];
        attackTouchId = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;
        isAimDragging = false;
        this.isTouchAiming = false;
        this.touchAimAngle = null;

        // Auto-fire if held without dragging for > 220ms
        if (holdInterval) clearInterval(holdInterval);
        holdInterval = setInterval(() => {
          if (!isAimDragging && attackTouchId !== null) {
            triggerAttack();
          }
        }, 220);
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (attackTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === attackTouchId) {
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.hypot(dx, dy);
            if (dist >= dragThreshold) {
              isAimDragging = true;
              this.isTouchAiming = true;
              this.touchAimAngle = Math.atan2(dy, dx);
              const screenCenterX = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2;
              const screenCenterY = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2;
              this.mouse.screenX = screenCenterX + Math.cos(this.touchAimAngle) * 200;
              this.mouse.screenY = screenCenterY + Math.sin(this.touchAimAngle) * 200;
            }
            break;
          }
        }
      }, { passive: false });

      const onAttackTouchEnd = (e) => {
        if (attackTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === attackTouchId) {
            if (holdInterval) {
              clearInterval(holdInterval);
              holdInterval = null;
            }
            attackTouchId = null;
            triggerAttack();
            this.isTouchAiming = false;
            this.touchAimAngle = null;
            isAimDragging = false;
            this.mouse.leftDown = false;
            break;
          }
        }
      };

      const onAttackTouchCancel = (e) => {
        if (attackTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === attackTouchId) {
            if (holdInterval) {
              clearInterval(holdInterval);
              holdInterval = null;
            }
            attackTouchId = null;
            this.isTouchAiming = false;
            this.touchAimAngle = null;
            isAimDragging = false;
            this.mouse.leftDown = false;
            break;
          }
        }
      };

      window.addEventListener('touchend', onAttackTouchEnd, { passive: false });
      window.addEventListener('touchcancel', onAttackTouchCancel, { passive: false });
    }

    const bindTouchBtn = (id, onDown, onUp) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isTouchActive = true;
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
