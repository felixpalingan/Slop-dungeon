import { test, expect } from '@playwright/test';

test.describe('Slop Dungeon - Base Camp & HUD User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the primary game canvas to be attached and visible
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('renders base camp HUD with player name, HP bar, and status badges', async ({ page }) => {
    // Assert HUD components exist and are visible
    const hpBar = page.getByTestId('hud-hp-bar');
    await expect(hpBar).toBeVisible();

    const playerName = page.locator('#hud-player-name');
    await expect(playerName).toHaveText(/SlopCrawler/i);

    const networkBadge = page.locator('#hud-network-status');
    await expect(networkBadge).toContainText('SOLO');
  });

  test('can open and close Settings modal via HUD button and close button', async ({ page }) => {
    const settingsBtn = page.getByTestId('hud-settings-btn');
    const settingsModal = page.locator('#settings-modal');

    // Initially modal is hidden
    await expect(settingsModal).toHaveClass(/hidden/);

    // Open settings
    await settingsBtn.click();
    await expect(settingsModal).not.toHaveClass(/hidden/);

    // Close settings via close button
    const closeBtn = page.locator('#btn-close-settings');
    await closeBtn.click();
    await expect(settingsModal).toHaveClass(/hidden/);
  });

  test('can open and close Multiplayer Mabar Lobby modal with English CREATE LOBBY buttons', async ({ page }) => {
    const lobbyBtn = page.getByTestId('btn-open-lobby');
    await expect(lobbyBtn).toContainText('CREATE LOBBY');

    const lobbyModal = page.locator('#lobby-modal');
    await expect(lobbyModal).toHaveClass(/hidden/);

    // Open lobby modal
    await lobbyBtn.click();
    await expect(lobbyModal).not.toHaveClass(/hidden/);

    // Check presence and label of Create Lobby button
    const createRoomBtn = page.getByTestId('btn-room-create');
    await expect(createRoomBtn).toBeVisible();
    await expect(createRoomBtn).toContainText('CREATE LOBBY');

    // Test that typing or pasting SLOP- prefix into room input gets automatically stripped
    const roomInput = page.locator('#input-room-code');
    await roomInput.fill('SLOP-A7B9X2');
    await expect(roomInput).toHaveValue('A7B9X2');

    // Close modal
    const closeBtn = page.locator('#btn-close-lobby');
    await closeBtn.click();
    await expect(lobbyModal).toHaveClass(/hidden/);
  });

  test('can open Floor Selection modal and inspect Floor 1 Warp action', async ({ page }) => {
    const floorBadge = page.locator('#btn-floor-badge');
    const floorModal = page.locator('#floor-modal');

    await expect(floorModal).toHaveClass(/hidden/);

    // Open floor selector
    await floorBadge.click();
    await expect(floorModal).not.toHaveClass(/hidden/);

    // Check Floor 1 Warp button
    const floor1Btn = page.getByTestId('btn-floor-warp-1');
    await expect(floor1Btn).toBeVisible();

    // Close floor modal
    const closeBtn = page.locator('#btn-close-floor-modal');
    await closeBtn.click();
    await expect(floorModal).toHaveClass(/hidden/);
  });

  test('dismisses open modal by clicking outside on the dark backdrop', async ({ page }) => {
    const settingsBtn = page.getByTestId('hud-settings-btn');
    const settingsModal = page.locator('#settings-modal');

    await settingsBtn.click();
    await expect(settingsModal).not.toHaveClass(/hidden/);

    // Click on top-left corner of the backdrop (outside the centered modal card)
    await settingsModal.click({ position: { x: 15, y: 15 } });
    await expect(settingsModal).toHaveClass(/hidden/);
  });

  test('dismisses topmost open modal upon pressing Escape key', async ({ page }) => {
    const settingsBtn = page.getByTestId('hud-settings-btn');
    const settingsModal = page.locator('#settings-modal');

    await settingsBtn.click();
    await expect(settingsModal).not.toHaveClass(/hidden/);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(settingsModal).toHaveClass(/hidden/);
  });

  test('auto-populates sanitized room code from URL query and initiates join without opening lobby modal', async ({ page }) => {
    // Navigate with a shared link including SLOP- prefix
    await page.goto('/?room=SLOP-K7M2X9');
    await expect(page.locator('#game-canvas')).toBeVisible();

    // Lobby modal should not be open/blocking
    const lobbyModal = page.locator('#lobby-modal');
    await expect(lobbyModal).toHaveClass(/hidden/);

    // The room input field should have the sanitized code without SLOP- prefix
    const roomInput = page.locator('#input-room-code');
    await expect(roomInput).toHaveValue('K7M2X9');
  });
});

