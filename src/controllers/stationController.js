import { ITEM_CATALOG, ItemRarity, executeTradeUp, executeGachaSpin, getItemSellPrice } from '../items.js';

/**
 * StationController
 * Manages in-world stations:
 * 1. Slop Merchant (Supplies Shop, Sell Tab, Trade-up Forge)
 * 2. Wheel of Slop Altar (Item Wager Gacha)
 * 3. Blackjack Casino Table (Dynamic Code-Split Blackjack Game)
 * 4. Dev Armory Chest (Set Equippers & Catalog Browser)
 */
export class StationController {
  /**
   * @param {Object} deps
   * @param {import('../modalManager.js').ModalManager} deps.modalManager
   * @param {any} deps.player
   * @param {any} deps.audio
   * @param {any} [deps.particles]
   * @param {any} [deps.cinematics]
   * @param {any} [deps.network]
   * @param {() => any} [deps.getSlopMerchant]
   * @param {() => any} [deps.getWheelAltar]
   * @param {() => any} [deps.getBlackjackTable]
   * @param {() => number} [deps.getSharedSlops]
   * @param {(amt: number) => void} [deps.setSharedSlops]
   * @param {() => number} [deps.getCurrentFloor]
   * @param {() => void} [deps.updateSlopsUI]
   * @param {() => void} [deps.broadcastSlops]
   * @param {() => void} [deps.broadcastMyState]
   * @param {() => void} [deps.renderInventoryUI]
   */
  constructor(deps) {
    this.modalManager = deps.modalManager;
    this.player = deps.player;
    this.audio = deps.audio;
    this.particles = deps.particles;
    this.cinematics = deps.cinematics;
    this.network = deps.network;
    this.getSlopMerchant = deps.getSlopMerchant || (() => null);
    this.getWheelAltar = deps.getWheelAltar || (() => null);
    this.getBlackjackTable = deps.getBlackjackTable || (() => null);
    this.getSharedSlops = deps.getSharedSlops || (() => 0);
    this.setSharedSlops = deps.setSharedSlops || (() => {});
    this.getCurrentFloor = deps.getCurrentFloor || (() => 0);
    this.updateSlopsUI = deps.updateSlopsUI || (() => {});
    this.broadcastSlops = deps.broadcastSlops || (() => {});
    this.broadcastMyState = deps.broadcastMyState || (() => {});
    this.renderInventoryUI = deps.renderInventoryUI || (() => {});

    // Merchant state
    this.activeMerchantTab = 'shop';
    this.forgeSlots = [null, null, null];

    // Wheel altar state
    this.altarWagerItem = null;

    // Blackjack state (lazy loaded)
    this.blackjackGame = null;
    this.selectedBjBet = 25;

    // Dev Armory filter state
    this.currentArmoryFilter = 'all';
  }

  // =========================================================================
  // 1. SLOP MERCHANT
  // =========================================================================
  openMerchantModal() {
    this.modalManager.open('merchant-modal');
  }

  closeMerchantModal() {
    this.modalManager.close('merchant-modal');
  }

  switchMerchantTab(tabName) {
    this.activeMerchantTab = tabName;
    document.querySelectorAll('.merchant-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.merchant-tab-pane').forEach(p => {
      p.classList.remove('active');
    });
    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) targetPane.classList.add('active');

    this.updateSlopsUI();

    if (tabName === 'shop') this.renderShopTab();
    else if (tabName === 'sell') this.renderSellTab();
    else if (tabName === 'forge') this.renderForgeTab();
  }

  renderShopTab() {
    const shopItemsGrid = document.getElementById('shop-items-grid');
    if (!shopItemsGrid) return;
    shopItemsGrid.innerHTML = '';

    const slopMerchant = this.getSlopMerchant();
    if (slopMerchant && (!slopMerchant.stock || slopMerchant.stock.length === 0)) {
      slopMerchant.generateWares(this.getCurrentFloor(), ITEM_CATALOG);
    }

    const shopStock = slopMerchant ? slopMerchant.stock : [];

    const btnRefresh = document.getElementById('btn-refresh-shop');
    const refreshCostText = document.getElementById('refresh-cost-text');
    if (btnRefresh && slopMerchant) {
      const cost = slopMerchant.refreshCost || 25;
      if (refreshCostText) refreshCostText.textContent = cost;
      btnRefresh.disabled = this.getSharedSlops() < cost;
    }

    shopStock.forEach(({ item, price }) => {
      if (!item) return;
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      const canAfford = this.getSharedSlops() >= price;
      const hasSpace = this.player.inventory.length < this.player.maxInventorySize;

      card.innerHTML = `
        <div class="shop-card-top">
          <div class="shop-item-header">
            <span class="shop-item-name" style="color: ${rarity.color}" title="${item.name}">${item.name}</span>
            <span class="shop-item-price">🪙 ${price}</span>
          </div>
          <div class="shop-item-desc">${item.desc || (item.slot + ' equipment')}</div>
        </div>
        <button class="shop-buy-btn uniform-action-btn" ${(!canAfford || !hasSpace) ? 'disabled' : ''} data-item-id="${item.id}" data-price="${price}">
          ${!canAfford ? 'NOT ENOUGH SLOPS' : (!hasSpace ? 'BACKPACK FULL' : `BUY FOR ${price} SLOPS`)}
        </button>
      `;
      shopItemsGrid.appendChild(card);
    });

    document.querySelectorAll('.shop-buy-btn:not(:disabled)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const price = parseInt(btn.getAttribute('data-price'), 10);

        if (this.getSharedSlops() < price) {
          if (this.audio) this.audio.playBonk();
          return;
        }
        if (this.player.inventory.length >= this.player.maxInventorySize) {
          alert('Backpack is full!');
          return;
        }

        const boughtItem = ITEM_CATALOG[itemId];
        if (!boughtItem) return;

        this.setSharedSlops(this.getSharedSlops() - price);
        this.updateSlopsUI();
        this.broadcastSlops();

        this.player.inventory.push(boughtItem);
        if (this.audio) this.audio.playSwing();
        if (this.particles) {
          this.particles.spawnComicText(this.player.x, this.player.y - 25, `BOUGHT ${boughtItem.name.toUpperCase()}!`, '#f59e0b');
        }
        this.broadcastMyState();

        if (slopMerchant) {
          slopMerchant.removeItemFromStock(itemId);
          slopMerchant.sayRandomGreeting();
        }

        this.renderShopTab();
      });
    });
  }

  renderSellTab() {
    const sellItemsGrid = document.getElementById('sell-items-grid');
    if (!sellItemsGrid) return;
    sellItemsGrid.innerHTML = '';

    if (this.player.inventory.length === 0) {
      sellItemsGrid.innerHTML = '<span style="grid-column: 1 / -1; color:#94a3b8; padding:24px; text-align:center; font-size:0.85rem;">Backpack is empty! Explore the dungeon and find loot to sell.</span>';
      return;
    }

    this.player.inventory.forEach((item, idx) => {
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      const sellPrice = getItemSellPrice(item);
      const card = document.createElement('div');
      card.className = 'sell-item-card';

      card.innerHTML = `
        <div class="shop-card-top">
          <div class="sell-item-header">
            <span class="sell-item-name" style="color: ${rarity.color}">${item.name}</span>
            <span class="sell-item-value">+🪙 ${sellPrice}</span>
          </div>
          <div class="sell-item-desc">${item.rarity} • ${item.slot.toUpperCase()}</div>
        </div>
        <button class="sell-btn uniform-action-btn" data-idx="${idx}" data-price="${sellPrice}">
          SELL FOR +${sellPrice} SLOPS
        </button>
      `;
      sellItemsGrid.appendChild(card);
    });

    document.querySelectorAll('.sell-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const price = parseInt(btn.getAttribute('data-price'), 10);

        const sold = this.player.inventory.splice(idx, 1)[0];
        if (sold) {
          this.setSharedSlops(this.getSharedSlops() + price);
          this.updateSlopsUI();
          this.broadcastSlops();

          if (this.audio) this.audio.playSwing();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 25, `SOLD +${price} SLOPS 🪙`, '#4ade80');
          }
          this.broadcastMyState();

          const slopMerchant = this.getSlopMerchant();
          if (slopMerchant) slopMerchant.say(`Nice scrap! That's ${price} slops for your crew.`, '#4ade80', 2.5);

          this.renderSellTab();
        }
      });
    });
  }

  renderForgeTab() {
    const forgeInventoryGrid = document.getElementById('forge-inventory-grid');
    if (!forgeInventoryGrid) return;

    for (let s = 0; s < 3; s++) {
      const slotEl = document.getElementById(`forge-slot-${s}`);
      if (!slotEl) continue;
      const item = this.forgeSlots[s];
      if (item) {
        const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
        slotEl.className = 'forge-slot filled';
        slotEl.innerHTML = `<span style="color:${rarity.color}">${item.name}</span><span style="font-size:0.6rem; color:#94a3b8;">(${item.rarity})</span>`;
      } else {
        slotEl.className = 'forge-slot';
        slotEl.innerHTML = 'Empty';
      }
    }

    const allFilled = this.forgeSlots.every(it => it !== null);
    const sameRarity = allFilled && (this.forgeSlots[0].rarity === this.forgeSlots[1].rarity && this.forgeSlots[1].rarity === this.forgeSlots[2].rarity);
    const notMythic = allFilled && this.forgeSlots[0].rarity !== 'MYTHIC';
    const isValid = allFilled && sameRarity && notMythic;

    const btnExecuteForge = document.getElementById('btn-execute-forge');
    if (btnExecuteForge) {
      btnExecuteForge.disabled = !isValid;
    }

    forgeInventoryGrid.innerHTML = '';
    const placedIndices = new Set();
    this.forgeSlots.forEach(sl => {
      if (sl) {
        const idx = this.player.inventory.indexOf(sl);
        if (idx !== -1) placedIndices.add(idx);
      }
    });

    this.player.inventory.forEach((item, idx) => {
      if (placedIndices.has(idx)) return;
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      const card = document.createElement('div');
      card.className = 'backpack-item-card mini-card forge-pick-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="mini-card-info">
          <strong class="mini-card-name" style="color:${rarity.color}" title="${item.name}">${item.name}</strong>
          <div class="mini-card-sub">${item.rarity} • ${item.slot}</div>
        </div>
        <button class="mini-action-btn" style="border-color:#f59e0b; color:#fbbf24;">INSERT</button>
      `;
      card.addEventListener('click', () => {
        const emptyIdx = this.forgeSlots.findIndex(sl => sl === null);
        if (emptyIdx !== -1) {
          this.forgeSlots[emptyIdx] = item;
          if (this.audio) this.audio.playSwing();
          this.renderForgeTab();
        }
      });
      forgeInventoryGrid.appendChild(card);
    });
  }

  // =========================================================================
  // 2. WHEEL OF SLOP ALTAR
  // =========================================================================
  openWheelAltarModal() {
    const wheelAltar = this.getWheelAltar();
    if (wheelAltar && wheelAltar.isSpinning) {
      if (this.particles) {
        this.particles.spawnComicText(this.player.x, this.player.y - 35, `⚠️ IN USE BY ${wheelAltar.activeSpinnerName || 'FRIEND'}!`, '#f59e0b');
      }
      return;
    }
    this.modalManager.open('wheel-altar-modal');
  }

  closeWheelAltarModal() {
    this.modalManager.close('wheel-altar-modal');
  }

  renderWheelAltarModal() {
    const altarWagerSlot = document.getElementById('altar-wager-slot');
    const btnAltarSpinWheel = document.getElementById('btn-altar-spin-wheel');
    const altarInventoryGrid = document.getElementById('altar-inventory-grid');
    const wheelAltar = this.getWheelAltar();

    if (altarWagerSlot) {
      if (this.altarWagerItem) {
        const rarity = ItemRarity[this.altarWagerItem.rarity] || ItemRarity.COMMON;
        altarWagerSlot.className = 'forge-slot wager-slot filled';
        altarWagerSlot.innerHTML = `<span style="color:${rarity.color}">${this.altarWagerItem.name}</span><span style="font-size:0.65rem; color:#94a3b8;">(${this.altarWagerItem.rarity})</span>`;
      } else {
        altarWagerSlot.className = 'forge-slot wager-slot';
        altarWagerSlot.innerHTML = 'Select Item Below';
      }
    }

    if (btnAltarSpinWheel) {
      btnAltarSpinWheel.disabled = !this.altarWagerItem || (wheelAltar && wheelAltar.isSpinning);
    }

    if (altarInventoryGrid) {
      altarInventoryGrid.innerHTML = '';
      this.player.inventory.forEach((item) => {
        const isSelected = this.altarWagerItem === item;
        const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
        const card = document.createElement('div');
        card.className = `backpack-item-card mini-card wheel-pick-card ${isSelected ? 'selected' : ''}`;
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="mini-card-info">
            <strong class="mini-card-name" style="color:${rarity.color}" title="${item.name}">${item.name}</strong>
            <div class="mini-card-sub">${item.rarity} • ${item.slot}</div>
          </div>
          <button class="mini-action-btn" style="border-color:${isSelected ? '#10b981' : '#f59e0b'}; color:${isSelected ? '#4ade80' : '#fbbf24'};">
            ${isSelected ? 'WAGERED' : 'WAGER'}
          </button>
        `;
        card.addEventListener('click', () => {
          if (wheelAltar && wheelAltar.isSpinning) return;
          this.altarWagerItem = item;
          if (this.audio) this.audio.playSwing();
          this.renderWheelAltarModal();
        });
        altarInventoryGrid.appendChild(card);
      });
    }
  }

  // =========================================================================
  // 3. BLACKJACK CASINO TABLE (LAZY CODE-SPLIT)
  // =========================================================================
  /**
   * Lazily imports and instantiates BlackjackGame on demand
   * @returns {Promise<any>}
   */
  async getBlackjackEngine() {
    if (!this.blackjackGame) {
      const { BlackjackGame } = await import('../blackjack.js');
      this.blackjackGame = new BlackjackGame();
    }
    return this.blackjackGame;
  }

  async openBlackjackModal() {
    await this.getBlackjackEngine();
    this.modalManager.open('blackjack-modal');
  }

  closeBlackjackModal() {
    this.modalManager.close('blackjack-modal');
  }

  createCardDom(card, isHoleCard = false) {
    const cardEl = document.createElement('div');
    if (isHoleCard) {
      cardEl.className = 'bj-card hole-card';
      cardEl.innerHTML = '<div class="hole-card-inner">🂠</div>';
      return cardEl;
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    cardEl.className = `bj-card ${isRed ? 'red' : 'black'}`;
    cardEl.innerHTML = `
      <div class="card-top">${card.rank}${card.suit}</div>
      <div class="card-mid">${card.suit}</div>
      <div class="card-bot">${card.rank}${card.suit}</div>
    `;
    return cardEl;
  }

  async renderBlackjackUI() {
    const bj = await this.getBlackjackEngine();
    const sharedSlops = this.getSharedSlops();

    const bjSlopsAmount = document.getElementById('bj-slops-amount');
    const bjCurrentBetVal = document.getElementById('bj-current-bet-val');
    const dealBtnAmt = document.getElementById('bj-deal-btn-amount');
    const bjDealerCards = document.getElementById('bj-dealer-cards');
    const bjPlayerCards = document.getElementById('bj-player-cards');
    const bjPlayerScore = document.getElementById('bj-player-score');
    const bjDealerScore = document.getElementById('bj-dealer-score');
    const bjBetControls = document.getElementById('bj-bet-controls');
    const bjActionControls = document.getElementById('bj-action-controls');
    const bjResolvedControls = document.getElementById('bj-resolved-controls');
    const btnBjDeal = document.getElementById('btn-bj-deal');
    const btnBjDouble = document.getElementById('btn-bj-double');
    const bjStatusBanner = document.getElementById('bj-status-banner');
    const bjDealerBubble = document.getElementById('bj-dealer-bubble');

    if (bjSlopsAmount) bjSlopsAmount.textContent = `${sharedSlops.toLocaleString()} SLOPS`;
    if (bjCurrentBetVal) bjCurrentBetVal.textContent = this.selectedBjBet;
    if (dealBtnAmt) dealBtnAmt.textContent = this.selectedBjBet;

    if (bjDealerCards) {
      bjDealerCards.innerHTML = '';
      bj.dealerHand.forEach((card, idx) => {
        const isHole = idx === 1 && !bj.dealerHoleCardRevealed;
        bjDealerCards.appendChild(this.createCardDom(card, isHole));
      });
    }

    if (bjPlayerCards) {
      bjPlayerCards.innerHTML = '';
      bj.playerHand.forEach((card) => {
        bjPlayerCards.appendChild(this.createCardDom(card, false));
      });
    }

    if (bjPlayerScore) {
      const pScore = bj.calculateScore(bj.playerHand);
      bjPlayerScore.textContent = bj.playerHand.length > 0 ? (pScore.isSoft && pScore.score <= 21 ? `Soft ${pScore.score}` : pScore.score) : '0';
    }

    if (bjDealerScore) {
      if (bj.dealerHand.length === 0) {
        bjDealerScore.textContent = '?';
      } else if (!bj.dealerHoleCardRevealed) {
        const dUp = bj.calculateScore(bj.dealerHand, true);
        bjDealerScore.textContent = `${dUp.score} + ?`;
      } else {
        const dScore = bj.calculateScore(bj.dealerHand, false);
        bjDealerScore.textContent = dScore.score;
      }
    }

    if (bjBetControls) bjBetControls.classList.toggle('hidden', bj.gameState !== 'BETTING');
    if (bjActionControls) bjActionControls.classList.toggle('hidden', bj.gameState !== 'PLAYER_TURN');
    if (bjResolvedControls) bjResolvedControls.classList.toggle('hidden', bj.gameState !== 'RESOLVED');

    if (btnBjDeal) {
      btnBjDeal.disabled = sharedSlops < this.selectedBjBet || this.selectedBjBet <= 0;
    }
    if (btnBjDouble) {
      btnBjDouble.disabled = sharedSlops < bj.currentBet;
    }

    if (bjStatusBanner) {
      if (bj.gameState === 'BETTING') {
        bjStatusBanner.textContent = 'PLACE YOUR BET & DEAL';
        bjStatusBanner.style.color = '#ffffff';
      } else if (bj.gameState === 'PLAYER_TURN') {
        bjStatusBanner.textContent = 'YOUR TURN: HIT, STAND, OR DOUBLE DOWN';
        bjStatusBanner.style.color = '#38bdf8';
      } else if (bj.gameState === 'DEALER_TURN') {
        bjStatusBanner.textContent = 'DEALER DRAWING...';
        bjStatusBanner.style.color = '#f59e0b';
      } else if (bj.gameState === 'RESOLVED') {
        const res = bj.result;
        if (res === 'BLACKJACK') {
          bjStatusBanner.textContent = 'BLACKJACK! NATURAL 21! 💰';
          bjStatusBanner.style.color = '#fbbf24';
        } else if (res === 'WIN' || res === 'DEALER_BUST') {
          bjStatusBanner.textContent = res === 'DEALER_BUST' ? 'DEALER BUST! YOU WIN! ✨' : 'YOU WIN! ✨';
          bjStatusBanner.style.color = '#4ade80';
        } else if (res === 'PUSH') {
          bjStatusBanner.textContent = 'PUSH! BET RETURNED 🤝';
          bjStatusBanner.style.color = '#94a3b8';
        } else {
          bjStatusBanner.textContent = res === 'BUST' ? 'BUSTED! YOU LOSE! 💀' : 'DEALER WINS! 💀';
          bjStatusBanner.style.color = '#ef4444';
        }
      }
    }

    if (bjDealerBubble) {
      bjDealerBubble.textContent = `"${bj.getMerchantQuip()}"`;
    }
  }

  // =========================================================================
  // 4. DEV ARMORY CHEST
  // =========================================================================
  equipFullSet(setName) {
    ['helmet', 'chest', 'pants', 'boots', 'weapon', 'offhand'].forEach(slot => {
      this.player.unequipSlot(slot);
    });

    if (setName === 'strip') {
      this.player.syncHUD();
      this.renderInventoryUI();
      this.broadcastMyState();
      if (this.audio) this.audio.playSwing();
      if (this.particles) {
        this.particles.spawnComicText(this.player.x, this.player.y - 30, '🚫 STRIPPED ALL GEAR', '#f87171');
      }
      return;
    }

    let itemsToEquip = [];
    let bannerText = '';
    let bannerColor = '#facc15';

    if (setName === 'gojo') {
      itemsToEquip = ['gojo_blindfold', 'gojo_tunic', 'gojo_slacks', 'gojo_loafers', 'lapse_blue', 'reversal_red'];
      bannerText = '⚡ EQUIPPED THE HONORED ONE SET!';
      bannerColor = '#00f0ff';
    } else if (setName === 'sukuna') {
      itemsToEquip = ['sukuna_crown', 'sukuna_robe', 'sukuna_hakama', 'sukuna_zori', 'sukuna_cleaver', 'sukuna_kamutoke'];
      bannerText = '🗡️ EQUIPPED KING OF CURSES SET!';
      bannerColor = '#ff2a5f';
    } else if (setName === 'toji') {
      itemsToEquip = ['toji_worm', 'toji_shirt', 'toji_pants', 'toji_slippers', 'inverted_spear_chain'];
      bannerText = '⛓️ EQUIPPED SORCERER KILLER SET!';
      bannerColor = '#38bdf8';
    } else if (setName === 'guts') {
      itemsToEquip = ['guts_beast_helm', 'guts_berserker_plate', 'guts_greaves', 'guts_sollerets', 'dragon_slayer'];
      bannerText = '⚔️ EQUIPPED THE BLACK SWORDSMAN SET!';
      bannerColor = '#ef4444';
    } else if (setName === 'levi') {
      itemsToEquip = ['scout_hood', 'odm_harness', 'scout_trousers', 'scout_boots', 'dual_snap_blades'];
      bannerText = '🌪️ EQUIPPED HUMANITY\'S STRONGEST SET!';
      bannerColor = '#10b981';
    } else if (setName === 'david') {
      itemsToEquip = ['david_kiroshi', 'david_jacket', 'david_pants', 'david_sneakers', 'david_shotgun', 'david_gorilla_arms'];
      bannerText = '⚡ EQUIPPED NIGHT CITY LEGEND SET!';
      bannerColor = '#00ff88';
    } else if (setName === 'starter') {
      itemsToEquip = ['iron_visor', 'leather_tunic', 'cloth_pants', 'travel_boots', 'rusty_sword', 'wooden_buckler'];
      bannerText = '🛡️ EQUIPPED STARTER GEAR!';
      bannerColor = '#cbd5e1';
    }

    itemsToEquip.forEach(id => {
      if (ITEM_CATALOG[id]) {
        this.player.equipItem(ITEM_CATALOG[id]);
      }
    });

    this.player.syncHUD();
    this.renderInventoryUI();
    this.broadcastMyState();
    if (this.audio) this.audio.playChestOpen();
    if (this.particles) {
      this.particles.spawnComicText(this.player.x, this.player.y - 30, bannerText, bannerColor);
    }
  }

  renderArmoryItems(filter = 'all') {
    const grid = document.getElementById('armory-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const searchInput = document.getElementById('armory-search-input');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const allItems = Object.values(ITEM_CATALOG);
    const filtered = allItems.filter(item => {
      const matchFilter = filter === 'all' || item.slot === filter || (filter === 'weapon' && (item.slot === 'weapon' || item.slot === 'offhand'));
      const matchQuery = !query || item.name.toLowerCase().includes(query) || (item.desc && item.desc.toLowerCase().includes(query));
      return matchFilter && matchQuery;
    });

    filtered.forEach(item => {
      const rarity = ItemRarity[item.rarity] || ItemRarity.COMMON;
      const card = document.createElement('div');
      card.className = 'armory-item-card';
      card.innerHTML = `
        <div class="armory-card-top">
          <span class="armory-item-name" style="color: ${rarity.color}">${item.name}</span>
          <span class="armory-item-slot">${item.slot.toUpperCase()} • ${item.rarity}</span>
        </div>
        <div class="armory-item-desc">${item.desc || ''}</div>
        <div class="armory-card-actions">
          <button class="armory-action-btn armory-equip-btn" data-id="${item.id}">EQUIP</button>
          <button class="armory-action-btn armory-bag-btn" data-id="${item.id}">+ BAG</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.armory-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (ITEM_CATALOG[id]) {
          this.player.equipItem(ITEM_CATALOG[id]);
          this.player.syncHUD();
          this.renderInventoryUI();
          this.broadcastMyState();
          if (this.audio) this.audio.playSwing();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 25, `EQUIPPED ${ITEM_CATALOG[id].name.toUpperCase()}!`, '#00f0ff');
          }
        }
      });
    });

    grid.querySelectorAll('.armory-bag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (ITEM_CATALOG[id]) {
          if (this.player.inventory.length >= this.player.maxInventorySize) {
            alert('Backpack is full!');
            return;
          }
          this.player.inventory.push(ITEM_CATALOG[id]);
          this.renderInventoryUI();
          this.broadcastMyState();
          if (this.audio) this.audio.playSwing();
          if (this.particles) {
            this.particles.spawnComicText(this.player.x, this.player.y - 25, `+1 ${ITEM_CATALOG[id].name.toUpperCase()} TO BAG`, '#38bdf8');
          }
        }
      });
    });
  }
}
