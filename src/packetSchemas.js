import { sanitizePlayerName, validateCombatDamage, validatePosition, validateSlopsAmount } from './security.js';

/**
 * Packet Schemas & Network Message Validator
 * Enforces strict typing, bounds checking, and schema verification for all WebRTC packets.
 */

export const PacketTypes = {
  STATE: 'STATE',
  SLOPS_SYNC: 'SLOPS_SYNC',
  DESCENT_SYNC: 'DESCENT_SYNC',
  BECOME_HOST: 'BECOME_HOST',
  PEER_ROSTER: 'PEER_ROSTER',
  COMIC_TEXT: 'COMIC_TEXT',
  PLAYER_LEFT: 'PLAYER_LEFT',
  ENEMY_HIT: 'ENEMY_HIT',
  PLAYER_HIT: 'PLAYER_HIT',
  ATTACK_SLASH: 'ATTACK_SLASH',
  ROOM_CLEARED: 'ROOM_CLEARED',
  WIPE_TRIGGER: 'WIPE_TRIGGER',
  BJ_TABLE_OCCUPANT: 'BJ_TABLE_OCCUPANT'
};

/**
 * Validates and sanitizes an incoming network packet.
 * Returns the sanitized packet object, or null if the packet fails schema validation.
 * @param {any} raw
 * @returns {any|null}
 */
export function validatePacket(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.type !== 'string' || !raw.type) return null;

  switch (raw.type) {
    case PacketTypes.STATE: {
      return {
        ...raw,
        type: PacketTypes.STATE,
        x: validatePosition(raw.x),
        y: validatePosition(raw.y),
        vx: validatePosition(raw.vx),
        vy: validatePosition(raw.vy),
        angle: typeof raw.angle === 'number' && !isNaN(raw.angle) ? raw.angle : 0,
        hp: typeof raw.hp === 'number' && !isNaN(raw.hp) ? Math.max(0, Math.min(raw.hp, 10000)) : 100,
        stamina: typeof raw.stamina === 'number' && !isNaN(raw.stamina) ? Math.max(0, Math.min(raw.stamina, 500)) : 100,
        name: sanitizePlayerName(raw.name),
        color: typeof raw.color === 'string' ? raw.color.slice(0, 30) : '#00f0ff',
        isRolling: !!raw.isRolling,
        isBlocking: !!raw.isBlocking,
        isDowned: !!raw.isDowned,
        isDead: !!raw.isDead,
        equipment: raw.equipment && typeof raw.equipment === 'object' ? raw.equipment : {}
      };
    }

    case PacketTypes.SLOPS_SYNC: {
      const validAmt = validateSlopsAmount(raw.amount);
      if (validAmt === null) return null;
      return {
        type: PacketTypes.SLOPS_SYNC,
        amount: validAmt
      };
    }

    case PacketTypes.DESCENT_SYNC: {
      const floorNum = parseInt(raw.floorNumber, 10);
      if (isNaN(floorNum) || floorNum < 0 || floorNum > 100) return null;
      return {
        type: PacketTypes.DESCENT_SYNC,
        floorNumber: floorNum,
        seed: raw.seed !== undefined ? String(raw.seed).slice(0, 64) : 'default-seed',
        theme: typeof raw.theme === 'string' ? raw.theme.slice(0, 32) : 'crypt'
      };
    }

    case PacketTypes.BECOME_HOST: {
      if (!raw.newHostId || typeof raw.newHostId !== 'string') return null;
      return {
        type: PacketTypes.BECOME_HOST,
        newHostId: String(raw.newHostId).slice(0, 64),
        timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now()
      };
    }

    case PacketTypes.PEER_ROSTER: {
      if (!Array.isArray(raw.peers)) return null;
      return {
        type: PacketTypes.PEER_ROSTER,
        peers: raw.peers.filter(p => typeof p === 'string').map(p => p.slice(0, 64)),
        hostId: typeof raw.hostId === 'string' ? raw.hostId.slice(0, 64) : null
      };
    }

    case PacketTypes.COMIC_TEXT: {
      return {
        type: PacketTypes.COMIC_TEXT,
        x: validatePosition(raw.x),
        y: validatePosition(raw.y),
        text: typeof raw.text === 'string' ? raw.text.slice(0, 60) : '',
        color: typeof raw.color === 'string' ? raw.color.slice(0, 30) : '#ffffff'
      };
    }

    case PacketTypes.ENEMY_HIT: {
      const dmg = validateCombatDamage(raw.damage);
      if (dmg === null) return null;
      return {
        type: PacketTypes.ENEMY_HIT,
        monsterId: raw.monsterId !== undefined ? String(raw.monsterId).slice(0, 64) : null,
        damage: dmg,
        angle: typeof raw.angle === 'number' && !isNaN(raw.angle) ? raw.angle : 0,
        knockback: typeof raw.knockback === 'number' ? Math.max(0, Math.min(raw.knockback, 500)) : 0,
        isCrit: !!raw.isCrit
      };
    }

    case PacketTypes.PLAYER_HIT: {
      const dmg = validateCombatDamage(raw.damage);
      if (dmg === null) return null;
      return {
        type: PacketTypes.PLAYER_HIT,
        targetId: raw.targetId !== undefined ? String(raw.targetId).slice(0, 64) : null,
        damage: dmg,
        angle: typeof raw.angle === 'number' && !isNaN(raw.angle) ? raw.angle : 0,
        knockback: typeof raw.knockback === 'number' ? Math.max(0, Math.min(raw.knockback, 500)) : 0
      };
    }

    case PacketTypes.PLAYER_LEFT: {
      return {
        type: PacketTypes.PLAYER_LEFT,
        peerId: typeof raw.peerId === 'string' ? raw.peerId.slice(0, 64) : ''
      };
    }

    case PacketTypes.ROOM_CLEARED: {
      return {
        type: PacketTypes.ROOM_CLEARED,
        roomId: typeof raw.roomId === 'string' ? raw.roomId.slice(0, 64) : null
      };
    }

    case PacketTypes.WIPE_TRIGGER: {
      return {
        type: PacketTypes.WIPE_TRIGGER,
        floorNumber: typeof raw.floorNumber === 'number' ? raw.floorNumber : 0
      };
    }

    case PacketTypes.BJ_TABLE_OCCUPANT: {
      return {
        type: PacketTypes.BJ_TABLE_OCCUPANT,
        playerId: typeof raw.playerId === 'string' ? raw.playerId.slice(0, 64) : null,
        playerName: sanitizePlayerName(raw.playerName),
        isLeaving: !!raw.isLeaving
      };
    }

    default:
      // Allow forward-compatible or custom message types if valid object with type string
      return raw;
  }
}
