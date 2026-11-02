import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateJoystickVector, InputManager } from '../../src/input.js';
import { Player } from '../../src/player.js';
import { Renderer } from '../../src/renderer.js';

describe('Phase 1: Smart Touch Aim & Virtual Dual-Stick Engine', () => {
  describe('calculateJoystickVector', () => {
    it('returns zero vector when within deadzone radius (6px default)', () => {
      const res1 = calculateJoystickVector(0, 0);
      expect(res1.dx).toBe(0);
      expect(res1.dy).toBe(0);
      expect(res1.clampedDist).toBe(0);

      const res2 = calculateJoystickVector(4, 3, 6, 45); // dist = 5 (< 6)
      expect(res2.dx).toBe(0);
      expect(res2.dy).toBe(0);
      expect(res2.clampedDist).toBe(0);
    });

    it('calculates smooth normalized cardinal directions when displaced', () => {
      // Full right displacement (45px)
      const right = calculateJoystickVector(45, 0, 6, 45);
      expect(right.dx).toBeCloseTo(1, 4);
      expect(right.dy).toBeCloseTo(0, 4);
      expect(right.angle).toBeCloseTo(0, 4);

      // Full down displacement (45px)
      const down = calculateJoystickVector(0, 45, 6, 45);
      expect(down.dx).toBeCloseTo(0, 4);
      expect(down.dy).toBeCloseTo(1, 4);
      expect(down.angle).toBeCloseTo(Math.PI / 2, 4);

      // Full left displacement (-45px)
      const left = calculateJoystickVector(-45, 0, 6, 45);
      expect(left.dx).toBeCloseTo(-1, 4);
      expect(left.dy).toBeCloseTo(0, 4);
      expect(Math.abs(left.angle)).toBeCloseTo(Math.PI, 4);

      // Full up displacement (-45px)
      const up = calculateJoystickVector(0, -45, 6, 45);
      expect(up.dx).toBeCloseTo(0, 4);
      expect(up.dy).toBeCloseTo(-1, 4);
      expect(up.angle).toBeCloseTo(-Math.PI / 2, 4);
    });

    it('clamps deflection vector to magnitude 1 when thumb exceeds maxRadius', () => {
      const overdrag = calculateJoystickVector(100, 0, 6, 45);
      expect(overdrag.clampedDist).toBe(45);
      expect(overdrag.dx).toBe(1);
      expect(overdrag.dy).toBe(0);

      const diagonalOverdrag = calculateJoystickVector(100, 100, 6, 45);
      expect(diagonalOverdrag.clampedDist).toBe(45);
      const mag = Math.hypot(diagonalOverdrag.dx, diagonalOverdrag.dy);
      expect(mag).toBeCloseTo(1, 4);
    });

    it('provides proportional scaling between deadzone and maxRadius', () => {
      // deadzone = 6, maxRadius = 45 -> span = 39. Halfway is 6 + 19.5 = 25.5
      const halfDeflect = calculateJoystickVector(25.5, 0, 6, 45);
      expect(halfDeflect.dx).toBeCloseTo(0.5, 4);
      expect(halfDeflect.dy).toBe(0);
    });
  });

  describe('InputManager Touch Controls & Mode', () => {
    let input;

    beforeEach(() => {
      input = new InputManager();
    });

    it('initializes touch state flags', () => {
      expect(input.isTouchActive).toBe(false);
      expect(input.isTouchAiming).toBe(false);
      expect(input.touchAimAngle).toBeNull();
      expect(input.joystickVector).toEqual({ dx: 0, dy: 0 });
    });

    it('can activate and deactivate touch mode via setTouchMode', () => {
      input.setTouchMode(true);
      expect(input.isTouchActive).toBe(true);
      input.setTouchMode(false);
      expect(input.isTouchActive).toBe(false);
    });

    it('blends joystick vector into getMovementVector', () => {
      input.joystickVector = { dx: 0.8, dy: 0.6 };
      const move = input.getMovementVector();
      expect(move.dx).toBeCloseTo(0.8, 4);
      expect(move.dy).toBeCloseTo(0.6, 4);
    });
  });

  describe('Player Smart Auto-Aim & Target Lock-On', () => {
    let player;

    beforeEach(() => {
      player = new Player(0, 0);
    });

    it('findAutoAimTarget returns null when no targets are supplied', () => {
      expect(player.findAutoAimTarget([])).toBeNull();
      expect(player.findAutoAimTarget(null)).toBeNull();
    });

    it('ignores dead enemies, downed peers, and player entity itself', () => {
      const deadMob = { x: 50, y: 0, isDead: true };
      const downedPeer = { x: 60, y: 0, isDead: false, isDowned: true };
      const selfRef = player;

      expect(player.findAutoAimTarget([deadMob, downedPeer, selfRef])).toBeNull();
    });

    it('selects the closest valid enemy within range (<= 420px)', () => {
      const farMob = { id: 'far', x: 250, y: 0, isDead: false };
      const nearMob = { id: 'near', x: 80, y: 60, isDead: false }; // dist = 100
      const outsideMob = { id: 'out', x: 500, y: 0, isDead: false }; // dist = 500 > 420

      const target = player.findAutoAimTarget([farMob, nearMob, outsideMob]);
      expect(target).toBe(nearMob);
    });

    it('ignores targets located beyond autoAimMaxDistance', () => {
      const distantMob = { x: 450, y: 0, isDead: false };
      expect(player.findAutoAimTarget([distantMob])).toBeNull();
    });

    it('locks onto target and rotates angle in Touch Mode', () => {
      const mockInput = {
        isTouchActive: true,
        isTouchAiming: false,
        touchAimAngle: null,
        joystickVector: { dx: 0, dy: 0 },
        mouse: { screenX: 400, screenY: 300 }
      };

      // Enemy positioned at (0, 100) -> angle = Math.PI / 2 (down)
      const enemy = { x: 0, y: 100, isDead: false };
      player.update(0.016, mockInput, undefined, [enemy]);

      expect(player.targetedEnemy).toBe(enemy);
      expect(player.angle).toBeCloseTo(Math.PI / 2, 4);
      // Mouse coordinates should be synced with angle
      expect(mockInput.mouse.screenX).toBeCloseTo(400, 1);
      expect(mockInput.mouse.screenY).toBeCloseTo(500, 1);
    });

    it('faces movement direction when in Touch Mode with no enemies in range', () => {
      const mockInput = {
        isTouchActive: true,
        isTouchAiming: false,
        touchAimAngle: null,
        joystickVector: { dx: -1, dy: 0 },
        mouse: { screenX: 400, screenY: 300 }
      };

      player.update(0.016, mockInput, undefined, []);
      expect(player.targetedEnemy).toBeNull();
      // Moving left -> angle = Math.PI
      expect(Math.abs(player.angle)).toBeCloseTo(Math.PI, 4);
    });

    it('manual drag-to-aim overrides auto-aim when isTouchAiming is active', () => {
      const mockInput = {
        isTouchActive: true,
        isTouchAiming: true,
        touchAimAngle: -Math.PI / 4, // 45 deg up-right
        joystickVector: { dx: 0, dy: 0 },
        mouse: { screenX: 400, screenY: 300 }
      };

      // Even though an enemy is close at (0, 50), manual drag overrides it!
      const closeEnemy = { x: 0, y: 50, isDead: false };
      player.update(0.016, mockInput, undefined, [closeEnemy]);

      expect(player.targetedEnemy).toBeNull();
      expect(player.angle).toBeCloseTo(-Math.PI / 4, 4);
    });

    it('retains desktop mouse aiming when isTouchActive is false', () => {
      const mockInput = {
        isTouchActive: false,
        isTouchAiming: false,
        mouse: { screenX: 600, screenY: 300 } // Right of center (400, 300)
      };

      const nearbyEnemy = { x: 0, y: 50, isDead: false };
      player.update(0.016, mockInput, undefined, [nearbyEnemy]);

      // Desktop does not auto-lock; strictly tracks cursor
      expect(player.targetedEnemy).toBeNull();
      expect(player.angle).toBeCloseTo(0, 4);
    });
  });

  describe('Renderer Visual Feedback', () => {
    let mockCtx;
    let renderer;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        setLineDash: vi.fn(),
        closePath: vi.fn()
      };
      const mockCanvas = {
        getContext: vi.fn(() => mockCtx),
        width: 800,
        height: 600
      };
      renderer = new Renderer(mockCanvas);
    });

    it('drawTargetReticle renders rotating corner brackets over targeted enemy', () => {
      const target = { x: 120, y: 150, radius: 24, isDead: false };
      renderer.drawTargetReticle(target, 1.0);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalledWith(120, 150);
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('drawTargetReticle skips dead or downed targets gracefully', () => {
      const deadTarget = { x: 120, y: 150, radius: 24, isDead: true };
      renderer.drawTargetReticle(deadTarget, 1.0);
      expect(mockCtx.save).not.toHaveBeenCalled();
    });

    it('drawTouchAimGuide renders dashed trajectory and arrowhead along aim angle', () => {
      const player = { x: 200, y: 200 };
      renderer.drawTouchAimGuide(player, Math.PI / 2);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([8, 6]);
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });
});
