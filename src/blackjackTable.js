/**
 * In-World Blackjack Table Prop for Slop Dungeon
 * A physical casino table placed in the Slop Merchant Sanctum.
 * Features a semicircular mahogany wood rail, emerald green felt,
 * card shoe, chip stacks, and multiplayer presence.
 */

export class BlackjackTable {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 48;
    this.interactionRange = 95;

    // Presence state
    this.activePlayerId = null;
    this.activePlayerName = null;
    this.lastQuip = null;
    this.quipTimer = 0;
  }

  isNear(player) {
    if (!player) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) <= (this.interactionRange * this.interactionRange);
  }

  setOccupant(playerId, playerName) {
    this.activePlayerId = playerId;
    this.activePlayerName = playerName;
  }

  clearOccupant() {
    this.activePlayerId = null;
    this.activePlayerName = null;
  }

  update(dt) {
    if (this.quipTimer > 0) {
      this.quipTimer -= dt;
      if (this.quipTimer <= 0) this.lastQuip = null;
    }
  }

  draw(ctx, isNearPlayer, time = 0) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const breathe = Math.sin(time * 2) * 1.5;

    // 1. Table Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 68, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Mahogany Table Rim & Armrest (Semicircular)
    // Semicircle arc curving towards bottom (+Y), flat on top (-Y, facing merchant dealer)
    ctx.save();
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#270e02';
    ctx.lineWidth = 3;

    ctx.beginPath();
    // Flat top edge (dealer side)
    ctx.moveTo(-60, -18);
    ctx.lineTo(60, -18);
    // Rounded bottom curve (player side)
    ctx.bezierCurveTo(65, 42, -65, 42, -60, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Emerald Green Casino Felt
    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = '#f59e0b'; // Gold border line on felt
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-52, -14);
    ctx.lineTo(52, -14);
    ctx.bezierCurveTo(56, 36, -56, 36, -52, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Gold Betting Arc & Text
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -12, 34, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Printed Arch Text: "BLACKJACK PAYS 3:2"
    ctx.font = '700 6px monospace';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('BLACKJACK PAYS 3 TO 2', 0, 10);

    // 3 Player Betting Circles on Felt
    const betSpots = [-28, 0, 28];
    betSpots.forEach((bx, idx) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, 18, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      // Mini chip inside central bet spot
      if (idx === 1) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx, 18, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Dealer Props: Card Shoe, Deck, & Chip Trays (Top edge)
    // Wooden card dealing shoe
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-48, -24, 18, 10);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-48, -24, 18, 10);

    // Red back card in shoe
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-46, -23, 14, 8);

    // Chip Tray Rack (Center top)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-18, -25, 36, 9);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(-18, -25, 36, 9);

    // Stacks of Chips in Rack
    const chipCols = ['#f8fafc', '#ef4444', '#3b82f6', '#fbbf24'];
    chipCols.forEach((col, idx) => {
      const cx = -14 + idx * 8;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, -20.5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Brass Cup Holders on Outer Rail
    const cupHolders = [-54, 54];
    cupHolders.forEach(hx => {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(hx, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(hx, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 5. Overhead Prompt & State
    ctx.save();
    const promptY = -48 + breathe;

    if (this.activePlayerId) {
      // Active player badge
      const activeText = `${this.activePlayerName || 'Someone'} PLAYING BLACKJACK ♠️`;
      ctx.font = '800 11px "Outfit", sans-serif';
      const m = ctx.measureText(activeText);
      const bw = m.width + 24;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, promptY - 11, bw, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(activeText, 0, promptY + 4);
    } else if (isNearPlayer) {
      // Available to play!
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-100, promptY - 12, 200, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 11px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[E] PLAY BLACKJACK (BET SLOPS) ♠️', 0, promptY + 4);
    }
    ctx.restore();

    ctx.restore();
  }
}
