import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CinematicManager } from '../../src/cinematics.js';
import { Player } from '../../src/player.js';
import { CombatSystem } from '../../src/combat.js';
import { ITEM_CATALOG, checkSetBonus } from '../../src/items.js';

describe('Phase 2: Levi Ackerman ODM Overdrive Revamp (Always-On ODM + Unlimited Gas + Super Slice)', () => {
  let cinematics;
  let player;
  let mockAudio;

  beforeEach(() => {
    mockAudio = {
      playLeviOverdriveWindup: vi.fn(),
      playLeviOverdriveImpact: vi.fn(),
      playOdmGasHiss: vi.fn(),
      playGrappleWireLaunch: vi.fn(),
      playSnapBladesSlash: vi.fn()
    };
    cinematics = new CinematicManager({ audio: mockAudio });
    cinematics.audio = mockAudio;
    player = new Player(0, 0);
    player.angle = 0;
  });

  describe('Base ODM Cable Mechanics (Without Overdrive)', () => {
    it('consumes 10 gas per cable launch and prevents firing when gas < 10', () => {
      expect(player.odmGas).toBe(100);
      const fired = player.fireOdmCable(300, 0, mockAudio);
      expect(fired).toBe(true);
      expect(player.odmGas).toBe(90);
      expect(player.isAirborne).toBe(true);
      expect(player.activeCables.length).toBe(1);

      // Drain gas below 10
      player.odmGas = 5;
      const failedFire = player.fireOdmCable(300, 100, mockAudio);
      expect(failedFire).toBe(false);
    });

    it('base ODM Harness chest Q (without full set) refills +40 gas and triggers steam lunge', () => {
      const combat = new CombatSystem(mockAudio);
      player.equipment = {
        chest: ITEM_CATALOG.odm_harness,
        weapon: ITEM_CATALOG.dual_snap_blades
      };
      player.odmGas = 30;

      const setBonus = checkSetBonus(player.equipment);
      expect(setBonus).toBeNull();

      const triggered = combat.triggerActiveAbility(player, null, vi.fn());
      expect(triggered).toBe(true);
      expect(player.odmGas).toBe(70); // 30 + 40 refilled!
    });
  });

  describe('Full Set Ultimate [Q]: ODM Overdrive (Unlimited Gas + +45% Pull Speed + 155 Damage)', () => {
    it('activates 6.0s ODM Overdrive, refills gas to 100, and triggers Wings of Freedom cinematic', () => {
      const combat = new CombatSystem(mockAudio);
      const triggerSpy = vi.fn();

      player.equipment = {
        helmet: ITEM_CATALOG.scout_hood,
        chest: ITEM_CATALOG.odm_harness,
        pants: ITEM_CATALOG.scout_trousers,
        boots: ITEM_CATALOG.scout_boots,
        weapon: ITEM_CATALOG.dual_snap_blades
      };
      player.odmGas = 20;

      const setBonus = checkSetBonus(player.equipment);
      expect(setBonus).not.toBeNull();
      expect(setBonus.ultimateQ).toBe('levi_grapple_whirlwind');

      const fired = combat.triggerActiveAbility(player, setBonus, triggerSpy);
      expect(fired).toBe(true);
      expect(player.isOdmMode).toBe(true);
      expect(player.isOdmOverdrive).toBe(true);
      expect(player.odmOverdriveTimer).toBe(6.0);
      expect(player.odmGas).toBe(100);
      expect(mockAudio.playLeviOverdriveWindup).toHaveBeenCalledTimes(1);
      expect(triggerSpy).toHaveBeenCalledWith('levi_grapple_whirlwind', player);
    });

    it('grants Unlimited Gas (0 gas consumed across 15+ cable launches) while Overdrive is active', () => {
      cinematics.trigger('levi_grapple_whirlwind', player);
      expect(player.isOdmOverdrive).toBe(true);

      // Fire 15 cables in a row; gas should remain locked at 100%
      for (let i = 0; i < 15; i++) {
        const ok = player.fireOdmCable(400, (i % 2 === 0 ? 150 : -150), mockAudio);
        expect(ok).toBe(true);
        expect(player.odmGas).toBe(100);
      }
    });

    it('boosts ODM cable pull velocity by +45% during Overdrive', () => {
      const mockInput = {
        keys: new Set(),
        mouse: { x: 200, y: 0, screenX: 600, screenY: 360 }
      };

      // Normal 1-cable speed = 650
      player.fireOdmCable(500, 0);
      player.update(0.016, mockInput);
      const normalSpeed = Math.round(Math.hypot(player.vx, player.vy));
      expect(normalSpeed).toBe(650);

      // Activate Overdrive -> 1-cable speed = round(650 * 1.45) = 943, 2-cable speed = round(740 * 1.45) = 1073
      player.activeCables = [];
      player.isOdmOverdrive = true;
      player.odmOverdriveTimer = 6.0;
      player.fireOdmCable(500, 0);
      player.update(0.016, mockInput);
      const overdriveSingleSpeed = Math.round(Math.hypot(player.vx, player.vy));
      expect(overdriveSingleSpeed).toBe(Math.round(650 * 1.45));

      // Fire second cable -> dual-cable slingshot Overdrive speed
      player.fireOdmCable(500, 100);
      player.update(0.016, mockInput);
      const overdriveDualSpeed = Math.round(Math.hypot(player.vx, player.vy));
      expect(overdriveDualSpeed).toBe(Math.round(740 * 1.45));
    });

    it('initiates 0.36s Wings of Freedom freeze cut-in (progress < 0.06), then unfreezes and deals 155 slice damage', () => {
      cinematics.trigger('levi_grapple_whirlwind', player);
      expect(cinematics.isLeviOverdriveFreezing()).toBe(true);

      // Advance 0.2s (progress = 0.2 / 6.0 = 0.033 < 0.06) -> still frozen
      cinematics.update(0.2, []);
      expect(cinematics.isLeviOverdriveFreezing()).toBe(true);

      // Advance past 0.36s threshold (0.2s more -> 0.4s total, progress = 0.066 >= 0.06)
      player.isAirborne = true;
      const titanTarget = { id: 'beast_titan', x: 50, y: 0, radius: 26 };
      const hits = [];

      cinematics.update(0.2, [titanTarget], (target, hitInfo) => {
        hits.push({ target, hitInfo });
      });

      expect(cinematics.isLeviOverdriveFreezing()).toBe(false);
      expect(mockAudio.playLeviOverdriveImpact).toHaveBeenCalledTimes(1);
      expect(hits.length).toBe(1);
      expect(hits[0].target).toBe(titanTarget);
      expect(hits[0].hitInfo.damage).toBe(155);
    });
  });
});
