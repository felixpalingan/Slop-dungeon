/**
 * Base Monster Class & Monster Manager for Dungeon Slop
 * Handles Host-Authoritative AI, physics, wall collisions,
 * damage reactions, steering behaviors, and network synchronization.
 */

export class Monster {
  constructor(options = {}) {
    this.id = options.id || `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.type = options.type || 'generic_swarmer';
    this.name = options.name || 'Dungeon Creature';
    this.theme = options.theme || 'jjk';
    this.archetype = options.archetype || 'swarmer'; // 'swarmer', 'ranged', 'brute', 'boss'

    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;

    this.radius = options.radius || 20;
    this.maxHp = options.hp || 50;
    this.hp = this.maxHp;
    this.baseSpeed = options.speed || 120;
    this.damage = options.damage || 12;

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;

    this.knockbackVx = 0;
    this.knockbackVy = 0;

    this.target = null;
    this.state = 'idle'; // 'idle', 'chase', 'kite', 'windup', 'attack'
    this.stateTimer = 0;

    this.attackRange = options.attackRange || 38;
    this.attackCooldown = options.attackCooldown || 1.4;
    this.attackCooldownTimer = Math.random() * 0.5;
    this.windupDuration = options.windupDuration || 0.4;
    this.windupTimer = 0;

    // Visual & animation properties
    this.animTime = Math.random() * 10;
    this.hitFlashTimer = 0;
    this.scale = 1.0;
    this.squash = 1.0;

    // Room association (activates when room discovered)
    this.roomId = options.roomId || null;
    this.isActive = options.isActive !== undefined ? options.isActive : true;
  }

  takeHit(damage = 10, hitAngle = 0, knockback = 280, isCrit = false, attacker = null) {
    if (this.isDead) return { damage: 0, isDead: true };

    this.hp = Math.max(0, this.hp - damage);
    this.hitFlashTimer = 0.18;

    // Apply knockback
    if (knockback > 0) {
      this.knockbackVx += Math.cos(hitAngle) * knockback;
      this.knockbackVy += Math.sin(hitAngle) * knockback;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.hp = 0;
    }

    // Awaken immediately if hit
    this.isActive = true;

    return {
      damage,
      isDead: this.isDead,
      isCrit,
      remainingHp: this.hp
    };
  }

  applyStun(duration = 1.5) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.windupTimer = 0;
    this.state = 'idle';
  }

  pullTowards(targetX, targetY, strength = 35) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      this.knockbackVx += (dx / dist) * strength * 12;
      this.knockbackVy += (dy / dist) * strength * 12;
    }
  }

  update(dt, players = [], dungeon = null) {
    this.animTime += dt;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }

    if (this.isDead) return;

    // Decay knockback
    this.x += this.knockbackVx * dt;
    this.y += this.knockbackVy * dt;
    this.knockbackVx *= Math.pow(0.001, dt);
    this.knockbackVy *= Math.pow(0.001, dt);

    // Stun decay
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
      return;
    }

    if (!this.isActive) return;

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    }

    // 1. Find closest player
    let closestPlayer = null;
    let closestDist = Infinity;

    for (const p of players) {
      if (!p || p.isDead) continue;
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = p;
      }
    }

    this.target = closestPlayer;

    if (closestPlayer) {
      this.angle = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);

      // Archetype specific movement & attack logic
      if (this.archetype === 'swarmer') {
        this.updateSwarmer(dt, closestPlayer, closestDist);
      } else if (this.archetype === 'ranged') {
        this.updateRanged(dt, closestPlayer, closestDist);
      } else if (this.archetype === 'brute') {
        this.updateBrute(dt, closestPlayer, closestDist);
      } else if (this.archetype === 'boss') {
        this.updateBoss(dt, closestPlayer, closestDist);
      }
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Apply movement velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Resolve collision against dungeon walls
    if (dungeon && dungeon.resolveCircleCollision) {
      const col = dungeon.resolveCircleCollision(this.x, this.y, this.radius);
      this.x = col.x;
      this.y = col.y;
    }
  }

  updateSwarmer(dt, player, dist) {
    if (dist > this.attackRange) {
      // Rush towards player
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      this.vx = dirX * this.baseSpeed;
      this.vy = dirY * this.baseSpeed;
    } else {
      // Within attack range: deal bite/attack
      this.vx = 0;
      this.vy = 0;
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.attackCooldown;
        if (this.onAttack) this.onAttack(player);
      }
    }
  }

  updateRanged(dt, player, dist) {
    const desiredDist = 240;
    if (dist < desiredDist - 40) {
      // Kite away from player
      const awayX = -Math.cos(this.angle);
      const awayY = -Math.sin(this.angle);
      this.vx = awayX * this.baseSpeed;
      this.vy = awayY * this.baseSpeed;
    } else if (dist > desiredDist + 60) {
      // Close distance
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      this.vx = dirX * (this.baseSpeed * 0.85);
      this.vy = dirY * (this.baseSpeed * 0.85);
    } else {
      // In optimal shooting range: stop and shoot
      this.vx = 0;
      this.vy = 0;
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.attackCooldown;
        if (this.onRangedAttack) this.onRangedAttack(player);
      }
    }
  }

  updateBrute(dt, player, dist) {
    if (this.windupTimer > 0) {
      // In windup: frozen in place charging heavy slam
      this.vx = 0;
      this.vy = 0;
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        if (this.onBruteSlam) this.onBruteSlam(player);
        this.attackCooldownTimer = this.attackCooldown;
      }
      return;
    }

    if (dist > this.attackRange + 25) {
      // Slow relentless march towards player
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      this.vx = dirX * this.baseSpeed;
      this.vy = dirY * this.baseSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
      if (this.attackCooldownTimer <= 0) {
        // Begin telegraphed slam windup
        this.windupTimer = this.windupDuration;
      }
    }
  }

  updateBoss(dt, player, dist) {
    if (this.windupTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        if (this.onBossSpecial) this.onBossSpecial(player);
        this.attackCooldownTimer = this.attackCooldown;
      }
      return;
    }

    if (dist > this.attackRange) {
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      this.vx = dirX * this.baseSpeed;
      this.vy = dirY * this.baseSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.attackCooldown;
        if (this.onBossAttack) this.onBossAttack(player);
      }
    }
  }

  /**
   * Compact serialization for WebRTC broadcast
   */
  getNetworkState() {
    return [
      this.id,
      this.type,
      Math.round(this.x),
      Math.round(this.y),
      Math.round(this.angle * 100) / 100,
      Math.round(this.hp),
      this.isDead ? 1 : 0,
      this.isStunned ? 1 : 0,
      this.windupTimer > 0 ? 1 : 0
    ];
  }

  /**
   * Applies network update on client peers
   */
  applyNetworkState(stateArray) {
    const [id, type, x, y, angle, hp, isDead, isStunned, isWindingUp] = stateArray;
    // Interpolate towards received position
    this.x += (x - this.x) * 0.45;
    this.y += (y - this.y) * 0.45;
    this.angle = angle;
    this.hp = hp;
    this.isDead = isDead === 1;
    this.isStunned = isStunned === 1;
    this.isWindingUp = isWindingUp === 1;
  }
}

export class MonsterManager {
  constructor() {
    this.monsters = [];
    this.boss = null;
    this.onMonsterKilled = null; // (monster, dropLoot) => {}
    this.onBossKilled = null; // (boss) => {}
  }

  clear() {
    this.monsters = [];
    this.boss = null;
  }

  addMonster(monster) {
    this.monsters.push(monster);
    if (monster.archetype === 'boss') {
      this.boss = monster;
    }
    return monster;
  }

  getBoss() {
    return this.boss && !this.boss.isDead ? this.boss : null;
  }

  getAliveMonsters() {
    return this.monsters.filter(m => !m.isDead);
  }

  getNearbyMonsters(x, y, maxDistance = 450) {
    return this.monsters.filter(m => {
      if (m.isDead) return false;
      const d = Math.hypot(m.x - x, m.y - y);
      return d <= maxDistance;
    });
  }

  getMonsterById(id) {
    return this.monsters.find(m => m.id === id);
  }

  /**
   * Activates all monsters inhabiting a specific room when discovered
   */
  activateRoom(roomId) {
    for (const m of this.monsters) {
      if (m.roomId === roomId && !m.isDead) {
        m.isActive = true;
      }
    }
  }

  getMonstersInRoom(roomId) {
    return this.monsters.filter(m => m.roomId === roomId && !m.isDead);
  }

  isRoomCleared(roomId) {
    return this.monsters.filter(m => m.roomId === roomId && !m.isDead).length === 0;
  }

  update(dt, players = [], dungeon = null, isHost = true) {
    const alive = [];

    for (const m of this.monsters) {
      if (!m.isDead) {
        if (isHost) {
          m.update(dt, players, dungeon);
        } else {
          // Client simply updates animation time and decays knockback
          m.animTime += dt;
          if (m.hitFlashTimer > 0) m.hitFlashTimer -= dt;
        }
        alive.push(m);
      } else {
        // Dead monster cleanup after death animation
        if (!m.hasTriggeredDeath) {
          m.hasTriggeredDeath = true;
          if (this.onMonsterKilled) {
            this.onMonsterKilled(m);
          }
          if (m === this.boss && this.onBossKilled) {
            this.onBossKilled(m);
          }
        }
      }
    }

    // Separate overlapping monsters so packs form realistic mobs
    if (isHost) {
      for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
          const m1 = alive[i];
          const m2 = alive[j];
          const dx = m2.x - m1.x;
          const dy = m2.y - m1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = m1.radius + m2.radius;

          if (dist > 0 && dist < minDist) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            m1.x -= nx * overlap;
            m1.y -= ny * overlap;
            m2.x += nx * overlap;
            m2.y += ny * overlap;
          }
        }
      }
    }
  }

  /**
   * Generates compact state array for network transmission
   */
  getBatchNetworkState() {
    return this.monsters
      .filter(m => !m.isDead || m.hitFlashTimer > 0)
      .map(m => m.getNetworkState());
  }

  /**
   * Applies received batch update from host
   */
  applyBatchNetworkState(batchData) {
    const receivedIds = new Set();

    for (const state of batchData) {
      const id = state[0];
      receivedIds.add(id);
      let monster = this.getMonsterById(id);
      if (monster) {
        monster.applyNetworkState(state);
      } else {
        // Create placeholder monster if not exists on client
        monster = new Monster({
          id: state[0],
          type: state[1],
          x: state[2],
          y: state[3],
          hp: state[5]
        });
        monster.applyNetworkState(state);
        this.addMonster(monster);
      }
    }
  }
}
