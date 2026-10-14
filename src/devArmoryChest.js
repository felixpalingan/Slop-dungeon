/**
 * In-World Dev Armory Chest for Dungeon Slop Base Camp
 * Ornate golden treasure chest stationed in the southwest lobby corner.
 * Pressing [E] opens the Dev Sandbox Armory Modal allowing instant equipping of any anime set or item.
 */

export class DevArmoryChest {
  constructor(x = -240, y = 160) {
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.interactionRadius = 85;
    this.pulseTime = 0;
  }

  isNear(player) {
    if (!player) return false;
    return Math.hypot(player.x - this.x, player.y - this.y) <= this.interactionRadius;
  }

  isPlayerNearby(player) {
    return this.isNear(player);
  }

  update(dt) {
    this.pulseTime += dt * 3.5;
  }

  draw(ctx, player) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isNear = this.isNear(player);

    // 0. High-Visibility Golden Beacon Beam (Visible from anywhere in lobby)
    const beamPulse = 0.25 + Math.sin(this.pulseTime * 1.5) * 0.1;
    const beamGrad = ctx.createLinearGradient(0, -90, 0, 10);
    beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
    beamGrad.addColorStop(0.5, `rgba(250, 204, 21, ${beamPulse})`);
    beamGrad.addColorStop(1, `rgba(250, 204, 21, ${beamPulse * 1.8})`);
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-16, -90, 32, 100);

    // 1. Drop shadow
    ctx.beginPath();
    ctx.ellipse(0, 16, 28, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();

    // 2. Chest Lower Body
    const chestW = 44;
    const chestH = 22;
    const chestX = -chestW / 2;
    const chestY = -6;

    // Rich mahogany / hardened wood base
    ctx.fillStyle = '#451a03';
    ctx.fillRect(chestX, chestY, chestW, chestH);

    // Polished gold metal trim border
    ctx.strokeStyle = isNear ? '#fde047' : '#d97706';
    ctx.lineWidth = 2.5;
    if (isNear) {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
    }
    ctx.strokeRect(chestX, chestY, chestW, chestH);
    ctx.shadowBlur = 0;

    // Vertical gold reinforcement bands
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(chestX + 8, chestY, 5, chestH);
    ctx.fillRect(chestX + chestW - 13, chestY, 5, chestH);

    // 3. Curved Chest Lid
    ctx.beginPath();
    ctx.ellipse(0, chestY, chestW / 2, 10, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.strokeStyle = isNear ? '#fde047' : '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold lid rib bands
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(chestX + 8, chestY - 9, 5, 10);
    ctx.fillRect(chestX + chestW - 13, chestY - 9, 5, 10);

    // 4. Heavy Brass Padlock & Runic Keyhole
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-6, chestY - 1, 12, 11);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-6, chestY - 1, 12, 11);

    // Glowing Cyan Runic Gem in center of lock
    const gemPulse = 0.7 + Math.sin(this.pulseTime * 2) * 0.3;
    ctx.fillStyle = `rgba(6, 182, 212, ${gemPulse})`;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, chestY + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shimmering Golden Sparkles floating up from chest
    for (let s = 0; s < 3; s++) {
      const sOffset = (this.pulseTime * 18 + s * 45) % 36;
      const sx = Math.sin(this.pulseTime + s * 2) * 16;
      const sy = chestY - sOffset;
      const sAlpha = Math.max(0, 1 - (sOffset / 36));
      ctx.fillStyle = `rgba(253, 224, 71, ${sAlpha})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.restore();

    // 5. Overhead Floating Prompt
    ctx.save();
    ctx.translate(this.x, this.y - 42);

    if (isNear) {
      const bounce = Math.sin(this.pulseTime) * 3;
      ctx.translate(0, bounce);

      // Prompt Container Badge
      const promptW = 190;
      const promptH = 34;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fillRect(-promptW / 2, -promptH / 2, promptW, promptH);
      ctx.strokeRect(-promptW / 2, -promptH / 2, promptW, promptH);
      ctx.shadowBlur = 0;

      // Primary Action Text
      ctx.font = '800 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.fillText('[E] OPEN DEV ARMORY', 0, -3);

      // Subtitle
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('⚡ SANDBOX GEAR SELECTOR', 0, 10);
    } else {
      // Idle Label
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('DEV ARMORY CHEST', 0, 0);
    }

    ctx.restore();
  }
}
