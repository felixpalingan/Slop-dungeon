import { Peer } from 'peerjs';

/**
 * WebRTC Network Manager using PeerJS
 * Handles host room generation (e.g. SLOP-4821), peer connections, and message dispatch.
 */
export class NetworkManager {
  constructor() {
    this.peer = null;
    this.myPeerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.connections = new Map(); // peerId -> DataConnection
    this.remotePlayers = new Map(); // peerId -> player state

    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onMessageReceived = null;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SLOP-';
    for (let i = 0; i < 4; i++) {
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
        // If room code taken, could retry
        if (err.type === 'unavailable-id') {
          alert('Room code already in use! Generating new room...');
          this.createRoom().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Peer joins an existing room by code (e.g. SLOP-4821)
   */
  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.roomCode = roomCode.toUpperCase().trim();
      this.isHost = false;

      // Random peer ID for client
      this.peer = new Peer({
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        const hostPeerId = `dungeonslop-${this.roomCode.toLowerCase()}`;
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

    conn.on('data', (data) => {
      this.handleIncomingData(conn.peer, data);
    });

    conn.on('close', () => {
      console.log(`Peer disconnected: ${conn.peer}`);
      this.connections.delete(conn.peer);
      this.remotePlayers.delete(conn.peer);
      if (this.onPlayerLeft) this.onPlayerLeft(conn.peer);

      // If host, notify remaining peers
      if (this.isHost) {
        this.broadcast({
          type: 'PLAYER_LEFT',
          peerId: conn.peer
        });
      }
    });

    if (this.onPlayerJoined) this.onPlayerJoined(conn.peer);
  }

  handleIncomingData(fromPeerId, data) {
    if (!data || !data.type) return;

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
