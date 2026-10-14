/**
 * Comprehensive Graphics & Audio Performance Settings System for Slop Dungeon
 * Provides Presets (Potato / Balanced / High), ShadowBlur glow toggle,
 * particle quality control, audio master/sfx volumes, and real-time FPS monitoring.
 */

export class SettingsManager {
  constructor() {
    this.storageKey = 'slop_dungeon_settings';
    this.settings = {
      preset: 'balanced', // 'potato' | 'balanced' | 'high' | 'custom'
      enableGlow: false, // Canvas shadowBlur bypass (HUGE performance factor!)
      particleQuality: 'medium', // 'low' (30%) | 'medium' (60%) | 'high' (100%)
      damageNumbers: 'full', // 'off' | 'minimal' | 'full'
      showDamageText: true,
      screenShake: 'reduced', // 'off' | 'reduced' | 'full'
      showFps: true,
      masterVolume: 80, // 0 - 100
      sfxVolume: 80, // 0 - 100
      bgmVolume: 60, // 0 - 100
      isMuted: false
    };

    this.load();
    this.initGlowInterceptor();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load settings from localStorage:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }

  update(partial) {
    if (!partial) return;
    this.settings = { ...this.settings, ...partial };

    // Keep damageNumbers and showDamageText in sync
    if (partial.damageNumbers !== undefined) {
      this.settings.showDamageText = partial.damageNumbers !== 'off';
    } else if (partial.showDamageText !== undefined) {
      this.settings.damageNumbers = partial.showDamageText ? 'full' : 'off';
    }

    if (!partial.preset) {
      this.checkPresetMatch();
    }

    this.save();
  }

  checkPresetMatch() {
    const s = this.settings;
    if (!s.enableGlow && s.particleQuality === 'low' && s.damageNumbers === 'minimal' && s.screenShake === 'off') {
      this.settings.preset = 'potato';
    } else if (!s.enableGlow && s.particleQuality === 'medium' && s.damageNumbers === 'full' && s.screenShake === 'reduced') {
      this.settings.preset = 'balanced';
    } else if (s.enableGlow && s.particleQuality === 'high' && s.damageNumbers === 'full' && s.screenShake === 'full') {
      this.settings.preset = 'high';
    } else {
      this.settings.preset = 'custom';
    }
  }

  applyPreset(presetName) {
    this.settings.preset = presetName;
    if (presetName === 'potato') {
      this.settings.enableGlow = false;
      this.settings.particleQuality = 'low';
      this.settings.damageNumbers = 'minimal';
      this.settings.showDamageText = true;
      this.settings.screenShake = 'off';
    } else if (presetName === 'balanced') {
      this.settings.enableGlow = false;
      this.settings.particleQuality = 'medium';
      this.settings.damageNumbers = 'full';
      this.settings.showDamageText = true;
      this.settings.screenShake = 'reduced';
    } else if (presetName === 'high') {
      this.settings.enableGlow = true;
      this.settings.particleQuality = 'high';
      this.settings.damageNumbers = 'full';
      this.settings.showDamageText = true;
      this.settings.screenShake = 'full';
    }
    this.save();
  }

  getParticleMultiplier() {
    if (this.settings.particleQuality === 'low') return 0.3;
    if (this.settings.particleQuality === 'medium') return 0.6;
    return 1.0;
  }

  getMaxParticles() {
    if (this.settings.particleQuality === 'low') return 120;
    if (this.settings.particleQuality === 'medium') return 300;
    return 650;
  }

  getScreenShakeMultiplier() {
    if (this.settings.screenShake === 'off') return 0.0;
    if (this.settings.screenShake === 'reduced') return 0.5;
    return 1.0;
  }

  /**
   * Transparently intercepts CanvasRenderingContext2D.prototype.shadowBlur.
   * When enableGlow is false, bypasses expensive Gaussian blur passes completely!
   */
  initGlowInterceptor() {
    const self = this;
    try {
      if (typeof CanvasRenderingContext2D !== 'undefined') {
        const proto = CanvasRenderingContext2D.prototype;
        const origDesc = Object.getOwnPropertyDescriptor(proto, 'shadowBlur');
        if (origDesc && origDesc.set) {
          Object.defineProperty(proto, 'shadowBlur', {
            set(val) {
              if (!self.settings.enableGlow) {
                origDesc.set.call(this, 0);
              } else {
                origDesc.set.call(this, val);
              }
            },
            get() {
              return origDesc.get.call(this);
            },
            configurable: true
          });
        }
      }
    } catch (err) {
      console.warn('Canvas shadowBlur interceptor note:', err);
    }
  }
}
