import { Peer } from 'peerjs';
import { validatePacket } from './packetSchemas.js';

/**
 * WebRTC Network Manager using PeerJS
 * Handles 6-character collision-resistant room codes (SLOP-A7B9X2),
 * host migration upon host disconnect, and validated packet dispatch.
 */
export class NetworkManager {
  constructor() {
    this.peer = null;
    this.myPeerId = null;
    this.hostPeerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.peerRoster = []; // string[] of all peer IDs in room
    this.connections = new Map(); // peerId -> DataConnection
    this.remotePlayers = new Map(); // peerId -> player state

    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onMessageReceived = null;
    this.onHostMigration = null;
  }

  get isConnected() {
    return this.connections.size > 0;
  }

  /**
   * Generates a high-entropy 6-character room code (e.g. SLOP-A7B9X2)
   * Expanding keyspace to 32^6 (> 1,073,741,824 combinations)
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SLOP-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Host starts a room with a 6-character room code
   */
  createRoom(customCode = null) {
    return new Promise((resolve, reject) => {
      this.roomCode = customCode || this.generateRoomCode();
      this.isHost = true;
      const fullPeerId = `dungeonslop-${this.roomCode.toLowerCase()}`;

      this.peer = new Peer(fullPeerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.hostPeerId = id;
        this.peerRoster = [id];
        console.log(`[Host] Room created: ${this.roomCode} (PeerID: ${id})`);
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        conn.on('error', (err) => {
          console.warn('[Host] Connection error with peer:', conn.peer, err);
        });

        const handleOpen = () => {
          this.setupConnection(conn);
        };
        if (conn.open) {
          handleOpen();
        } else {
          conn.on('open', handleOpen);
        }
      });

      this.peer.on('error', (err) => {
        console.error('[Host] PeerJS error:', err);
        if (err.type === 'unavailable-id') {
          console.warn('[Host] Room code collision, generating new code...');
          this.createRoom().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Peer joins an existing room by code (e.g. SLOP-A7B9X2)
   */
  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.roomCode = roomCode.toUpperCase().trim();
      this.isHost = false;

      this.peer = new Peer({
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.peerRoster = [id];
        const hostPeerId = `dungeonslop-${this.roomCode.toLowerCase()}`;
        this.hostPeerId = hostPeerId;
        console.log(`[Client] Connecting to host: ${hostPeerId}...`);

        const conn = this.peer.connect(hostPeerId, {
          reliable: true
        });

        conn.on('open', () => {
          console.log('[Client] Connected to host!');
          this.setupConnection(conn);
          resolve(this.roomCode);
        });

        conn.on('error', (err) => {
          console.error('[Client] Connection error:', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Client] Peer error:', err);
        reject(err);
      });
    });
  }

  setupConnection(conn) {
    this.connections.set(conn.peer, conn);

    if (this.isHost) {
      if (!this.peerRoster.includes(conn.peer)) {
        this.peerRoster.push(conn.peer);
      }
      this.broadcastRoster();
    }

    conn.on('data', (data) => {
      this.handleIncomingData(conn.peer, data);
    });

    conn.on('close', () => {
      console.log(`Peer disconnected: ${conn.peer}`);
      this.connections.delete(conn.peer);
      this.remotePlayers.delete(conn.peer);
      const wasHost = (conn.peer === this.hostPeerId);

      this.peerRoster = this.peerRoster.filter(id => id !== conn.peer);

      if (this.onPlayerLeft) this.onPlayerLeft(conn.peer);

      if (this.isHost) {
        this.broadcast({
          type: 'PLAYER_LEFT',
          peerId: conn.peer
        });
        this.broadcastRoster();
      } else if (wasHost) {
        this.handleHostDisconnection();
      }
    });

    if (this.onPlayerJoined) this.onPlayerJoined(conn.peer);
  }

  /**
   * Broadcasts the current peer roster to all connected clients
   */
  broadcastRoster() {
    if (!this.isHost) return;
    this.broadcast({
      type: 'PEER_ROSTER',
      peers: this.peerRoster,
      hostId: this.myPeerId
    });
  }

  /**
   * Host Migration: deterministically elects the remaining peer with the lowest PeerID
   */
  handleHostDisconnection() {
    console.warn(`[HostMigration] Current host ${this.hostPeerId} disconnected! Electing new host...`);

    const candidates = this.peerRoster.filter(id => id !== this.hostPeerId);
    if (!candidates.includes(this.myPeerId) && this.myPeerId) {
      candidates.push(this.myPeerId);
    }

    if (candidates.length === 0) {
      console.warn('[HostMigration] No candidates remaining in room.');
      return;
    }

    // Deterministic election: lowest peerId wins host authority
    candidates.sort();
    const newHostId = candidates[0];
    console.log(`[HostMigration] Election result: ${newHostId}`);

    if (newHostId === this.myPeerId) {
      this.isHost = true;
      this.hostPeerId = this.myPeerId;
      console.log(`[HostMigration] 👑 PROMOTED TO HOST: ${this.myPeerId}`);

      const packet = {
        type: 'BECOME_HOST',
        newHostId: this.myPeerId,
        timestamp: Date.now()
      };
      this.broadcast(packet);
      this.broadcastRoster();

      if (this.onHostMigration) {
        this.onHostMigration(this.myPeerId, true);
      }
    } else {
      this.isHost = false;
      this.hostPeerId = newHostId;
      console.log(`[HostMigration] Following new host: ${newHostId}`);

      if (this.onHostMigration) {
        this.onHostMigration(newHostId, false);
      }
    }
  }

  handleIncomingData(fromPeerId, rawData) {
    if (!rawData) return;
    const data = validatePacket(rawData);
    if (!data || !data.type) return;

    if (data.type === 'PEER_ROSTER') {
      if (Array.isArray(data.peers)) {
        this.peerRoster = data.peers;
      }
      if (data.hostId) {
        this.hostPeerId = data.hostId;
      }
    } else if (data.type === 'BECOME_HOST') {
      console.log(`[HostMigration] Received BECOME_HOST from ${data.newHostId}`);
      this.hostPeerId = data.newHostId;
      if (this.myPeerId !== data.newHostId) {
        this.isHost = false;
        if (this.onHostMigration) {
          this.onHostMigration(data.newHostId, false);
        }
      }
    }

    if (this.onMessageReceived) {
      this.onMessageReceived(fromPeerId, data);
    }

    // Host relays to all other connected peers (mesh star topology)
    if (this.isHost) {
      for (const [peerId, conn] of this.connections.entries()) {
        if (peerId !== fromPeerId && conn.open) {
          conn.send(data);
        }
      }
    }
  }

  /**
   * Broadcast message to all connected peers
   */
  broadcast(data) {
    for (const [_, conn] of this.connections.entries()) {
      if (conn.open) {
        conn.send(data);
      }
    }
  }

  /**
   * Send data directly to host
   */
  sendToHost(data) {
    for (const [_, conn] of this.connections.entries()) {
      if (conn.open) {
        conn.send(data);
        break;
      }
    }
  }

  /**
   * Send data directly to a specific connected peer
   */
  sendTo(peerId, data) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }
}
