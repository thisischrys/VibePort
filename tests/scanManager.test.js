import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserWindow } from 'electron';

// Mock electron before importing ScanManager
vi.mock('electron', () => {
  return {
    BrowserWindow: {
      getAllWindows: vi.fn(() => [])
    }
  };
});

// Mock IPC_EVENTS before importing ScanManager
vi.mock('../../src/shared/ipc-events.js', () => {
  return {
    IPC_EVENTS: {
      SCAN_PROGRESS: 'scan-progress'
    }
  };
});

describe('ScanManager', () => {
  let scanManager;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../electron/lib/scanManager.js');
    // We import the instance, but since we reset modules it will be fresh? 
    // Actually JS module caching might require careful handling.
    // Let's just create a new instance using the class if it was exported.
    // Wait, the class itself wasn't exported, only the instance `scanManager`.
    // Let's just mutate the instance to reset it for tests.
    scanManager = module.scanManager;
    scanManager.activeScanCount = 0;
  });

  it('tracks active scan count concurrently', () => {
    expect(scanManager.isActive).toBe(false);

    scanManager.startScan();
    expect(scanManager.isActive).toBe(true);
    expect(scanManager.activeScanCount).toBe(1);

    scanManager.startScan();
    expect(scanManager.isActive).toBe(true);
    expect(scanManager.activeScanCount).toBe(2);

    scanManager.endScan();
    expect(scanManager.isActive).toBe(true);
    expect(scanManager.activeScanCount).toBe(1);

    scanManager.endScan();
    expect(scanManager.isActive).toBe(false);
    expect(scanManager.activeScanCount).toBe(0);
  });

  it('prevents negative active scan count', () => {
    scanManager.activeScanCount = 0;
    scanManager.endScan();
    expect(scanManager.activeScanCount).toBe(0);
  });
});
