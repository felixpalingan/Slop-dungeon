import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../../src/audio.js';
import { Renderer } from '../../src/renderer.js';
import { setupOrientationEnforcement, setupGestureHardening } from '../../src/mobileHUD.js';

describe('Phase 4: Landscape Orientation, Web Audio Unlock & Gesture Hardening', () => {
  describe('AudioManager Web Audio Unlock', () => {
    let audio;
    let mockRawCtx;

    beforeEach(() => {
      mockRawCtx = {
        state: 'suspended',
        currentTime: 0,
        resume: vi.fn().mockResolvedValue(),
        createGain: vi.fn(() => ({
          gain: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        })),
        createBuffer: vi.fn(() => ({})),
        createBufferSource: vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn()
        })),
        destination: {}
      };

      global.window = {
        AudioContext: vi.fn(() => mockRawCtx),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      global.document = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      audio = new AudioManager();
    });

    afterEach(() => {
      delete global.window;
      delete global.document;
    });

    it('attaches touch/pointer listeners on window and document for mobile audio unlock', () => {
      expect(global.window.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { capture: true, passive: true }
      );
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { capture: true, passive: true }
      );
    });

    it('resumes suspended context and plays silent dummy buffer on first user touch', () => {
      // Find the registered unlock handler from mock call
      const unlockCall = global.window.addEventListener.mock.calls.find(c => c[0] === 'touchstart');
      expect(unlockCall).toBeDefined();
      const unlockHandler = unlockCall[1];

      unlockHandler();

      expect(mockRawCtx.resume).toHaveBeenCalled();
      expect(mockRawCtx.createBuffer).toHaveBeenCalledWith(1, 1, 22050);
      expect(mockRawCtx.createBufferSource).toHaveBeenCalled();
      expect(audio._mobileAudioUnlocked).toBe(true);

      // Listeners should be cleaned up after unlocking
      expect(global.window.removeEventListener).toHaveBeenCalledWith('touchstart', unlockHandler, true);
      expect(global.document.removeEventListener).toHaveBeenCalledWith('touchstart', unlockHandler, true);
    });
  });

  describe('Renderer DPR Capping & Performance Optimization', () => {
    let mockCanvas;
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn()
      };
      mockCanvas = {
        getContext: vi.fn(() => mockCtx),
        style: {},
        width: 800,
        height: 600
      };
    });

    it('caps devicePixelRatio to 2.0 max on 3x/4x mobile screens', () => {
      global.window = {
        innerWidth: 844,
        innerHeight: 390,
        devicePixelRatio: 3.5,
        addEventListener: vi.fn()
      };

      const renderer = new Renderer(mockCanvas);
      expect(renderer.dpr).toBe(2.0);
      expect(renderer.width).toBe(844);
      expect(renderer.height).toBe(390);
      expect(mockCanvas.width).toBe(844);
      expect(mockCanvas.height).toBe(390);

      delete global.window;
    });

    it('enforces minimum DPR of 1.0 when device reports lower DPR', () => {
      global.window = {
        innerWidth: 800,
        innerHeight: 600,
        devicePixelRatio: 0.5,
        addEventListener: vi.fn()
      };

      const renderer = new Renderer(mockCanvas);
      expect(renderer.dpr).toBe(1.0);

      delete global.window;
    });
  });

  describe('setupOrientationEnforcement & setupGestureHardening', () => {
    let modalEl;
    let fsBtnEl;

    beforeEach(() => {
      const classListSet = new Set(['hidden']);
      modalEl = {
        classList: {
          add: vi.fn((cls) => classListSet.add(cls)),
          remove: vi.fn((cls) => classListSet.delete(cls)),
          contains: vi.fn((cls) => classListSet.has(cls))
        }
      };
      fsBtnEl = {
        onclick: null
      };

      global.window = {
        innerWidth: 390,
        innerHeight: 844, // Portrait mobile!
        addEventListener: vi.fn()
      };
      global.document = {
        getElementById: vi.fn((id) => {
          if (id === 'orientation-modal') return modalEl;
          if (id === 'btn-fullscreen-toggle') return fsBtnEl;
          return null;
        }),
        addEventListener: vi.fn(),
        documentElement: {
          requestFullscreen: vi.fn().mockResolvedValue()
        }
      };
    });

    afterEach(() => {
      delete global.window;
      delete global.document;
    });

    it('reveals orientation modal when mobile screen is in portrait mode', () => {
      const { checkOrientation } = setupOrientationEnforcement();
      expect(modalEl.classList.remove).toHaveBeenCalledWith('hidden');

      // Now rotate to landscape
      global.window.innerWidth = 844;
      global.window.innerHeight = 390;
      checkOrientation();

      expect(modalEl.classList.add).toHaveBeenCalledWith('hidden');
    });

    it('binds fullscreen toggle button', () => {
      setupOrientationEnforcement();
      expect(fsBtnEl.onclick).toBeDefined();

      fsBtnEl.onclick();
      expect(global.document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('registers gesture hardening listeners against double tap and pinch zoom', () => {
      setupGestureHardening();
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'dblclick',
        expect.any(Function),
        { passive: false }
      );
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'gesturestart',
        expect.any(Function),
        { passive: false }
      );
    });
  });
});
