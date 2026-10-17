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

  isEntityVisible(x, y, radius = 64) {
    const zoom = this.camera.zoom || 1.0;
    const halfW = (this.width / 2) / zoom + radius;
    const halfH = (this.height / 2) / zoom + radius;
    return (
      x >= this.camera.x - halfW &&
      x <= this.camera.x + halfW &&
      y >= this.camera.y - halfH &&
      y <= this.camera.y + halfH
    );
  }

  createOffscreenCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        return new OffscreenCanvas(w, h);
      } catch (e) {}
    }
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
      } catch (e) {}
    }
    return null;
  }

  drawDungeonFloor(bounds = { minX: -800, minY: -800, maxX: 800, maxY: 800 }) {
    const ctx = this.ctx;
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;

    if (!this._lobbyFloorCanvas) {
      const offscreen = this.createOffscreenCanvas(bw, bh);
      if (offscreen) {
        const cCtx = offscreen.getContext('2d');
        if (cCtx) {
          const size = this.tileSize;
          const cols = Math.ceil(bw / size);
          const rows = Math.ceil(bh / size);

          for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
              const x = col * size;
              const y = row * size;
              const worldCol = Math.floor(bounds.minX / size) + col;
              const worldRow = Math.floor(bounds.minY / size) + row;
              const hash = Math.abs(Math.sin(worldCol * 12.9898 + worldRow * 78.233) * 43758.5453) % 1;
              const baseShade = 16 + Math.floor(hash * 8);
              cCtx.fillStyle = `rgb(${baseShade}, ${baseShade + 2}, ${baseShade + 6})`;
              cCtx.fillRect(x, y, size, size);

              cCtx.strokeStyle = '#0e1118';
              cCtx.lineWidth = 2;
              cCtx.strokeRect(x, y, size, size);

              if (hash > 0.8) {
                cCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                cCtx.fillRect(x + 10, y + 10, size - 20, size - 20);
              } else if (hash < 0.15) {
                cCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                cCtx.beginPath();
                cCtx.moveTo(x + 16, y + 20);
                cCtx.lineTo(x + 28, y + 36);
                cCtx.lineTo(x + 44, y + 32);
                cCtx.stroke();
              }
            }
          }

          cCtx.strokeStyle = '#2d3748';
          cCtx.lineWidth = 12;
          cCtx.strokeRect(0, 0, bw, bh);

          cCtx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          cCtx.lineWidth = 2;
          cCtx.strokeRect(6, 6, bw - 12, bh - 12);

          this._lobbyFloorCanvas = offscreen;
        }
      }
    }

    if (this._lobbyFloorCanvas) {
      ctx.drawImage(this._lobbyFloorCanvas, bounds.minX, bounds.minY);
      return;
    }

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
    ctx.strokeRect(bounds.minX, bounds.minY, bw, bh);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.minX + 6, bounds.minY + 6, bw - 12, bh - 12);
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
      isDowned = false,
      downedTimer = 0,
      isDead = false,
      reviveProgress = 0,
      invulnerableTimer = 0,
      equipment = {}
    } = entity;

    const ctx = this.ctx;

    // 1. DEAD STATE: Render Tombstone & Ghost
    if (isDead) {
      ctx.save();
      ctx.translate(x, y);

      // Grave shadow
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.5, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // Stone slab
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-14, -radius * 0.9, 28, radius * 1.3, [12, 12, 3, 3]);
      ctx.fill();
      ctx.stroke();

      // RIP Engraving
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('R.I.P.', 0, -radius * 0.2);

      // Floating Skull Icon
      const hover = Math.sin(Date.now() * 0.005) * 4;
      ctx.font = '16px sans-serif';
      ctx.fillText('💀', 0, -radius - 12 + hover);

      // Name & DEAD tag overhead
      ctx.font = '600 12px "Outfit", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(name, 0, -radius - 32);

      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('DEAD 💀', 0, -radius - 20);

      ctx.restore();
      return;
    }

    // Draw high-tension ODM Grapple Cables in world coordinates before entity translation
    if (entity.activeCables && entity.activeCables.length > 0) {
      this.drawOdmCables(entity);
    }

    ctx.save();
    ctx.translate(x, y);

    // Drop shadow or blood pool if downed
    ctx.save();
    if (isDowned) {
      // Blood pool on ground underneath downed player
      ctx.beginPath();
      ctx.ellipse(0, 4, radius * 1.45, radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, radius + 5, radius * 1.15, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
    }
    ctx.restore();

    // Invulnerability i-frames aura flash
    if (invulnerableTimer > 0) {
      ctx.save();
      const iPulse = Math.sin(Date.now() * 0.02) * 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3 + iPulse;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8 + iPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Glowing green circular revive channel ring
    if (isDowned && reviveProgress > 0) {
      const revPct = Math.max(0, Math.min(1, reviveProgress / 2.5));
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 12, -Math.PI / 2, -Math.PI / 2 + revPct * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rotate facing mouse/movement direction
    ctx.rotate(angle);

    // Downed crawl posture: collapsed onto floor
    if (isDowned) {
      ctx.scale(1.22, 0.60);
    }

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
      } else if (weapon?.visual === 'dual_snap_blades') {
        // Levi's Dual Snap Blades: Twin intersecting emerald & steel cross-slash scissor arcs!
        const slashReach = radius + 40;
        const leftStart = -Math.PI * 0.45 + p * (Math.PI * 0.85);
        const rightStart = Math.PI * 0.45 - p * (Math.PI * 0.85);

        // Left blade slash arc (emerald trail)
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, leftStart - Math.PI * 0.5, leftStart);
        ctx.strokeStyle = `rgba(16, 185, 129, ${1 - p})`;
        ctx.lineWidth = 5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Right blade slash arc (crossing steel/emerald trail)
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, rightStart, rightStart + Math.PI * 0.5);
        ctx.strokeStyle = `rgba(52, 211, 153, ${1 - p})`;
        ctx.lineWidth = 5;
        ctx.stroke();

        // White razor sharp cutting edges
        ctx.beginPath();
        ctx.arc(0, 0, slashReach, leftStart - Math.PI * 0.35, leftStart);
        ctx.arc(0, 0, slashReach, rightStart, rightStart + Math.PI * 0.35);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Crossing spark flash at intersection (around mid swing)
        if (p > 0.3 && p < 0.75) {
          const sparkAlpha = Math.sin((p - 0.3) / 0.45 * Math.PI);
          ctx.strokeStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(slashReach - 14, -12);
          ctx.lineTo(slashReach + 14, 12);
          ctx.moveTo(slashReach - 14, 12);
          ctx.lineTo(slashReach + 14, -12);
          ctx.stroke();
        }
      } else if (weapon?.visual === 'david_shotgun') {
        // Carnage Shotgun blast: Fiery concussive muzzle flash & propellant smoke (physical pellets drawn by cinematics)
        const muzzleDist = radius + 18;

        // Orange/yellow concussive muzzle flash burst
        if (p < 0.35) {
          const flashAlpha = (0.35 - p) * 2.8;
          ctx.fillStyle = `rgba(255, 160, 40, ${flashAlpha})`;
          ctx.shadowColor = '#ff8c00';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(muzzleDist + 8, 0, 18 - p * 30, 0, Math.PI * 2);
          ctx.fill();

          // High-heat white core spark
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.beginPath();
          ctx.arc(muzzleDist + 4, 0, 8 - p * 16, 0, Math.PI * 2);
          ctx.fill();

          // Muzzle brake side vent jets
          ctx.strokeStyle = `rgba(255, 200, 60, ${flashAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(muzzleDist, -2);
          ctx.lineTo(muzzleDist + 6, -14);
          ctx.moveTo(muzzleDist, 2);
          ctx.lineTo(muzzleDist + 6, 14);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Propellant smoke ring
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
      // True Dual Wielding: Left hand holds Left Snap Blade
      leftHandX = 10;
      leftHandY = -handDistance;
      leftBladeAngle = 0;

      if (isAttacking && attackProgress > 0 && attackProgress < 1) {
        // Left hand slashes inward across from upper-left to lower-right!
        const p = attackProgress;
        const leftArc = -Math.PI * 0.45 + p * (Math.PI * 0.85);
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

    if (isAttacking && attackProgress > 0 && attackProgress < 1) {
      const p = attackProgress;
      if (weapon?.visual === 'dual_snap_blades') {
        // Right hand slashes inward across from lower-right to upper-left (twin cross-cut)!
        const rightArc = Math.PI * 0.45 - p * (Math.PI * 0.85);
        rightHandX = Math.cos(rightArc) * (handDistance + 6);
        rightHandY = Math.sin(rightArc) * (handDistance + 6);
        swordAngle = rightArc - Math.PI * 0.35;
      } else if (weapon?.visual === 'lapse_blue') {
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

      // Visor slit
      ctx.fillStyle = isRolling ? '#ffffff' : (isAttacking ? '#ff3366' : '#00f0ff');
      ctx.fillRect(radius * 0.45, -4, 4, 8);
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
    ctx.translate(x, y - radius - (entity.isStunned ? 28 : (isDowned ? 26 : 18)));
    ctx.font = '600 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, 0, -6);

    const barWidth = 38;
    const barHeight = 4;

    if (isDowned) {
      // Pulsating bleed-out countdown
      const pulseAlpha = Math.sin(Date.now() * 0.008) * 0.25 + 0.75;
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      ctx.fillText(`🩸 DOWNED [${Math.ceil(downedTimer || 0)}s]`, 0, -18);

      // Bleed-out countdown bar
      const bleedPct = Math.max(0, Math.min(1, (downedTimer || 0) / 30.0));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-barWidth / 2, 0, barWidth * bleedPct, barHeight);

      // Teammate Revive Progress Bar
      if (reviveProgress && reviveProgress > 0) {
        const revPct = Math.max(0, Math.min(1, reviveProgress / 2.5));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(-barWidth / 2, barHeight + 3, barWidth, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-barWidth / 2, barHeight + 3, barWidth * revPct, 4);

        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`REVIVING... ${Math.round(revPct * 100)}% 💚`, 0, barHeight + 17);
      } else if (entity.showRevivePrompt) {
        // Floating prompt for nearby living player
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-54, barHeight + 4, 108, 16, [8]);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 8.5px "Outfit", sans-serif';
        ctx.fillStyle = '#22c55e';
        ctx.fillText('HOLD [E] TO REVIVE 💚', 0, barHeight + 15);
      }
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(-barWidth / 2, 0, barWidth * ((entity.hp ?? 100) / (entity.maxHp ?? 100)), barHeight);
    }

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
      ctx.fillRect(-barWidth / 2, barHeight + 2, barWidth * gasPct, 3);

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
      ctx.fillRect(-barWidth / 2, barY, barWidth * (isReloading ? (1 - entity.shotgunReloadTimer / 1.4) : ammoPct), 3);

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
      ctx.fillRect(-barWidth / 2, sandvBarY, barWidth * sandPct, 3);

      ctx.font = '800 7px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`⚡ ${entity.sandevistanTimer.toFixed(1)}s`, 0, sandvBarY + 9);
    }
    ctx.restore();
  }

  drawTorch(x, y, time = 0, color = '#ffaa33', glowColor = 'rgba(255, 170, 50, 0.25)') {
    const ctx = this.ctx;
    const flicker = Math.sin(time * 8 + x) * 2;

    const grad = ctx.createRadialGradient(x, y, 4, x, y, 52 + flicker);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 52 + flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5 + flicker * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  getOrCreateRoomStaticCanvas(room, theme, tileSize) {
    if (room._staticCanvas) return room._staticCanvas;

    const rw = Math.ceil(room.width);
    const rh = Math.ceil(room.height);
    if (rw <= 0 || rh <= 0) return null;

    const offscreen = this.createOffscreenCanvas(rw, rh);
    if (!offscreen) return null;

    const cCtx = offscreen.getContext('2d');
    if (!cCtx) return null;

    this.renderRoomStatic(cCtx, room, theme, tileSize, rw, rh);
    room._staticCanvas = offscreen;
    return offscreen;
  }

  renderRoomStatic(cCtx, room, theme, tileSize, rw, rh) {
    // 1. Draw Checkered Flagstone Floor (in local coordinates)
    for (let c = 0; c < room.colCount; c++) {
      for (let r = 0; r < room.rowCount; r++) {
        const fx = c * tileSize;
        const fy = r * tileSize;
        const isAlt = (c + r) % 2 === 0;
        cCtx.fillStyle = isAlt ? theme.floorColor : theme.floorAltColor;
        cCtx.fillRect(fx, fy, tileSize, tileSize);

        cCtx.strokeStyle = theme.floorGridColor;
        cCtx.lineWidth = 1;
        cCtx.strokeRect(fx, fy, tileSize, tileSize);

        // Cyberpunk: PCB circuit nodes and data lines on floor tiles
        if (theme.id === 'cyberpunk') {
          const hash = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1;
          if (hash > 0.72) {
            cCtx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
            cCtx.lineWidth = 1.5;
            cCtx.beginPath();
            cCtx.moveTo(fx + 12, fy + tileSize / 2);
            cCtx.lineTo(fx + tileSize / 2, fy + tileSize / 2);
            cCtx.lineTo(fx + tileSize / 2, fy + tileSize - 12);
            cCtx.stroke();

            cCtx.fillStyle = 'rgba(6, 182, 212, 0.3)';
            cCtx.fillRect(fx + tileSize / 2 - 2, fy + tileSize / 2 - 2, 4, 4);
          }
        }

        // Attack on Titan: Weathered cobblestone cracks & moss veins on Wall Maria stones
        if (theme.id === 'aot') {
          const hash = Math.abs(Math.sin(c * 17.13 + r * 91.27) * 43758.5453) % 1;
          if (hash > 0.68) {
            cCtx.strokeStyle = 'rgba(22, 101, 52, 0.25)';
            cCtx.lineWidth = 1.2;
            cCtx.beginPath();
            cCtx.moveTo(fx + 6, fy + tileSize - 8);
            cCtx.lineTo(fx + tileSize / 2, fy + tileSize / 2);
            cCtx.lineTo(fx + tileSize - 8, fy + 8);
            cCtx.stroke();

            cCtx.fillStyle = 'rgba(22, 101, 52, 0.3)';
            cCtx.fillRect(fx + tileSize / 2 - 2, fy + tileSize / 2 - 2, 4, 4);
          }
        }

        // Berserk: Brand of Sacrifice blood fissures & sacrificial magma veins
        if (theme.id === 'berserk') {
          const hash = Math.abs(Math.sin(c * 23.41 + r * 67.89) * 43758.5453) % 1;
          if (hash > 0.68) {
            cCtx.strokeStyle = 'rgba(239, 68, 68, 0.28)';
            cCtx.lineWidth = 1.4;
            cCtx.beginPath();
            // Jagged sacrificial rune fissure
            cCtx.moveTo(fx + 10, fy + 8);
            cCtx.lineTo(fx + tileSize / 2, fy + tileSize / 2 - 4);
            cCtx.lineTo(fx + tileSize / 2, fy + tileSize - 8);
            cCtx.moveTo(fx + tileSize / 2 - 8, fy + tileSize / 2);
            cCtx.lineTo(fx + tileSize / 2 + 8, fy + tileSize / 2);
            cCtx.stroke();

            // Glowing ember dot
            cCtx.fillStyle = 'rgba(220, 38, 38, 0.45)';
            cCtx.fillRect(fx + tileSize / 2 - 2, fy + tileSize / 2 - 2, 4, 4);
          }
        }
      }
    }

    // --- 1.5 PROCEDURAL FLOOR DECORS & CENTERPIECE INSIGNIAS (100% Walkable) ---
    const cx = rw / 2;
    const cy = rh / 2;

    if (room.type === 'boss') {
      // Enormous Epic Ritual / Mainframe / Domain Circle
      cCtx.save();
      cCtx.translate(cx, cy);

      if (theme.id === 'jjk') {
        // Domain Expansion Cursed Summoning Seal
        cCtx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.arc(0, 0, 140, 0, Math.PI * 2);
        cCtx.arc(0, 0, 105, 0, Math.PI * 2);
        cCtx.stroke();
        cCtx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
        cCtx.lineWidth = 1.5;
        cCtx.beginPath();
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          cCtx.moveTo(Math.cos(ang) * 85, Math.sin(ang) * 85);
          cCtx.lineTo(Math.cos(ang) * 140, Math.sin(ang) * 140);
        }
        cCtx.stroke();
      } else if (theme.id === 'cyberpunk') {
        // Arasaka Cyber Mainframe Hex Node
        cCtx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        cCtx.lineWidth = 2.5;
        cCtx.beginPath();
        for (let a = 0; a < 6; a++) {
          const ang = (a / 6) * Math.PI * 2;
          const hx = Math.cos(ang) * 130;
          const hy = Math.sin(ang) * 130;
          if (a === 0) cCtx.moveTo(hx, hy);
          else cCtx.lineTo(hx, hy);
        }
        cCtx.closePath();
        cCtx.stroke();
        // Radiating circuit buses
        cCtx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
        cCtx.lineWidth = 1.5;
        for (let a = 0; a < 6; a++) {
          const ang = (a / 6) * Math.PI * 2;
          cCtx.beginPath();
          cCtx.moveTo(Math.cos(ang) * 55, Math.sin(ang) * 55);
          cCtx.lineTo(Math.cos(ang) * 130, Math.sin(ang) * 130);
          cCtx.lineTo(Math.cos(ang + 0.2) * 165, Math.sin(ang + 0.2) * 165);
          cCtx.stroke();
        }
      } else if (theme.id === 'aot') {
        // Wall Maria Rosette Sunburst Medallion
        cCtx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.arc(0, 0, 130, 0, Math.PI * 2);
        cCtx.arc(0, 0, 75, 0, Math.PI * 2);
        cCtx.stroke();
        cCtx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
        cCtx.lineWidth = 2;
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2;
          cCtx.beginPath();
          cCtx.moveTo(Math.cos(ang) * 75, Math.sin(ang) * 75);
          cCtx.lineTo(Math.cos(ang) * 130, Math.sin(ang) * 130);
          cCtx.stroke();
        }
      } else if (theme.id === 'berserk') {
        // Brand of Sacrifice Blood Ritual Circle
        cCtx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.arc(0, 0, 140, 0, Math.PI * 2);
        cCtx.arc(0, 0, 95, 0, Math.PI * 2);
        cCtx.stroke();
        // Brand mark in center
        cCtx.lineWidth = 3.5;
        cCtx.beginPath();
        cCtx.moveTo(0, -50);
        cCtx.lineTo(0, 50);
        cCtx.moveTo(-35, -25);
        cCtx.lineTo(35, 25);
        cCtx.moveTo(-35, 25);
        cCtx.lineTo(35, -25);
        cCtx.moveTo(-35, -25);
        cCtx.lineTo(0, -50);
        cCtx.lineTo(35, -25);
        cCtx.stroke();
      } else if (theme.id === 'opm') {
        // Monster Association Bio-Eye & Hazard Quarantine Seal
        cCtx.strokeStyle = 'rgba(234, 179, 8, 0.55)';
        cCtx.lineWidth = 3.5;
        cCtx.beginPath();
        cCtx.arc(0, 0, 140, 0, Math.PI * 2);
        cCtx.arc(0, 0, 95, 0, Math.PI * 2);
        cCtx.stroke();
        // Radiating seismic shockwave lines
        cCtx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        cCtx.lineWidth = 2;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          cCtx.beginPath();
          cCtx.moveTo(Math.cos(ang) * 95, Math.sin(ang) * 95);
          cCtx.lineTo(Math.cos(ang) * 140, Math.sin(ang) * 140);
          cCtx.stroke();
        }
        // Central Monster Association cyclops eye
        cCtx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        cCtx.beginPath();
        cCtx.arc(0, 0, 50, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.strokeStyle = '#ef4444';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.arc(0, 0, 50, 0, Math.PI * 2);
        cCtx.stroke();
        // Golden iris and pupil
        cCtx.fillStyle = '#facc15';
        cCtx.beginPath();
        cCtx.arc(0, 0, 22, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.fillStyle = '#09090b';
        cCtx.beginPath();
        cCtx.arc(0, 0, 9, 0, Math.PI * 2);
        cCtx.fill();
      }
      cCtx.restore();
    } else if (room.type === 'treasure') {
      // Gilded Treasury Carpet & Central Dais
      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.fillStyle = 'rgba(120, 53, 15, 0.35)';
      cCtx.fillRect(-70, -220, 140, 440);
      cCtx.fillRect(-220, -70, 440, 140);
      cCtx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      cCtx.lineWidth = 2;
      cCtx.strokeRect(-70, -220, 140, 440);
      cCtx.strokeRect(-220, -70, 440, 140);
      // Golden central diamond dais
      cCtx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      cCtx.strokeStyle = '#fde047';
      cCtx.lineWidth = 2.5;
      cCtx.beginPath();
      cCtx.moveTo(0, -90);
      cCtx.lineTo(90, 0);
      cCtx.lineTo(0, 90);
      cCtx.lineTo(-90, 0);
      cCtx.closePath();
      cCtx.fill();
      cCtx.stroke();
      cCtx.restore();
    } else if (room.type === 'merchant') {
      // Merchant Silk Carpet & Coin borders
      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.fillStyle = 'rgba(6, 78, 59, 0.5)';
      cCtx.strokeStyle = '#10b981';
      cCtx.lineWidth = 2.5;
      cCtx.fillRect(-280, -140, 560, 280);
      cCtx.strokeRect(-280, -140, 560, 280);
      cCtx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      cCtx.lineWidth = 1.5;
      cCtx.strokeRect(-270, -130, 540, 260);
      cCtx.restore();
    } else if (room.type === 'spawn') {
      // Guiding Compass Rose
      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      cCtx.lineWidth = 2;
      cCtx.beginPath();
      cCtx.arc(0, 0, 90, 0, Math.PI * 2);
      cCtx.stroke();
      // 4 cardinal pointer arrows
      cCtx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      const dirs = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      for (const d of dirs) {
        cCtx.save();
        cCtx.rotate(d);
        cCtx.beginPath();
        cCtx.moveTo(-10, -65);
        cCtx.lineTo(0, -90);
        cCtx.lineTo(10, -65);
        cCtx.closePath();
        cCtx.fill();
        cCtx.restore();
      }
      cCtx.restore();
    } else if (room.type === 'combat') {
      // Diverse Combat Chamber Visual Decors
      cCtx.save();
      cCtx.translate(cx, cy);
      if (room.decorVariant === 0) {
        // Variant 0: Battle Scorch Marks & Dark Blood Splatters
        cCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        const scorches = [
          [-360, -180, 55, 30],
          [320, 160, 65, 35],
          [-240, 220, 45, 25],
          [280, -200, 50, 30]
        ];
        for (const [sx, sy, sw, sh] of scorches) {
          cCtx.beginPath();
          cCtx.ellipse(sx, sy, sw, sh, 0.3, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.fillStyle = 'rgba(185, 28, 28, 0.22)';
        const splatters = [
          [-350, -170, 25],
          [330, 170, 30],
          [0, -120, 20],
          [-150, 80, 22]
        ];
        for (const [bx, by, br] of splatters) {
          cCtx.beginPath();
          cCtx.arc(bx, by, br, 0, Math.PI * 2);
          cCtx.fill();
        }
      } else if (room.decorVariant === 1) {
        // Variant 1: Gladiator Dueling Arena Ring
        cCtx.strokeStyle = theme.floorGridColor ? theme.floorGridColor.replace('0.1', '0.35') : 'rgba(255, 255, 255, 0.2)';
        cCtx.lineWidth = 2.5;
        cCtx.setLineDash([12, 8]);
        cCtx.beginPath();
        cCtx.arc(0, 0, 260, 0, Math.PI * 2);
        cCtx.stroke();
        cCtx.setLineDash([]);
        cCtx.lineWidth = 1.5;
        cCtx.beginPath();
        cCtx.arc(0, 0, 235, 0, Math.PI * 2);
        cCtx.stroke();
      } else if (room.decorVariant === 2) {
        // Variant 2: Industrial Under-floor Grates with ambient under-glow in 4 quadrants
        const grates = [
          [-380, -200],
          [380, -200],
          [-380, 200],
          [380, 200]
        ];
        for (const [gx, gy] of grates) {
          cCtx.fillStyle = theme.torchGlowColor || 'rgba(255, 255, 255, 0.1)';
          cCtx.fillRect(gx - 40, gy - 40, 80, 80);
          cCtx.strokeStyle = '#334155';
          cCtx.lineWidth = 3;
          cCtx.strokeRect(gx - 36, gy - 36, 72, 72);
          cCtx.strokeStyle = '#475569';
          cCtx.lineWidth = 2;
          cCtx.beginPath();
          for (let b = -26; b <= 26; b += 10) {
            cCtx.moveTo(gx + b, gy - 34);
            cCtx.lineTo(gx + b, gy + 34);
          }
          cCtx.stroke();
        }
      } else if (room.decorVariant === 3) {
        // Variant 3: Ancient Runic Diamond Floor Mosaic
        cCtx.strokeStyle = (theme.accentColor || '#64748b') + '40';
        cCtx.lineWidth = 2;
        cCtx.beginPath();
        cCtx.moveTo(0, -140);
        cCtx.lineTo(140, 0);
        cCtx.lineTo(0, 140);
        cCtx.lineTo(-140, 0);
        cCtx.closePath();
        cCtx.stroke();
        cCtx.beginPath();
        cCtx.moveTo(0, -110);
        cCtx.lineTo(110, 0);
        cCtx.lineTo(0, 110);
        cCtx.lineTo(-110, 0);
        cCtx.closePath();
        cCtx.stroke();
      }
      cCtx.restore();
    }

    // 2. Draw Asymmetric Top-Down Walls with Door Openings
    const northWallH = 72; // Tall/wide front-facing North wall
    const sideWallW = 28;  // Thin border curb for West, East, South

    const northDoor = room.doors.find(d => d.dir === 'north');
    const southDoor = room.doors.find(d => d.dir === 'south');
    const westDoor = room.doors.find(d => d.dir === 'west');
    const eastDoor = room.doors.find(d => d.dir === 'east');

    const halfRw = rw / 2;
    const halfRh = rh / 2;

    // --- NORTH WALL ---
    const northSections = [];
    if (northDoor) {
      northSections.push([0, halfRw - 64]);
      northSections.push([halfRw + 64, rw]);
    } else {
      northSections.push([0, rw]);
    }

    for (const [sx, ex] of northSections) {
      if (ex <= sx) continue;
      const sw = ex - sx;

      // Front-facing vertical stone face (lower 54px: 18 to 72)
      cCtx.fillStyle = theme.wallColor;
      cCtx.fillRect(sx, 18, sw, 54);

      // Horizontal brick mortar line
      cCtx.strokeStyle = theme.wallStrokeColor;
      cCtx.lineWidth = 1.5;
      cCtx.beginPath();
      cCtx.moveTo(sx, 45);
      cCtx.lineTo(ex, 45);
      cCtx.stroke();

      // Vertical brick mortar ticks
      const brickW = 48;
      const startBrick = Math.floor(sx / brickW) * brickW;
      cCtx.beginPath();
      for (let bx = startBrick; bx <= ex; bx += brickW) {
        if (bx >= sx && bx <= ex) {
          cCtx.moveTo(bx, 18);
          cCtx.lineTo(bx, 45);
        }
        const altBx = bx + brickW / 2;
        if (altBx >= sx && altBx <= ex) {
          cCtx.moveTo(altBx, 45);
          cCtx.lineTo(altBx, 72);
        }
      }
      cCtx.stroke();

      // Top ledge (top 18px: 0 to 18)
      cCtx.fillStyle = theme.wallTopColor;
      cCtx.fillRect(sx, 0, sw, 18);

      // Top ledge highlight bevel
      cCtx.fillStyle = theme.wallBevelColor;
      cCtx.fillRect(sx, 16, sw, 2);

      // Hanging Wall Decors on solid North wall sections (between doors)
      if (sw > 220) {
        const midX = sx + sw / 2;
        if (theme.id === 'jjk') {
          // Ofuda sealing talisman scrolls hanging on wall
          cCtx.fillStyle = '#fee2e2';
          cCtx.fillRect(midX - 9, 24, 18, 38);
          cCtx.strokeStyle = '#b91c1c';
          cCtx.lineWidth = 1;
          cCtx.strokeRect(midX - 9, 24, 18, 38);
          cCtx.fillStyle = '#dc2626';
          cCtx.fillRect(midX - 4, 28, 8, 4);
          cCtx.fillRect(midX - 5, 35, 10, 3);
          cCtx.fillRect(midX - 4, 41, 8, 14);
        } else if (theme.id === 'cyberpunk') {
          // Neon holographic signage
          cCtx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          cCtx.fillRect(midX - 42, 24, 84, 24);
          cCtx.strokeStyle = '#06b6d4';
          cCtx.lineWidth = 1.5;
          cCtx.strokeRect(midX - 42, 24, 84, 24);
          cCtx.fillStyle = '#00f0ff';
          cCtx.font = 'bold 9px monospace';
          cCtx.textAlign = 'center';
          cCtx.fillText('SUB-LEVEL', midX, 39);
        } else if (theme.id === 'aot') {
          // Wall Maria / Scout Regiment banner
          cCtx.fillStyle = '#1e3a5f';
          cCtx.beginPath();
          cCtx.moveTo(midX - 16, 22);
          cCtx.lineTo(midX + 16, 22);
          cCtx.lineTo(midX + 16, 54);
          cCtx.lineTo(midX, 64);
          cCtx.lineTo(midX - 16, 54);
          cCtx.closePath();
          cCtx.fill();
          cCtx.strokeStyle = '#ffffff';
          cCtx.lineWidth = 1.5;
          cCtx.stroke();
          cCtx.fillStyle = '#ffffff';
          cCtx.fillRect(midX - 4, 30, 8, 16);
        } else if (theme.id === 'berserk') {
          // Tattered crimson sacrificial banner
          cCtx.fillStyle = '#7f1d1d';
          cCtx.beginPath();
          cCtx.moveTo(midX - 14, 22);
          cCtx.lineTo(midX + 14, 22);
          cCtx.lineTo(midX + 10, 58);
          cCtx.lineTo(midX, 52);
          cCtx.lineTo(midX - 10, 58);
          cCtx.closePath();
          cCtx.fill();
          cCtx.strokeStyle = '#ef4444';
          cCtx.lineWidth = 1.5;
          cCtx.stroke();
        } else if (theme.id === 'opm') {
          // Industrial Hazard Caution Plate & Disaster Alert
          cCtx.fillStyle = '#1c1917';
          cCtx.fillRect(midX - 36, 24, 72, 26);
          cCtx.strokeStyle = '#eab308';
          cCtx.lineWidth = 2;
          cCtx.strokeRect(midX - 36, 24, 72, 26);
          // Diagonal hazard caution stripes
          cCtx.fillStyle = '#facc15';
          for (let hx = midX - 30; hx <= midX + 26; hx += 14) {
            cCtx.beginPath();
            cCtx.moveTo(hx, 48);
            cCtx.lineTo(hx + 8, 26);
            cCtx.lineTo(hx + 12, 26);
            cCtx.lineTo(hx + 4, 48);
            cCtx.closePath();
            cCtx.fill();
          }
        }
      }

      // Ambient occlusion drop shadow cast down onto the floor
      const shadowGrad = cCtx.createLinearGradient(0, 72, 0, 86);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cCtx.fillStyle = shadowGrad;
      cCtx.fillRect(sx, 72, sw, 14);
    }

    // --- SOUTH WALL ---
    const southSections = [];
    if (southDoor) {
      southSections.push([0, halfRw - 64]);
      southSections.push([halfRw + 64, rw]);
    } else {
      southSections.push([0, rw]);
    }

    for (const [sx, ex] of southSections) {
      if (ex <= sx) continue;
      const sw = ex - sx;

      cCtx.fillStyle = theme.wallColor;
      cCtx.fillRect(sx, rh - sideWallW, sw, sideWallW);

      cCtx.fillStyle = theme.wallTopColor;
      cCtx.fillRect(sx, rh - sideWallW, sw, 8);

      cCtx.fillStyle = theme.wallBevelColor;
      cCtx.fillRect(sx, rh - sideWallW + 7, sw, 1.5);
    }

    // --- WEST WALL ---
    const westSections = [];
    if (westDoor) {
      westSections.push([northWallH, halfRh - 64]);
      westSections.push([halfRh + 64, rh - sideWallW]);
    } else {
      westSections.push([northWallH, rh - sideWallW]);
    }

    for (const [sy, ey] of westSections) {
      if (ey <= sy) continue;
      const sh = ey - sy;

      cCtx.fillStyle = theme.wallColor;
      cCtx.fillRect(0, sy, sideWallW, sh);

      cCtx.fillStyle = theme.wallTopColor;
      cCtx.fillRect(0, sy, 8, sh);

      cCtx.fillStyle = theme.wallBevelColor;
      cCtx.fillRect(7, sy, 1.5, sh);
    }

    // --- EAST WALL ---
    const eastSections = [];
    if (eastDoor) {
      eastSections.push([northWallH, halfRh - 64]);
      eastSections.push([halfRh + 64, rh - sideWallW]);
    } else {
      eastSections.push([northWallH, rh - sideWallW]);
    }

    for (const [sy, ey] of eastSections) {
      if (ey <= sy) continue;
      const sh = ey - sy;

      cCtx.fillStyle = theme.wallColor;
      cCtx.fillRect(rw - sideWallW, sy, sideWallW, sh);

      cCtx.fillStyle = theme.wallTopColor;
      cCtx.fillRect(rw - 8, sy, 8, sh);

      cCtx.fillStyle = theme.wallBevelColor;
      cCtx.fillRect(rw - 8, sy, 1.5, sh);
    }

    // Outer room outline
    cCtx.strokeStyle = theme.wallStrokeColor;
    cCtx.lineWidth = 2;
    cCtx.strokeRect(0, 0, rw, rh);

    // 3. Draw Corner Tactical Pillars (Corner dead-zones only, leaving door corridors 100% open)
    if (room.obstacles && room.obstacles.length > 0) {
      for (const obs of room.obstacles) {
        const lx = obs.x - room.bounds.minX;
        const ly = obs.y - room.bounds.minY;
        const rad = obs.radius;

        // Drop shadow cast onto floor
        cCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        cCtx.beginPath();
        cCtx.ellipse(lx, ly + 6, rad * 1.3, rad * 0.75, 0, 0, Math.PI * 2);
        cCtx.fill();

        // 2.5D Themed Pillar Body & Cap
        if (theme.id === 'cyberpunk') {
          // Matte black hexagonal tech tower with cyan energy pipe
          cCtx.fillStyle = '#0f172a';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#06b6d4';
          cCtx.lineWidth = 2.5;
          cCtx.stroke();
          // Glowing cyan core
          cCtx.fillStyle = '#00f0ff';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad * 0.45, 0, Math.PI * 2);
          cCtx.fill();
        } else if (theme.id === 'berserk') {
          // Spiked obsidian bone pillar
          cCtx.fillStyle = '#1c1917';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#7f1d1d';
          cCtx.lineWidth = 2.5;
          cCtx.stroke();
          // Crimson rune on pillar cap
          cCtx.strokeStyle = '#ef4444';
          cCtx.lineWidth = 1.8;
          cCtx.beginPath();
          cCtx.moveTo(lx, ly - rad * 0.5);
          cCtx.lineTo(lx, ly + rad * 0.5);
          cCtx.moveTo(lx - rad * 0.4, ly);
          cCtx.lineTo(lx + rad * 0.4, ly);
          cCtx.stroke();
        } else if (theme.id === 'aot') {
          // Chiseled limestone pillar with moss
          cCtx.fillStyle = '#44403c';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#292524';
          cCtx.lineWidth = 2.5;
          cCtx.stroke();
          // Moss trim
          cCtx.fillStyle = '#166534';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad * 0.5, 0, Math.PI * 2);
          cCtx.fill();
        } else if (theme.id === 'opm') {
          // Industrial reinforced steel column with hazard warning cross
          cCtx.fillStyle = '#262626';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#eab308';
          cCtx.lineWidth = 2.5;
          cCtx.stroke();
          // Yellow hazard cross cap
          cCtx.fillStyle = '#facc15';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad * 0.45, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#09090b';
          cCtx.lineWidth = 1.5;
          cCtx.beginPath();
          cCtx.moveTo(lx - rad * 0.3, ly - rad * 0.3);
          cCtx.lineTo(lx + rad * 0.3, ly + rad * 0.3);
          cCtx.moveTo(lx + rad * 0.3, ly - rad * 0.3);
          cCtx.lineTo(lx - rad * 0.3, ly + rad * 0.3);
          cCtx.stroke();
        } else {
          // JJK: Weathered stone pillar with purple cursed seal
          cCtx.fillStyle = '#27272a';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.strokeStyle = '#3f3f46';
          cCtx.lineWidth = 2.5;
          cCtx.stroke();
          cCtx.fillStyle = '#a855f7';
          cCtx.beginPath();
          cCtx.arc(lx, ly, rad * 0.4, 0, Math.PI * 2);
          cCtx.fill();
        }
      }
    }
  }

  renderRoomStaticDirect(ctx, room, theme, tileSize) {
    const minX = room.bounds.minX;
    const maxX = room.bounds.maxX;
    const minY = room.bounds.minY;
    const maxY = room.bounds.maxY;
    const rw = room.width;
    const rh = room.height;

    // 1. Draw Checkered Flagstone Floor
    for (let c = 0; c < room.colCount; c++) {
      for (let r = 0; r < room.rowCount; r++) {
        const fx = minX + c * tileSize;
        const fy = minY + r * tileSize;
        const isAlt = (c + r) % 2 === 0;
        ctx.fillStyle = isAlt ? theme.floorColor : theme.floorAltColor;
        ctx.fillRect(fx, fy, tileSize, tileSize);

        ctx.strokeStyle = theme.floorGridColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(fx, fy, tileSize, tileSize);
      }
    }

    ctx.strokeStyle = theme.wallStrokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, rw, rh);
  }

  /**
   * Viewport-culled Procedural Dungeon Rendering
   * Renders themed flagstone floors, 3D beveled walls, dynamic torches,
   * destructible containers, exit portals, and Room Discovery Fog of War!
   */
  drawDungeon(dungeon, cameraX, cameraY, viewWidth, viewHeight, time = 0) {
    if (!dungeon || !dungeon.rooms) return;
    const ctx = this.ctx;
    const theme = dungeon.theme;
    const tileSize = dungeon.tileSize || 64;

    const halfW = viewWidth / 2 + 100;
    const halfH = viewHeight / 2 + 100;

    for (const room of dungeon.rooms) {
      // Cull rooms not in view
      if (
        room.bounds.maxX < cameraX - halfW ||
        room.bounds.minX > cameraX + halfW ||
        room.bounds.maxY < cameraY - halfH ||
        room.bounds.minY > cameraY + halfH
      ) {
        continue;
      }

      const minX = room.bounds.minX;
      const maxX = room.bounds.maxX;
      const minY = room.bounds.minY;
      const maxY = room.bounds.maxY;
      const rw = room.width;
      const rh = room.height;

      // 1 & 2. Static Floor & Asymmetric Walls (Pre-rendered to OffscreenCanvas)
      const staticCanvas = this.getOrCreateRoomStaticCanvas(room, theme, tileSize);
      if (staticCanvas) {
        ctx.drawImage(staticCanvas, minX, minY);
      } else {
        this.renderRoomStaticDirect(ctx, room, theme, tileSize);
      }

      // 3. Draw Doors
      for (const door of room.doors) {
        this.drawDoor(ctx, room, door, theme, time);
      }

      // 4. Draw Torches inside this room
      for (const torch of room.torches) {
        this.drawTorch(torch.x, torch.y, time, torch.color, torch.glow);
      }

      // 5. Draw Exit Descent Portal (in Boss Sanctum)
      if (room.type === 'boss' && dungeon.exitPortal) {
        this.drawExitPortal(ctx, dungeon.exitPortal, theme);
      }
    }
  }

  /**
   * Renders chamber doors with Isaac-style open and locked states
   * Flush inside the wall layer without protruding outside
   */
  drawDoor(ctx, room, door, theme, time) {
    ctx.save();
    const isLocked = room.isLocked;
    const isBoss = door.isBoss;
    const isTreasure = door.isTreasure;
    const isMerchant = door.isMerchant;

    const dx = door.x;
    const dy = door.y;
    const dw = door.width;
    const dh = door.height;
    const cx = door.centerX || (dx + dw / 2);
    const cy = door.centerY || (dy + dh / 2);

    // Frame styling
    const frameColor = isBoss ? '#450a0a' : (isTreasure ? '#78350f' : (isMerchant ? '#064e3b' : theme.wallTopColor));
    const trimColor = isBoss ? '#ef4444' : (isTreasure ? '#f59e0b' : (isMerchant ? '#10b981' : theme.wallBevelColor));

    if (door.dir === 'north') {
      // NORTH DOOR: Flush inside the 72px tall North wall
      // Doorway threshold background
      ctx.fillStyle = isLocked ? '#0e0b17' : theme.floorAltColor;
      ctx.fillRect(dx, dy, dw, dh);

      // Floor flagstone grid inside threshold if open
      if (!isLocked) {
        ctx.strokeStyle = theme.floorGridColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(dx, dy, dw, dh);
      }

      // Stone door jamb pillars on left and right
      ctx.fillStyle = frameColor;
      ctx.fillRect(dx, dy, 12, dh);
      ctx.fillRect(dx + dw - 12, dy, 12, dh);

      // Top lintel arch
      ctx.fillRect(dx, dy, dw, 14);
      ctx.fillStyle = trimColor;
      ctx.fillRect(dx, dy + 12, dw, 2);

      if (isLocked) {
        // Locked: Heavy iron portcullis bars
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        for (let bx = dx + 20; bx <= dx + dw - 20; bx += 14) {
          ctx.beginPath();
          ctx.moveTo(bx, dy + 14);
          ctx.lineTo(bx, dy + dh);
          ctx.stroke();
        }
        // Horizontal crossbars
        ctx.beginPath();
        ctx.moveTo(dx + 12, dy + 32);
        ctx.lineTo(dx + dw - 12, dy + 32);
        ctx.moveTo(dx + 12, dy + 52);
        ctx.lineTo(dx + dw - 12, dy + 52);
        ctx.stroke();

        // Pulsing lock seal (Clean solid emblem, no glow)
        const pulse = 1 + Math.sin(time * 6) * 0.12;
        const emblemCol = isBoss ? '#ef4444' : (isTreasure ? '#fbbf24' : (isMerchant ? '#10b981' : '#c084fc'));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = emblemCol;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : '🔒')), 0, 4);
        ctx.restore();
      } else {
        // Open: Directional rune
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = trimColor;
        const symbol = isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : '▲'));
        ctx.fillText(symbol, cx, cy + 5);
      }
    } else if (door.dir === 'south') {
      // SOUTH DOOR: Flush inside thin 28px South curb
      ctx.fillStyle = isLocked ? '#0e0b17' : theme.floorAltColor;
      ctx.fillRect(dx, dy, dw, dh);

      // Posts on left and right
      ctx.fillStyle = frameColor;
      ctx.fillRect(dx, dy, 10, dh);
      ctx.fillRect(dx + dw - 10, dy, 10, dh);

      if (isLocked) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        for (let bx = dx + 18; bx <= dx + dw - 18; bx += 14) {
          ctx.beginPath();
          ctx.moveTo(bx, dy);
          ctx.lineTo(bx, dy + dh);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(dx + 10, dy + dh / 2);
        ctx.lineTo(dx + dw - 10, dy + dh / 2);
        ctx.stroke();

        const pulse = 1 + Math.sin(time * 6) * 0.12;
        const emblemCol = isBoss ? '#ef4444' : (isTreasure ? '#fbbf24' : (isMerchant ? '#10b981' : '#c084fc'));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = emblemCol;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : '🔒')), 0, 3);
        ctx.restore();
      } else {
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = trimColor;
        const symbol = isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : '▼'));
        ctx.fillText(symbol, cx, cy + 4);
      }
    } else {
      // WEST OR EAST DOOR: Flush inside thin 28px side curb
      ctx.fillStyle = isLocked ? '#0e0b17' : theme.floorAltColor;
      ctx.fillRect(dx, dy, dw, dh);

      // Posts on top and bottom
      ctx.fillStyle = frameColor;
      ctx.fillRect(dx, dy, dw, 10);
      ctx.fillRect(dx, dy + dh - 10, dw, 10);

      if (isLocked) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        for (let by = dy + 18; by <= dy + dh - 18; by += 14) {
          ctx.beginPath();
          ctx.moveTo(dx, by);
          ctx.lineTo(dx + dw, by);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(dx + dw / 2, dy + 10);
        ctx.lineTo(dx + dw / 2, dy + dh - 10);
        ctx.stroke();

        const pulse = 1 + Math.sin(time * 6) * 0.12;
        const emblemCol = isBoss ? '#ef4444' : (isTreasure ? '#fbbf24' : (isMerchant ? '#10b981' : '#c084fc'));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = emblemCol;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : '🔒')), 0, 3);
        ctx.restore();
      } else {
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = trimColor;
        const symbol = isBoss ? '💀' : (isTreasure ? '★' : (isMerchant ? '💰' : (door.dir === 'west' ? '◀' : '▶')));
        ctx.fillText(symbol, cx, cy + 4);
      }
    }

    ctx.restore();
  }

  /**
   * Draws the descent portal in Boss Sanctum
   */
  drawExitPortal(ctx, p, theme) {
    ctx.save();
    ctx.translate(p.x, p.y);
    p.pulseAngle = (p.pulseAngle || 0) + 0.025;

    if (p.isActive) {
      // Portal floor aura
      const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, p.radius * 1.5);
      grad.addColorStop(0, p.isCountingDown ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(0.4, theme.torchColor);
      grad.addColorStop(0.8, theme.wallBevelColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer boundary ring
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = p.isCountingDown ? '#00ff88' : theme.torchColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner dashed ring
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 0.7, 0, Math.PI * 2);
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = p.isCountingDown ? 'rgba(0, 255, 136, 0.7)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating runic swirl arcs
      ctx.save();
      ctx.rotate(p.pulseAngle);
      ctx.strokeStyle = p.isCountingDown ? '#00ff88' : '#ffffff';
      ctx.lineWidth = 2.5;
      for (let r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, 16 + r * 8, r * 1.5, r * 1.5 + Math.PI * 0.75);
        ctx.stroke();
      }
      ctx.restore();

      // Countdown progress ring
      if (p.isCountingDown) {
        const countdownVal = p.countdown !== undefined ? p.countdown : 3.0;
        const progress = Math.max(0, Math.min(1, 1 - (countdownVal / 3.0)));
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Big countdown text in the center
        const countDisplay = Math.ceil(countdownVal);
        ctx.font = '900 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`DESCENDING IN ${countDisplay}...`, 0, 0);

        ctx.font = '600 11px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('STAND STILL TO DESCEND', 0, p.radius + 20);
      } else {
        // Idle waiting instructions
        ctx.font = '800 13px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('STAND HERE TO DESCEND', 0, -7);

        ctx.font = '600 10px "Outfit", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('All living party members must gather (3s)', 0, 11);

        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.fillStyle = theme.torchColor;
        ctx.fillText('▼ PORTAL READY ▼', 0, -p.radius - 14);
      }
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '800 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#64748b';
      ctx.fillText('🔒 DEFEAT GUARDIAN', 0, 0);
    }

    ctx.restore();
  }

  /**
   * Authentic The Binding of Isaac Style Minimap HUD
   * Renders room grid in the top-right corner
   */
  drawMinimap(dungeon, screenWidth, screenHeight) {
    if (!dungeon || !dungeon.rooms || dungeon.rooms.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    const mapW = 154;
    const mapH = 104;
    const mapX = screenWidth - mapW - 16;
    const mapY = 16;

    // Card background (Clean dark card)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Header label
    ctx.font = '800 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('DUNGEON MAP', mapX + 8, mapY + 13);

    // Current floor tag
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`FL.${dungeon.floorNumber}`, mapX + mapW - 8, mapY + 13);

    // Calculate grid bounds
    let minGx = 0, maxGx = 0, minGy = 0, maxGy = 0;
    for (const r of dungeon.rooms) {
      if (r.gridX < minGx) minGx = r.gridX;
      if (r.gridX > maxGx) maxGx = r.gridX;
      if (r.gridY < minGy) minGy = r.gridY;
      if (r.gridY > maxGy) maxGy = r.gridY;
    }

    const gridSpanX = maxGx - minGx + 1;
    const gridSpanY = maxGy - minGy + 1;

    const maxGridW = mapW - 16;
    const maxGridH = mapH - 28;
    const gap = 3;
    const baseW = Math.floor((maxGridW - (gridSpanX - 1) * gap) / gridSpanX);
    const baseH = Math.floor((maxGridH - (gridSpanY - 1) * gap) / gridSpanY);
    const cellW = Math.max(12, Math.min(20, baseW));
    const cellH = Math.max(9, Math.min(14, baseH));
    const totalGridW = gridSpanX * (cellW + gap) - gap;
    const totalGridH = gridSpanY * (cellH + gap) - gap;

    const originX = mapX + (mapW - totalGridW) / 2;
    const originY = mapY + 20 + (mapH - 20 - totalGridH) / 2;

    // Draw connecting door lines ONLY between explored rooms (and subtle stubs to unexplored doorways)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 2;
    for (const room of dungeon.rooms) {
      if (!room.hasVisited) continue;
      const rx = originX + (room.gridX - minGx) * (cellW + gap) + cellW / 2;
      const ry = originY + (room.gridY - minGy) * (cellH + gap) + cellH / 2;

      for (const door of room.doors) {
        const neighbor = dungeon.rooms.find(x => x.id === door.targetRoomId);
        if (neighbor && neighbor.hasVisited && neighbor.id > room.id) {
          // Both rooms explored: draw full corridor line
          const nx = originX + (neighbor.gridX - minGx) * (cellW + gap) + cellW / 2;
          const ny = originY + (neighbor.gridY - minGy) * (cellH + gap) + cellH / 2;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(nx, ny);
          ctx.stroke();
        } else if (neighbor && !neighbor.hasVisited) {
          // Door leads to unexplored room: draw a subtle doorway tick stub
          let tx = rx;
          let ty = ry;
          if (door.dir === 'north') ty -= (cellH / 2 + 3);
          else if (door.dir === 'south') ty += (cellH / 2 + 3);
          else if (door.dir === 'west') tx -= (cellW / 2 + 3);
          else if (door.dir === 'east') tx += (cellW / 2 + 3);

          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw room boxes ONLY for rooms that have been explored!
    for (const room of dungeon.rooms) {
      if (!room.hasVisited) continue;
      const isCurrent = dungeon.currentRoom && dungeon.currentRoom.id === room.id;
      const rx = originX + (room.gridX - minGx) * (cellW + gap);
      const ry = originY + (room.gridY - minGy) * (cellH + gap);

      if (room.type === 'boss') {
        ctx.fillStyle = isCurrent ? 'rgba(239, 68, 68, 0.65)' : 'rgba(239, 68, 68, 0.4)';
        ctx.strokeStyle = '#ef4444';
      } else if (room.type === 'treasure') {
        ctx.fillStyle = isCurrent ? 'rgba(245, 158, 11, 0.65)' : 'rgba(245, 158, 11, 0.4)';
        ctx.strokeStyle = '#f59e0b';
      } else if (room.type === 'merchant') {
        ctx.fillStyle = isCurrent ? 'rgba(16, 185, 129, 0.65)' : 'rgba(16, 185, 129, 0.4)';
        ctx.strokeStyle = '#10b981';
      } else if (room.type === 'spawn') {
        ctx.fillStyle = isCurrent ? 'rgba(56, 189, 248, 0.55)' : 'rgba(56, 189, 248, 0.3)';
        ctx.strokeStyle = '#38bdf8';
      } else {
        ctx.fillStyle = room.isCleared
          ? 'rgba(71, 85, 105, 0.65)'
          : (isCurrent ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.25)');
        ctx.strokeStyle = room.isCleared ? '#64748b' : '#a855f7';
      }

      ctx.lineWidth = 1.2;
      ctx.fillRect(rx, ry, cellW, cellH);
      ctx.strokeRect(rx, ry, cellW, cellH);

      // Icon inside room
      ctx.font = '800 8.5px sans-serif';
      ctx.textAlign = 'center';
      if (room.type === 'boss') {
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('💀', rx + cellW / 2, ry + cellH / 2 + 3);
      } else if (room.type === 'treasure') {
        ctx.fillStyle = '#fde68a';
        ctx.fillText('★', rx + cellW / 2, ry + cellH / 2 + 3);
      } else if (room.type === 'merchant') {
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText('💰', rx + cellW / 2, ry + cellH / 2 + 3);
      } else if (room.type === 'spawn') {
        ctx.fillStyle = '#bae6fd';
        ctx.fillText('🏠', rx + cellW / 2, ry + cellH / 2 + 3);
      } else {
        if (room.isCleared) {
          ctx.fillStyle = '#22c55e';
          ctx.fillText('✓', rx + cellW / 2, ry + cellH / 2 + 3);
        } else {
          ctx.fillStyle = '#d8b4fe';
          ctx.fillText('⚔️', rx + cellW / 2, ry + cellH / 2 + 3);
        }
      }

      // Highlight current room with crisp white pulsing border
      if (isCurrent) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx - 1, ry - 1, cellW + 2, cellH + 2);
      }
    }

    ctx.restore();
  }

  /**
   * Renders active anime monsters with health bars, animations, and hit flashes
   */
  drawMonsters(monsters, time = 0) {
    const ctx = this.ctx;

    for (const m of monsters) {
      if (m.isDead) continue;
      // Frustum Culling: skip rendering monsters that are offscreen
      if (!this.isEntityVisible(m.x, m.y, (m.radius || 24) + 60)) continue;

      // Draw monster after-images (e.g. Adam Smasher Sandevistan trail)
      if (m.afterImages && m.afterImages.length > 0) {
        for (const img of m.afterImages) {
          ctx.save();
          ctx.translate(img.x, img.y);
          ctx.rotate(img.angle);
          ctx.globalAlpha = Math.max(0, img.alpha * 0.7);
          ctx.fillStyle = img.color || '#00ff88';
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 0.95, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(m.x, m.y);

      // Monster Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, m.radius * 0.75, m.radius * 0.85, m.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kamikaze Exploder Priming Telegraph (Expanding red danger zone)
      if (m.isPriming || (m.fuseTimer && m.fuseTimer > 0)) {
        const explR = m.explosionRadius || 120;
        const fuseDur = m.fuseDuration || 1.0;
        const prog = Math.max(0, Math.min(1, 1 - (m.fuseTimer / fuseDur)));
        const currentR = explR * (0.25 + 0.75 * prog);

        ctx.save();
        // Pulsing red danger radial fill
        const pulseAlpha = 0.15 + Math.sin(m.animTime * 24) * 0.08;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
        ctx.fill();

        // Expanding dashed hazard warning ring
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Maximum blast perimeter boundary
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, explR, 0, Math.PI * 2);
        ctx.stroke();

        // Countdown visual indicator text
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fee2e2';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ DETONATING: ${Math.max(0, m.fuseTimer).toFixed(1)}s`, 0, -explR - 6);
        ctx.restore();
      }

      // Shaman Support Buffer Channeling Sigil (Rotating golden runic array)
      if (m.isBuffing || (m.channelTimer && m.channelTimer > 0)) {
        const buffR = m.buffRadius || 220;
        const spinAng = m.animTime * 2.2;
        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.07)';
        ctx.beginPath();
        ctx.arc(0, 0, buffR, 0, Math.PI * 2);
        ctx.fill();

        // Rotating golden rune perimeter
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, buffR, spinAng, spinAng + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting rune nodes
        ctx.fillStyle = '#fde047';
        for (let r = 0; r < 6; r++) {
          const rAng = spinAng + (r / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(rAng) * buffR, Math.sin(rAng) * buffR, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner harmonic wave
        const waveR = (m.animTime * 140) % buffR;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, waveR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Protective Ward Energy Shield Bubble (Absorbs up to 40 damage)
      if (m.wardHp && m.wardHp > 0) {
        ctx.save();
        const wardPulse = Math.sin(m.animTime * 5.5) * 2;
        const wardR = m.radius + 6 + wardPulse;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, wardR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shimmering hexagonal barrier facets
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const hAng = (h / 6) * Math.PI * 2 + m.animTime * 0.4;
          const hx = Math.cos(hAng) * wardR;
          const hy = Math.sin(hAng) * wardR;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Hit Flash: White glow silhouette
      if (m.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius + 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Procedural Rendering by Archetype and Theme
      if (m.type === 'fly_head') {
        // JJK: Fly Head Cursed Spirit (purple hovering insectoid blob)
        const hoverY = Math.sin(m.animTime * 6) * 4;
        ctx.translate(0, hoverY);

        // Buzzing wings
        const wingFlap = Math.sin(m.animTime * 28) * 8;
        ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-10, -m.radius * 0.7, 7, 13 + wingFlap, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(10, -m.radius * 0.7, 7, 13 + wingFlap, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Dark purple body
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bulging creepy white eye with slit pupil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(m.angle) * 4, Math.sin(m.angle) * 4, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.arc(Math.cos(m.angle) * 5, Math.sin(m.angle) * 5, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'masked_ino') {
        // JJK: Masked Ino Cursed Spirit (ranged caster)
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // White horned mask
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, -2, m.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eye slits
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -3, 3, 2);
        ctx.fillRect(2, -3, 3, 2);
      } else if (m.type === 'cursed_brute') {
        // JJK: Cursed Womb Brute (Heavy Tank)
        if (m.windupTimer > 0) {
          // Telegraphed Orange Slam Circle
          ctx.strokeStyle = '#f97316';
          ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Muscular shoulder spikes
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-m.radius, -8, 6, 6);
        ctx.fillRect(m.radius - 6, -8, 6, 6);
      } else if (m.type === 'cursed_bomb_bug') {
        // JJK: Volatile Curse Beetle (Kamikaze Exploder)
        ctx.save();
        ctx.rotate(m.angle);

        // Scuttling insectoid legs
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let l = -1; l <= 1; l++) {
          const lY = l * 8;
          const legWiggle = Math.sin(m.animTime * 24 + l) * 4;
          ctx.moveTo(-4, lY);
          ctx.lineTo(-m.radius * 1.25, lY - 6 + legWiggle);
          ctx.moveTo(4, lY);
          ctx.lineTo(m.radius * 1.25, lY - 6 - legWiggle);
        }
        ctx.stroke();

        // Molten glowing pulsing abdomen
        const bombPulse = m.isPriming ? Math.sin(m.animTime * 32) * 0.4 + 0.6 : Math.sin(m.animTime * 8) * 0.2 + 0.8;
        ctx.fillStyle = m.isPriming ? `rgba(239, 68, 68, ${bombPulse})` : '#7f1d1d';
        ctx.beginPath();
        ctx.ellipse(-6, 0, m.radius * 0.85, m.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Armored thorax & head
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(6, 0, m.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Twin sharp pincers / mandibles
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(10, -5);
        ctx.lineTo(18, -3);
        ctx.lineTo(12, 0);
        ctx.moveTo(10, 5);
        ctx.lineTo(18, 3);
        ctx.lineTo(12, 0);
        ctx.fill();

        // Glowing red optic eyes
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(8, -3, 3, 2);
        ctx.fillRect(8, 1, 3, 2);
        ctx.restore();
      } else if (m.type === 'cursed_shaman') {
        // JJK: Cursed Ward Shaman (Support Buffer)
        // Robed occult sorcerer
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Flowing occult cowl hood
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(0, -3, m.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Shimenawa straw rope sacred belt
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, m.radius * 0.85, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Floating Paper Talismans (Ofuda) Orbiting Shaman
        ctx.save();
        for (let of = 0; of < 4; of++) {
          const ofAngle = m.animTime * 3 + (of / 4) * Math.PI * 2;
          const ofDist = m.radius + 12;
          const ox = Math.cos(ofAngle) * ofDist;
          const oy = Math.sin(ofAngle) * ofDist;

          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(ofAngle + Math.PI / 2);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-3, -6, 6, 12);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.strokeRect(-3, -6, 6, 12);
          // Red talisman rune mark
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-1.5, -3, 3, 6);
          ctx.restore();
        }
        ctx.restore();

        // Mysterious glowing occult eyes inside cowl
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-4, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (m.type === 'finger_bearer') {
        // JJK Boss: Special Grade Finger Bearer
        const isPhase2 = m.phase === 2;
        const pulse = Math.sin(m.animTime * (isPhase2 ? 7 : 4)) * (isPhase2 ? 6 : 4);

        if (m.isDying) {
          // Death Animation: Curse Vaporization & Spasms
          const deathProg = Math.max(0, 1 - (m.deathTimer / m.deathDuration));
          ctx.globalAlpha = Math.max(0, 1 - deathProg * 0.95);
          ctx.translate((Math.random() - 0.5) * 8 * deathProg, (Math.random() - 0.5) * 8 * deathProg);

          // Rising Cursed Spirit Dissolution Vapor Spirals
          for (let v = 0; v < 8; v++) {
            const vAngle = (v / 8) * Math.PI * 2 + m.animTime * 4;
            const vDist = (m.radius + deathProg * 40) * (0.6 + (v % 3) * 0.2);
            const vY = -deathProg * 65 - (v * 4);
            ctx.fillStyle = v % 2 === 0 ? 'rgba(168, 85, 247, 0.45)' : 'rgba(88, 28, 135, 0.55)';
            ctx.beginPath();
            ctx.arc(Math.cos(vAngle) * vDist, Math.sin(vAngle) * (vDist * 0.4) + vY, 7 * (1 - deathProg * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Cursed energy aura (expands aggressively in Phase 2)
        const auraColor = isPhase2 ? 'rgba(126, 34, 206, 0.38)' : 'rgba(168, 85, 247, 0.22)';
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius + (isPhase2 ? 22 : 12) + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Phase 2: Black Flash Lightning Arcs
        if (isPhase2 && !m.isDying) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          for (let bf = 0; bf < 4; bf++) {
            const bAng = (bf / 4) * Math.PI * 2 + Math.sin(m.animTime * 15 + bf) * 0.6;
            ctx.moveTo(Math.cos(bAng) * (m.radius * 0.7), Math.sin(bAng) * (m.radius * 0.7));
            ctx.lineTo(Math.cos(bAng) * (m.radius * 1.45), Math.sin(bAng) * (m.radius * 1.45));
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Domain Expansion Windup Circle
          if (m.windupTimer > 0) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 2.8 * (1 - m.windupTimer / 0.85), 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Pale demonic body
        ctx.fillStyle = isPhase2 ? '#cbd5e1' : '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPhase2 ? '#581c87' : '#7e22ce';
        ctx.lineWidth = isPhase2 ? 5 : 4;
        ctx.stroke();

        // Wide Jagged Grin
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 6, 18, 0, Math.PI);
        ctx.stroke();

        // 4 Glowing Red Eyes
        ctx.fillStyle = isPhase2 ? '#ff003c' : '#dc2626';
        ctx.shadowColor = isPhase2 ? '#ff003c' : '#dc2626';
        ctx.shadowBlur = isPhase2 ? 14 : 6;
        ctx.beginPath();
        ctx.arc(-12, -8, 4, 0, Math.PI * 2);
        ctx.arc(-4, -14, 4, 0, Math.PI * 2);
        ctx.arc(4, -14, 4, 0, Math.PI * 2);
        ctx.arc(12, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (m.type === 'arasaka_drone') {
        // Cyberpunk Swarmer: Arasaka Security Drone (quad-rotor hovering drone)
        const hoverY = Math.sin(m.animTime * 8) * 3;
        ctx.translate(0, hoverY);

        // 4 Quad-thruster diagonal arms
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        const armDist = m.radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(-armDist, -armDist);
        ctx.lineTo(armDist, armDist);
        ctx.moveTo(-armDist, armDist);
        ctx.lineTo(armDist, -armDist);
        ctx.stroke();

        // 4 Rotor micro-pods with cyan ion glow
        const thrusters = [
          [-armDist, -armDist],
          [armDist, -armDist],
          [-armDist, armDist],
          [armDist, armDist]
        ];
        for (const [tx, ty] of thrusters) {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(tx, ty, 5, 0, Math.PI * 2);
          ctx.fill();

          // Ion thrust flicker
          const thrustAlpha = 0.5 + Math.sin(m.animTime * 30 + tx) * 0.3;
          ctx.fillStyle = `rgba(6, 182, 212, ${thrustAlpha})`;
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central diamond composite chassis
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, -m.radius * 0.75);
        ctx.lineTo(m.radius * 0.75, 0);
        ctx.lineTo(0, m.radius * 0.75);
        ctx.lineTo(-m.radius * 0.75, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Flashing central red optical sensor
        const opticPulse = 0.75 + Math.sin(m.animTime * 12) * 0.25;
        ctx.fillStyle = `rgba(239, 68, 68, ${opticPulse})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (m.type === 'tyger_claw_sniper') {
        // Cyberpunk Ranged: Tyger Claw Cyber-Gunner (neon punk with laser rifle)
        // Red laser sight aiming toward player / target
        ctx.save();
        ctx.rotate(m.angle);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(m.radius + 12, 0);
        ctx.lineTo(m.radius + 240, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Long Cyber Sniper Rifle barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(m.radius * 0.4, -2.5, m.radius + 6, 5);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(m.radius + 4, -1.5, 6, 3);
        ctx.restore();

        // Dark street techwear body
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Neon Pink Punk Mohawk
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, -m.radius * 0.6, 3.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Glowing Cyan Kiroshi Visor slit
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(Math.cos(m.angle) * 6 - 5, Math.sin(m.angle) * 6 - 2, 10, 4);
        ctx.shadowBlur = 0;
      } else if (m.type === 'maelstrom_cyberpsycho') {
        // Cyberpunk Brute: Maelstrom Cyberpsycho (Gorilla Arms, spider eyes, hydraulic slam)
        if (m.windupTimer > 0) {
          // Telegraphed Electric Cyan/Red Slam Radius
          const p = 1 - (m.windupTimer / 0.8);
          ctx.strokeStyle = '#06b6d4';
          ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 2.2 * p, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Electric arcing sparks
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const sparkAng = (a / 6) * Math.PI * 2 + Math.random() * 0.5;
            const dist = m.radius * (1.2 + Math.random() * 0.8);
            ctx.moveTo(Math.cos(sparkAng) * m.radius, Math.sin(sparkAng) * m.radius);
            ctx.lineTo(Math.cos(sparkAng) * dist, Math.sin(sparkAng) * dist);
          }
          ctx.stroke();
        }

        // Heavy reinforced chrome frame
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Exposed pulsating spinal cyberware & wiring
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -m.radius * 0.7);
        ctx.lineTo(0, m.radius * 0.7);
        ctx.stroke();

        // Heavy Gorilla Chrome Fists
        ctx.save();
        ctx.rotate(m.angle);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(m.radius * 0.4, -m.radius * 0.75, 12, 8);
        ctx.fillRect(m.radius * 0.4, m.radius * 0.75 - 8, 12, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(m.radius * 0.4 + 10, -m.radius * 0.75 + 2, 3, 4);
        ctx.fillRect(m.radius * 0.4 + 10, m.radius * 0.75 - 6, 3, 4);
        ctx.restore();

        // Terrifying 5-Eye Maelstrom Spider Optic Cluster (Glowing Red)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        const spiderEyes = [
          [-6, -4],
          [6, -4],
          [0, -7],
          [-4, 2],
          [4, 2]
        ];
        for (const [ex, ey] of spiderEyes) {
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (m.type === 'arasaka_drone_suicide') {
        // Cyberpunk Exploder: Arasaka Suicide Kamikaze Drone
        ctx.save();
        ctx.rotate(m.angle);

        // Aerodynamic Swept Delta Wings (Matte Black with Crimson Trim)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(m.radius * 1.1, 0); // Nose tip
        ctx.lineTo(-m.radius * 0.9, -m.radius * 1.15); // Left wingtip
        ctx.lineTo(-m.radius * 0.5, 0); // Rear center notch
        ctx.lineTo(-m.radius * 0.9, m.radius * 1.15); // Right wingtip
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Twin Afterburner Thruster Flames (Blazing Orange/Red)
        const flameLength = (m.isPriming ? 18 : 10) + Math.sin(m.animTime * 35) * 4;
        ctx.fillStyle = m.isPriming ? '#facc15' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.7, -m.radius * 0.45);
        ctx.lineTo(-m.radius * 0.7 - flameLength, -m.radius * 0.45);
        ctx.lineTo(-m.radius * 0.7, -m.radius * 0.2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.7, m.radius * 0.2);
        ctx.lineTo(-m.radius * 0.7 - flameLength, m.radius * 0.45);
        ctx.lineTo(-m.radius * 0.7, m.radius * 0.45);
        ctx.fill();

        // High-Yield Volatile Warhead Nose Core
        const warheadPulse = m.isPriming ? Math.sin(m.animTime * 36) * 0.5 + 0.5 : Math.sin(m.animTime * 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(239, 68, 68, ${warheadPulse})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = m.isPriming ? 16 : 6;
        ctx.beginPath();
        ctx.arc(m.radius * 0.4, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Flashing Top Warning Strobe Light
        const strobeGlow = Math.sin(m.animTime * (m.isPriming ? 40 : 12)) > 0;
        ctx.fillStyle = strobeGlow ? '#fee2e2' : '#7f1d1d';
        ctx.fillRect(-2, -3, 4, 6);

        // Yellow Hazard Chevrons on wing surface
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-m.radius * 0.3, -m.radius * 0.7, 3, 5);
        ctx.fillRect(-m.radius * 0.3, m.radius * 0.7 - 5, 3, 5);
        ctx.restore();
      } else if (m.type === 'netrunner_overseer') {
        // Cyberpunk Shaman: Netrunner Overseer (Support Buffer & Signal Hacker)
        ctx.save();
        // Floating techwear coat with cyan neural circuits
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Cybernetic Trenchcoat Collar
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -2, m.radius * 0.7, 0, Math.PI);
        ctx.fill();

        // High-Tech Cyberdeck Unit on Hip/Back
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-m.radius * 0.85, 4, m.radius * 1.7, 6);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.strokeRect(-m.radius * 0.85, 4, m.radius * 1.7, 6);

        // Holographic Neural Data Crown (Floating rotating cyber glyphs)
        ctx.save();
        const crownRot = m.animTime * 2.5;
        ctx.translate(0, -m.radius * 0.65);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 4.5, crownRot * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Data nodes in crown
        for (let cn = 0; cn < 4; cn++) {
          const cAng = crownRot + (cn / 4) * Math.PI * 2;
          ctx.fillStyle = '#fde047';
          ctx.fillRect(Math.cos(cAng) * 10 - 1.5, Math.sin(cAng) * 4 - 1.5, 3, 3);
        }
        ctx.restore();

        // Dual Glowing Cyan Netrunner Visor Slit
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(-6, -4, 12, 3);
        ctx.shadowBlur = 0;

        // Trailing Optical Cables with Golden Data Pulses
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const cableWave = Math.sin(m.animTime * 6) * 4;
        ctx.moveTo(-m.radius * 0.5, m.radius * 0.7);
        ctx.lineTo(-m.radius * 0.8, m.radius * 1.35 + cableWave);
        ctx.moveTo(m.radius * 0.5, m.radius * 0.7);
        ctx.lineTo(m.radius * 0.8, m.radius * 1.35 - cableWave);
        ctx.stroke();
        ctx.restore();
      } else if (m.type === 'adam_smasher_prototype') {
        // Cyberpunk Boss: Adam Smasher Prototype (Titanium War Chassis)
        const isPhase2 = m.phase === 2;
        const pulse = Math.sin(m.animTime * (isPhase2 ? 8 : 4)) * (isPhase2 ? 6 : 4);

        if (m.isDying) {
          // Death Animation: Core Detonation & System Failure
          const deathProg = Math.max(0, 1 - (m.deathTimer / m.deathDuration));
          ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);

          // Electrical arcs crackling across chassis
          ctx.strokeStyle = Math.random() < 0.5 ? '#00f0ff' : '#facc15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const arcAng = (a / 6) * Math.PI * 2 + Math.random() * 0.6;
            ctx.moveTo(Math.cos(arcAng) * (m.radius * 0.3), Math.sin(arcAng) * (m.radius * 0.3));
            ctx.lineTo(Math.cos(arcAng) * (m.radius * 1.35), Math.sin(arcAng) * (m.radius * 1.35));
          }
          ctx.stroke();

          // Final 0.8s: High-energy core explosion sphere
          if (m.deathTimer <= 0.8) {
            const blastProg = (0.8 - m.deathTimer) / 0.8;
            ctx.fillStyle = `rgba(6, 182, 212, ${(1 - blastProg) * 0.85})`;
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * (1 + blastProg * 2.8), 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - blastProg) * 0.95})`;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
        }

        // Sandevistan Electric Cyber-Aura (Neon green in Phase 2!)
        const auraBorder = isPhase2 ? 'rgba(0, 255, 136, 0.65)' : 'rgba(6, 182, 212, 0.4)';
        const auraFill = isPhase2 ? 'rgba(0, 255, 136, 0.18)' : 'rgba(6, 182, 212, 0.12)';
        ctx.strokeStyle = auraBorder;
        ctx.fillStyle = auraFill;
        ctx.lineWidth = isPhase2 ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius + (isPhase2 ? 22 : 14) + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // If winding up attack or special
        if (m.windupTimer > 0 && !m.isDying) {
          ctx.strokeStyle = isPhase2 ? '#00ff88' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * (isPhase2 ? 3.2 : 2.5), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Heavy industrial titanium shoulder missile pods
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-m.radius * 0.95, -m.radius * 0.95, 18, 22);
        ctx.fillRect(m.radius * 0.95 - 18, -m.radius * 0.95, 18, 22);
        ctx.strokeStyle = isPhase2 ? '#00ff88' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-m.radius * 0.95, -m.radius * 0.95, 18, 22);
        ctx.strokeRect(m.radius * 0.95 - 18, -m.radius * 0.95, 18, 22);

        // Missile tube holes (Phase 2 glows hotter with open rocket tips)
        const tubeColor = isPhase2 ? '#facc15' : '#ef4444';
        ctx.fillStyle = tubeColor;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            ctx.fillRect(-m.radius * 0.95 + 3 + col * 7, -m.radius * 0.95 + 3 + row * 6, 4, 4);
            ctx.fillRect(m.radius * 0.95 - 16 + col * 7, -m.radius * 0.95 + 3 + row * 6, 4, 4);
          }
        }

        // Massive Heavy Torso
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Hydraulic Collar & Chest Plate
        ctx.fillStyle = '#334155';
        ctx.fillRect(-m.radius * 0.5, -m.radius * 0.4, m.radius, m.radius * 0.8);
        ctx.strokeStyle = isPhase2 ? '#00ff88' : '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(-m.radius * 0.5, -m.radius * 0.4, m.radius, m.radius * 0.8);

        // Skull Faceplate (Cybernetic Skull)
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing Red Optic Sockets (or flickering if dying)
        const opticGlow = m.isDying ? (Math.random() < 0.5 ? '#ffffff' : '#ff003c') : '#ff003c';
        ctx.fillStyle = opticGlow;
        ctx.shadowColor = opticGlow;
        ctx.shadowBlur = isPhase2 ? 18 : 12;
        ctx.beginPath();
        ctx.arc(-6, -4, 4, 0, Math.PI * 2);
        ctx.arc(6, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Titanium Teeth Grille
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, 6, 16, 4);
        ctx.fillStyle = '#94a3b8';
        for (let t = -7; t <= 5; t += 3) {
          ctx.fillRect(t, 6, 1.5, 4);
        }

        // Right Arm Rotary Cannon
        ctx.save();
        ctx.rotate(m.angle);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(m.radius * 0.4, -m.radius * 0.75, 26, 9);
        ctx.strokeStyle = isPhase2 ? '#00ff88' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(m.radius * 0.4, -m.radius * 0.75, 26, 9);
        ctx.restore();
      } else if (m.type === 'crawler_titan') {
        // AoT Swarmer: Pure Titan Crawler (erratic scuttling abnormal titan with giant grinning maw)
        const crawlOsc = Math.sin(m.animTime * 14) * 4;
        ctx.translate(0, crawlOsc);

        // Scuttling elongated limbs
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        // Front grasping arms
        ctx.moveTo(-m.radius * 0.4, -m.radius * 0.2);
        ctx.lineTo(-m.radius * 1.1, -m.radius * 0.7);
        ctx.moveTo(m.radius * 0.4, -m.radius * 0.2);
        ctx.lineTo(m.radius * 1.1, -m.radius * 0.7);
        // Rear sprawling legs
        ctx.moveTo(-m.radius * 0.3, m.radius * 0.3);
        ctx.lineTo(-m.radius * 0.95, m.radius * 0.85);
        ctx.moveTo(m.radius * 0.3, m.radius * 0.3);
        ctx.lineTo(m.radius * 0.95, m.radius * 0.85);
        ctx.stroke();

        // Pale grotesque torso
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius * 0.85, m.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Disproportionate Titan Head
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, -m.radius * 0.4, m.radius * 0.62, 0, Math.PI * 2);
        ctx.fill();

        // Gaping toothy grinning mouth
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, -m.radius * 0.3, m.radius * 0.45, 5, 0, 0, Math.PI);
        ctx.fill();

        // Needle teeth row
        ctx.fillStyle = '#ffffff';
        for (let t = -m.radius * 0.35; t <= m.radius * 0.35; t += 3) {
          ctx.fillRect(t, -m.radius * 0.32, 1.5, 3.5);
        }

        // Bulging manic staring eyes with pinprick pupils
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -m.radius * 0.55, 4, 0, Math.PI * 2);
        ctx.arc(6, -m.radius * 0.55, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-6 + Math.cos(m.angle) * 1.5, -m.radius * 0.55 + Math.sin(m.angle) * 1.5, 1.8, 0, Math.PI * 2);
        ctx.arc(6 + Math.cos(m.angle) * 1.5, -m.radius * 0.55 + Math.sin(m.angle) * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'marleyan_rifleman') {
        // AoT Ranged: Marleyan Military Rifleman
        // Aiming laser sight
        ctx.save();
        ctx.rotate(m.angle);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(m.radius + 14, 0);
        ctx.lineTo(m.radius + 250, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Long-barrel Mauser Anti-Titan Rifle
        ctx.fillStyle = '#78350f'; // Wooden stock
        ctx.fillRect(m.radius * 0.3, -2, 14, 4);
        ctx.fillStyle = '#1e293b'; // Steel barrel
        ctx.fillRect(m.radius * 0.3 + 12, -1.5, m.radius + 8, 3);
        ctx.fillStyle = '#d97706'; // Brass bolt
        ctx.fillRect(m.radius * 0.3 + 8, -2.5, 4, 2);
        ctx.restore();

        // Dark grey uniform body
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Military stalhelm helmet
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, -2, m.radius * 0.72, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tactical gear harness belt
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-m.radius * 0.6, 2, m.radius * 1.2, 4);
      } else if (m.type === 'pure_titan_bomb') {
        // AoT Exploder: Volatile Abnormal Titan (Kamikaze Exploder)
        const walkBob = Math.sin(m.animTime * 18) * 3;
        ctx.translate(0, walkBob);

        // Bloated, Grotesquely Swollen Titan Torso
        const bellyPulse = m.isPriming ? Math.sin(m.animTime * 28) * 3 : Math.sin(m.animTime * 8) * 1.5;
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.ellipse(0, 2, m.radius * 1.05 + bellyPulse, m.radius * 0.88 + bellyPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Boiling Internal Red Core glowing through stretched pale skin
        const coreAlpha = m.isPriming ? 0.7 + Math.sin(m.animTime * 34) * 0.3 : 0.45;
        ctx.fillStyle = `rgba(239, 68, 68, ${coreAlpha})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = m.isPriming ? 18 : 6;
        ctx.beginPath();
        ctx.arc(0, 2, m.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Scalding Steam Vents Hissing Puffing Clouds
        for (let sv = 0; sv < 4; sv++) {
          const svAng = (sv / 4) * Math.PI * 2 + m.animTime * 3;
          const svDist = m.radius * 0.95;
          const puffSize = 4 + Math.sin(m.animTime * 12 + sv) * 2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(Math.cos(svAng) * svDist, Math.sin(svAng) * svDist - 4, puffSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Twisted Abnormal Titan Face (Wide unnerving grin & popping eyes)
        ctx.fillStyle = '#fecaca';
        ctx.beginPath();
        ctx.arc(0, -m.radius * 0.45, m.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Gaping unhinged mouth
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.ellipse(0, -m.radius * 0.35, 7, 4, 0, 0, Math.PI);
        ctx.fill();

        // Frenzied bulging bloodshot eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -m.radius * 0.55, 3, 0, Math.PI * 2);
        ctx.arc(4, -m.radius * 0.55, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(-4 + Math.cos(m.angle), -m.radius * 0.55 + Math.sin(m.angle), 1.6, 0, Math.PI * 2);
        ctx.arc(4 + Math.cos(m.angle), -m.radius * 0.55 + Math.sin(m.angle), 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'marleyan_commander') {
        // AoT Shaman: Marleyan Signal Commander (Support Buffer)
        ctx.save();
        // Crisp Marleyan Officer Uniform (Slate olive & gold buttons)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Golden Braided Epaulets on Shoulders
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-m.radius * 0.95, -6, 7, 12);
        ctx.fillRect(m.radius * 0.95 - 7, -6, 7, 12);

        // Peaked Military Officer Cap
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, -m.radius * 0.55, m.radius * 0.72, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold Emblem & Visor Brim
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -m.radius * 0.65, 6, 4);
        ctx.fillStyle = '#020617';
        ctx.fillRect(-m.radius * 0.6, -m.radius * 0.5, m.radius * 1.2, 3);

        // Raised Arm with Brass Signal Flare Gun
        ctx.save();
        ctx.rotate(m.angle);
        ctx.fillStyle = '#d97706'; // Polished Brass
        ctx.fillRect(m.radius * 0.35, -m.radius * 0.7, 14, 5);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(m.radius * 0.35, -m.radius * 0.7 + 5, 5, 6); // Grip

        // Golden Signal Flare / Spark Eruption from Muzzle
        const flarePulse = 0.6 + Math.sin(m.animTime * 15) * 0.4;
        ctx.fillStyle = `rgba(250, 204, 21, ${flarePulse})`;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(m.radius * 0.35 + 16, -m.radius * 0.7 + 2.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Tactical Field Radio Antenna with Concentric Golden Signal Radiations
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -m.radius * 0.7);
        ctx.lineTo(0, -m.radius * 1.3);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -m.radius * 1.3, 4 + (m.animTime * 14) % 10, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
        ctx.restore();
      } else if (m.type === 'hardened_brute') {
        // AoT Brute: Hardened Fist 4-Meter Class Titan
        if (m.windupTimer > 0) {
          // Telegraphed Crystallized Shockwave Radius
          const p = 1 - (m.windupTimer / 0.8);
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 2.2 * p, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Crystal shard spikes radiating outward
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let a = 0; a < 8; a++) {
            const spikeAng = (a / 8) * Math.PI * 2;
            const sDist = m.radius * (1.1 + p * 1.0);
            ctx.moveTo(Math.cos(spikeAng) * (sDist - 8), Math.sin(spikeAng) * (sDist - 8));
            ctx.lineTo(Math.cos(spikeAng) * sDist, Math.sin(spikeAng) * sDist);
          }
          ctx.stroke();
        }

        // Heavy muscular titan torso
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Crystallized Hardening on shoulders and knuckles (glowing cyan-white)
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;

        // Left shoulder crystal plate
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.9, -m.radius * 0.3);
        ctx.lineTo(-m.radius * 0.5, -m.radius * 0.85);
        ctx.lineTo(-m.radius * 0.2, -m.radius * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right shoulder crystal plate
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.9, -m.radius * 0.3);
        ctx.lineTo(m.radius * 0.5, -m.radius * 0.85);
        ctx.lineTo(m.radius * 0.2, -m.radius * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy Hardened Fists
        ctx.save();
        ctx.rotate(m.angle);
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.fillRect(m.radius * 0.4, -m.radius * 0.8, 14, 10);
        ctx.strokeRect(m.radius * 0.4, -m.radius * 0.8, 14, 10);
        ctx.fillRect(m.radius * 0.4, m.radius * 0.8 - 10, 14, 10);
        ctx.strokeRect(m.radius * 0.4, m.radius * 0.8 - 10, 14, 10);
        ctx.restore();

        // Glowing crystal cyan eyes
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-5, -m.radius * 0.4, 3, 0, Math.PI * 2);
        ctx.arc(5, -m.radius * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (m.type === 'armored_titan') {
        // AoT Boss: Armored Titan (Reiner Braun Prototype)
        const isPhase2 = m.phase === 2;
        const pulse = Math.sin(m.animTime * (isPhase2 ? 7 : 3.5)) * (isPhase2 ? 5 : 3);

        if (m.isDying) {
          // Custom Death Animation: Hardening Armor Shatter & Billowing Steam Evaporation
          const deathProg = Math.max(0, 1 - (m.deathTimer / m.deathDuration));
          ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);

          // Billowing scalding white steam clouds erupting upwards
          for (let s = 0; s < 7; s++) {
            const steamAng = (s / 7) * Math.PI * 2 + m.animTime * 2;
            const steamR = m.radius * (0.8 + deathProg * 1.8 + Math.sin(s * 1.5) * 0.2);
            ctx.fillStyle = `rgba(255, 255, 255, ${(1 - deathProg) * 0.45})`;
            ctx.beginPath();
            ctx.arc(Math.cos(steamAng) * (steamR * 0.5), Math.sin(steamAng) * (steamR * 0.5) - deathProg * 25, steamR * 0.65, 0, Math.PI * 2);
            ctx.fill();
          }

          // Flying crystalline armor shards bursting outward
          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          for (let p = 0; p < 8; p++) {
            const pAng = (p / 8) * Math.PI * 2;
            const pDist = m.radius * (0.5 + deathProg * 2.2);
            ctx.save();
            ctx.translate(Math.cos(pAng) * pDist, Math.sin(pAng) * pDist);
            ctx.rotate(deathProg * 8 + p);
            ctx.beginPath();
            ctx.moveTo(-6, -4);
            ctx.lineTo(6, -2);
            ctx.lineTo(2, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }

        // Scalding Steam Cloud Puffs around Titan (Continuous passive aura)
        ctx.fillStyle = isPhase2 ? 'rgba(254, 240, 138, 0.22)' : 'rgba(255, 255, 255, 0.16)';
        for (let s = 0; s < 5; s++) {
          const sAng = (s / 5) * Math.PI * 2 + m.animTime * 1.2;
          const sRad = m.radius + 8 + Math.sin(m.animTime * 4 + s) * 6;
          ctx.beginPath();
          ctx.arc(Math.cos(sAng) * sRad, Math.sin(sAng) * sRad, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // Phase 2 Molten Amber Aura
        if (isPhase2 && !m.isDying) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius + 16 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // If winding up attack
        if (m.windupTimer > 0 && !m.isDying) {
          ctx.strokeStyle = isPhase2 ? '#ef4444' : '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * (isPhase2 ? 3.0 : 2.4), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Exposed striated scarlet muscle core
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // Muscle striations
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = -m.radius * 0.7; i <= m.radius * 0.7; i += 7) {
          ctx.moveTo(i, -m.radius * 0.6);
          ctx.lineTo(i, m.radius * 0.6);
        }
        ctx.stroke();

        // Golden Hardened Armor Plates (Chest Carapace)
        const armorBase = isPhase2 ? '#b45309' : '#d97706';
        const armorRim = isPhase2 ? '#f59e0b' : '#fde047';
        ctx.fillStyle = armorBase;
        ctx.strokeStyle = armorRim;
        ctx.lineWidth = 2;

        // Pectoral Plates
        ctx.fillRect(-m.radius * 0.75, -m.radius * 0.45, m.radius * 0.7, m.radius * 0.4);
        ctx.strokeRect(-m.radius * 0.75, -m.radius * 0.45, m.radius * 0.7, m.radius * 0.4);
        ctx.fillRect(m.radius * 0.05, -m.radius * 0.45, m.radius * 0.7, m.radius * 0.4);
        ctx.strokeRect(m.radius * 0.05, -m.radius * 0.45, m.radius * 0.7, m.radius * 0.4);

        // Abdominal Armor Segment
        ctx.fillRect(-m.radius * 0.5, m.radius * 0.05, m.radius * 1.0, m.radius * 0.45);
        ctx.strokeRect(-m.radius * 0.5, m.radius * 0.05, m.radius * 1.0, m.radius * 0.45);

        // Broad Shoulder Pauldrons
        ctx.fillRect(-m.radius * 0.98, -m.radius * 0.8, m.radius * 0.45, m.radius * 0.5);
        ctx.strokeRect(-m.radius * 0.98, -m.radius * 0.8, m.radius * 0.45, m.radius * 0.5);
        ctx.fillRect(m.radius * 0.53, -m.radius * 0.8, m.radius * 0.45, m.radius * 0.5);
        ctx.strokeRect(m.radius * 0.53, -m.radius * 0.8, m.radius * 0.45, m.radius * 0.5);

        // Armored Lower Jaw Visor
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-m.radius * 0.35, m.radius * 0.5, m.radius * 0.7, 8);
        ctx.strokeStyle = armorRim;
        ctx.strokeRect(-m.radius * 0.35, m.radius * 0.5, m.radius * 0.7, 8);

        // Blazing Golden-Yellow Eyes
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = isPhase2 ? 18 : 10;
        ctx.beginPath();
        ctx.arc(-8, -m.radius * 0.2, 3.5, 0, Math.PI * 2);
        ctx.arc(8, -m.radius * 0.2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (m.type === 'corpse_legionary') {
        // Berserk Swarmer: Possessed Corpse Legionary (Skeletal fiend with rusted iron falchion)
        ctx.save();
        ctx.rotate(m.angle);
        const wobble = Math.sin(m.animTime * 14) * 3;

        // Battered iron breastplate & ribcage
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Exposed white bone ribs
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.8;
        for (let r = -6; r <= 6; r += 4) {
          ctx.beginPath();
          ctx.moveTo(-m.radius * 0.5, r);
          ctx.lineTo(m.radius * 0.5, r);
          ctx.stroke();
        }

        // Battered iron helmet with nose guard
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.arc(0, -2, m.radius * 0.6, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#78716c';
        ctx.stroke();

        // Glowing crimson eye sockets inside dark skull
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-4, -1, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Right hand: Rusted Jagged Iron Falchion
        ctx.fillStyle = '#44403c';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.4, -m.radius * 0.6);
        ctx.lineTo(m.radius * 0.4 + 20, -m.radius * 0.6 + wobble);
        ctx.lineTo(m.radius * 0.4 + 16, -m.radius * 0.6 - 4 + wobble);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      } else if (m.type === 'apostle_hound') {
        // Berserk Exploder: Apostle Demonic Hound (Quadrupedal fiend wrapped in thorns)
        ctx.save();
        ctx.rotate(m.angle);

        // Scuttling clawed legs
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const legRun = Math.sin(m.animTime * 20) * 6;
        ctx.moveTo(-m.radius * 0.5, -m.radius * 0.7);
        ctx.lineTo(-m.radius * 1.1, -m.radius * 0.8 + legRun);
        ctx.moveTo(m.radius * 0.5, -m.radius * 0.7);
        ctx.lineTo(m.radius * 1.1, -m.radius * 0.8 - legRun);
        ctx.moveTo(-m.radius * 0.4, m.radius * 0.7);
        ctx.lineTo(-m.radius * 0.9, m.radius * 0.8 - legRun);
        ctx.moveTo(m.radius * 0.4, m.radius * 0.7);
        ctx.lineTo(m.radius * 0.9, m.radius * 0.8 + legRun);
        ctx.stroke();

        // Dark demonic hound body
        ctx.fillStyle = '#0c0a09';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius, m.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsating crimson sacrificial core on back
        const houndPulse = m.isPriming ? Math.sin(m.animTime * 35) * 0.5 + 0.5 : Math.sin(m.animTime * 8) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(239, 68, 68, ${houndPulse})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = m.isPriming ? 18 : 8;
        ctx.beginPath();
        ctx.arc(-2, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Snouted predator head with twin horns & red fangs
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.6, -7);
        ctx.lineTo(m.radius * 1.25, 0); // Spiked snout
        ctx.lineTo(m.radius * 0.6, 7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        // Twin backwards curved horns
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.5, -6);
        ctx.lineTo(m.radius * 0.1, -12);
        ctx.moveTo(m.radius * 0.5, 6);
        ctx.lineTo(m.radius * 0.1, 12);
        ctx.stroke();

        ctx.restore();
      } else if (m.type === 'eclipse_heretic') {
        // Berserk Ranged: Eclipse Heretic (Dark robed cultist casting crimson blood curses)
        ctx.save();
        // Dark crimson ragged cowl & robes
        ctx.fillStyle = '#26080b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Deep hood cowl
        ctx.fillStyle = '#180407';
        ctx.beginPath();
        ctx.arc(0, -3, m.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Brand of Sacrifice on forehead/face
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -2);
        ctx.moveTo(-3, -6);
        ctx.lineTo(3, -4);
        ctx.moveTo(-3, -4);
        ctx.lineTo(3, -6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Orbiting blood skull orbs
        for (let o = 0; o < 3; o++) {
          const oAng = m.animTime * 3.5 + (o / 3) * Math.PI * 2;
          const ox = Math.cos(oAng) * (m.radius + 12);
          const oy = Math.sin(oAng) * (m.radius + 12);
          ctx.fillStyle = '#dc2626';
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      } else if (m.type === 'executioner_brute') {
        // Berserk Brute: Torturer Executioner (Towering black iron tank with executioner blade)
        if (m.windupTimer > 0) {
          // Telegraphed Crimson Executioner Cleave Arc
          const p = 1 - (m.windupTimer / 0.8);
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 2.3 * p, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Bulky iron armor torso
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Heavy spiked shoulder pauldrons
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-m.radius * 0.95, -10, 8, 20);
        ctx.fillRect(m.radius * 0.95 - 8, -10, 8, 20);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-m.radius * 0.95, -12, 3, 4); // Red spike tips
        ctx.fillRect(m.radius * 0.95 - 3, -12, 3, 4);

        // Leather Executioner Hood with eye slits
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -3, 3, 2);
        ctx.fillRect(2, -3, 3, 2);

        // Colossal Two-Handed Executioner Iron Blade
        ctx.save();
        ctx.rotate(m.angle);
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(m.radius * 0.4, -m.radius * 0.75, 28, 11, [2]);
        ctx.fill();
        ctx.stroke();
        // Bloodstained blade edge
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(m.radius * 0.4 + 20, -m.radius * 0.75, 8, 11);
        ctx.restore();
      } else if (m.type === 'apostle_shaman') {
        // Berserk Shaman: Egg Apostle Shaman (Egg-shaped apostle channeling unholy blood wards)
        ctx.save();
        // Pale egg-like carapace
        ctx.fillStyle = '#2e1014';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius * 0.9, m.radius * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Eerie weeping bloody eyes embedded in egg surface
        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.arc(-4, -6, 3, 0, Math.PI * 2);
        ctx.arc(4, -6, 3, 0, Math.PI * 2);
        ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -6, 2, 2);
        ctx.fillRect(3, -6, 2, 2);
        ctx.fillRect(-1, 4, 2, 2);

        // Chanting Crimson Halo Ring hovering overhead
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, -m.radius * 1.25, 12, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      } else if (m.type === 'nosferatu_zodd') {
        // Berserk Boss: Nosferatu Zodd (The Immortal Apostle)
        const isPhase2 = m.phase === 2;
        const pulse = Math.sin(m.animTime * (isPhase2 ? 8 : 4)) * (isPhase2 ? 6 : 3.5);

        if (m.isDying) {
          // Death Animation: Apostle Dissolution & Blood Mist Spiral
          const deathProg = Math.max(0, 1 - (m.deathTimer / m.deathDuration));
          ctx.translate((Math.random() - 0.5) * 8 * deathProg, (Math.random() - 0.5) * 8 * deathProg);

          // Dark crimson blood miasma spirals
          for (let s = 0; s < 10; s++) {
            const sAngle = (s / 10) * Math.PI * 2 + m.animTime * 5;
            const sDist = (m.radius + deathProg * 45) * (0.6 + (s % 3) * 0.2);
            const sY = -deathProg * 70 - (s * 4);
            ctx.fillStyle = s % 2 === 0 ? 'rgba(239, 68, 68, 0.55)' : 'rgba(127, 29, 29, 0.65)';
            ctx.beginPath();
            ctx.arc(Math.cos(sAngle) * sDist, Math.sin(sAngle) * (sDist * 0.4) + sY, 8 * (1 - deathProg * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Demonic Blood Aura (Expands and intensifies in Phase 2)
        const auraColor = isPhase2 ? 'rgba(220, 38, 38, 0.48)' : 'rgba(185, 28, 28, 0.26)';
        ctx.strokeStyle = isPhase2 ? '#ef4444' : '#b91c1c';
        ctx.fillStyle = auraColor;
        ctx.lineWidth = isPhase2 ? 3.5 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius + (isPhase2 ? 24 : 14) + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // If winding up attack or special
        if (m.windupTimer > 0 && !m.isDying) {
          ctx.strokeStyle = isPhase2 ? '#dc2626' : '#f59e0b';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * (isPhase2 ? 3.2 : 2.5), 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isPhase2) {
          // --- PHASE 2: WINGED APOSTLE (BEAST OF DARKNESS FORM) ---
          ctx.save();
          ctx.rotate(m.angle);

          // Giant Bat Wings unfolding and flapping with animTime
          const wingFlap = Math.sin(m.animTime * 12) * 16;
          ctx.fillStyle = '#140507';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;

          // Left Wing
          ctx.beginPath();
          ctx.moveTo(-m.radius * 0.3, -m.radius * 0.4);
          ctx.lineTo(-m.radius * 1.6, -m.radius * 1.5 + wingFlap); // Upper wing joint
          ctx.lineTo(-m.radius * 1.1, -m.radius * 0.6 + wingFlap * 0.6);
          ctx.lineTo(-m.radius * 0.4, -m.radius * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Wing
          ctx.beginPath();
          ctx.moveTo(-m.radius * 0.3, m.radius * 0.4);
          ctx.lineTo(-m.radius * 1.6, m.radius * 1.5 - wingFlap); // Upper wing joint
          ctx.lineTo(-m.radius * 1.1, m.radius * 0.6 - wingFlap * 0.6);
          ctx.lineTo(-m.radius * 0.4, m.radius * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Massive Demonic Minotaur Torso (Pitch Black Hide)
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Crimson muscle striations across chest
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = -m.radius * 0.6; i <= m.radius * 0.6; i += 9) {
            ctx.moveTo(i, -m.radius * 0.5);
            ctx.lineTo(i, m.radius * 0.5);
          }
          ctx.stroke();

          // Twin Swept-Back Curved Ram/Bull Horns
          ctx.strokeStyle = '#27272a';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(m.radius * 0.3, -m.radius * 0.6);
          ctx.quadraticCurveTo(-m.radius * 0.4, -m.radius * 1.4, -m.radius * 0.9, -m.radius * 0.9);
          ctx.moveTo(m.radius * 0.3, m.radius * 0.6);
          ctx.quadraticCurveTo(-m.radius * 0.4, m.radius * 1.4, -m.radius * 0.9, m.radius * 0.9);
          ctx.stroke();

          ctx.strokeStyle = '#71717a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(m.radius * 0.3, -m.radius * 0.6);
          ctx.quadraticCurveTo(-m.radius * 0.4, -m.radius * 1.4, -m.radius * 0.9, -m.radius * 0.9);
          ctx.moveTo(m.radius * 0.3, m.radius * 0.6);
          ctx.quadraticCurveTo(-m.radius * 0.4, m.radius * 1.4, -m.radius * 0.9, m.radius * 0.9);
          ctx.stroke();

          // Snarling Demonic Snout & Jaw
          ctx.fillStyle = '#180407';
          ctx.beginPath();
          ctx.arc(m.radius * 0.5, 0, m.radius * 0.45, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Sharp bloody fangs
          ctx.fillStyle = '#fee2e2';
          ctx.beginPath();
          ctx.moveTo(m.radius * 0.75, -6);
          ctx.lineTo(m.radius * 0.95, -4);
          ctx.lineTo(m.radius * 0.75, -2);
          ctx.moveTo(m.radius * 0.75, 2);
          ctx.lineTo(m.radius * 0.95, 4);
          ctx.lineTo(m.radius * 0.75, 6);
          ctx.fill();

          // Blazing Crimson Neon Eyes
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(m.radius * 0.4, -8, 4.5, 0, Math.PI * 2);
          ctx.arc(m.radius * 0.4, 8, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Razor-sharp beast claws in front
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.fillRect(m.radius * 0.4, -m.radius * 0.9, 14, 8);
          ctx.fillRect(m.radius * 0.4, m.radius * 0.9 - 8, 14, 8);

          ctx.restore();
        } else {
          // --- PHASE 1: HUMAN MERCENARY SWORDSMAN FORM ---
          ctx.save();
          ctx.rotate(m.angle);

          // Muscular Warrior Torso (Dark bronze / tanned berserker flesh)
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Battle-scarred chest cuts
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-m.radius * 0.4, -6);
          ctx.lineTo(m.radius * 0.3, 8);
          ctx.moveTo(-m.radius * 0.2, 8);
          ctx.lineTo(m.radius * 0.4, -4);
          ctx.stroke();

          // Thick spiky wild black mane hair framing head and shoulders
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(-m.radius * 0.3, 0, m.radius * 0.8, -Math.PI * 0.8, Math.PI * 0.8);
          ctx.fill();
          // Spiky hair tufts
          for (let h = -3; h <= 3; h++) {
            ctx.beginPath();
            ctx.moveTo(-m.radius * 0.6, h * 10);
            ctx.lineTo(-m.radius * 1.25, h * 12);
            ctx.lineTo(-m.radius * 0.6, (h + 1) * 10);
            ctx.fill();
          }

          // Leather combat kilt & iron skull belt
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-m.radius * 0.4, -m.radius * 0.5, 8, m.radius);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(-m.radius * 0.3, 0, 5, 0, Math.PI * 2); // skull buckle
          ctx.fill();

          // Furrowed brow & predatory face
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.arc(m.radius * 0.3, 0, m.radius * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // Glowing predatory amber-yellow eyes
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(m.radius * 0.45, -5, 3, 0, Math.PI * 2);
          ctx.arc(m.radius * 0.45, 5, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Fangs
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(m.radius * 0.6, -3, 3, 2);
          ctx.fillRect(m.radius * 0.6, 2, 3, 2);

          // Right Hand: Colossal Curved Scimitar
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.radius * 0.4, m.radius * 0.6);
          ctx.lineTo(m.radius * 0.4 + 36, m.radius * 0.6 + 8); // curved blade tip
          ctx.lineTo(m.radius * 0.4 + 26, m.radius * 0.6 - 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Left Hand: Heavy Iron Battleaxe
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(m.radius * 0.4, -m.radius * 0.6);
          ctx.lineTo(m.radius * 0.4 + 22, -m.radius * 0.6 - 12);
          ctx.lineTo(m.radius * 0.4 + 22, -m.radius * 0.6 + 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      } else if (m.type === 'black_sperm') {
        // OPM Swarmer: Black Sperm Cell (chibi pitch-black humanoid with yellow antenna)
        ctx.save();
        const squish = 1 + Math.sin(m.animTime * 12) * 0.08;
        ctx.scale(squish, 2 - squish);

        // Pitch black rubbery body
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Wobbly single golden antenna with round bulb
        const antWave = Math.sin(m.animTime * 14) * 4;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -m.radius * 0.8);
        ctx.quadraticCurveTo(antWave, -m.radius * 1.5, antWave * 1.5, -m.radius * 1.8);
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(antWave * 1.5, -m.radius * 1.8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Chibi white oval eyes and blank smile
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-4, -2, 2.5, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 2.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-4, -2, 1.2, 0, Math.PI * 2);
        ctx.arc(4, -2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Subtle blank grin
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 3, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.restore();
      } else if (m.type === 'manako_stalker') {
        // OPM Disruptor: Manako Subterranean Stalker (One-eyed gremlin with flashlight beam)
        ctx.save();
        ctx.rotate(m.angle);

        // Forward Flashlight Vision Cone
        const beamGrad = ctx.createRadialGradient(0, 0, 10, 140, 0, 160);
        beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
        beamGrad.addColorStop(0.6, 'rgba(250, 204, 21, 0.15)');
        beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(160, -55);
        ctx.lineTo(160, 55);
        ctx.closePath();
        ctx.fill();

        // Chubby gremlin body
        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Floppy cute ears
        ctx.fillStyle = '#71717a';
        ctx.beginPath();
        ctx.ellipse(-m.radius * 0.3, -m.radius * 0.9, 4, 8, -0.4, 0, Math.PI * 2);
        ctx.ellipse(-m.radius * 0.3, m.radius * 0.9, 4, 8, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Giant gleaming cyclops eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.radius * 0.35, 0, m.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(m.radius * 0.4, 0, m.radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(m.radius * 0.42, 0, m.radius * 0.14, 0, Math.PI * 2);
        ctx.fill();
        // Eye specular shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.radius * 0.35, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (m.type === 'homeless_cultist') {
        // OPM Ranged: Homeless Emperor Cultist (Tattered robed caster with floating light orbs)
        ctx.save();
        // Tattered beggar robe
        ctx.fillStyle = '#365314';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ragged gray beard & cowl
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.6, 2);
        ctx.lineTo(0, m.radius * 1.1);
        ctx.lineTo(m.radius * 0.6, 2);
        ctx.closePath();
        ctx.fill();

        // 4 Orbiting Divine Light Spheres
        for (let orb = 0; orb < 4; orb++) {
          const orbAng = m.animTime * 3.5 + (orb / 4) * Math.PI * 2;
          const orbDist = m.radius + 14;
          const ox = Math.cos(orbAng) * orbDist;
          const oy = Math.sin(orbAng) * orbDist;
          const orbColors = ['#fde047', '#38bdf8', '#ec4899', '#4ade80'];
          ctx.fillStyle = orbColors[orb];
          ctx.shadowColor = orbColors[orb];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      } else if (m.type === 'fuhrer_ugly') {
        // OPM Brute: Fuhrer Ugly (Grotesque muscular mutant with jagged face)
        if (m.windupTimer > 0) {
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Sickly olive-green lumpy muscular body
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Bulging shoulder tumors / muscles
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.arc(-m.radius * 0.8, -m.radius * 0.5, 10, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.8, -m.radius * 0.5, 10, 0, Math.PI * 2);
        ctx.fill();

        // Asymmetric bloodshot bulging eyes
        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.arc(-7, -4, 5, 0, Math.PI * 2);
        ctx.arc(8, -6, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(-7, -4, 2.2, 0, Math.PI * 2);
        ctx.arc(8, -6, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Horrific jagged toothy mouth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-12, 6, 24, 7);
        ctx.fillStyle = '#fef08a';
        for (let t = -10; t <= 8; t += 4) {
          ctx.fillRect(t, 6, 2, 6);
        }
      } else if (m.type === 'rhino_wrestler') {
        // OPM Charger: Rhino Wrestler (Armored rhinoceros with deflection horn)
        ctx.save();
        ctx.rotate(m.angle);

        // Heavy gray hide
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Red wrestling singlet straps
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.6, -m.radius * 0.7);
        ctx.lineTo(m.radius * 0.4, 0);
        ctx.moveTo(-m.radius * 0.6, m.radius * 0.7);
        ctx.lineTo(m.radius * 0.4, 0);
        ctx.stroke();

        // Colossal front silver horn
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.6, -8);
        ctx.lineTo(m.radius * 1.55, 0);
        ctx.lineTo(m.radius * 0.6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shimmering deflection glint
        if (m.isFrontShielded) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(m.radius * 0.8, 0, 16, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.stroke();
        }
        ctx.restore();
      } else if (m.type === 'carnage_kabuto') {
        // OPM Boss: Carnage Kabuto (The Artificial Monster - Phase 1 Genius / Phase 2 Carnage Mode)
        const isPhase2 = m.phase === 2;
        const pulse = Math.sin(m.animTime * (isPhase2 ? 10 : 5)) * (isPhase2 ? 8 : 4);

        if (m.isDying) {
          // Death Animation: Insectoid Carapace Shatter & Bio-Ichor Dissolution
          const deathProg = Math.max(0, 1 - (m.deathTimer / m.deathDuration));
          ctx.translate((Math.random() - 0.5) * 8 * deathProg, (Math.random() - 0.5) * 8 * deathProg);

          // Green & Purple Ichor splatter burst
          for (let sp = 0; sp < 10; sp++) {
            const spAng = (sp / 10) * Math.PI * 2 + m.animTime * 6;
            const spDist = (m.radius + deathProg * 50) * (0.6 + (sp % 3) * 0.2);
            ctx.fillStyle = sp % 2 === 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
            ctx.beginPath();
            ctx.arc(Math.cos(spAng) * spDist, Math.sin(spAng) * spDist, 8 * (1 - deathProg * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Bio-energy Aura: Purple in Phase 1, Blood Red & Radioactive Green in Phase 2
        const auraColor = isPhase2 ? 'rgba(220, 38, 38, 0.45)' : 'rgba(147, 51, 234, 0.25)';
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius + (isPhase2 ? 26 : 14) + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Telegraph Attack Ring
        if (m.windupTimer > 0 && !m.isDying) {
          ctx.strokeStyle = isPhase2 ? '#dc2626' : '#facc15';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius * (isPhase2 ? 3.4 : 2.5), 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.save();
        ctx.rotate(m.angle);

        // 4 Spiked Insectoid Beetle Legs
        ctx.strokeStyle = isPhase2 ? '#7f1d1d' : '#3b0764';
        ctx.lineWidth = 4;
        const legOffsets = [-0.6, -0.2, 0.2, 0.6];
        for (const lo of legOffsets) {
          const lY = lo * m.radius;
          const legWiggle = Math.sin(m.animTime * (isPhase2 ? 18 : 8) + lo) * 5;
          ctx.beginPath();
          ctx.moveTo(-m.radius * 0.3, lY);
          ctx.lineTo(-m.radius * 1.35, lY - 10 + legWiggle);
          ctx.moveTo(m.radius * 0.3, lY);
          ctx.lineTo(m.radius * 1.35, lY + 10 - legWiggle);
          ctx.stroke();
        }

        // Heavy Carapace Torso: Dark Purple in Phase 1, Crimson & Neon-Green Tiger Stripes in Phase 2!
        ctx.fillStyle = isPhase2 ? '#991b1b' : '#2e1065';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPhase2 ? '#22c55e' : '#a855f7';
        ctx.lineWidth = isPhase2 ? 4.5 : 3.5;
        ctx.stroke();

        // Phase 2 Carnage Mode Bio-Hazard Green Stripes
        if (isPhase2) {
          ctx.fillStyle = '#22c55e';
          for (let s = -m.radius * 0.6; s <= m.radius * 0.6; s += 16) {
            ctx.beginPath();
            ctx.moveTo(s, -m.radius * 0.7);
            ctx.lineTo(s + 8, 0);
            ctx.lineTo(s, m.radius * 0.7);
            ctx.lineTo(s - 5, 0);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Colossal Rhinoceros Beetle Trident Horn
        ctx.fillStyle = isPhase2 ? '#7f1d1d' : '#1e1b4b';
        ctx.strokeStyle = isPhase2 ? '#ef4444' : '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.4, -14);
        ctx.lineTo(m.radius * 1.85, 0); // Main central spear horn
        ctx.lineTo(m.radius * 0.4, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Twin lateral trident sub-horns
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.9, -6);
        ctx.lineTo(m.radius * 1.5, -20);
        ctx.moveTo(m.radius * 0.9, 6);
        ctx.lineTo(m.radius * 1.5, 20);
        ctx.stroke();

        // Blazing Compound Faceted Eyes
        const eyeColor = isPhase2 ? '#ff003c' : '#facc15';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = isPhase2 ? 20 : 10;
        ctx.beginPath();
        ctx.arc(m.radius * 0.5, -10, 6, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.5, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        // Generic / Fallback Monster
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Health Bar above monster (hidden during death animation)
      if (!m.isDying) {
        const barW = Math.max(28, m.radius * 1.4);
        const barH = 4;
        const barY = -m.radius - 10;
        const hpPct = Math.max(0, m.hp / m.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-barW / 2, barY, barW, barH);

        ctx.fillStyle = hpPct > 0.3 ? '#ef4444' : '#dc2626';
        ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

        // Protective Ward Shield Bar Overlay (Absorbs incoming damage before HP)
        if (m.wardHp && m.wardHp > 0) {
          const wardPct = Math.min(1.0, m.wardHp / 40);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-barW / 2, barY - 3, barW * wardPct, 2.5);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-barW / 2, barY - 3, barW * wardPct, 2.5);
        }
      }

      ctx.restore();
    }
  }

  /**
   * Draws Room Discovery Banner notification in screen coordinates
   */
  drawRoomBanner(dungeon, screenWidth, screenHeight) {
    if (!dungeon || !dungeon.activeBanner) return;
    const b = dungeon.activeBanner;
    if (b.timer <= 0) return;

    const ctx = this.ctx;
    const alpha = Math.min(1.0, b.timer / 0.5, (b.maxTimer - b.timer) / 0.5 + 0.2);

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const bannerW = 440;
    const bannerH = 40;
    const x = screenWidth / 2 - bannerW / 2;
    const y = 86; // Clean vertical tier below floor badge & boss bar

    // Dark backdrop (Clean, crisp, no glow)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = b.color || '#64748b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, bannerW, bannerH);
    ctx.strokeRect(x, y, bannerW, bannerH);

    // Title
    ctx.font = '800 14px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`⚔ ${b.title} ⚔`, screenWidth / 2, y + 18);

    // Subtitle
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = b.color || '#94a3b8';
    ctx.fillText(b.subtitle || 'ANIME DUNGEON DEPTHS', screenWidth / 2, y + 32);

    ctx.restore();
  }

  /**
   * Draws Full-Screen Top Boss Health Bar
   */
  drawBossHUD(boss, screenWidth, currentRoom = null) {
    if (!boss || boss.isDead) return;
    if (currentRoom && currentRoom.type !== 'boss') return;
    const ctx = this.ctx;
    ctx.save();

    const barW = Math.min(500, screenWidth - 40);
    const barH = 14;
    const x = screenWidth / 2 - barW / 2;
    const y = 50; // Sits neatly below the floor badge at top: 16px
    const hpPct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

    const isPhase2 = boss.phase === 2;
    const isDying = boss.isDying;

    // Outer dark frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(x - 6, y - 18, barW + 12, barH + 26);

    // Frame border: pulses crimson/amber in Phase 2
    if (isPhase2) {
      ctx.strokeStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
    }
    ctx.strokeRect(x - 6, y - 18, barW + 12, barH + 26);

    // Boss Name & Phase Badge Header
    ctx.font = '800 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    if (isDying) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`💀 ${boss.name.toUpperCase()} — TERMINATING... 💀`, screenWidth / 2, y - 4);
    } else if (isPhase2) {
      ctx.fillStyle = '#f87171';
      ctx.fillText(`💀 ${boss.name.toUpperCase()} ⚡ [PHASE 2: ENRAGED] 💀`, screenWidth / 2, y - 4);
    } else {
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`💀 ${boss.name.toUpperCase()} 💀`, screenWidth / 2, y - 4);
    }

    // Health Bar Background
    ctx.fillStyle = 'rgba(20, 15, 30, 0.95)';
    ctx.fillRect(x, y, barW, barH);

    // Health Bar Fill with gradient
    if (isPhase2) {
      const grad = ctx.createLinearGradient(x, y, x + barW * hpPct, y);
      grad.addColorStop(0, '#b91c1c');
      grad.addColorStop(0.6, '#ef4444');
      grad.addColorStop(1, '#f97316');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#dc2626';
    }
    ctx.fillRect(x, y, barW * hpPct, barH);

    // HP Text
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    const hpLabel = isDying ? '0 / ' + boss.maxHp + ' HP (0%)' : `${Math.round(boss.hp)} / ${boss.maxHp} HP (${Math.round(hpPct * 100)}%)`;
    ctx.fillText(hpLabel, screenWidth / 2, y + 11);

    ctx.restore();
  }
}

