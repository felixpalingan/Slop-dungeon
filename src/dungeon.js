import { ITEM_CATALOG } from './items.js';
import { GroundLoot } from './groundLoot.js';

/**
 * Tile Constants for Procedural Dungeon Crawler
 */
export const TILE = {
  VOID: 0,        // Solid uncarved abyss
  FLOOR: 1,       // Walkable chamber floor
  WALL: 2,        // Solid collidable wall boundary
  CORRIDOR: 3,    // Walkable corridor connecting rooms
  DOORWAY: 4,     // Chamber entrance threshold
  CONTAINER: 5,   // Destructible thematic urn / cyber crate
  PORTAL: 6       // Floor Descent Portal
};

/**
 * The 4 Anime Floor Themes
 * Each floor strictly draws its atmosphere, palettes, mobs, room names, and loot tables from its theme!
 */
export const DUNGEON_THEMES = {
  jjk: {
    id: 'jjk',
    name: 'Cursed Detention Center & Shibuya Sublevel',
    subtitle: 'JUJUTSU KAISEN DIMENSION',
    anime: 'Jujutsu Kaisen',
    color: '#a855f7',
    bannerBorder: '#7e22ce',
    floorColor: '#12101e',
    floorAltColor: '#19152b',
    wallColor: '#251e3a',
    wallTopColor: '#3b305c',
    wallShadow: '#090710',
    torchColor: '#c084fc', // purple cursed flame!
    torchHalo: 'rgba(192, 132, 252, 0.26)',
    accentColor: '#9333ea',
    roomTitles: [
      'Cursed Detention Cell',
      'Eishu Juvenile Hall',
      'Finger Seal Chamber',
      'Cursed Incubation Vault',
      'Sorcerer Execution Grounds',
      'Shibuya Underground B5F',
      'Sukuna\'s Shrine Annex'
    ],
    lootPool: [
      'gojo_blindfold', 'gojo_tunic', 'gojo_slacks', 'gojo_loafers', 'lapse_blue', 'reversal_red',
      'sukuna_crown', 'sukuna_robe', 'sukuna_hakama', 'sukuna_zori', 'sukuna_kamutoke', 'sukuna_cleaver', 'sukuna_hiten',
      'toji_worm', 'toji_shirt', 'toji_pants', 'toji_slippers', 'inverted_spear_chain'
    ],
    bossLoot: [
      'sukuna_cleaver', 'inverted_spear_chain', 'reversal_red', 'sukuna_kamutoke'
    ],
    containerType: 'cursed_pot',
    containerHealth: 25,
    mobRoster: {
      swarmer: 'fly_head',
      ranged: 'masked_ino',
      brute: 'cursed_womb_brute',
      boss: 'finger_bearer'
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Arasaka Sub-Level & Night City Depths',
    subtitle: 'CYBERPUNK DIMENSION',
    anime: 'Cyberpunk: Edgerunners',
    color: '#00ff88',
    bannerBorder: '#00cc6a',
    floorColor: '#0a0d12',
    floorAltColor: '#101720',
    wallColor: '#1e293b',
    wallTopColor: '#334155',
    wallShadow: '#05070a',
    torchColor: '#00f0ff', // neon cyan holo-beacon!
    torchHalo: 'rgba(0, 240, 255, 0.24)',
    accentColor: '#facc15',
    roomTitles: [
      'Sub-Level Maintenance Bay',
      'Cyberware R&D Laboratory',
      'Maelstrom Smuggling Den',
      'Arasaka Server Core',
      'Black Market Chop Shop',
      'Adam Smasher Proving Arena'
    ],
    lootPool: [
      'david_kiroshi', 'david_jacket', 'david_pants', 'david_sneakers', 'david_shotgun', 'david_gorilla_arms'
    ],
    bossLoot: [
      'david_shotgun', 'david_gorilla_arms', 'david_jacket', 'david_kiroshi'
    ],
    containerType: 'cyber_crate',
    containerHealth: 30,
    mobRoster: {
      swarmer: 'arasaka_drone',
      ranged: 'tyger_claw_gunner',
      brute: 'maelstrom_cyberpsycho',
      boss: 'adam_smasher'
    }
  },
  aot: {
    id: 'aot',
    name: 'The Wall Ruins & Shiganshina Crypts',
    subtitle: 'ATTACK ON TITAN DIMENSION',
    anime: 'Attack on Titan',
    color: '#10b981',
    bannerBorder: '#059669',
    floorColor: '#1a1916',
    floorAltColor: '#22201b',
    wallColor: '#38332a',
    wallTopColor: '#4f483b',
    wallShadow: '#0c0b09',
    torchColor: '#f97316', // warm fiery torch flame!
    torchHalo: 'rgba(249, 115, 22, 0.25)',
    accentColor: '#10b981',
    roomTitles: [
      'Wall Maria Outer Bastion',
      'Shiganshina Underground Vault',
      'Scout Regiment Depository',
      'Yeager Cellar Antechamber',
      'Titan Holding Pen',
      'Armored Titan Breach'
    ],
    lootPool: [
      'scout_hood', 'odm_harness', 'scout_trousers', 'scout_boots', 'dual_snap_blades'
    ],
    bossLoot: [
      'dual_snap_blades', 'odm_harness', 'scout_hood'
    ],
    containerType: 'wooden_barrel',
    containerHealth: 20,
    mobRoster: {
      swarmer: 'crawler_titan',
      ranged: 'anti_personnel_rogue',
      brute: 'abnormal_titan',
      boss: 'armored_titan'
    }
  },
  berserk: {
    id: 'berserk',
    name: 'The Eclipse Sanctum & Interstice Crypt',
    subtitle: 'BERSERK DIMENSION',
    anime: 'Berserk',
    color: '#ef4444',
    bannerBorder: '#b91c1c',
    floorColor: '#150d0e',
    floorAltColor: '#1f1315',
    wallColor: '#2e191b',
    wallTopColor: '#452528',
    wallShadow: '#0a0506',
    torchColor: '#ff2a5f', // blood crimson fire!
    torchHalo: 'rgba(255, 42, 95, 0.28)',
    accentColor: '#dc2626',
    roomTitles: [
      'Sacrificial Alter Chamber',
      'Tower of Conviction Catacombs',
      'Midland Battlements Ruin',
      'Band of the Hawk Tomb',
      'Apostle Feast Hall',
      'Nosferatu Zodd\'s Domain'
    ],
    lootPool: [
      'guts_beast_helm', 'guts_berserker_plate', 'guts_greaves', 'guts_sollerets', 'dragon_slayer'
    ],
    bossLoot: [
      'dragon_slayer', 'guts_berserker_plate', 'guts_beast_helm'
    ],
    containerType: 'bone_urn',
    containerHealth: 25,
    mobRoster: {
      swarmer: 'possession_ghoul',
      ranged: 'kushan_archer',
      brute: 'apostle_vanguard',
      boss: 'nosferatu_zodd'
    }
  }
};

/**
 * Individual Chamber / Room in the BSP Dungeon
 */
export class DungeonRoom {
  constructor(id, tileX, tileY, tileW, tileH, tileSize, originX, originY) {
    this.id = id;
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileW = tileW;
    this.tileH = tileH;
    this.tileSize = tileSize;

    // World coordinates
    this.worldX = originX + tileX * tileSize;
    this.worldY = originY + tileY * tileSize;
    this.worldW = tileW * tileSize;
    this.worldH = tileH * tileSize;
    this.centerX = this.worldX + this.worldW / 2;
    this.centerY = this.worldY + this.worldH / 2;

    // Room role: 'spawn' | 'combat' | 'treasure' | 'boss'
    this.type = 'combat';
    this.name = 'Chamber';

    // Option A: Room Discovery Fog of War
    this.isDiscovered = false;
    this.discoveryAlpha = 0; // Animates 0 -> 1 on first entrance
    this.bannerTimer = 0;    // Pop-up banner duration

    // Thematic Features
    this.torches = [];
    this.containers = [];
    this.loot = [];
    this.monsters = [];
  }

  containsPoint(px, py) {
    return (
      px >= this.worldX &&
      px <= this.worldX + this.worldW &&
      py >= this.worldY &&
      py <= this.worldY + this.worldH
    );
  }
}

/**
 * Destructible Pot / Cyber-Crate / Container
 */
export class DestructibleContainer {
  constructor(id, x, y, hp = 25, type = 'cursed_pot', item = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.hp = hp;
    this.maxHp = hp;
    this.type = type;
    this.item = item; // Guaranteed item or null for gold/health chance
    this.isBroken = false;
    this.shakeTimer = 0;
  }

  takeDamage(amount) {
    if (this.isBroken) return false;
    this.hp -= amount;
    this.shakeTimer = 0.15;
    if (this.hp <= 0) {
      this.isBroken = true;
      return true; // Broke now
    }
    return false;
  }
}

/**
 * Floor Descent Portal (Exit to Next Floor)
 */
export class FloorPortal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 38;
    this.isLocked = true;
    this.pulseTime = 0;
  }

  update(dt) {
    this.pulseTime += dt * 2.8;
  }

  isNear(px, py) {
    return Math.hypot(px - this.x, py - this.y) <= this.radius;
  }
}

/**
 * Procedural Dungeon Crawler Generator (BSP)
 */
export class DungeonGenerator {
  constructor(options = {}) {
    this.gridWidth = options.gridWidth || 60;   // 60x60 tiles
    this.gridHeight = options.gridHeight || 60;
    this.tileSize = options.tileSize || 48;     // 48px per tile

    // Origin: centered in world coordinates
    this.originX = - (this.gridWidth * this.tileSize) / 2;
    this.originY = - (this.gridHeight * this.tileSize) / 2;

    this.worldWidth = this.gridWidth * this.tileSize;
    this.worldHeight = this.gridHeight * this.tileSize;

    // Bounds for camera / broadphase
    this.bounds = {
      minX: this.originX,
      minY: this.originY,
      maxX: this.originX + this.worldWidth,
      maxY: this.originY + this.worldHeight
    };

    this.theme = DUNGEON_THEMES.jjk; // Default theme
    this.floorNumber = 1;

    // Grid data: 2D array [y][x]
    this.tiles = [];
    this.rooms = [];
    this.corridors = [];
    this.containers = [];
    this.groundLoot = [];
    this.portal = null;
    this.bossDefeated = false;

    // Discovery notifications
    this.activeRoomBanner = null; // { title, subtitle, color, timer }
  }

  /**
   * Generates a complete themed dungeon floor using Binary Space Partitioning (BSP)
   */
  generateFloor(floorNumber = 1, requestedThemeId = null) {
    this.floorNumber = floorNumber;

    // Pick theme: use requested, or random theme (defaulting to jjk for Phase 4 start)
    if (requestedThemeId && DUNGEON_THEMES[requestedThemeId]) {
      this.theme = DUNGEON_THEMES[requestedThemeId];
    } else {
      const themeKeys = Object.keys(DUNGEON_THEMES);
      const chosenKey = themeKeys[(floorNumber - 1) % themeKeys.length];
      this.theme = DUNGEON_THEMES[chosenKey];
    }

    // Initialize tile grid with solid VOID
    this.tiles = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.tiles[y] = new Uint8Array(this.gridWidth); // Defaults to 0 (TILE.VOID)
    }

    this.rooms = [];
    this.corridors = [];
    this.containers = [];
    this.groundLoot = [];
    this.bossDefeated = false;

    // 1. Binary Space Partitioning (BSP) tree
    const rootNode = {
      x: 2,
      y: 2,
      w: this.gridWidth - 4,
      h: this.gridHeight - 4,
      left: null,
      right: null
    };

    const leaves = [];
    this._splitBsp(rootNode, 3, leaves); // depth 3 -> 8 leaf partitions

    // 2. Carve rooms inside partitions
    let roomId = 0;
    const titlePool = [...this.theme.roomTitles];

    for (const leaf of leaves) {
      // Room size inside partition (min 9x9, max leaf size minus padding)
      const maxW = Math.max(9, leaf.w - 3);
      const maxH = Math.max(9, leaf.h - 3);
      const roomW = Math.min(maxW, Math.floor(Math.random() * (maxW - 9 + 1)) + 9);
      const roomH = Math.min(maxH, Math.floor(Math.random() * (maxH - 9 + 1)) + 9);

      const roomX = leaf.x + Math.floor((leaf.w - roomW) / 2);
      const roomY = leaf.y + Math.floor((leaf.h - roomH) / 2);

      const room = new DungeonRoom(
        roomId++,
        roomX,
        roomY,
        roomW,
        roomH,
        this.tileSize,
        this.originX,
        this.originY
      );

      // Give thematic title
      room.name = titlePool.length > 0 ? titlePool.shift() : `Chamber ${roomId}`;
      this.rooms.push(room);

      // Carve floor & wall perimeter into grid
      this._carveRoomTiles(room);
    }

    // 3. Connect all sibling rooms with corridors
    this._connectBspNodes(rootNode);

    // 4. Assign Roles: Spawn, Boss, Treasure, Combat
    this._assignRoomRoles();

    // 5. Place Wall Torches, Containers & Thematic Ground Loot
    this._decorateDungeon();

    // Spawn Room is discovered by default
    const spawnRoom = this.getSpawnRoom();
    if (spawnRoom) {
      spawnRoom.isDiscovered = true;
      spawnRoom.discoveryAlpha = 1.0;
    }

    return this;
  }

  /**
   * Recursive BSP partition splitter
   */
  _splitBsp(node, depth, leaves) {
    if (depth <= 0 || (node.w < 18 && node.h < 18)) {
      leaves.push(node);
      return;
    }

    // Determine split direction (prefer longer dimension)
    let splitH = Math.random() > 0.5;
    if (node.w > node.h * 1.35) splitH = false; // split vertical (along X)
    else if (node.h > node.w * 1.35) splitH = true;  // split horizontal (along Y)

    const minSize = 14;
    if (splitH) {
      if (node.h < minSize * 2) {
        leaves.push(node);
        return;
      }
      const splitY = Math.floor(node.h * (0.42 + Math.random() * 0.16));
      node.left = { x: node.x, y: node.y, w: node.w, h: splitY, left: null, right: null };
      node.right = { x: node.x, y: node.y + splitY, w: node.w, h: node.h - splitY, left: null, right: null };
    } else {
      if (node.w < minSize * 2) {
        leaves.push(node);
        return;
      }
      const splitX = Math.floor(node.w * (0.42 + Math.random() * 0.16));
      node.left = { x: node.x, y: node.y, w: splitX, h: node.h, left: null, right: null };
      node.right = { x: node.x + splitX, y: node.y, w: node.w - splitX, h: node.h, left: null, right: null };
    }

    this._splitBsp(node.left, depth - 1, leaves);
    this._splitBsp(node.right, depth - 1, leaves);
  }

  /**
   * Carves floor tiles and surrounds them with solid WALL tiles
   */
  _carveRoomTiles(room) {
    for (let dy = -1; dy <= room.tileH; dy++) {
      for (let dx = -1; dx <= room.tileW; dx++) {
        const gx = room.tileX + dx;
        const gy = room.tileY + dy;
        if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) continue;

        if (dx === -1 || dx === room.tileW || dy === -1 || dy === room.tileH) {
          // Perimeter wall (unless already floor or corridor)
          if (this.tiles[gy][gx] === TILE.VOID) {
            this.tiles[gy][gx] = TILE.WALL;
          }
        } else {
          // Inner walkable floor
          this.tiles[gy][gx] = TILE.FLOOR;
        }
      }
    }
  }

  /**
   * Connects BSP leaves with L-shaped corridors
   */
  _connectBspNodes(node) {
    if (!node.left || !node.right) return;

    this._connectBspNodes(node.left);
    this._connectBspNodes(node.right);

    // Find center points of rooms in left and right subtrees
    const leftRoom = this._findRoomInSubtree(node.left);
    const rightRoom = this._findRoomInSubtree(node.right);

    if (leftRoom && rightRoom) {
      const startX = Math.floor(leftRoom.tileX + leftRoom.tileW / 2);
      const startY = Math.floor(leftRoom.tileY + leftRoom.tileH / 2);
      const endX = Math.floor(rightRoom.tileX + rightRoom.tileW / 2);
      const endY = Math.floor(rightRoom.tileY + rightRoom.tileH / 2);

      this._carveCorridor(startX, startY, endX, endY);
    }
  }

  _findRoomInSubtree(node) {
    // Find room whose center is within node bounds
    for (const room of this.rooms) {
      const rx = room.tileX + room.tileW / 2;
      const ry = room.tileY + room.tileH / 2;
      if (rx >= node.x && rx <= node.x + node.w && ry >= node.y && ry <= node.y + node.h) {
        return room;
      }
    }
    return this.rooms[0] || null;
  }

  /**
   * Carves a 2-tile wide corridor with boundary walls
   */
  _carveCorridor(x1, y1, x2, y2) {
    let curX = x1;
    let curY = y1;

    // Horizontal then vertical
    while (curX !== x2) {
      this._carveCorridorSegment(curX, curY);
      curX += (x2 > curX) ? 1 : -1;
    }
    while (curY !== y2) {
      this._carveCorridorSegment(curX, curY);
      curY += (y2 > curY) ? 1 : -1;
    }
  }

  _carveCorridorSegment(gx, gy) {
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const tx = gx + ox;
        const ty = gy + oy;
        if (tx < 1 || tx >= this.gridWidth - 1 || ty < 1 || ty >= this.gridHeight - 1) continue;

        if (ox === 0 && oy === 0) {
          // Corridor center
          if (this.tiles[ty][tx] !== TILE.FLOOR) {
            this.tiles[ty][tx] = TILE.CORRIDOR;
          }
        } else {
          // Corridor wall boundary
          if (this.tiles[ty][tx] === TILE.VOID) {
            this.tiles[ty][tx] = TILE.WALL;
          }
        }
      }
    }
  }

  /**
   * Assigns roles: Spawn Room, Boss Room (furthest), Treasure Room, and Combat Chambers
   */
  _assignRoomRoles() {
    if (this.rooms.length === 0) return;

    // Room 0 is Spawn Room
    const spawn = this.rooms[0];
    spawn.type = 'spawn';
    spawn.name = `${this.theme.anime} Sanctuary (Entrance)`;

    // Find furthest room from spawn -> Boss Room
    let maxDist = -1;
    let bossRoom = this.rooms[1] || spawn;

    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const dist = Math.hypot(room.centerX - spawn.centerX, room.centerY - spawn.centerY);
      if (dist > maxDist) {
        maxDist = dist;
        bossRoom = room;
      }
    }

    bossRoom.type = 'boss';
    bossRoom.name = `Sanctum of the Floor Guardian`;

    // Place Floor Descent Portal in Boss Sanctum (initially locked)
    this.portal = new FloorPortal(bossRoom.centerX, bossRoom.centerY);

    // Second furthest or dead-end room -> Treasure Vault
    let secondDist = -1;
    let treasureRoom = null;

    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (room === bossRoom) continue;
      const dist = Math.hypot(room.centerX - spawn.centerX, room.centerY - spawn.centerY);
      if (dist > secondDist) {
        secondDist = dist;
        treasureRoom = room;
      }
    }

    if (treasureRoom) {
      treasureRoom.type = 'treasure';
      treasureRoom.name = `${this.theme.anime} Relic Vault`;
    }

    // All others remain 'combat' chambers
  }

  /**
   * Places wall torches, destructible containers, and thematic ground loot
   */
  _decorateDungeon() {
    for (const room of this.rooms) {
      // 1. Wall Torches along room perimeter
      room.torches.push({
        x: room.worldX + room.tileSize * 1.5,
        y: room.worldY + 12,
        wallSide: 'top'
      });
      room.torches.push({
        x: room.worldX + room.worldW - room.tileSize * 1.5,
        y: room.worldY + 12,
        wallSide: 'top'
      });
      room.torches.push({
        x: room.worldX + 12,
        y: room.worldY + room.worldH / 2,
        wallSide: 'left'
      });
      room.torches.push({
        x: room.worldX + room.worldW - 12,
        y: room.worldY + room.worldH / 2,
        wallSide: 'right'
      });

      // 2. Containers (Cursed Pots / Cyber-Crates) in corners
      if (room.type === 'combat' || room.type === 'treasure') {
        const count = room.type === 'treasure' ? 4 : 2;
        const cornerOffsets = [
          { x: room.tileSize * 1.5, y: room.tileSize * 1.5 },
          { x: room.worldW - room.tileSize * 1.5, y: room.tileSize * 1.5 },
          { x: room.tileSize * 1.5, y: room.worldH - room.tileSize * 1.5 },
          { x: room.worldW - room.tileSize * 1.5, y: room.worldH - room.tileSize * 1.5 }
        ];

        for (let i = 0; i < count; i++) {
          const off = cornerOffsets[i];
          const potX = room.worldX + off.x;
          const potY = room.worldY + off.y;
          const potId = `container_${room.id}_${i}`;

          // Chance for container to contain a thematic item
          let potItem = null;
          if (room.type === 'treasure' || Math.random() < 0.40) {
            potItem = this._getRandomThemedItem();
          }

          const container = new DestructibleContainer(
            potId,
            potX,
            potY,
            this.theme.containerHealth,
            this.theme.containerType,
            potItem
          );
          room.containers.push(container);
          this.containers.push(container);
        }
      }

      // 3. Guaranteed Ground Loot in Treasure Vault
      if (room.type === 'treasure') {
        const lootCount = 3;
        for (let i = 0; i < lootCount; i++) {
          const item = this._getRandomThemedItem();
          if (item) {
            const angle = (i / lootCount) * Math.PI * 2;
            const lx = room.centerX + Math.cos(angle) * 45;
            const ly = room.centerY + Math.sin(angle) * 45;
            const lootEntity = new GroundLoot(item, lx, ly, `vault_loot_${i}_${Date.now()}`);
            this.groundLoot.push(lootEntity);
          }
        }
      }
    }
  }

  /**
   * Helper to fetch a random item from the active floor's theme loot pool
   */
  _getRandomThemedItem() {
    const pool = this.theme.lootPool;
    if (!pool || pool.length === 0) return null;
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    return ITEM_CATALOG[itemId] || null;
  }

  /**
   * Returns the player spawn room
   */
  getSpawnRoom() {
    return this.rooms.find(r => r.type === 'spawn') || this.rooms[0] || null;
  }

  /**
   * Returns the boss room
   */
  getBossRoom() {
    return this.rooms.find(r => r.type === 'boss') || null;
  }

  /**
   * Updates dungeon room discovery (Option A Fog of War) and portal animation
   */
  update(playerX, playerY, dt) {
    if (this.portal) {
      this.portal.update(dt);
    }

    // Room discovery check
    for (const room of this.rooms) {
      if (room.containsPoint(playerX, playerY)) {
        if (!room.isDiscovered) {
          room.isDiscovered = true;
          room.bannerTimer = 3.5; // 3.5s pop-up banner

          this.activeRoomBanner = {
            title: room.name,
            subtitle: `FLOOR ${this.floorNumber} — ${this.theme.subtitle}`,
            color: this.theme.color,
            timer: 3.5,
            maxTimer: 3.5
          };
        }
      }

      // Smooth fade-in alpha for discovered rooms
      if (room.isDiscovered && room.discoveryAlpha < 1.0) {
        room.discoveryAlpha = Math.min(1.0, room.discoveryAlpha + dt * 2.5);
      }

      if (room.bannerTimer > 0) {
        room.bannerTimer -= dt;
      }
    }

    // Update active banner timer
    if (this.activeRoomBanner) {
      this.activeRoomBanner.timer -= dt;
      if (this.activeRoomBanner.timer <= 0) {
        this.activeRoomBanner = null;
      }
    }

    // Update destructible container shake timers
    for (const c of this.containers) {
      if (c.shakeTimer > 0) {
        c.shakeTimer -= dt;
      }
    }
  }

  /**
   * Resolves Circle-to-Wall AABB collision against the dungeon tile grid.
   * Enables smooth sliding along dungeon corridors and stone walls.
   */
  resolveCircleCollision(x, y, radius) {
    let resolvedX = x;
    let resolvedY = y;
    let hitWall = false;

    // Convert to tile coordinates
    const centerTx = Math.floor((x - this.originX) / this.tileSize);
    const centerTy = Math.floor((y - this.originY) / this.tileSize);

    // Check 3x3 surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerTx + dx;
        const ty = centerTy + dy;

        // Out of bounds is solid
        const isSolid =
          tx < 0 || tx >= this.gridWidth ||
          ty < 0 || ty >= this.gridHeight ||
          this.tiles[ty][tx] === TILE.WALL ||
          this.tiles[ty][tx] === TILE.VOID;

        if (!isSolid) continue;

        // Tile bounding box in world coords
        const tileMinX = this.originX + tx * this.tileSize;
        const tileMinY = this.originY + ty * this.tileSize;
        const tileMaxX = tileMinX + this.tileSize;
        const tileMaxY = tileMinY + this.tileSize;

        // Nearest point on AABB to circle center
        const nearestX = Math.max(tileMinX, Math.min(tileMaxX, resolvedX));
        const nearestY = Math.max(tileMinY, Math.min(tileMaxY, resolvedY));

        const diffX = resolvedX - nearestX;
        const diffY = resolvedY - nearestY;
        const distSq = diffX * diffX + diffY * diffY;

        if (distSq < radius * radius && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          resolvedX += (diffX / dist) * overlap;
          resolvedY += (diffY / dist) * overlap;
          hitWall = true;
        }
      }
    }

    return { x: resolvedX, y: resolvedY, hitWall };
  }

  /**
   * DDA Fast Raymarching: Casts ray through dungeon grid to find wall anchor point.
   * Powers Levi Ackerman's ODM cables to latch onto any stone wall or corner!
   */
  raycastWall(startX, startY, dirX, dirY, maxDist = 2800) {
    const len = Math.hypot(dirX, dirY);
    if (len < 0.001) return { x: startX, y: startY, hit: false };

    const uX = dirX / len;
    const uY = dirY / len;

    let curX = startX;
    let curY = startY;
    const stepSize = this.tileSize / 4; // Sub-tile precision
    let traveled = 0;

    while (traveled < maxDist) {
      curX += uX * stepSize;
      curY += uY * stepSize;
      traveled += stepSize;

      const tx = Math.floor((curX - this.originX) / this.tileSize);
      const ty = Math.floor((curY - this.originY) / this.tileSize);

      // Check wall hit
      if (
        tx < 0 || tx >= this.gridWidth ||
        ty < 0 || ty >= this.gridHeight ||
        this.tiles[ty][tx] === TILE.WALL ||
        this.tiles[ty][tx] === TILE.VOID
      ) {
        return {
          x: curX,
          y: curY,
          hit: true,
          tileX: tx,
          tileY: ty,
          distance: traveled
        };
      }
    }

    return { x: curX, y: curY, hit: false, distance: maxDist };
  }

  /**
   * Unlocks the Floor Descent Portal upon Boss Defeat
   */
  unlockPortal() {
    if (this.portal) {
      this.portal.isLocked = false;
    }
    this.bossDefeated = true;
  }
}
