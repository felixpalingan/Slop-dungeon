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

// Standard chamber dimensions (16:9 widescreen ratio)
export const ROOM_COLS = 17; // 17 tiles wide = 1088px
export const ROOM_ROWS = 11; // 11 tiles high = 704px
export const TILE_SIZE = 64;
export const ROOM_WIDTH = ROOM_COLS * TILE_SIZE; // 1088px
export const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 704px

// Physical world stride between adjacent room centers
export const STRIDE_X = 1600;
export const STRIDE_Y = 1200;

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
      isCleared: type === 'spawn' || type === 'treasure',
      isLocked: false,
      hasVisited: type === 'spawn',
      hasShownBanner: false,
      torches: [],
      containers: []
    };
  }

  connectRooms(roomA, roomB, dirFromA, dirFromB) {
    const makeDoor = (room, targetRoom, dir) => {
      let x = room.centerX;
      let y = room.centerY;
      let w = 128;
      let h = 64;
      let targetSpawnX = targetRoom.centerX;
      let targetSpawnY = targetRoom.centerY;

      if (dir === 'north') {
        y = room.bounds.minY;
        w = 128;
        h = 64;
        targetSpawnX = targetRoom.centerX;
        targetSpawnY = targetRoom.bounds.maxY - 110;
      } else if (dir === 'south') {
        y = room.bounds.maxY;
        w = 128;
        h = 64;
        targetSpawnX = targetRoom.centerX;
        targetSpawnY = targetRoom.bounds.minY + 110;
      } else if (dir === 'west') {
        x = room.bounds.minX;
        w = 64;
        h = 128;
        targetSpawnX = targetRoom.bounds.maxX - 110;
        targetSpawnY = targetRoom.centerY;
      } else if (dir === 'east') {
        x = room.bounds.maxX;
        w = 64;
        h = 128;
        targetSpawnX = targetRoom.bounds.minX + 110;
        targetSpawnY = targetRoom.centerY;
      }

      return {
        dir,
        targetRoomId: targetRoom.id,
        x,
        y,
        width: w,
        height: h,
        targetSpawnX,
        targetSpawnY,
        isBoss: targetRoom.type === 'boss',
        isTreasure: targetRoom.type === 'treasure'
      };
    };

    const doorA = makeDoor(roomA, roomB, dirFromA);
    const doorB = makeDoor(roomB, roomA, dirFromB);

    roomA.doors.push(doorA);
    roomB.doors.push(doorB);
  }

  /**
   * Generates discrete room-graph grid in The Binding of Isaac format
   */
  generate(seed = null) {
    this.rooms = [];
    this.roomsMap.clear();
    this.torches = [];
    this.containers = [];

    // 1. Create Spawn Room at (0, 0)
    const spawnRoom = this.createRoom(1, 0, 0, 'spawn');
    spawnRoom.name = `${this.theme.bannerPrefix} ENTRANCE`;
    spawnRoom.isCleared = true;
    spawnRoom.hasVisited = true;
    spawnRoom.hasShownBanner = true;

    this.rooms.push(spawnRoom);
    this.roomsMap.set('0,0', spawnRoom);
    this.spawnRoom = spawnRoom;
    this.currentRoom = spawnRoom;

    // 2. Expand outwards to generate 7 to 9 rooms
    const totalRooms = Math.min(10, 7 + Math.floor(this.floorNumber * 0.5));
    let nextId = 2;

    while (this.rooms.length < totalRooms) {
      // Pick random room that has fewer than 3 doors
      const candidates = this.rooms.filter(r => r.doors.length < 3);
      if (candidates.length === 0) break;
      const current = candidates[Math.floor(Math.random() * candidates.length)];

      const dirs = [
        { name: 'north', opp: 'south', dx: 0, dy: -1 },
        { name: 'south', opp: 'north', dx: 0, dy: 1 },
        { name: 'east', opp: 'west', dx: 1, dy: 0 },
        { name: 'west', opp: 'east', dx: -1, dy: 0 }
      ].sort(() => Math.random() - 0.5);

      let added = false;
      for (const d of dirs) {
        const nx = current.gridX + d.dx;
        const ny = current.gridY + d.dy;
        const key = `${nx},${ny}`;

        if (!this.roomsMap.has(key)) {
          // Check how many adjacent neighbors this cell has (enforce branching, avoid large loops)
          let neighborCount = 0;
          for (const c of [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }]) {
            if (this.roomsMap.has(`${nx + c.dx},${ny + c.dy}`)) neighborCount++;
          }

          if (neighborCount === 1) {
            const newRoom = this.createRoom(nextId++, nx, ny, 'combat');
            this.connectRooms(current, newRoom, d.name, d.opp);
            this.rooms.push(newRoom);
            this.roomsMap.set(key, newRoom);
            added = true;
            break;
          }
        }
      }

      if (!added && candidates.length === 1 && this.rooms.length >= 6) {
        break;
      }
    }

    // 3. Compute BFS distances from Spawn to assign Boss & Treasure rooms
    const distances = new Map();
    distances.set(spawnRoom.id, 0);
    const queue = [spawnRoom];

    while (queue.length > 0) {
      const r = queue.shift();
      const d = distances.get(r.id);
      for (const door of r.doors) {
        if (!distances.has(door.targetRoomId)) {
          distances.set(door.targetRoomId, d + 1);
          const neighbor = this.rooms.find(x => x.id === door.targetRoomId);
          if (neighbor) queue.push(neighbor);
        }
      }
    }

    // Sort non-spawn rooms by: 1) degree === 1 (dead ends), 2) distance from spawn
    const nonSpawn = this.rooms.filter(r => r !== spawnRoom);
    nonSpawn.sort((a, b) => {
      const aDead = a.doors.length === 1 ? 1 : 0;
      const bDead = b.doors.length === 1 ? 1 : 0;
      if (aDead !== bDead) return bDead - aDead;
      return (distances.get(b.id) || 0) - (distances.get(a.id) || 0);
    });

    // 4. Assign Boss Sanctum (deepest dead end)
    const bossRoom = nonSpawn[0];
    bossRoom.type = 'boss';
    bossRoom.name = `${this.theme.bannerPrefix} BOSS SANCTUM`;
    this.bossRoom = bossRoom;

    // 5. Assign Treasure Vault (second deepest dead end)
    if (nonSpawn.length > 1) {
      const treasureRoom = nonSpawn[1];
      treasureRoom.type = 'treasure';
      treasureRoom.name = `${this.theme.bannerPrefix} TREASURE VAULT`;
      treasureRoom.isCleared = true; // Treasure room has no combat
      this.treasureRoom = treasureRoom;
    }

    // 6. Name and configure remaining combat rooms
    this.combatRooms = this.rooms.filter(r => r.type === 'combat');
    for (let i = 0; i < this.combatRooms.length; i++) {
      this.combatRooms[i].name = `${this.theme.bannerPrefix} CHAMBER 0${i + 1}`;
      this.combatRooms[i].isCleared = false;
    }

    // Update door special flags (isBoss, isTreasure)
    for (const r of this.rooms) {
      for (const d of r.doors) {
        const target = this.rooms.find(x => x.id === d.targetRoomId);
        if (target) {
          d.isBoss = target.type === 'boss';
          d.isTreasure = target.type === 'treasure';
        }
      }
    }

    // 7. Setup Exit Descent Portal in Boss Sanctum
    this.exitPortal = {
      x: this.bossRoom.centerX,
      y: this.bossRoom.centerY,
      radius: 36,
      isActive: false,
      pulseAngle: 0
    };

    // 8. Place fixtures (Torches & Destructible Pots)
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
      // Place torches in the 4 corners of each room
      const cornerOffsets = [
        { ox: -room.width / 2 + 54, oy: -room.height / 2 + 54 },
        { ox: room.width / 2 - 54, oy: -room.height / 2 + 54 },
        { ox: -room.width / 2 + 54, oy: room.height / 2 - 54 },
        { ox: room.width / 2 - 54, oy: room.height / 2 - 54 }
      ];

      for (const c of cornerOffsets) {
        const torchColor = room.type === 'boss'
          ? '#ef4444'
          : (room.type === 'treasure' ? '#f59e0b' : this.theme.torchColor);
        const torchGlow = room.type === 'boss'
          ? 'rgba(239, 68, 68, 0.4)'
          : (room.type === 'treasure' ? 'rgba(245, 158, 11, 0.4)' : this.theme.torchGlowColor);

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

      // Destructible pots in corners and walls of combat/treasure rooms
      if (room.type === 'combat' || room.type === 'treasure') {
        const potSpots = [
          { ox: -room.width / 2 + 120, oy: -room.height / 2 + 64 },
          { ox: room.width / 2 - 120, oy: -room.height / 2 + 64 },
          { ox: -room.width / 2 + 120, oy: room.height / 2 - 64 },
          { ox: room.width / 2 - 120, oy: room.height / 2 - 64 }
        ];

        for (const spot of potSpots) {
          if (Math.random() < 0.75) {
            const pot = {
              id: containerId++,
              x: room.centerX + spot.ox,
              y: room.centerY + spot.oy,
              radius: 18,
              hp: 1,
              isBroken: false,
              theme: this.themeKey
            };
            this.containers.push(pot);
            room.containers.push(pot);
          }
        }
      }
    }
  }

  /**
   * Checks if player touches an open door threshold of currentRoom
   * Returns { targetRoom, newX, newY, door } if transition occurs, else null
   */
  checkDoorTransition(playerX, playerY, radius = 22) {
    if (!this.currentRoom || this.currentRoom.isLocked) return null;

    for (const door of this.currentRoom.doors) {
      let triggered = false;

      if (door.dir === 'north') {
        triggered = playerY <= this.currentRoom.bounds.minY + 54 && Math.abs(playerX - door.x) <= 56;
      } else if (door.dir === 'south') {
        triggered = playerY >= this.currentRoom.bounds.maxY - 54 && Math.abs(playerX - door.x) <= 56;
      } else if (door.dir === 'west') {
        triggered = playerX <= this.currentRoom.bounds.minX + 54 && Math.abs(playerY - door.y) <= 56;
      } else if (door.dir === 'east') {
        triggered = playerX >= this.currentRoom.bounds.maxX - 54 && Math.abs(playerY - door.y) <= 56;
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
  resolveCircleCollision(circleX, circleY, radius = 22) {
    const room = this.currentRoom || this.spawnRoom;
    if (!room) return { x: circleX, y: circleY, hitWall: false, normalX: 0, normalY: 0 };

    let resolvedX = circleX;
    let resolvedY = circleY;
    let hitWall = false;
    let normX = 0;
    let normY = 0;

    // Chamber wall inner edge thickness
    const wallPad = 54;
    const innerMinX = room.bounds.minX + wallPad;
    const innerMaxX = room.bounds.maxX - wallPad;
    const innerMinY = room.bounds.minY + wallPad;
    const innerMaxY = room.bounds.maxY - wallPad;

    const hasNorthDoor = room.doors.some(d => d.dir === 'north');
    const hasSouthDoor = room.doors.some(d => d.dir === 'south');
    const hasWestDoor = room.doors.some(d => d.dir === 'west');
    const hasEastDoor = room.doors.some(d => d.dir === 'east');

    const doorHalfWidth = 52; // 104px door opening

    // 1. West Wall
    if (resolvedX - radius < innerMinX) {
      const isAtDoorway = hasWestDoor && Math.abs(resolvedY - room.centerY) <= doorHalfWidth;
      if (room.isLocked || !isAtDoorway) {
        resolvedX = innerMinX + radius;
        hitWall = true;
        normX = 1;
      }
    }

    // 2. East Wall
    if (resolvedX + radius > innerMaxX) {
      const isAtDoorway = hasEastDoor && Math.abs(resolvedY - room.centerY) <= doorHalfWidth;
      if (room.isLocked || !isAtDoorway) {
        resolvedX = innerMaxX - radius;
        hitWall = true;
        normX = -1;
      }
    }

    // 3. North Wall
    if (resolvedY - radius < innerMinY) {
      const isAtDoorway = hasNorthDoor && Math.abs(resolvedX - room.centerX) <= doorHalfWidth;
      if (room.isLocked || !isAtDoorway) {
        resolvedY = innerMinY + radius;
        hitWall = true;
        normY = 1;
      }
    }

    // 4. South Wall
    if (resolvedY + radius > innerMaxY) {
      const isAtDoorway = hasSouthDoor && Math.abs(resolvedX - room.centerX) <= doorHalfWidth;
      if (room.isLocked || !isAtDoorway) {
        resolvedY = innerMaxY - radius;
        hitWall = true;
        normY = -1;
      }
    }

    // 5. Destructible Containers (Pots) inside this room
    for (const c of room.containers) {
      if (c.isBroken) continue;
      const dx = resolvedX - c.x;
      const dy = resolvedY - c.y;
      const dist = Math.hypot(dx, dy);
      const minDist = radius + (c.radius || 18);
      if (dist < minDist && dist > 0.001) {
        hitWall = true;
        const push = minDist - dist;
        resolvedX += (dx / dist) * push;
        resolvedY += (dy / dist) * push;
        normX = dx / dist;
        normY = dy / dist;
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

    const minX = room.bounds.minX + 54;
    const maxX = room.bounds.maxX - 54;
    const minY = room.bounds.minY + 54;
    const maxY = room.bounds.maxY - 54;

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
      color: room.type === 'boss' ? '#ef4444' : (room.type === 'treasure' ? '#f59e0b' : this.theme.torchColor),
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
