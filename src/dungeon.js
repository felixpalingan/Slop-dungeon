/**
 * Procedural The Binding of Isaac (TBoI) Style Dungeon Generator for Dungeon Slop
 * Implements discrete room-graph generation, cardinal door transitions,
 * combat room lockdown collision, and Isaac-style chamber mechanics.
 */

export const TILES = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  CONTAINER: 4,
  EXIT_PORTAL: 5
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
    name: 'Attack on Titan: Wall Maria Crypts & Shiganshina Outskirts',
    shortName: 'WALL MARIA CRYPTS',
    floorColor: '#1c1917',
    floorAltColor: '#24201d',
    floorGridColor: 'rgba(34, 197, 94, 0.14)',
    wallColor: '#292524',
    wallTopColor: '#44403c',
    wallBevelColor: '#166534',
    wallStrokeColor: '#1c1917',
    torchColor: '#f59e0b',
    torchGlowColor: 'rgba(245, 158, 11, 0.38)',
    accentColor: '#22c55e',
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

// Standard chamber dimensions (16:9 widescreen ratio)
export const ROOM_COLS = 27; // 27 tiles wide = 1728px
export const ROOM_ROWS = 17; // 17 tiles high = 1088px
export const TILE_SIZE = 64;
export const ROOM_WIDTH = ROOM_COLS * TILE_SIZE; // 1728px
export const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 1088px

// Asymmetric 2.5D top-down perspective wall thicknesses
// Top (North) wall is tall/wide showing vertical front face, other walls are thin curbs
export const NORTH_WALL = 72; // Wide front face with bevel and mortar lines
export const SIDE_WALL = 28;  // Thin curb on West, East, and South borders

// Physical world stride between adjacent room centers
export const STRIDE_X = 2400;
export const STRIDE_Y = 1800;

export class Dungeon {
  constructor(options = {}) {
    this.floorNumber = options.floorNumber || 1;
    this.themeKey = options.theme || 'jjk';
    this.theme = DUNGEON_THEMES[this.themeKey] || DUNGEON_THEMES.jjk;
    this.tileSize = TILE_SIZE;

    this.rooms = [];
    this.roomsMap = new Map(); // "gx,gy" -> Room
    this.currentRoom = null;
    this.spawnRoom = null;
    this.bossRoom = null;
    this.treasureRoom = null;
    this.merchantRoom = null;
    this.combatRooms = [];

    this.torches = [];
    this.containers = [];
    this.exitPortal = null;

    // Room entrance banner notification
    this.activeBanner = null; // { title, subtitle, color, timer, maxTimer }
  }

  createRoom(id, gx, gy, type = 'combat') {
    const centerX = gx * STRIDE_X;
    const centerY = gy * STRIDE_Y;
    const halfW = ROOM_WIDTH / 2;
    const halfH = ROOM_HEIGHT / 2;

    return {
      id,
      gridX: gx,
      gridY: gy,
      type,
      name: `CHAMBER ${id}`,
      colCount: ROOM_COLS,
      rowCount: ROOM_ROWS,
      width: ROOM_WIDTH,
      height: ROOM_HEIGHT,
      centerX,
      centerY,
      bounds: {
        minX: centerX - halfW,
        maxX: centerX + halfW,
        minY: centerY - halfH,
        maxY: centerY + halfH
      },
      doors: [],
      isCleared: type === 'spawn' || type === 'treasure' || type === 'merchant',
      isLocked: false,
      hasVisited: type === 'spawn',
      hasShownBanner: false,
      torches: [],
      containers: []
    };
  }

  connectRooms(roomA, roomB, dirFromA, dirFromB) {
    const makeDoor = (room, targetRoom, dir) => {
      let x = room.centerX - 64;
      let y = room.centerY - 64;
      let w = 128;
      let h = 128;
      let centerX = room.centerX;
      let centerY = room.centerY;
      let targetSpawnX = targetRoom.centerX;
      let targetSpawnY = targetRoom.centerY;

      if (dir === 'north') {
        // North door sits flush inside the tall North wall (between minY and minY + NORTH_WALL)
        x = room.centerX - 64;
        y = room.bounds.minY;
        w = 128;
        h = NORTH_WALL; // 72px
        centerX = room.centerX;
        centerY = room.bounds.minY + NORTH_WALL / 2;
        // Spawns near South wall of target room
        targetSpawnX = targetRoom.centerX;
        targetSpawnY = targetRoom.bounds.maxY - SIDE_WALL - 55;
      } else if (dir === 'south') {
        // South door sits flush inside the thin South curb (between maxY - SIDE_WALL and maxY)
        x = room.centerX - 64;
        y = room.bounds.maxY - SIDE_WALL;
        w = 128;
        h = SIDE_WALL; // 28px
        centerX = room.centerX;
        centerY = room.bounds.maxY - SIDE_WALL / 2;
        // Spawns safely below the North wall of target room
        targetSpawnX = targetRoom.centerX;
        targetSpawnY = targetRoom.bounds.minY + NORTH_WALL + 65;
      } else if (dir === 'west') {
        // West door sits flush inside thin West curb (between minX and minX + SIDE_WALL)
        x = room.bounds.minX;
        y = room.centerY - 64;
        w = SIDE_WALL; // 28px
        h = 128;
        centerX = room.bounds.minX + SIDE_WALL / 2;
        centerY = room.centerY;
        // Spawns safely to the left of target room's East wall
        targetSpawnX = targetRoom.bounds.maxX - SIDE_WALL - 55;
        targetSpawnY = targetRoom.centerY;
      } else if (dir === 'east') {
        // East door sits flush inside thin East curb (between maxX - SIDE_WALL and maxX)
        x = room.bounds.maxX - SIDE_WALL;
        y = room.centerY - 64;
        w = SIDE_WALL; // 28px
        h = 128;
        centerX = room.bounds.maxX - SIDE_WALL / 2;
        centerY = room.centerY;
        // Spawns safely to the right of target room's West wall
        targetSpawnX = targetRoom.bounds.minX + SIDE_WALL + 55;
        targetSpawnY = targetRoom.centerY;
      }

      return {
        dir,
        targetRoomId: targetRoom.id,
        x,
        y,
        centerX,
        centerY,
        width: w,
        height: h,
        targetSpawnX,
        targetSpawnY,
        isBoss: targetRoom.type === 'boss',
        isTreasure: targetRoom.type === 'treasure',
        isMerchant: targetRoom.type === 'merchant'
      };
    };

    const doorA = makeDoor(roomA, roomB, dirFromA);
    const doorB = makeDoor(roomB, roomA, dirFromB);

    roomA.doors.push(doorA);
    roomB.doors.push(doorB);
  }

  /**
   * Generates procedural random-grid dungeon layout in The Binding of Isaac format
   * Dynamically constructs 7 to 9 branching rooms with GUARANTEED Battle, Treasure, Merchant, and Boss rooms!
   */
  generate(seed = null) {
    this.rooms = [];
    this.roomsMap.clear();
    this.torches = [];
    this.containers = [];

    // Target chamber count: 7 to 9 rooms for a balanced, exciting roguelike floor
    const targetRoomCount = 7 + Math.floor(Math.random() * 3); // 7, 8, or 9 chambers

    // Cardinal directions on grid
    const CARDINAL_DIRS = [
      { dx: 0, dy: -1, dir: 'north', opp: 'south' },
      { dx: 0, dy: 1, dir: 'south', opp: 'north' },
      { dx: -1, dy: 0, dir: 'west', opp: 'east' },
      { dx: 1, dy: 0, dir: 'east', opp: 'west' }
    ];

    // Helper to shuffle array
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 1. Create Central Spawn Room at (0, 0)
    const spawnRoom = this.createRoom(1, 0, 0, 'spawn');
    this.rooms.push(spawnRoom);
    this.roomsMap.set('0,0', spawnRoom);
    this.spawnRoom = spawnRoom;
    this.currentRoom = spawnRoom;

    let roomIdCounter = 2;
    let attempts = 0;
    const maxAttempts = 350;

    // 2. Randomized Grid Expansion (The Binding of Isaac style random walk / branching)
    while (this.rooms.length < targetRoomCount && attempts < maxAttempts) {
      attempts++;
      // Pick a random existing room to branch from
      const parentRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      const shuffledDirs = shuffle([...CARDINAL_DIRS]);

      for (const d of shuffledDirs) {
        const nGx = parentRoom.gridX + d.dx;
        const nGy = parentRoom.gridY + d.dy;
        const key = `${nGx},${nGy}`;

        // Limit grid radius to ±3 so layout stays coherent and fits comfortably on minimap
        if (Math.abs(nGx) > 3 || Math.abs(nGy) > 3) continue;

        if (this.roomsMap.has(key)) {
          // Already occupied room: occasional loopback (15% chance) if not already connected
          const neighbor = this.roomsMap.get(key);
          const alreadyConnected = parentRoom.doors.some(dr => dr.targetRoomId === neighbor.id);
          if (!alreadyConnected && Math.random() < 0.15) {
            this.connectRooms(parentRoom, neighbor, d.dir, d.opp);
          }
        } else {
          // Check how many neighbors are already around this candidate cell
          let neighborCount = 0;
          for (const checkDir of CARDINAL_DIRS) {
            if (this.roomsMap.has(`${nGx + checkDir.dx},${nGy + checkDir.dy}`)) {
              neighborCount++;
            }
          }

          // If more than 1 neighbor, 50% chance to skip to promote branching paths instead of 2x2 blocks
          if (neighborCount > 1 && Math.random() < 0.5) continue;

          // Create new room at (nGx, nGy)
          const newRoom = this.createRoom(roomIdCounter++, nGx, nGy, 'combat');
          this.rooms.push(newRoom);
          this.roomsMap.set(key, newRoom);
          this.connectRooms(parentRoom, newRoom, d.dir, d.opp);
          break; // Move to next expansion step
        }
      }
    }

    // 3. BFS Distance Calculation from Spawn (0, 0)
    const distances = new Map();
    distances.set(spawnRoom.id, 0);
    const queue = [spawnRoom];

    while (queue.length > 0) {
      const curr = queue.shift();
      const currDist = distances.get(curr.id);

      for (const door of curr.doors) {
        if (!distances.has(door.targetRoomId)) {
          distances.set(door.targetRoomId, currDist + 1);
          const neighbor = this.rooms.find(r => r.id === door.targetRoomId);
          if (neighbor) queue.push(neighbor);
        }
      }
    }

    // Sort non-spawn rooms by distance descending
    const nonSpawnRooms = this.rooms.filter(r => r.id !== spawnRoom.id);

    // Identify dead-end rooms (doors.length === 1)
    const deadEnds = nonSpawnRooms.filter(r => r.doors.length === 1);

    // 4. Assign Boss Sanctum (Guaranteed 1)
    // Priority: Furthest dead-end room, or simply furthest room
    let bossCandidate = null;
    if (deadEnds.length > 0) {
      deadEnds.sort((a, b) => (distances.get(b.id) || 0) - (distances.get(a.id) || 0));
      bossCandidate = deadEnds[0];
    } else {
      nonSpawnRooms.sort((a, b) => (distances.get(b.id) || 0) - (distances.get(a.id) || 0));
      bossCandidate = nonSpawnRooms[0];
    }
    bossCandidate.type = 'boss';
    this.bossRoom = bossCandidate;

    // Remaining available non-spawn rooms
    let available = nonSpawnRooms.filter(r => r.id !== this.bossRoom.id);

    // 5. Assign Treasure Vault (Guaranteed 1)
    // Prefer another dead-end or high distance room
    const remainingDeadEnds = available.filter(r => r.doors.length === 1);
    let treasureCandidate = null;
    if (remainingDeadEnds.length > 0) {
      treasureCandidate = remainingDeadEnds[0];
    } else {
      available.sort((a, b) => (distances.get(b.id) || 0) - (distances.get(a.id) || 0));
      treasureCandidate = available[0];
    }
    treasureCandidate.type = 'treasure';
    this.treasureRoom = treasureCandidate;
    available = available.filter(r => r.id !== this.treasureRoom.id);

    // 6. Assign Slop Merchant (Guaranteed 1)
    // Prefer mid-distance branch room (distance >= 1)
    let merchantCandidate = null;
    const midDistanceRooms = available.filter(r => (distances.get(r.id) || 0) >= 1);
    if (midDistanceRooms.length > 0) {
      // Pick random mid-distance room
      merchantCandidate = midDistanceRooms[Math.floor(Math.random() * midDistanceRooms.length)];
    } else {
      merchantCandidate = available[0];
    }
    merchantCandidate.type = 'merchant';
    this.merchantRoom = merchantCandidate;
    available = available.filter(r => r.id !== this.merchantRoom.id);

    // 7. All remaining rooms are Combat Battlegrounds (Guaranteed at least 1)
    for (const r of available) {
      r.type = 'combat';
    }
    this.combatRooms = this.rooms.filter(r => r.type === 'combat');

    // 8. Assign Chamber Names and Clearance Flags
    spawnRoom.name = `${this.theme.bannerPrefix} ENTRANCE`;
    spawnRoom.isCleared = true;
    spawnRoom.hasVisited = true;
    spawnRoom.hasShownBanner = true;

    this.bossRoom.name = `${this.theme.bannerPrefix} BOSS SANCTUM`;
    this.bossRoom.isCleared = false;

    this.treasureRoom.name = `${this.theme.bannerPrefix} TREASURE VAULT`;
    this.treasureRoom.isCleared = true;

    this.merchantRoom.name = `${this.theme.bannerPrefix} SLOP EMPORIUM`;
    this.merchantRoom.isCleared = true;

    const combatTitles = [
      'WEST WARD',
      'EAST BATTLEGROUND',
      'SOUTH ARENA',
      'NORTH CRYPT',
      'INNER SANCTUM',
      'CENTRAL QUAD',
      'FORGOTTEN AISLE'
    ];
    this.combatRooms.forEach((cr, idx) => {
      cr.name = `${this.theme.bannerPrefix} ${combatTitles[idx % combatTitles.length]}`;
      cr.isCleared = false;
    });

    // 9. Update door special flags (isBoss, isTreasure, isMerchant)
    for (const r of this.rooms) {
      for (const d of r.doors) {
        const target = this.rooms.find(x => x.id === d.targetRoomId);
        if (target) {
          d.isBoss = target.type === 'boss';
          d.isTreasure = target.type === 'treasure';
          d.isMerchant = target.type === 'merchant';
        }
      }
    }

    // 10. Setup Exit Descent Portal in Boss Sanctum
    this.exitPortal = {
      x: this.bossRoom.centerX,
      y: this.bossRoom.centerY,
      radius: 56,
      isActive: false,
      pulseAngle: 0,
      countdown: 3.0,
      isCountingDown: false,
      allReady: false
    };

    // 11. Place fixtures (Torches & Destructible Pots)
    this.populateFixtures();

    return this;
  }

  /**
   * Places torches in chamber corners and destructible pots along walls
   */
  populateFixtures() {
    this.torches = [];
    this.containers = [];
    let containerId = 1;

    for (const room of this.rooms) {
      // Place torches in the 4 corners of each room (respecting North wall top-down thickness)
      const cornerOffsets = [
        { ox: -room.width / 2 + 54, oy: -room.height / 2 + NORTH_WALL + 40 },
        { ox: room.width / 2 - 54, oy: -room.height / 2 + NORTH_WALL + 40 },
        { ox: -room.width / 2 + 54, oy: room.height / 2 - SIDE_WALL - 40 },
        { ox: room.width / 2 - 54, oy: room.height / 2 - SIDE_WALL - 40 }
      ];

      for (const c of cornerOffsets) {
        const torchColor = room.type === 'boss'
          ? '#ef4444'
          : (room.type === 'treasure' ? '#f59e0b' : (room.type === 'merchant' ? '#10b981' : this.theme.torchColor));
        const torchGlow = room.type === 'boss'
          ? 'rgba(239, 68, 68, 0.4)'
          : (room.type === 'treasure' ? 'rgba(245, 158, 11, 0.4)' : (room.type === 'merchant' ? 'rgba(16, 185, 129, 0.4)' : this.theme.torchGlowColor));

        const t = {
          x: room.centerX + c.ox,
          y: room.centerY + c.oy,
          color: torchColor,
          glow: torchGlow,
          flicker: Math.random() * Math.PI * 2
        };
        this.torches.push(t);
        room.torches.push(t);
      }
    }
  }

  /**
   * Checks if player touches an open door threshold of currentRoom
   * Returns { targetRoom, newX, newY, door } if transition occurs, else null
   */
  checkDoorTransition(playerX, playerY, radius = 22) {
    if (!this.currentRoom || this.currentRoom.isLocked) return null;

    const innerMinX = this.currentRoom.bounds.minX + SIDE_WALL;
    const innerMaxX = this.currentRoom.bounds.maxX - SIDE_WALL;
    const innerMinY = this.currentRoom.bounds.minY + NORTH_WALL;
    const innerMaxY = this.currentRoom.bounds.maxY - SIDE_WALL;

    for (const door of this.currentRoom.doors) {
      let triggered = false;

      if (door.dir === 'north') {
        triggered = playerY <= innerMinY + 14 && Math.abs(playerX - this.currentRoom.centerX) <= 54;
      } else if (door.dir === 'south') {
        triggered = playerY >= innerMaxY - 14 && Math.abs(playerX - this.currentRoom.centerX) <= 54;
      } else if (door.dir === 'west') {
        triggered = playerX <= innerMinX + 14 && Math.abs(playerY - this.currentRoom.centerY) <= 54;
      } else if (door.dir === 'east') {
        triggered = playerX >= innerMaxX - 14 && Math.abs(playerY - this.currentRoom.centerY) <= 54;
      }

      if (triggered) {
        const targetRoom = this.rooms.find(r => r.id === door.targetRoomId);
        if (targetRoom) {
          return {
            targetRoom,
            newX: door.targetSpawnX,
            newY: door.targetSpawnY,
            door
          };
        }
      }
    }

    return null;
  }

  /**
   * Enforces chamber wall collision and door locks
   * While currentRoom is locked (active combat), doors are impassable solid walls!
   */
  resolveCircleCollision(circleX, circleY, radius = 22, explicitRoom = null, isMonster = false) {
    const room = explicitRoom || this.currentRoom || this.spawnRoom;
    if (!room) return { x: circleX, y: circleY, hitWall: false, normalX: 0, normalY: 0 };

    let resolvedX = circleX;
    let resolvedY = circleY;
    let hitWall = false;
    let normX = 0;
    let normY = 0;

    // Asymmetric 2.5D perspective chamber wall thickness
    const innerMinX = room.bounds.minX + SIDE_WALL;
    const innerMaxX = room.bounds.maxX - SIDE_WALL;
    const innerMinY = room.bounds.minY + NORTH_WALL;
    const innerMaxY = room.bounds.maxY - SIDE_WALL;

    const hasNorthDoor = room.doors.some(d => d.dir === 'north');
    const hasSouthDoor = room.doors.some(d => d.dir === 'south');
    const hasWestDoor = room.doors.some(d => d.dir === 'west');
    const hasEastDoor = room.doors.some(d => d.dir === 'east');

    const doorHalfWidth = 54; // Door opening half-width

    // 1. West Wall (Thin 28px curb)
    if (resolvedX - radius < innerMinX) {
      const isAtDoorway = hasWestDoor && Math.abs(resolvedY - room.centerY) <= doorHalfWidth;
      if (room.isLocked || isMonster || !isAtDoorway) {
        resolvedX = innerMinX + radius;
        hitWall = true;
        normX = 1;
      } else {
        if (resolvedX - radius < room.bounds.minX) {
          resolvedX = room.bounds.minX + radius;
          hitWall = true;
          normX = 1;
        }
        if (resolvedY - radius < room.centerY - doorHalfWidth) {
          resolvedY = room.centerY - doorHalfWidth + radius;
        } else if (resolvedY + radius > room.centerY + doorHalfWidth) {
          resolvedY = room.centerY + doorHalfWidth - radius;
        }
      }
    }

    // 2. East Wall (Thin 28px curb)
    if (resolvedX + radius > innerMaxX) {
      const isAtDoorway = hasEastDoor && Math.abs(resolvedY - room.centerY) <= doorHalfWidth;
      if (room.isLocked || isMonster || !isAtDoorway) {
        resolvedX = innerMaxX - radius;
        hitWall = true;
        normX = -1;
      } else {
        if (resolvedX + radius > room.bounds.maxX) {
          resolvedX = room.bounds.maxX - radius;
          hitWall = true;
          normX = -1;
        }
        if (resolvedY - radius < room.centerY - doorHalfWidth) {
          resolvedY = room.centerY - doorHalfWidth + radius;
        } else if (resolvedY + radius > room.centerY + doorHalfWidth) {
          resolvedY = room.centerY + doorHalfWidth - radius;
        }
      }
    }

    // 3. North Wall (Wide/Tall 72px front-facing wall)
    if (resolvedY - radius < innerMinY) {
      const isAtDoorway = hasNorthDoor && Math.abs(resolvedX - room.centerX) <= doorHalfWidth;
      if (room.isLocked || isMonster || !isAtDoorway) {
        resolvedY = innerMinY + radius;
        hitWall = true;
        normY = 1;
      } else {
        if (resolvedY - radius < room.bounds.minY) {
          resolvedY = room.bounds.minY + radius;
          hitWall = true;
          normY = 1;
        }
        if (resolvedX - radius < room.centerX - doorHalfWidth) {
          resolvedX = room.centerX - doorHalfWidth + radius;
        } else if (resolvedX + radius > room.centerX + doorHalfWidth) {
          resolvedX = room.centerX + doorHalfWidth - radius;
        }
      }
    }

    // 4. South Wall (Thin 28px curb)
    if (resolvedY + radius > innerMaxY) {
      const isAtDoorway = hasSouthDoor && Math.abs(resolvedX - room.centerX) <= doorHalfWidth;
      if (room.isLocked || isMonster || !isAtDoorway) {
        resolvedY = innerMaxY - radius;
        hitWall = true;
        normY = -1;
      } else {
        if (resolvedY + radius > room.bounds.maxY) {
          resolvedY = room.bounds.maxY - radius;
          hitWall = true;
          normY = -1;
        }
        if (resolvedX - radius < room.centerX - doorHalfWidth) {
          resolvedX = room.centerX - doorHalfWidth + radius;
        } else if (resolvedX + radius > room.centerX + doorHalfWidth) {
          resolvedX = room.centerX + doorHalfWidth - radius;
        }
      }
    }

    return { x: resolvedX, y: resolvedY, hitWall, normalX: normX, normalY: normY };
  }

  /**
   * Levi's ODM wire grapple raycast against chamber walls
   */
  raycastWall(startX, startY, dirX, dirY, maxDist = 2400) {
    const room = this.currentRoom || this.spawnRoom;
    if (!room) return { hit: false, x: startX, y: startY };

    const len = Math.hypot(dirX, dirY);
    if (len < 0.001) return { hit: false, x: startX, y: startY };
    const uX = dirX / len;
    const uY = dirY / len;

    const minX = room.bounds.minX + SIDE_WALL;
    const maxX = room.bounds.maxX - SIDE_WALL;
    const minY = room.bounds.minY + NORTH_WALL;
    const maxY = room.bounds.maxY - SIDE_WALL;

    let closestDist = maxDist;
    let hitX = startX;
    let hitY = startY;
    let normalX = 0;
    let normalY = 0;
    let hit = false;

    // West wall (x = minX)
    if (uX < 0) {
      const t = (minX - startX) / uX;
      if (t > 0 && t < closestDist) {
        const y = startY + uY * t;
        if (y >= minY && y <= maxY) {
          closestDist = t;
          hitX = minX;
          hitY = y;
          normalX = 1;
          normalY = 0;
          hit = true;
        }
      }
    }
    // East wall (x = maxX)
    if (uX > 0) {
      const t = (maxX - startX) / uX;
      if (t > 0 && t < closestDist) {
        const y = startY + uY * t;
        if (y >= minY && y <= maxY) {
          closestDist = t;
          hitX = maxX;
          hitY = y;
          normalX = -1;
          normalY = 0;
          hit = true;
        }
      }
    }
    // North wall (y = minY)
    if (uY < 0) {
      const t = (minY - startY) / uY;
      if (t > 0 && t < closestDist) {
        const x = startX + uX * t;
        if (x >= minX && x <= maxX) {
          closestDist = t;
          hitX = x;
          hitY = minY;
          normalX = 0;
          normalY = 1;
          hit = true;
        }
      }
    }
    // South wall (y = maxY)
    if (uY > 0) {
      const t = (maxY - startY) / uY;
      if (t > 0 && t < closestDist) {
        const x = startX + uX * t;
        if (x >= minX && x <= maxX) {
          closestDist = t;
          hitX = x;
          hitY = maxY;
          normalX = 0;
          normalY = -1;
          hit = true;
        }
      }
    }

    return { hit, x: hitX, y: hitY, normalX, normalY, dist: closestDist };
  }

  showRoomBanner(room) {
    if (!room || room.hasShownBanner) return;
    room.hasShownBanner = true;
    this.activeBanner = {
      title: room.name,
      subtitle: this.theme.shortName,
      color: room.type === 'boss' ? '#ef4444' : (room.type === 'treasure' ? '#f59e0b' : (room.type === 'merchant' ? '#fbbf24' : this.theme.torchColor)),
      timer: 3.2,
      maxTimer: 3.2
    };
  }

  update(dt) {
    // Update banner timer
    if (this.activeBanner) {
      this.activeBanner.timer -= dt;
      if (this.activeBanner.timer <= 0) {
        this.activeBanner = null;
      }
    }

    // Update portal rotation
    if (this.exitPortal) {
      this.exitPortal.pulseAngle = (this.exitPortal.pulseAngle || 0) + dt * 2.0;
    }
  }

  getSyncData() {
    return {
      floorNumber: this.floorNumber,
      themeKey: this.themeKey,
      currentRoomId: this.currentRoom ? this.currentRoom.id : 1,
      rooms: this.rooms.map(r => ({
        id: r.id,
        gridX: r.gridX,
        gridY: r.gridY,
        type: r.type,
        name: r.name,
        isCleared: r.isCleared,
        isLocked: r.isLocked,
        hasVisited: r.hasVisited,
        doors: r.doors
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

  applySyncData(data) {
    this.floorNumber = data.floorNumber;
    this.themeKey = data.themeKey;
    this.theme = DUNGEON_THEMES[this.themeKey] || DUNGEON_THEMES.jjk;
    this.rooms = [];
    this.roomsMap.clear();

    for (const r of data.rooms) {
      const room = this.createRoom(r.id, r.gridX, r.gridY, r.type);
      room.name = r.name;
      room.isCleared = r.isCleared;
      room.isLocked = r.isLocked;
      room.hasVisited = r.hasVisited;
      room.doors = r.doors;
      this.rooms.push(room);
      this.roomsMap.set(`${r.gridX},${r.gridY}`, room);
    }

    this.spawnRoom = this.rooms.find(r => r.type === 'spawn') || this.rooms[0];
    this.bossRoom = this.rooms.find(r => r.type === 'boss') || this.rooms[this.rooms.length - 1];
    this.treasureRoom = this.rooms.find(r => r.type === 'treasure');
    this.merchantRoom = this.rooms.find(r => r.type === 'merchant');
    this.combatRooms = this.rooms.filter(r => r.type === 'combat');
    this.currentRoom = this.rooms.find(r => r.id === data.currentRoomId) || this.spawnRoom;

    this.populateFixtures();

    // Restore container broken state
    if (data.containers) {
      for (const sc of data.containers) {
        const local = this.containers.find(c => c.id === sc.id);
        if (local) local.isBroken = sc.isBroken;
      }
    }

    this.exitPortal = data.exitPortal;
  }
}
