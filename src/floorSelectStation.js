/**
 * In-World Floor Selection Gateway Entity for Dungeon Slop
 * An interactive dimensional rune obelisk / teleporter pedestal in the lobby (240, -120)
 * where players can walk up, press [E] or [F], and instantly select any dungeon floor or test level.
 */

export class FloorSelectStation {
  constructor(x = 240, y = -120) {
    this.x = x;
    this.y = y;
    this.radius = 32;
    this.interactionRadius = 65;
    this.pulseTime = 0;
  }

  isPlayerNearby(player) {
    if (!player) return false;
    return Math.hypot(player.x - this.x, player.y - this.y) <= this.interactionRadius;
  }

  update(dt) {
    this.pulseTime += dt * 3.0;
  }

  draw(ctx, player) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isNear = this.isPlayerNearby(player);
    const time = this.pulseTime;

    // Drop shadow
    ctx.beginPath();
    ctx.ellipse(0, 22, 28, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();

    // Dimensional Teleporter Base Pedestal (Hexagonal Stone Base)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rx = Math.cos(angle) * 32;
      const ry = Math.sin(angle) * 20 + 8;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Concentric Runic Rings (Animated rotation)
    ctx.save();
    ctx.rotate(time * 0.4);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.strokeStyle = isNear ? '#38bdf8' : 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.rotate(-time * 0.6);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.strokeStyle = isNear ? '#00ff88' : 'rgba(168, 85, 247, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Central Floating Gateway Core / Shard
    const floatY = Math.sin(time * 1.5) * 5 - 12;
    ctx.save();
    ctx.translate(0, floatY);

    // Glowing Crystal Shard
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(-12, 0);
    ctx.closePath();

    const shardGrad = ctx.createLinearGradient(0, -20, 0, 20);
    shardGrad.addColorStop(0, '#38bdf8');
    shardGrad.addColorStop(0.5, '#818cf8');
    shardGrad.addColorStop(1, '#c084fc');
    ctx.fillStyle = shardGrad;
    ctx.fill();

    ctx.strokeStyle = isNear ? '#ffffff' : '#a5b4fc';
    ctx.lineWidth = isNear ? 2 : 1.2;
    if (isNear) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner Core Pulse
    ctx.beginPath();
    ctx.arc(0, 0, 4 + Math.sin(time * 2.5) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    ctx.restore();

    // Floating Overhead Prompt / Sign
    ctx.save();
    ctx.translate(this.x, this.y - 54);

    if (isNear) {
      const bounce = Math.sin(time * 2) * 3;
      ctx.translate(0, bounce);

      ctx.font = '800 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText('[E] / [F] SELECT FLOOR', 0, 0);

      ctx.font = '600 10px "Outfit", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Choose Dungeon Floor / Level', 0, 14);
    } else {
      ctx.font = '700 11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a5b4fc';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('FLOOR GATEWAY', 0, 0);
    }

    ctx.restore();
  }
}
