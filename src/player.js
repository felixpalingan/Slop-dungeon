/**
 * Player Entity for Dungeon Slop
 * Handles movement, stamina, Left Shift Dodge Roll, aiming, and attack animations.
 */
import { defaultEventBus } from './eventBus.js';

/**
 * Projects ray from start point along direction vector to dungeon perimeter walls
 */
export function projectRayToDungeonWall(startX, startY, dirX, dirY, bounds = { minX: -580, minY: -580, maxX: 580, maxY: 580 }) {
  if (bounds && typeof bounds.raycastWall === 'function') {
    const rayHit = bounds.raycastWall(startX, startY, dirX, dirY);
    if (rayHit && rayHit.hit) {
      return { x: rayHit.x, y: rayHit.y };
    }
  }

  const len = Math.hypot(dirX, dirY);
  if (len < 0.001) return { x: startX, y: startY };
  const uX = dirX / len;
  const uY = dirY / len;

  let t = Infinity;

  // Intersect with X bounds
  if (uX > 0) {
    const tX = (bounds.maxX - startX) / uX;
    if (tX > 0 && tX < t) t = tX;
  } else if (uX < 0) {
    const tX = (bounds.minX - startX) / uX;
    if (tX > 0 && tX < t) t = tX;
  }

  // Intersect with Y bounds
  if (uY > 0) {
    const tY = (bounds.maxY - startY) / uY;
    if (tY > 0 && tY < t) t = tY;
  } else if (uY < 0) {
    const tY = (bounds.minY - startY) / uY;
    if (tY > 0 && tY < t) t = tY;
  }

  if (t !== Infinity && t > 0) {
    const wallX = Math.max(bounds.minX, Math.min(bounds.maxX, startX + uX * t));
    const wallY = Math.max(bounds.minY, Math.min(bounds.maxY, startY + uY * t));
    return { x: wallX, y: wallY };
  }

  return { x: startX + dirX, y: startY + dirY };
}

export class Player {
  constructor(x = 0, y = 0, options = {}) {
    this.x = x;
    this.y = y;
    this.eventBus = options?.emit ? options : (options?.eventBus || defaultEventBus);
    this.vx = 0;
    this.vy = 0;
    this.radius = 22;
    this.angle = 0;
    this.name = 'SlopCrawler';
    this.color = '#00f0ff';

    // Stats
    this.hp = 100;
    this.maxHp = 100;
    this.baseSpeed = 260; // pixels/sec
    this.currentSpeed = this.baseSpeed;

    // Stamina & Roll / Dash
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRegen = 32;
    this.rollCost = 35;

    // Roll state
    this.isRolling = false;
    this.rollDuration = 0.28;
    this.rollTimer = 0;
    this.rollSpeedMultiplier = 2.4;
    this.rollDirX = 1;
    this.rollDirY = 0;
    this.afterImages = [];

    // Knockback physics (for friendly slaps & enemy hits)
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // Weapon Attack Animation (Left Click) & Cooldown
    this.isAttacking = false;
    this.attackDuration = 0.22; // snappy, satisfying swing
    this.attackTimer = 0;
    this.attackProgress = 0; // 0 to 1
    this.attackCooldownTimer = 0; // prevents click spamming

    // Offhand / Slap Animation (Right Click) & Cooldown
    this.isSlapping = false;
    this.slapDuration = 0.18;
    this.slapTimer = 0;
    this.slapProgress = 0; // 0 to 1
    this.slapCooldownTimer = 0;

    // Stun status effect (e.g. Spartan Kick)
    this.isStunned = false;
    this.stunTimer = 0;

    // Berserk Beast Armor state (Guts Set Bonus)
    this.isBerserk = false;
    this.berserkTimer = 0;

    // Gojo Limitless Mugen Barrier state (Base Q)
    this.isLimitlessBarrier = false;
    this.limitlessTimer = 0;

    // Lunge momentum physics (e.g. Spartan Kick forward thrust)
    this.lungeTimer = 0;
    this.lungeDuration = 0;
    this.lungeVx = 0;
    this.lungeVy = 0;

    // Levi Ackerman ODM Gear State (Fanny MLBB Mechanics)
    this.isOdmMode = false;
    this.odmGas = 100;
    this.maxOdmGas = 100;
    this.activeCables = [];
    this.isAirborne = false;
    this.groundedTimer = 0;
    this.spinTimer = 0;

    // David Martinez (Cyberpunk: Edgerunners) State
    this.isSandevistan = false;
    this.sandevistanTimer = 0;
    this.isOvercharged = false;
    this.overchargeTimer = 0;
    this.shotgunAmmo = 4;
    this.maxShotgunAmmo = 4;
    this.isReloadingShotgun = false;
    this.shotgunReloadTimer = 0;
    this.onShotgunReloadComplete = null;
    this.lastSliceMap = new Map();

    // Armor and Active Buff states
    this.armor = 0;
    this.isWarCry = false;
    this.warCryTimer = 0;
    this.isInfiniteStamina = false;
    this.infiniteStaminaTimer = 0;

    // Dual Wield independent blade attack animations (Levi Snap Blades)
    this.isLeftAttacking = false;
    this.leftAttackDuration = 0.14;
    this.leftAttackTimer = 0;
    this.leftAttackProgress = 0;
    this.leftAttackCooldownTimer = 0;

    this.isRightAttacking = false;
    this.rightAttackDuration = 0.14;
    this.rightAttackTimer = 0;
    this.rightAttackProgress = 0;
    this.rightAttackCooldownTimer = 0;

    // Shield Blocking state
    this.isBlocking = false;

    // 6 Equipment Slots
    this.equipment = {
      helmet: null,
      chest: null,
      pants: null,
      boots: null,
      weapon: null,
      offhand: null
    };

    // Inventory backpack slots (holds up to 10 unequipped items)
    this.inventory = [];
    this.maxInventorySize = 10;

    // Downed & Revive Co-op System State
    this.isDowned = false;
    this.downedTimer = 0;
    this.maxDownedTimer = 30.0;
    this.isDead = false;
    this.reviveProgress = 0;
    this.maxReviveProgress = 2.5;
    this.invulnerableTimer = 0;
  }

  triggerAttack() {
    if (this.isDowned || this.isDead || this.isStunned || this.isAttacking || this.attackCooldownTimer > 0) return false;

    const weapon = this.equipment?.weapon;
    const isShotgun = weapon?.visual === 'david_shotgun';

    if (isShotgun) {
      if (this.isReloadingShotgun) {
        return false; // currently reloading
      }
      if (this.shotgunAmmo <= 0) {
        this.startShotgunReload();
        return false;
      }
      this.shotgunAmmo--;
      // If emptied last shell, start automatic reload
      if (this.shotgunAmmo <= 0) {
        setTimeout(() => this.startShotgunReload(), 380);
      }
    }

    this.isAttacking = true;
    let speed = weapon?.speed || 1.0;
    if (this.isBerserk) speed *= 1.85; // Berserk rage grants +85% attack speed!
    if (this.isSandevistan) speed *= 1.4; // Sandevistan faster fire rate!
    this.attackDuration = Math.max(0.08, 0.22 / speed);
    this.attackCooldownTimer = Math.max(0.12, 0.35 / speed);
    this.attackTimer = this.attackDuration;
    this.attackProgress = 0;
    return true;
  }

  startShotgunReload() {
    if (this.isDowned || this.isDead || this.isReloadingShotgun) return;
    this.isReloadingShotgun = true;
    this.shotgunReloadTimer = 1.4;
  }

  triggerSlap() {
    if (this.isDowned || this.isDead || this.isStunned || this.isSlapping || this.slapCooldownTimer > 0) return false;
    this.isSlapping = true;
    this.slapTimer = this.slapDuration;
    this.slapCooldownTimer = 0.24;
    this.slapProgress = 0;
    return true;
  }

  triggerLeftAttack() {
    if (this.isDowned || this.isDead || this.isStunned || this.isLeftAttacking || this.leftAttackCooldownTimer > 0) return false;
    this.isLeftAttacking = true;
    this.leftAttackDuration = 0.14;
    this.leftAttackTimer = 0.14;
    this.leftAttackCooldownTimer = 0.16;
    this.leftAttackProgress = 0;
    return true;
  }

  triggerRightAttack() {
    if (this.isDowned || this.isDead || this.isStunned || this.isRightAttacking || this.rightAttackCooldownTimer > 0) return false;
    this.isRightAttacking = true;
    this.rightAttackDuration = 0.14;
    this.rightAttackTimer = 0.14;
    this.rightAttackCooldownTimer = 0.16;
    this.rightAttackProgress = 0;
    return true;
  }


  /**
   * Fires a single ODM high-tension cable towards wall anchor (Fanny MLBB mechanic)
   */
  fireOdmCable(targetX, targetY, audio = null, particles = null, bounds = { minX: -580, minY: -580, maxX: 580, maxY: 580 }) {
    if (this.isDowned || this.isDead || this.odmGas < 10) return false;
    this.odmGas = Math.max(0, this.odmGas - 10);

    // Calculate wall collision point along the aim ray (unlimited reach to wall)
    const anchor = projectRayToDungeonWall(this.x, this.y, targetX - this.x, targetY - this.y, bounds);

    // Max 2 active cables: if already 2, detach oldest
    if (this.activeCables.length >= 2) {
      this.activeCables.shift();
    }

    this.activeCables.push({
      anchorX: anchor.x,
      anchorY: anchor.y,
      life: 3.5,
      id: Date.now() + Math.random(),
      prevDist: Math.hypot(anchor.x - this.x, anchor.y - this.y)
    });

    this.isAirborne = true;
    this.groundedTimer = 0;

    if (audio) {
      audio.playGrappleWireLaunch?.();
      audio.playOdmGasHiss?.();
    }
    if (particles) {
      particles.spawnDashBurst?.(this.x, this.y, this.angle + Math.PI, '#ffffff');
    }
    return true;
  }

  startLunge(angle, speed = 880, duration = 0.28) {
    this.isStunned = false; // Lunge immediately clears any stun
    this.stunTimer = 0;
    this.lungeTimer = duration;
    this.lungeDuration = duration;
    this.lungeVx = Math.cos(angle) * speed;
    this.lungeVy = Math.sin(angle) * speed;
  }

  applyStun(duration = 2.5) {
    // Cannot be stunned while lunging, berserk, or invulnerable
    if (this.isInvulnerable || this.isBerserk || this.lungeTimer > 0) return;
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.isAttacking = false;
    this.isBlocking = false;
  }

  applyKnockback(kx, ky) {
    if (this.isBerserk) return; // Berserker armor ignores all knockback!
    this.knockbackVx = kx;
    this.knockbackVy = ky;
  }

  /**
   * Equips an item into its designated slot.
   * If equipping a 2-handed weapon, un-equips the off-hand automatically.
   * If equipping an off-hand while holding a 2-handed weapon, un-equips the 2H weapon!
   */
  equipItem(item) {
    if (!item || !item.slot || item.slot === 'consumable') return null;

    let unequippedItems = [];

    if (item.slot === 'weapon') {
      // If equipping 2-handed weapon, must unequip offhand
      if (item.hands === 2 && this.equipment.offhand) {
        unequippedItems.push(this.equipment.offhand);
        this.equipment.offhand = null;
      }
      if (this.equipment.weapon) {
        unequippedItems.push(this.equipment.weapon);
      }
      this.equipment.weapon = item;
    } else if (item.slot === 'offhand') {
      // Cannot equip offhand if currently holding a 2H weapon; unequip the 2H weapon
      if (this.equipment.weapon && this.equipment.weapon.hands === 2) {
        unequippedItems.push(this.equipment.weapon);
        this.equipment.weapon = null;
      }
      if (this.equipment.offhand) {
        unequippedItems.push(this.equipment.offhand);
      }
      this.equipment.offhand = item;
    } else {
      // Armor slots (helmet, chest, pants, boots)
      if (this.equipment[item.slot]) {
        unequippedItems.push(this.equipment[item.slot]);
      }
      this.equipment[item.slot] = item;
    }

    this.recalculateStats();
    if (this.eventBus) {
      this.eventBus.emit('player:itemEquipped', { slot: item.slot, item, unequipped: unequippedItems });
    }
    return unequippedItems;
  }

  unequipSlot(slot) {
    if (!this.equipment[slot]) return null;
    const removed = this.equipment[slot];
    this.equipment[slot] = null;
    this.recalculateStats();
    if (this.eventBus) {
      this.eventBus.emit('player:itemUnequipped', { slot, item: removed });
    }
    return removed;
  }

  recalculateStats() {
    let bonusHp = 0;
    let bonusSpeed = 0;
    let bonusStaminaRegen = 0;
    let rollCostReduction = 0;
    let totalArmor = 0;

    for (const slot in this.equipment) {
      const item = this.equipment[slot];
      if (!item) continue;
      if (item.hp) bonusHp += item.hp;
      if (item.speedBonus) bonusSpeed += item.speedBonus;
      if (item.staminaRegen) bonusStaminaRegen += item.staminaRegen;
      if (item.rollCostReduction) rollCostReduction += item.rollCostReduction;
      if (item.armor) totalArmor += item.armor;
    }

    const oldMaxHp = this.maxHp || 100;
    const hpRatio = oldMaxHp > 0 ? (this.hp / oldMaxHp) : 1.0;
    this.maxHp = 100 + bonusHp;
    this.hp = Math.round(this.maxHp * Math.min(1.0, Math.max(0, hpRatio)));
    this.baseSpeed = 260 + bonusSpeed;
    this.staminaRegen = 32 + bonusStaminaRegen;
    this.rollCost = Math.max(15, 35 - rollCostReduction);
    this.armor = totalArmor;

    if (this.eventBus) {
      this.eventBus.emit('player:statsChanged', {
        maxHp: this.maxHp,
        baseSpeed: this.baseSpeed,
        staminaRegen: this.staminaRegen,
        rollCost: this.rollCost,
        armor: this.armor
      });
    }
  }

  takeDamage(amount, angle = 0, knockback = 0, canBeDowned = true) {
    if (this.isDead || this.isInvulnerable || this.isRolling || (this.invulnerableTimer && this.invulnerableTimer > 0)) {
      return false;
    }

    // If player is ALREADY downed, incoming hits accelerate bleed-out by 3 seconds!
    if (this.isDowned) {
      this.downedTimer = Math.max(0, this.downedTimer - 3.0);
      const becameDead = this.downedTimer <= 0;
      if (becameDead) {
        this.isDead = true;
        this.isDowned = false;
        this.downedTimer = 0;
        if (this.eventBus) {
          this.eventBus.emit('player:died', { player: this });
        }
      }
      if (knockback > 0) {
        this.applyKnockback(Math.cos(angle) * (knockback * 0.4), Math.sin(angle) * (knockback * 0.4));
      }
      if (this.eventBus) {
        this.eventBus.emit('player:damage', {
          damage: amount,
          isBlocked: false,
          isDowned: true,
          downedTimer: this.downedTimer,
          becameDead
        });
      }
      return {
        damage: amount,
        isBlocked: false,
        isBerserk: false,
        isDowned: true,
        isBleedAccelerated: true,
        downedTimer: this.downedTimer,
        becameDead,
        becameDowned: false
      };
    }

    let finalDamage = amount;
    const isBlocked = this.isBlocking;
    if (isBlocked) {
      const mitigation = this.equipment?.offhand?.blockMitigation || 0.6;
      finalDamage = Math.max(1, Math.round(amount * (1 - mitigation)));
    }
    if (this.isBerserk) {
      // Berserker armor absorbs 35% damage
      finalDamage = Math.max(1, Math.round(finalDamage * 0.65));
    }
    if (this.armor > 0 && !isBlocked) {
      // Armor mitigation with diminishing returns:
      // 6 armor (leather tunic) = ~11% mitigation
      // 16 armor (spiked cuirass) = ~24% mitigation
      // 26 armor = ~34% mitigation
      const armorFactor = 50 / (50 + this.armor);
      finalDamage = Math.max(1, Math.round(finalDamage * armorFactor));
    }

    this.hp = Math.max(0, this.hp - finalDamage);

    if (this.eventBus) {
      this.eventBus.emit('player:damage', {
        damage: finalDamage,
        hp: this.hp,
        maxHp: this.maxHp,
        isBlocked,
        becameDowned: this.hp <= 0 && canBeDowned,
        becameDead: (this.hp <= 0 && !canBeDowned)
      });
      this.eventBus.emit('player:healthChanged', {
        hp: this.hp,
        maxHp: this.maxHp,
        isDowned: this.isDowned,
        isDead: this.isDead
      });
    }

    // Fatal damage: transition into Downed Crawl State (if teammates alive) or Instant Death (if alone / last standing)!
    if (this.hp <= 0) {
      this.hp = 0;
      this.reviveProgress = 0;
      this.isRolling = false;
      this.isAttacking = false;
      this.isSlapping = false;
      this.isLeftAttacking = false;
      this.isRightAttacking = false;
      this.isBlocking = false;
      this.isAirborne = false;
      this.activeCables = [];
      this.isBerserk = false;
      this.isSandevistan = false;
      this.isOvercharged = false;

      if (knockback > 0) {
        this.applyKnockback(Math.cos(angle) * (knockback * 0.7), Math.sin(angle) * (knockback * 0.7));
      }

      if (canBeDowned) {
        this.isDowned = true;
        this.downedTimer = this.maxDownedTimer; // 30s
        if (this.eventBus) {
          this.eventBus.emit('player:downed', { player: this, downedTimer: this.downedTimer });
        }
        return {
          damage: finalDamage,
          isBlocked,
          isBerserk: false,
          isDowned: true,
          becameDowned: true,
          becameDead: false
        };
      } else {
        this.isDead = true;
        this.isDowned = false;
        this.downedTimer = 0;
        this.vx = 0;
        this.vy = 0;
        if (this.eventBus) {
          this.eventBus.emit('player:died', { player: this });
        }
        return {
          damage: finalDamage,
          isBlocked,
          isBerserk: false,
          isDowned: false,
          becameDowned: false,
          becameDead: true
        };
      }
    }

    if (knockback > 0 && !this.isBerserk) {
      this.applyKnockback(Math.cos(angle) * knockback, Math.sin(angle) * knockback);
    }
    return {
      damage: finalDamage,
      isBlocked,
      isBerserk: this.isBerserk,
      becameDowned: false,
      becameDead: false
    };
  }

  update(dt, input, bounds = { minX: -580, minY: -580, maxX: 580, maxY: 580 }) {
    // 0. Invulnerability i-frames timer countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    // Dead state: completely halted
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      for (let i = this.afterImages.length - 1; i >= 0; i--) {
        this.afterImages[i].alpha -= dt * 2.5;
        if (this.afterImages[i].alpha <= 0) {
          this.afterImages.splice(i, 1);
        }
      }
      return;
    }

    // Downed Crawl State
    if (this.isDowned) {
      this.downedTimer -= dt;
      if (this.downedTimer <= 0) {
        this.downedTimer = 0;
        this.isDowned = false;
        this.isDead = true;
        this.vx = 0;
        this.vy = 0;
        return;
      }

      // 35% speed crawl movement
      const { dx, dy } = input ? input.getMovementVector() : { dx: 0, dy: 0 };
      const crawlSpeed = this.baseSpeed * 0.35;
      const targetVx = dx * crawlSpeed;
      const targetVy = dy * crawlSpeed;
      const accel = 14;

      this.vx += (targetVx - this.vx) * Math.min(1, accel * dt);
      this.vy += (targetVy - this.vy) * Math.min(1, accel * dt);

      if (dx !== 0 || dy !== 0) {
        this.angle = Math.atan2(dy, dx);
      }

      // Update position with crawl velocity & knockback
      this.x += (this.vx + this.knockbackVx) * dt;
      this.y += (this.vy + this.knockbackVy) * dt;

      this.knockbackVx *= Math.pow(0.001, dt);
      this.knockbackVy *= Math.pow(0.001, dt);

      // Bounds constraint
      const radius = this.radius;
      if (bounds && typeof bounds.resolveCircleCollision === 'function') {
        const col = bounds.resolveCircleCollision(this.x, this.y, radius);
        this.x = col.x;
        this.y = col.y;
      } else if (bounds) {
        if (this.x - radius < bounds.minX) { this.x = bounds.minX + radius; this.vx = 0; }
        if (this.x + radius > bounds.maxX) { this.x = bounds.maxX - radius; this.vx = 0; }
        if (this.y - radius < bounds.minY) { this.y = bounds.minY + radius; this.vy = 0; }
        if (this.y + radius > bounds.maxY) { this.y = bounds.maxY - radius; this.vy = 0; }
      }

      // Decay after-image trails
      for (let i = this.afterImages.length - 1; i >= 0; i--) {
        this.afterImages[i].alpha -= dt * 2.5;
        if (this.afterImages[i].alpha <= 0) {
          this.afterImages.splice(i, 1);
        }
      }
      return;
    }

    // 0. Cooldown timers
    this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    this.slapCooldownTimer = Math.max(0, this.slapCooldownTimer - dt);

    // Berserk Rage timer & blood-red trailing after-images
    if (this.isBerserk) {
      this.berserkTimer -= dt;
      if (Math.random() < 0.45) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: '#ef4444',
          alpha: 0.65
        });
      }
      if (this.berserkTimer <= 0) {
        this.isBerserk = false;
        this.isInvulnerable = false;
        this.berserkTimer = 0;
        this.currentSpeed = this.baseSpeed;
      }
    }

    // Gojo Limitless Barrier (Mugen) countdown
    if (this.isLimitlessBarrier) {
      this.limitlessTimer -= dt;
      if (this.limitlessTimer <= 0) {
        this.isLimitlessBarrier = false;
        this.isInvulnerable = false;
        this.limitlessTimer = 0;
        this.currentSpeed = this.baseSpeed;
      }
    }

    // Sandevistan Time Dilation countdown & neon cyber-ghost after-images
    if (this.isSandevistan) {
      this.sandevistanTimer -= dt;
      // High density cyan/lime/yellow ghost trails
      if (Math.random() < 0.85) {
        const ghostColors = ['#00ff88', '#00f0ff', '#facc15'];
        this.afterImages.push({
          x: this.x + (Math.random() - 0.5) * 8,
          y: this.y + (Math.random() - 0.5) * 8,
          angle: this.angle,
          color: ghostColors[Math.floor(Math.random() * ghostColors.length)],
          alpha: 0.75
        });
      }
      if (this.sandevistanTimer <= 0) {
        this.isSandevistan = false;
        this.sandevistanTimer = 0;
        this.currentSpeed = this.baseSpeed;
      }
    }

    // Overcharge Boost countdown
    if (this.isOvercharged) {
      this.overchargeTimer -= dt;
      if (Math.random() < 0.4) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: '#00ff88',
          alpha: 0.5
        });
      }
      if (this.overchargeTimer <= 0) {
        this.isOvercharged = false;
        this.overchargeTimer = 0;
        if (!this.isSandevistan && !this.isWarCry) {
          this.currentSpeed = this.baseSpeed;
        }
      }
    }

    // War Cry Berserk Surge countdown (Leather Tunic active Q)
    if (this.isWarCry) {
      this.warCryTimer -= dt;
      if (Math.random() < 0.35) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: '#ff3366',
          alpha: 0.5
        });
      }
      if (this.warCryTimer <= 0) {
        this.isWarCry = false;
        this.warCryTimer = 0;
        if (!this.isSandevistan && !this.isOvercharged) {
          this.currentSpeed = this.baseSpeed;
        }
      }
    }

    // Infinite Stamina Tonic countdown
    if (this.isInfiniteStamina) {
      this.infiniteStaminaTimer -= dt;
      this.stamina = this.maxStamina;
      if (this.infiniteStaminaTimer <= 0) {
        this.isInfiniteStamina = false;
        this.infiniteStaminaTimer = 0;
      }
    }

    // Carnage Shotgun Reload timer
    if (this.isReloadingShotgun) {
      this.shotgunReloadTimer -= dt;
      if (this.shotgunReloadTimer <= 0) {
        this.isReloadingShotgun = false;
        this.shotgunAmmo = this.maxShotgunAmmo;
        if (this.onShotgunReloadComplete) {
          this.onShotgunReloadComplete();
        }
      }
    }

    // 1. Lunge physics (Spartan Kick forward thrust has top priority over stun!)
    if (this.lungeTimer > 0) {
      this.lungeTimer -= dt;
      this.vx = this.lungeVx;
      this.vy = this.lungeVy;
      if (Math.random() < 0.6) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: '#38bdf8',
          alpha: 0.55
        });
      }
    } else if (this.isStunned) {
      // Stun check only when not lunging
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.stunTimer = 0;
      }
      this.vx = 0;
      this.vy = 0;
      this.x += this.knockbackVx * dt;
      this.y += this.knockbackVy * dt;
      this.knockbackVx *= Math.pow(0.001, dt);
      this.knockbackVy *= Math.pow(0.001, dt);
      return;
    }

    // 2. Mouse Aiming angle
    const screenCenterX = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2;
    const screenCenterY = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2;
    if (input && input.mouse) {
      this.angle = Math.atan2(input.mouse.screenY - screenCenterY, input.mouse.screenX - screenCenterX);
    }

    // 3. Weapon Attack Animation update
    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.attackProgress = 1 - Math.max(0, this.attackTimer / this.attackDuration);
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    }

    // 4. Slap Animation update
    if (this.isSlapping) {
      this.slapTimer -= dt;
      this.slapProgress = 1 - Math.max(0, this.slapTimer / this.slapDuration);
      if (this.slapTimer <= 0) {
        this.isSlapping = false;
        this.slapProgress = 0;
      }
    }

    // Dual Blade Attack updates (Levi Left & Right Snap Blades)
    if (this.isLeftAttacking) {
      this.leftAttackTimer -= dt;
      this.leftAttackProgress = 1 - Math.max(0, this.leftAttackTimer / this.leftAttackDuration);
      if (this.leftAttackTimer <= 0) {
        this.isLeftAttacking = false;
        this.leftAttackProgress = 0;
      }
    }
    if (this.leftAttackCooldownTimer > 0) {
      this.leftAttackCooldownTimer -= dt;
    }

    if (this.isRightAttacking) {
      this.rightAttackTimer -= dt;
      this.rightAttackProgress = 1 - Math.max(0, this.rightAttackTimer / this.rightAttackDuration);
      if (this.rightAttackTimer <= 0) {
        this.isRightAttacking = false;
        this.rightAttackProgress = 0;
      }
    }
    if (this.rightAttackCooldownTimer > 0) {
      this.rightAttackCooldownTimer -= dt;
    }

    // Update spin timer
    if (this.spinTimer > 0) {
      this.spinTimer -= dt;
    }

    // --- ODM CABLE & AIRBORNE PHYSICS (AUTHENTIC FANNY MLBB MECHANICS) ---
    if (this.isAirborne && this.activeCables.length > 0) {
      // Decrement lifetimes
      for (const cable of this.activeCables) {
        cable.life -= dt;
      }
      this.activeCables = this.activeCables.filter(c => c.life > 0);

      if (this.activeCables.length > 0) {
        let moveDirX = 0;
        let moveDirY = 0;
        let speed = 650;

        if (this.activeCables.length === 1) {
          // 1 cable active: direct pull towards anchor 1
          const c = this.activeCables[0];
          const dx = c.anchorX - this.x;
          const dy = c.anchorY - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.001) {
            moveDirX = dx / dist;
            moveDirY = dy / dist;
          }
          speed = 650;
        } else if (this.activeCables.length >= 2) {
          // 2 cables active: Equal vector sum (bisector) between both anchors!
          // When 1 cable is forward-left and 1 is forward-right, Levi shoots straight between them!
          const c1 = this.activeCables[0];
          const c2 = this.activeCables[1];
          const d1x = c1.anchorX - this.x;
          const d1y = c1.anchorY - this.y;
          const dist1 = Math.hypot(d1x, d1y);

          const d2x = c2.anchorX - this.x;
          const d2y = c2.anchorY - this.y;
          const dist2 = Math.hypot(d2x, d2y);

          const u1x = dist1 > 0.001 ? d1x / dist1 : 0;
          const u1y = dist1 > 0.001 ? d1y / dist1 : 0;
          const u2x = dist2 > 0.001 ? d2x / dist2 : 0;
          const u2y = dist2 > 0.001 ? d2y / dist2 : 0;

          // Combined 50/50 vector sum
          const sumX = u1x + u2x;
          const sumY = u1y + u2y;
          const sumLen = Math.hypot(sumX, sumY);

          if (sumLen > 0.15) {
            // Direct bisector flight straight down the center between both anchors!
            moveDirX = sumX / sumLen;
            moveDirY = sumY / sumLen;
          } else {
            // If anchors are in directly opposing directions (nearly 180 deg apart):
            // Redirect smoothly towards the newer cable
            moveDirX = u2x;
            moveDirY = u2y;
          }

          speed = 740; // Dual cable slingshot velocity boost
        }

        this.vx = moveDirX * speed;
        this.vy = moveDirY * speed;
        this.angle = Math.atan2(moveDirY, moveDirX);

        // --- CABLE DETACHMENT CHECK (Per-cable physics) ---
        // A cable detaches when:
        // 1. Player is within 46px of its anchor (reached wall)
        // 2. The anchor has passed behind the player's flight velocity vector (dot product <= 0)
        // 3. Distance starts increasing after approaching (closest point of approach passed)
        const survivingCables = [];
        for (let i = 0; i < this.activeCables.length; i++) {
          const cable = this.activeCables[i];
          const cdx = cable.anchorX - this.x;
          const cdy = cable.anchorY - this.y;
          const cdist = Math.hypot(cdx, cdy);
          const prevDist = cable.prevDist !== undefined ? cable.prevDist : cdist;
          cable.prevDist = cdist;

          const dotWithVel = cdx * this.vx + cdy * this.vy;
          const isReached = cdist <= 46;
          const isBehind = dotWithVel < -0.01;
          const isPast = cdist < 120 && cdist > prevDist + 0.5;

          if (!isReached && !isBehind && !isPast && cable.life > 0) {
            survivingCables.push(cable);
          }
        }
        this.activeCables = survivingCables;
      }

      // Emerald & white steam after-images
      if (Math.random() < 0.55) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: '#10b981',
          alpha: 0.5
        });
      }
    } else if (this.activeCables.length === 0) {
      if (this.isAirborne) {
        // Glide deceleration after cables detach
        this.vx *= Math.pow(0.003, dt);
        this.vy *= Math.pow(0.003, dt);
        const curSpeed = Math.hypot(this.vx, this.vy);
        if (curSpeed < 120) {
          this.groundedTimer += dt;
          if (this.groundedTimer >= 0.08) {
            this.isAirborne = false;
            this.groundedTimer = 0;
          }
        }
      } else {
        // Grounded: Gas recharges rapidly while on foot!
        if (this.odmGas < this.maxOdmGas) {
          this.odmGas = Math.min(this.maxOdmGas, this.odmGas + 60 * dt);
        }
      }
    }

    // 5. Movement states (ODM Cables, Lunge, Roll, or Normal WASD)
    if (this.isAirborne && this.activeCables.length > 0) {
      // Velocity is governed by ODM cable vector pull!
    } else if (this.lungeTimer > 0) {
      // Velocity is governed by Spartan Kick / lunge thrust
    } else if (this.isRolling) {
      // 4. Roll / Dash state
      this.rollTimer -= dt;

      if (Math.random() < 0.65) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          color: this.color,
          alpha: 0.55
        });
      }

      this.vx = this.rollDirX * this.baseSpeed * this.rollSpeedMultiplier;
      this.vy = this.rollDirY * this.baseSpeed * this.rollSpeedMultiplier;

      if (this.rollTimer <= 0) {
        this.isRolling = false;
      }
    } else {
      // 5. Normal Movement
      const { dx, dy } = input.getMovementVector();

      if (input.justPressedShift && (this.stamina >= this.rollCost || this.isInfiniteStamina)) {
        this.isRolling = true;
        this.rollTimer = this.rollDuration;
        if (!this.isInfiniteStamina) {
          this.stamina -= this.rollCost;
        }

        if (dx !== 0 || dy !== 0) {
          this.rollDirX = dx;
          this.rollDirY = dy;
        } else {
          this.rollDirX = Math.cos(this.angle);
          this.rollDirY = Math.sin(this.angle);
        }

        this.vx = this.rollDirX * this.baseSpeed * this.rollSpeedMultiplier;
        this.vy = this.rollDirY * this.baseSpeed * this.rollSpeedMultiplier;
      } else {
      // Movement speed penalty while raising shield
      const speedMult = this.isBlocking ? 0.45 : 1.0;
      const targetVx = dx * this.baseSpeed * speedMult;
      const targetVy = dy * this.baseSpeed * speedMult;
      const accel = 18;

      this.vx += (targetVx - this.vx) * Math.min(1, accel * dt);
      this.vy += (targetVy - this.vy) * Math.min(1, accel * dt);
      }

      // Stamina Regeneration
      if (this.stamina < this.maxStamina) {
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
      }
    }

    // 6. Update position with velocity & knockback
    this.x += (this.vx + this.knockbackVx) * dt;
    this.y += (this.vy + this.knockbackVy) * dt;

    // Decay knockback smoothly
    this.knockbackVx *= Math.pow(0.001, dt);
    this.knockbackVy *= Math.pow(0.001, dt);

    // 7. Constrain to room bounds or resolve tile collisions
    const radius = this.radius;
    if (bounds && typeof bounds.resolveCircleCollision === 'function') {
      const col = bounds.resolveCircleCollision(this.x, this.y, radius);
      this.x = col.x;
      this.y = col.y;
      if (col.hitWall) {
        // Slide smoothly along wall normal
        const dot = this.vx * col.normalX + this.vy * col.normalY;
        if (dot < 0) {
          this.vx -= dot * col.normalX;
          this.vy -= dot * col.normalY;
        }
      }
    } else if (bounds) {
      if (this.x - radius < bounds.minX) {
        this.x = bounds.minX + radius;
        this.vx = 0;
      }
      if (this.x + radius > bounds.maxX) {
        this.x = bounds.maxX - radius;
        this.vx = 0;
      }
      if (this.y - radius < bounds.minY) {
        this.y = bounds.minY + radius;
        this.vy = 0;
      }
      if (this.y + radius > bounds.maxY) {
        this.y = bounds.maxY - radius;
        this.vy = 0;
      }
    }

    // 8. Decay after-image trails
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].alpha -= dt * 2.5;
      if (this.afterImages[i].alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }

  revive(reviveHpRatio = 0.40) {
    this.isDowned = false;
    this.isDead = false;
    this.downedTimer = 0;
    this.reviveProgress = 0;
    this.hp = Math.round(this.maxHp * reviveHpRatio);
    this.invulnerableTimer = 2.0; // 2.0s invulnerability i-frames
    if (this.eventBus) {
      this.eventBus.emit('player:revived', {
        player: this,
        hp: this.hp,
        maxHp: this.maxHp
      });
    }
    this.syncHUD();
  }

  syncHUD() {
    // Check if Levi gear or mode is active
    const isLeviActive = this.isOdmMode ||
      this.equipment?.weapon?.visual === 'dual_snap_blades' ||
      this.equipment?.chest?.visual === 'odm_harness' ||
      this.equipment?.helmet?.visual === 'scout_hood' ||
      this.equipment?.pants?.visual === 'scout_trousers' ||
      this.equipment?.boots?.visual === 'scout_boots';

    const payload = {
      hp: this.hp,
      maxHp: this.maxHp,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      isDowned: this.isDowned,
      isDead: this.isDead,
      downedTimer: this.downedTimer,
      maxDownedTimer: this.maxDownedTimer,
      isLeviActive,
      odmGas: this.odmGas,
      maxOdmGas: this.maxOdmGas
    };

    if (this.eventBus) {
      this.eventBus.emit('player:hudSync', payload);
      this.eventBus.emit('player:healthChanged', {
        hp: this.hp,
        maxHp: this.maxHp,
        isDowned: this.isDowned,
        isDead: this.isDead
      });
      this.eventBus.emit('player:staminaChanged', {
        stamina: this.stamina,
        maxStamina: this.maxStamina
      });
    }

    // Direct DOM fallback for backward compatibility if document is available
    if (typeof document !== 'undefined') {
      const hpFill = document.getElementById('hud-hp-fill');
      const hpText = document.getElementById('hud-hp-text');
      const staminaFill = document.getElementById('hud-stamina-fill');

      if (hpFill && hpText) {
        if (this.isDead) {
          hpFill.style.width = '0%';
          hpFill.style.backgroundColor = '#64748b';
          hpText.textContent = 'DEAD 💀';
        } else if (this.isDowned) {
          const downedPct = Math.max(0, Math.min(100, (this.downedTimer / this.maxDownedTimer) * 100));
          hpFill.style.width = `${downedPct}%`;
          hpFill.style.backgroundColor = '#ef4444';
          hpText.textContent = `DOWNED [${Math.ceil(this.downedTimer)}s] 🩸`;
        } else {
          const hpPct = Math.max(0, Math.min(100, (this.hp / this.maxHp) * 100));
          hpFill.style.width = `${hpPct}%`;
          hpFill.style.backgroundColor = '#00ff88';
          hpText.textContent = `${Math.ceil(this.hp)} / ${this.maxHp}`;
        }
      }

      if (staminaFill) {
        const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
        staminaFill.style.width = `${staminaPct}%`;
      }

      const odmHud = document.getElementById('odm-tactical-hud');
      if (odmHud) {
        if (isLeviActive) {
          odmHud.classList.remove('hidden');

          const gasPct = Math.max(0, Math.min(100, (this.odmGas / this.maxOdmGas) * 100));
          const charges = Math.min(10, Math.floor((this.odmGas + 0.1) / 10));
          const isLow = charges <= 2;

          const bigFill = document.getElementById('odm-big-gas-fill');
          const bigText = document.getElementById('odm-big-gas-text');

          if (bigFill) {
            bigFill.style.width = `${gasPct}%`;
          }
          odmHud.classList.toggle('low-gas', isLow);

          if (bigText) {
            bigText.textContent = `GAS CHARGES: ${charges} / 10`;
          }
        } else {
          odmHud.classList.add('hidden');
        }
      }
    }
  }
}
