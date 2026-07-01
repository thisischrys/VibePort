import { ipcMain, dialog, systemPreferences, nativeTheme, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { spawn, exec } from 'node:child_process'
import { state } from './state.js'
import { IPC_EVENTS } from '../src/shared/ipc-events.js'
import { gamesPath, STEAMGRIDDB_API_KEY } from './lib/paths.js'
import { getSettingsData, saveSettingsData } from './lib/settings.js'
import { loadAllGames, writeGame, removeCoverFiles, readGame, deleteGameFile, deleteAllGames, getAllGameIds } from './lib/gameStore.js'
import { calculateDeleteAction, calculateUndoDeletions } from './lib/gameLogic.js'
import { downloadCoverFromUrl } from './lib/images.js'
import { runBackgroundCoverDownloader, downloadCoverForGame } from './lib/coverDownloader.js'
import { scanSteamLibrary } from './scanners/steamScanner.js'
import { scanGogLibrary } from './scanners/gogScanner.js'
import { scanEpicLibrary } from './scanners/epicScanner.js'
import { scanEaLibrary } from './scanners/eaScanner.js'
import { scanUbisoftLibrary } from './scanners/ubisoftScanner.js'
import { scanBattlenetLibrary } from './scanners/battlenetScanner.js'
import { scanXboxLibrary } from './scanners/xboxScanner.js'
import { scanAmazonLibrary } from './scanners/amazonScanner.js'
import { scanManager } from './lib/scanManager.js'
import { createShortcutsWindow } from './windows.js'

function notifyRenderer() {
  if (state.mainWindow) state.mainWindow.webContents.send(IPC_EVENTS.GAMES_UPDATED)
}

export function setupIpcHandlers(runAutoScan) {
  // ─── IPC: Games ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_EVENTS.GET_GAMES, () => loadAllGames())

  ipcMain.handle(IPC_EVENTS.SAVE_GAME, async (event, gameData) => {
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

      await writeGame(gameId, merged)
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

  ipcMain.handle(IPC_EVENTS.DELETE_GAME, async (event, gameId) => {
    try {
      const data = await readGame(gameId)
      if (!data) return false

      const result = calculateDeleteAction(data, gameId)
      
      if (result.action === 'mark_removed') {
        await writeGame(gameId, result.game)
      } else if (result.action === 'delete_file') {
        await deleteGameFile(gameId)
      }

      notifyRenderer()
      return true
    } catch (e) {
      console.error('delete-game error:', e)
      return false
    }
  })

  ipcMain.handle(IPC_EVENTS.UPDATE_GAME_STATUS, async (event, gameId, status) => {
    try {
      const gameFilePath = path.join(gamesPath, `${gameId}.json`)
      if (!fs.existsSync(gameFilePath)) return false

      const data = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
      await writeGame(gameId, { ...data, ...status })
      notifyRenderer()
      return true
    } catch (e) {
      console.error('update-game-status error:', e)
      return false
    }
  })

  // ─── IPC: Game Launch ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC_EVENTS.LAUNCH_GAME, async (event, executable) => {
    console.log('Launching game:', executable)
    return new Promise((resolve, reject) => {
      try {
        if (typeof executable !== 'string' || /[&|;<>\n\r\$`]/.test(executable)) {
          console.error('[LAUNCH] Refusing to launch executable with unsafe shell characters:', executable)
          reject(new Error('Unsafe characters in launch path'))
          return
        }
        let cmd = executable.trim()

        // Strip legacy "start " prefix if present
        if (cmd.startsWith('start ')) cmd = cmd.slice(6).trim()

        // Battle.net special direct executable launching
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
  ipcMain.handle(IPC_EVENTS.GET_SETTINGS, () => getSettingsData())

  ipcMain.handle(IPC_EVENTS.SAVE_SETTINGS, async (event, newSettings) => {
    try {
      return saveSettingsData(newSettings)
    } catch (e) {
      console.error('Failed to save settings:', e)
      throw e
    }
  })

  // ─── IPC: Window Controls ─────────────────────────────────────────────────────
  ipcMain.on(IPC_EVENTS.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })

  ipcMain.on(IPC_EVENTS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on(IPC_EVENTS.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
  })

  ipcMain.handle(IPC_EVENTS.WINDOW_IS_MAXIMIZED, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win ? win.isMaximized() : false
  })

  ipcMain.handle(IPC_EVENTS.OPEN_SHORTCUTS_WINDOW, () => {
    createShortcutsWindow()
  })

  // ─── IPC: System ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_EVENTS.GET_ACCENT_COLOR, () => {
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

  ipcMain.on(IPC_EVENTS.GET_ACCENT_COLOR_SYNC, (event) => {
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

  ipcMain.handle(IPC_EVENTS.GET_NATIVE_THEME, () => {
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle(IPC_EVENTS.SET_THEME_MODE, (event, mode) => {
    // mode: 'system' | 'light' | 'dark'
    nativeTheme.themeSource = mode
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle(IPC_EVENTS.SELECT_FOLDER, async () => {
    try {
      const result = await dialog.showOpenDialog(state.mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Games Folder to Scan'
      })
      return result.canceled ? null : result.filePaths[0]
    } catch (e) {
      console.error('select-folder error:', e)
      return null
    }
  })

  ipcMain.handle(IPC_EVENTS.SELECT_FILE, async () => {
    try {
      const result = await dialog.showOpenDialog(state.mainWindow, {
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

  ipcMain.handle(IPC_EVENTS.SELECT_IMAGE, async () => {
    try {
      const result = await dialog.showOpenDialog(state.mainWindow, {
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
  ipcMain.handle(IPC_EVENTS.SCAN_FOLDER, async (event, folderPath) => {
    scanManager.startScan()
    scanManager.sendProgress(0, 100, 'Scanning folder for games...', 'folder')
    try {
      if (!folderPath || !fs.existsSync(folderPath)) {
        scanManager.endScan()
        scanManager.sendProgress(0, 100, '', 'folder')
        return { success: false, error: 'Invalid folder path' }
      }

      const gameDirs = fs.readdirSync(folderPath).filter(f => {
        try { return fs.statSync(path.join(folderPath, f)).isDirectory() } catch { return false }
      })

      // Load existing games
      let existingGames = []
      if (fs.existsSync(gamesPath)) {
        for (const file of fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))) {
          try {
            existingGames.push(JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8')))
          } catch { /* skip */ }
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

          if (dirJoined.includes(exeJoined) || exeJoined.includes(dirJoined)) return true

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
          await writeGame(gameId, gameData)
          addedGames.push(gameData)
          addedCount++
          console.log(`[SCANNER] Added game: ${dirName} -> ${selectedExe.name}`)
        }
      }

      if (addedCount > 0) {
        notifyRenderer()
        await runBackgroundCoverDownloader(notifyRenderer, true, addedGames, 'folder')
        ;(async () => {
          await runBackgroundCoverDownloader(notifyRenderer, false, addedGames, 'folder')
        })()
      }
      scanManager.endScan()
      scanManager.sendProgress(100, 100, 'Done', 'folder')
      return { success: true, count: addedCount }
    } catch (e) {
      console.error('scan-folder error:', e)
      scanManager.endScan()
      scanManager.sendProgress(0, 100, '', 'folder')
      return { success: false, error: e.message }
    }
  })

  // ─── IPC: SteamGridDB ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC_EVENTS.SEARCH_STEAMGRIDDB, async (event, query) => {
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

  ipcMain.handle(IPC_EVENTS.FETCH_STEAMGRIDDB_COVERS, async (event, gameId) => {
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

  ipcMain.handle(IPC_EVENTS.DOWNLOAD_COVER_URL, async (event, gameId, imageUrl) => {
    if (!imageUrl) {
      await removeCoverFiles(gameId)
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
          delete data.animated_cover_checked
          await writeGame(gameId, data)
        }
      } catch (e) {
        console.error('[BG-COVER] Failed to update cover metadata for manual selection:', e)
      }
    }
    return result
  })

  ipcMain.handle(IPC_EVENTS.RUN_AUTO_SCAN, async (event, enabledLaunchers) => {
    scanManager.startScan()
    scanManager.sendProgress(0, 100, 'Initializing game library scan...', 'import')
    try {
      console.log('[AUTO-SCAN] Rerunning scan for enabled launchers:', enabledLaunchers)

      const preScanIds = new Set()
      if (fs.existsSync(gamesPath)) {
        const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
        for (const file of files) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8'))
            if (!data.removed && !data.blacklisted) {
              preScanIds.add(data.game_id)
            }
          } catch {}
        }
      }
      
      const promises = []
      if (enabledLaunchers.steam) {
        scanManager.sendProgress(2, 100, 'Scanning Steam registry & libraries...', 'import')
        promises.push(scanSteamLibrary())
      }
      if (enabledLaunchers.gog) {
        scanManager.sendProgress(4, 100, 'Scanning GOG registry & libraries...', 'import')
        promises.push(scanGogLibrary())
      }
      if (enabledLaunchers.epic) {
        scanManager.sendProgress(5, 100, 'Scanning Epic Games launcher...', 'import')
        promises.push(scanEpicLibrary())
      }
      if (enabledLaunchers.ea) {
        scanManager.sendProgress(6, 100, 'Scanning EA Desktop launcher...', 'import')
        promises.push(scanEaLibrary())
      }
      if (enabledLaunchers.ubisoft) {
        scanManager.sendProgress(8, 100, 'Scanning Ubisoft Connect launcher...', 'import')
        promises.push(scanUbisoftLibrary())
      }
      if (enabledLaunchers.bnet) {
        scanManager.sendProgress(9, 100, 'Scanning Battle.net launcher...', 'import')
        promises.push(scanBattlenetLibrary())
      }
      if (enabledLaunchers.xbox) {
        scanManager.sendProgress(9, 100, 'Scanning Xbox App...', 'import')
        promises.push(scanXboxLibrary())
      }
      if (enabledLaunchers.amazon) {
        scanManager.sendProgress(9, 100, 'Scanning Amazon Games...', 'import')
        promises.push(scanAmazonLibrary())
      }
      
      await Promise.all(promises)
      console.log('[AUTO-SCAN] Scan rerun complete.')
      notifyRenderer()

      const postScanIds = new Set()
      if (fs.existsSync(gamesPath)) {
        const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
        for (const file of files) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8'))
            if (!data.removed && !data.blacklisted) {
              postScanIds.add(data.game_id)
            }
          } catch {}
        }
      }

      const importedCount = [...postScanIds].filter(id => !preScanIds.has(id)).length
      const removedCount = [...preScanIds].filter(id => !postScanIds.has(id)).length
      
      scanManager.sendProgress(10, 100, 'Registry scan complete. Fetching static cover art...', 'import')
      
      await runBackgroundCoverDownloader(notifyRenderer, true).catch(err => {
        console.error('[BG-COVER] Scan rerun static cover downloader failed:', err.message)
      })
      
      scanManager.endScan()
      scanManager.sendProgress(100, 100, 'Scan complete!', 'import')

      runBackgroundCoverDownloader(notifyRenderer, false).catch(err => {
        console.error('[BG-COVER] Scan rerun animated cover downloader failed:', err.message)
      })
      return { success: true, importedCount, removedCount }
    } catch (e) {
      console.error('run-auto-scan error:', e)
      scanManager.endScan()
      scanManager.sendProgress(0, 100, '', 'import')
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle(IPC_EVENTS.UPDATE_ALL_COVERS, async () => {
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

  ipcMain.handle(IPC_EVENTS.REMOVE_ALL_GAMES, async () => {
    try {
      console.log('[DANGER] Wiping all games from database completely...')
      scanManager.cancelAll()
      await deleteAllGames()
      notifyRenderer()
      return true
    } catch (e) {
      console.error('remove-all-games error:', e)
      return false
    }
  })

  ipcMain.handle(IPC_EVENTS.UNDO_IMPORT, async (event, gamesToRestore) => {
    try {
      console.log('[UNDO] Undoing library scan / folder import...')
      scanManager.cancelAll()
      const existingIds = await getAllGameIds()
      const toDelete = calculateUndoDeletions(existingIds, gamesToRestore)
      
      for (const gameId of toDelete) {
        console.log(`[UNDO] Deleting newly added game during undo: ${gameId}`)
        await deleteGameFile(gameId)
      }
      
      notifyRenderer()
      return true
    } catch (e) {
      console.error('undo-import error:', e)
      return false
    }
  })

  ipcMain.handle(IPC_EVENTS.OPEN_EXTERNAL_URL, async (event, url) => {
    try {
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        await shell.openExternal(url)
        return true
      }
      return false
    } catch (e) {
      console.error('open-external-url error:', e)
      return false
    }
  })
}
