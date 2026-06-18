import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC_EVENTS } from '../src/shared/ipc-events.js'
import { createSplashWindow } from './windows.js'
import { state } from './state.js'

export function setupAutoUpdater(runAutoScan) {
  // Configure AutoUpdater
  autoUpdater.autoDownload = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[UPDATE] Checking for updates in the background...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[UPDATE] Update v${info.version} available. Activating splash screen...`)
    if (state.mainWindow) {
      state.mainWindow.hide() // Transition main window out
    }
    createSplashWindow()
    
    // Update splash status
    setTimeout(() => {
      if (state.splashWindow) {
        state.splashWindow.webContents.send(
          IPC_EVENTS.UPDATE_STATUS,
          `Update v${info.version} available! Downloading...`
        )
      }
    }, 500)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[UPDATE] No update available. Enjoy playing!')
    // Delay auto-scan by 2s to let the window finish rendering first
    setTimeout(runAutoScan, 2000)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (state.splashWindow) {
      const percent = progressObj.percent || 0
      state.splashWindow.webContents.send(IPC_EVENTS.UPDATE_PROGRESS, percent)
      state.splashWindow.webContents.send(
        IPC_EVENTS.UPDATE_STATUS,
        `Downloading update: ${Math.round(percent)}%`
      )
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (state.splashWindow) {
      state.splashWindow.webContents.send(IPC_EVENTS.UPDATE_PROGRESS, 100)
      state.splashWindow.webContents.send(IPC_EVENTS.UPDATE_STATUS, 'Update downloaded! Restarting...')
    }
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1500)
  })

  autoUpdater.on('error', (err) => {
    console.error('[UPDATE] AutoUpdater error:', err)
    if (state.splashWindow) {
      state.splashWindow.close()
      if (state.mainWindow) {
        state.mainWindow.show()
        state.mainWindow.focus()
      }
    }
    // Ensure scanning starts if it didn't already
    setTimeout(runAutoScan, 2000)
  })

  // Start update check or run auto-scan
  if (!app.isPackaged) {
    console.log('[DEV] Not packaged, skipping update check. Running auto-scan in 2 seconds...')
    setTimeout(runAutoScan, 2000)
  } else {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Failed to trigger update check:', err)
      setTimeout(runAutoScan, 2000)
    })
    
    // Check for updates every 30 minutes
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[UPDATE] Background check failed:', err)
      })
    }, 30 * 60 * 1000)
  }
}
