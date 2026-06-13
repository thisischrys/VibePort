import { _electron as electron } from 'playwright';

(async () => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  
  window.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  window.on('pageerror', err => console.log('BROWSER_ERROR:', err.message, err.stack));
  
  await window.waitForLoadState('domcontentloaded');
  // Wait a little bit for React to crash
  await new Promise(r => setTimeout(r, 2000));
  
  await electronApp.close();
})();
