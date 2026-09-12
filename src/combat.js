/**
 * Combat System for Dungeon Slop
 * Handles weapon-specific hitboxes, cleave arcs, critical hits,
 * shield block mitigation, and active chest abilities (Q key).
 */

export class CombatSystem {
  constructor(audio, particles) {
    this.audio = audio;
    this.particles = particles;
  }

  /**
   * Executes a weapon attack for an attacker entity.
   * Checks for targets within weapon reach and cleave arc.
   */
  performWeaponAttack(attacker, targets = [], options = {}) {
    const weapon = attacker.equipment?.weapon || {
      name: 'Unarmed Fists',
      damage: 10,
      reach: 48,
      speed: 1.0,
      hands: 1
    };

    let reach = weapon.reach || 55;
    let arcHalfAngle = weapon.hands === 2 ? Math.PI * 0.48 : Math.PI * 0.35;
    let baseDamage = weapon.damage || 15;
    if (options.damageMultiplier) {
      baseDamage = Math.round(baseDamage * options.damageMultiplier);
    }
    if (attacker.isBerserk) {
      baseDamage = Math.round(baseDamage * 2.2); // Berserk Mode: +120% Colossal Damage Boost!
    }
    const isBlue = weapon.visual === 'lapse_blue' || weapon.id === 'lapse_blue';

    // Tailor hurtbox reach & arc to match visual weapon animations
    if (weapon.visual === 'dragon_slayer' || weapon.visual === 'greatsword_2h' || weapon.visual === 'sukuna_cleaver') {
      reach = Math.max(reach, 88);
      arcHalfAngle = Math.PI * 0.65; // wide 130° sweep
    } else if (weapon.visual === 'inverted_spear_chain') {
      reach = Math.max(reach, 98);
      arcHalfAngle = Math.PI * 0.32; // piercing thrust
    } else if (weapon.visual === 'lapse_blue') {
      reach = Math.max(reach, 85);
      arcHalfAngle = Math.PI * 0.38; // forward gravity vortex
    } else if (weapon.visual === 'warhammer_2h') {
      reach = Math.max(reach, 85);
      arcHalfAngle = Math.PI * 0.45;
    } else if (weapon.visual === 'crystal_blade') {
      reach = Math.max(reach, 72);
      arcHalfAngle = Math.PI * 0.48;
    } else if (weapon.visual === 'sword_1h') {
      reach = Math.max(reach, 65);
      arcHalfAngle = Math.PI * 0.42;
    } else if (weapon.visual === 'dual_snap_blades') {
      reach = Math.max(reach, 70);
      arcHalfAngle = Math.PI * 0.48;
    } else if (weapon.visual === 'david_shotgun') {
      reach = Math.max(reach, 175);
      arcHalfAngle = Math.PI * 0.38; // ~44° shotgun spread cone
    }

    const isShotgun = weapon.visual === 'david_shotgun';
    const totalPellets = weapon.pellets || 6;
    const spreadAngle = weapon.spread || 0.38;
    const perPelletDmg = weapon.damage || 14;

    let hits = [];

    for (const target of targets) {
      if (!target || target === attacker) continue;

      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.hypot(dx, dy);

      // Shotgun Conical Spread Multi-Pellet Hit Calculation
      if (isShotgun) {
        const maxHitDist = (attacker.radius || 22) + reach + (target.radius || 24);
        if (dist > maxHitDist) continue;

        const attackAngle = attacker.angle + (options.angleOffset || 0);
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = angleToTarget - attackAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // If target is behind player or outside maximum spread cone margin, skip
        if (Math.abs(angleDiff) > (spreadAngle * 0.5 + 0.32)) continue;

        let pelletsHit = 0;
        const targetRadius = (target.radius || 24) + 6;

        // Point-blank blast: within point-blank proximity, ALL 6 pellets are guaranteed to connect!
        if (dist <= (attacker.radius || 22) + targetRadius + 28 && Math.abs(angleDiff) <= 0.65) {
          pelletsHit = totalPellets;
        } else {
          // Ray-circle intersection test for each individual conical pellet ray
          for (let i = 0; i < totalPellets; i++) {
            const pelletAngle = -spreadAngle / 2 + (spreadAngle / (totalPellets - 1)) * i;
            let rayDiff = angleToTarget - (attackAngle + pelletAngle);
            while (rayDiff > Math.PI) rayDiff -= Math.PI * 2;
            while (rayDiff < -Math.PI) rayDiff += Math.PI * 2;

            if (Math.cos(rayDiff) > 0) {
              const perpDist = dist * Math.abs(Math.sin(rayDiff));
              if (perpDist <= targetRadius) {
                pelletsHit++;
              }
            }
          }
        }

        if (pelletsHit > 0) {
          const critBonus = (attacker.equipment?.helmet?.critChance || 0) + (attacker.equipment?.weapon?.critChance || 0);
          const isCrit = Math.random() < (0.08 + critBonus);

          // Sum damage across all hitting pellets (point-blank 6 pellets = up to 84+ base dmg!)
          let totalDmg = 0;
          for (let p = 0; p < pelletsHit; p++) {
            totalDmg += perPelletDmg * (0.9 + Math.random() * 0.2);
          }
          const finalDamage = Math.round(totalDmg * (isCrit ? 1.85 : 1.0));

          const isBlocked = target.isBlocking && Math.abs(angleDiff) > Math.PI * 0.5;
          const damageTaken = isBlocked
            ? Math.round(finalDamage * (1 - (target.equipment?.offhand?.blockMitigation || 0.6)))
            : finalDamage;

          // Devastating knockback scaling with number of pellets that hit (up to 740 knockback!)
          const knockback = 340 + (pelletsHit / totalPellets) * 400;

          hits.push({
            target,
            damage: damageTaken,
            isCrit,
            isBlocked,
            isPull: false,
            angle: attacker.angle,
            knockback,
            pelletsHit,
            totalPellets
          });
        }
        continue;
      }

      // Standard single-hit weapon check (swords, hammers, spears)
      const maxHitDist = (attacker.radius || 22) + reach + (target.radius || 24);
      if (dist <= maxHitDist) {
        const attackAngle = attacker.angle + (options.angleOffset || 0);
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = angleToTarget - attackAngle;

        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= arcHalfAngle) {
          const critBonus = (attacker.equipment?.helmet?.critChance || 0) + (attacker.equipment?.weapon?.critChance || 0);
          const isCrit = Math.random() < (0.08 + critBonus);
          const finalDamage = Math.round(baseDamage * (isCrit ? 1.85 : (0.9 + Math.random() * 0.2)));

          const isBlocked = target.isBlocking && Math.abs(angleDiff) > Math.PI * 0.5;
          const damageTaken = isBlocked
            ? Math.round(finalDamage * (1 - (target.equipment?.offhand?.blockMitigation || 0.6)))
            : finalDamage;

          let knockback = weapon.hands === 2 ? 520 : 340;
          if (isBlue) {
            knockback = -480;
          } else if (attacker.isBerserk) {
            knockback = 650;
          }

          hits.push({
            target,
            damage: damageTaken,
            isCrit,
            isBlocked,
            isPull: isBlue,
            angle: attacker.angle,
            knockback
          });
        }
      }
    }

    return hits;
  }

  /**
   * Executes an off-hand attack or special ability (Right-click).
   * Supports Gojo's Reversal Red (massive repulsive knockback blast),
   * Sukuna's Hiten Fire Spear, Tome rune pulse, or standard slap/shield bash.
   */
  performOffhandAttack(attacker, targets = []) {
    // If weapon is two-handed, perform the primary weapon attack instead of punch/slap
    if (attacker.equipment?.weapon?.hands === 2) {
      return this.performWeaponAttack(attacker, targets);
    }

    const offhand = attacker.equipment?.offhand;
    const offhandVisual = offhand?.visual;

    let reach = 55;
    let arcHalfAngle = Math.PI * 0.40;
    let baseDamage = 15;
    let knockback = 380;
    let attackType = 'slap';

    if (offhandVisual === 'reversal_red') {
      // Gojo's Cursed Technique Reversal: RED
      // Maximum repulsive force: Violently blast targets backwards!
      reach = 115;
      arcHalfAngle = Math.PI * 0.48; // 86° blast cone
      baseDamage = 88;
      knockback = 1080; // Colossal repulsive push!
      attackType = 'reversal_red';
    } else if (offhandVisual === 'sukuna_hiten') {
      reach = 95;
      arcHalfAngle = Math.PI * 0.35;
      baseDamage = 65;
      knockback = 520;
      attackType = 'sukuna_hiten';
    } else if (offhandVisual === 'tome') {
      reach = 85;
      arcHalfAngle = Math.PI * 0.50;
      baseDamage = 35;
      knockback = 480;
      attackType = 'tome';
    } else if (offhandVisual && offhandVisual.includes('shield')) {
      reach = 58;
      arcHalfAngle = Math.PI * 0.42;
      baseDamage = 20;
      knockback = 580; // Shield bash push
      attackType = 'shield_bash';
    } else if (offhandVisual === 'david_gorilla_arms') {
      reach = 78;
      arcHalfAngle = Math.PI * 0.38;
      baseDamage = 52;
      knockback = 760; // Powerful hydraulic cybernetic punch!
      attackType = 'gorilla_punch';
    }

    if (attacker.isBerserk) {
      baseDamage = Math.round(baseDamage * 2.0);
    }

    let hits = [];

    for (const target of targets) {
      if (!target || target === attacker) continue;

      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.hypot(dx, dy);

      const maxHitDist = (attacker.radius || 22) + reach + (target.radius || 24);
      if (dist <= maxHitDist) {
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = angleToTarget - attacker.angle;

        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= arcHalfAngle) {
          const isCrit = Math.random() < (attacker.equipment?.helmet?.critChance || 0.08);
          const finalDamage = Math.round(baseDamage * (isCrit ? 1.85 : (0.9 + Math.random() * 0.2)));

          const isBlocked = target.isBlocking && Math.abs(angleDiff) > Math.PI * 0.5;
          const damageTaken = isBlocked
            ? Math.round(finalDamage * (1 - (target.equipment?.offhand?.blockMitigation || 0.6)))
            : finalDamage;

          hits.push({
            target,
            damage: damageTaken,
            isCrit,
            isBlocked,
            isPull: false,
            angle: attacker.angle,
            knockback,
            attackType
          });
        }
      }
    }

    return hits;
  }

  /**
   * Triggers Active Ability (Q key).
   * Checks for completed Anime Set bonus first (which replaces Q with the Cinematic Ultimate),
   * otherwise falls back to the chest piece base Q ability.
   */
  triggerActiveAbility(player, setBonus = null, triggerCinematicCallback = null) {
    const now = performance.now() / 1000;

    // --- LEVI ACKERMAN ODM MODE TOGGLE (Dual Snap Blades, ODM Harness, or Full Set) ---
    const isLevi = (setBonus && (setBonus.ultimateQ === 'levi_grapple_whirlwind' || setBonus.setKey === 'levi')) ||
      (player.equipment?.weapon?.visual === 'dual_snap_blades') ||
      (player.equipment?.chest?.visual === 'odm_harness') ||
      (player.equipment?.helmet?.visual === 'scout_hood') ||
      (player.equipment?.pants?.visual === 'scout_trousers') ||
      (player.equipment?.boots?.visual === 'scout_boots');

    if (isLevi) {
      // Rapid fluid stance switch debounce (0.2s) - NOT locked by 8.0s ultimate cooldown!
      if (player.lastOdmToggleTime && now - player.lastOdmToggleTime < 0.2) {
        return false;
      }
      player.lastOdmToggleTime = now;
      player.isOdmMode = !player.isOdmMode;

      if (player.isOdmMode) {
        this.audio.playOdmGasHiss();
        this.particles.spawnComicText(player.x, player.y - 36, 'ODM MODE: ACTIVE! ⚔️', '#10b981');
        this.particles.spawnDashBurst(player.x, player.y, player.angle + Math.PI, '#ffffff');
      } else {
        player.activeCables = [];
        player.isAirborne = false;
        this.particles.spawnComicText(player.x, player.y - 36, 'ODM MODE: OFF', '#94a3b8');
      }
      player.syncHUD();
      return true;
    }

    const cooldownDuration = setBonus ? 8.0 : 5.0;

    // Cooldown check for all other ultimate / active abilities
    if (player.lastAbilityTime && now - player.lastAbilityTime < cooldownDuration) {
      const remaining = (cooldownDuration - (now - player.lastAbilityTime)).toFixed(1);
      this.particles.spawnComicText(player.x, player.y - 30, `COOLDOWN ${remaining}s`, '#94a3b8');
      return false;
    }

    player.lastAbilityTime = now;

    // --- 1. FULL SET CINEMATIC ULTIMATE Q ---
    if (setBonus && setBonus.ultimateQ) {
      if (setBonus.ultimateQ === 'hollow_purple') {
        // Gojo: Hollow Purple!
        this.audio.playHollowPurple();
        this.particles.spawnComicText(player.x, player.y - 36, 'HOLLOW PURPLE!', '#c084fc');
        if (triggerCinematicCallback) {
          triggerCinematicCallback('hollow_purple', player);
        }
        return true;
      } else if (setBonus.ultimateQ === 'world_cutting_slash') {
        // Sukuna: World Cutting Slash!
        this.audio.playWorldCuttingSlash();
        this.particles.spawnComicText(player.x, player.y - 36, 'WORLD CUTTING SLASH!', '#ff2a5f');
        if (triggerCinematicCallback) {
          triggerCinematicCallback('world_cutting_slash', player);
        }
        return true;
      } else if (setBonus.ultimateQ === 'inverted_chain_rampage') {
        // Toji: Thousand-Mile Chain Rampage!
        this.audio.playChainRampage();
        this.particles.spawnComicText(player.x, player.y - 36, 'CHAIN RAMPAGE!', '#38bdf8');
        if (triggerCinematicCallback) {
          triggerCinematicCallback('inverted_chain_rampage', player);
        }
        return true;
      } else if (setBonus.ultimateQ === 'berserker_rage') {
        // Guts: Berserker Beast Armor Unleashed!
        player.isBerserk = true;
        player.berserkTimer = 6.0;
        player.isInvulnerable = false; // Damageable with high mitigation so Life Steal can restore HP!
        player.currentSpeed = player.baseSpeed * 1.55;
        this.audio.playBerserkRoar();
        this.audio.playClang();
        this.particles.spawnComicText(player.x, player.y - 36, 'BERSERKER RAGE! 🩸 LIFE STEAL + UNSTOPPABLE', '#ef4444');
        if (triggerCinematicCallback) {
          triggerCinematicCallback('berserker_rage', player);
        }
        return true;
      } else if (setBonus.ultimateQ === 'sandevistan_time_dilation') {
        // David Martinez: Military-Grade Sandevistan Overclock!
        player.isSandevistan = true;
        player.sandevistanTimer = 4.0;
        player.currentSpeed = player.baseSpeed * 1.35; // David moves rapidly while world is slowed!
        if (this.audio.playSandevistanBoot) this.audio.playSandevistanBoot();
        else if (this.audio.playBarrierHum) this.audio.playBarrierHum();

        this.particles.spawnComicText(player.x, player.y - 36, 'SANDEVISTAN OVERCLOCK! ⚡ TIME DILATION', '#00ff88');
        this.particles.spawnDashBurst(player.x, player.y, 0, '#00ff88');
        if (triggerCinematicCallback) {
          triggerCinematicCallback('sandevistan', player);
        }
        return true;
      }
    }

    // --- 2. BASE CHEST ACTIVE ABILITY ---
    const chest = player.equipment?.chest;
    if (!chest) return false;

    if (chest.baseQ === 'overcharge_boost' || chest.visual === 'david_jacket') {
      // David Martinez Base Q: Overcharge Boost (Speed surge +35% for 3.0s)
      player.isOvercharged = true;
      player.overchargeTimer = 3.0;
      player.currentSpeed = player.baseSpeed * 1.35;
      if (this.audio.playGravitationalSurge) this.audio.playGravitationalSurge();
      this.particles.spawnComicText(player.x, player.y - 32, 'OVERCHARGE BOOST! ⚡ +35% SPEED', '#00ff88');
      this.particles.spawnDashBurst(player.x, player.y, player.angle + Math.PI, '#00ff88');
      if (triggerCinematicCallback) {
        triggerCinematicCallback('overcharge_boost', player);
      }
    } else if (chest.baseQ === 'limitless_barrier' || chest.visual === 'gojo_tunic') {
      // Limitless Barrier (Mugen): 3.5s infinity field that traps projectiles and violently deflects them
      player.isInvulnerable = true;
      player.isLimitlessBarrier = true;
      player.limitlessTimer = 3.5;
      player.currentSpeed = player.baseSpeed * 1.45;
      this.particles.spawnComicText(player.x, player.y - 32, 'INFINITY BARRIER! 🌀', '#00f0ff');
      this.particles.spawnDashBurst(player.x, player.y, 0, '#00f0ff');
      this.audio.playBarrierHum();
      if (triggerCinematicCallback) {
        triggerCinematicCallback('limitless_barrier', player);
      }
    } else if (chest.baseQ === 'dismantle' || chest.visual === 'sukuna_robe') {
      // Dismantle: 3 rapid cursed razor slashes
      this.audio.playDismantleCuts();
      this.particles.spawnComicText(player.x, player.y - 32, 'DISMANTLE!', '#ff2a5f');
      if (triggerCinematicCallback) {
        triggerCinematicCallback('dismantle', player);
      }
    } else if (chest.baseQ === 'spartan_kick' || chest.visual === 'toji_shirt') {
      // Spartan Kick: Colossal forward lunge & knockback shockwave + STUN
      this.audio.playSpartanKick();
      if (player.startLunge) {
        player.startLunge(player.angle, 880, 0.28);
      }
      this.particles.spawnComicText(player.x, player.y - 32, 'SPARTAN KICK!', '#38bdf8');
      this.particles.spawnDashBurst(player.x, player.y, player.angle, '#38bdf8');
      if (triggerCinematicCallback) {
        triggerCinematicCallback('spartan_kick', player);
      }
    } else if (chest.baseQ === 'cannon_arm' || chest.visual === 'guts_berserker_plate') {
      // Guts Cannon Arm: Left arm prosthetic flips open firing explosive blast
      this.audio.playExplosion();
      this.particles.spawnComicText(player.x, player.y - 32, 'CANNON BLAST!', '#fbbf24');
      if (triggerCinematicCallback) {
        triggerCinematicCallback('cannon_arm', player);
      }
    } else if (chest.baseQ === 'odm_gas_boost' || chest.visual === 'odm_harness') {
      // Levi Base Q: ODM Gas Boost
      this.audio.playOdmGasHiss();
      if (player.startLunge) {
        player.startLunge(player.angle, 780, 0.25);
      }
      this.particles.spawnComicText(player.x, player.y - 32, 'GAS BOOST! 💨', '#10b981');
      this.particles.spawnDashBurst(player.x, player.y, player.angle + Math.PI, '#ffffff');
      if (triggerCinematicCallback) {
        triggerCinematicCallback('odm_gas_boost', player);
      }
    } else if (chest.visual === 'celestial_chest') {
      // Celestial Radiance: Heal 35 HP + Shockwave
      player.hp = Math.min(player.maxHp, player.hp + 35);
      this.particles.spawnComicText(player.x, player.y - 32, 'CELESTIAL HEAL! +35', '#fbbf24');
      this.particles.spawnDashBurst(player.x, player.y, 0, '#fbbf24');
      this.audio.playDescentFanfare();
    } else if (chest.visual === 'steel_chest') {
      // Iron Bastion: 4-second hardened defense
      player.isHardened = true;
      setTimeout(() => (player.isHardened = false), 4000);
      this.particles.spawnComicText(player.x, player.y - 32, 'IRON BASTION!', '#38bdf8');
      this.audio.playShieldLock();
    } else {
      // War Cry
      this.particles.spawnComicText(player.x, player.y - 32, 'WAR CRY! +SPEED', '#ff3366');
      player.vx *= 1.5;
      player.vy *= 1.5;
      this.audio.playWarCry();
    }

    return true;
  }
}
