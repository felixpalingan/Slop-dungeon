/**
 * Cinematic Ultimate & Special FX Manager for Dungeon Slop
 * Renders full-screen anime ultimate animations, screen flashes,
 * dimensional slashes, camera shake, and animated projectile orbs.
 */

export class CinematicManager {
  constructor(settings = null) {
    this.settings = settings;
    this.audio = settings?.audio || null;
    this.activeCinematics = []; // Array of active cinematics { type, timer, duration, caster, x, y, angle }
    this.projectiles = []; // e.g. Hollow Purple orbs, Dismantle wind blades, Spartan Kick
    this.screenShake = 0;
    this.shakeDecay = 8; // decay per second
  }

  isSeriousPunchFreezing() {
    return this.activeCinematics.some(c => c.type === 'serious_punch' && (1 - (c.timer / c.duration)) < 0.30);
  }

  isWorldCuttingSlashFreezing() {
    return this.activeCinematics.some(c => c.type === 'world_cutting_slash' && (1 - (c.timer / c.duration)) < 0.28);
  }

  isLeviOverdriveFreezing() {
    return this.activeCinematics.some(c => c.type === 'levi_grapple_whirlwind' && (1 - (c.timer / c.duration)) < 0.06);
  }

  isHollowPurpleFreezing() {
    return this.activeCinematics.some(c => c.type === 'hollow_purple' && (1 - (c.timer / c.duration)) < 0.30);
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
      // Gojo's Hollow Purple (虚式「茈」):
      // Phase 1 (0.0s - 0.45s): Reality freezes as Lapse Blue (Left) & Reversal Red (Right)
      //   converge into an Imaginary Mass singularity with Six Eyes & Nine Ropes chant!
      // Phase 2 (0.45s - 1.5s): Launches a colossal expanding singularity sphere that
      //   gravitationally pulls nearby enemies into its core and leaves an erased cosmic trench!
      this.activeCinematics.push({
        type: 'hollow_purple',
        timer: 1.5,
        duration: 1.5,
        caster: player,
        isRemote: !!isRemote,
        x: player ? player.x : 0,
        y: player ? player.y : 0,
        angle: player ? player.angle : 0,
        hasFired: false
      });
      this.addScreenShake(18);
    } else if (type === 'world_cutting_slash') {
      // Sukuna's World Cutting Slash (世界を断つ斬撃):
      // Phase 1 (0.0s - 0.36s): Reality freezes in dark crimson/abyssal void ink.
      //   Incantation chant 「龍鱗・反発・番の流星」, 4 glowing demonic eyes & Dismantle grid.
      // Phase 2 (0.36s - 1.3s): Cataclysmic Colossal Dimensional Fissure CONE (94° angle,
      //   expanding multi-arc spatial rips, pierces all obstacles, 380 True Damage)!
      this.activeCinematics.push({
        type: 'world_cutting_slash',
        timer: 1.3,
        duration: 1.3,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle,
        hasFired: false
      });
      this.addScreenShake(18);
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
      // Levi Full Set Ultimate Q: ODM Overdrive (立体機動・限界突破)
      // Phase 1 (0.0s - 0.36s): Reality freezes with Wings of Freedom emblem & 「心臓を捧げよ」 cut-in!
      // Phase 2 (0.36s - 6.0s): 6.0s Unlimited Gas (∞), +45% grapple speed, and supercharged 155+ pass-through slice damage!
      if (player) {
        player.isOdmMode = true;
        player.isOdmOverdrive = true;
        player.odmOverdriveTimer = 6.0;
        player.odmGas = player.maxOdmGas || 100;
      }

      this.activeCinematics.push({
        type: 'levi_grapple_whirlwind',
        caster: player,
        isRemote: !!isRemote,
        timer: 6.0,
        duration: 6.0,
        x: player ? player.x : 0,
        y: player ? player.y : 0,
        angle: player ? player.angle : 0,
        hasFired: false,
        hitMap: new Map()
      });
      this.addScreenShake(18);
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
    } else if (type === 'consecutive_normal_punches') {
      // Saitama Base Q: Consecutive Normal Punches
      this.activeCinematics.push({
        type: 'consecutive_normal_punches',
        timer: 0.6,
        duration: 0.6,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle,
        punchesFired: 0
      });
      this.addScreenShake(8);
    } else if (type === 'serious_punch') {
      // Saitama Set Ultimate Q: Serious Punch (0.45s monochrome ink freeze -> 400 True Damage beam)
      this.activeCinematics.push({
        type: 'serious_punch',
        timer: 1.5,
        duration: 1.5,
        caster: player,
        isRemote: !!isRemote,
        x: player.x,
        y: player.y,
        angle: player.angle,
        hasFired: false
      });
      this.addScreenShake(28);
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
      width: proj.width || (proj.radius ? proj.radius * 2 : 20),
      piercesObstacles: !!proj.piercesObstacles || proj.type === 'hollow_purple' || proj.type === 'serious_punch_beam' || proj.type === 'world_cutting_slash',
      knockback: proj.knockback || 0,
      life: life,
      maxLife: life,
      maxDist: proj.maxDist || 500,
      angle: proj.angle !== undefined ? proj.angle : Math.atan2(proj.vy || 0, proj.vx || 1),
      isRemote: !!proj.isRemote,
      hasHit: false,
      hitTargets: new Set()
    });
  }

  addScreenShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  getShakeOffset() {
    const mult = this.settings ? this.settings.getScreenShakeMultiplier() : 1.0;
    if (this.screenShake <= 0.1 || mult <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake * 2 * mult,
      y: (Math.random() - 0.5) * this.screenShake * 2 * mult
    };
  }

  _distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  update(dt, targets = [], onHitCallback = null, obstacles = [], onObstacleHitCallback = null, timeScale = 1.0) {
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
            if (proj.hitTargets) proj.hitTargets.clear();
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
            if (proj.hitTargets) proj.hitTargets.clear();
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

      // 4. Levi's ODM Overdrive (Wings of Freedom Cut-In -> 6.0s Unlimited Gas + Supercharged Blade Vortex)
      if (c.type === 'levi_grapple_whirlwind') {
        const caster = c.caster;
        const progress = 1 - (c.timer / c.duration);
        if (caster) {
          c.x = caster.x;
          c.y = caster.y;
          c.angle = caster.angle;
          caster.isOdmMode = true;
          caster.isOdmOverdrive = true;
          caster.odmOverdriveTimer = Math.max(0, c.timer);
          caster.odmGas = caster.maxOdmGas || 100;
        }

        if (progress >= 0.06 && !c.hasFired) {
          c.hasFired = true;
          this.addScreenShake(26);
          if (this.audio?.playLeviOverdriveImpact) {
            this.audio.playLeviOverdriveImpact();
          } else if (this.audio?.playOdmGasHiss) {
            this.audio.playOdmGasHiss();
          }
        }

        // When un-frozen in Overdrive, if airborne or moving via ODM cables, shred nearby targets!
        if (progress >= 0.06 && !c.isRemote && onHitCallback && caster && (caster.isAirborne || (caster.activeCables && caster.activeCables.length > 0))) {
          for (const target of targets) {
            if (!target || target === caster) continue;
            const dx = target.x - caster.x;
            const dy = target.y - caster.y;
            const dist = Math.hypot(dx, dy);
            const hitRadius = (target.radius || 22) + (caster.radius || 22) + 55;

            if (dist <= hitRadius) {
              if (!c.hitMap) c.hitMap = new Map();
              const lastHit = c.hitMap.get(target) || 0;
              const now = performance.now();
              if (now - lastHit >= 85) {
                c.hitMap.set(target, now);
                caster.spinTimer = 0.32;
                this.addScreenShake(12);
                onHitCallback(target, {
                  type: 'levi_whirlwind',
                  damage: 155,
                  angle: Math.atan2(dy, dx),
                  knockback: 220
                });
              }
            }
          }
        }

        if (c.timer <= 0 && caster) {
          caster.isOdmOverdrive = false;
          caster.odmOverdriveTimer = 0;
        }
      } else if (c.type === 'consecutive_normal_punches') {
        const caster = c.caster;
        const progress = 1 - (c.timer / c.duration); // 0 to 1
        const targetPunches = Math.min(8, Math.floor(progress * 8) + 1);

        while (c.punchesFired < targetPunches && c.punchesFired < 8) {
          const pIndex = c.punchesFired;
          c.punchesFired++;
          const spread = (Math.random() - 0.5) * 0.45;
          const punchAngle = c.angle + spread;
          const speed = 780;
          const perp = punchAngle + Math.PI * 0.5;
          const sideOffset = (pIndex % 2 === 0 ? 1 : -1) * (12 + Math.random() * 8);
          const spawnX = (caster ? caster.x : c.x) + Math.cos(c.angle) * 24 + Math.cos(perp) * sideOffset;
          const spawnY = (caster ? caster.y : c.y) + Math.sin(c.angle) * 24 + Math.sin(perp) * sideOffset;

          this.projectiles.push({
            type: 'normal_punch',
            caster: caster,
            isRemote: c.isRemote,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(punchAngle) * speed,
            vy: Math.sin(punchAngle) * speed,
            radius: 26,
            damage: 32,
            knockback: 600,
            life: 0.35,
            angle: punchAngle
          });
          this.addScreenShake(4);
        }
      } else if (c.type === 'serious_punch') {
        const progress = 1 - (c.timer / c.duration);
        if (progress >= 0.30 && !c.hasFired) {
          c.hasFired = true;
          this.addScreenShake(28);
          if (this.audio?.playSeriousPunchImpact) {
            this.audio.playSeriousPunchImpact();
          }
          const speed = 1100;
          const caster = c.caster;
          this.projectiles.push({
            type: 'serious_punch_beam',
            caster: caster,
            isRemote: c.isRemote,
            x: caster ? caster.x : c.x,
            y: caster ? caster.y : c.y,
            vx: Math.cos(c.angle) * speed,
            vy: Math.sin(c.angle) * speed,
            width: 180,
            radius: 140,
            damage: 400,
            piercesObstacles: true,
            life: 0.75,
            angle: c.angle
          });
        }
      } else if (c.type === 'world_cutting_slash') {
        const progress = 1 - (c.timer / c.duration);
        if (progress >= 0.28 && !c.hasFired) {
          c.hasFired = true;
          this.addScreenShake(36);
          if (this.audio?.playWorldCuttingSlashImpact) {
            this.audio.playWorldCuttingSlashImpact();
          } else if (this.audio?.playWorldCuttingSlash) {
            this.audio.playWorldCuttingSlash();
          }

          const speed = 960;
          const caster = c.caster;
          this.projectiles.push({
            type: 'world_cutting_slash',
            caster: caster,
            isRemote: c.isRemote,
            x: caster ? caster.x : c.x,
            y: caster ? caster.y : c.y,
            vx: Math.cos(c.angle) * speed,
            vy: Math.sin(c.angle) * speed,
            coneAngle: Math.PI * 0.26, // ~47° half-angle -> ~94° total expanding cone!
            radius: 160,
            maxRadius: 360,
            width: 280,
            maxWidth: 640,
            damage: 380,
            knockback: 650,
            piercesObstacles: true, // Slices through the fabric of space itself!
            life: 0.65,
            maxLife: 0.65,
            angle: c.angle
          });
        }
      } else if (c.type === 'hollow_purple') {
        const progress = 1 - (c.timer / c.duration);
        // Phase 1: 0.0 -> 0.30 (0.45s Blue & Red convergence freeze).
        // Phase 2: >= 0.30 (Launch Imaginary Mass Singularity Sphere!)
        if (progress >= 0.30 && !c.hasFired) {
          c.hasFired = true;
          this.addScreenShake(34);
          if (this.audio) {
            if (typeof this.audio.playHollowPurpleImpact === 'function') {
              this.audio.playHollowPurpleImpact();
            } else if (typeof this.audio.playHollowPurple === 'function') {
              this.audio.playHollowPurple();
            }
          }

          const caster = c.caster || c.player;
          if (caster) {
            c.angle = caster.angle;
            c.x = caster.x;
            c.y = caster.y;
          }

          const speed = 760;
          const startX = c.x + Math.cos(c.angle) * 48;
          const startY = c.y + Math.sin(c.angle) * 48;
          this.projectiles.push({
            type: 'hollow_purple',
            caster: caster,
            isRemote: c.isRemote,
            x: startX,
            y: startY,
            vx: Math.cos(c.angle) * speed,
            vy: Math.sin(c.angle) * speed,
            radius: 65,
            maxRadius: 155,
            pullRadius: 280,
            pullStrength: 460,
            damage: 360,
            knockback: 680,
            piercesObstacles: true,
            life: 1.6,
            maxLife: 1.6,
            angle: c.angle,
            trail: [{ x: startX, y: startY, r: 65 }]
          });
        }
      }

      if (c.timer <= 0 || c.phase === 'finished') {
        this.activeCinematics.splice(cIdx, 1);
      }
    }

    // Update projectiles & hit detection (frozen in mid-air during Serious Punch, World Cutting Slash, Levi Overdrive, or Hollow Purple windup)
    const isFrozen = this.isSeriousPunchFreezing() || this.isWorldCuttingSlashFreezing() || this.isLeviOverdriveFreezing() || this.isHollowPurpleFreezing();
    if (!isFrozen) {
      const projDt = dt * timeScale;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        const prevX = proj.x;
        const prevY = proj.y;
        proj.x += proj.vx * projDt;
        proj.y += proj.vy * projDt;
        proj.life = (proj.life !== undefined && !isNaN(proj.life)) ? proj.life - projDt : -1;

        // Expand projectile radius & width if applicable (Hollow Purple or World Cutting Slash Cone)
        if (proj.radius && proj.maxRadius) {
          const expansionRate = proj.type === 'world_cutting_slash' ? 320 : (proj.type === 'hollow_purple' ? 85 : 45);
          proj.radius = Math.min(proj.maxRadius, proj.radius + expansionRate * projDt);
        }
        if (proj.width && proj.maxWidth) {
          const widthRate = proj.type === 'world_cutting_slash' ? 560 : 60;
          proj.width = Math.min(proj.maxWidth, proj.width + widthRate * projDt);
        }

        // Record cosmic void trench trail for Hollow Purple
        if (proj.type === 'hollow_purple') {
          if (!proj.trail) proj.trail = [];
          const lastNode = proj.trail[proj.trail.length - 1];
          if (!lastNode || Math.hypot(proj.x - lastNode.x, proj.y - lastNode.y) >= 18) {
            proj.trail.push({ x: proj.x, y: proj.y, r: proj.radius || 65 });
            if (proj.trail.length > 42) proj.trail.shift();
          }

          // Gravitational Singularity Pull: drag nearby enemies into the orb's core!
          if (!proj.isRemote && targets && targets.length > 0) {
            const pullRad = proj.pullRadius || 280;
            const pullForce = proj.pullStrength || 460;
            for (const target of targets) {
              if (!target || target === proj.caster) continue;
              if (proj.caster && proj.caster.roomId !== undefined && target.roomId !== undefined) continue;
              if (target.isLimitlessBarrier) continue;
              const tdx = proj.x - target.x;
              const tdy = proj.y - target.y;
              const tDist = Math.hypot(tdx, tdy);
              if (tDist > 8 && tDist <= pullRad) {
                const pullFactor = (1 - (tDist / pullRad) * 0.55) * pullForce * projDt;
                target.x += (tdx / tDist) * pullFactor;
                target.y += (tdy / tDist) * pullFactor;
              }
            }
          }
        }

        // Check obstacle collision (tactical cover: pillars block all projectiles except piercing ultimates)
        if (obstacles && obstacles.length > 0 && !proj.piercesObstacles && proj.type !== 'hollow_purple' && proj.type !== 'serious_punch_beam' && proj.type !== 'world_cutting_slash') {
          let hitObs = null;
          const projRad = proj.radius || (proj.width ? proj.width * 0.5 : 12);
          for (const obs of obstacles) {
            const obsRad = obs.radius || 20;
            const hitThreshold = projRad + obsRad;
            const segDist = this._distToSegment(obs.x, obs.y, prevX, prevY, proj.x, proj.y);
            if (segDist <= hitThreshold) {
              hitObs = obs;
              break;
            }
          }

          if (hitObs) {
            proj.life = 0;
            if (onObstacleHitCallback) {
              onObstacleHitCallback(hitObs, proj);
            }
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        // Check collision with targets (ONLY local projectiles, NEVER remote projectiles!)
        if (!proj.isRemote) {
          if (!proj.hitTargets) {
            proj.hitTargets = new Set();
          }

          for (const target of targets) {
            if (!target || target === proj.caster) continue;
            // Monsters do not shoot or hit fellow monsters
            if (proj.caster && proj.caster.roomId !== undefined && target.roomId !== undefined) continue;
            if (proj.trappedBy === target) continue; // Trapped in Gojo's Mugen: deals 0 damage, cannot hit!
            if (target.isLimitlessBarrier && !proj.isRepelled) continue; // Barrier active: completely protects target!

            // Don't hit the same target multiple times while the projectile passes through/overlaps them
            const targetKey = target.id || target.peerId || target;
            if (proj.hitTargets.has(target) || (targetKey && proj.hitTargets.has(targetKey))) continue;

            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.hypot(dx, dy);
            const hitRadius = (proj.radius || (proj.width ? proj.width * 0.5 : 40)) + (target.radius || 24);

            let isHit = false;
            if (proj.type === 'world_cutting_slash') {
              if (dist <= hitRadius) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(targetAngle - proj.angle);
                while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
                if (angleDiff <= (proj.coneAngle || 0.82) || dist <= (proj.radius * 0.75)) {
                  isHit = true;
                }
              }
            } else {
              isHit = dist <= hitRadius;
            }

            if (isHit) {
              proj.hitTargets.add(target);
              if (targetKey) proj.hitTargets.add(targetKey);
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
  }

  /**
   * Draws world-space cinematic effects (projectiles, slashes, chain whirlwinds)
   */
  drawWorld(ctx, renderer = null) {
    // 1. Draw Projectiles
    for (const proj of this.projectiles) {
      // Frustum culling: skip offscreen projectiles
      if (renderer && typeof renderer.isEntityVisible === 'function') {
        const rad = (proj.radius || (proj.width ? proj.width * 0.5 : 35)) + 80;
        if (!renderer.isEntityVisible(proj.x, proj.y, rad)) continue;
      }

      ctx.save();
      ctx.translate(proj.x, proj.y);

      if (proj.type === 'hollow_purple') {
        // 1. Erased Cosmic Void Trench along flight path (drawn in local space relative to proj.x, proj.y)
        if (proj.trail && proj.trail.length > 1) {
          ctx.save();
          for (let t = 0; t < proj.trail.length; t++) {
            const node = proj.trail[t];
            const ratio = (t + 1) / proj.trail.length;
            const lx = node.x - proj.x;
            const ly = node.y - proj.y;
            const tr = (node.r || 65) * (0.48 + ratio * 0.42);

            // Pitch-black erased void floor scar
            ctx.fillStyle = `rgba(10, 2, 24, ${0.42 * ratio})`;
            ctx.beginPath();
            ctx.arc(lx, ly, tr, 0, Math.PI * 2);
            ctx.fill();

            // Glowing ultraviolet star-rim along the gouged trench
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.45 * ratio})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(lx, ly, tr * 0.92, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. Imaginary Mass Singularity Core + Accretion Disk
        const pulse = 1 + Math.sin(Date.now() * 0.025) * 0.12;
        const r = proj.radius * pulse;
        const spin = Date.now() * 0.012;

        // Outer Gravitational Pull Field Ring
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, (proj.pullRadius || r * 1.8) * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // Outer Dark Purple Gravity Well
        const grad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r * 1.15);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.22, '#e879f9');
        grad.addColorStop(0.55, '#9333ea');
        grad.addColorStop(0.82, 'rgba(76, 29, 149, 0.55)');
        grad.addColorStop(1, 'rgba(15, 3, 35, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Swirling Lapis Blue (Ao) & Reversal Red (Aka) Accretion Spiral Arms
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, spin, spin + Math.PI * 1.15);
        ctx.stroke();

        ctx.shadowColor = '#ff2a5f';
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.86, -spin * 1.3, -spin * 1.3 + Math.PI * 1.15);
        ctx.stroke();

        // White-Hot Imaginary Mass Event Horizon Core
        ctx.fillStyle = '#fdf4ff';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 32;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon Black Singularity Pupil Ring
        ctx.strokeStyle = '#1e0538';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
        ctx.stroke();
      } else if (proj.type === 'world_cutting_slash') {
        // Sukuna's World Cutting Slash: Colossal Reality-Bisecting Dimensional Cone
        ctx.rotate(proj.angle);
        const coneHalf = proj.coneAngle || 0.82;
        const pulse = 1 + Math.sin(Date.now() * 0.04) * 0.12;

        const curRadius = proj.radius || 180;
        const curWidth = proj.width || 320;

        // 1. Dimensional Void Cone Fill (Sheared Reality Rift)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 20, 70, 0.18)';
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 32;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, curRadius * 1.05, -coneHalf, coneHalf);
        ctx.closePath();
        ctx.fill();

        // 2. Cascading Dimensional Cutting Arcs (Layered Crimson & Pure White Razor Edges)
        for (let arcIdx = 0; arcIdx < 4; arcIdx++) {
          const arcR = curRadius * (0.42 + arcIdx * 0.20) * pulse;
          const arcSpread = coneHalf * (0.85 + arcIdx * 0.05);
          const arcAlpha = Math.max(0.2, 1 - (arcIdx * 0.18));

          // Outer Crimson Aura
          ctx.strokeStyle = `rgba(255, 42, 95, ${arcAlpha})`;
          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 24 - arcIdx * 4;
          ctx.lineWidth = 10 - arcIdx * 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, arcR, -arcSpread, arcSpread);
          ctx.stroke();

          // Pure White Razor Core (Infinite Sharpness)
          ctx.strokeStyle = `rgba(255, 255, 255, ${arcAlpha * 1.1})`;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, arcR, -arcSpread * 0.95, arcSpread * 0.95);
          ctx.stroke();
        }

        // 3. Dismantle Lattice Grid Cuts (Radial Cleaves Across Cone)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 16;
        const gridLines = [-0.65, -0.32, 0, 0.32, 0.65];
        for (const g of gridLines) {
          const lineAngle = g * coneHalf;
          const endDist = curRadius * (0.92 + Math.cos(g * 2) * 0.12);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(lineAngle) * endDist, Math.sin(lineAngle) * endDist);
          ctx.stroke();
        }

        // 4. Cross-cleave bisecting slashes across the fan
        for (let cross = -2; cross <= 2; cross++) {
          const cy = cross * (curWidth * 0.16);
          const cx = curRadius * (0.52 + Math.abs(cross) * 0.12);
          ctx.strokeStyle = 'rgba(255, 42, 95, 0.88)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx - 32, cy - 32);
          ctx.lineTo(cx + 32, cy + 32);
          ctx.stroke();
        }

        // 5. Crackling Spatial Fracture Sparks & Red Lightning
        ctx.fillStyle = '#ffffff';
        for (let sp = 0; sp < 6; sp++) {
          const spAngle = (Math.sin(Date.now() * 0.01 + sp) * 0.5) * 2 * coneHalf;
          const spDist = (0.2 + (sp * 0.14)) * curRadius;
          ctx.fillRect(Math.cos(spAngle) * spDist - 2, Math.sin(spAngle) * spDist - 2, 4, 4);
        }
        ctx.restore();
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
      } else if (proj.type === 'merchant_rpg_rocket') {
        // Spelunky Merchant RPG Rocket
        const moveAngle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(moveAngle);

        // Rocket exhaust plume
        const plumeLen = 22 + Math.random() * 12;
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(-16, -5);
        ctx.lineTo(-16 - plumeLen, 0);
        ctx.lineTo(-16, 5);
        ctx.closePath();
        ctx.fill();

        // Smoke particles behind rocket
        ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
        ctx.beginPath();
        ctx.arc(-22 - Math.random() * 8, (Math.random() - 0.5) * 6, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();

        // Steel rocket tube
        ctx.fillStyle = '#374151';
        ctx.fillRect(-16, -5, 24, 10);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-16, -5, 24, 10);

        // Yellow hazard bands on tube
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-6, -5, 4, 10);
        ctx.fillRect(2, -5, 4, 10);

        // Stabilizer tail fins
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.moveTo(-14, -5);
        ctx.lineTo(-20, -11);
        ctx.lineTo(-10, -5);
        ctx.moveTo(-14, 5);
        ctx.lineTo(-20, 11);
        ctx.lineTo(-10, 5);
        ctx.fill();

        // High-explosive warhead cone
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(8, -7);
        ctx.lineTo(22, 0);
        ctx.lineTo(8, 7);
        ctx.closePath();
        ctx.fill();
      } else if (proj.type === 'normal_punch') {
        // Saitama's Iconic Red Hero Punch Fist
        ctx.rotate(proj.angle);

        // Trailing comic speedlines behind the punch
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-34, -8);
        ctx.moveTo(-6, 0);
        ctx.lineTo(-42, 0);
        ctx.moveTo(-10, 8);
        ctx.lineTo(-34, 8);
        ctx.stroke();

        // Crisp white glove cuff
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(-16, -9, 8, 18, 3);
        else ctx.rect(-16, -9, 8, 18);
        ctx.fill();

        // Scarlet hero glove body
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(-8, -12, 24, 24, 8);
        else ctx.rect(-8, -12, 24, 24);
        ctx.fill();

        // Knuckle shading definition
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(8, -4, 4, 0, Math.PI * 2);
        ctx.arc(10, 2, 4.5, 0, Math.PI * 2);
        ctx.arc(8, 7, 4, 0, Math.PI * 2);
        ctx.fill();

        // Comic punch spark on knuckles
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(16, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'serious_punch_beam') {
        // Serious Punch: Apocalyptic Atmospheric-Parting Shockwave Beam
        ctx.rotate(proj.angle);

        // 1. Concentric atmospheric parting shockwave arcs expanding forward
        const pulse = 1 + Math.sin(Date.now() * 0.03) * 0.15;
        for (let ring = 0; ring < 4; ring++) {
          const ringOffset = ring * 55 - 40;
          const ringRadiusY = (70 + ring * 25) * pulse;
          const ringRadiusX = (30 + ring * 12);
          ctx.strokeStyle = ring === 0 ? 'rgba(255, 255, 255, 0.95)' : `rgba(250, 204, 21, ${0.8 - ring * 0.18})`;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 24;
          ctx.lineWidth = 5 - ring * 0.8;
          ctx.beginPath();
          if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(ringOffset, 0, ringRadiusX, ringRadiusY, 0, -Math.PI * 0.45, Math.PI * 0.45);
          } else {
            ctx.arc(ringOffset, 0, ringRadiusY, -Math.PI * 0.45, Math.PI * 0.45);
          }
          ctx.stroke();
        }

        // 2. Colossal Energy Beam Core
        // Outer golden plasma cone
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 36;
        ctx.beginPath();
        ctx.moveTo(-80, -75);
        ctx.lineTo(160, -25);
        ctx.lineTo(210, 0);
        ctx.lineTo(160, 25);
        ctx.lineTo(-80, 75);
        ctx.closePath();
        ctx.fill();

        // Inner searing white shockwave spear
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.moveTo(-60, -25);
        ctx.lineTo(150, -8);
        ctx.lineTo(200, 0);
        ctx.lineTo(150, 8);
        ctx.lineTo(-60, 25);
        ctx.closePath();
        ctx.fill();

        // 3. Lateral wind cleave speedlines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        for (let s = -3; s <= 3; s++) {
          if (s === 0) continue;
          const ly = s * 24;
          ctx.beginPath();
          ctx.moveTo(-50, ly);
          ctx.lineTo(120 - Math.abs(s) * 20, ly * 1.3);
          ctx.stroke();
        }
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
        const caster = c.caster;
        const posX = caster ? caster.x : c.x;
        const posY = caster ? caster.y : c.y;
        const isAirborneOrSpinning = caster && (caster.isAirborne || caster.spinTimer > 0 || (caster.activeCables && caster.activeCables.length > 0));

        ctx.save();
        ctx.translate(posX, posY);

        const spinAngle = Date.now() * 0.024;
        const outerRadius = isAirborneOrSpinning ? 88 : 52;
        const innerRadius = isAirborneOrSpinning ? 68 : 38;

        // 1. Pressurized Emerald Wind Turbine Vortex
        ctx.strokeStyle = isAirborneOrSpinning ? 'rgba(16, 185, 129, 0.92)' : 'rgba(16, 185, 129, 0.55)';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = isAirborneOrSpinning ? 26 : 14;
        ctx.lineWidth = isAirborneOrSpinning ? 5.5 : 3;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, spinAngle, spinAngle + Math.PI * 1.35);
        ctx.stroke();

        // 2. Counter-Rotating Gleaming Ultrahard Steel Blade Arc
        ctx.strokeStyle = '#f8fafc';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.lineWidth = isAirborneOrSpinning ? 3.5 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, -spinAngle * 1.2, -spinAngle * 1.2 + Math.PI * 1.45);
        ctx.stroke();

        // 3. When airborne or spinning: Full Double-Beyblade Cyclone Silhouettes
        if (isAirborneOrSpinning) {
          ctx.rotate(spinAngle * 1.5);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-78, -3, 156, 6);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-84, -2, 168, 4);
        }

        ctx.restore();
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
        ctx.save();
        if (progress < 0.30) {
          // --- 1. PHASE 1: BLUE & RED CONVERGENCE FREEZE (0.0s - 0.45s) ---
          const windupRatio = Math.min(1, progress / 0.30);
          // Smooth ease-in-out convergence toward center
          const ease = windupRatio < 0.5
            ? 2 * windupRatio * windupRatio
            : 1 - Math.pow(-2 * windupRatio + 2, 2) / 2;

          // Deep cosmic void backdrop
          ctx.fillStyle = 'rgba(6, 2, 16, 0.84)';
          ctx.fillRect(0, 0, width, height);

          const centerX = width / 2;
          const centerY = height / 2;
          const startOffset = width * 0.36;
          const currentOffset = startOffset * (1 - ease);

          const blueX = centerX - currentOffset;
          const redX = centerX + currentOffset;
          const orbR = 68 + ease * 28;

          // Left Sphere: Cursed Technique Lapse — BLUE (蒼)
          const blueGrad = ctx.createRadialGradient(blueX, centerY, orbR * 0.1, blueX, centerY, orbR * 1.6);
          blueGrad.addColorStop(0, '#ffffff');
          blueGrad.addColorStop(0.28, '#00f0ff');
          blueGrad.addColorStop(0.65, '#0284c7');
          blueGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
          ctx.fillStyle = blueGrad;
          ctx.beginPath();
          ctx.arc(blueX, centerY, orbR * 1.6, 0, Math.PI * 2);
          ctx.fill();

          // Right Sphere: Cursed Technique Reversal — RED (赫)
          const redGrad = ctx.createRadialGradient(redX, centerY, orbR * 0.1, redX, centerY, orbR * 1.6);
          redGrad.addColorStop(0, '#ffffff');
          redGrad.addColorStop(0.28, '#ff2a5f');
          redGrad.addColorStop(0.65, '#dc2626');
          redGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = redGrad;
          ctx.beginPath();
          ctx.arc(redX, centerY, orbR * 1.6, 0, Math.PI * 2);
          ctx.fill();

          // Center Singularity Spark as Blue & Red overlap
          if (ease > 0.55) {
            const fuseRatio = (ease - 0.55) / 0.45;
            const fuseR = orbR * 1.9 * fuseRatio;
            const fuseGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, fuseR);
            fuseGrad.addColorStop(0, '#ffffff');
            fuseGrad.addColorStop(0.4, '#e879f9');
            fuseGrad.addColorStop(0.8, '#9333ea');
            fuseGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
            ctx.fillStyle = fuseGrad;
            ctx.beginPath();
            ctx.arc(centerX, centerY, fuseR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Gojo's Glowing Six Eyes (六眼) in upper center
          const eyeY = height * 0.34;
          const eyeSpread = 52;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 22;
          ctx.fillStyle = '#e0f2fe';
          for (const dir of [-1, 1]) {
            ctx.beginPath();
            if (typeof ctx.ellipse === 'function') {
              ctx.ellipse(centerX + dir * eyeSpread, eyeY, 18, 7, dir * -0.08, 0, Math.PI * 2);
            } else {
              ctx.arc(centerX + dir * eyeSpread, eyeY, 14, 0, Math.PI * 2);
            }
            ctx.fill();

            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(centerX + dir * eyeSpread, eyeY, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e0f2fe';
          }

          // Left / Right Technique Labels following spheres
          ctx.textAlign = 'center';
          ctx.font = '900 22px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#000000';

          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 14;
          ctx.strokeText('術式順転「蒼」', blueX, centerY + orbR + 32);
          ctx.fillText('術式順転「蒼」', blueX, centerY + orbR + 32);

          ctx.fillStyle = '#fb7185';
          ctx.shadowColor = '#ff2a5f';
          ctx.strokeText('術式反転「赫」', redX, centerY + orbR + 32);
          ctx.fillText('術式反転「赫」', redX, centerY + orbR + 32);

          // Nine-Rope Sacred Chant Calligraphy at Top
          ctx.font = '900 26px "Impact", "Arial Black", sans-serif';
          ctx.fillStyle = '#e879f9';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 18;
          ctx.strokeText('「 九 綱 ・ 偏 光 ・ 烏 と 声 明 ・ 表 裏 の 間 」', centerX, height * 0.21);
          ctx.fillText('「 九 綱 ・ 偏 光 ・ 烏 と 声 明 ・ 表 裏 の 間 」', centerX, height * 0.21);

          ctx.font = '700 14px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f0abfc';
          ctx.shadowBlur = 6;
          ctx.fillText('NINE ROPES \u2022 POLARIZED LIGHT \u2022 CROW AND SHOMYO \u2022 THE GAP BETWEEN WITHIN AND WITHOUT', centerX, height * 0.26);
        } else {
          // --- 2. PHASE 2: IMAGINARY MASS DETONATION & RELEASE (0.45s - 1.50s) ---
          const postProgress = (progress - 0.30) / 0.70;
          const alpha = Math.max(0, Math.sin((1 - postProgress) * Math.PI * 0.5) * 0.72);

          // Blinding ultraviolet/white flash on collision
          if (postProgress < 0.18) {
            const flashAlpha = (1 - postProgress / 0.18) * 0.85;
            ctx.fillStyle = `rgba(250, 232, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, width, height);
          }

          // Deep purple cosmic vignette
          const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.18, width / 2, height / 2, width * 0.78);
          grad.addColorStop(0, 'rgba(147, 51, 234, 0)');
          grad.addColorStop(0.6, `rgba(88, 28, 135, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(25, 5, 50, ${alpha})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Colossal Impact Kanji: 虚式「茈」
          const textAlpha = Math.max(0, 1 - postProgress * 1.25);
          if (textAlpha > 0.02) {
            ctx.save();
            ctx.globalAlpha = textAlpha;
            ctx.textAlign = 'center';

            ctx.font = '900 58px "Impact", "Arial Black", sans-serif';
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#090214';
            ctx.fillStyle = '#fdf4ff';
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 28;
            ctx.strokeText('虚 式 「 茈 」', width / 2, height * 0.22);
            ctx.fillText('虚 式 「 茈 」', width / 2, height * 0.22);

            ctx.font = '900 18px "JetBrains Mono", monospace';
            ctx.lineWidth = 4;
            ctx.fillStyle = '#e879f9';
            ctx.strokeText('【 仮想の質量を押し出す 】 [IMAGINARY MASS: HOLLOW PURPLE]', width / 2, height * 0.28);
            ctx.fillText('【 仮想の質量を押し出す 】 [IMAGINARY MASS: HOLLOW PURPLE]', width / 2, height * 0.28);
            ctx.restore();
          }
        }
        ctx.restore();
      } else if (c.type === 'world_cutting_slash') {
        ctx.save();
        if (progress < 0.28) {
          // --- 1. PHASE 1: REALITY FREEZE & SACRED INCANTATION (0.0s - 0.36s) ---
          // Deep cursed ink wash
          ctx.fillStyle = 'rgba(8, 2, 6, 0.82)';
          ctx.fillRect(0, 0, width, height);

          // Cursed radial vignette
          const cursedGrad = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, Math.max(width, height) * 0.72);
          cursedGrad.addColorStop(0, 'rgba(255, 42, 95, 0.08)');
          cursedGrad.addColorStop(0.45, 'rgba(30, 5, 15, 0.45)');
          cursedGrad.addColorStop(1, 'rgba(5, 0, 4, 0.95)');
          ctx.fillStyle = cursedGrad;
          ctx.fillRect(0, 0, width, height);

          // Dismantle Reality Fracture Grid (Geometric spatial lines previewing the cuts)
          ctx.strokeStyle = 'rgba(255, 42, 95, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 8;
          const numGrid = 7;
          for (let g = 0; g < numGrid; g++) {
            const gy = (height / numGrid) * (g + 0.5);
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            ctx.stroke();

            const gx = (width / numGrid) * (g + 0.5);
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, height);
            ctx.stroke();
          }

          // Sukuna's 4 Glowing Scarlet Demonic Eyes
          const eyeCenterX = width / 2;
          const eyeCenterY = height / 2 - 25;
          const eyePairs = [
            // Upper eye pair
            { x: eyeCenterX - 75, y: eyeCenterY - 18, rx: 16, ry: 7, rot: -0.15 },
            { x: eyeCenterX + 75, y: eyeCenterY - 18, rx: 16, ry: 7, rot: 0.15 },
            // Lower eye pair
            { x: eyeCenterX - 72, y: eyeCenterY + 18, rx: 15, ry: 6.5, rot: 0.12 },
            { x: eyeCenterX + 72, y: eyeCenterY + 18, rx: 15, ry: 6.5, rot: -0.12 }
          ];

          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 24;
          for (const eye of eyePairs) {
            ctx.save();
            ctx.translate(eye.x, eye.y);
            ctx.rotate(eye.rot);

            // Sclera/aura
            ctx.fillStyle = 'rgba(255, 42, 95, 0.95)';
            ctx.beginPath();
            if (typeof ctx.ellipse === 'function') {
              ctx.ellipse(0, 0, eye.rx, eye.ry, 0, 0, Math.PI * 2);
            } else {
              ctx.arc(0, 0, eye.rx, 0, Math.PI * 2);
            }
            ctx.fill();

            // Slit pupil
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            if (typeof ctx.ellipse === 'function') {
              ctx.ellipse(0, 0, eye.rx * 0.35, eye.ry * 0.8, 0, 0, Math.PI * 2);
            } else {
              ctx.arc(0, 0, eye.rx * 0.4, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.restore();
          }

          // Authentic Japanese Incantation Chants: 「龍鱗・反発・番の流星」
          ctx.textAlign = 'center';
          ctx.font = '900 28px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#ff2a5f';
          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 18;
          ctx.strokeText('「 龍 鱗 ・ 反 発 ・ 番 の 流 星 」', width / 2, height * 0.24);
          ctx.fillText('「 龍 鱗 ・ 反 発 ・ 番 の 流 星 」', width / 2, height * 0.24);

          // Subtitle chant translation
          ctx.font = '700 15px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f87171';
          ctx.shadowBlur = 6;
          ctx.fillText('SCALE OF THE DRAGON \u2022 RECOIL \u2022 TWIN METEORS', width / 2, height * 0.29);

          // Center Japanese Kanji
          ctx.font = '900 46px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ff2a5f';
          ctx.shadowBlur = 24;
          ctx.strokeText('世界を断つ斬撃', width / 2, height * 0.68);
          ctx.fillText('世界を断つ斬撃', width / 2, height * 0.68);
        } else {
          // --- 2. PHASE 2: REALITY SEVERANCE & CATACLYSMIC IMPACT (0.36s - 1.3s) ---
          const strikeProgress = (progress - 0.28) / 0.72; // 0 to 1
          const slashAlpha = Math.max(0, 1 - strikeProgress);

          // Initial blinding spatial severance flash (first 140ms of strike)
          if (strikeProgress < 0.22) {
            const flashAlpha = (0.22 - strikeProgress) / 0.22;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.95})`;
            ctx.fillRect(0, 0, width, height);
          }

          // Crimson spatial rupture vignette
          const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.15, width / 2, height / 2, width * 0.75);
          const vigAlpha = Math.max(0, (1 - strikeProgress) * 0.65);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.65, `rgba(255, 42, 95, ${vigAlpha * 0.45})`);
          grad.addColorStop(1, `rgba(180, 10, 30, ${vigAlpha * 0.85})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Full-screen Multi-Fracture Reality Cuts Bisecting Viewport
          const cuts = [
            { x1: 0, y1: height * 0.22, x2: width, y2: height * 0.78, w: 16 },
            { x1: 0, y1: height * 0.52, x2: width, y2: height * 0.62, w: 10 },
            { x1: width * 0.25, y1: 0, x2: width * 0.82, y2: height, w: 12 }
          ];

          for (const cut of cuts) {
            // Crimson spatial tearing glow
            ctx.strokeStyle = `rgba(255, 42, 95, ${slashAlpha * 0.95})`;
            ctx.lineWidth = cut.w;
            ctx.shadowColor = '#ff2a5f';
            ctx.shadowBlur = 34;
            ctx.beginPath();
            ctx.moveTo(cut.x1, cut.y1);
            ctx.lineTo(cut.x2, cut.y2);
            ctx.stroke();

            // Pure white core razor cut line (Infinite dimensional edge)
            ctx.strokeStyle = `rgba(255, 255, 255, ${slashAlpha * 1.2})`;
            ctx.lineWidth = cut.w * 0.32;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(cut.x1, cut.y1);
            ctx.lineTo(cut.x2, cut.y2);
            ctx.stroke();
          }

          // Canvas displacement / shear tint along the cuts
          ctx.fillStyle = `rgba(255, 0, 70, ${slashAlpha * 0.18})`;
          ctx.fillRect(0, 0, width, height);

          // Colossal Anime Impact Typography: 世界を断つ斬撃 + 【 空間切断 ・ 捌 】
          if (strikeProgress < 0.68) {
            const textAlpha = Math.max(0, 1 - (strikeProgress / 0.68));
            ctx.textAlign = 'center';

            // Colossal header
            ctx.font = '900 76px "Impact", "Arial Black", sans-serif';
            ctx.lineWidth = 10;
            ctx.strokeStyle = `rgba(0, 0, 0, ${textAlpha})`;
            ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
            ctx.shadowColor = '#ff2a5f';
            ctx.shadowBlur = 36;
            ctx.strokeText('世界を断つ斬撃', width / 2, height / 2 - 20);
            ctx.fillText('世界を断つ斬撃', width / 2, height / 2 - 20);

            // Subtext: 【 空間切断 ・ 捌 】 [SPATIAL CLEAVE: SEVERANCE]
            ctx.font = '900 28px "Impact", "Arial Black", sans-serif';
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(0, 0, 0, ${textAlpha})`;
            ctx.fillStyle = `rgba(255, 215, 0, ${textAlpha})`;
            ctx.shadowColor = '#ff2a5f';
            ctx.shadowBlur = 18;
            ctx.strokeText('【 空間切断 ・ 捌 】 [WORLD CUTTING SLASH]', width / 2, height / 2 + 35);
            ctx.fillText('【 空間切断 ・ 捌 】 [WORLD CUTTING SLASH]', width / 2, height / 2 + 35);
          }
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
        ctx.save();
        if (progress < 0.06) {
          // --- 1. PHASE 1: WINGS OF FREEDOM FREEZE CUT-IN (0.0s - 0.36s) ---
          ctx.fillStyle = 'rgba(4, 18, 14, 0.85)';
          ctx.fillRect(0, 0, width, height);

          // Emerald Scout radial screentone vignette
          const scoutGrad = ctx.createRadialGradient(width / 2, height / 2, 70, width / 2, height / 2, Math.max(width, height) * 0.72);
          scoutGrad.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
          scoutGrad.addColorStop(0.5, 'rgba(6, 30, 22, 0.5)');
          scoutGrad.addColorStop(1, 'rgba(2, 8, 6, 0.95)');
          ctx.fillStyle = scoutGrad;
          ctx.fillRect(0, 0, width, height);

          // Radial wind-tunnel speedlines converging toward center
          const centerX = width / 2;
          const centerY = height / 2;
          const numLines = 32;
          for (let i = 0; i < numLines; i++) {
            const radAngle = (i / numLines) * Math.PI * 2;
            const outerR = Math.hypot(width, height) * 0.55;
            const innerR = 115 + ((i * 29) % 65);
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = i % 2 === 0 ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(radAngle) * outerR, centerY + Math.sin(radAngle) * outerR);
            ctx.lineTo(centerX + Math.cos(radAngle) * innerR, centerY + Math.sin(radAngle) * innerR);
            ctx.stroke();
          }

          // Stylized Wings of Freedom (自由の翼) Emblem at Center Screen
          ctx.save();
          ctx.translate(centerX, centerY - 22);
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 24;

          // Left Wing (Cobalt Blue Shield Wing)
          ctx.fillStyle = '#2563eb';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-6, 18);
          ctx.lineTo(-72, -38);
          ctx.lineTo(-48, -14);
          ctx.lineTo(-82, -16);
          ctx.lineTo(-46, 4);
          ctx.lineTo(-68, 8);
          ctx.lineTo(-14, 26);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Wing (Brilliant White Wing of Freedom)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(6, 18);
          ctx.lineTo(78, -42);
          ctx.lineTo(52, -16);
          ctx.lineTo(88, -18);
          ctx.lineTo(50, 4);
          ctx.lineTo(72, 10);
          ctx.lineTo(14, 26);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Authentic Japanese Battle Cry: 「 心 臓 を 捧 げ よ 」
          ctx.textAlign = 'center';
          ctx.font = '900 58px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 9;
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 28;
          ctx.strokeText('「 心 臓 を 捧 げ よ 」', centerX, height * 0.25);
          ctx.fillText('「 心 臓 を 捧 げ よ 」', centerX, height * 0.25);

          // Subtitle: 【 立体機動 ・ 限界突破 】 [ODM OVERDRIVE: ∞ GAS]
          ctx.font = '900 26px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 14;
          ctx.strokeText('【 立体機動 ・ 限界突破 】 [ODM OVERDRIVE: \u221e GAS]', centerX, height * 0.72);
          ctx.fillText('【 立体機動 ・ 限界突破 】 [ODM OVERDRIVE: \u221e GAS]', centerX, height * 0.72);
        } else {
          // --- 2. PHASE 2: ACTIVE 6.0s OVERDRIVE WIND-TUNNEL HUD ---
          const activeProgress = (progress - 0.06) / 0.94;

          // Initial turbine unfreeze flash
          if (activeProgress < 0.06) {
            const flashAlpha = ((0.06 - activeProgress) / 0.06) * 0.75;
            ctx.fillStyle = `rgba(209, 250, 229, ${flashAlpha})`;
            ctx.fillRect(0, 0, width, height);
          }

          // Pulsing Emerald Scout sonic wind-tunnel vignette
          const pulse = 0.26 + Math.sin(Date.now() * 0.018) * 0.10;
          const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.34, width / 2, height / 2, width * 0.76);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.7, 'rgba(6, 78, 59, 0.14)');
          grad.addColorStop(1, `rgba(16, 185, 129, ${pulse})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // High-speed wind tunnel streaks at viewport edges
          ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.65})`;
          ctx.lineWidth = 2;
          const streakOffset = (Date.now() * 0.8) % 120;
          for (let s = 0; s < 8; s++) {
            const sy = ((s * 97 + streakOffset) % height);
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(48, sy);
            ctx.moveTo(width - 48, sy);
            ctx.lineTo(width, sy);
            ctx.stroke();
          }

          // Digital Overdrive Tactical Timer HUD at top of viewport
          const timeRemaining = Math.max(0, c.timer).toFixed(1);
          ctx.font = '900 18px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.fillText(`\ud83e\udd85 ODM OVERDRIVE \u2014 \u221e GAS + SUPER SLICE [${timeRemaining}s]`, width / 2, 42);
          ctx.shadowBlur = 0;
        }
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
      } else if (c.type === 'consecutive_normal_punches') {
        // High-velocity comic action speedlines at viewport corners
        ctx.save();
        const flash = Math.sin(progress * Math.PI * 8) * 0.15;
        const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.72);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(239, 68, 68, ${0.25 + flash})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtitle indicator on screen
        ctx.font = '900 18px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.fillText('連打 [CONSECUTIVE NORMAL PUNCHES]', width / 2, height - 36);
        ctx.restore();
      } else if (c.type === 'serious_punch') {
        ctx.save();
        if (progress < 0.30) {
          // --- 1. MONOCHROME MANGA INK FREEZE FRAME (0.0s - 0.45s) ---
          // Dark ink wash
          ctx.fillStyle = 'rgba(12, 12, 18, 0.75)';
          ctx.fillRect(0, 0, width, height);

          // Manga screentone radial vignette
          const mangaGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.75);
          mangaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
          mangaGrad.addColorStop(0.5, 'rgba(20, 20, 24, 0.4)');
          mangaGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
          ctx.fillStyle = mangaGrad;
          ctx.fillRect(0, 0, width, height);

          // Manga radial speedlines converging toward center
          const centerX = width / 2;
          const centerY = height / 2;
          const numLines = 36;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 2.5;
          for (let i = 0; i < numLines; i++) {
            const radAngle = (i / numLines) * Math.PI * 2;
            const outerR = Math.hypot(width, height) * 0.55;
            const innerR = 120 + ((i * 37) % 80);
            const x1 = centerX + Math.cos(radAngle) * outerR;
            const y1 = centerY + Math.sin(radAngle) * outerR;
            const x2 = centerX + Math.cos(radAngle) * innerR;
            const y2 = centerY + Math.sin(radAngle) * innerR;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }

          // Menacing Japanese Onomatopoeia: ゴゴゴゴ (rumble)
          ctx.font = '900 48px "Impact", "Arial Black", sans-serif';
          ctx.lineWidth = 7;
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 16;

          // Left side
          ctx.textAlign = 'left';
          ctx.strokeText('ゴ', width * 0.12, height * 0.35);
          ctx.fillText('ゴ', width * 0.12, height * 0.35);
          ctx.strokeText('ゴ', width * 0.16, height * 0.50);
          ctx.fillText('ゴ', width * 0.16, height * 0.50);
          ctx.strokeText('ゴ', width * 0.20, height * 0.65);
          ctx.fillText('ゴ', width * 0.20, height * 0.65);

          // Right side
          ctx.textAlign = 'right';
          ctx.strokeText('ゴ', width * 0.88, height * 0.35);
          ctx.fillText('ゴ', width * 0.88, height * 0.35);
          ctx.strokeText('ゴ', width * 0.84, height * 0.50);
          ctx.fillText('ゴ', width * 0.84, height * 0.50);
          ctx.strokeText('ゴ', width * 0.80, height * 0.65);
          ctx.fillText('ゴ', width * 0.80, height * 0.65);
        } else {
          // --- 2. APOCALYPTIC UNFREEZE & STRIKE IMPACT ---
          const strikeProgress = (progress - 0.30) / 0.70; // 0 to 1

          // Initial blinding white/gold flash (first 150ms of strike)
          if (strikeProgress < 0.25) {
            const flashAlpha = (0.25 - strikeProgress) / 0.25;
            ctx.fillStyle = `rgba(255, 255, 240, ${flashAlpha * 0.9})`;
            ctx.fillRect(0, 0, width, height);
          }

          // Golden atmospheric shockwave vignette
          const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.75);
          const vigAlpha = Math.max(0, (1 - strikeProgress) * 0.65);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.7, `rgba(245, 158, 11, ${vigAlpha * 0.4})`);
          grad.addColorStop(1, `rgba(220, 38, 38, ${vigAlpha * 0.7})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Massive Impact Typography: ドンッ!! (DOOOON!) + マジ殴り
          if (strikeProgress < 0.65) {
            const textAlpha = Math.max(0, 1 - (strikeProgress / 0.65));
            ctx.textAlign = 'center';

            // Main impact Katakana
            ctx.font = '900 84px "Impact", "Arial Black", sans-serif';
            ctx.lineWidth = 10;
            ctx.strokeStyle = `rgba(0, 0, 0, ${textAlpha})`;
            ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 32;
            ctx.strokeText('ドンッ!!', width / 2, height / 2 - 20);
            ctx.fillText('ドンッ!!', width / 2, height / 2 - 20);

            // Subtext: マジ殴り [SERIOUS PUNCH]
            ctx.font = '900 32px "Impact", "Arial Black", sans-serif';
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(0, 0, 0, ${textAlpha})`;
            ctx.fillStyle = `rgba(250, 204, 21, ${textAlpha})`;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 24;
            ctx.strokeText('マジ殴り [SERIOUS PUNCH]', width / 2, height / 2 + 35);
            ctx.fillText('マジ殴り [SERIOUS PUNCH]', width / 2, height / 2 + 35);
          }
        }
        ctx.restore();
      }
    }
  }
}
