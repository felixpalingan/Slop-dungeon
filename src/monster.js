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

    // Boss Multi-Phase & Custom Death Animation states
    this.phase = 1; // 1 = Standard, 2 = Enraged (HP <= 50%)
    this.phaseTransitionTriggered = false;
    this.isDying = false;
    this.deathTimer = 0;
    this.deathDuration = options.deathDuration || 2.0;
    this.deathType = options.deathType || (this.type === 'adam_smasher_prototype' ? 'core_detonation' : (this.type === 'finger_bearer' ? 'curse_vaporize' : (this.type === 'armored_titan' ? 'titan_evaporate' : 'default')));
    this.specialCooldownTimer = 2.0;
    this.isPreparingSpecial = false;
    this.afterImages = [];

    // Boss 3-Attack Pattern Rotation & Telegraph states
    this.bossAttackIndex = 0;
    this.bossActionCooldown = 1.4;
    this.chosenAttack = 1;
    this.onBossAttack1 = null; // (player, phase) => {}
    this.onBossAttack2 = null; // (player, phase) => {}
    this.onBossAttack3 = null; // (player, phase) => {}
    this.onBossWindup = null;  // (attackType, phase, duration) => {}

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
    if (this.isDead || this.isDying) return { damage: 0, isDead: this.isDead };

    if (attacker) {
      this.lastAttacker = attacker;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.hitFlashTimer = 0.18;

    // Phase 2 Enrage Check (Bosses enter Phase 2 at HP <= 50%)
    if (this.archetype === 'boss' && this.hp <= this.maxHp * 0.5 && !this.phaseTransitionTriggered) {
      this.phase = 2;
      this.phaseTransitionTriggered = true;
      const speedMult = (this.type === 'adam_smasher_prototype' || this.type === 'armored_titan') ? 1.35 : 1.25;
      this.baseSpeed *= speedMult;
      if (this.onPhase2Trigger) {
        this.onPhase2Trigger(this);
      }
    }

    // Apply knockback
    if (knockback > 0) {
      this.knockbackVx += Math.cos(hitAngle) * knockback;
      this.knockbackVy += Math.sin(hitAngle) * knockback;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (this.archetype === 'boss' && !this.isDying) {
        this.isDying = true;
        this.deathTimer = this.deathDuration;
        this.vx = 0;
        this.vy = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        if (this.onBossStartDying) {
          this.onBossStartDying(this);
        }
        return {
          damage,
          isDead: false,
          isCrit,
          remainingHp: 0
        };
      } else {
        this.isDead = true;
      }
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

    // Boss custom dying animation sequence
    if (this.isDying) {
      this.deathTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      this.knockbackVx = 0;
      this.knockbackVy = 0;
      if (this.deathTimer <= 0) {
        this.isDying = false;
        this.isDead = true;
      }
      return;
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

    // Resolve collision against dungeon walls (constrained strictly to this monster's own room)
    if (dungeon && dungeon.resolveCircleCollision) {
      const monsterRoom = (this.roomId && dungeon.rooms) ? dungeon.rooms.find(r => r.id === this.roomId) : dungeon.currentRoom;
      const col = dungeon.resolveCircleCollision(this.x, this.y, this.radius, monsterRoom, true);
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
    if (this.isDying) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Sandevistan / Berserk after-images in Phase 2 for Adam Smasher and Armored Titan
    if (this.phase === 2) {
      if (this.type === 'adam_smasher_prototype' && Math.random() < 0.4) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          alpha: 0.65,
          color: '#00ff88'
        });
      } else if (this.type === 'armored_titan' && Math.random() < 0.4) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          alpha: 0.65,
          color: '#f59e0b'
        });
      }
    }

    // Decay after-images
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].alpha -= dt * 2.2;
      if (this.afterImages[i].alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }

    // Facing player
    this.angle = Math.atan2(player.y - this.y, player.x - this.x);

    // If currently winding up an attack
    if (this.windupTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        // Trigger the chosen attack (1 = Melee/Slam, 2 = Ranged/Barrage, 3 = AoE/Burst)
        if (this.chosenAttack === 1) {
          if (this.onBossAttack1) {
            this.onBossAttack1(player, this.phase);
          } else if (this.phase === 2 && this.onBossPhase2Attack) {
            this.onBossPhase2Attack(player);
          } else if (this.onBossAttack) {
            this.onBossAttack(player);
          }
        } else if (this.chosenAttack === 2) {
          if (this.onBossAttack2) {
            this.onBossAttack2(player, this.phase);
          } else if (this.phase === 2 && this.onBossPhase2Special) {
            this.onBossPhase2Special(player);
          } else if (this.onBossSpecial) {
            this.onBossSpecial(player);
          }
        } else if (this.chosenAttack === 3) {
          if (this.onBossAttack3) {
            this.onBossAttack3(player, this.phase);
          } else if (this.phase === 2 && this.onBossPhase2Special) {
            this.onBossPhase2Special(player);
          } else if (this.onBossSpecial) {
            this.onBossSpecial(player);
          }
        }

        // Set cooldown after attack (Phase 2 is faster and more relentless)
        this.bossActionCooldown = this.phase === 2 ? 0.9 + Math.random() * 0.4 : 1.5 + Math.random() * 0.5;
      }
      return;
    }

    // Count down action cooldown
    this.bossActionCooldown = (this.bossActionCooldown || 1.4) - dt;

    if (this.bossActionCooldown <= 0) {
      // Pick next attack in sequence (1, 2, 3)
      let nextAttack = (this.bossAttackIndex % 3) + 1;
      this.bossAttackIndex++;

      // If player is distant (> 200px) and next attack was melee (1),
      // bias towards ranged (2) or AoE (3)
      if (dist > 200 && nextAttack === 1 && Math.random() < 0.65) {
        nextAttack = 2;
      }

      this.chosenAttack = nextAttack;
      const windupBase = this.phase === 2 ? 0.4 : 0.65;
      this.windupTimer = windupBase;

      // Notify windup for telegraph effects
      if (this.onBossWindup) {
        this.onBossWindup(nextAttack, this.phase, this.windupTimer);
      }
      return;
    }

    // Normal movement towards player
    const minFollowDist = this.chosenAttack === 2 ? 140 : 55;
    if (dist > minFollowDist) {
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      this.vx = dirX * this.baseSpeed;
      this.vy = dirY * this.baseSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
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
