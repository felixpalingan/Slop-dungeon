/**
 * Training Dummy / Combat Automaton entity for Dungeon Slop lobby.
 * Features 3 interactive combat modes:
 * - PASSIVE: Harmless DPS testing punching bag
 * - SHOOTER: Arcane turret that aims and fires energy orbs (tests dodging, blocking, and Gojo's Infinity trap)
 * - BRAWLER: Aggressive sparring partner that closes distance and swings heavy melee strikes
 * Mode can be cycled via [T] key or network command.
 */

export class Dummy {
  constructor(x = 0, y = -140) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetVx = 0;
    this.offsetVy = 0;
    this.radius = 26;
    this.wobbleAngle = 0;
    this.wobbleVelocity = 0;
    this.totalDamage = 0;
    this.lastHitTime = 0;
    this.recentDamage = 0;
    this.dps = 0;
    this.dpsWindow = []; // { time, damage }
    this.isStunned = false;
    this.stunTimer = 0;

    // Combat Bot Modes: 'PASSIVE', 'SHOOTER', 'BRAWLER'
    this.mode = 'PASSIVE';
    this.attackTimer = 0;
    this.isChargingAttack = false;
    this.aimAngle = 0;
    this.targetPlayer = null;

    // Callbacks for projectile emission and melee hit
    this.onShoot = null;
    this.onMeleeHit = null;
  }

  cycleMode() {
    if (this.mode === 'PASSIVE') {
      this.mode = 'SHOOTER';
    } else if (this.mode === 'SHOOTER') {
      this.mode = 'BRAWLER';
    } else {
      this.mode = 'PASSIVE';
    }
    this.attackTimer = 0;
    this.isChargingAttack = false;
    return this.mode;
  }

  setMode(newMode) {
    if (['PASSIVE', 'SHOOTER', 'BRAWLER'].includes(newMode)) {
      this.mode = newMode;
      this.attackTimer = 0;
      this.isChargingAttack = false;
    }
  }

  takeHit(damage = 10, hitAngle = 0, knockback = 0) {
    this.totalDamage += damage;
    const now = performance.now() / 1000;
    this.lastHitTime = now;

    // Apply wobble impulse perpendicular to hit angle
    this.wobbleVelocity = (Math.random() > 0.5 ? 1 : -1) * (damage * 0.08);

    // Physical displacement impulse
    if (knockback !== 0) {
      this.offsetVx += Math.cos(hitAngle) * knockback * 0.35;
      this.offsetVy += Math.sin(hitAngle) * knockback * 0.35;
    }

    // Track DPS over 3 second window
    this.dpsWindow.push({ time: now, damage });
  }

  pullTowards(targetX, targetY, strength = 35) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      this.offsetVx += (dx / dist) * strength * 14;
      this.offsetVy += (dy / dist) * strength * 14;
    }
    this.wobbleVelocity = -14;
  }

  applyStun(duration = 2.5) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.isChargingAttack = false;
  }

  update(dt, players = [], isAuthority = true) {
    const now = performance.now() / 1000;

    // Update stun
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.stunTimer = 0;
      }
    }

    // Find nearest valid target player
    let nearestTarget = null;
    let nearestDist = Infinity;
    for (const p of players) {
      if (!p) continue;
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestTarget = p;
      }
    }
    this.targetPlayer = nearestTarget;

    // Update combat AI if not stunned
    if (!this.isStunned && nearestTarget) {
      const dx = nearestTarget.x - this.x;
      const dy = nearestTarget.y - this.y;
      this.aimAngle = Math.atan2(dy, dx);

      if (this.mode === 'SHOOTER') {
        // SHOOTER MODE: Targets player and shoots glowing energy orbs every 2.4 seconds
        this.attackTimer += dt;
        this.isChargingAttack = this.attackTimer >= 1.4;

        if (this.attackTimer >= 2.4) {
          this.attackTimer = 0;
          this.isChargingAttack = false;
          if (isAuthority && this.onShoot) {
            this.onShoot({
              type: 'bot_energy_orb',
              caster: this,
              x: this.x + Math.cos(this.aimAngle) * 26,
              y: this.y + Math.sin(this.aimAngle) * 26,
              vx: Math.cos(this.aimAngle) * 620,
              vy: Math.sin(this.aimAngle) * 620,
              radius: 8,
              damage: 22,
              life: 2.2,
              angle: this.aimAngle,
              color: '#f59e0b'
            });
          }
        }
      } else if (this.mode === 'BRAWLER') {
        // BRAWLER MODE: Chases player and strikes within 65px every 1.7 seconds
        if (nearestDist > 55) {
          const moveSpeed = 160;
          this.baseX += Math.cos(this.aimAngle) * moveSpeed * dt;
          this.baseY += Math.sin(this.aimAngle) * moveSpeed * dt;
          // Constrain within dungeon arena
          this.baseX = Math.max(-480, Math.min(480, this.baseX));
          this.baseY = Math.max(-480, Math.min(480, this.baseY));
        }

        this.attackTimer += dt;
        this.isChargingAttack = this.attackTimer >= 1.1 && nearestDist <= 90;

        if (this.attackTimer >= 1.7) {
          this.attackTimer = 0;
          this.isChargingAttack = false;
          if (isAuthority && nearestDist <= 75 && this.onMeleeHit) {
            this.onMeleeHit(nearestTarget, 18, this.aimAngle);
          }
        }
      } else {
        this.attackTimer = 0;
        this.isChargingAttack = false;
      }
    } else {
      this.isChargingAttack = false;
    }

    // Damped spring physics for wobble animation
    const springForce = -this.wobbleAngle * 45;
    const damping = -this.wobbleVelocity * 7;
    this.wobbleVelocity += (springForce + damping) * dt;
    this.wobbleAngle += this.wobbleVelocity * dt;

    // Damped spring physics for displacement offset (returns to base position)
    const posSpring = 60;
    const posDamp = 8;
    this.offsetVx += (-this.offsetX * posSpring - this.offsetVx * posDamp) * dt;
    this.offsetVy += (-this.offsetY * posSpring - this.offsetVy * posDamp) * dt;
    this.offsetX += this.offsetVx * dt;
    this.offsetY += this.offsetVy * dt;

    this.x = this.baseX + this.offsetX;
    this.y = this.baseY + this.offsetY;

    // Clean up DPS window older than 3 seconds
    this.dpsWindow = this.dpsWindow.filter((entry) => now - entry.time <= 3);
    const sumDamage = this.dpsWindow.reduce((sum, e) => sum + e.damage, 0);
    this.dps = this.dpsWindow.length > 0 ? Math.round(sumDamage / 3) : 0;
  }

  draw(ctx, isPlayerNearby = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Drop shadow
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 6, this.radius * 1.1, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Aiming laser guide line if charging a shot in SHOOTER mode
    if (this.mode === 'SHOOTER' && this.isChargingAttack && !this.isStunned) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.aimAngle) * 450, Math.sin(this.aimAngle) * 450);
      ctx.stroke();
      ctx.restore();
    }

    // Rotate with wobble physics
    ctx.rotate(this.wobbleAngle);

    // Wooden post base
    ctx.fillStyle = this.mode === 'BRAWLER' ? '#334155' : '#78350f';
    ctx.strokeStyle = this.mode === 'BRAWLER' ? '#0f172a' : '#451a03';
    ctx.lineWidth = 2;
    ctx.fillRect(-6, -this.radius, 12, this.radius * 2);
    ctx.strokeRect(-6, -this.radius, 12, this.radius * 2);

    // Body: Straw or Iron Automaton Plate
    if (this.mode === 'BRAWLER') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#ef4444';
    } else if (this.mode === 'SHOOTER') {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#92400e';
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spiked pauldrons if Brawler
    if (this.mode === 'BRAWLER') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-this.radius - 4, -8, 8, 16);
      ctx.fillRect(this.radius - 4, -8, 8, 16);
    }

    // Cross-stitching target or glowing core
    if (this.mode === 'SHOOTER') {
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = this.isChargingAttack ? 18 : 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();
    }

    // Head
    ctx.fillStyle = this.mode === 'BRAWLER' ? '#1e293b' : '#b45309';
    ctx.beginPath();
    ctx.arc(0, -this.radius - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.mode === 'BRAWLER' ? '#ef4444' : '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing Eyes
    const eyeColor = this.mode === 'BRAWLER' ? '#ef4444' : (this.mode === 'SHOOTER' ? '#f59e0b' : '#38bdf8');
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(-4, -this.radius - 10, 3, 3);
    ctx.fillRect(1, -this.radius - 10, 3, 3);
    ctx.shadowBlur = 0;

    // Stunned spinning stars over head
    if (this.isStunned) {
      const starTime = performance.now() * 0.006;
      for (let s = 0; s < 3; s++) {
        const starAngle = starTime + (s * Math.PI * 2) / 3;
        const starX = Math.cos(starAngle) * 18;
        const starY = -this.radius - 22 + Math.sin(starAngle) * 7;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(starX, starY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();

    // Floating Mode and DPS UI above dummy
    ctx.save();
    ctx.translate(this.x, this.y - this.radius - 32);

    // Mode Pill Badge
    let modeBg = 'rgba(34, 197, 94, 0.85)';
    let modeText = 'MODE: PASSIVE';
    if (this.mode === 'SHOOTER') {
      modeBg = 'rgba(245, 158, 11, 0.9)';
      modeText = 'MODE: SHOOTER 🏹';
    } else if (this.mode === 'BRAWLER') {
      modeBg = 'rgba(239, 68, 68, 0.9)';
      modeText = 'MODE: BRAWLER ⚔️';
    }

    ctx.font = '800 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(modeText).width;
    ctx.fillStyle = modeBg;
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 8, -26, textWidth + 16, 18, [9]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(modeText, 0, -13);

    // Subtitle / Prompt
    if (isPlayerNearby) {
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('[T] CHANGE MODE', 0, -2);
    } else if (this.dps > 0) {
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${this.dps} DPS (${this.totalDamage} Total)`, 0, -2);
    } else {
      ctx.font = '500 10px "Outfit", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Smack or Press [T]', 0, -2);
    }

    ctx.restore();
  }
}
