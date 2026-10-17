/**
 * Procedural Web Audio API sound generator for Dungeon Slop
 * Zero external audio files required. All audio is synthesized in real-time.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.rawCtx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.8;
    this.bgmVolume = 0.6;
    this.initialized = false;
    this.lastPlayTimes = new Map();

    // BGM Sequencer state
    this.currentBgmTrack = 'none';
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmNextNoteTime = 0;
  }

  init() {
    try {
      if (!this.rawCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const raw = new AudioContext();
          this.rawCtx = raw;

          this.masterGain = raw.createGain();
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, raw.currentTime);
          this.masterGain.connect(raw.destination);

          this.sfxGain = raw.createGain();
          this.sfxGain.gain.setValueAtTime(this.sfxVolume, raw.currentTime);
          this.sfxGain.connect(this.masterGain);

          this.bgmGain = raw.createGain();
          this.bgmGain.gain.setValueAtTime(this.bgmVolume, raw.currentTime);
          this.bgmGain.connect(this.masterGain);

          const sfxNode = this.sfxGain;
          this.ctx = new Proxy(raw, {
            get(target, prop) {
              if (prop === 'destination') {
                return sfxNode;
              }
              const val = target[prop];
              return typeof val === 'function' ? val.bind(target) : val;
            }
          });
          this.initialized = true;
        }
      }
      if (this.rawCtx && this.rawCtx.state === 'suspended') {
        this.rawCtx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureContext() {
    this.init();
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.rawCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.rawCtx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.rawCtx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.rawCtx.currentTime);
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.rawCtx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.rawCtx.currentTime);
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.masterGain && this.rawCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.rawCtx.currentTime);
    }
  }

  canPlay(key = 'default', throttleMs = 35) {
    if (this.isMuted || this.masterVolume <= 0 || this.sfxVolume <= 0) return false;
    const now = performance.now();
    const last = this.lastPlayTimes.get(key) || 0;
    if (now - last < throttleMs) return false;
    this.lastPlayTimes.set(key, now);
    return true;
  }

  // =========================================================================
  // PROCEDURAL BGM SOUNDTRACK ENGINE (STEP 5.8)
  // =========================================================================

  playBgmNote(freq, time, duration = 0.45, waveType = 'triangle', filterFreq = 1200, gainLevel = 0.18) {
    if (!this.rawCtx || !this.bgmGain || this.isMuted) return;
    try {
      const osc = this.rawCtx.createOscillator();
      const noteGain = this.rawCtx.createGain();
      const filter = this.rawCtx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, filterFreq * 0.4), time + duration);

      // Plucked / chime envelope: instant attack, exponential decay
      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch (e) {
      // Ignored
    }
  }

  playBgmSubBass(freq, time, duration = 1.2, gainLevel = 0.22) {
    if (!this.rawCtx || !this.bgmGain || this.isMuted) return;
    try {
      const osc = this.rawCtx.createOscillator();
      const noteGain = this.rawCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch (e) {
      // Ignored
    }
  }

  playBgmPulse(time, isAccent = false) {
    if (!this.rawCtx || !this.bgmGain || this.isMuted) return;
    try {
      const osc = this.rawCtx.createOscillator();
      const gain = this.rawCtx.createGain();
      osc.type = 'sine';
      const startFreq = isAccent ? 85 : 60;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(26, time + 0.12);

      gain.gain.setValueAtTime(isAccent ? 0.2 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + 0.15);
    } catch (e) {
      // Ignored
    }
  }

  updateBgmTrack(trackName) {
    if (this.currentBgmTrack === trackName) return;
    this.playBgmTrack(trackName);
  }

  playBgmTrack(trackName) {
    this.currentBgmTrack = trackName;
    if (trackName === 'none') {
      this.stopBgm();
      return;
    }
    this.ensureContext();
    if (!this.rawCtx || !this.bgmGain) return;

    if (!this.bgmTimer) {
      this.bgmStep = 0;
      this.bgmNextNoteTime = this.rawCtx.currentTime + 0.05;
      this.bgmTimer = setInterval(() => this.scheduleBgm(), 75);
    }
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgmTrack = 'none';
  }

  scheduleBgm() {
    if (!this.rawCtx || this.currentBgmTrack === 'none' || this.isMuted || this.bgmVolume <= 0) return;

    const scheduleHorizon = this.rawCtx.currentTime + 0.25;

    let stepDuration = 0.28;
    if (this.currentBgmTrack === 'lobby') stepDuration = 0.28;
    else if (this.currentBgmTrack === 'dungeon') stepDuration = 0.25;
    else if (this.currentBgmTrack === 'boss') stepDuration = 0.13;
    else if (this.currentBgmTrack === 'opm') stepDuration = 0.14;

    while (this.bgmNextNoteTime < scheduleHorizon) {
      const time = this.bgmNextNoteTime;
      const step = this.bgmStep;

      if (this.currentBgmTrack === 'lobby') {
        // Safe haven / campfire melodic plucked arpeggio: A-minor -> F-maj -> C-maj -> G-maj
        const cycle = step % 32;
        const lobbyScaleA = [220.00, 261.63, 329.63, 440.00, 329.63, 261.63]; // Am
        const lobbyScaleF = [174.61, 220.00, 261.63, 349.23, 261.63, 220.00]; // F
        const lobbyScaleC = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C
        const lobbyScaleG = [196.00, 246.94, 293.66, 392.00, 293.66, 246.94]; // G

        let chordNotes = lobbyScaleA;
        let bassNote = 110.0; // A2
        if (cycle >= 8 && cycle < 16) {
          chordNotes = lobbyScaleF;
          bassNote = 87.31; // F2
        } else if (cycle >= 16 && cycle < 24) {
          chordNotes = lobbyScaleC;
          bassNote = 130.81; // C3
        } else if (cycle >= 24) {
          chordNotes = lobbyScaleG;
          bassNote = 98.0; // G2
        }

        // Sub bass drone on chord change (step 0, 8, 16, 24)
        if (cycle % 8 === 0) {
          this.playBgmSubBass(bassNote, time, 2.2, 0.22);
        }

        // Gentle lute arpeggio note
        const noteIdx = cycle % chordNotes.length;
        const noteFreq = chordNotes[noteIdx];
        this.playBgmNote(noteFreq, time, 0.42, 'triangle', 1400, 0.15);

      } else if (this.currentBgmTrack === 'dungeon') {
        // Dark Phrygian descent in D (D, Eb, F, G, A, Bb, C)
        const cycle = step % 32;
        const dungeonScale = [146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 293.66, 311.13];

        // Heartbeat sub-bass kick on steps 0, 8, 16, 24
        if (cycle % 8 === 0) {
          this.playBgmPulse(time, true);
          this.playBgmSubBass(73.42, time, 1.8, 0.25); // D2 sub bass
        } else if (cycle % 8 === 4) {
          this.playBgmPulse(time, false);
        }

        // Ominous bell/chime notes on syncopated beats
        if (cycle % 4 === 2) {
          const chimeFreq = dungeonScale[(cycle * 3) % dungeonScale.length];
          this.playBgmNote(chimeFreq, time, 0.55, 'sine', 950, 0.14);
        } else if (cycle % 8 === 6) {
          const dissonantFreq = dungeonScale[(cycle + 1) % dungeonScale.length];
          this.playBgmNote(dissonantFreq * 1.5, time, 0.45, 'triangle', 750, 0.11);
        }

      } else if (this.currentBgmTrack === 'boss') {
        // High-tempo driving battle theme
        const cycle = step % 16;
        const bassRiff = [146.83, 146.83, 174.61, 146.83, 220.00, 146.83, 233.08, 146.83];
        const bassNote = bassRiff[cycle % bassRiff.length];

        // Driving 16th note bassline
        this.playBgmNote(bassNote, time, 0.11, 'sawtooth', 750, 0.17);

        // Kick pulse on quarter beats
        if (cycle % 4 === 0) {
          this.playBgmPulse(time, true);
          this.playBgmSubBass(73.42, time, 0.4, 0.26);
        }

        // Dramatic brass lead stabs on steps 4, 10, 14
        if (cycle === 4 || cycle === 10 || cycle === 14) {
          const leadFreq = (cycle === 4) ? 293.66 : (cycle === 10 ? 349.23 : 440.00);
          this.playBgmNote(leadFreq, time, 0.28, 'sawtooth', 1800, 0.2);
          this.playBgmNote(leadFreq * 1.5, time, 0.28, 'triangle', 2200, 0.13);
        }
      } else if (this.currentBgmTrack === 'opm') {
        // High-energy driving hard rock gallop (One Punch Man theme style: E-minor rock progression)
        const cycle = step % 16;
        const opmRiff = [164.81, 164.81, 196.00, 164.81, 220.00, 196.00, 164.81, 246.94]; // E-G-E-A-G-E-B
        const noteFreq = opmRiff[cycle % opmRiff.length];

        // Heavy distortion-filtered sawtooth riff
        this.playBgmNote(noteFreq, time, 0.12, 'sawtooth', 1400, 0.20);
        this.playBgmNote(noteFreq * 2, time, 0.10, 'triangle', 2000, 0.12);

        // Punchy double-kick drum on driving beats
        if (cycle % 4 === 0 || cycle % 4 === 2) {
          this.playBgmPulse(time, cycle % 4 === 0);
          this.playBgmSubBass(82.41, time, 0.35, 0.28); // E2 bass thump
        }

        // Heroic brass synth lead blast on phrase accents (steps 0, 6, 12)
        if (cycle === 0 || cycle === 6 || cycle === 12) {
          const leadTone = cycle === 0 ? 329.63 : (cycle === 6 ? 392.00 : 493.88); // E4, G4, B4
          this.playBgmNote(leadTone, time, 0.24, 'sawtooth', 2200, 0.18);
        }
      }

      this.bgmStep++;
      this.bgmNextNoteTime += stepDuration;
    }
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

  /**
   * Arasaka Security Drone: High-frequency servo/propeller hum
   */
  playDroneHum() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.setValueAtTime(480, now + 0.04);
      osc.frequency.setValueAtTime(390, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      console.warn('Audio error in Drone Hum:', e);
    }
  }

  /**
   * Tyger Claw Sniper: Cybernetic high-velocity laser shot
   */
  playLaserShot() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.09);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio error in Laser Shot:', e);
    }
  }

  /**
   * Adam Smasher Micro-Missile Launch whoosh
   */
  playMissileLaunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.32);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn('Audio error in Missile Launch:', e);
    }
  }

  /**
   * Maelstrom Cyberpsycho / Adam Smasher: Hydraulic heavy cyber slam
   */
  playCyberSlam() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio error in Cyber Slam:', e);
    }
  }

  /**
   * Boss Phase 2 Transition: Demonic Enrage Roar
   */
  playEnrageRoar() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.85);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(55, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.85);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.9);
      sub.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio error in Enrage Roar:', e);
    }
  }

  /**
   * Finger Bearer: Domain Expansion Shockwave
   */
  playDomainShockwave() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.65);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio error in Domain Shockwave:', e);
    }
  }

  /**
   * Adam Smasher: Catastrophic Core Overload & Explosion
   */
  playCoreOverload() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-pitched warning alarm rising
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.6);
      osc.frequency.linearRampToValueAtTime(100, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch (e) {
      console.warn('Audio error in Core Overload:', e);
    }
  }

  /**
   * Finger Bearer Phase 2: Black Flash Impact
   */
  playBlackFlash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      sub.type = 'sine';
      sub.frequency.setValueAtTime(90, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.35);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.35);
      sub.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error in Black Flash:', e);
    }
  }

  /**
   * Finger Bearer: Cursed Energy Beam charging and fire
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
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio error in Cursed Energy Beam:', e);
    }
  }

  /**
   * Finger Bearer: Cursed Ground Eruption Stomp
   */
  playCursedStomp() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + 0.4);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.4);
      sub.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio error in Cursed Stomp:', e);
    }
  }

  /**
   * Armored Titan: Sub-bass guttural titan roar
   */
  playTitanRoar() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(50, now);
      sub.frequency.exponentialRampToValueAtTime(24, now + 0.9);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.95);
      sub.stop(now + 0.95);
    } catch (e) {
      console.warn('Audio error in Titan Roar:', e);
    }
  }

  /**
   * Armored Titan: Scalding high-pressure steam hiss vent
   */
  playSteamHiss() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // White noise buffer for steam
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.6);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio error in Steam Hiss:', e);
    }
  }

  /**
   * Armored Titan: Crystalline hardening armor fracture & glass shatter
   */
  playArmorShatter() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2400, now);
      osc1.frequency.exponentialRampToValueAtTime(450, now + 0.4);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3600, now);
      osc2.frequency.exponentialRampToValueAtTime(800, now + 0.35);

      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(1200, now);
      osc3.frequency.exponentialRampToValueAtTime(120, now + 0.5);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
      osc3.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error in Armor Shatter:', e);
    }
  }

  /**
   * Giant titan footstep / heavy ground impact
   */
  playTitanThud() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.28);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio error in Titan Thud:', e);
    }
  }

  /**
   * Bright gold coin pickup / Slops collection sound
   */
  playCoinPickup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio error in Coin Pickup:', e);
    }
  }

  /**
   * Cash register / merchant purchase chime
   */
  playShopBuy() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.18);
      });
    } catch (e) {
      console.warn('Audio error in Shop Buy:', e);
    }
  }

  /**
   * Clinking coins sound when selling items to Slop Merchant
   */
  playShopSell() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400 + Math.random() * 400, now + i * 0.04);
        gain.gain.setValueAtTime(0.18, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.12);
      }
    } catch (e) {
      console.warn('Audio error in Shop Sell:', e);
    }
  }

  /**
   * Heavy anvil hammer impact with metallic resonance and spark fizzle
   */
  playForgeHammer() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Anvil high ping
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(2400, now);
      ping.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
      pingGain.gain.setValueAtTime(0.4, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      ping.start(now);
      ping.stop(now + 0.45);

      // Heavy hammer body thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(160, now);
      thud.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      thudGain.gain.setValueAtTime(0.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now);
      thud.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error in Forge Hammer:', e);
    }
  }

  /**
   * Mechanical tick click for Spin-a-Wheel gacha
   */
  playWheelTick(pitch = 1.0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      console.warn('Audio error in Wheel Tick:', e);
    }
  }

  /**
   * High-pressure RPG rocket launch whoosh
   */
  playRocketLaunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error in Rocket Launch:', e);
    }
  }

  /**
   * Catastrophic RPG rocket explosion / AoE blast
   */
  playRocketExplosion() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error in Rocket Explosion:', e);
    }
  }

  /**
   * Crisp card deal swoosh for Blackjack
   */
  playCardFlip() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn('Audio error in Card Flip:', e);
    }
  }

  /**
   * Ceramic casino chip clink for placing bets
   */
  playChipClink() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1600 + Math.random() * 200, now);
      osc1.frequency.exponentialRampToValueAtTime(700, now + 0.06);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2400 + Math.random() * 300, now);
      osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.07);
      osc2.stop(now + 0.07);
    } catch (e) {
      console.warn('Audio error in Chip Clink:', e);
    }
  }

  /**
   * Cheerful casino victory fanfare (Natural 21 / Dealer Bust)
   */
  playCasinoWin(isBlackjack = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = isBlackjack ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch (e) {
      console.warn('Audio error in Casino Win:', e);
    }
  }

  /**
   * Low disappointed thud when player busts or loses hand
   */
  playCasinoBust() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error in Casino Bust:', e);
    }
  }

  /**
   * Cash register chime & dice tumble for shop reroll
   */
  playCashReroll() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Coin chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Dice rattle
      for (let i = 0; i < 4; i++) {
        const rattle = this.ctx.createOscillator();
        const rattleGain = this.ctx.createGain();
        const t = now + i * 0.04;
        rattle.type = 'triangle';
        rattle.frequency.setValueAtTime(350 + Math.random() * 150, t);
        rattleGain.gain.setValueAtTime(0.12, t);
        rattleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        rattle.connect(rattleGain);
        rattleGain.connect(this.ctx.destination);
        rattle.start(t);
        rattle.stop(t + 0.035);
      }
    } catch (e) {
      console.warn('Audio error in Cash Reroll:', e);
    }
  }

  /**
   * Dramatic heavy impact & dissonant tritone cue when player enters Downed state
   */
  playPlayerDowned() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy sub-bass drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.55);

      // Lowpass filter for heavy muffling
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 0.55);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);

      // Somber dissonant alarm stingers (tritone interval)
      const freqs = [277.18, 392.0]; // C#4 & G4 tritone
      freqs.forEach((f, idx) => {
        const sting = this.ctx.createOscillator();
        const stingGain = this.ctx.createGain();
        sting.type = 'sine';
        sting.frequency.setValueAtTime(f, now + 0.05);
        stingGain.gain.setValueAtTime(0.18, now + 0.05);
        stingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        sting.connect(stingGain);
        stingGain.connect(this.ctx.destination);
        sting.start(now + 0.05);
        sting.stop(now + 0.75);
      });
    } catch (e) {
      console.warn('Audio error in Player Downed:', e);
    }
  }

  /**
   * Ethereal pulsing chime while holding [E] to revive
   */
  playRevivingPulse() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio error in Reviving Pulse:', e);
    }
  }

  /**
   * Triumphant golden arpeggio fanfare when teammate is successfully revived
   */
  playRevivedFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0.00 }, // C5
        { f: 659.25, t: 0.10 }, // E5
        { f: 783.99, t: 0.20 }, // G5
        { f: 1046.50, t: 0.32 } // C6
      ];

      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.22, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + 0.38);
      });
    } catch (e) {
      console.warn('Audio error in RevivedFanfare:', e);
    }
  }

  /**
   * Urgent high-pitched ticking beep when Kamikaze Exploder primes its fuse
   */
  playFuseBeep() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(2400, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio error in FuseBeep:', e);
    }
  }

  /**
   * Resonant celestial chord hum when Shaman channels protective ward & speed aura
   */
  playShamanBuff() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [392.00, 493.88, 587.33, 783.99]; // G major radiant triad (G4, B4, D5, G5)
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.8);

        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
      });
    } catch (e) {
      console.warn('Audio error in ShamanBuff:', e);
    }
  }

  /**
   * Deep haunting dissonant gong when entire party wipes / game over
   */
  playGameOverGong() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Dissonant low frequency drone & metallic bell
      const freqs = [55, 110, 155.56, 220, 233.08]; // Minor second dissonance
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.92, now + 3.2);

        const vol = idx === 0 ? 0.35 : 0.18;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

        // Lowpass filter for muffled dark resonance
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 3.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.2);
      });
    } catch (e) {
      console.warn('Audio error in GameOverGong:', e);
    }
  }

  /**
   * Grand celebratory fanfare upon conquering the 3rd floor boss
   */
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const melody = [
        { f: 261.63, t: 0.00, d: 0.20 }, // C4
        { f: 329.63, t: 0.16, d: 0.20 }, // E4
        { f: 392.00, t: 0.32, d: 0.20 }, // G4
        { f: 523.25, t: 0.48, d: 0.45 }, // C5
        { f: 659.25, t: 0.85, d: 0.25 }, // E5
        { f: 783.99, t: 1.05, d: 0.25 }, // G5
        { f: 1046.5, t: 1.25, d: 1.20 }  // High C6 sustained triumphant
      ];

      melody.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.24, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch (e) {
      console.warn('Audio error in VictoryFanfare:', e);
    }
  }

  /**
   * Resonant golden treasure chest opening creak and celestial sparkle chime
   */
  playChestOpen() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy golden latch click
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(440, now);
      click.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      clickGain.gain.setValueAtTime(0.22, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      click.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      click.start(now);
      click.stop(now + 0.08);

      // Celestial golden arpeggio chime [E5, G#5, B5, E6]
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const noteTime = now + 0.06 + idx * 0.07;
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {
      console.warn('Audio error in ChestOpen:', e);
    }
  }
}


