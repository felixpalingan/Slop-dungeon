/**
 * HUD Presenter Adapter
 * Subscribes to domain EventBus events (e.g. 'player:hudSync') and
 * updates the browser DOM elements accordingly.
 * (Ref: ADR-001)
 */

export function initHudPresenter(eventBus, customElements = null) {
  if (typeof document === 'undefined' && !customElements) {
    // In headless environments without explicit element mocks, do nothing
    return () => {};
  }

  const getEl = (id) => {
    if (customElements && customElements[id]) return customElements[id];
    if (typeof document !== 'undefined') return document.getElementById(id);
    return null;
  };

  const handleHudSync = (data) => {
    if (!data) return;

    const hpFill = getEl('hud-hp-fill');
    const hpText = getEl('hud-hp-text');
    const staminaFill = getEl('hud-stamina-fill');

    if (hpFill && hpText) {
      if (data.isDead) {
        hpFill.style.width = '0%';
        hpFill.style.backgroundColor = '#64748b';
        hpText.textContent = 'DEAD 💀';
      } else if (data.isDowned) {
        const maxDowned = data.maxDownedTimer || 30;
        const downedPct = Math.max(0, Math.min(100, (data.downedTimer / maxDowned) * 100));
        hpFill.style.width = `${downedPct}%`;
        hpFill.style.backgroundColor = '#ef4444';
        hpText.textContent = `DOWNED [${Math.ceil(data.downedTimer)}s] 🩸`;
      } else {
        const maxHp = data.maxHp || 100;
        const hpPct = Math.max(0, Math.min(100, (data.hp / maxHp) * 100));
        hpFill.style.width = `${hpPct}%`;
        hpFill.style.backgroundColor = '#00ff88';
        hpText.textContent = `${Math.ceil(data.hp)} / ${maxHp}`;
      }
    }

    if (staminaFill) {
      const maxStam = data.maxStamina || 100;
      const staminaPct = Math.max(0, Math.min(100, (data.stamina / maxStam) * 100));
      staminaFill.style.width = `${staminaPct}%`;
    }

    // ODM Gas Bar Overlay
    const odmHud = getEl('odm-tactical-hud');
    if (odmHud) {
      if (data.isLeviActive) {
        odmHud.classList.remove('hidden');

        const maxGas = data.maxOdmGas || 100;
        const gas = data.odmGas || 0;
        const gasPct = Math.max(0, Math.min(100, (gas / maxGas) * 100));
        const charges = Math.min(10, Math.floor((gas + 0.1) / 10));
        const isLow = charges <= 2;

        const bigFill = getEl('odm-big-gas-fill');
        const bigText = getEl('odm-big-gas-text');

        if (bigFill) {
          bigFill.style.width = `${gasPct}%`;
        }
        odmHud.classList.toggle('low-gas', isLow);

        if (bigText) {
          bigText.textContent = `GAS CHARGES: ${charges} / 10`;
        }
      } else {
        odmHud.classList.add('hidden');
      }
    }
  };

  const unsubscribe = eventBus.on('player:hudSync', handleHudSync);
  return unsubscribe;
}
