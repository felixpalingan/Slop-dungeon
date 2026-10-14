/**
 * In-World Wheel of Slop Altar for Slop Dungeon
 * A physical casino/gacha prop placed in the Merchant Sanctum.
 * Features multiplayer live viewing: the entire party can watch spins in real-time
 * with physical wheel deceleration, ticking pegs, spring flapper needle, and celebratory VFX.
 * Enforces turn-based sequential spinning ("gantian").
 */

export class WheelAltar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 42;
    this.interactionRange = 90;

    // Physical wheel state
    this.currentAngle = 0;
    this.startAngle = 0;
    this.targetAngle = 0;
    this.isSpinning = false;
    this.spinTimer = 0;
    this.spinDuration = 4.5; // seconds
    this.lastTickAngle = 0;

    // Pointer flapper animation (spring physics)
    this.flapperAngle = 0;
    this.flapperTarget = 0;

    // Turn-based lock ("Gantian")
    this.activeSpinnerId = null;
    this.activeSpinnerName = null;
    this.wagerItem = null;
    this.result = null; // 'shattered', 'upgrade', 'jackpot'
    this.onFinishCallback = null;

    // Visual pulse
    this.hoverTime = 0;
  }

  isNear(player) {
    if (!player) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) <= (this.interactionRange * this.interactionRange);
  }

  /**
   * Starts a physical spin. Called locally by the active spinner and remotely by all peers.
   */
  startSpin(spinnerId, spinnerName, wagerItem, targetAngle, duration = 4.5, result = 'shattered', onFinish = null) {
    this.isSpinning = true;
    this.activeSpinnerId = spinnerId;
    this.activeSpinnerName = spinnerName;
    this.wagerItem = wagerItem;
    this.result = result;
    this.onFinishCallback = onFinish;

    this.spinDuration = duration;
    this.spinTimer = 0;
    this.startAngle = this.currentAngle;
    this.targetAngle = targetAngle;
    this.lastTickAngle = this.currentAngle;
  }

  update(dt, audio = null, cinematics = null, particles = null) {
    this.hoverTime += dt;

    // Flapper spring physics
    this.flapperAngle += (this.flapperTarget - this.flapperAngle) * Math.min(1, dt * 25);
    this.flapperTarget *= Math.max(0, 1 - dt * 15);

    if (!this.isSpinning) return;

    this.spinTimer += dt;
    const progress = Math.min(1.0, this.spinTimer / this.spinDuration);

    // Quintic ease-out for dramatic suspenseful deceleration
    const ease = 1 - Math.pow(1 - progress, 5);
    this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * ease;

    // Peg ticking sound & flapper deflection
    const pegStep = (Math.PI * 2) / 10; // 10 pegs around the perimeter
    const diff = Math.abs(this.currentAngle - this.lastTickAngle);
    if (diff >= pegStep) {
      this.lastTickAngle = this.currentAngle;
      // High pitch when fast, lower when slowing down
      const speedPct = 1 - progress;
      if (audio && audio.playWheelTick) {
        audio.playWheelTick(0.8 + speedPct * 0.7);
      }
      this.flapperTarget = (speedPct > 0.3 ? 0.35 : 0.2); // needle deflects backwards
    }

    // Spin Complete!
    if (progress >= 1.0) {
      this.isSpinning = false;
      this.currentAngle = this.targetAngle;

      // Outcome VFX & SFX
      if (this.result === 'jackpot') {
        if (cinematics) cinematics.addScreenShake(18);
        if (particles) {
          particles.spawnComicText(this.x, this.y - 75, '🎰 JACKPOT! MYTHIC! 👑', '#fbbf24');
          for (let i = 0; i < 24; i++) {
            particles.spawnDashBurst(this.x, this.y, (i / 24) * Math.PI * 2, '#fbbf24');
          }
        }
        if (audio && audio.playCasinoWin) audio.playCasinoWin(true);
      } else if (this.result === 'upgrade') {
        if (cinematics) cinematics.addScreenShake(7);
        if (particles) {
          particles.spawnComicText(this.x, this.y - 75, '⬆️ UPGRADED! ✨', '#00f0ff');
          particles.spawnDashBurst(this.x, this.y, 0, '#00f0ff');
        }
        if (audio && audio.playCasinoWin) audio.playCasinoWin(false);
      } else {
        // Shattered
        if (cinematics) cinematics.addScreenShake(10);
        if (particles) {
          particles.spawnComicText(this.x, this.y - 75, '💥 SHATTERED! 💀', '#ef4444');
          particles.spawnDashBurst(this.x, this.y, 0, '#64748b');
        }
        if (audio && audio.playCasinoBust) audio.playCasinoBust();
      }

      // Execute callback
      if (typeof this.onFinishCallback === 'function') {
        this.onFinishCallback(this.result);
      }

      // Unlock after brief delay
      setTimeout(() => {
        this.activeSpinnerId = null;
        this.activeSpinnerName = null;
        this.wagerItem = null;
        this.result = null;
        this.onFinishCallback = null;
      }, 1500);
    }
  }

  draw(ctx, isNearPlayer, time = 0) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bob = Math.sin(time * 2.5) * 3;

    // 1. Altar Stone Pedestal with Gold Runes
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 32, 54, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Octagonal Stone Base
    ctx.fillStyle = '#1e1b2e';
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const rx = Math.cos(a) * 48;
      const ry = Math.sin(a) * 26 + 18;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Carved Rune Circles
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 18, 38, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Heavy Brass Wheel Stand Struts (A-Frame)
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    // Left strut
    ctx.beginPath();
    ctx.moveTo(-28, 18);
    ctx.lineTo(-6, -14);
    ctx.lineTo(0, -14);
    ctx.lineTo(-22, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right strut
    ctx.beginPath();
    ctx.moveTo(28, 18);
    ctx.lineTo(6, -14);
    ctx.lineTo(0, -14);
    ctx.lineTo(22, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. The Rotating Wheel Disc
    ctx.save();
    ctx.translate(0, -22 + bob);

    // Outer Drop Shadow for the Wheel Disc
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 6, 44, 0, Math.PI * 2);
    ctx.fill();

    // Wheel Rotation
    ctx.rotate(this.currentAngle);

    const wheelRadius = 42;
    const numSectors = 10;
    // 5 Shattered (50%), 4 Upgrade (40%), 1 Jackpot (10%)
    // Sector distribution pattern: Shatter, Upgrade, Shatter, Upgrade, Shatter, Upgrade, Shatter, Upgrade, Shatter, Jackpot
    const sectorTypes = [
      'shatter', 'upgrade', 'shatter', 'upgrade', 'shatter',
      'upgrade', 'shatter', 'upgrade', 'shatter', 'jackpot'
    ];

    const sectorAngle = (Math.PI * 2) / numSectors;

    for (let i = 0; i < numSectors; i++) {
      const startA = i * sectorAngle;
      const endA = startA + sectorAngle;
      const type = sectorTypes[i];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, wheelRadius, startA, endA);
      ctx.closePath();

      if (type === 'jackpot') {
        // Radiant Gold with Magenta Accents
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, wheelRadius);
        grad.addColorStop(0, '#fde047');
        grad.addColorStop(1, '#ff2a5f');
        ctx.fillStyle = grad;
      } else if (type === 'upgrade') {
        // Neon Cyan / Electric Blue
        ctx.fillStyle = (i % 2 === 0) ? '#0284c7' : '#0ea5e9';
      } else {
        // Ash Charcoal / Shattered
        ctx.fillStyle = (i % 2 === 0) ? '#1e293b' : '#334155';
      }
      ctx.fill();

      // Sector Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startA) * wheelRadius, Math.sin(startA) * wheelRadius);
      ctx.stroke();

      // Sector Icon / Glyph
      ctx.save();
      const midA = startA + sectorAngle / 2;
      ctx.rotate(midA);
      ctx.translate(wheelRadius * 0.65, 0);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (type === 'jackpot') {
        ctx.font = '800 11px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('★', 0, 0);
      } else if (type === 'upgrade') {
        ctx.font = '800 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('▲', 0, 0);
      } else {
        ctx.font = '700 8px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('✕', 0, 0);
      }
      ctx.restore();
    }

    // Outer Brass Rim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Perimeter Brass Pegs (10 pegs between sectors)
    for (let i = 0; i < numSectors; i++) {
      const a = i * sectorAngle;
      const px = Math.cos(a) * (wheelRadius - 2);
      const py = Math.sin(a) * (wheelRadius - 2);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Center Hub Cap & Glowing Ruby
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Restore wheel rotation

    // 3. Brass Flapper Indicator Needle (Fixed at top pointing down)
    ctx.save();
    ctx.translate(0, -22 + bob - wheelRadius + 2);
    ctx.rotate(this.flapperAngle);

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 12);     // needle tip
    ctx.lineTo(-4, -6);
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Needle pivot bolt
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Overhead State & Interactive Prompts
    ctx.save();
    const promptY = -76 + bob;

    if (this.isSpinning) {
      // Spinning in progress banner
      const bannerText = `SPINNING: ${this.activeSpinnerName || 'Crawler'}... 🎲`;
      ctx.font = '800 11px "Outfit", sans-serif';
      const m = ctx.measureText(bannerText);
      const bw = m.width + 24;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, promptY - 11, bw, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(bannerText, 0, promptY + 4);
    } else if (this.activeSpinnerId) {
      // Just finished or in results
      const bannerText = `RESULT: ${this.result?.toUpperCase()}!`;
      ctx.font = '800 11px "Outfit", sans-serif';
      const m = ctx.measureText(bannerText);
      const bw = m.width + 24;

      const col = this.result === 'jackpot' ? '#fbbf24' : (this.result === 'upgrade' ? '#38bdf8' : '#ef4444');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, promptY - 11, bw, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(bannerText, 0, promptY + 4);
    } else if (isNearPlayer) {
      // Available to spin!
      ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-95, promptY - 12, 190, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 11px "Outfit", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText('[E] SPIN WHEEL OF SLOP 🎲', 0, promptY + 4);
    }
    ctx.restore();

    ctx.restore();
  }
}
