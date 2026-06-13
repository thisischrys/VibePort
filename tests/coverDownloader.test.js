import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserWindow } from 'electron';

// Mock dependencies
const mockSend = vi.fn();
vi.mock('electron', () => {
  return {
    BrowserWindow: {
      getAllWindows: vi.fn(() => [
        {
          isDestroyed: () => false,
          webContents: {
            send: mockSend
          }
        }
      ])
    }
  };
});

vi.mock('../electron/lib/paths.js', () => ({
  gamesPath: 'mock-games-path',
  coversDir: 'mock-covers-dir',
  STEAMGRIDDB_API_KEY: 'mock-key'
}));

vi.mock('../electron/lib/images.js', () => ({
  downloadCoverFromUrl: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../electron/lib/scanManager.js', () => ({
  scanManager: {
    cancelRequested: false,
    sendProgress: vi.fn()
  }
}));

vi.mock('../../src/shared/ipc-events.js', () => {
  return {
    IPC_EVENTS: {
      SCAN_PROGRESS: 'scan-progress',
      COVER_DOWNLOAD_STATUS: 'cover-download-status'
    }
  };
});

describe('coverDownloader queue and progress recalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) }));
  });

  it('sends cover download status and handles recalculation', async () => {
    const { runBackgroundCoverDownloader } = await import('../electron/lib/coverDownloader.js');

    const mockNotify = vi.fn();
    const games = [
      { game_id: 'g1', name: 'Game 1', cover_type: 'static' },
      { game_id: 'g2', name: 'Game 2', cover_type: 'static' }
    ];

    // Trigger cover downloading (animated: preferStatic = false)
    const promise = runBackgroundCoverDownloader(mockNotify, false, games);

    // Verify it immediately sends the start status (active=true, current=0, total=2)
    expect(mockSend).toHaveBeenCalledWith('cover-download-status', expect.objectContaining({ active: true, current: 0, total: 2 }));

    // Now, trigger concurrent call with more games while it's running
    const extraGames = [
      { game_id: 'g3', name: 'Game 3', cover_type: 'static' }
    ];
    await runBackgroundCoverDownloader(mockNotify, false, extraGames);

    // Verify that the queue total was recalculated to 3
    expect(mockSend).toHaveBeenCalledWith('cover-download-status', expect.objectContaining({ active: true, total: 3 }));

    await promise;
  });
});
