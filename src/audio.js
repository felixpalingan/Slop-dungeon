/**
 * Procedural Web Audio API sound generator for Dungeon Slop
 * Zero external audio files required. All audio is synthesized in real-time.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
          this.initialized = true;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureContext() {
    this.init();
  }

  // =========================================================================
  // CORE MOVEMENT & BASIC SFX
  // =========================================================================

  /**
   * Air burst whoosh for Left Shift Dodge Roll
   */
  playRoll() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Standard weapon swing whoosh
   */
  playSwing() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Comic 'BONK!' / slap sound effect
   */
  playBonk() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Footstep subtle thud
   */
  playFootstep() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Fanfare sound played upon descent / ready circle completion
   */
  playDescentFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25]; // C E G C chord
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // =========================================================================
  // WEAPON-SPECIFIC ATTACK SOUNDS
  // =========================================================================

  /**
   * Gojo's Lapse Blue: Gravitational vacuum surge & cosmic suction pulse
   */
  playGravitationalSurge() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Inward vacuum sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);

      // Low bass gravity thud
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(90, now);
      bass.frequency.exponentialRampToValueAtTime(45, now + 0.2);
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Sukuna's Kamutoke: High-frequency electrical lightning snap
   */
  playLightningDagger() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Sukuna's Malevolent Cleaver: Heavy whistling butcher chop
   */
  playCleaverSlash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.24);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Toji's Inverted Spear & Chain: Metallic link rattle & sharp piercing jitte thrust
   */
  playChainThrust() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Chain rattle
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700 + i * 200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      }

      // Piercing spear thrust
      const spear = this.ctx.createOscillator();
      const spearGain = this.ctx.createGain();
      spear.type = 'sine';
      spear.frequency.setValueAtTime(620, now + 0.05);
      spear.frequency.exponentialRampToValueAtTime(180, now + 0.2);
      spearGain.gain.setValueAtTime(0.3, now + 0.05);
      spearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      spear.connect(spearGain);
      spearGain.connect(this.ctx.destination);
      spear.start(now + 0.05);
      spear.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Guts' Dragon Slayer: Colossal heavy iron wind roar
   */
  playHeavyGreatswordSwing() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.32);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Dragon Slayer Colossal Anvil CLANG! (On hit)
   */
  playClang() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [360, 720, 1080]; // Metallic harmonics
      freqs.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.45, now + 0.38);

        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Thunder Warhammer: Concussive seismic hammer slam with electrical resonance
   */
  playHammerSmash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low rumble impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.38);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);

      // Thunder buzz
      const thunder = this.ctx.createOscillator();
      const thunderGain = this.ctx.createGain();
      thunder.type = 'square';
      thunder.frequency.setValueAtTime(80, now);
      thunder.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      thunderGain.gain.setValueAtTime(0.2, now);
      thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      thunder.connect(thunderGain);
      thunderGain.connect(this.ctx.destination);
      thunder.start(now);
      thunder.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Crystal Scimitar: High-frequency crystalline shimmer slice
   */
  playCrystalSlash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Gojo's Reversal Red Off-hand Repulsion Blast
   */
  playRepulsionBurst() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Sukuna's Hiten Fire Spear Thrust
   */
  playFireSpear() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // =========================================================================
  // BASE CHEST ACTIVE ABILITIES (BASE Q)
  // =========================================================================

  /**
   * Gojo Tunic Base Q: Limitless Barrier forcefield resonance
   */
  playBarrierHum() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Sukuna Robe Base Q: Dismantle (3 rapid razor wind cuts)
   */
  playDismantleCuts() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850 + i * 150, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Toji Shirt Base Q: Spartan Kick (Pneumatic sonic boom)
   */
  playSpartanKick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Guts Berserker Plate Base Q: Cannon Arm (Heavy artillery detonation)
   */
  playExplosion() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low blast boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Steel Chest Base Q: Iron Bastion
   */
  playShieldLock() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Basic War Cry
   */
  playWarCry() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(360, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.5);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // =========================================================================
  // FULL SET CINEMATIC ULTIMATES (SPECIAL Q)
  // =========================================================================

  /**
   * Hollow Purple: Deep gravitational sub-bass vortex followed by thunderclap shockwave
   */
  playHollowPurple() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Sub-bass resonance rumble
      const oscBass = this.ctx.createOscillator();
      const gainBass = this.ctx.createGain();
      oscBass.type = 'sawtooth';
      oscBass.frequency.setValueAtTime(70, now);
      oscBass.frequency.exponentialRampToValueAtTime(32, now + 1.2);
      gainBass.gain.setValueAtTime(0.5, now);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      oscBass.connect(gainBass);
      gainBass.connect(this.ctx.destination);
      oscBass.start(now);
      oscBass.stop(now + 1.2);

      // High energy hollow harmonic ring
      const oscHigh = this.ctx.createOscillator();
      const gainHigh = this.ctx.createGain();
      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(420, now);
      oscHigh.frequency.exponentialRampToValueAtTime(880, now + 0.6);
      gainHigh.gain.setValueAtTime(0.35, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      oscHigh.connect(gainHigh);
      gainHigh.connect(this.ctx.destination);
      oscHigh.start(now);
      oscHigh.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio error in Hollow Purple:', e);
    }
  }

  /**
   * World Cutting Slash: Sudden dead silence followed by razor sharp dimensional rip snap
   */
  playWorldCuttingSlash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio error in World Cutting Slash:', e);
    }
  }

  /**
   * Inverted Spear Chain Rampage: Metallic chain whipping and whirling storm
   */
  playChainRampage() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const t = now + i * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 + i * 140, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.14);
      }
    } catch (e) {
      console.warn('Audio error in Chain Rampage:', e);
    }
  }

  /**
   * Berserker Roar: Demonic beast roar frequency modulation
   */
  playBerserkRoar() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.9);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio error in Berserk Roar:', e);
    }
  }

  // =========================================================================
  // LEVI ACKERMAN (ATTACK ON TITAN) SYNTHESIZERS
  // =========================================================================

  /**
   * Dual Ultrahard Steel Snap Blades: Crisp double metallic unsheathing slice
   */
  playSnapBladesSlash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + i * 400, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch (e) {
      console.warn('Audio error in Snap Blades Slash:', e);
    }
  }

  /**
   * ODM Gas Boost: High-pressure burst of compressed pneumatic steam
   */
  playOdmGasHiss() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.28;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.28);
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio error in ODM Gas Hiss:', e);
    }
  }

  /**
   * Grapple Wire Launch: Dual high-tension cable spool whir + metal anchor impact ping
   */
  playGrappleWireLaunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Spool whir
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // 2. Anchor CLINK!
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(2600, now + 0.08);
      ping.frequency.exponentialRampToValueAtTime(800, now + 0.22);

      pingGain.gain.setValueAtTime(0.4, now + 0.08);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      ping.start(now + 0.08);
      ping.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio error in Grapple Wire Launch:', e);
    }
  }

  /**
   * 360° Blade Whirlwind: Multi-hit centrifugal metallic shredding vortex
   */
  playBladeWhirlwind() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const t = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(950 + i * 180, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch (e) {
      console.warn('Audio error in Blade Whirlwind:', e);
    }
  }

  // --- DAVID MARTINEZ (CYBERPUNK: EDGERUNNERS) AUDIO ---

  /**
   * Carnage Shotgun: Devastating heavy explosive 12-gauge concussive BOOM!
   */
  playCarnageShotgun() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Concussive Gunpowder Blast (Low-pass filtered explosive noise)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.42);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Lowpass filter eliminates high-frequency whistle and gives a dense, room-shaking explosion
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(110, now + 0.36);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.42);

      // 2. Heavy Sub-Bass Boom Body (Sawtooth with steep lowpass cut)
      const bass = this.ctx.createOscillator();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(115, now);
      bass.frequency.exponentialRampToValueAtTime(26, now + 0.45);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(250, now);
      bassFilter.frequency.exponentialRampToValueAtTime(65, now + 0.4);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.8, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      bass.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.5);

      // 3. Chest-thumping Sub Sine (Pure 58Hz -> 20Hz thud)
      const sub = this.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(58, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + 0.38);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.75, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio error in Carnage Shotgun:', e);
    }
  }

  /**
   * Shotgun Pump Rack: Crisp mechanical dual click for reload
   */
  playShotgunPump() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Mechanical metallic clicks (two rapid clicks)
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850 - i * 120, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.04);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } catch (e) {
      console.warn('Audio error in Shotgun Pump:', e);
    }
  }

  /**
   * Gorilla Punch: Heavy hydraulic piston pressure release + thud impact
   */
  playGorillaPunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Hydraulic piston hiss
      const hiss = this.ctx.createOscillator();
      hiss.type = 'sawtooth';
      hiss.frequency.setValueAtTime(3500, now);
      hiss.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.25, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      hiss.connect(hissGain);
      hissGain.connect(this.ctx.destination);
      hiss.start(now);
      hiss.stop(now + 0.1);

      // Heavy thud impact
      const thud = this.ctx.createOscillator();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(95, now + 0.04);
      thud.frequency.exponentialRampToValueAtTime(35, now + 0.2);
      const thudGain = this.ctx.createGain();
      thudGain.gain.setValueAtTime(0.5, now + 0.04);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now + 0.04);
      thud.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio error in Gorilla Punch:', e);
    }
  }

  /**
   * Sandevistan Boot: Iconic high-pitch rising digital chirp (BWEEEEE-SHOOOM)
   */
  playSandevistanBoot() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Rising digital chirp (BWEEEEE)
      const chirp = this.ctx.createOscillator();
      chirp.type = 'sawtooth';
      chirp.frequency.setValueAtTime(220, now);
      chirp.frequency.exponentialRampToValueAtTime(3200, now + 0.35);
      chirp.frequency.exponentialRampToValueAtTime(1600, now + 0.5);
      const chirpGain = this.ctx.createGain();
      chirpGain.gain.setValueAtTime(0.15, now);
      chirpGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      chirp.connect(chirpGain);
      chirpGain.connect(this.ctx.destination);
      chirp.start(now);
      chirp.stop(now + 0.55);

      // SHOOOM bass drop
      const boom = this.ctx.createOscillator();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(180, now + 0.35);
      boom.frequency.exponentialRampToValueAtTime(40, now + 0.7);
      const boomGain = this.ctx.createGain();
      boomGain.gain.setValueAtTime(0.45, now + 0.35);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start(now + 0.35);
      boom.stop(now + 0.75);

      // Digital glitch accents
      for (let i = 0; i < 3; i++) {
        const t = now + 0.08 + i * 0.1;
        const glitch = this.ctx.createOscillator();
        glitch.type = 'square';
        glitch.frequency.setValueAtTime(1400 + i * 600, t);
        glitch.frequency.exponentialRampToValueAtTime(800, t + 0.04);
        const glitchGain = this.ctx.createGain();
        glitchGain.gain.setValueAtTime(0.1, t);
        glitchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        glitch.connect(glitchGain);
        glitchGain.connect(this.ctx.destination);
        glitch.start(t);
        glitch.stop(t + 0.05);
      }
    } catch (e) {
      console.warn('Audio error in Sandevistan Boot:', e);
    }
  }

  /**
   * Slow-Mo Ticking: Sub-bass ticking heartbeat pulse during slow motion
   */
  playSlowMoTick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const tick = this.ctx.createOscillator();
      tick.type = 'sine';
      tick.frequency.setValueAtTime(50, now);
      tick.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      const tickGain = this.ctx.createGain();
      tickGain.gain.setValueAtTime(0.3, now);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      tick.connect(tickGain);
      tickGain.connect(this.ctx.destination);
      tick.start(now);
      tick.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio error in Slow Mo Tick:', e);
    }
  }

  /**
   * Sandevistan End: Power down deceleration whine
   */
  playSandevistanEnd() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const whine = this.ctx.createOscillator();
      whine.type = 'sawtooth';
      whine.frequency.setValueAtTime(2400, now);
      whine.frequency.exponentialRampToValueAtTime(120, now + 0.6);
      const whineGain = this.ctx.createGain();
      whineGain.gain.setValueAtTime(0.25, now);
      whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      whine.connect(whineGain);
      whineGain.connect(this.ctx.destination);
      whine.start(now);
      whine.stop(now + 0.65);

      // Sub-bass power down thud
      const thud = this.ctx.createOscillator();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(100, now + 0.15);
      thud.frequency.exponentialRampToValueAtTime(25, now + 0.5);
      const thudGain = this.ctx.createGain();
      thudGain.gain.setValueAtTime(0.35, now + 0.15);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now + 0.15);
      thud.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio error in Sandevistan End:', e);
    }
  }

  /**
   * Floor Descent Fanfare: Resonant descending chime
   */
  playDescentFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 330, 261];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.3, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn('Audio error in Descent Fanfare:', e);
    }
  }

  /**
   * Boss Victory Fanfare: Glorious ascending triumphant chord
   */
  playBossVictoryFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.35, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.6);
      });
    } catch (e) {
      console.warn('Audio error in Boss Victory Fanfare:', e);
    }
  }

  /**
   * Container Break: Ceramic clay shatter sound
   */
  playContainerShatter() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio error in Container Shatter:', e);
    }
  }

  /**
   * Fly Head buzzing sound
   */
  playFlyHeadBuzz() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(380, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio error in Fly Head Buzz:', e);
    }
  }

  /**
   * Finger Bearer Cursed Energy Beam blast
   */
  playCursedEnergyBeam() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error in Cursed Energy Beam:', e);
    }
  }

  /**
   * Heavy iron grate slam / room lockdown SFX
   */
  playDoorLock() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Low metallic heavy impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Iron gate rattle noise
      const rattle = this.ctx.createOscillator();
      const rattleGain = this.ctx.createGain();
      rattle.type = 'sawtooth';
      rattle.frequency.setValueAtTime(440, now);
      rattle.frequency.setValueAtTime(220, now + 0.08);
      rattle.frequency.setValueAtTime(580, now + 0.16);
      rattleGain.gain.setValueAtTime(0.18, now);
      rattleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      rattle.connect(rattleGain);
      rattleGain.connect(this.ctx.destination);
      rattle.start(now);
      rattle.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error in Door Lock:', e);
    }
  }

  /**
   * Mechanical latch unclick and unlock chime
   */
  playDoorUnlock() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical latch click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.06);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio error in Door Unlock:', e);
    }
  }

  /**
   * Triumphant retro roguelike Room Cleared fanfare (Ascending major chords)
   */
  playRoomClear() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
    } catch (e) {
      console.warn('Audio error in Room Clear Fanfare:', e);
    }
  }
}
