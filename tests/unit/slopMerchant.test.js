import { describe, it, expect } from 'vitest';
import { SlopMerchant } from '../../src/slopMerchant.js';
import { ITEM_CATALOG } from '../../src/items.js';

describe('Slop Merchant Themed Wares & High Rarity Scaling', () => {
  it('generates stock containing essential consumables and 4 pieces of equipment', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(1, ITEM_CATALOG, 'jjk');

    expect(stock.length).toBe(6);
    expect(stock[0].item.id).toBe('health_flask');
    expect(stock[1].item.id).toBe('stamina_tonic');
  });

  it('generates JJK anime items on Floor 1 (Cursed Detention Center)', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(1, ITEM_CATALOG, 'jjk');
    const gearWares = stock.slice(2).map(s => s.item);

    const jjkSets = ['gojo', 'sukuna', 'toji'];
    const matchingJjkItems = gearWares.filter(item => item.set && jjkSets.includes(item.set));

    expect(matchingJjkItems.length).toBeGreaterThanOrEqual(2);
    // Rarities should not be all common
    const nonCommonItems = gearWares.filter(item => item.rarity !== 'COMMON');
    expect(nonCommonItems.length).toBeGreaterThanOrEqual(3);
  });

  it('generates Cyberpunk anime items on Floor 2 (Arasaka Sublevel)', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(2, ITEM_CATALOG, 'cyberpunk');
    const gearWares = stock.slice(2).map(s => s.item);

    const matchingCyberpunkItems = gearWares.filter(item => item.set === 'david');
    expect(matchingCyberpunkItems.length).toBeGreaterThanOrEqual(2);
  });

  it('generates AoT anime items on Floor 3 (Wall Maria Crypts)', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(3, ITEM_CATALOG, 'aot');
    const gearWares = stock.slice(2).map(s => s.item);

    const matchingAotItems = gearWares.filter(item => item.set === 'levi');
    expect(matchingAotItems.length).toBeGreaterThanOrEqual(2);
  });

  it('generates Berserk anime items on Floor 4 (Eclipse Sanctum)', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(4, ITEM_CATALOG, 'berserk');
    const gearWares = stock.slice(2).map(s => s.item);

    const matchingBerserkItems = gearWares.filter(item => item.set === 'guts');
    expect(matchingBerserkItems.length).toBeGreaterThanOrEqual(2);
  });

  it('generates One Punch Man anime items on Floor 5 (City Z Ruins)', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(5, ITEM_CATALOG, 'opm');
    const gearWares = stock.slice(2).map(s => s.item);

    const matchingOpmItems = gearWares.filter(item => item.set === 'saitama');
    expect(matchingOpmItems.length).toBeGreaterThanOrEqual(2);
  });

  it('prices scale proportionally with item rarity', () => {
    const merchant = new SlopMerchant(0, 0);
    const stock = merchant.generateWares(4, ITEM_CATALOG, 'berserk');

    for (const entry of stock) {
      if (entry.item.rarity === 'COMMON') {
        expect(entry.price).toBeLessThan(70);
      } else if (entry.item.rarity === 'MYTHIC') {
        expect(entry.price).toBeGreaterThan(250);
      }
    }
  });

  it('refreshStock() rolls fresh wares while maintaining floor theme', () => {
    const merchant = new SlopMerchant(0, 0);
    merchant.generateWares(2, ITEM_CATALOG, 'cyberpunk');
    const newStock = merchant.refreshStock(2, ITEM_CATALOG, 'cyberpunk');

    expect(newStock.length).toBe(6);
    expect(merchant.currentTheme).toBe('cyberpunk');
  });
});

