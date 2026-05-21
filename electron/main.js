import { app, BrowserWindow, ipcMain, protocol, net, shell, dialog, systemPreferences } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { gamesPath, coversDir, settingsPath, cartridgesDir, STEAMGRIDDB_API_KEY } from './lib/paths.js'
import { getSettingsData, saveSettingsData } from './lib/settings.js'
import { loadAllGames, writeGame, removeCoverFiles } from './lib/gameStore.js'
import { downloadCoverFromUrl } from './lib/images.js'
import { runBackgroundCoverDownloader } from './lib/coverDownloader.js'
import { scanSteamLibrary } from './scanners/steamScanner.js'
import { scanGogLibrary } from './scanners/gogScanner.js'
import { scanEpicLibrary } from './scanners/epicScanner.js'
import { scanEaLibrary } from './scanners/eaScanner.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    },
    autoHideMenuBar: true
  })

  mainWindow.setMenu(null)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
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

      // Protocol URLs (Steam, GOG Galaxy, Epic, EA) — open via shell
      if (cmd.startsWith('steam://') || cmd.startsWith('goggalaxy://') ||
          cmd.startsWith('com.epicgames.launcher://') || cmd.startsWith('origin2://')) {
        shell.openExternal(cmd).then(() => resolve(true)).catch(reject)
        return
      }

      // Direct file path — strip surrounding quotes then spawn directly
      let execPath = cmd
      if (execPath.startsWith('"') && execPath.endsWith('"')) execPath = execPath.slice(1, -1)

      const launchCwd = path.isAbsolute(execPath) ? path.dirname(execPath) : undefined

      const child = spawn(execPath, [], {
        shell: false, detached: true, cwd: launchCwd, stdio: 'ignore', windowsHide: true
      })

      child.on('error', () => {
        // Fallback to shell: true for edge cases (batch files, etc.)
        const fallback = spawn(executable, [], {
          shell: true, detached: true, cwd: launchCwd, stdio: 'ignore', windowsHide: true
        })
        fallback.unref()
        resolve(true)
      })

      child.unref()
      resolve(true)
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
          results.push({ path: filePath, name: file, size: stat.size })
        }
      }
      return results
    }

    let addedCount = 0

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

      let selectedExe
      const stripped = cleanDirName.replace(/[^a-z0-9]/g, '')
      const directMatches = pool.filter(exe => {
        const clean = exe.name.toLowerCase().replace('.exe', '').replace(/[^a-z0-9]/g, '')
        return clean.includes(stripped) || stripped.includes(clean)
      })

      if (directMatches.length === 1) selectedExe = directMatches[0]
      else if (directMatches.length > 1) selectedExe = directMatches.reduce((a, b) => b.size > a.size ? b : a)
      else selectedExe = pool.reduce((a, b) => b.size > a.size ? b : a)

      if (selectedExe) {
        const gameId = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        writeGame(gameId, {
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
        })
        addedCount++
        console.log(`[SCANNER] Added game: ${dirName} -> ${selectedExe.name}`)
      }
    }

    if (addedCount > 0) notifyRenderer()
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
    const res = await fetch(
      `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?types=animated,static`,
      { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
    )
    if (!res.ok) throw new Error(`SteamGridDB fetch covers failed: ${res.statusText}`)
    const json = await res.json()
    return json.success && Array.isArray(json.data)
      ? json.data.map(g => ({ id: g.id, thumb: g.thumb || g.url, url: g.url, type: g.type || 'static', width: g.width || 0, height: g.height || 0 }))
      : []
  } catch (e) {
    console.error('SteamGridDB fetch covers error:', e)
    throw e
  }
})

ipcMain.handle('download-cover-url', async (event, gameId, imageUrl) => {
  return downloadCoverFromUrl(gameId, imageUrl, notifyRenderer)
})

// ─── Auto Scan ────────────────────────────────────────────────────────────────
function runAutoScan() {
  Promise.all([scanSteamLibrary(), scanGogLibrary(), scanEpicLibrary(), scanEaLibrary()])
    .then(() => {
      console.log('[AUTO-SCAN] Background auto-scan completed.')
      notifyRenderer()
      runBackgroundCoverDownloader(notifyRenderer)
    })
    .catch(e => console.error('[AUTO-SCAN] Error:', e))
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Register media:// protocol for serving local cover images
  protocol.handle('media', async (request) => {
    try {
      let urlStr = request.url.replace(/^media:\/\/\/?/, 'file:///')
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

  createWindow()

  // Delay auto-scan by 2s to let the window finish rendering first
  setTimeout(runAutoScan, 2000)

  // Push live accent color updates to renderer when user changes Windows theme
  if (process.platform === 'win32' && systemPreferences.on) {
    systemPreferences.on('accent-color-changed', (event, newColor) => {
      if (mainWindow) mainWindow.webContents.send('accent-color-changed', newColor)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
