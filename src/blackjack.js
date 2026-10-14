/**
 * Blackjack Game Engine for Slop Dungeon
 * Manages 52-card shoe, card dealing, hand scoring (soft/hard aces),
 * player actions (Hit, Stand, Double Down), dealer AI (stands on 17+),
 * payouts (1:1 win, 3:2 natural blackjack, push refund), and Slop Merchant quips.
 */

const SUITS = [
  { symbol: '♠', name: 'spades', color: '#1e293b' },
  { symbol: '♥', name: 'hearts', color: '#ef4444' },
  { symbol: '♦', name: 'diamonds', color: '#f59e0b' },
  { symbol: '♣', name: 'clubs', color: '#1e293b' }
];

const RANKS = [
  { rank: 'A', value: 11 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 }
];

export class BlackjackGame {
  constructor() {
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.currentBet = 25;
    this.gameState = 'BETTING'; // 'BETTING', 'PLAYER_TURN', 'DEALER_TURN', 'RESOLVED'
    this.result = null; // 'WIN', 'BLACKJACK', 'LOSE', 'BUST', 'PUSH', 'DEALER_BUST'
    this.payout = 0;
    this.dealerHoleCardRevealed = false;
    this.resetShoe();
  }

  resetShoe() {
    this.deck = [];
    // 2-deck shoe for good shuffle entropy
    for (let d = 0; d < 2; d++) {
      for (const suit of SUITS) {
        for (const r of RANKS) {
          this.deck.push({
            suit: suit.symbol,
            suitName: suit.name,
            color: suit.color,
            rank: r.rank,
            value: r.value,
            id: `${r.rank}_${suit.symbol}_${d}_${Math.random()}`
          });
        }
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCard() {
    if (this.deck.length < 15) {
      this.resetShoe();
    }
    return this.deck.pop();
  }

  calculateScore(hand, hideHoleCard = false) {
    let score = 0;
    let aces = 0;

    const cardsToCount = hideHoleCard ? [hand[0]] : hand;

    for (const card of cardsToCount) {
      if (!card) continue;
      score += card.value;
      if (card.rank === 'A') aces++;
    }

    // Soft Aces: reduce Ace from 11 to 1 while score > 21
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    const isSoft = aces > 0;
    const isBlackjack = hand.length === 2 && score === 21;

    return { score, isSoft, isBlackjack };
  }

  /**
   * Starts a new round with the given bet in Slops
   */
  startRound(betAmount) {
    this.currentBet = betAmount;
    this.playerHand = [];
    this.dealerHand = [];
    this.dealerHoleCardRevealed = false;
    this.result = null;
    this.payout = 0;

    // Deal: Player, Dealer, Player, Dealer (hole card)
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());

    const playerScore = this.calculateScore(this.playerHand);
    const dealerScore = this.calculateScore(this.dealerHand);

    // Natural 21 Check!
    if (playerScore.isBlackjack) {
      this.dealerHoleCardRevealed = true;
      if (dealerScore.isBlackjack) {
        // Both hit natural 21 -> Push
        this.gameState = 'RESOLVED';
        this.result = 'PUSH';
        this.payout = this.currentBet; // bet returned
      } else {
        // Player Natural Blackjack pays 3:2 (+150% profit)
        this.gameState = 'RESOLVED';
        this.result = 'BLACKJACK';
        this.payout = Math.round(this.currentBet * 2.5); // original bet + 1.5x bet
      }
      return;
    }

    this.gameState = 'PLAYER_TURN';
  }

  hit() {
    if (this.gameState !== 'PLAYER_TURN') return false;

    this.playerHand.push(this.drawCard());
    const { score } = this.calculateScore(this.playerHand);

    if (score > 21) {
      // Player Busts!
      this.dealerHoleCardRevealed = true;
      this.gameState = 'RESOLVED';
      this.result = 'BUST';
      this.payout = 0;
      return 'BUST';
    } else if (score === 21) {
      // Auto-stand on 21
      this.stand();
      return 'STAND_AUTO';
    }

    return 'CONTINUE';
  }

  doubleDown(canAffordExtraBet = true) {
    if (this.gameState !== 'PLAYER_TURN' || this.playerHand.length !== 2 || !canAffordExtraBet) {
      return false;
    }

    this.currentBet *= 2;
    this.playerHand.push(this.drawCard());

    const { score } = this.calculateScore(this.playerHand);
    if (score > 21) {
      this.dealerHoleCardRevealed = true;
      this.gameState = 'RESOLVED';
      this.result = 'BUST';
      this.payout = 0;
      return 'BUST';
    }

    this.stand();
    return 'STAND';
  }

  stand() {
    if (this.gameState !== 'PLAYER_TURN') return;

    this.gameState = 'DEALER_TURN';
    this.dealerHoleCardRevealed = true;

    // Dealer hits while score < 17
    let dealerScore = this.calculateScore(this.dealerHand).score;
    while (dealerScore < 17) {
      this.dealerHand.push(this.drawCard());
      dealerScore = this.calculateScore(this.dealerHand).score;
    }

    const finalPlayerScore = this.calculateScore(this.playerHand).score;

    this.gameState = 'RESOLVED';

    if (dealerScore > 21) {
      this.result = 'DEALER_BUST';
      this.payout = this.currentBet * 2; // 1:1 win
    } else if (finalPlayerScore > dealerScore) {
      this.result = 'WIN';
      this.payout = this.currentBet * 2; // 1:1 win
    } else if (finalPlayerScore === dealerScore) {
      this.result = 'PUSH';
      this.payout = this.currentBet; // bet returned
    } else {
      this.result = 'LOSE';
      this.payout = 0;
    }
  }

  getMerchantQuip() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    switch (this.result) {
      case 'BLACKJACK':
        return pick([
          'WHAT?! NATURAL 21?! Don’t push your luck, crawler! 💰',
          'BLACKJACK?! The house is bleeding Slops! 😱',
          'Ace and a face card?! You’ve got golden fingers! 👑',
          '3-to-2 payout?! You cleaned my pockets out! 💸',
          'A natural 21! Pure luck, I demand a cut of that! 🎰'
        ]);
      case 'WIN':
        return pick([
          'Fine, take your Slops! The house will win them back! 😤',
          'You beat my hand! Enjoy it while it lasts! 🪙',
          'A solid win! But can you do it twice in a row? 🃏',
          'Winner, winner! Don’t spend it all on health potions! 🍷',
          'Nice hand, crawler! But the night is still young! 💰'
        ]);
      case 'DEALER_BUST':
        return pick([
          'Arrgh! Dealer busts! The cards betrayed me! 💀',
          'Over 21?! These cards are cursed! Take your winnings! 😤',
          'Busted dealer! Luck was on your side that time, crawler! 🍀',
          'I hit too hard! Enjoy your unearned riches! 💸'
        ]);
      case 'BUST':
        return pick([
          'BUSTED! Hahaha, the house always eats! 😈',
          'Too greedy! Over 21, and your Slops are mine! 🪙',
          'You flew too close to 21 and burned! Thanks for the coins! 💸',
          'Bust! Should’ve stood when you had the chance! 💀',
          'Overkill! Your Slops have found a much better home in my pockets! 💰'
        ]);
      case 'LOSE':
        return pick([
          'Dealer wins! Thanks for the Slops, crawler! 🪙',
          'Better luck next hand! The house stands tall! 🎩',
          'My score takes the pot! Want revenge? Deal again! 😈',
          'Down goes your bet! Fortune favors the house today! ♠️',
          'House rules! Better luck next shuffle, crawler! 🃏'
        ]);
      case 'PUSH':
        return pick([
          'A tie? Boring! Nobody wins, nobody loses! 🎲',
          'Push! Your Slops are refunded. Let’s break the tie! 🤝',
          'Equal scores! The table demands a rematch! ♠️',
          'Standstill! Grab your chips back and let’s go again! 🪙'
        ]);
      default:
        return pick([
          'Place your bet! Cards don’t lie! ♠️',
          'Care to test your luck against the dealer? 🃏',
          'Slops on the felt! Let’s see what you’re made of! 🪙',
          'High rollers only! What’s your wager? 💰'
        ]);
    }
  }
}
