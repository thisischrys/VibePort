import { app, BrowserWindow, protocol, net, systemPreferences, nativeTheme } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Detect if running in test mode
const isTestMode = process.argv.includes('--test-mode')

// Register media:// protocol as privileged to allow fetch and prevent canvas tainting
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

// Override userData path to use proper capitalization
if (isTestMode) {
  const tempUserData = path.join(app.getPath('temp'), 'vibeport-test-user-data')
  app.setPath('userData', tempUserData)
} else {
  const currentUserData = app.getPath('userData')
  const parentDir = path.dirname(currentUserData)
  const correctedUserData = path.join(parentDir, 'VibePort')
  if (currentUserData !== correctedUserData) {
    app.setPath('userData', correctedUserData)
  }
}

import { gamesPath, coversDir, settingsPath, STEAMGRIDDB_API_KEY } from './lib/paths.js'
import { getSettingsData, saveSettingsData } from './lib/settings.js'
import { removeCoverFiles } from './lib/gameStore.js'
import { runBackgroundCoverDownloader } from './lib/coverDownloader.js'
import { scanSteamLibrary } from './scanners/steamScanner.js'
import { scanGogLibrary } from './scanners/gogScanner.js'
import { scanEpicLibrary } from './scanners/epicScanner.js'
import { scanEaLibrary } from './scanners/eaScanner.js'
import { scanUbisoftLibrary } from './scanners/ubisoftScanner.js'
import { scanBattlenetLibrary } from './scanners/battlenetScanner.js'
import { scanXboxLibrary } from './scanners/xboxScanner.js'
import { scanAmazonLibrary } from './scanners/amazonScanner.js'
import { IPC_EVENTS } from '../src/shared/ipc-events.js'

import { state } from './state.js'
import { createWindow, createSplashWindow, launchApp } from './windows.js'
import { setupIpcHandlers } from './ipc-handlers.js'
import { setupAutoUpdater } from './updater.js'

if (process.platform === 'win32') {
  app.setAppUserModelId('com.vibeport.app')
}

state.gotTheLock = isTestMode ? true : app.requestSingleInstanceLock()
if (!state.gotTheLock) {
  app.quit()
} else if (!isTestMode) {
  app.on('second-instance', () => {
    if (state.mainWindow) {
      if (state.mainWindow.isMinimized()) state.mainWindow.restore()
      state.mainWindow.focus()
    }
  })
}

function notifyRenderer() {
  if (state.mainWindow) state.mainWindow.webContents.send(IPC_EVENTS.GAMES_UPDATED)
}

function cleanOrphanCovers() {
  try {
    if (!fs.existsSync(coversDir) || !fs.existsSync(gamesPath)) return
    
    const activeGameIds = new Set()
    const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    for (const file of files) {
      activeGameIds.add(file.replace('.json', ''))
    }
    
    const coverFiles = fs.readdirSync(coversDir)
    const processedIds = new Set()
    
    for (const file of coverFiles) {
      const dotIdx = file.indexOf('.')
      if (dotIdx > 0) {
        const gameId = file.substring(0, dotIdx)
        if (!activeGameIds.has(gameId) && !processedIds.has(gameId)) {
          processedIds.add(gameId)
          console.log(`[CLEANUP] Removing orphan cover files for game ID: ${gameId}`)
          removeCoverFiles(gameId)
        }
      }
    }
  } catch (err) {
    console.error('[CLEANUP] Error during orphan cover cleanup:', err.message)
  }
}

function runAutoScan(enabledLaunchers = null) {
  const settings = getSettingsData()
  if (settings.auto_import === false && !enabledLaunchers) {
    console.log('[AUTO-SCAN] Auto-import is disabled in settings. Skipping background auto-scan.')
    return
  }

  console.log('[AUTO-SCAN] Starting background auto-scan...')
  const promises = []
  
  const steamEnabled = enabledLaunchers ? enabledLaunchers.steam : settings.scan_steam !== false
  const gogEnabled = enabledLaunchers ? enabledLaunchers.gog : settings.scan_gog !== false
  const epicEnabled = enabledLaunchers ? enabledLaunchers.epic : settings.scan_epic !== false
  const eaEnabled = enabledLaunchers ? enabledLaunchers.ea : settings.scan_ea !== false
  const ubisoftEnabled = enabledLaunchers ? enabledLaunchers.ubisoft : settings.scan_ubisoft !== false
  const bnetEnabled = enabledLaunchers ? enabledLaunchers.bnet : settings.scan_bnet !== false
  const xboxEnabled = enabledLaunchers ? enabledLaunchers.xbox : settings.scan_xbox !== false
  const amazonEnabled = enabledLaunchers ? enabledLaunchers.amazon : settings.scan_amazon !== false

  if (steamEnabled) promises.push(scanSteamLibrary())
  if (gogEnabled) promises.push(scanGogLibrary())
  if (epicEnabled) promises.push(scanEpicLibrary())
  if (eaEnabled) promises.push(scanEaLibrary())
  if (ubisoftEnabled) promises.push(scanUbisoftLibrary())
  if (bnetEnabled) promises.push(scanBattlenetLibrary())
  if (xboxEnabled) promises.push(scanXboxLibrary())
  if (amazonEnabled) promises.push(scanAmazonLibrary())

  return Promise.all(promises)
    .then((results) => {
      console.log('[AUTO-SCAN] Background auto-scan completed.')
      
      let importedCount = 0
      let removedCount = 0
      results.forEach(res => {
        if (res) {
          importedCount += res.imported || 0
          removedCount += res.removed || 0
        }
      })
      
      notifyRenderer()
      runBackgroundCoverDownloader(notifyRenderer, true).then(() => {
        runBackgroundCoverDownloader(notifyRenderer, false).catch(err => {
          console.error('[AUTO-SCAN] Background animated cover upgrade failed:', err.message)
        })
      }).catch(err => {
        console.error('[AUTO-SCAN] Background static cover downloader failed:', err.message)
      })
      
      return { success: true, importedCount, removedCount }
    })
    .catch(e => {
      console.error('[AUTO-SCAN] Error:', e)
      return { success: false, error: e.message }
    })
}

// App Lifecycle
app.whenReady().then(() => {
  if (!state.gotTheLock) return

  // Register media:// protocol for serving local cover images
  protocol.handle('media', async (request) => {
    try {
      const cleanUrl = request.url.split('?')[0]
      let urlStr = cleanUrl.replace(/^media:\/\/\/?/, 'file:///')
      if (urlStr.match(/^file:\/\/\/[a-zA-Z]\//)) {
        urlStr = urlStr.replace(/^file:\/\/\/([a-zA-Z])\//, 'file:///$1:/')
      }
      const filePath = fileURLToPath(urlStr)
      const ext = path.extname(filePath).toLowerCase()
      const mimeMap = {
        '.gif': 'image/gif',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff'
      }
      const mimeType = mimeMap[ext] || 'image/png'

      const response = await net.fetch(pathToFileURL(filePath).toString())
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (e) {
      console.error('Media protocol error:', e, request.url)
      return new Response('Not Found', { status: 404 })
    }
  })

  // Retrieve initial Windows accent color first
  if (process.platform === 'win32' && systemPreferences.getAccentColor) {
    try {
      const raw = systemPreferences.getAccentColor()
      state.lastAccentColor = raw.length === 8 ? raw.slice(0, 6) : raw
    } catch (e) {
      console.error('Failed to get initial accent color:', e)
    }
  }

  // Push live accent color updates to renderer when user changes Windows theme
  if (process.platform === 'win32' && systemPreferences.on) {
    systemPreferences.on('accent-color-changed', (event, newColor) => {
      state.lastAccentColor = newColor
      if (state.mainWindow) state.mainWindow.webContents.send(IPC_EVENTS.ACCENT_COLOR_CHANGED, newColor)
      if (state.splashWindow) state.splashWindow.webContents.send(IPC_EVENTS.SET_ACCENT_COLOR, newColor)
    })
  }

  // Push OS theme changes to renderer
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors
    if (state.mainWindow) state.mainWindow.webContents.send(IPC_EVENTS.THEME_CHANGED, isDark)
    if (state.splashWindow) state.splashWindow.webContents.send(IPC_EVENTS.THEME_CHANGED, isDark)
  })

  // Restore saved theme mode preference
  const savedSettings = getSettingsData()
  if (savedSettings.theme_mode && savedSettings.theme_mode !== 'system') {
    nativeTheme.themeSource = savedSettings.theme_mode
  }

  // Initialize main window immediately
  createWindow()

  // Check for What's New
  const settingsData = getSettingsData()
  const currentVersion = app.getVersion()
  const lastVersion = settingsData.last_version_run || '0.0.0'
  
  if (currentVersion !== lastVersion) {
    const isNewer = (a, b) => {
      const pa = a.split('.').map(Number)
      const pb = b.split('.').map(Number)
      for (let i = 0; i < 3; i++) {
        if (pa[i] > (pb[i] || 0)) return true
        if (pa[i] < (pb[i] || 0)) return false
      }
      return false
    }
    
    if (isNewer(currentVersion, lastVersion) || lastVersion === '0.0.0') {
      saveSettingsData({ last_version_run: currentVersion })
      setTimeout(() => {
        if (state.mainWindow) state.mainWindow.webContents.send(IPC_EVENTS.SHOW_WHATS_NEW, currentVersion)
      }, 2000)
    }
  }

  // Set up IPC & Auto Updater
  setupIpcHandlers(runAutoScan)
  setupAutoUpdater(runAutoScan)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('quit', () => {
  console.log('Cleaning orphan covers on quit...')
  cleanOrphanCovers()
})
