import { describe, it, expect, vi } from 'vitest';
import { ReadyCircle } from '../../src/readyCircle.js';

describe('ReadyCircle Unit Tests', () => {
  it('initializes with default values and 3-second countdown', () => {
    const circle = new ReadyCircle(0, 160, 75);
    expect(circle.x).toBe(0);
    expect(circle.y).toBe(160);
    expect(circle.radius).toBe(75);
    expect(circle.countdown).toBe(3.0);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.allReady).toBe(false);
    expect(circle.hasTriggered).toBe(false);
    expect(circle.onDescentTriggered).toBeNull();
  });

  it('detects when an entity is inside or outside the radius', () => {
    const circle = new ReadyCircle(0, 160, 75);
    expect(circle.isEntityInside({ x: 0, y: 160 })).toBe(true);
    expect(circle.isEntityInside({ x: 50, y: 160 })).toBe(true);
    expect(circle.isEntityInside({ x: 0, y: 235 })).toBe(true);
    expect(circle.isEntityInside({ x: 0, y: 240 })).toBe(false);
    expect(circle.isEntityInside({ x: 0, y: 0 })).toBe(false);
    expect(circle.isEntityInside(null)).toBe(false);
  });

  it('starts countdown when local player enters circle in solo mode', () => {
    const circle = new ReadyCircle(0, 160, 75);
    const player = { x: 0, y: 160, isDead: false, isDowned: false };
    const onDescent = vi.fn();
    circle.onDescentTriggered = onDescent;

    circle.update(1.0, player, new Map());
    expect(circle.allReady).toBe(true);
    expect(circle.isCountingDown).toBe(true);
    expect(circle.countdown).toBeCloseTo(2.0, 5);
    expect(onDescent).not.toHaveBeenCalled();

    circle.update(1.0, player, new Map());
    expect(circle.countdown).toBeCloseTo(1.0, 5);
    expect(onDescent).not.toHaveBeenCalled();

    circle.update(1.0, player, new Map());
    expect(circle.countdown).toBe(0);
    expect(circle.hasTriggered).toBe(true);
    expect(onDescent).toHaveBeenCalledTimes(1);

    // Further updates while inside do not duplicate the callback
    circle.update(0.5, player, new Map());
    expect(onDescent).toHaveBeenCalledTimes(1);
    expect(circle.onDescentTriggered).not.toBeNull();
  });

  it('resets countdown if player steps out before completion', () => {
    const circle = new ReadyCircle(0, 160, 75);
    const player = { x: 0, y: 160, isDead: false, isDowned: false };
    const onDescent = vi.fn();
    circle.onDescentTriggered = onDescent;

    circle.update(1.5, player, new Map());
    expect(circle.countdown).toBeCloseTo(1.5, 5);

    // Player steps out
    player.x = 0;
    player.y = 0;
    circle.update(0.1, player, new Map());
    expect(circle.allReady).toBe(false);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.countdown).toBe(3.0);
    expect(onDescent).not.toHaveBeenCalled();
  });

  it('allows recurring descent countdowns across consecutive runs via reset()', () => {
    const circle = new ReadyCircle(0, 160, 75);
    const player = { x: 0, y: 160, isDead: false, isDowned: false };
    const onDescent = vi.fn();
    circle.onDescentTriggered = onDescent;

    // Run 1: Countdown to 0
    circle.update(3.0, player, new Map());
    expect(circle.countdown).toBe(0);
    expect(onDescent).toHaveBeenCalledTimes(1);
    expect(circle.hasTriggered).toBe(true);

    // Player goes to dungeon, dies, returns to base camp -> circle.reset() called
    circle.reset();
    expect(circle.countdown).toBe(3.0);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.hasTriggered).toBe(false);
    expect(circle.onDescentTriggered).toBe(onDescent);

    // Run 2: Player stands in circle again -> countdown must start again and trigger descent!
    circle.update(1.0, player, new Map());
    expect(circle.isCountingDown).toBe(true);
    expect(circle.countdown).toBeCloseTo(2.0, 5);

    circle.update(2.0, player, new Map());
    expect(circle.countdown).toBe(0);
    expect(onDescent).toHaveBeenCalledTimes(2);
  });

  it('does not count dead or downed player as ready', () => {
    const circle = new ReadyCircle(0, 160, 75);
    const onDescent = vi.fn();
    circle.onDescentTriggered = onDescent;

    // Dead player inside circle
    const deadPlayer = { x: 0, y: 160, isDead: true, isDowned: false };
    circle.update(1.0, deadPlayer, new Map());
    expect(circle.allReady).toBe(false);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.countdown).toBe(3.0);

    // Downed player inside circle
    const downedPlayer = { x: 0, y: 160, isDead: false, isDowned: true };
    circle.update(1.0, downedPlayer, new Map());
    expect(circle.allReady).toBe(false);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.countdown).toBe(3.0);
    expect(onDescent).not.toHaveBeenCalled();
  });

  it('multiplayer: requires all living teammates to enter circle before countdown begins', () => {
    const circle = new ReadyCircle(0, 160, 75);
    const onDescent = vi.fn();
    circle.onDescentTriggered = onDescent;

    const local = { x: 0, y: 160, isDead: false, isDowned: false };
    const remotePeer = { x: 0, y: 0, isDead: false, isDowned: false };
    const remoteMap = new Map([['peer_bob', remotePeer]]);

    // Local inside, remote outside
    circle.update(1.0, local, remoteMap);
    expect(circle.allReady).toBe(false);
    expect(circle.isCountingDown).toBe(false);
    expect(circle.countdown).toBe(3.0);
    expect(circle.readyPlayerCount).toBe(1);
    expect(circle.totalPlayerCount).toBe(2);

    // Remote enters circle
    remotePeer.x = 0;
    remotePeer.y = 160;
    circle.update(1.0, local, remoteMap);
    expect(circle.allReady).toBe(true);
    expect(circle.isCountingDown).toBe(true);
    expect(circle.countdown).toBeCloseTo(2.0, 5);
    expect(circle.readyPlayerCount).toBe(2);
    expect(circle.totalPlayerCount).toBe(2);
  });
});
