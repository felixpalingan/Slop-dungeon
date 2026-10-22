import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkManager } from '../../src/network.js';
import { validatePacket, PacketTypes } from '../../src/packetSchemas.js';

describe('Phase 7.6: Network Evolution, Host Migration & Packet Schemas', () => {
  describe('Room Code Collision Prevention', () => {
    it('generates a 6-character high-entropy room code without prefix', () => {
      const net = new NetworkManager();
      const code = net.generateRoomCode();

      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(code.length).toBe(6);
    });

    it('formats and strips SLOP prefix if entered or pasted', () => {
      const net = new NetworkManager();
      expect(net.formatRoomCode('SLOP-A7B9X2')).toBe('A7B9X2');
      expect(net.formatRoomCode('slop-a7b9x2')).toBe('A7B9X2');
      expect(net.formatRoomCode('slopa7b9x2')).toBe('A7B9X2');
      expect(net.formatRoomCode('A7B9X2')).toBe('A7B9X2');
      expect(net.formatRoomCode('  k4b8w9  ')).toBe('K4B8W9');
      expect(net.formatRoomCode('')).toBe('');
      expect(net.formatRoomCode(null)).toBe('');
    });

    it('generates distinct codes with negligible collision probability', () => {
      const net = new NetworkManager();
      const generated = new Set();
      for (let i = 0; i < 100; i++) {
        generated.add(net.generateRoomCode());
      }
      expect(generated.size).toBe(100);
    });
  });

  describe('Host Migration Protocol', () => {
    let net;

    beforeEach(() => {
      net = new NetworkManager();
      net.myPeerId = 'client_beta';
      net.hostPeerId = 'host_alpha';
      net.peerRoster = ['host_alpha', 'client_beta', 'client_gamma'];
      net.connections = new Map();
      net.broadcast = vi.fn();
    });

    it('deterministically elects lowest PeerID when host disconnects', () => {
      const migrationSpy = vi.fn();
      net.onHostMigration = migrationSpy;

      // Host disconnects
      net.handleHostDisconnection();

      // Between client_beta and client_gamma, client_beta is lexicographically lowest
      expect(net.isHost).toBe(true);
      expect(net.hostPeerId).toBe('client_beta');
      expect(migrationSpy).toHaveBeenCalledWith('client_beta', true);
      expect(net.broadcast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'BECOME_HOST',
        newHostId: 'client_beta'
      }));
    });

    it('recognizes another peer when that peer is lowest in roster', () => {
      net.myPeerId = 'client_zeta';
      net.hostPeerId = 'host_alpha';
      net.peerRoster = ['host_alpha', 'client_beta', 'client_zeta'];

      const migrationSpy = vi.fn();
      net.onHostMigration = migrationSpy;

      net.handleHostDisconnection();

      // client_beta < client_zeta, so client_beta is elected
      expect(net.isHost).toBe(false);
      expect(net.hostPeerId).toBe('client_beta');
      expect(migrationSpy).toHaveBeenCalledWith('client_beta', false);
    });
  });

  describe('Packet Schemas & Validation', () => {
    it('validates and sanitizes STATE packet', () => {
      const raw = {
        type: 'STATE',
        x: 150.5,
        y: -300.2,
        vx: 12,
        vy: -5,
        angle: 1.57,
        hp: 150,
        stamina: 100,
        name: '<script>evil()</script>Hero',
        color: '#ff0055',
        isRolling: true
      };

      const sanitized = validatePacket(raw);
      expect(sanitized).toBeDefined();
      expect(sanitized.name).toBe('scriptevil()scriptHe');
      expect(sanitized.x).toBe(150.5);
      expect(sanitized.isRolling).toBe(true);
    });

    it('validates SLOPS_SYNC packet and rejects negative currency', () => {
      expect(validatePacket({ type: 'SLOPS_SYNC', amount: 500 })).toEqual({
        type: 'SLOPS_SYNC',
        amount: 500
      });

      expect(validatePacket({ type: 'SLOPS_SYNC', amount: -50 })).toBeNull();
      expect(validatePacket({ type: 'SLOPS_SYNC', amount: 'hacked' })).toBeNull();
    });

    it('validates DESCENT_SYNC packet with floor bounds', () => {
      const valid = validatePacket({
        type: 'DESCENT_SYNC',
        floorNumber: 2,
        seed: 'dungeon-seed-42',
        theme: 'cyberpunk'
      });
      expect(valid).toEqual({
        type: 'DESCENT_SYNC',
        floorNumber: 2,
        seed: 'dungeon-seed-42',
        theme: 'cyberpunk'
      });

      expect(validatePacket({ type: 'DESCENT_SYNC', floorNumber: -1 })).toBeNull();
      expect(validatePacket({ type: 'DESCENT_SYNC', floorNumber: 999 })).toBeNull();
    });

    it('validates BECOME_HOST and PEER_ROSTER packets', () => {
      const hostPkt = validatePacket({
        type: 'BECOME_HOST',
        newHostId: 'peer_123',
        timestamp: 1600000000
      });
      expect(hostPkt.newHostId).toBe('peer_123');

      const rosterPkt = validatePacket({
        type: 'PEER_ROSTER',
        peers: ['peer_1', 'peer_2'],
        hostId: 'peer_1'
      });
      expect(rosterPkt.peers).toEqual(['peer_1', 'peer_2']);
      expect(rosterPkt.hostId).toBe('peer_1');
    });

    it('rejects invalid or null packet types', () => {
      expect(validatePacket(null)).toBeNull();
      expect(validatePacket({})).toBeNull();
      expect(validatePacket({ type: 123 })).toBeNull();
    });
  });
});
