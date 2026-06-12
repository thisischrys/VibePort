import { test, expect, _electron as electron } from '@playwright/test';

test.describe('VibePort E2E Basic', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.'],
    });
    window = await electronApp.firstWindow();
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

    // Check title (often VibePort or similar)
    const title = await window.title();
    expect(title).toBeDefined();
  });
});
