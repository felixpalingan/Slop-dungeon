import { describe, it, expect } from 'vitest';
import { Dungeon } from '../../src/dungeon.js';

describe('Deterministic Dungeon Generator', () => {
  it('generates between 7 and 9 rooms with all required chambers', () => {
    const dungeon = new Dungeon({ theme: 'jjk' });
    dungeon.generate('test-fixed-seed-100');

    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(7);
    expect(dungeon.rooms.length).toBeLessThanOrEqual(9);

    // Assert guaranteed room types
    expect(dungeon.spawnRoom).toBeDefined();
    expect(dungeon.spawnRoom.type).toBe('spawn');
    expect(dungeon.spawnRoom.gridX).toBe(0);
    expect(dungeon.spawnRoom.gridY).toBe(0);

    expect(dungeon.bossRoom).toBeDefined();
    expect(dungeon.bossRoom.type).toBe('boss');

    expect(dungeon.treasureRoom).toBeDefined();
    expect(dungeon.treasureRoom.type).toBe('treasure');

    expect(dungeon.merchantRoom).toBeDefined();
    expect(dungeon.merchantRoom.type).toBe('merchant');

    expect(dungeon.combatRooms.length).toBeGreaterThanOrEqual(1);
    for (const r of dungeon.combatRooms) {
      expect(r.type).toBe('combat');
    }
  });

  it('generates 100% IDENTICAL layout when supplied with the same seed', () => {
    const d1 = new Dungeon({ theme: 'jjk' });
    d1.generate('seed-deterministic-xyz');

    const d2 = new Dungeon({ theme: 'jjk' });
    d2.generate('seed-deterministic-xyz');

    expect(d1.rooms.length).toBe(d2.rooms.length);

    for (let i = 0; i < d1.rooms.length; i++) {
      const r1 = d1.rooms[i];
      const r2 = d2.rooms[i];
      expect(r1.id).toBe(r2.id);
      expect(r1.gridX).toBe(r2.gridX);
      expect(r1.gridY).toBe(r2.gridY);
      expect(r1.type).toBe(r2.type);
      expect(r1.doors.length).toBe(r2.doors.length);
      for (let j = 0; j < r1.doors.length; j++) {
        expect(r1.doors[j].dir).toBe(r2.doors[j].dir);
        expect(r1.doors[j].targetRoomId).toBe(r2.doors[j].targetRoomId);
      }
    }
  });

  it('generates differing layouts for different seeds', () => {
    const d1 = new Dungeon({ theme: 'cyberpunk' });
    d1.generate('alpha-sector-seed');

    const d2 = new Dungeon({ theme: 'cyberpunk' });
    d2.generate('beta-sector-seed');

    const coords1 = d1.rooms.map(r => `${r.gridX},${r.gridY}`).sort().join(';');
    const coords2 = d2.rooms.map(r => `${r.gridX},${r.gridY}`).sort().join(';');

    // While individual rooms might overlap, the overall graph fingerprint differs
    expect(coords1 === coords2 && d1.bossRoom.id === d2.bossRoom.id).toBe(false);
  });
});
