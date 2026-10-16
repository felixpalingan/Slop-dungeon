import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../src/eventBus.js';
import { Player } from '../../src/player.js';
import { CombatSystem } from '../../src/combat.js';
import { Monster } from '../../src/monster.js';
import { initHudPresenter } from '../../src/presenters/hudPresenter.js';

describe('Phase 7.7: Domain-Driven EventBus & Decoupling (ADR-001)', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('EventBus Core API', () => {
    it('subscribes to events with on() and receives emitted payloads', () => {
      const listener = vi.fn();
      bus.on('test:event', listener);

      bus.emit('test:event', { foo: 'bar' });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('supports multiple listeners for the same event', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();

      bus.on('multi:event', l1);
      bus.on('multi:event', l2);

      bus.emit('multi:event', 42);
      expect(l1).toHaveBeenCalledWith(42);
      expect(l2).toHaveBeenCalledWith(42);
      expect(bus.listenerCount('multi:event')).toBe(2);
    });

    it('unsubscribes listeners using off()', () => {
      const listener = vi.fn();
      bus.on('unsub:event', listener);
      expect(bus.listenerCount('unsub:event')).toBe(1);

      bus.off('unsub:event', listener);
      expect(bus.listenerCount('unsub:event')).toBe(0);

      bus.emit('unsub:event', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('returns an unsubscribe callback from on()', () => {
      const listener = vi.fn();
      const unsubscribe = bus.on('auto:unsub', listener);

      expect(bus.listenerCount('auto:unsub')).toBe(1);
      unsubscribe();
      expect(bus.listenerCount('auto:unsub')).toBe(0);

      bus.emit('auto:unsub', 'hello');
      expect(listener).not.toHaveBeenCalled();
    });

    it('executes one-time listeners exactly once with once()', () => {
      const listener = vi.fn();
      bus.once('once:event', listener);

      bus.emit('once:event', 'first');
      bus.emit('once:event', 'second');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('first');
      expect(bus.listenerCount('once:event')).toBe(0);
    });

    it('isolates subscriber errors so one failure does not halt other listeners', () => {
      const badListener = vi.fn(() => {
        throw new Error('Subscriber exploded!');
      });
      const goodListener = vi.fn();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      bus.on('safe:event', badListener);
      bus.on('safe:event', goodListener);

      bus.emit('safe:event', { safe: true });

      expect(badListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalledWith({ safe: true });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('clears specific event or all events with clear()', () => {
      bus.on('ev1', () => {});
      bus.on('ev1', () => {});
      bus.on('ev2', () => {});

      expect(bus.listenerCount('ev1')).toBe(2);
      expect(bus.listenerCount('ev2')).toBe(1);

      bus.clear('ev1');
      expect(bus.listenerCount('ev1')).toBe(0);
      expect(bus.listenerCount('ev2')).toBe(1);

      bus.clear();
      expect(bus.listenerCount('ev2')).toBe(0);
    });

    it('validates callback types', () => {
      expect(() => bus.on('test', 'not-a-func')).toThrow(TypeError);
      expect(() => bus.once('test', null)).toThrow(TypeError);
    });
  });

  describe('Player Domain Entity Decoupling', () => {
    it('runs headlessly in pure Node.js and emits player:hudSync without DOM error', () => {
      const player = new Player(0, 0, bus);
      const hudListener = vi.fn();
      bus.on('player:hudSync', hudListener);

      expect(() => player.syncHUD()).not.toThrow();
      expect(hudListener).toHaveBeenCalledTimes(1);
      const payload = hudListener.mock.calls[0][0];
      expect(payload.hp).toBe(100);
      expect(payload.maxHp).toBe(100);
      expect(payload.stamina).toBe(100);
      expect(payload.isDowned).toBe(false);
      expect(payload.isDead).toBe(false);
    });

    it('emits player:damage and player:healthChanged on takeDamage()', () => {
      const player = new Player(0, 0, bus);
      const damageListener = vi.fn();
      const hpListener = vi.fn();

      bus.on('player:damage', damageListener);
      bus.on('player:healthChanged', hpListener);

      player.takeDamage(25);

      expect(damageListener).toHaveBeenCalledWith(expect.objectContaining({
        damage: 25,
        hp: 75,
        maxHp: 100
      }));
      expect(hpListener).toHaveBeenCalledWith(expect.objectContaining({
        hp: 75,
        maxHp: 100,
        isDowned: false,
        isDead: false
      }));
    });

    it('emits player:downed and player:died upon fatal damage transitions', () => {
      const player = new Player(0, 0, bus);
      const downedListener = vi.fn();
      const diedListener = vi.fn();

      bus.on('player:downed', downedListener);
      bus.on('player:died', diedListener);

      // Downed transition
      player.takeDamage(120, 0, 0, true);
      expect(downedListener).toHaveBeenCalledTimes(1);
      expect(diedListener).not.toHaveBeenCalled();

      // Lethal transition when already downed and bled out
      player.downedTimer = 2.0;
      player.takeDamage(10, 0, 0, true);
      expect(diedListener).toHaveBeenCalledTimes(1);
    });

    it('emits player:revived on revive()', () => {
      const player = new Player(0, 0, bus);
      player.isDowned = true;
      player.hp = 0;

      const reviveListener = vi.fn();
      bus.on('player:revived', reviveListener);

      player.revive(0.5);

      expect(reviveListener).toHaveBeenCalledWith(expect.objectContaining({
        player,
        hp: 50,
        maxHp: 100
      }));
      expect(player.isDowned).toBe(false);
      expect(player.hp).toBe(50);
    });

    it('emits player:itemEquipped, player:itemUnequipped, and player:statsChanged on gear modifications', () => {
      const player = new Player(0, 0, bus);
      const equipListener = vi.fn();
      const unequipListener = vi.fn();
      const statsListener = vi.fn();

      bus.on('player:itemEquipped', equipListener);
      bus.on('player:itemUnequipped', unequipListener);
      bus.on('player:statsChanged', statsListener);

      const sword = { slot: 'weapon', name: 'Iron Sword', damage: 20 };
      player.equipItem(sword);

      expect(equipListener).toHaveBeenCalledWith(expect.objectContaining({
        slot: 'weapon',
        item: sword
      }));
      expect(statsListener).toHaveBeenCalled();

      player.unequipSlot('weapon');
      expect(unequipListener).toHaveBeenCalledWith(expect.objectContaining({
        slot: 'weapon',
        item: sword
      }));
    });
  });

  describe('CombatSystem Domain Decoupling', () => {
    it('executes attacks headlessly with null audio/particles and emits combat:attackLanded', () => {
      const combat = new CombatSystem(null, null, bus);
      const attackListener = vi.fn();
      bus.on('combat:attackLanded', attackListener);

      const attacker = {
        x: 0,
        y: 0,
        angle: 0,
        equipment: { weapon: { name: 'Cleaver', damage: 25, reach: 60 } }
      };
      const dummyTarget = {
        x: 30,
        y: 0,
        radius: 20,
        isBlocking: false
      };

      const hits = combat.performWeaponAttack(attacker, [dummyTarget]);
      expect(hits.length).toBe(1);
      expect(attackListener).toHaveBeenCalledTimes(1);
      expect(attackListener).toHaveBeenCalledWith(expect.objectContaining({
        attacker,
        weapon: attacker.equipment.weapon
      }));
    });

    it('emits combat:abilityUsed when chest ability is triggered', () => {
      const combat = new CombatSystem(null, null, bus);
      const abilityListener = vi.fn();
      bus.on('combat:abilityUsed', abilityListener);

      const player = new Player(0, 0, bus);
      player.equipment.chest = {
        visual: 'steel_chest',
        baseQ: 'iron_bastion'
      };

      const res = combat.triggerActiveAbility(player);
      expect(res).toBe(true);
      expect(abilityListener).toHaveBeenCalledWith(expect.objectContaining({
        player,
        ability: 'iron_bastion'
      }));
    });
  });

  describe('Monster Domain Decoupling', () => {
    it('emits monster:hit and monster:died on damage interactions', () => {
      const monster = new Monster({ hp: 50, speed: 100 }, bus);
      const hitListener = vi.fn();
      const diedListener = vi.fn();

      bus.on('monster:hit', hitListener);
      bus.on('monster:died', diedListener);

      // Non-fatal hit
      monster.takeHit(20);
      expect(hitListener).toHaveBeenCalledWith(expect.objectContaining({
        monster,
        damage: 20,
        isDead: false
      }));
      expect(diedListener).not.toHaveBeenCalled();

      // Fatal hit
      monster.takeHit(40);
      expect(monster.isDead).toBe(true);
      expect(diedListener).toHaveBeenCalledWith(expect.objectContaining({
        monster
      }));
    });

    it('emits monster:phase2 when boss reaches <= 50% HP', () => {
      const boss = new Monster({ archetype: 'boss', hp: 200, speed: 80 }, bus);
      const phase2Listener = vi.fn();
      bus.on('monster:phase2', phase2Listener);

      boss.takeHit(50); // 150 HP (75%)
      expect(phase2Listener).not.toHaveBeenCalled();

      boss.takeHit(60); // 90 HP (45% <= 50%)
      expect(phase2Listener).toHaveBeenCalledTimes(1);
      expect(boss.phase).toBe(2);
    });
  });

  describe('HUD Presenter Adapter', () => {
    it('subscribes to player:hudSync and updates DOM element properties', () => {
      const mockElements = {
        'hud-hp-fill': { style: {} },
        'hud-hp-text': { textContent: '' },
        'hud-stamina-fill': { style: {} },
        'odm-tactical-hud': {
          classList: {
            remove: vi.fn(),
            add: vi.fn(),
            toggle: vi.fn()
          }
        },
        'odm-big-gas-fill': { style: {} },
        'odm-big-gas-text': { textContent: '' }
      };

      const unsubscribe = initHudPresenter(bus, mockElements);

      // Normal state
      bus.emit('player:hudSync', {
        hp: 80,
        maxHp: 100,
        stamina: 60,
        maxStamina: 100,
        isDowned: false,
        isDead: false,
        isLeviActive: false
      });

      expect(mockElements['hud-hp-fill'].style.width).toBe('80%');
      expect(mockElements['hud-hp-fill'].style.backgroundColor).toBe('#00ff88');
      expect(mockElements['hud-hp-text'].textContent).toBe('80 / 100');
      expect(mockElements['hud-stamina-fill'].style.width).toBe('60%');
      expect(mockElements['odm-tactical-hud'].classList.add).toHaveBeenCalledWith('hidden');

      // Downed state
      bus.emit('player:hudSync', {
        hp: 0,
        maxHp: 100,
        isDowned: true,
        isDead: false,
        downedTimer: 15,
        maxDownedTimer: 30
      });

      expect(mockElements['hud-hp-fill'].style.width).toBe('50%');
      expect(mockElements['hud-hp-fill'].style.backgroundColor).toBe('#ef4444');
      expect(mockElements['hud-hp-text'].textContent).toContain('DOWNED [15s]');

      // Dead state
      bus.emit('player:hudSync', {
        isDead: true,
        isDowned: false
      });

      expect(mockElements['hud-hp-fill'].style.width).toBe('0%');
      expect(mockElements['hud-hp-text'].textContent).toBe('DEAD 💀');

      // Unsubscribe cleanup
      unsubscribe();
      bus.emit('player:hudSync', { hp: 100, maxHp: 100 });
      expect(mockElements['hud-hp-text'].textContent).toBe('DEAD 💀'); // Unchanged
    });
  });
});
