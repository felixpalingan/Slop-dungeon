/**
 * Procedural 2D Shape Renderer for Dungeon Slop
 * Renders characters with dynamic equipped gear (helmets, visors, horns, armor vests, boots, weapons, and shields)
 * using pure HTML5 Canvas vector math.
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.camera = { x: 0, y: 0, zoom: 1.0 };
    this.tileSize = 64;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  clear() {
    this.ctx.fillStyle = '#08090d';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  beginCamera(targetX, targetY) {
    this.camera.x = targetX;
    this.camera.y = targetY;

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  endCamera() {
    this.ctx.restore();
  }

  drawDungeonFloor(bounds = { minX: -800, minY: -800, maxX: 800, maxY: 800 }) {
    const ctx = this.ctx;
    const size = this.tileSize;

    const startCol = Math.floor(bounds.minX / size);
    const endCol = Math.ceil(bounds.maxX / size);
    const startRow = Math.floor(bounds.minY / size);
    const endRow = Math.ceil(bounds.maxY / size);

    for (let col = startCol; col < endCol; col++) {
      for (let row = startRow; row < endRow; row++) {
        const x = col * size;
        const y = row * size;
        const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
        const baseShade = 16 + Math.floor(hash * 8);
        ctx.fillStyle = `rgb(${baseShade}, ${baseShade + 2}, ${baseShade + 6})`;
        ctx.fillRect(x, y, size, size);

        ctx.strokeStyle = '#0e1118';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        if (hash > 0.8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(x + 10, y + 10, size - 20, size - 20);
        } else if (hash < 0.15) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.moveTo(x + 16, y + 20);
          ctx.lineTo(x + 28, y + 36);
          ctx.lineTo(x + 44, y + 32);
          ctx.stroke();
        }
      }
    }

    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 12;
    ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.minX + 6, bounds.minY + 6, bounds.maxX - bounds.minX - 12, bounds.maxY - bounds.minY - 12);
  }

  drawAfterImages(afterImages) {
    const ctx = this.ctx;
    for (const img of afterImages) {
      ctx.save();
      ctx.translate(img.x, img.y);
      ctx.rotate(img.angle);
      ctx.globalAlpha = Math.max(0, img.alpha);
      ctx.fillStyle = img.color;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draws active ODM high-tension cables connecting from character hips to anchor points
   */
  drawOdmCables(entity) {
    if (!entity.activeCables || entity.activeCables.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < entity.activeCables.length; i++) {
      const cable = entity.activeCables[i];
      // Side: Left hip (-16px) for cable 0, Right hip (+16px) for cable 1
      const side = (i === 0) ? -1 : 1;
      const hipOffset = side * 16;
      const hipX = entity.x + Math.cos(entity.angle + Math.PI / 2) * hipOffset;
      const hipY = entity.y + Math.sin(entity.angle + Math.PI / 2) * hipOffset;

      // Outer steel cable
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(cable.anchorX, cable.anchorY);
      ctx.stroke();

      // Shiny core wire
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(cable.anchorX, cable.anchorY);
      ctx.stroke();

      // Grapple Hook / Piton anchored at target
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cable.anchorX, cable.anchorY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spark / anchor impact head
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cable.anchorX, cable.anchorY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draws character with full 6-slot procedural 2D visual equipment:
   * - Helmet: Horns, Visor, Cowl
   * - Chestpiece: Leather vest, Spiked cuirass, Celestial gold mantle
   * - Boots: Floating foot indicators
   * - Weapons: 1H Shortsword, Crystal Scimitar, 2H Titan Greatsword, 2H Warhammer
   * - Off-hand: Wooden Buckler, Tower Shield, Arcane Grimoire Tome
   */
  drawCharacter(entity) {
    const {
      x,
      y,
      radius = 22,
      angle = 0,
      color = '#00f0ff',
      isRolling = false,
      name = 'Player',
      isAttacking = false,
      attackProgress = 0,
      isSlapping = false,
      slapProgress = 0,
      isBerserk = false,
      equipment = {}
    } = entity;

    const ctx = this.ctx;

    // Draw high-tension ODM Grapple Cables in world coordinates before entity translation
    if (entity.activeCables && entity.activeCables.length > 0) {
      this.drawOdmCables(entity);
    }

    ctx.save();
    ctx.translate(x, y);

    // Drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, radius + 5, radius * 1.15, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // Rotate facing mouse direction
    ctx.rotate(angle);

    // Levi Ackerman ODM Whirlwind Spin on Enemy Hit
    if (entity.spinTimer && entity.spinTimer > 0) {
      const spinProg = Math.max(0, entity.spinTimer / 0.22);
      const spinRot = (1 - spinProg) * Math.PI * 4;
      ctx.rotate(spinRot);

      // Emerald razor whirlwind slash ring
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 22, spinRot * 2, spinRot * 2 + Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    // Berserker rage demonic crimson aura
    if (isBerserk) {
      ctx.save();
      const pulse = Math.sin(Date.now() * 0.015) * 3;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4 + pulse;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rolling after-image/blur outline
    if (isRolling) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    const weapon = equipment.weapon;
    const offhand = equipment.offhand;
    const helmet = equipment.helmet;
    const chest = equipment.chest;
    const pants = equipment.pants;
    const boots = equipment.boots;
    const is2H = weapon && weapon.hands === 2;

    // --- WEAPON-SPECIFIC ATTACK ANIMATION & SLASH VISUALS ---
    if (isAttacking && attackProgress > 0 && attackProgress < 1) {
      ctx.save();
      const p = attackProgress;

      if (weapon?.visual === 'lapse_blue') {
        // Gojo's Lapse Blue: Concentric expanding gravitational ripple rings & distortion
        const reach = radius + 35 + p * 50;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        // 3 Expanding gravitational shockwaves
        for (let r = 1; r <= 3; r++) {
          const ringDist = reach * (r / 3);
          const ringAlpha = Math.max(0, (1 - p) * 0.85);
          ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha})`;
          ctx.beginPath();
          ctx.arc(ringDist, 0, 16 + r * 10, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();
        }
        // Inward suction streaks
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(reach + 20, -18);
        ctx.lineTo(reach - 8, 0);
        ctx.moveTo(reach + 20, 18);
        ctx.lineTo(reach - 8, 0);
        ctx.stroke();
      } else if (weapon?.visual === 'sukuna_kamutoke') {
        // Sukuna's Kamutoke: Crackling jagged lightning bolts sparking from dagger tip
        const reach = radius + 30 + Math.sin(p * Math.PI * 3) * 35;
        ctx.strokeStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(radius + 15, 0);
        ctx.lineTo(reach * 0.4, (Math.sin(p * 20) * 14));
        ctx.lineTo(reach * 0.7, (Math.cos(p * 25) * 16));
        ctx.lineTo(reach + 15, (Math.sin(p * 30) * 12));
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(radius + 15, 0);
        ctx.lineTo(reach * 0.5, (Math.cos(p * 20) * 12));
        ctx.lineTo(reach + 10, (Math.sin(p * 15) * 8));
        ctx.stroke();
      } else if (weapon?.visual === 'sukuna_cleaver') {
        // Sukuna's Malevolent Cleaver: Blood-red crescent cleave + crossing X dismantle slash
        const slashReach = radius + 52;
        const startAngle = -Math.PI * 0.4 + p * Math.PI * 1.35;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - Math.PI * 0.55, startAngle);
        ctx.strokeStyle = `rgba(239, 68, 68, ${1 - p})`;
        ctx.lineWidth = 7;
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // White razor edge
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.9})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - Math.PI * 0.4, startAngle);
        ctx.stroke();

        // Intersecting X dismantle cut in front
        if (p > 0.25 && p < 0.85) {
          ctx.strokeStyle = 'rgba(255, 42, 95, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(slashReach - 15, -18);
          ctx.lineTo(slashReach + 22, 18);
          ctx.moveTo(slashReach - 15, 18);
          ctx.lineTo(slashReach + 22, -18);
          ctx.stroke();
        }
      } else if (weapon?.visual === 'inverted_spear_chain') {
        // Toji's Inverted Spear: Long piercing silver thrust stream + uncoiling iron chain
        const thrustReach = radius + 15 + Math.sin(p * Math.PI) * 65;
        // Chain trail behind spear
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(thrustReach - 15, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sharp thrust shockwave cone at tip
        ctx.strokeStyle = `rgba(56, 189, 248, ${1 - p})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(thrustReach - 10, -14);
        ctx.lineTo(thrustReach + 20, 0);
        ctx.lineTo(thrustReach - 10, 14);
        ctx.stroke();
      } else if (weapon?.visual === 'dragon_slayer') {
        // Guts' Colossal Dragon Slayer: Massive dark iron cleave arc with crimson blood trim & debris sparks
        const slashReach = radius + 64;
        const cleaveArc = -Math.PI * 0.55 + p * Math.PI * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, cleaveArc - Math.PI * 0.65, cleaveArc);
        ctx.strokeStyle = `rgba(15, 23, 42, ${1 - p * 0.6})`;
        ctx.lineWidth = 12;
        ctx.stroke();

        ctx.strokeStyle = `rgba(239, 68, 68, ${1 - p})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, cleaveArc - Math.PI * 0.5, cleaveArc);
        ctx.stroke();

        // Flying red-hot metal friction sparks
        for (let s = 0; s < 3; s++) {
          const sparkAngle = cleaveArc - Math.PI * 0.18 * s;
          const sx = Math.cos(sparkAngle) * (slashReach + 6 + s * 8);
          const sy = Math.sin(sparkAngle) * (slashReach + 6 + s * 8);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (weapon?.visual === 'warhammer_2h') {
        // Thunder Warhammer: Shockwave slam with radiating ground fracture sparks
        const slamDist = radius + 38;
        ctx.strokeStyle = `rgba(245, 158, 11, ${1 - p})`;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(slamDist, 0, 18 + p * 24, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Concussive impact ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(slamDist, 0, 8 + p * 16, 0, Math.PI * 2);
        ctx.stroke();
      } else if (weapon?.visual === 'crystal_blade') {
        // Crystal Scimitar: Dual turquoise prism arcs + refracting glints
        const slashReach = radius + 34;
        const startAngle = -Math.PI * 0.45 + p * Math.PI * 1.1;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - Math.PI * 0.5, startAngle);
        ctx.strokeStyle = `rgba(56, 189, 248, ${1 - p})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Inner refracted prism line
        ctx.beginPath();
        ctx.arc(0, 0, slashReach - 6, startAngle - Math.PI * 0.4, startAngle);
        ctx.strokeStyle = `rgba(192, 132, 252, ${(1 - p) * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (weapon?.visual === 'greatsword_2h') {
        // Titan Greatsword: Wide golden sweeping cleave arc
        const slashReach = radius + 48;
        const startAngle = -Math.PI * 0.52 + p * Math.PI * 1.35;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - Math.PI * 0.65, startAngle);
        ctx.strokeStyle = `rgba(251, 191, 36, ${1 - p})`;
        ctx.lineWidth = 7;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - Math.PI * 0.4, startAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.9})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (weapon?.visual === 'david_shotgun') {
        // Carnage Shotgun blast cone: 6 distinct glowing pellet streaks with muzzle fire
        const muzzleDist = radius + 18;
        const spreadAngle = 0.38;
        const pelletReach = 120 + p * 60;

        // Orange/yellow muzzle flash burst
        if (p < 0.35) {
          const flashAlpha = (0.35 - p) * 2.8;
          ctx.fillStyle = `rgba(255, 160, 40, ${flashAlpha})`;
          ctx.shadowColor = '#ff8c00';
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(muzzleDist + 8, 0, 18 - p * 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // 6 pellet streaks in conical spread
        for (let i = 0; i < 6; i++) {
          const pelletAngle = -spreadAngle / 2 + (spreadAngle / 5) * i;
          const trailLen = pelletReach * (1 - p * 0.6);
          const startX = muzzleDist;
          const endX = startX + Math.cos(pelletAngle) * trailLen;
          const endY = Math.sin(pelletAngle) * trailLen;
          const pelletAlpha = Math.max(0, 1 - p * 1.2);

          ctx.strokeStyle = `rgba(255, 200, 60, ${pelletAlpha})`;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX, 0);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Smoke ring
        if (p > 0.15 && p < 0.7) {
          const smokeAlpha = Math.max(0, 0.35 - (p - 0.15) * 0.65);
          ctx.strokeStyle = `rgba(200, 200, 200, ${smokeAlpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(muzzleDist + 4, 0, 12 + p * 18, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        }
      } else {
        // Default sword/blade cleave arc
        const slashReach = is2H ? radius + 46 : radius + 30;
        const startAngle = -Math.PI * 0.48 + p * Math.PI * (is2H ? 1.3 : 0.9);
        const arcSpread = Math.PI * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, startAngle - arcSpread, startAngle);
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - p) + ')';
        ctx.lineWidth = is2H ? 6 : 4;
        ctx.shadowColor = is2H ? '#fbbf24' : '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- VISUAL BOOTS / FEET (Underneath body) ---
    let bootColor = '#78350f';
    if (boots?.visual === 'winged_boots') bootColor = '#38bdf8';
    else if (boots?.visual === 'gojo_loafers') bootColor = '#020617';
    else if (boots?.visual === 'sukuna_zori') bootColor = '#d97706';
    else if (boots?.visual === 'toji_slippers') bootColor = '#1e293b';
    else if (boots?.visual === 'guts_sollerets') bootColor = '#0f172a';
    else if (boots?.visual === 'david_sneakers') bootColor = '#94a3b8';

    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.ellipse(-10, -radius * 0.6, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(-10, radius * 0.6, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings on boots if wind striders equipped
    if (boots?.visual === 'winged_boots') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -radius * 0.7);
      ctx.lineTo(-18, -radius * 0.9);
      ctx.moveTo(-12, radius * 0.7);
      ctx.lineTo(-18, radius * 0.9);
      ctx.stroke();
    } else if (boots?.visual === 'david_sneakers') {
      // Chrome Cyber-Sneakers: Neon green glowing soles
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-10, -radius * 0.6, 7, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(-10, radius * 0.6, 7, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // --- HANDS & WEAPONS ---
    const handRadius = 7;
    const handDistance = radius + 8;
    const isDualWield = weapon?.visual === 'dual_snap_blades';

    // LEFT HAND (Off-hand / Shield / 2H Grip / Dual Wield)
    let leftHandX = 10;
    let leftHandY = -handDistance;
    let leftBladeAngle = 0;

    if (isDualWield) {
      // True Dual Wielding: Left hand holds Left Snap Blade on the left side
      leftHandX = 10;
      leftHandY = -handDistance;
      leftBladeAngle = 0;

      const isLAttacking = entity.isLeftAttacking;
      const pL = entity.leftAttackProgress || 0;
      if (isLAttacking && pL > 0 && pL < 1) {
        // Left hand slashes inward across from left to right!
        const leftArc = -Math.PI * 0.45 + pL * (Math.PI * 0.65);
        leftHandX = Math.cos(leftArc) * (handDistance + 6);
        leftHandY = Math.sin(leftArc) * (handDistance + 6);
        leftBladeAngle = leftArc + Math.PI * 0.35;
      }
    } else if (is2H) {
      // Both hands grip the heavy 2-handed weapon!
      leftHandX = 16;
      leftHandY = 4;
    } else if (entity.isBlocking) {
      // Raise shield forward in defensive stance!
      leftHandX = 22;
      leftHandY = -6;
    } else if (isSlapping && slapProgress > 0 && slapProgress < 1) {
      const thrust = Math.sin(slapProgress * Math.PI) * 26;
      leftHandX += thrust;
      leftHandY += thrust * 0.3;
    }

    // Draw Left Hand & Off-hand if not 2-handed (or if dual-wielding)
    if (!is2H || isDualWield) {
      ctx.save();
      ctx.translate(leftHandX, leftHandY);

      if (isDualWield) {
        // Levi's Left Snap Blade held in left hand!
        ctx.save();
        ctx.rotate(leftBladeAngle);

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -2.5);
        ctx.lineTo(38, -2.5);
        ctx.lineTo(44, 0); // angled snap blade tip
        ctx.lineTo(38, 2.5);
        ctx.lineTo(0, 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Segmented snap cutter lines
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let s = 10; s <= 32; s += 8) {
          ctx.beginPath();
          ctx.moveTo(s, -2.5);
          ctx.lineTo(s - 2.5, 2.5);
          ctx.stroke();
        }

        // Brake trigger handle grip
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -3, 6, 6);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(-6, -3, 6, 6);
        ctx.restore();
      } else if (offhand) {
        if (offhand.visual === 'reversal_red') {
          // Gojo's Reversal Red floating glowing sphere
          const pulseRed = (isSlapping && slapProgress > 0 && slapProgress < 1)
            ? 16 + Math.sin(slapProgress * Math.PI) * 10
            : 8 + Math.sin(Date.now() * 0.008) * 2;
          ctx.beginPath();
          ctx.arc(0, 0, pulseRed, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = (isSlapping && slapProgress > 0 && slapProgress < 1) ? 26 : 14;
          ctx.fill();
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Outward expanding red repulsion rings during slap
          if (isSlapping && slapProgress > 0 && slapProgress < 1) {
            ctx.save();
            ctx.strokeStyle = `rgba(239, 68, 68, ${1 - slapProgress})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(20 * slapProgress, 0, 16 + slapProgress * 22, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.restore();
          }
        } else if (offhand.visual === 'david_gorilla_arms') {
          // David's Gorilla Arms: Reinforced cybernetic knuckles with brass pistons
          const punchPulse = (isSlapping && slapProgress > 0 && slapProgress < 1);
          const armScale = punchPulse ? 1.0 + Math.sin(slapProgress * Math.PI) * 0.35 : 1.0;

          ctx.save();
          ctx.scale(armScale, armScale);

          // Heavy chrome knuckle housing
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-4, -8, 16, 16, [3]);
          ctx.fill();
          ctx.stroke();

          // Brass hydraulic piston rods
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-2, -6, 3, 4);
          ctx.fillRect(-2, 2, 3, 4);

          // Red knuckle plating
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, -5, 4, 10);

          ctx.restore();

          // Hydraulic punch impact shockwave during slap
          if (punchPulse) {
            ctx.save();
            const shockAlpha = Math.max(0, 1 - slapProgress * 1.5);
            ctx.strokeStyle = `rgba(0, 255, 136, ${shockAlpha})`;
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(16 * slapProgress, 0, 14 + slapProgress * 28, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.stroke();

            // Inner cyan shockwave
            ctx.strokeStyle = `rgba(0, 240, 255, ${shockAlpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(12 * slapProgress, 0, 8 + slapProgress * 16, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();
            ctx.restore();
          }
        } else if (offhand.visual === 'sukuna_hiten') {
          // Sukuna Hiten Fire Spear
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(16, -6);
          ctx.lineTo(26, 0);
          ctx.lineTo(16, 6);
          ctx.closePath();
          ctx.fill();
        } else if (offhand.visual === 'tower_shield') {
          // Iron Tower Shield (Tall rectangular steel shield with cross)
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(-6, -16, 12, 32, [4]);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Gold center crest
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-2, -6, 4, 12);
        } else if (offhand.visual === 'tome') {
          // Arcane Tome
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(-6, -10, 12, 20);
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-6, -10, 12, 20);
        } else {
          // Default / Wooden Buckler
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Left hand circle
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // RIGHT HAND & MAIN WEAPON
    let rightHandX = 10;
    let rightHandY = handDistance;
    let swordAngle = 0;

    if (weapon?.visual === 'dual_snap_blades') {
      const isRAttacking = entity.isRightAttacking;
      const pR = entity.rightAttackProgress || 0;
      if (isRAttacking && pR > 0 && pR < 1) {
        // Right hand slashes inward across from right to left!
        const rightArc = Math.PI * 0.45 - pR * (Math.PI * 0.65);
        rightHandX = Math.cos(rightArc) * (handDistance + 6);
        rightHandY = Math.sin(rightArc) * (handDistance + 6);
        swordAngle = rightArc - Math.PI * 0.35;
      }
    } else if (isAttacking && attackProgress > 0 && attackProgress < 1) {
      const p = attackProgress;
      if (weapon?.visual === 'lapse_blue') {
        // Gojo: Forward gravitational thrust
        const lunge = Math.sin(p * Math.PI) * 36;
        rightHandX = 14 + lunge;
        rightHandY = 4;
        swordAngle = 0;
      } else if (weapon?.visual === 'sukuna_kamutoke') {
        // Sukuna: Rapid triple-stab thrusts
        const stab = Math.max(0, Math.sin(p * Math.PI * 3)) * 34;
        rightHandX = 12 + stab;
        rightHandY = 8 + (p - 0.5) * 8;
        swordAngle = (p - 0.5) * 0.15;
      } else if (weapon?.visual === 'inverted_spear_chain') {
        // Toji: Chain spear extension
        const thrust = Math.sin(p * Math.PI) * 60;
        rightHandX = 16 + thrust;
        rightHandY = -thrust * 0.1;
        swordAngle = -0.05;
      } else if (weapon?.visual === 'dragon_slayer') {
        // Guts: Massive overhead down-cleave
        const cleaveArc = -Math.PI * 0.55 + p * Math.PI * 1.5;
        rightHandX = Math.cos(cleaveArc) * (handDistance + 10);
        rightHandY = Math.sin(cleaveArc) * (handDistance + 10);
        swordAngle = cleaveArc + Math.PI * 0.4;
      } else if (weapon?.visual === 'sukuna_cleaver') {
        // Sukuna: Heavy diagonal butcher cleave
        const cleaveArc = -Math.PI * 0.4 + p * Math.PI * 1.35;
        rightHandX = Math.cos(cleaveArc) * (handDistance + 7);
        rightHandY = Math.sin(cleaveArc) * (handDistance + 7);
        swordAngle = cleaveArc + Math.PI * 0.35;
      } else if (weapon?.visual === 'warhammer_2h') {
        // Thunder Warhammer: Overhead vertical hammer slam
        const downAngle = -Math.PI * 0.45 + p * Math.PI * 0.9;
        rightHandX = 12 + Math.sin(p * Math.PI) * 16;
        rightHandY = Math.sin(downAngle) * (handDistance + 6);
        swordAngle = (p - 0.25) * 1.5;
      } else if (weapon?.visual === 'crystal_blade') {
        // Crystal Scimitar: Agile curved figure-8 slice
        const sliceArc = -Math.PI * 0.4 + p * Math.PI * 1.25;
        rightHandX = Math.cos(sliceArc) * (handDistance + 4);
        rightHandY = Math.sin(sliceArc) * (handDistance + 4);
        swordAngle = sliceArc + Math.PI * 0.3;
      } else if (weapon?.visual === 'greatsword_2h') {
        // Titan Greatsword: Wide sweeping horizontal broad cleave
        const cleaveArc = -Math.PI * 0.5 + p * Math.PI * 1.35;
        rightHandX = Math.cos(cleaveArc) * (handDistance + 6);
        rightHandY = Math.sin(cleaveArc) * (handDistance + 6);
        swordAngle = cleaveArc + Math.PI * 0.38;
      } else if (weapon?.visual === 'david_shotgun') {
        // Carnage Shotgun: Heavy recoil kick backwards then snap forward
        const recoil = Math.sin(p * Math.PI) * -12; // kick backwards
        rightHandX = 14 + recoil;
        rightHandY = handDistance * 0.5;
        swordAngle = p * 0.08; // slight upward lift during recoil
      } else {
        // Standard sword swing
        const swingArc = -Math.PI * 0.45 + p * Math.PI * (is2H ? 1.4 : 1.1);
        rightHandX = Math.cos(swingArc) * (handDistance + 3);
        rightHandY = Math.sin(swingArc) * (handDistance + 3);
        swordAngle = swingArc + Math.PI * 0.35;
      }
    }

    ctx.save();
    ctx.translate(rightHandX, rightHandY);
    ctx.rotate(swordAngle);

    // If 2H weapon, draw second gripping hand on weapon hilt (unless dual wielding!)
    if (is2H && !isDualWield) {
      ctx.save();
      ctx.translate(-4, -6);
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Main Hand Circle
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Procedural Weapon Visuals based on equipped item
    if (weapon?.visual === 'dragon_slayer') {
      // Guts' Colossal Dragon Slayer: 92px long massive slab of dark iron
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(58, -6);
      ctx.lineTo(66, 0); // sharp pointed iron apex
      ctx.lineTo(58, 6);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Deep central blood fuller groove
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -2, 50, 4);

      // Chunky crossguard & hilt wrapping
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -12, 5, 24);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, -2, 6, 4);
    } else if (weapon?.visual === 'inverted_spear_chain') {
      // Toji's Inverted Spear of Heaven & Coiled Chain
      // 1. Thousand-Mile Chain links
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Inverted Spear twin-curved jitte blade
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(38, -2);
      ctx.lineTo(44, 0);
      ctx.lineTo(38, 2);
      ctx.lineTo(10, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inverted jitte hook prong
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.lineTo(24, -10);
      ctx.lineTo(26, -10);
      ctx.lineTo(24, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (weapon?.visual === 'lapse_blue') {
      // Gojo's Lapse Blue floating gravitational sphere
      const pulseBlue = (isAttacking && attackProgress > 0 && attackProgress < 1)
        ? 15 + Math.sin(attackProgress * Math.PI) * 14
        : 9 + Math.sin(Date.now() * 0.009) * 2;
      ctx.beginPath();
      ctx.arc(14, 0, pulseBlue, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = (isAttacking && attackProgress > 0 && attackProgress < 1) ? 30 : 16;
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (weapon?.visual === 'sukuna_kamutoke') {
      // Sukuna's Vajra Lightning Dagger
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(22, 0);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Lightning prongs
      ctx.strokeStyle = '#e11d48';
      ctx.strokeRect(10, -8, 4, 16);
    } else if (weapon?.visual === 'sukuna_cleaver') {
      // Sukuna's Malevolent Cleaver
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(46, -14);
      ctx.lineTo(50, 6);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (weapon?.visual === 'greatsword_2h') {
      // Colossal Titan Greatsword
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(44, -4);
      ctx.lineTo(52, 0);
      ctx.lineTo(44, 4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing fuller line down center
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(40, 0);
      ctx.stroke();

      // Crossguard
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, -10, 4, 20);
    } else if (weapon?.visual === 'warhammer_2h') {
      // Thunder Warhammer
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(36, 0);
      ctx.stroke();

      // Heavy hammer block head
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(28, -12, 14, 24);
      ctx.strokeRect(28, -12, 14, 24);
    } else if (weapon?.visual === 'crystal_blade') {
      // Crystal Scimitar
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(18, -8, 30, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (weapon?.visual === 'dual_snap_blades') {
      // Levi's Dual Ultrahard Steel Snap Blades (Right Blade)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(38, -2.5);
      ctx.lineTo(44, 0); // angled snap blade tip
      ctx.lineTo(38, 2.5);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Segmented snap cutter lines
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      for (let s = 10; s <= 32; s += 8) {
        ctx.beginPath();
        ctx.moveTo(s, -2.5);
        ctx.lineTo(s - 2.5, 2.5);
        ctx.stroke();
      }

      // Brake trigger handle grip
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -3, 6, 6);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-6, -3, 6, 6);
    } else if (weapon?.visual === 'david_shotgun') {
      // David's Carnage Shotgun: Bulky chrome & matte-black pump-action with muzzle brake
      // Barrel body
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, -5, 40, 10, [1, 3, 3, 1]);
      ctx.fill();
      ctx.stroke();

      // Chrome upper receiver
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(4, -6, 28, 3);

      // Muzzle brake at tip
      ctx.fillStyle = '#334155';
      ctx.fillRect(36, -7, 8, 14);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(36, -7, 8, 14);

      // Muzzle brake vents (3 horizontal slots)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let v = -4; v <= 4; v += 4) {
        ctx.beginPath();
        ctx.moveTo(38, v);
        ctx.lineTo(42, v);
        ctx.stroke();
      }

      // Pump grip (fore-end)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, 5, 14, 4);

      // Trigger guard
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, 6, 4, 0, Math.PI);
      ctx.stroke();
    } else {
      // Default Rusty Shortsword
      ctx.fillStyle = '#f7fafc';
      ctx.strokeStyle = '#cbd5e0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(26, -2.5);
      ctx.lineTo(32, 0);
      ctx.lineTo(26, 2.5);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ecc94b';
      ctx.fillRect(2, -6, 3, 12);
    }

    ctx.restore();

    // --- MAIN BODY / TORSO CIRCLE ---
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // --- PANTS / LEGS VISUAL ---
    if (pants) {
      if (pants.visual === 'david_pants') {
        // Streetkid Cargo Pants: Baggy charcoal with dangling neon straps
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.9, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();

        // Neon cyber dangling straps
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, -radius * 0.4);
        ctx.lineTo(-radius * 0.95, -radius * 0.2);
        ctx.stroke();

        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, radius * 0.4);
        ctx.lineTo(-radius * 0.95, radius * 0.2);
        ctx.stroke();
      } else if (pants.visual === 'scout_trousers') {
        // Scout Trousers: Crisp white trousers with dark brown harness straps
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.88, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();

        // Leather harness straps wrapped around thighs
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
      }
    }

    // --- CHESTPIECE VISUAL ---
    if (chest) {
      if (chest.visual === 'gojo_tunic') {
        // High-collar black jujutsu sorcerer tunic with polished buttons
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();

        // High neck collar flap
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(radius * 0.1, -8, 8, 16);
      } else if (chest.visual === 'sukuna_robe') {
        // Flowing white kimono with sharp black cursed tattoos
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-2, 0, radius * 0.75, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();

        // Cursed tattoo markings
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -6);
        ctx.lineTo(8, -6);
        ctx.moveTo(-4, 6);
        ctx.lineTo(8, 6);
        ctx.stroke();
      } else if (chest.visual === 'toji_shirt') {
        // Tight black compression shirt with muscle shading
        ctx.fillStyle = '#0b0f19';
        ctx.beginPath();
        ctx.arc(-2, 0, radius * 0.7, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
      } else if (chest.visual === 'guts_berserker_plate') {
        // Jagged, angular black iron Berserker cuirass with red blood trim
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-2, 0, radius * 0.78, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();

        // Spiked pauldrons
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -radius * 0.85, 8, 6);
        ctx.fillRect(-8, radius * 0.65, 8, 6);
      } else if (chest.visual === 'david_jacket') {
        // David's Gloria EMT Jacket: Oversized fluorescent neon-yellow with teal/cyan safety stripes
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.75, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();

        // Reflective teal safety stripes
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.58, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.42, -Math.PI * 0.25, Math.PI * 0.25);
        ctx.stroke();

        // Spinal Sandevistan chrome chassis visible along the back
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-radius * 0.6, -3, 8, 6);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.strokeRect(-radius * 0.6, -3, 8, 6);

        // High collar flap
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(radius * 0.15, -6, 6, 12);
      } else if (chest.visual === 'odm_harness') {
        // Levi's 3D Maneuver Gear: cropped caramel jacket, leather harnesses & dual silver gas tanks
        // 1. Cropped caramel tan Scout jacket
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();

        // 2. Cross leather straps
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(6, 8);
        ctx.moveTo(-4, 8);
        ctx.lineTo(6, -8);
        ctx.stroke();

        // 3. Dual silver gas canisters on left & right hips with brass valves
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        // Left hip canister
        ctx.beginPath();
        ctx.roundRect(-8, -radius * 0.95, 16, 5.5, [2]);
        ctx.fill();
        ctx.stroke();
        // Right hip canister
        ctx.beginPath();
        ctx.roundRect(-8, radius * 0.75, 16, 5.5, [2]);
        ctx.fill();
        ctx.stroke();

        // Brass pneumatic nozzle valves
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-10, -radius * 0.9, 2.5, 3.5);
        ctx.fillRect(-10, radius * 0.8, 2.5, 3.5);
      } else if (chest.visual === 'celestial_chest') {
        // Radiant golden wings / mantle
        ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.75, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();
      } else if (chest.visual === 'steel_chest') {
        // Spiked steel plate
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-2, 0, radius * 0.7, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Leather tunic
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(-2, 0, radius * 0.65, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(-2, 0, radius * 0.65, -Math.PI / 2, Math.PI / 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();
    }

    // --- HELMET / HEADPIECE VISUAL ---
    if (helmet?.visual === 'guts_beast_helm') {
      // Guts' Berserker Beast Helmet: Jagged demon hound snout with glowing red slits
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(radius * 0.1, -12);
      ctx.lineTo(radius * 0.9, -6);
      ctx.lineTo(radius * 1.1, 0); // sharp pointed beast snout
      ctx.lineTo(radius * 0.9, 6);
      ctx.lineTo(radius * 0.1, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing crimson beast eye slits
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(radius * 0.5, -6, 6, 2.5);
      ctx.fillRect(radius * 0.5, 3.5, 6, 2.5);
      ctx.shadowBlur = 0;
    } else if (helmet?.visual === 'sukuna_crown') {
      // Sukuna's Four Eyes & forehead tattoos
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(radius * 0.2, -8, radius * 0.55, 16, [4]);
      ctx.fill();

      // 4 Glowing crimson demon eyes!
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(radius * 0.35, -6, 4, 3);
      ctx.fillRect(radius * 0.35, 3, 4, 3);
      ctx.fillRect(radius * 0.6, -4, 3, 2.5);
      ctx.fillRect(radius * 0.6, 1.5, 3, 2.5);
      ctx.shadowBlur = 0;
    } else if (helmet?.visual === 'toji_worm') {
      // Toji's Cursed Worm wrapped around neck and shoulder
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-radius * 0.4, -radius * 0.4, 8, 0, Math.PI * 2);
      ctx.arc(radius * 0.1, -radius * 0.5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Normal head visor underneath
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(radius * 0.2, -7, radius * 0.55, 14, [4]);
      ctx.fill();
    } else if (helmet?.visual === 'gojo_blindfold') {
      // Gojo's jet black blindfold with glowing cyan eye slits
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(radius * 0.15, -8, radius * 0.6, 16, [3]);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Faint glowing Six Eyes slit
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(radius * 0.45, -3, 3, 6);
      ctx.shadowBlur = 0;
    } else if (helmet?.visual === 'david_kiroshi') {
      // David's Kiroshi Optics Mk. 4: Cybernetic eye optic lens with glowing cyan crosshair
      // Face visor base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(radius * 0.2, -8, radius * 0.55, 16, [4]);
      ctx.fill();

      // Cybernetic optic lens on right eye (upper side)
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(radius * 0.48, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing cyan crosshair inside lens
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1;
      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(radius * 0.48 - 4, -4);
      ctx.lineTo(radius * 0.48 + 4, -4);
      ctx.stroke();
      // Vertical crosshair
      ctx.beginPath();
      ctx.moveTo(radius * 0.48, -8);
      ctx.lineTo(radius * 0.48, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Tactical scanline ring around optic
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(radius * 0.48, -4, 7, Date.now() * 0.005, Date.now() * 0.005 + Math.PI * 1.2);
      ctx.stroke();

      // Normal eye (left/lower side) with cyan glow slit
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(radius * 0.43, 2, 4, 4);
      ctx.shadowBlur = 0;
    } else if (helmet?.visual === 'scout_hood') {
      // Levi's Survey Corps Hooded Cloak & White Silk Cravat
      // 1. Forest green hooded cowl draped around head
      ctx.fillStyle = '#065f46';
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Crisp white silk cravat tie at throat
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(radius * 0.2, -4);
      ctx.lineTo(radius * 0.55, 0);
      ctx.lineTo(radius * 0.2, 4);
      ctx.lineTo(radius * 0.05, 0);
      ctx.closePath();
      ctx.fill();

      // 3. Wings of Freedom badge (mini blue & white crest)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(radius * 0.12, -2.5, 4, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(radius * 0.12 + 2, -2.5, 2, 5);

      // Shadowed stoic eyes slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(radius * 0.35, -4, 4, 8);
    } else if (helmet?.visual === 'horned_helm') {
      // Fierce barbarian horns sticking out left and right
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(2, -radius * 0.6);
      ctx.quadraticCurveTo(14, -radius * 1.3, 2, -radius * 1.5);
      ctx.lineTo(-4, -radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(2, radius * 0.6);
      ctx.quadraticCurveTo(14, radius * 1.3, 2, radius * 1.5);
      ctx.lineTo(-4, radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Default Visor underneath
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(radius * 0.2, -7, radius * 0.55, 14, [4]);
      ctx.fill();
    } else {
      // Default / Cowl Visor
      const visorBaseColor = helmet?.visual === 'cowl_hood' ? '#1e1b4b' : '#0f172a';
      ctx.fillStyle = visorBaseColor;
      ctx.beginPath();
      ctx.roundRect(radius * 0.2, -7, radius * 0.55, 14, [4]);
      ctx.fill();

      // Visor glowing slit
      ctx.fillStyle = isRolling ? '#ffffff' : (isAttacking ? '#ff3366' : '#00f0ff');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(radius * 0.45, -4, 4, 8);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Overhead Dizzy Stars when Stunned
    if (entity.isStunned) {
      ctx.save();
      ctx.translate(x, y - radius - 16);
      const starTime = performance.now() * 0.007;
      for (let s = 0; s < 3; s++) {
        const starAngle = starTime + (s * Math.PI * 2) / 3;
        const starX = Math.cos(starAngle) * 16;
        const starY = Math.sin(starAngle) * 6;
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(starX, starY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Overhead Name & Mini HP Bar
    ctx.save();
    ctx.translate(x, y - radius - (entity.isStunned ? 28 : 18));
    ctx.font = '600 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(name, 0, -6);
    ctx.shadowBlur = 0;

    const barWidth = 36;
    const barHeight = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-barWidth / 2, 0, barWidth * ((entity.hp ?? 100) / (entity.maxHp ?? 100)), barHeight);

    // In-world Mini Gas Bar (for Levi ODM Gear)
    const isLeviActive = entity.isOdmMode ||
      entity.equipment?.weapon?.visual === 'dual_snap_blades' ||
      entity.equipment?.chest?.visual === 'odm_harness';

    if (isLeviActive) {
      const gas = entity.odmGas !== undefined ? entity.odmGas : 100;
      const gasPct = Math.max(0, Math.min(1, gas / 100));
      const charges = Math.min(10, Math.floor((gas + 0.1) / 10));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-barWidth / 2, barHeight + 2, barWidth, 3);
      ctx.fillStyle = entity.isOdmMode ? '#10b981' : '#34d399';
      ctx.shadowColor = entity.isOdmMode ? '#10b981' : 'transparent';
      ctx.shadowBlur = entity.isOdmMode ? 6 : 0;
      ctx.fillRect(-barWidth / 2, barHeight + 2, barWidth * gasPct, 3);
      ctx.shadowBlur = 0;

      // Small ODM indicator text
      ctx.font = '800 7px "JetBrains Mono", monospace';
      ctx.fillStyle = entity.isOdmMode ? '#10b981' : '#94a3b8';
      ctx.fillText(entity.isOdmMode ? `ODM ${Math.round(gas)}% (${charges}/10)` : `GAS ${Math.round(gas)}%`, 0, barHeight + 11);
    }

    // In-world Mini Shotgun Ammo Bar (for David Martinez Carnage Shotgun)
    const isDavidShotgun = entity.equipment?.weapon?.visual === 'david_shotgun';
    if (isDavidShotgun) {
      const ammo = entity.shotgunAmmo !== undefined ? entity.shotgunAmmo : 4;
      const maxAmmo = entity.maxShotgunAmmo || 4;
      const ammoPct = Math.max(0, Math.min(1, ammo / maxAmmo));
      const isReloading = entity.isReloadingShotgun;
      const barY = isLeviActive ? barHeight + 14 : barHeight + 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-barWidth / 2, barY, barWidth, 3);
      ctx.fillStyle = isReloading ? '#f59e0b' : '#ef4444';
      ctx.shadowColor = isReloading ? '#f59e0b' : '#ef4444';
      ctx.shadowBlur = isReloading ? 6 : 0;
      ctx.fillRect(-barWidth / 2, barY, barWidth * (isReloading ? (1 - entity.shotgunReloadTimer / 1.4) : ammoPct), 3);
      ctx.shadowBlur = 0;

      ctx.font = '800 7px "JetBrains Mono", monospace';
      ctx.fillStyle = isReloading ? '#f59e0b' : '#94a3b8';
      ctx.fillText(isReloading ? 'RELOADING...' : `AMMO ${ammo}/${maxAmmo}`, 0, barY + 9);
    }

    // In-world Mini Sandevistan Timer Bar (when active)
    if (entity.isSandevistan && entity.sandevistanTimer > 0) {
      const sandvBarY = isDavidShotgun ? barHeight + 26 : (isLeviActive ? barHeight + 14 : barHeight + 2);
      const sandPct = Math.max(0, Math.min(1, entity.sandevistanTimer / 4.0));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-barWidth / 2, sandvBarY, barWidth, 3);
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillRect(-barWidth / 2, sandvBarY, barWidth * sandPct, 3);
      ctx.shadowBlur = 0;

      ctx.font = '800 7px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`⚡ ${entity.sandevistanTimer.toFixed(1)}s`, 0, sandvBarY + 9);
    }
    ctx.restore();
  }

  drawTorch(x, y, time = 0) {
    const ctx = this.ctx;
    const flicker = Math.sin(time * 8 + x) * 2;

    const grad = ctx.createRadialGradient(x, y, 4, x, y, 48 + flicker);
    grad.addColorStop(0, 'rgba(255, 170, 50, 0.25)');
    grad.addColorStop(1, 'rgba(255, 120, 20, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 48 + flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffaa33';
    ctx.beginPath();
    ctx.arc(x, y, 5 + flicker * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
