/**
 * The Slop Merchant NPC for Slop Dungeon
 * Sells survival supplies, buys unwanted gear, hosts the Trade-Up Forge & Wheel of Slop,
 * and features a Spelunky-style single-target RPG retaliation mechanic with AoE splash!
 */

export class SlopMerchant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.name = 'The Slop Merchant';
    this.interactionRange = 95;

    // Speech bubble state
    this.dialogue = 'Welcome to the Slop Emporium! Got Slops? 💰';
    this.dialogueTimer = 4.0;
    this.dialogueColor = '#fbbf24';

    // Retaliation & combat state
    this.retaliationCooldown = 0;
    this.quipTimer = 6.0;
    this.isAimingRPG = false;
    this.rpgWindupTimer = 0;
    this.rpgWindupDuration = 1.8; // 1.8 seconds delay so player sees him draw and aim RPG!
    this.targetCulprit = null;
    this.aimAngle = 0;

    this.lastQuip = null;

    // 1. Idle Dungeon Banter (20+ lines)
    this.idleQuips = [
      'Welcome to the Slop Emporium! Got Slops? 💰',
      'Got unwanted gear? Sell it to me for cold hard Slops! 🪙',
      'Three of a kind? Melt them at my Trade-Up Forge! ⚒️',
      'Feeling lucky? Check the Wheel of Slop or hit the Blackjack table! 🎲♠️',
      'Don’t touch what you can’t afford, crawler! 👀',
      'No refunds once the Boss cleaves you! Hehehe. 💀',
      'I smell Slops... sweet, greasy Slops! 💰',
      'Keep your weapons sheathed! My RPG has a very sensitive trigger! 🚀',
      'Discount? The only discount is leaving with your limbs attached! 😈',
      'Need potions? Don’t be stingy, dead crawlers carry no coin! 🧪',
      'Card counting at the Blackjack table will get you a missile to the face! ♠️💥',
      'Heard someone pulled a Secret Mythic on the wheel... wasn’t you, was it? 🎡',
      'The deeper you go, the more you’ll wish you bought more supplies! 🕯️',
      'Step right up, heroes and cannon fodder alike! 🎪',
      'Gold shines, but Slops keep the crypt warm! 🪙✨',
      'You look like you’re one hit away from meeting your ancestors. Buy a flask! 🍷',
      'Business is booming! Mostly because crawlers keep dying and leaving their loot! ⚰️',
      'I don’t ask where you got that gear, and you don’t ask where I got this RPG. Deal? 🤝',
      'Gambling is 99% luck and 1% praying to RNGesus! 🎲',
      'Hands off the wares unless your party vault is loaded! 🪙',
      'Hurry up and buy! These crypt drafts are bad for my joints! 💀',
      'The house always wins, crawler... but you’re welcome to try! ♠️',
      'Fresh dungeon deliveries arriving daily! Minus the bloodstains! 📦'
    ];

    // 2. Greeting Lines (when opening shop)
    this.greetingQuips = [
      'Welcome to the Slop Emporium! Best prices in the crypts! 💰',
      'Ah, valued customers! Or soon-to-be corpses. Either way, welcome! 😈',
      'Looking to gear up before the boss butcher arrives? Take a look! 🛡️',
      'Fresh stock! Straight out of the catacombs! 📦',
      'Got Slops in that shared party vault? Let’s make a deal! 🪙',
      'Browse all you like, but break it and my RPG breaks YOU! 🚀',
      'Looking for survival gear? Looking at your HP, you definitely need it! 🍷',
      'Spend your Slops wisely, crawler! No layaway in hell! 💸',
      'Welcome! What can the premier dungeon merchant get for you today? ✨',
      'Step up, step up! Everything is for sale for the right price! 🪙'
    ];

    // 3. Shop Reroll / Refresh Lines
    this.refreshQuips = [
      'Fresh shipment straight from the abyss! Take a look! 📦✨',
      'Rerolled! New toys for dangerous crawlers! 🔄',
      'Shuffling the inventory! Hope you find what you need! 🛍️',
      'Out with the old, in with the shiny! 🔄✨',
      'New wares arrived! Don’t let your party spend all the Slops first! 💰',
      'Reroll complete! Feast your eyes on these beauties! 👀',
      'Restocked! Fresh out of the dungeon black market! 📦💀',
      'More gear unpacked! Good luck finding something that saves your skin! 🛡️'
    ];

    // 4. Buying Item Lines
    this.buyQuips = [
      'Pleasure doing business! Don’t drop it in a spike pit! 🛍️',
      'A fine choice! May it keep you breathing a bit longer! ✨',
      'Sold! Slops received, satisfaction guaranteed! 🪙',
      'Money well spent! Your survival odds just jumped 3%! 📈',
      'Pleasure! Come back when you need more supplies! 💰',
      'Treat it with care, crawler! Or don’t, you can always buy another! 💸',
      'A wise purchase! Don’t let the curses scratch it! 🛡️'
    ];

    // 5. Selling Item Lines
    this.sellQuips = [
      'I’ll take that scrap off your hands! Here’s your Slops! 🪙',
      'One crawler’s trash is my future profit! Hehehe! 💰',
      'Fair trade! Into the furnace it goes! 🔥',
      'Good deal! More funds for your party vault! 🤝',
      'Pleasure buying your junk! Keep ’em coming! 📦',
      'Scrapped and cashed out! Spend it before you drop dead! 💀💸',
      'Thanks for the salvage! Always happy to buy loot! 🪙'
    ];

    // 6. Attacked / Enraged Lines
    this.attackedQuips = [
      'YOU WANNA DIE?! LOOK AT MY ROCKET! 🚀💥',
      'BIG MISTAKE, CRAWLER! EAT HIGH EXPLOSIVE! 🚀',
      'SHOPLIFTERS AND THUGS WILL BE VAPORIZED! 🚀💥',
      'YOU DARE ATTACK THE MERCHANT?! DIE! 💣',
      'SAY HELLO TO MY LITTLE RPG! 🚀🔥',
      'I WAS A HIGH-TIER BOSS BEFORE THIS! EAT LEAD! 🚀💀'
    ];

    // 7. Wheel of Slop Lines
    this.wheelStartQuips = [
      'A daring wager by {name}! Let the wheel decide! 🎲',
      'Round and round it goes! Where it stops, nobody knows! 🎡',
      'Place your prayers to RNGesus, {name}! 🎲✨',
      'Oho! That’s a brave item to bet, {name}! 👀',
      'The wheel spins! May the odds be ever in your favor! 🎡',
      'High stakes, high drama! Let’s see what fate has in store! 🌟'
    ];

    this.wheelShatterQuips = [
      'HAHAHA! The wheel devoured it! Better luck next time! 😈',
      'CRUNCH! Turned to pure dust! My condolences, {name}! 💥💀',
      'Oof! The wheel was hungry today! 💀',
      'Gone! Reduced to atoms! Don’t cry, gamble more! 😈',
      'RNGesus gives, and RNGesus pulverizes! 💥'
    ];

    this.wheelUpgradeQuips = [
      'Oho! The gods smiled upon {name}! Shiny upgrade! ✨',
      'Nice pull! That’s a serious power spike! ⬆️',
      'Winner winner! Don’t let it go to your head, {name}! 💎',
      'Promoted to higher glory! The wheel was generous! 🌟',
      'Sweet upgrade! Now go cleave some curses with it! ⚔️'
    ];

    this.wheelJackpotQuips = [
      'WHAT?! A JACKPOT FOR {name}?! You cleaned me out, crawler! 😱',
      'IMPOSSIBLE! Secret Mythic?! The house is in shambles! 👑',
      'HOLY SLOP! JACKPOT! You’ve got the devil’s own luck, {name}! 🎰👑',
      'A MYTHIC DROP?! I didn’t even know that was in the wheel! 🏆✨'
    ];

    // 8. Blackjack Welcome Lines
    this.bjWelcomeQuips = [
      'Feeling lucky, {name}? Welcome to the high-stakes table! ♠️♥️',
      'Step up, {name}! Dealer hits on soft 16, stands on 17! 🃏',
      'Ready to gamble the party’s Slops, {name}? Don’t bust! 🪙',
      'Cards are shuffled, shoe is hot! Place your bets! ♣️♦️',
      'Welcome to the green felt, {name}! The house awaits! 🎩'
    ];

    // Shop stock & refresh cost
    this.refreshCost = 25;
    this.stock = [];
  }

  pickRandom(arr) {
    if (!arr || arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    let pick = arr[Math.floor(Math.random() * arr.length)];
    if (pick === this.lastQuip) {
      pick = arr[Math.floor(Math.random() * arr.length)];
    }
    this.lastQuip = pick;
    return pick;
  }

  sayRandomGreeting() {
    this.say(this.pickRandom(this.greetingQuips), '#fbbf24', 4.0);
  }

  sayRandomBuy(itemName) {
    this.say(this.pickRandom(this.buyQuips), '#4ade80', 3.5);
  }

  sayRandomSell() {
    this.say(this.pickRandom(this.sellQuips), '#38bdf8', 3.5);
  }

  sayRandomRefresh() {
    this.say(this.pickRandom(this.refreshQuips), '#38bdf8', 3.5);
  }

  sayRandomWheelStart(playerName = 'crawler') {
    const q = this.pickRandom(this.wheelStartQuips).replace(/{name}/g, playerName);
    this.say(q, '#fbbf24', 4.0);
  }

  sayRandomWheelResult(result, itemName, playerName = 'crawler') {
    if (result === 'shattered') {
      const q = this.pickRandom(this.wheelShatterQuips).replace(/{name}/g, playerName);
      this.say(q, '#ef4444', 4.0);
    } else if (result === 'upgrade') {
      const q = this.pickRandom(this.wheelUpgradeQuips).replace(/{name}/g, playerName);
      this.say(q, '#38bdf8', 4.0);
    } else if (result === 'jackpot') {
      const q = this.pickRandom(this.wheelJackpotQuips).replace(/{name}/g, playerName);
      this.say(q, '#fbbf24', 5.0);
    }
  }

  sayRandomBjWelcome(playerName = 'crawler') {
    const q = this.pickRandom(this.bjWelcomeQuips).replace(/{name}/g, playerName);
    this.say(q, '#10b981', 4.0);
  }

  /**
   * Generates or refreshes the shop stock based on current floor level
   */
  generateWares(floorNumber = 1, itemCatalog = {}) {
    const list = [
      { item: itemCatalog['health_flask'] || { id: 'health_flask', name: 'Health Flask', slot: 'consumable', rarity: 'COMMON', desc: 'Restores +45 HP instantly on use!' }, price: 25 },
      { item: itemCatalog['stamina_tonic'] || { id: 'stamina_tonic', name: 'Stamina Tonic', slot: 'consumable', rarity: 'COMMON', desc: 'Refills stamina & grants +20% move speed!' }, price: 20 }
    ];

    // Floor gear pools
    const poolFloor1 = ['crystal_blade', 'knight_shield', 'iron_visor', 'leather_tunic', 'travel_boots', 'cloth_pants'];
    const poolFloor2 = ['titan_greatsword', 'iron_tower_shield', 'horned_barbarian_helm', 'spiked_cuirass', 'winged_boots', 'arcane_tome'];
    const poolFloor3 = ['thunder_warhammer', 'arcane_tome', 'shadow_hood', 'guts_greaves', 'scout_trousers', 'david_sneakers'];

    let chosenPool = poolFloor1;
    if (floorNumber === 2) chosenPool = [...poolFloor1.slice(2), ...poolFloor2];
    else if (floorNumber >= 3) chosenPool = [...poolFloor2.slice(2), ...poolFloor3];

    // Shuffle and pick 4 unique pieces of equipment
    const shuffled = [...chosenPool].sort(() => Math.random() - 0.5);
    const selectedKeys = shuffled.slice(0, 4);

    const rarityPriceMap = {
      COMMON: 45,
      RARE: 75,
      EPIC: 120,
      LEGENDARY: 190,
      MYTHIC: 320
    };

    for (const key of selectedKeys) {
      const item = itemCatalog[key];
      if (item) {
        const basePrice = rarityPriceMap[item.rarity] || 60;
        const jitter = Math.floor((Math.random() - 0.5) * 15);
        list.push({ item, price: Math.max(30, basePrice + jitter) });
      }
    }

    this.stock = list;
    return this.stock;
  }

  refreshStock(floorNumber = 1, itemCatalog = {}) {
    this.generateWares(floorNumber, itemCatalog);
    this.sayRandomRefresh();
    return this.stock;
  }

  isNear(player) {
    if (!player) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) <= (this.interactionRange * this.interactionRange);
  }

  say(text, color = '#fbbf24', duration = 3.5) {
    this.dialogue = text;
    this.dialogueColor = color;
    this.dialogueTimer = duration;
  }

  /**
   * Spelunky Retaliation: If a player attacks, damages, or slaps the merchant,
   * he pulls out his RPG, aims with a red laser sight for 1.8 seconds, then fires!
   */
  handleAttacked(attacker, audio, cinematics, particles) {
    if (!attacker) return;
    if (this.retaliationCooldown > 0 || this.isAimingRPG) return;

    this.retaliationCooldown = 6.0; // Enraged cooldown
    this.isAimingRPG = true;
    this.rpgWindupTimer = this.rpgWindupDuration;
    this.targetCulprit = attacker;
    this.aimAngle = Math.atan2(attacker.y - this.y, attacker.x - this.x);

    const atkQuip = this.pickRandom(this.attackedQuips);
    this.say(atkQuip, '#ef4444', 3.5);

    if (audio) {
      if (audio.playShieldLock) audio.playShieldLock(); // Arming click
      audio.playSwing();
    }
    if (cinematics) {
      cinematics.addScreenShake(8);
    }
    if (particles) {
      particles.spawnComicText(this.x, this.y - 65, '⚠️ RPG LOCK-ON! 🚀', '#ef4444');
      particles.spawnDashBurst(this.x, this.y, 0, '#ef4444');
    }
  }

  update(dt, audio = null, cinematics = null, particles = null) {
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= dt;
    }
    if (this.retaliationCooldown > 0) {
      this.retaliationCooldown -= dt;
    }

    // RPG Aiming & Windup Animation
    if (this.isAimingRPG) {
      if (this.targetCulprit) {
        this.aimAngle = Math.atan2(this.targetCulprit.y - this.y, this.targetCulprit.x - this.x);
      }
      this.rpgWindupTimer -= dt;

      // When windup timer reaches 0: LAUNCH THE ROCKET!
      if (this.rpgWindupTimer <= 0) {
        this.isAimingRPG = false;

        if (audio) {
          audio.playRocketLaunch();
        }
        if (cinematics) {
          cinematics.addScreenShake(16);
        }
        if (particles) {
          particles.spawnComicText(this.x, this.y - 60, 'FIRE IN THE HOLE! 🚀💥', '#ef4444');
          particles.spawnDashBurst(this.x, this.y, this.aimAngle, '#f59e0b');
        }

        const speed = 580;
        const rocket = {
          type: 'merchant_rpg_rocket',
          caster: this,
          targetEntity: this.targetCulprit,
          x: this.x + Math.cos(this.aimAngle) * 36,
          y: this.y + Math.sin(this.aimAngle) * 36,
          vx: Math.cos(this.aimAngle) * speed,
          vy: Math.sin(this.aimAngle) * speed,
          radius: 20,
          damage: 75,
          aoeRadius: 130, // Splash blast radius damaging nearby teammates!
          life: 2.5,
          angle: this.aimAngle
        };

        if (cinematics) {
          cinematics.spawnProjectile(rocket);
        }
      }
    }

    // Random idle banter
    if (!this.isAimingRPG) {
      this.quipTimer -= dt;
      if (this.quipTimer <= 0) {
        this.quipTimer = 9.0 + Math.random() * 6.0;
        if (this.dialogueTimer <= 0) {
          const quip = this.idleQuips[Math.floor(Math.random() * this.idleQuips.length)];
          this.say(quip, '#fbbf24', 4.5);
        }
      }
    }
  }

  draw(ctx, isNearPlayer, time = 0) {
    ctx.save();
    
    // Jitter / vibrate when aiming RPG in rage
    const jitterX = this.isAimingRPG ? (Math.random() - 0.5) * 4 : 0;
    const jitterY = this.isAimingRPG ? (Math.random() - 0.5) * 4 : 0;
    ctx.translate(this.x + jitterX, this.y + jitterY);

    // 1. Ornate Persian / Dungeon Carpet
    ctx.save();
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-65, -45, 130, 90);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(-65, -45, 130, 90);

    // Gold carpet border trim & tassels
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-60, -40, 120, 80);

    // Carpet corner gems
    const corners = [[-58, -38], [58, -38], [-58, 38], [58, 38]];
    ctx.fillStyle = '#10b981';
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Laser Sight when aiming RPG at culprit!
    if (this.isAimingRPG && this.targetCulprit) {
      ctx.save();
      const targetDist = Math.hypot(this.targetCulprit.x - this.x, this.targetCulprit.y - this.y);
      const laserLen = Math.max(80, Math.min(600, targetDist));

      // Red laser beam
      ctx.rotate(this.aimAngle);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(laserLen, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lock-on crosshair at target
      ctx.translate(laserLen, 0);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
      ctx.moveTo(0, -18); ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Merchant Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Traveler Pack & RPG
    ctx.save();
    // Overstuffed brown traveler pack
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-22, -18, 16, 26);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -18, 16, 26);

    // Green potion bottle hanging on pack
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(-24, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.isAimingRPG) {
      // RPG is shouldered and aimed!
      ctx.restore(); // restore from pack save
      ctx.save();
      ctx.rotate(this.aimAngle);

      // Heavy shoulder launcher tube
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(-10, -7, 52, 14);
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -7, 52, 14);

      // Steel muzzle bell & sight
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(40, -9, 8, 18);
      ctx.fillStyle = '#ef4444'; // laser sight emitter
      ctx.beginPath();
      ctx.arc(44, -11, 3, 0, Math.PI * 2);
      ctx.fill();

      // Rocket warhead tip loaded in front
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(48, -7);
      ctx.lineTo(60, 0);
      ctx.lineTo(48, 7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // Normal: RPG tube strapped across back
      ctx.rotate(-0.35);
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(-6, -34, 10, 48);
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -34, 10, 48);

      // Rocket conical warhead sticking out top!
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-1, -44);
      ctx.lineTo(8, -34);
      ctx.lineTo(-10, -34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Merchant Body & Cloak (Emerald Cloak with Gold Clasp)
    const breathe = Math.sin(time * 3) * 1.5;

    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, breathe, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isAimingRPG ? '#ef4444' : '#059669';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Gold Cloak Clasp & Trim
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -10 + breathe, 6, 0, Math.PI * 2);
    ctx.fill();

    // Merchant Hood / Face Shadow (Mysterious glowing eyes)
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(0, -6 + breathe, 16, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes (Red when enraged & aiming RPG, yellow when normal)
    const eyeColor = this.isAimingRPG ? '#ef4444' : '#fde047';
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-5, -7 + breathe, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -7 + breathe, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Lantern / Coin Pouch in Hand (only when not aiming 2-handed RPG)
    if (!this.isAimingRPG) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(22, 10 + breathe, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = '800 9px monospace';
      ctx.fillStyle = '#78350f';
      ctx.textAlign = 'center';
      ctx.fillText('$', 22, 13 + breathe);
    }

    // 6. Floating Speech Bubble
    if (this.dialogueTimer > 0 && this.dialogue) {
      ctx.save();
      ctx.font = '600 12px "Outfit", sans-serif';
      const textMetrics = ctx.measureText(this.dialogue);
      const bubbleW = textMetrics.width + 24;
      const bubbleH = 28;
      const bubbleY = -56 + breathe;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = this.dialogueColor;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH, 8);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.moveTo(-5, bubbleY + bubbleH / 2);
      ctx.lineTo(0, bubbleY + bubbleH / 2 + 7);
      ctx.lineTo(5, bubbleY + bubbleH / 2);
      ctx.fill();

      ctx.fillStyle = this.dialogueColor;
      ctx.textAlign = 'center';
      ctx.fillText(this.dialogue, 0, bubbleY + 4);
      ctx.restore();
    }

    // 7. Interactive Proximity Prompt
    if (isNearPlayer) {
      ctx.save();
      const promptY = 46 + breathe;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.beginPath();
      ctx.roundRect(-85, promptY - 12, 170, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '800 11px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[E] TRADE WITH MERCHANT', 0, promptY + 4);
      ctx.restore();
    }

    ctx.restore();
  }
}
