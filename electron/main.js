import { app, BrowserWindow, ipcMain, protocol, net, shell, dialog, systemPreferences } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs'
import { spawn, exec } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { gamesPath, coversDir, settingsPath, vibeportDir, STEAMGRIDDB_API_KEY } from './lib/paths.js'
import { getSettingsData, saveSettingsData } from './lib/settings.js'
import { loadAllGames, writeGame, removeCoverFiles } from './lib/gameStore.js'
import { downloadCoverFromUrl } from './lib/images.js'
import { runBackgroundCoverDownloader, downloadCoverForGame } from './lib/coverDownloader.js'
import { scanSteamLibrary } from './scanners/steamScanner.js'
import { scanGogLibrary } from './scanners/gogScanner.js'
import { scanEpicLibrary } from './scanners/epicScanner.js'
import { scanEaLibrary } from './scanners/eaScanner.js'
import { scanUbisoftLibrary } from './scanners/ubisoftScanner.js'
import { scanBattlenetLibrary } from './scanners/battlenetScanner.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (process.platform === 'win32') {
  app.setAppUserModelId('com.vibeport.app')
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

let mainWindow = null
let splashWindow = null
let shortcutsWindow = null
let lastAccentColor = null

// ─── Renderer Notification Helper ────────────────────────────────────────────
function notifyRenderer() {
  if (mainWindow) mainWindow.webContents.send('games-updated')
}

// ─── Window Creation ──────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon_transparent.png')
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    },
    autoHideMenuBar: true,
    show: true
  })

  mainWindow.setMenu(null)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Window state event listeners to push state to React
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', false)
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function createShortcutsWindow() {
  if (shortcutsWindow) {
    shortcutsWindow.focus()
    return
  }

  const iconPath = path.join(__dirname, '../build/icon_transparent.png')
  shortcutsWindow = new BrowserWindow({
    parent: mainWindow || undefined,
    width: 640,
    height: 420,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    thickFrame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    },
    show: false
  })

  shortcutsWindow.setMenu(null)

  if (process.env.VITE_DEV_SERVER_URL) {
    shortcutsWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#shortcuts')
  } else {
    shortcutsWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'shortcuts' })
  }

  // Natively freeze main window dragging and resizing silently
  if (mainWindow) {
    mainWindow.setMovable(false)
    mainWindow.setResizable(false)
    mainWindow.webContents.send('shortcuts-window-status', true)
  }

  shortcutsWindow.once('ready-to-show', () => {
    shortcutsWindow.center()
    shortcutsWindow.show()
  })

  shortcutsWindow.on('closed', () => {
    shortcutsWindow = null
    if (mainWindow) {
      mainWindow.setMovable(true)
      mainWindow.setResizable(true)
      mainWindow.webContents.send('shortcuts-window-status', false)
      mainWindow.focus()
    }
  })
}

function createSplashWindow() {
  const accentColor = lastAccentColor || '8b5cf6'
  
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  let splashPath = path.join(__dirname, 'splash.html')
  if (process.env.VITE_DEV_SERVER_URL) {
    splashPath = path.join(__dirname, '../electron/splash.html')
  }
  splashWindow.loadFile(splashPath)

  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.webContents.send('set-accent-color', accentColor)
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

function launchApp() {
  if (splashWindow) {
    try { splashWindow.close() } catch (e) { console.error(e) }
  }
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
}

// ─── IPC: Games ───────────────────────────────────────────────────────────────
ipcMain.handle('get-games', () => loadAllGames())

ipcMain.handle('save-game', async (event, gameData) => {
  try {
    let gameId = gameData.game_id
    let existingData = {}

    if (!gameId) {
      gameId = `imported_${Date.now()}`
      existingData = {
        added: Math.floor(Date.now() / 1000),
        developer: null,
        executable: '',
        game_id: gameId,
        hidden: false,
        last_played: 0,
        name: '',
        removed: false,
        source: 'imported',
        version: 1.5
      }
    } else {
      const gameFilePath = path.join(gamesPath, `${gameId}.json`)
      if (fs.existsSync(gameFilePath)) {
        existingData = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
      }
    }

    const merged = { ...existingData, ...gameData, game_id: gameId }
    if (gameId.startsWith('imported_') && merged.source === 'manual') merged.source = 'imported'

    writeGame(gameId, merged)
    notifyRenderer()

    // Automatically trigger cover download in the background for new or updated custom games
    downloadCoverForGame(merged, notifyRenderer).catch(err => {
      console.error(`[BG-COVER] Failed to automatically download cover for ${merged.name}:`, err.message)
    })

    return { success: true, game: merged }
  } catch (e) {
    console.error('save-game error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('delete-game', async (event, gameId) => {
  try {
    const gameFilePath = path.join(gamesPath, `${gameId}.json`)
    if (!fs.existsSync(gameFilePath)) return false

    const data = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))

    if (data.source === 'steam' || data.source === 'gog' || gameId.startsWith('steam_') || gameId.startsWith('gog_')) {
      // Prevent the auto-scanner from re-adding it on next launch
      writeGame(gameId, { ...data, removed: true })
    } else {
      fs.unlinkSync(gameFilePath)
      removeCoverFiles(gameId)
    }

    notifyRenderer()
    return true
  } catch (e) {
    console.error('delete-game error:', e)
    return false
  }
})

ipcMain.handle('update-game-status', async (event, gameId, status) => {
  try {
    const gameFilePath = path.join(gamesPath, `${gameId}.json`)
    if (!fs.existsSync(gameFilePath)) return false

    const data = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
    writeGame(gameId, { ...data, ...status })
    notifyRenderer()
    return true
  } catch (e) {
    console.error('update-game-status error:', e)
    return false
  }
})

// ─── IPC: Game Launch ─────────────────────────────────────────────────────────
ipcMain.handle('launch-game', async (event, executable) => {
  console.log('Launching game:', executable)
  return new Promise((resolve, reject) => {
    try {
      let cmd = executable.trim()

      // Strip legacy "start " prefix if present
      if (cmd.startsWith('start ')) cmd = cmd.slice(6).trim()

      // Battle.net special direct executable launching (remedies protocol handler issues in Windows)
      if (cmd.startsWith('battlenet://')) {
        let gameCode = cmd.replace('battlenet://play/', '').replace('battlenet://', '').trim()
        exec('reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Battle.net" /v "InstallLocation"', { windowsHide: true }, (error, stdout) => {
          let bnetPath = 'C:\\Program Files (x86)\\Battle.net\\Battle.net.exe'
          if (!error && stdout) {
            const match = stdout.match(/InstallLocation\s+REG_SZ\s+(.+)/)
            if (match && match[1]) {
              bnetPath = path.join(match[1].trim(), 'Battle.net.exe')
            }
          }
          console.log(`[LAUNCH] Direct Battle.net launch: "${bnetPath}" --exec="launch ${gameCode}" --autostarted`)
          const child = spawn(bnetPath, [`--exec=launch ${gameCode}`, '--autostarted'], {
            shell: false, detached: true, stdio: 'ignore', windowsHide: true
          })
          child.unref()
          resolve(true)
        })
        return
      }

      // Protocol URLs (Steam, GOG Galaxy, Epic, EA, Ubisoft) — open via shell
      if (cmd.startsWith('steam://') || cmd.startsWith('goggalaxy://') ||
          cmd.startsWith('com.epicgames.launcher://') || cmd.startsWith('origin2://') ||
          cmd.startsWith('uplay://')) {
        shell.openExternal(cmd).then(() => resolve(true)).catch(reject)
        return
      }

      // Direct file path — strip surrounding quotes then launch
      let execPath = cmd
      if (execPath.startsWith('"') && execPath.endsWith('"')) execPath = execPath.slice(1, -1)

      shell.openPath(execPath).then((errMsg) => {
        if (errMsg) {
          console.warn('[LAUNCH] shell.openPath failed, falling back to spawn:', errMsg)
          const launchCwd = path.isAbsolute(execPath) ? path.dirname(execPath) : undefined
          const child = spawn(execPath, [], {
            shell: false, detached: true, cwd: launchCwd, stdio: 'ignore', windowsHide: false
          })

          child.on('error', () => {
            // Fallback to shell: true for edge cases (batch files, etc.)
            const fallback = spawn(executable, [], {
              shell: true, detached: true, cwd: launchCwd, stdio: 'ignore', windowsHide: false
            })
            fallback.unref()
          })
          child.unref()
        }
        resolve(true)
      }).catch((err) => {
        console.error('[LAUNCH] shell.openPath exception:', err)
        reject(err)
      })
    } catch (error) {
      console.error('Failed to launch game:', error)
      reject(error)
    }
  })
})

// ─── IPC: Settings ────────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => getSettingsData())

ipcMain.handle('save-settings', async (event, newSettings) => {
  try {
    return saveSettingsData(newSettings)
  } catch (e) {
    console.error('Failed to save settings:', e)
    throw e
  }
})

// ─── IPC: Window Controls ─────────────────────────────────────────────────────
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  return win ? win.isMaximized() : false
})

ipcMain.handle('open-shortcuts-window', () => {
  createShortcutsWindow()
})

// ─── IPC: System ─────────────────────────────────────────────────────────────
ipcMain.handle('get-accent-color', () => {
  try {
    if (process.platform === 'win32' && systemPreferences.getAccentColor) {
      const raw = systemPreferences.getAccentColor()
      return raw.length === 8 ? raw.slice(0, 6) : raw
    }
    return null
  } catch (e) {
    console.error('get-accent-color error:', e)
    return null
  }
})

ipcMain.on('get-accent-color-sync', (event) => {
  try {
    if (process.platform === 'win32' && systemPreferences.getAccentColor) {
      const raw = systemPreferences.getAccentColor()
      event.returnValue = raw.length === 8 ? raw.slice(0, 6) : raw
    } else {
      event.returnValue = null
    }
  } catch (e) {
    console.error('get-accent-color-sync error:', e)
    event.returnValue = null
  }
})

ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Games Folder to Scan'
    })
    return result.canceled ? null : result.filePaths[0]
  } catch (e) {
    console.error('select-folder error:', e)
    return null
  }
})

ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Executables', extensions: ['exe', 'lnk', 'bat', 'cmd', 'sh', 'com'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  } catch (e) {
    console.error('select-file error:', e)
    return null
  }
})

ipcMain.handle('select-image', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'apng'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  } catch (e) {
    console.error('select-image error:', e)
    return null
  }
})

// ─── IPC: Folder Scanner (manual) ────────────────────────────────────────────
ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return { success: false, error: 'Invalid folder path' }
    }

    const gameDirs = fs.readdirSync(folderPath).filter(f => {
      try { return fs.statSync(path.join(folderPath, f)).isDirectory() } catch { return false }
    })

    // Load existing games for duplicate prevention
    let existingGames = []
    if (fs.existsSync(gamesPath)) {
      for (const file of fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))) {
        try {
          existingGames.push(JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8')))
        } catch { /* skip corrupt files */ }
      }
    }

    const ignoredKeywords = [
      'crash', 'handler', 'reporter', 'unins', 'uninstall', 'setup', 'install',
      'config', 'tool', 'ea', 'epic', 'gog', 'steam', 'workshop', 'redist',
      'dependencies', 'dotNetFx', 'vc_redist', 'dxwebsetup', 'physx', 'directx'
    ]

    function findExecutables(dir, depth = 0) {
      if (depth > 3) return []
      let results = []
      let list
      try { list = fs.readdirSync(dir) } catch { return [] }
      for (const file of list) {
        const filePath = path.join(dir, file)
        let stat
        try { stat = fs.statSync(filePath) } catch { continue }
        if (stat.isDirectory()) {
          results = results.concat(findExecutables(filePath, depth + 1))
        } else if (file.toLowerCase().endsWith('.exe')) {
          results.push({ path: filePath, name: file, size: stat.size, depth })
        }
      }
      return results
    }

    let addedCount = 0
    const addedGames = []

    for (const dirName of gameDirs) {
      const cleanDirName = dirName.toLowerCase().trim()
      const targetDirPath = path.join(folderPath, dirName)

      const alreadyExists = existingGames.some(g => {
        if (g.name?.toLowerCase().trim() === cleanDirName) return true
        if (g.executable) {
          const normExe = g.executable.toLowerCase().replace(/\\/g, '/')
          const normTarget = targetDirPath.toLowerCase().replace(/\\/g, '/')
          return normExe === normTarget || normExe.startsWith(normTarget + '/')
        }
        return false
      })
      if (alreadyExists) continue

      const allExes = findExecutables(targetDirPath)
      if (allExes.length === 0) continue

      const candidates = allExes.filter(exe => !ignoredKeywords.some(k => exe.name.toLowerCase().includes(k)))
      const pool = candidates.length > 0 ? candidates : allExes

      // Smart matching algorithm that handles roman numerals, acronyms, and abbreviations
      const isGameExeMatch = (dir, exe) => {
        const cleanDir = dir.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
        const cleanExe = exe.toLowerCase().replace('.exe', '').replace(/[^a-z0-9\s]/g, ' ')

        const normalizeText = (text) => {
          return text
            .replace(/\bviii\b/g, '8')
            .replace(/\bvii\b/g, '7')
            .replace(/\bvi\b/g, '6')
            .replace(/\biii\b/g, '3')
            .replace(/\bii\b/g, '2')
            .replace(/\biv\b/g, '4')
            .replace(/\bv\b/g, '5')
            .replace(/\bix\b/g, '9')
            .replace(/\bx\b/g, '10')
        }

        const dirNorm = normalizeText(cleanDir)
        const exeNorm = normalizeText(cleanExe)

        const dirWords = dirNorm.split(/\s+/).filter(Boolean)
        const exeJoined = exeNorm.replace(/\s+/g, '')
        const dirJoined = dirNorm.replace(/\s+/g, '')

        // 1. Direct substring match (e.g. "cyberpunk2077" matches "cyberpunk2077.exe")
        if (dirJoined.includes(exeJoined) || exeJoined.includes(dirJoined)) return true

        // 2. Acronym generation with trailing words/numbers (e.g. "final fantasy 7 rebirth" -> "ff7rebirth")
        let initials = ''
        let suffix = ''
        let foundNumber = false

        for (const word of dirWords) {
          if (/^\d+$/.test(word)) {
            foundNumber = true
            suffix += word
          } else if (foundNumber) {
            suffix += word
          } else {
            initials += word[0] || ''
          }
        }

        const acronymCandidate = (initials + suffix).toLowerCase()
        if (acronymCandidate.length > 2 && (exeJoined.includes(acronymCandidate) || acronymCandidate.includes(exeJoined))) {
          return true
        }

        // 3. Full words acronym check (e.g. "grand theft auto v" -> "gtav")
        const rawWords = cleanDir.split(/\s+/).filter(Boolean)
        const fullAcronym = rawWords.map(w => w[0] || '').join('')
        if (fullAcronym.length > 2 && (exeJoined === fullAcronym || exeJoined.includes(fullAcronym))) {
          return true
        }

        return false
      }

      let selectedExe
      const directMatches = pool.filter(exe => isGameExeMatch(dirName, exe.name))

      if (directMatches.length === 1) {
        selectedExe = directMatches[0]
      } else if (directMatches.length > 1) {
        const minDepth = Math.min(...directMatches.map(e => e.depth))
        const minDepthPool = directMatches.filter(e => e.depth === minDepth)
        selectedExe = minDepthPool.reduce((a, b) => b.size > a.size ? b : a)
      } else {
        const minDepth = Math.min(...pool.map(e => e.depth))
        const minDepthPool = pool.filter(e => e.depth === minDepth)
        selectedExe = minDepthPool.reduce((a, b) => b.size > a.size ? b : a)
      }

      if (selectedExe) {
        const gameId = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        const gameData = {
          added: Math.floor(Date.now() / 1000),
          developer: null,
          executable: selectedExe.path,
          game_id: gameId,
          hidden: false,
          last_played: 0,
          name: dirName,
          removed: false,
          source: 'imported',
          version: 1.5
        }
        writeGame(gameId, gameData)
        addedGames.push(gameData)
        addedCount++
        console.log(`[SCANNER] Added game: ${dirName} -> ${selectedExe.name}`)
      }
    }

    if (addedCount > 0) {
      notifyRenderer()
      
      const sendProgress = (current, total, message) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scan-progress', { current, total, message })
        }
      }

      sendProgress(10, 100, 'Scanning complete. Fetching static cover art...')

      for (let i = 0; i < addedGames.length; i++) {
        const game = addedGames[i]
        const percent = Math.round(10 + (80 * (i / addedGames.length)))
        sendProgress(percent, 100, `Downloading cover art for ${game.name}...`)
        try {
          await downloadCoverForGame(game, notifyRenderer, true)
        } catch (err) {
          console.error(`[BG-COVER] Scan folder static cover downloader failed for ${game.name}:`, err.message)
        }
      }

      sendProgress(100, 100, 'Scan complete!');

      // Kick off animated cover upgrades in the background (non-blocking)
      (async () => {
        for (const game of addedGames) {
          try {
            await downloadCoverForGame(game, notifyRenderer, false)
          } catch (err) {
            console.error(`[BG-COVER] Scan folder animated cover downloader failed for ${game.name}:`, err.message)
          }
        }
      })()
    }
    return { success: true, count: addedCount }
  } catch (e) {
    console.error('scan-folder error:', e)
    return { success: false, error: e.message }
  }
})

// ─── IPC: SteamGridDB ─────────────────────────────────────────────────────────
ipcMain.handle('search-steamgriddb', async (event, query) => {
  try {
    const res = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
    )
    if (!res.ok) throw new Error(`SteamGridDB search failed: ${res.statusText}`)
    const json = await res.json()
    return json.success && Array.isArray(json.data) ? json.data.map(g => ({ id: g.id, name: g.name })) : []
  } catch (e) {
    console.error('SteamGridDB search error:', e)
    throw e
  }
})

ipcMain.handle('fetch-steamgriddb-covers', async (event, gameId) => {
  try {
    const [animRes, statRes] = await Promise.all([
      fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?types=animated`, { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }).catch(() => null),
      fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?types=static`, { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }).catch(() => null)
    ])

    let animatedCovers = []
    if (animRes && animRes.ok) {
      const json = await animRes.json()
      if (json.success && Array.isArray(json.data)) {
        animatedCovers = json.data.map(g => ({
          id: g.id,
          thumb: g.thumb || g.url,
          url: g.url,
          type: 'animated',
          width: g.width || 0,
          height: g.height || 0
        }))
      }
    }

    let staticCovers = []
    if (statRes && statRes.ok) {
      const json = await statRes.json()
      if (json.success && Array.isArray(json.data)) {
        staticCovers = json.data.map(g => ({
          id: g.id,
          thumb: g.thumb || g.url,
          url: g.url,
          type: 'static',
          width: g.width || 0,
          height: g.height || 0
        }))
      }
    }

    return [...animatedCovers, ...staticCovers]
  } catch (e) {
    console.error('SteamGridDB fetch covers error:', e)
    throw e
  }
})

ipcMain.handle('download-cover-url', async (event, gameId, imageUrl) => {
  if (!imageUrl) {
    removeCoverFiles(gameId)
    notifyRenderer()
    return { success: true, coverUrl: '' }
  }
  const result = await downloadCoverFromUrl(gameId, imageUrl, notifyRenderer)
  if (result.success) {
    try {
      const gameFilePath = path.join(gamesPath, `${gameId}.json`)
      if (fs.existsSync(gameFilePath)) {
        const data = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
        data.cover_type = result.isAnimated ? 'animated' : 'static'
        data.last_animated_check = Date.now()
        // Clean up legacy flag if present
        delete data.animated_cover_checked
        writeGame(gameId, data)
      }
    } catch (e) {
      console.error('[BG-COVER] Failed to update cover metadata for manual selection:', e)
    }
  }
  return result
})

ipcMain.handle('run-auto-scan', async (event, enabledLaunchers) => {
  try {
    console.log('[AUTO-SCAN] Rerunning scan for enabled launchers:', enabledLaunchers)
    
    const sendProgress = (current, total, message) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan-progress', { current, total, message })
      }
    }
    
    sendProgress(0, 100, 'Initializing game library scan...')
    
    const promises = []
    if (enabledLaunchers.steam) {
      sendProgress(2, 100, 'Scanning Steam registry & libraries...')
      promises.push(scanSteamLibrary())
    }
    if (enabledLaunchers.gog) {
      sendProgress(4, 100, 'Scanning GOG registry & libraries...')
      promises.push(scanGogLibrary())
    }
    if (enabledLaunchers.epic) {
      sendProgress(5, 100, 'Scanning Epic Games launcher...')
      promises.push(scanEpicLibrary())
    }
    if (enabledLaunchers.ea) {
      sendProgress(6, 100, 'Scanning EA Desktop launcher...')
      promises.push(scanEaLibrary())
    }
    if (enabledLaunchers.ubisoft) {
      sendProgress(8, 100, 'Scanning Ubisoft Connect launcher...')
      promises.push(scanUbisoftLibrary())
    }
    if (enabledLaunchers.bnet) {
      sendProgress(9, 100, 'Scanning Battle.net launcher...')
      promises.push(scanBattlenetLibrary())
    }
    
    await Promise.all(promises)
    console.log('[AUTO-SCAN] Scan rerun complete.')
    notifyRenderer()
    
    sendProgress(10, 100, 'Registry scan complete. Fetching static cover art...')
    
    await runBackgroundCoverDownloader(notifyRenderer, true).catch(err => {
      console.error('[BG-COVER] Scan rerun static cover downloader failed:', err.message)
    })
    
    sendProgress(100, 100, 'Scan complete!')

    // Kick off animated cover upgrades in the background
    runBackgroundCoverDownloader(notifyRenderer, false).catch(err => {
      console.error('[BG-COVER] Scan rerun animated cover downloader failed:', err.message)
    })
    return { success: true }
  } catch (e) {
    console.error('run-auto-scan error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('update-all-covers', async () => {
  try {
    console.log('[BG-COVER] Triggering covers update for library...')
    runBackgroundCoverDownloader(notifyRenderer, true).then(() => {
      runBackgroundCoverDownloader(notifyRenderer, false).catch(err => {
        console.error('[BG-COVER] Background animated cover upgrade failed:', err.message)
      })
    }).catch(err => {
      console.error('[BG-COVER] Background static cover downloader failed:', err.message)
    })
    return { success: true }
  } catch (e) {
    console.error('update-all-covers error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('remove-all-games', async () => {
  try {
    console.log('[DANGER] Wiping all games from database completely...')
    if (fs.existsSync(gamesPath)) {
      const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
      for (const file of files) {
        const gameId = file.replace('.json', '')
        try {
          fs.unlinkSync(path.join(gamesPath, file))
          removeCoverFiles(gameId)
        } catch (err) {
          console.error(`[DANGER] Failed to delete ${file}:`, err.message)
        }
      }
    }
    notifyRenderer()
    return true
  } catch (e) {
    console.error('remove-all-games error:', e)
    return false
  }
})

// ─── Auto Scan ────────────────────────────────────────────────────────────────
function runAutoScan() {
  const settings = getSettingsData()
  if (settings.auto_import === false) {
    console.log('[AUTO-SCAN] Auto-import is disabled in settings. Skipping background auto-scan.')
    return
  }

  console.log('[AUTO-SCAN] Starting background auto-scan...')
  const promises = []
  if (settings.scan_steam !== false) promises.push(scanSteamLibrary())
  if (settings.scan_gog !== false) promises.push(scanGogLibrary())
  if (settings.scan_epic !== false) promises.push(scanEpicLibrary())
  if (settings.scan_ea !== false) promises.push(scanEaLibrary())
  if (settings.scan_ubisoft !== false) promises.push(scanUbisoftLibrary())
  if (settings.scan_bnet !== false) promises.push(scanBattlenetLibrary())

  Promise.all(promises)
    .then(() => {
      console.log('[AUTO-SCAN] Background auto-scan completed.')
      notifyRenderer()
      runBackgroundCoverDownloader(notifyRenderer, true).then(() => {
        runBackgroundCoverDownloader(notifyRenderer, false).catch(err => {
          console.error('[AUTO-SCAN] Background animated cover upgrade failed:', err.message)
        })
      }).catch(err => {
        console.error('[AUTO-SCAN] Background static cover downloader failed:', err.message)
      })
    })
    .catch(e => console.error('[AUTO-SCAN] Error:', e))
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (!gotTheLock) return

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
      const mimeMap = { '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.tiff': 'image/tiff' }
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
      lastAccentColor = raw.length === 8 ? raw.slice(0, 6) : raw
    } catch (e) {
      console.error('Failed to get initial accent color:', e)
    }
  }

  // Push live accent color updates to renderer when user changes Windows theme
  if (process.platform === 'win32' && systemPreferences.on) {
    systemPreferences.on('accent-color-changed', (event, newColor) => {
      lastAccentColor = newColor
      if (mainWindow) mainWindow.webContents.send('accent-color-changed', newColor)
      if (splashWindow) splashWindow.webContents.send('set-accent-color', newColor)
    })
  }

  // Initialize main window immediately
  createWindow()

  // Configure AutoUpdater
  autoUpdater.autoDownload = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[UPDATE] Checking for updates in the background...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[UPDATE] Update v${info.version} available. Activating splash screen...`)
    if (mainWindow) {
      mainWindow.hide() // Transition main window out
    }
    if (!splashWindow) {
      createSplashWindow()
    }
    // Update splash status
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.webContents.send('update-status', `Update v${info.version} available! Downloading...`)
      }
    }, 500)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[UPDATE] No update available. Enjoy playing!')
    // Delay auto-scan by 2s to let the window finish rendering first
    setTimeout(runAutoScan, 2000)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (splashWindow) {
      const percent = progressObj.percent || 0
      splashWindow.webContents.send('update-progress', percent)
      splashWindow.webContents.send('update-status', `Downloading update: ${Math.round(percent)}%`)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (splashWindow) {
      splashWindow.webContents.send('update-progress', 100)
      splashWindow.webContents.send('update-status', 'Update downloaded! Restarting...')
    }
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1500)
  })

  autoUpdater.on('error', (err) => {
    console.error('[UPDATE] AutoUpdater error:', err)
    if (splashWindow) {
      splashWindow.close()
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    }
    // Ensure scanning starts if it didn't already
    setTimeout(runAutoScan, 2000)
  })

  // Start the update check or run auto-scan in development mode
  if (!app.isPackaged) {
    console.log('[DEV] Not packaged, skipping update check. Running auto-scan in 2 seconds...')
    setTimeout(runAutoScan, 2000)
  } else {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Failed to trigger update check:', err)
      setTimeout(runAutoScan, 2000)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
