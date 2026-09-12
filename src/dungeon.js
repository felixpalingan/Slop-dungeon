/**
 * Procedural Dungeon Generator & Tile Grid System for Dungeon Slop
 * Implements Binary Space Partitioning (BSP) room generation,
 * Room Discovery Fog of War, Circle-AABB wall collision resolution,
 * Levi ODM grapple wall raycasting, and theme configurations.
 */

export const TILES = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  CORRIDOR: 3,
  DOOR: 4,
  CONTAINER: 5,
  EXIT_PORTAL: 6
};

export const DUNGEON_THEMES = {
  jjk: {
    id: 'jjk',
    name: 'Jujutsu Kaisen: Cursed Detention Center',
    shortName: 'CURSED DETENTION CENTER',
    floorColor: '#12101e',
    floorAltColor: '#181429',
    floorGridColor: 'rgba(99, 102, 241, 0.12)',
    wallColor: '#251b3a',
    wallTopColor: '#382a54',
    wallBevelColor: '#4f3b73',
    wallStrokeColor: '#160f24',
    torchColor: '#a855f7',
    torchGlowColor: 'rgba(168, 85, 247, 0.28)',
    accentColor: '#c084fc',
    ambientColor: 'rgba(19, 14, 33, 0.85)',
    bannerPrefix: 'CURSED WARD',
    musicTrack: 'jjk'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk: Arasaka Sublevel',
    shortName: 'ARASAKA WEAPONS SUBLEVEL',
    floorColor: '#0a0d14',
    floorAltColor: '#0f1420',
    floorGridColor: 'rgba(6, 182, 212, 0.15)',
    wallColor: '#1e293b',
    wallTopColor: '#334155',
    wallBevelColor: '#06b6d4',
    wallStrokeColor: '#020617',
    torchColor: '#06b6d4',
    torchGlowColor: 'rgba(6, 182, 212, 0.32)',
    accentColor: '#facc15',
    ambientColor: 'rgba(10, 13, 20, 0.85)',
    bannerPrefix: 'SECTOR',
    musicTrack: 'cyberpunk'
  },
  aot: {
    id: 'aot',
    name: 'Attack on Titan: The Wall Crypts',
    shortName: 'WALL MARIA CRYPTS',
    floorColor: '#1c1917',
    floorAltColor: '#24201d',
    floorGridColor: 'rgba(217, 119, 6, 0.12)',
    wallColor: '#44403c',
    wallTopColor: '#57534e',
    wallBevelColor: '#78716c',
    wallStrokeColor: '#1c1917',
    torchColor: '#f59e0b',
    torchGlowColor: 'rgba(245, 158, 11, 0.35)',
    accentColor: '#10b981',
    ambientColor: 'rgba(28, 25, 23, 0.85)',
    bannerPrefix: 'DISTRICT',
    musicTrack: 'aot'
  },
  berserk: {
    id: 'berserk',
    name: 'Berserk: The Eclipse Sanctum',
    shortName: 'ECLIPSE SANCTUM',
    floorColor: '#17090b',
    floorAltColor: '#210d10',
    floorGridColor: 'rgba(239, 68, 68, 0.12)',
    wallColor: '#3b1218',
    wallTopColor: '#4c171f',
    wallBevelColor: '#7f1d1d',
    wallStrokeColor: '#120406',
    torchColor: '#ef4444',
    torchGlowColor: 'rgba(239, 68, 68, 0.35)',
    accentColor: '#dc2626',
    ambientColor: 'rgba(23, 9, 11, 0.85)',
    bannerPrefix: 'SACRIFICE CHAMBER',
    musicTrack: 'berserk'
  }
};

class BSPNode {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = null;
    this.right = null;
    this.room = null;
  }

  split(minSize = 13) {
    if (this.left || this.right) return false;

    // Determine split direction (prefer splitting the longer axis)
    let splitH = Math.random() > 0.5;
    if (this.width > this.height && this.width / this.height >= 1.25) splitH = false;
    else if (this.height > this.width && this.height / this.width >= 1.25) splitH = true;

    const max = (splitH ? this.height : this.width) - minSize;
    if (max <= minSize) return false;

    const splitPos = Math.floor(minSize + Math.random() * (max - minSize));

    if (splitH) {
      this.left = new BSPNode(this.x, this.y, this.width, splitPos);
      this.right = new BSPNode(this.x, this.y + splitPos, this.width, this.height - splitPos);
    } else {
      this.left = new BSPNode(this.x, this.y, splitPos, this.height);
      this.right = new BSPNode(this.x + splitPos, this.y, this.width - splitPos, this.height);
    }

    return true;
  }
}

export class Dungeon {
  constructor(options = {}) {
    this.cols = options.cols || 46;
    this.rows = options.rows || 46;
    this.tileSize = options.tileSize || 64;

    // Origin centered in world coordinates
    this.originX = -Math.floor((this.cols * this.tileSize) / 2);
    this.originY = -Math.floor((this.rows * this.tileSize) / 2);
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    this.minX = this.originX;
    this.minY = this.originY;
    this.maxX = this.originX + this.width;
    this.maxY = this.originY + this.height;

    this.floorNumber = options.floorNumber || 1;
    this.themeKey = options.theme || 'jjk';
    this.theme = DUNGEON_THEMES[this.themeKey] || DUNGEON_THEMES.jjk;

    // Grid: 2D array of tile types
    this.grid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));
    this.corridorTiles = new Set(); // Stores "col,row" for quick corridor lookup

    this.rooms = [];
    this.spawnRoom = null;
    this.bossRoom = null;
    this.treasureRoom = null;
    this.combatRooms = [];

    this.torches = [];
    this.containers = []; // Destructible pots / crates
    this.exitPortal = null; // { x, y, isActive }

    // Active room banner notification
    this.activeBanner = null; // { title, subtitle, color, timer, maxTimer }
  }

  /**
   * Generates procedural room-and-corridor dungeon using Binary Space Partitioning
   */
  generate(seed = null) {
    if (seed) this.seed = seed;

    // Clear grid to VOID
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.grid[c][r] = TILES.VOID;
      }
    }

    this.rooms = [];
    this.torches = [];
    this.containers = [];

    // 1. BSP Tree Root (leave 2-tile border)
    const root = new BSPNode(2, 2, this.cols - 4, this.rows - 4);
    const nodes = [root];

    // Split partitions until we have 6 to 9 leaves
    let didSplit = true;
    while (didSplit && nodes.length < 8) {
      didSplit = false;
      const leaves = [];
      const getLeaves = (n) => {
        if (!n.left && !n.right) leaves.push(n);
        else {
          if (n.left) getLeaves(n.left);
          if (n.right) getLeaves(n.right);
        }
      };
      getLeaves(root);

      for (const leaf of leaves) {
        if (leaf.split(13)) {
          didSplit = true;
          nodes.push(leaf.left);
          nodes.push(leaf.right);
          if (nodes.length >= 9) break;
        }
      }
    }

    // 2. Carve rooms inside leaf partitions
    const leafNodes = [];
    const collectLeaves = (n) => {
      if (!n.left && !n.right) leafNodes.push(n);
      else {
        if (n.left) collectLeaves(n.left);
        if (n.right) collectLeaves(n.right);
      }
    };
    collectLeaves(root);

    let roomId = 1;
    for (const leaf of leafNodes) {
      // Room size inside partition (leave at least 2 tiles margin)
      const minW = 7;
      const minH = 7;
      const maxW = Math.max(minW, leaf.width - 3);
      const maxH = Math.max(minH, leaf.height - 3);

      const rw = Math.floor(minW + Math.random() * (maxW - minW + 1));
      const rh = Math.floor(minH + Math.random() * (maxH - minH + 1));
      const rx = leaf.x + 1 + Math.floor(Math.random() * (leaf.width - rw - 2));
      const ry = leaf.y + 1 + Math.floor(Math.random() * (leaf.height - rh - 2));

      const room = {
        id: roomId++,
        col: rx,
        row: ry,
        width: rw,
        height: rh,
        centerX: this.originX + (rx + rw / 2) * this.tileSize,
        centerY: this.originY + (ry + rh / 2) * this.tileSize,
        bounds: {
          minX: this.originX + rx * this.tileSize,
          minY: this.originY + ry * this.tileSize,
          maxX: this.originX + (rx + rw) * this.tileSize,
          maxY: this.originY + (ry + rh) * this.tileSize
        },
        type: 'combat',
        name: `CHAMBER ${roomId - 1}`,
        isDiscovered: true,
        discoveredAlpha: 1.0,
        hasShownBanner: false,
        monstersSpawned: false,
        spawns: [],
        torches: []
      };

      leaf.room = room;
      this.rooms.push(room);

      // Carve floor in grid
      for (let c = rx; c < rx + rw; c++) {
        for (let r = ry; r < ry + rh; r++) {
          this.grid[c][r] = TILES.FLOOR;
        }
      }
    }

    // 3. Connect sibling BSP nodes with 2-tile wide corridors
    const connectNodes = (n) => {
      if (!n.left || !n.right) return;
      connectNodes(n.left);
      connectNodes(n.right);

      const getRoom = (node) => {
        if (node.room) return node.room;
        if (node.left) {
          const r = getRoom(node.left);
          if (r) return r;
        }
        if (node.right) return getRoom(node.right);
        return null;
      };

      const r1 = getRoom(n.left);
      const r2 = getRoom(n.right);

      if (r1 && r2) {
        this.carveCorridor(
          Math.floor(r1.col + r1.width / 2),
          Math.floor(r1.row + r1.height / 2),
          Math.floor(r2.col + r2.width / 2),
          Math.floor(r2.row + r2.height / 2)
        );
      }
    };
    connectNodes(root);

    // 4. Construct Walls around all Floor & Corridor tiles
    for (let c = 1; c < this.cols - 1; c++) {
      for (let r = 1; r < this.rows - 1; r++) {
        if (this.grid[c][r] === TILES.VOID) {
          // If any 8-neighbor is floor or corridor, make this a WALL
          let hasFloorNeighbor = false;
          for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
              if (dc === 0 && dr === 0) continue;
              const neighbor = this.grid[c + dc][r + dr];
              if (neighbor === TILES.FLOOR || neighbor === TILES.CORRIDOR || neighbor === TILES.DOOR) {
                hasFloorNeighbor = true;
                break;
              }
            }
            if (hasFloorNeighbor) break;
          }
          if (hasFloorNeighbor) {
            this.grid[c][r] = TILES.WALL;
          }
        }
      }
    }

    // Perimeter boundary walls
    for (let c = 0; c < this.cols; c++) {
      this.grid[c][0] = TILES.WALL;
      this.grid[c][this.rows - 1] = TILES.WALL;
    }
    for (let r = 0; r < this.rows; r++) {
      this.grid[0][r] = TILES.WALL;
      this.grid[this.cols - 1][r] = TILES.WALL;
    }

    // 5. Categorize Rooms
    if (this.rooms.length > 0) {
      // Spawn Room: First room or room closest to left/top
      this.rooms.sort((a, b) => (a.col + a.row) - (b.col + b.row));
      this.spawnRoom = this.rooms[0];
      this.spawnRoom.type = 'spawn';
      this.spawnRoom.name = `${this.theme.bannerPrefix} ENTRANCE`;
      this.spawnRoom.isDiscovered = true;
      this.spawnRoom.discoveredAlpha = 1.0;
      this.spawnRoom.hasShownBanner = true;

      // Boss Room: Farthest from Spawn Room
      let maxDist = -1;
      let bossRoom = this.rooms[this.rooms.length - 1];
      for (let i = 1; i < this.rooms.length; i++) {
        const d = Math.hypot(this.rooms[i].centerX - this.spawnRoom.centerX, this.rooms[i].centerY - this.spawnRoom.centerY);
        if (d > maxDist) {
          maxDist = d;
          bossRoom = this.rooms[i];
        }
      }
      this.bossRoom = bossRoom;
      this.bossRoom.type = 'boss';
      this.bossRoom.name = `${this.theme.bannerPrefix} BOSS SANCTUM`;

      // Treasure Vault: One intermediate room
      const otherRooms = this.rooms.filter(r => r !== this.spawnRoom && r !== this.bossRoom);
      if (otherRooms.length > 0) {
        this.treasureRoom = otherRooms[Math.floor(otherRooms.length / 2)];
        this.treasureRoom.type = 'treasure';
        this.treasureRoom.name = `${this.theme.bannerPrefix} TREASURE VAULT`;
      }

      this.combatRooms = this.rooms.filter(r => r.type === 'combat');
      for (let i = 0; i < this.combatRooms.length; i++) {
        this.combatRooms[i].name = `${this.theme.bannerPrefix} CHAMBER 0${i + 1}`;
      }

      // 6. Setup Exit Descent Portal in Boss Sanctum
      this.exitPortal = {
        x: this.bossRoom.centerX,
        y: this.bossRoom.centerY,
        radius: 36,
        isActive: false, // Activates when Boss is defeated!
        pulseAngle: 0
      };
    }

    // 7. Place Wall Torches & Destructibles
    this.populateFixtures();

    return this;
  }

  /**
   * Carves a 2-tile wide corridor between two grid points (L-shaped)
   */
  carveCorridor(c1, r1, c2, r2) {
    let currC = c1;
    let currR = r1;

    // Horizontal segment
    while (currC !== c2) {
      for (let w = 0; w < 2; w++) {
        if (currR + w < this.rows && this.grid[currC][currR + w] === TILES.VOID) {
          this.grid[currC][currR + w] = TILES.CORRIDOR;
          this.corridorTiles.add(`${currC},${currR + w}`);
        }
      }
      currC += currC < c2 ? 1 : -1;
    }

    // Vertical segment
    while (currR !== r2) {
      for (let w = 0; w < 2; w++) {
        if (currC + w < this.cols && this.grid[currC + w][currR] === TILES.VOID) {
          this.grid[currC + w][currR] = TILES.CORRIDOR;
          this.corridorTiles.add(`${currC + w},${currR}`);
        }
      }
      currR += currR < r2 ? 1 : -1;
    }
  }

  /**
   * Places wall torches on room perimeter and destructible containers in corners
   */
  populateFixtures() {
    let containerId = 1;

    for (const room of this.rooms) {
      // Place torches on north and south walls
      const midCol = Math.floor(room.col + room.width / 2);
      const torchNorthY = this.originY + room.row * this.tileSize + 6;
      const torchNorthX = this.originX + midCol * this.tileSize + this.tileSize / 2;
      const torchSouthY = this.originY + (room.row + room.height) * this.tileSize - 6;
      const torchSouthX = torchNorthX;

      const torch1 = { x: torchNorthX, y: torchNorthY, color: this.theme.torchColor, glow: this.theme.torchGlowColor, flicker: Math.random() * Math.PI * 2 };
      const torch2 = { x: torchSouthX, y: torchSouthY, color: this.theme.torchColor, glow: this.theme.torchGlowColor, flicker: Math.random() * Math.PI * 2 };
      this.torches.push(torch1, torch2);
      room.torches.push(torch1, torch2);

      // Destructible pots in corners of combat & treasure rooms
      if (room.type === 'combat' || room.type === 'treasure') {
        const corners = [
          { c: room.col + 1, r: room.row + 1 },
          { c: room.col + room.width - 2, r: room.row + 1 },
          { c: room.col + 1, r: room.row + room.height - 2 },
          { c: room.col + room.width - 2, r: room.row + room.height - 2 }
        ];

        for (const corner of corners) {
          if (Math.random() < 0.65) {
            const cx = this.originX + corner.c * this.tileSize + this.tileSize / 2;
            const cy = this.originY + corner.r * this.tileSize + this.tileSize / 2;
            this.containers.push({
              id: containerId++,
              x: cx,
              y: cy,
              radius: 18,
              hp: 1,
              isBroken: false,
              theme: this.themeKey
            });
          }
        }
      }
    }
  }

  /**
   * Checks if player has stepped inside an undiscovered room (Option A Fog of War).
   * Illuminates the room smoothly, reveals monsters, and shows banner notification!
   */
  checkRoomDiscovery(playerX, playerY) {
    for (const room of this.rooms) {
      if (
        playerX >= room.bounds.minX &&
        playerX <= room.bounds.maxX &&
        playerY >= room.bounds.minY &&
        playerY <= room.bounds.maxY
      ) {
        if (!room.hasShownBanner) {
          room.hasShownBanner = true;
          this.activeBanner = {
            title: room.name,
            subtitle: this.theme.shortName,
            color: this.theme.torchColor,
            timer: 3.2,
            maxTimer: 3.2
          };
          return { discovered: true, room };
        }
        return { discovered: false, room };
      }
    }
    return { discovered: false, room: null };
  }

  /**
   * Directly marks a room banner as shown by ID (for network sync)
   */
  discoverRoom(roomId) {
    const room = this.rooms.find(r => r.id === roomId);
    if (room && !room.hasShownBanner) {
      room.hasShownBanner = true;
      this.activeBanner = {
        title: room.name,
        subtitle: this.theme.shortName,
        color: this.theme.torchColor,
        timer: 3.2,
        maxTimer: 3.2
      };
      return room;
    }
    return null;
  }

  /**
   * Updates dungeon animations, banner timers, and exit portal effects
   */
  update(dt) {
    // Smoothly fade in discovered rooms
    for (const room of this.rooms) {
      if (room.isDiscovered && room.discoveredAlpha < 1.0) {
        room.discoveredAlpha = Math.min(1.0, room.discoveredAlpha + dt * 2.5);
      }
    }

    // Update room entrance banner notification timer
    if (this.activeBanner) {
      this.activeBanner.timer -= dt;
      if (this.activeBanner.timer <= 0) {
        this.activeBanner = null;
      }
    }

    // Update rotating exit portal pulse
    if (this.exitPortal && this.exitPortal.isActive) {
      this.exitPortal.pulseAngle = (this.exitPortal.pulseAngle || 0) + dt * 3.5;
    }
  }

  /**
   * Fast Circle-AABB collision resolution against dungeon walls and closed obstacles.
   * Returns adjusted { x, y, hitWall, normalX, normalY }.
   */
  resolveCircleCollision(circleX, circleY, radius) {
    let resolvedX = circleX;
    let resolvedY = circleY;
    let hitWall = false;
    let normX = 0;
    let normY = 0;

    // Convert circle position to grid indices
    const centerCol = Math.floor((resolvedX - this.originX) / this.tileSize);
    const centerRow = Math.floor((resolvedY - this.originY) / this.tileSize);

    // Check 3x3 neighboring tiles
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = centerCol + dc;
        const r = centerRow + dr;

        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) {
          continue;
        }

        const tile = this.grid[c][r];
        // WALL and VOID are solid collidable blocks
        if (tile === TILES.WALL || tile === TILES.VOID) {
          const tileMinX = this.originX + c * this.tileSize;
          const tileMinY = this.originY + r * this.tileSize;
          const tileMaxX = tileMinX + this.tileSize;
          const tileMaxY = tileMinY + this.tileSize;

          // Find closest point on tile AABB to circle center
          const closestX = Math.max(tileMinX, Math.min(resolvedX, tileMaxX));
          const closestY = Math.max(tileMinY, Math.min(resolvedY, tileMaxY));

          const diffX = resolvedX - closestX;
          const diffY = resolvedY - closestY;
          const distSq = diffX * diffX + diffY * diffY;

          if (distSq < radius * radius) {
            hitWall = true;
            const dist = Math.sqrt(distSq);
            let nx = 0;
            let ny = 0;

            if (dist > 0.001) {
              nx = diffX / dist;
              ny = diffY / dist;
            } else {
              // Directly inside edge, push out away from tile center
              const tileCenterX = tileMinX + this.tileSize / 2;
              const tileCenterY = tileMinY + this.tileSize / 2;
              const pushX = resolvedX - tileCenterX;
              const pushY = resolvedY - tileCenterY;
              const pushLen = Math.hypot(pushX, pushY) || 1;
              nx = pushX / pushLen;
              ny = pushY / pushLen;
            }

            const penetration = radius - dist;
            resolvedX += nx * penetration;
            resolvedY += ny * penetration;
            normX = nx;
            normY = ny;
          }
        }
      }
    }

    return { x: resolvedX, y: resolvedY, hitWall, normalX: normX, normalY: normY };
  }

  /**
   * High-speed Grid DDA (Digital Differential Analyzer) Raycaster for Levi's ODM Gear Cables.
   * Seamlessly detects collisions with room walls, corridor corners, and perimeter boundaries!
   */
  raycastWall(startX, startY, dirX, dirY, maxDist = 2400) {
    const len = Math.hypot(dirX, dirY);
    if (len < 0.001) return { hit: false, x: startX, y: startY };

    const uX = dirX / len;
    const uY = dirY / len;

    let posX = (startX - this.originX) / this.tileSize;
    let posY = (startY - this.originY) / this.tileSize;

    let mapX = Math.floor(posX);
    let mapY = Math.floor(posY);

    const stepX = uX >= 0 ? 1 : -1;
    const stepY = uY >= 0 ? 1 : -1;

    const deltaDistX = Math.abs(1 / (uX || 0.00001));
    const deltaDistY = Math.abs(1 / (uY || 0.00001));

    let sideDistX = uX >= 0 ? (mapX + 1.0 - posX) * deltaDistX : (posX - mapX) * deltaDistX;
    let sideDistY = uY >= 0 ? (mapY + 1.0 - posY) * deltaDistY : (posY - mapY) * deltaDistY;

    let hit = false;
    let side = 0; // 0 for vertical wall (X-axis), 1 for horizontal wall (Y-axis)
    let totalDist = 0;

    while (!hit && totalDist < maxDist) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }

      if (mapX < 0 || mapX >= this.cols || mapY < 0 || mapY >= this.rows) {
        // Exceeded grid boundary
        hit = true;
        break;
      }

      const tile = this.grid[mapX][mapY];
      if (tile === TILES.WALL || tile === TILES.VOID) {
        hit = true;
        break;
      }

      totalDist = (side === 0)
        ? (mapX - posX + (1 - stepX) / 2) / (uX || 0.00001) * this.tileSize
        : (mapY - posY + (1 - stepY) / 2) / (uY || 0.00001) * this.tileSize;
    }

    if (hit) {
      let wallDist;
      if (side === 0) {
        wallDist = (mapX - posX + (1 - stepX) / 2) / (uX || 0.00001) * this.tileSize;
      } else {
        wallDist = (mapY - posY + (1 - stepY) / 2) / (uY || 0.00001) * this.tileSize;
      }

      const hitX = startX + uX * Math.max(0, wallDist);
      const hitY = startY + uY * Math.max(0, wallDist);
      const normalX = (side === 0) ? -stepX : 0;
      const normalY = (side === 1) ? -stepY : 0;

      return { hit: true, x: hitX, y: hitY, normalX, normalY, dist: wallDist };
    }

    return { hit: false, x: startX + uX * maxDist, y: startY + uY * maxDist, dist: maxDist };
  }

  /**
   * Compact serialization object to transmit dungeon layout to joining peers over WebRTC
   */
  getSyncData() {
    return {
      cols: this.cols,
      rows: this.rows,
      tileSize: this.tileSize,
      floorNumber: this.floorNumber,
      themeKey: this.themeKey,
      rooms: this.rooms.map(r => ({
        id: r.id,
        col: r.col,
        row: r.row,
        width: r.width,
        height: r.height,
        type: r.type,
        name: r.name,
        isDiscovered: r.isDiscovered
      })),
      containers: this.containers.map(c => ({
        id: c.id,
        x: c.x,
        y: c.y,
        isBroken: c.isBroken
      })),
      exitPortal: this.exitPortal
    };
  }

  /**
   * Applies received network sync data to instantiate the identical dungeon on guest peers
   */
  applySyncData(data) {
    this.cols = data.cols;
    this.rows = data.rows;
    this.tileSize = data.tileSize;
    this.floorNumber = data.floorNumber;
    this.themeKey = data.themeKey;
    this.theme = DUNGEON_THEMES[this.themeKey] || DUNGEON_THEMES.jjk;

    this.originX = -Math.floor((this.cols * this.tileSize) / 2);
    this.originY = -Math.floor((this.rows * this.tileSize) / 2);
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    this.minX = this.originX;
    this.minY = this.originY;
    this.maxX = this.originX + this.width;
    this.maxY = this.originY + this.height;

    // Reconstruct grid & rooms
    this.corridorTiles = new Set();
    this.torches = [];
    this.grid = Array.from({ length: this.cols }, () => new Uint8Array(this.rows));
    this.rooms = data.rooms.map(r => {
      const room = {
        ...r,
        centerX: this.originX + (r.col + r.width / 2) * this.tileSize,
        centerY: this.originY + (r.row + r.height / 2) * this.tileSize,
        bounds: {
          minX: this.originX + r.col * this.tileSize,
          minY: this.originY + r.row * this.tileSize,
          maxX: this.originX + (r.col + r.width) * this.tileSize,
          maxY: this.originY + (r.row + r.height) * this.tileSize
        },
        isDiscovered: true,
        discoveredAlpha: 1.0,
        hasShownBanner: r.hasShownBanner ?? true,
        torches: []
      };

      for (let c = r.col; c < r.col + r.width; c++) {
        for (let row = r.row; row < r.row + r.height; row++) {
          this.grid[c][row] = TILES.FLOOR;
        }
      }
      return room;
    });

    this.spawnRoom = this.rooms.find(r => r.type === 'spawn') || this.rooms[0];
    this.bossRoom = this.rooms.find(r => r.type === 'boss') || this.rooms[this.rooms.length - 1];
    this.treasureRoom = this.rooms.find(r => r.type === 'treasure');
    this.combatRooms = this.rooms.filter(r => r.type === 'combat');

    // Reconstruct walls around floor tiles
    for (let c = 1; c < this.cols - 1; c++) {
      for (let r = 1; r < this.rows - 1; r++) {
        if (this.grid[c][r] === TILES.VOID) {
          let hasFloor = false;
          for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
              if (dc === 0 && dr === 0) continue;
              if (this.grid[c + dc][r + dr] === TILES.FLOOR) {
                hasFloor = true;
                break;
              }
            }
            if (hasFloor) break;
          }
          if (hasFloor) this.grid[c][r] = TILES.WALL;
        }
      }
    }

    this.containers = data.containers.map(c => ({
      ...c,
      radius: 18,
      hp: c.isBroken ? 0 : 1,
      theme: this.themeKey
    }));

    this.exitPortal = data.exitPortal;
  }
}
