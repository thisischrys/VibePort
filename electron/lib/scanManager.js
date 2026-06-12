import { BrowserWindow } from 'electron'
import { IPC_EVENTS } from '../../src/shared/ipc-events.js'

class ScanManager {
  constructor() {
    this.activeScanCount = 0;
  }

  startScan() {
    this.activeScanCount++;
  }

  endScan() {
    this.activeScanCount = Math.max(0, this.activeScanCount - 1);
  }

  get isActive() {
    return this.activeScanCount > 0;
  }

  sendProgress(current, total, message, mode = 'scan') {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.SCAN_PROGRESS, { 
          current, 
          total, 
          message, 
          mode, 
          active: this.isActive 
        });
      }
    }
  }
}

export const scanManager = new ScanManager();
