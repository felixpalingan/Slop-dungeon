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
      screenShake: 'reduced', // 'off' | 'reduced' | 'full'
      showFps: true,
      masterVolume: 80, // 0 - 100
      sfxVolume: 80, // 0 - 100
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

  applyPreset(presetName) {
    this.settings.preset = presetName;
    if (presetName === 'potato') {
      this.settings.enableGlow = false;
      this.settings.particleQuality = 'low';
      this.settings.damageNumbers = 'minimal';
      this.settings.screenShake = 'off';
    } else if (presetName === 'balanced') {
      this.settings.enableGlow = false;
      this.settings.particleQuality = 'medium';
      this.settings.damageNumbers = 'full';
      this.settings.screenShake = 'reduced';
    } else if (presetName === 'high') {
      this.settings.enableGlow = true;
      this.settings.particleQuality = 'high';
      this.settings.damageNumbers = 'full';
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
