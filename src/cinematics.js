/**
 * Cinematic Ultimate & Special FX Manager for Dungeon Slop
 * Renders full-screen anime ultimate animations, screen flashes,
 * dimensional slashes, camera shake, and animated projectile orbs.
 */

export class CinematicManager {
  constructor() {
    this.activeCinematics = []; // Array of active cinematics { type, timer, duration, caster, x, y, angle }
    this.projectiles = []; // e.g. Hollow Purple orbs, Dismantle wind blades, Spartan Kick
    this.screenShake = 0;
    this.shakeDecay = 8; // decay per second
  }

  spawnProjectile(proj) {
    if (!proj) return;
    this.projectiles.push({
      life: proj.life || 2.0,
      maxLife: proj.life || 2.0,
      ...proj
    });
  }

  get activeCinematic() {
    return this.activeCinematics[this.activeCinematics.length - 1] || null;
  }

  set activeCinematic(val) {
    if (!val) {
      this.activeCinematics = [];
    } else {
      this.activeCinematics.push(val);
    }
  }

  trigger(type, player, isRemote = false) {
    const now = performance.now() / 1000;

    if (type === 'hollow_purple') {
      // Gojo's Hollow Purple: Screen collapses into dark purple vortex,
      // then launches a massive 160px expanding sphere along player's aim angle!
      this.activeCinematics.push({
        type: 'hollow_purple',
        timer: 1.4,
        duration: 1.4,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle
      });
      this.addScreenShake(18);

      // Spawn Hollow Purple projectile
      const speed = 680;
      this.projectiles.push({
        type: 'hollow_purple',
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        radius: 48,
        maxRadius: 110,
        damage: 320,
        life: 1.6,
        color: '#c084fc',
        glow: '#a855f7'
      });
    } else if (type === 'world_cutting_slash') {
      // Sukuna's World Cutting Slash: Reality freezes in monochrome gray for 0.35s,
      // followed by a violent diagonal crimson dimensional rip bisecting the whole viewport
      this.activeCinematics.push({
        type: 'world_cutting_slash',
        timer: 1.2,
        duration: 1.2,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle
      });
      this.addScreenShake(26);

      // Spawn expanding dimensional cut wave
      const speed = 820;
      this.projectiles.push({
        type: 'world_cutting_slash',
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        width: 220,
        radius: 110, // Full width collision coverage
        damage: 350,
        life: 1.0,
        angle: player.angle
      });
    } else if (type === 'inverted_chain_rampage') {
      // Toji's Thousand-Mile Chain Whirlwind: 360-degree high-velocity iron chain storm
      this.activeCinematics.push({
        type: 'inverted_chain_rampage',
        timer: 1.2,
        duration: 1.2,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle
      });
      this.addScreenShake(14);
    } else if (type === 'berserker_rage') {
      // Guts' Berserker Beast Armor: Blood-red pulsing vignette, high mitigation,
      // unstoppable immunity to stun/knockback, life steal, and colossal CLANG ground ruptures
      player.isInvulnerable = false; // Damageable so Life Steal can restore lost HP!
      player.isBerserk = true;
      player.berserkTimer = 6.0;
      player.currentSpeed = player.baseSpeed * 1.55;
      this.activeCinematics.push({
        type: 'berserker_rage',
        timer: 6.0,
        duration: 6.0,
        caster: player,
        isRemote: !!isRemote,
        player
      });
      this.addScreenShake(22);

      setTimeout(() => {
        if (player) {
          player.isInvulnerable = false;
          player.isBerserk = false;
          player.currentSpeed = player.baseSpeed;
        }
      }, 6000);
    } else if (type === 'spartan_kick') {
      // Toji's Spartan Kick: Heavy forward shockwave projectile with STUN
      this.addScreenShake(16);
      this.projectiles.push({
        type: 'spartan_kick',
        caster: player,
        isRemote: !!isRemote,
        x: player.x + Math.cos(player.angle) * 36,
        y: player.y + Math.sin(player.angle) * 36,
        vx: Math.cos(player.angle) * 780,
        vy: Math.sin(player.angle) * 780,
        radius: 44,
        damage: 85,
        isStun: true,
        stunDuration: 2.5,
        life: 0.32,
        angle: player.angle
      });
    } else if (type === 'dismantle') {
      // Sukuna's Base Q Dismantle: 3 rapid curved razor wind slashes
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = player.angle + i * 0.18;
        this.projectiles.push({
          type: 'dismantle',
          caster: player,
          isRemote: !!isRemote,
          x: player.x,
          y: player.y,
          vx: Math.cos(spreadAngle) * 720,
          vy: Math.sin(spreadAngle) * 720,
          radius: 36,
          damage: 55,
          life: 0.38,
          angle: spreadAngle
        });
      }
    } else if (type === 'cannon_arm') {
      // Guts' Base Q Prosthetic Arm Cannon: High explosive projectile
      this.addScreenShake(20);
      this.projectiles.push({
        type: 'cannon_arm',
        caster: player,
        isRemote: !!isRemote,
        x: player.x + Math.cos(player.angle) * 30,
        y: player.y + Math.sin(player.angle) * 30,
        vx: Math.cos(player.angle) * 650,
        vy: Math.sin(player.angle) * 650,
        radius: 38,
        damage: 140,
        life: 0.45
      });
    } else if (type === 'limitless_barrier') {
      // Gojo's Base Q Limitless Barrier (Mugen): Tightly wrapping spatial barrier almost touching him
      this.activeCinematics.push({
        type: 'limitless_barrier',
        caster: player,
        isRemote: !!isRemote,
        timer: 3.5,
        duration: 3.5,
        radius: 36, // Tight barrier shell almost touching Gojo's skin!
        trappedProjectiles: [],
        hasRepelled: false
      });
      this.addScreenShake(6);
    } else if (type === 'odm_gas_boost') {
      // Levi Base Q: ODM Gas Boost high-pressure forward steam blast
      this.addScreenShake(8);
      this.projectiles.push({
        type: 'odm_gas_boost',
        caster: player,
        isRemote: !!isRemote,
        x: player.x + Math.cos(player.angle) * 28,
        y: player.y + Math.sin(player.angle) * 28,
        vx: Math.cos(player.angle) * 780,
        vy: Math.sin(player.angle) * 780,
        radius: 40,
        damage: 45,
        knockback: 520,
        life: 0.25,
        angle: player.angle
      });
    } else if (type === 'levi_grapple_whirlwind') {
      // Levi Full Set Q: Dual High-Tension Grapple Wires (Unlimited Reach, Max 2 Cables)
      // Reeling in at high velocity; only spins once he hits an enemy!
      const reach = 980; // unlimited cross-arena line-of-sight reach
      const targetAngle = player.angle;
      const anchorX = player.x + Math.cos(targetAngle) * reach;
      const anchorY = player.y + Math.sin(targetAngle) * reach;

      this.activeCinematics.push({
        type: 'levi_grapple_whirlwind',
        caster: player,
        isRemote: !!isRemote,
        timer: 2.2,
        duration: 2.2,
        x: player.x,
        y: player.y,
        anchorX,
        anchorY,
        cable1: {
          endX: anchorX - Math.sin(targetAngle) * 18,
          endY: anchorY + Math.cos(targetAngle) * 18
        },
        cable2: {
          endX: anchorX + Math.sin(targetAngle) * 18,
          endY: anchorY - Math.cos(targetAngle) * 18
        },
        phase: 'zipping', // 'zipping' -> 'spinning' -> 'finished'
        spinTimer: 0,
        spinDuration: 0.85,
        hitMap: new Map()
      });
      this.addScreenShake(14);
    } else if (type === 'sandevistan') {
      // David Martinez: Military-Grade Sandevistan Overclock!
      // Full-screen cyberpunk matrix post-processing for 4.0s
      this.activeCinematics.push({
        type: 'sandevistan',
        timer: 4.0,
        duration: 4.0,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y
      });
      this.addScreenShake(12);
    } else if (type === 'overcharge_boost') {
      // David Martinez Base Q: Overcharge Boost speed burst
      this.activeCinematics.push({
        type: 'overcharge_boost',
        timer: 0.6,
        duration: 0.6,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y
      });
      this.addScreenShake(6);
    }
    this.shakeDecay = 16.0;
  }

  spawnProjectile(proj) {
    if (!proj) return;
    const speed = Math.hypot(proj.vx || 0, proj.vy || 0);
    const life = proj.life || (proj.maxDist && speed > 0 ? proj.maxDist / speed : 2.5);
    this.projectiles.push({
      type: proj.type || 'bot_energy_orb',
      x: proj.x || 0,
      y: proj.y || 0,
      vx: proj.vx || 0,
      vy: proj.vy || 0,
      damage: proj.damage || 15,
      caster: proj.caster || null,
      color: proj.color || '#a855f7',
      radius: proj.radius || 10,
      life: life,
      maxLife: life,
      maxDist: proj.maxDist || 500,
      angle: proj.angle !== undefined ? proj.angle : Math.atan2(proj.vy || 0, proj.vx || 1),
      isRemote: !!proj.isRemote,
      hasHit: false
    });
  }

  addScreenShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  getShakeOffset() {
    if (this.screenShake <= 0.1) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake * 2,
      y: (Math.random() - 0.5) * this.screenShake * 2
    };
  }

  update(dt, targets = [], onHitCallback = null) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - this.shakeDecay * dt * this.screenShake);
    }

    // Active full-screen cinematics & continuous hit detection
    for (let cIdx = this.activeCinematics.length - 1; cIdx >= 0; cIdx--) {
      const c = this.activeCinematics[cIdx];
      c.timer -= dt;

      // Toji's Inverted Chain Whirlwind continuous hit detection locked on caster (LOCAL only!)
      if (c.type === 'inverted_chain_rampage' && !c.isRemote) {
        const posX = c.caster ? c.caster.x : c.x;
        const posY = c.caster ? c.caster.y : c.y;
        for (const target of targets) {
          if (!target || target === c.caster) continue;
          const dx = target.x - posX;
          const dy = target.y - posY;
          const dist = Math.hypot(dx, dy);
          if (dist <= 145) {
            if (!c.lastHitMap) c.lastHitMap = new Map();
            const lastHit = c.lastHitMap.get(target) || 0;
            const now = performance.now();
            if (now - lastHit >= 220) {
              c.lastHitMap.set(target, now);
              if (onHitCallback) {
                onHitCallback(target, {
                  type: 'whirlwind',
                  damage: 55,
                  angle: Math.atan2(dy, dx),
                  knockback: 450
                });
              }
            }
          }
        }
      }

      // Gojo's Limitless Infinity Barrier: Traps nearby projectiles and blasts them outward upon expiration
      if (c.type === 'limitless_barrier') {
        const posX = c.caster ? c.caster.x : c.x;
        const posY = c.caster ? c.caster.y : c.y;

        // Trap any active projectiles within barrier radius!
        for (const proj of this.projectiles) {
          if (proj.trappedBy === c.caster) continue;
          if (proj.caster === c.caster && !proj.isRepelled) continue;

          const dx = proj.x - posX;
          const dy = proj.y - posY;
          const dist = Math.hypot(dx, dy);
          const trapRadius = (c.radius || 40) + (proj.radius || 8);
          if (dist <= trapRadius) {
            proj.trappedBy = c.caster;
            proj.trappedDist = Math.max(26, Math.min(38, dist));
            proj.trappedAngle = Math.atan2(dy, dx);
            proj.originalSpeed = Math.hypot(proj.vx, proj.vy) || 1200;
            proj.vx = 0;
            proj.vy = 0;
            proj.life = Math.max(proj.life, c.timer + 1.2);
            if (!c.trappedProjectiles.includes(proj)) {
              c.trappedProjectiles.push(proj);
            }
          }
        }

        // Orbit and freeze trapped projectiles closely around Gojo (almost touching)
        for (const proj of c.trappedProjectiles) {
          if (proj.trappedBy === c.caster) {
            proj.trappedAngle = (proj.trappedAngle || 0) + dt * 2.5;
            proj.x = posX + Math.cos(proj.trappedAngle) * (proj.trappedDist || 30);
            proj.y = posY + Math.sin(proj.trappedAngle) * (proj.trappedDist || 30);
            proj.vx = 0;
            proj.vy = 0;
          }
        }

        // When the barrier expires -> VIOLENT LIMITLESS REPULSION BLAST TOWARD CURSOR!
        if (c.timer <= 0.05 && !c.hasRepelled) {
          c.hasRepelled = true;
          this.addScreenShake(18);
          if (c.caster) {
            c.caster.isInvulnerable = false;
            c.caster.isLimitlessBarrier = false;
            c.caster.currentSpeed = c.caster.baseSpeed;
          }

          // Launch all trapped projectiles back at the cursor direction!
          const targetAngle = (c.caster && c.caster.angle !== undefined)
            ? c.caster.angle
            : (c.trappedProjectiles.length > 0 ? Math.atan2(c.trappedProjectiles[0].y - posY, c.trappedProjectiles[0].x - posX) : 0);

          const totalTrapped = c.trappedProjectiles.length;
          c.trappedProjectiles.forEach((proj, idx) => {
            const spread = totalTrapped > 1 ? (idx - (totalTrapped - 1) / 2) * 0.12 : 0;
            const fireAngle = targetAngle + spread;
            const repelSpeed = Math.max(1300, (proj.originalSpeed || 1000) * 1.6);
            proj.x = posX + Math.cos(fireAngle) * 34;
            proj.y = posY + Math.sin(fireAngle) * 34;
            proj.vx = Math.cos(fireAngle) * repelSpeed;
            proj.vy = Math.sin(fireAngle) * repelSpeed;
            proj.angle = fireAngle;
            proj.caster = c.caster;
            proj.damage = Math.round((proj.damage || 14) * 1.85);
            proj.life = 0.55;
            proj.trappedBy = null;
            proj.hasHit = false;
            proj.isRepelled = true;
            proj.isRemote = c.isRemote;
          });

          // Physical shockwave on nearby enemies/dummies/players
          if (!c.isRemote && onHitCallback) {
            for (const target of targets) {
              if (!target || target === c.caster) continue;
              const dx = target.x - posX;
              const dy = target.y - posY;
              const dist = Math.hypot(dx, dy);
              if (dist <= 165) {
                onHitCallback(target, {
                  type: 'limitless_repulsion',
                  damage: 75,
                  angle: Math.atan2(dy, dx),
                  knockback: 1050
                });
              }
            }
          }
        }
      }

      // 4. Levi's Dual Grapple Wires & 360° Blade Whirlwind
      if (c.type === 'levi_grapple_whirlwind') {
        const caster = c.caster;
        if (c.phase === 'zipping') {
          // Levi reels towards the anchor along the wire trajectory at high velocity
          const currentX = caster ? caster.x : c.x;
          const currentY = caster ? caster.y : c.y;
          const dx = c.anchorX - currentX;
          const dy = c.anchorY - currentY;
          const dist = Math.hypot(dx, dy);

          if (dist > 35 && caster) {
            const step = Math.min(dist, 1100 * dt);
            caster.x += (dx / dist) * step;
            caster.y += (dy / dist) * step;
            caster.angle = Math.atan2(dy, dx);
            c.x = caster.x;
            c.y = caster.y;

            // Spawn green and white ODM steam exhaust after-images
            if (caster.afterImages && Math.random() < 0.65) {
              caster.afterImages.push({
                x: caster.x,
                y: caster.y,
                angle: caster.angle,
                color: '#10b981',
                alpha: 0.55
              });
            }

            // CHECK ENEMY COLLISION: ONLY SPINS ONCE HE HITS AN ENEMY!
            if (!c.isRemote) {
              for (const target of targets) {
                if (!target || target === caster) continue;
                const tdx = target.x - caster.x;
                const tdy = target.y - caster.y;
                const tdist = Math.hypot(tdx, tdy);
                const hitRadius = (target.radius || 24) + 36;

                if (tdist <= hitRadius) {
                  // HIT AN ENEMY! Switch immediately to 360° spinning blade whirlwind!
                  c.phase = 'spinning';
                  c.spinTimer = c.spinDuration;
                  c.spinningTarget = target;
                  this.addScreenShake(18);
                  if (onHitCallback) {
                    onHitCallback(target, {
                      type: 'levi_whirlwind',
                      damage: 75,
                      angle: Math.atan2(tdy, tdx),
                      knockback: 200,
                      isFirstHit: true
                    });
                  }
                  break;
                }
              }
            }
          } else {
            // Reached anchor without hitting an enemy -> zip finished
            c.phase = 'finished';
            c.timer = 0;
          }
        } else if (c.phase === 'spinning') {
          // Continuous 360° high-speed rotational blade whirlwind locked on the hit enemy!
          c.spinTimer -= dt;
          const posX = caster ? caster.x : c.x;
          const posY = caster ? caster.y : c.y;

          if (caster) {
            caster.angle += dt * 32; // 360° spin at high angular velocity!
          }

          if (!c.isRemote && onHitCallback) {
            for (const target of targets) {
              if (!target || target === caster) continue;
              const dx = target.x - posX;
              const dy = target.y - posY;
              const dist = Math.hypot(dx, dy);

              if (dist <= 95) {
                if (!c.hitMap) c.hitMap = new Map();
                const lastHit = c.hitMap.get(target) || 0;
                const now = performance.now();
                if (now - lastHit >= 110) { // slice tick every 110ms
                  c.hitMap.set(target, now);
                  onHitCallback(target, {
                    type: 'levi_whirlwind',
                    damage: 65,
                    angle: Math.atan2(dy, dx),
                    knockback: 180
                  });
                }
              }
            }
          }

          if (c.spinTimer <= 0) {
            c.phase = 'finished';
            c.timer = 0;
          }
        }
      }

      if (c.timer <= 0 || c.phase === 'finished') {
        this.activeCinematics.splice(cIdx, 1);
      }
    }

    // Update projectiles & hit detection
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life = (proj.life !== undefined && !isNaN(proj.life)) ? proj.life - dt : -1;

      // Expand projectile radius if applicable (Hollow Purple)
      if (proj.radius && proj.maxRadius) {
        proj.radius = Math.min(proj.maxRadius, proj.radius + 45 * dt);
      }

      // Check collision with targets (ONLY local projectiles, NEVER remote projectiles!)
      if (!proj.isRemote) {
        for (const target of targets) {
          if (!target || target === proj.caster) continue;
          // Monsters do not shoot or hit fellow monsters
          if (proj.caster && proj.caster.roomId !== undefined && target.roomId !== undefined) continue;
          if (proj.trappedBy === target) continue; // Trapped in Gojo's Mugen: deals 0 damage, cannot hit!
          if (target.isLimitlessBarrier && !proj.isRepelled) continue; // Barrier active: completely protects target!

          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const dist = Math.hypot(dx, dy);
          const hitRadius = (proj.radius || (proj.width ? proj.width * 0.5 : 40)) + (target.radius || 24);

          if (dist <= hitRadius && !proj.hasHit) {
            proj.hasHit = true;
            if (proj.type === 'shotgun_pellet') {
              proj.life = 0; // Pellet is consumed on hit
            }
            if (onHitCallback) {
              onHitCallback(target, proj);
            }
          }
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * Draws world-space cinematic effects (projectiles, slashes, chain whirlwinds)
   */
  drawWorld(ctx) {
    // 1. Draw Projectiles
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);

      if (proj.type === 'hollow_purple') {
        // Glowing Singularity Core + Outward Crackling Rays
        const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.12;
        const r = proj.radius * pulse;

        // Outer Dark Purple Gravity Well
        const grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, '#c084fc');
        grad.addColorStop(0.65, '#9333ea');
        grad.addColorStop(1, 'rgba(30, 10, 60, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // High Voltage Core
        ctx.fillStyle = '#fdf4ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting energy streaks
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, Date.now() * 0.01, Date.now() * 0.01 + Math.PI);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, -Date.now() * 0.015, -Date.now() * 0.015 + Math.PI);
        ctx.stroke();
      } else if (proj.type === 'world_cutting_slash') {
        // Razor sharp dimensional rip blade
        ctx.rotate(proj.angle);
        ctx.strokeStyle = '#ff2a5f';
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 28;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-110, 0);
        ctx.lineTo(110, 0);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-90, 0);
        ctx.lineTo(90, 0);
        ctx.stroke();
      } else if (proj.type === 'dismantle') {
        // Red curved wind blade
        ctx.rotate(proj.angle);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 36, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      } else if (proj.type === 'cannon_arm') {
        // Explosive shell fireball
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'spartan_kick') {
        // Concussive sonic boom kick shockwave cone
        ctx.rotate(proj.angle);
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 22;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-24, -22);
        ctx.moveTo(14, 0);
        ctx.lineTo(-24, 22);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      } else if (proj.type === 'bot_energy_orb') {
        // Sleek, compact arcane / cursed energy dart
        const r = proj.radius || 8;
        const col = proj.color || '#f59e0b';
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Core spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Trapped in Infinity visual ring
        if (proj.trappedBy) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (proj.type === 'odm_gas_boost') {
        // High-velocity steam puff cone
        ctx.rotate(proj.angle);
        ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      } else if (proj.type === 'shotgun_pellet') {
        const isTrapped = !!proj.trappedBy;
        const isRepelled = !!proj.isRepelled;

        if (isTrapped) {
          // Trapped in Gojo's Mugen Infinity Barrier:
          // Micro-shiver with spatial tension
          const jitterX = (Math.random() - 0.5) * 1.6;
          const jitterY = (Math.random() - 0.5) * 1.6;
          ctx.translate(jitterX, jitterY);

          // Glowing cyan spatial distortion compression ring
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
          ctx.stroke();

          // Frozen hot-lead pellet core
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Flying bullet tracer streak
          const moveAngle = Math.atan2(proj.vy, proj.vx);
          const speed = Math.hypot(proj.vx, proj.vy);
          const streakLen = Math.min(26, Math.max(10, speed * 0.016));

          ctx.rotate(moveAngle);

          // Cursed Energy Infused (if repelled by Gojo) vs Normal Carnage Lead Slug
          const coreColor = isRepelled ? '#38bdf8' : (proj.isCrit ? '#ef4444' : '#fbbf24');
          const glowColor = isRepelled ? '#00f0ff' : (proj.isCrit ? '#ff0055' : '#f59e0b');

          // High-velocity tracer streak tail
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-streakLen, 0);
          ctx.stroke();

          // White-hot lead core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Glowing tip core
          ctx.fillStyle = coreColor;
          ctx.beginPath();
          ctx.arc(1, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (proj.type === 'bot_laser_bolt') {
        // Cyberpunk: Tyger Claw High-Velocity Laser Bolt
        const moveAngle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(moveAngle);

        // Outer cyan laser glow
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-20, 0);
        ctx.stroke();

        // Inner white-hot laser core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-14, 0);
        ctx.stroke();

        // High-energy pink plasma discharge tip
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(12, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'bot_micro_missile') {
        // Cyberpunk: Adam Smasher Micro-Missile
        const moveAngle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(moveAngle);

        // Fiery exhaust trail
        const flameLen = 14 + Math.random() * 8;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-7, -2.5);
        ctx.lineTo(-7 - flameLen, 0);
        ctx.lineTo(-7, 2.5);
        ctx.closePath();
        ctx.fill();

        // Stabilizer tail fins
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(-8, -6.5);
        ctx.lineTo(-3, -3);
        ctx.moveTo(-5, 3);
        ctx.lineTo(-8, 6.5);
        ctx.lineTo(-3, 3);
        ctx.fill();

        // Titanium missile fuselage
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-7, -3, 14, 6);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, -3, 14, 6);

        // Red high-explosive warhead cone
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(7, -3);
        ctx.lineTo(13, 0);
        ctx.lineTo(7, 3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Toji's Inverted Chain Rampage Whirlwind in world (locked to caster position!)
    for (const c of this.activeCinematics) {
      if (c.type === 'inverted_chain_rampage') {
        const posX = c.caster ? c.caster.x : c.x;
        const posY = c.caster ? c.caster.y : c.y;
        const progress = 1 - c.timer / c.duration;
        const sweepAngle = progress * Math.PI * 8; // spins 4 complete revolutions!
        const maxRange = 135;

        ctx.save();
        ctx.translate(posX, posY);

        // Glowing Iron Chain Arc
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, maxRange, sweepAngle - Math.PI * 0.9, sweepAngle);
        ctx.stroke();

        // Chain links
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, maxRange * 0.8, sweepAngle - Math.PI * 0.7, sweepAngle);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inverted Spear tip at end of chain
        const tipX = Math.cos(sweepAngle) * maxRange;
        const tipY = Math.sin(sweepAngle) * maxRange;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (c.type === 'limitless_barrier') {
        // Gojo's Limitless Spatial Distortion field - tight barrier shell almost touching him!
        const posX = c.caster ? c.caster.x : c.x;
        const posY = c.caster ? c.caster.y : c.y;
        const progress = 1 - c.timer / c.duration;

        ctx.save();
        ctx.translate(posX, posY);

        const pulse = Math.sin(Date.now() * 0.016) * 2;
        const barR = (c.radius || 36) + pulse;

        // Outer sleek glowing cyan barrier ring
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.95)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, barR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing spatial film
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, barR * 0.85, -progress * 6, -progress * 6 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      } else if (c.type === 'levi_grapple_whirlwind') {
        const posX = c.caster ? c.caster.x : c.x;
        const posY = c.caster ? c.caster.y : c.y;

        // 1. Draw Dual High-Tension Grapple Wires from hips to anchor points
        ctx.save();
        // Left Cable
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(c.cable1.endX, c.cable1.endY);
        ctx.stroke();

        // Right Cable
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(c.cable2.endX, c.cable2.endY);
        ctx.stroke();

        // Taut core shine on cables
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(c.cable1.endX, c.cable1.endY);
        ctx.moveTo(posX, posY);
        ctx.lineTo(c.cable2.endX, c.cable2.endY);
        ctx.stroke();

        // Anchor piton pins in ground
        ctx.fillStyle = '#475569';
        ctx.fillRect(c.cable1.endX - 3, c.cable1.endY - 3, 6, 6);
        ctx.fillRect(c.cable2.endX - 3, c.cable2.endY - 3, 6, 6);
        ctx.restore();

        // 2. When in 'spinning' phase: Draw the violent 360° blade whirlwind circle!
        if (c.phase === 'spinning') {
          ctx.save();
          ctx.translate(posX, posY);

          const spinProgress = 1 - c.spinTimer / c.spinDuration;
          const spinAngle = spinProgress * Math.PI * 16; // 8 full revolutions!

          // Outer Emerald Wind Vortex
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 22;
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.arc(0, 0, 78, spinAngle, spinAngle + Math.PI * 1.3);
          ctx.stroke();

          // Inner Gleaming Silver Blade Whirlwind
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 62, -spinAngle, -spinAngle + Math.PI * 1.5);
          ctx.stroke();

          // Dual spinning blade silhouettes
          ctx.rotate(spinAngle);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-65, -3, 130, 6);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-70, -2, 140, 4);

          ctx.restore();
        }
      }
    }
  }

  /**
   * Draws full-screen canvas overlays (Post-Processing Vignettes, Screen Slices, Color Tinting)
   */
  drawScreenOverlay(ctx, width, height) {
    if (this.activeCinematics.length === 0) return;

    for (const c of this.activeCinematics) {
      const progress = 1 - c.timer / c.duration;

      if (c.type === 'hollow_purple') {
        // Screen collapses into dark purple cosmic vignette
        const alpha = Math.sin(progress * Math.PI) * 0.65;
        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.75);
        grad.addColorStop(0, 'rgba(147, 51, 234, 0)');
        grad.addColorStop(1, `rgba(45, 10, 80, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Electric flash on launch
        if (progress < 0.25) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.25 - progress) * 1.5})`;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      } else if (c.type === 'world_cutting_slash') {
        // 1. Reality freeze: Desaturate / darken screen
        ctx.save();
        if (progress < 0.35) {
          ctx.fillStyle = 'rgba(15, 15, 25, 0.45)';
          ctx.fillRect(0, 0, width, height);
        } else {
          // 2. Full-screen diagonal dimensional slash bisecting the screen!
          const slashProgress = (progress - 0.35) / 0.65;
          const slashAlpha = Math.max(0, 1 - slashProgress);

          ctx.strokeStyle = `rgba(255, 42, 95, ${slashAlpha})`;
          ctx.lineWidth = 14;
          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 32;

          ctx.beginPath();
          ctx.moveTo(0, height * 0.15);
          ctx.lineTo(width, height * 0.85);
          ctx.stroke();

          // White core cut line
          ctx.strokeStyle = `rgba(255, 255, 255, ${slashAlpha * 1.2})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, height * 0.15);
          ctx.lineTo(width, height * 0.85);
          ctx.stroke();

          // Shift canvas halves slightly along the cut
          ctx.fillStyle = `rgba(255, 0, 80, ${slashAlpha * 0.15})`;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      } else if (c.type === 'berserker_rage') {
        // Pulsing blood-red vignette around screen edges
        const pulse = 0.35 + Math.sin(Date.now() * 0.008) * 0.2;
        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(220, 20, 20, ${pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else if (c.type === 'levi_grapple_whirlwind') {
        // Emerald Scout speedline vignette
        const pulse = 0.25 + Math.sin(Date.now() * 0.02) * 0.12;
        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.75);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(16, 185, 129, ${pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else if (c.type === 'sandevistan') {
        // David Martinez Sandevistan: Cyberpunk matrix grid overlay with scanlines & chromatic aberration
        const pulse = 0.3 + Math.sin(Date.now() * 0.012) * 0.12;
        ctx.save();

        // 1. Neon green/cyan vignette border
        const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.72);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.7, 'rgba(0, 20, 10, 0.15)');
        grad.addColorStop(1, `rgba(0, 255, 136, ${pulse * 0.45})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Horizontal scanlines (subtle CRT effect)
        ctx.fillStyle = 'rgba(0, 255, 136, 0.04)';
        const scanSpacing = 4;
        const scanOffset = (Date.now() * 0.15) % scanSpacing;
        for (let y = scanOffset; y < height; y += scanSpacing) {
          ctx.fillRect(0, y, width, 1);
        }

        // 3. Matrix grid overlay (very subtle)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
        ctx.lineWidth = 0.5;
        const gridSize = 48;
        const gridScrollX = (Date.now() * 0.02) % gridSize;
        const gridScrollY = (Date.now() * 0.015) % gridSize;
        for (let gx = -gridScrollX; gx < width; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();
        }
        for (let gy = -gridScrollY; gy < height; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }

        // 4. Chromatic aberration color fringe along screen borders
        const fringeWidth = 4 + Math.sin(Date.now() * 0.02) * 2;
        // Left edge: Red fringe
        ctx.fillStyle = `rgba(255, 50, 50, ${pulse * 0.25})`;
        ctx.fillRect(0, 0, fringeWidth, height);
        // Right edge: Cyan fringe
        ctx.fillStyle = `rgba(0, 240, 255, ${pulse * 0.25})`;
        ctx.fillRect(width - fringeWidth, 0, fringeWidth, height);
        // Top edge: Green fringe
        ctx.fillStyle = `rgba(0, 255, 136, ${pulse * 0.2})`;
        ctx.fillRect(0, 0, width, fringeWidth * 0.7);
        // Bottom edge: Magenta fringe
        ctx.fillStyle = `rgba(200, 0, 255, ${pulse * 0.18})`;
        ctx.fillRect(0, height - fringeWidth * 0.7, width, fringeWidth * 0.7);

        // 5. Digital timer HUD overlay
        const timeRemaining = c.timer.toFixed(1);
        ctx.font = '900 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 14;
        ctx.fillText(`\u26a1 SANDEVISTAN OVERCLOCK [${timeRemaining}s]`, width / 2, 42);
        ctx.shadowBlur = 0;

        // Subtle pulsing border frame
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.3 + Math.sin(Date.now() * 0.008) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, width - 16, height - 16);

        // Initial activation flash
        if (progress < 0.08) {
          ctx.fillStyle = `rgba(0, 255, 136, ${(0.08 - progress) * 6})`;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();
      } else if (c.type === 'overcharge_boost') {
        // David Martinez Overcharge: Brief neon green electric flash
        const flashAlpha = Math.sin(progress * Math.PI) * 0.35;
        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
        grad.addColorStop(0, `rgba(0, 255, 136, ${flashAlpha})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }
}
