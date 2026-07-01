import { test, expect, _electron as electron } from '@playwright/test';

test.describe('VibePort E2E Basic', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tempUserData = path.join(os.tmpdir(), 'vibeport-test-user-data');
    const tempGamesDir = path.join(tempUserData, 'games');
    if (!fs.existsSync(tempGamesDir)) {
      fs.mkdirSync(tempGamesDir, { recursive: true });
    }
    const bg3Game = {
      game_id: 'mock_bg3',
      name: "Baldur's Gate 3",
      developer: 'Larian Studios',
      executable: 'steam://run/1086940',
      source: 'steam',
      added: Math.floor(Date.now() / 1000),
      last_played: 0,
      hidden: false,
      coverUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
    fs.writeFileSync(path.join(tempGamesDir, 'mock_bg3.json'), JSON.stringify(bg3Game, null, 2));

    const settings = {
      use_windows_accent: false,
      exit_after_launch: false,
      auto_import: false,
      remove_uninstalled: false,
      scan_steam: false,
      scan_gog: false,
      scan_epic: false,
      scan_ea: false,
      scan_ubisoft: false,
      scan_bnet: false,
      scan_xbox: false,
      scan_amazon: false,
      cover_launches_game: true,
      sort_by: 'alphabetical',
      show_hidden: false,
      show_sidebar: true
    };
    fs.writeFileSync(path.join(tempUserData, 'settings.json'), JSON.stringify(settings, null, 2));

    electronApp = await electron.launch({
      args: ['.', '--test-mode'],
    });
    window = await electronApp.firstWindow();
    window.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('app launches and displays UI', async () => {
    // Wait for the window to load
    await window.waitForLoadState('domcontentloaded');
    
    // VibePort UI structure (assuming it has some standard root element)
    const root = window.locator('#root');
    await expect(root).toBeVisible();

    // Check if React rendered the titlebar or sidebar content successfully
    const sidebarBrand = window.locator('text=VibePort').first();
    await expect(sidebarBrand).toBeVisible({ timeout: 5000 });

    // Wait for the game grid and game card to render (wait for download to finish/fail)
    const gameCard = window.locator('text=Baldur\'s Gate 3').first();
    await expect(gameCard).toBeVisible({ timeout: 25000 });

    // Save unhovered screenshot to inspect regular layout
    await window.screenshot({ path: 'd:/projects/cartridges-snapping/screenshot.png' });

    // Hover over the card to test hover state
    const cardElement = window.locator('.game-card-hover').first();
    await cardElement.hover();
    await window.waitForTimeout(500); // Wait for hover transition

    // Take a screenshot to inspect hover layout
    await window.screenshot({ path: 'd:/projects/cartridges-snapping/screenshot_hover.png' });

    // Click on the menu button
    const menuBtn = window.locator('.menu-osd-btn').first();
    await menuBtn.click();
    await window.waitForTimeout(500); // Wait for menu open animation

    // Take a screenshot of the menu dropdown layout
    await window.screenshot({ path: 'd:/projects/cartridges-snapping/screenshot_menu.png' });

    // Dismiss menu by clicking somewhere else (like the root element)
    await root.click({ position: { x: 10, y: 10 } });
    await window.waitForTimeout(300);

    // Click on the details (Eye) button to open details view
    const detailsBtn = window.locator('.play-osd-btn').first();
    await detailsBtn.click({ force: true });
    await window.waitForTimeout(800); // Wait for sliding animation and color extraction

    // Take screenshot of the details view with cover-influenced gradient
    await window.screenshot({ path: 'd:/projects/cartridges-snapping/screenshot_details.png' });

    // Click the back button to return to grid view
    const backBtn = window.locator('[title="Back to Grid"]').first();
    await backBtn.click();
    await window.waitForTimeout(500); // Wait for transition
  });
});
