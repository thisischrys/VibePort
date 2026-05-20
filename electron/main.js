import { app, BrowserWindow, ipcMain, protocol, net, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { spawn, exec, execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cartridgesDir = path.join(app.getPath('home'), 'AppData', 'Local', 'cartridges-native')
const gamesPath = path.join(cartridgesDir, 'games')
const coversDir = path.join(cartridgesDir, 'covers')
const settingsPath = path.join(cartridgesDir, 'settings.json')
const steamgriddbApiKey = 'a8dc25ee4cba2b7e42c459cad790da4f'

let mainWindow = null

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png')
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// In-place GIF repair utility using python + Pillow
function repairGif(filePath) {
  return new Promise((resolve) => {
    console.log('[GIF REPAIR] Attempting to repair corrupt GIF in-place:', filePath)
    
    const pythonCode = `
import sys, os
from PIL import Image, ImageSequence
f = sys.argv[1]
try:
    im = Image.open(f)
    duration = im.info.get('duration', 100)
    loop = im.info.get('loop', 0)
    frames = [frame.copy() for frame in ImageSequence.Iterator(im)]
    im.close()
    frames[0].save(f, save_all=True, append_images=frames[1:], loop=loop, duration=duration, format='GIF')
    print('REPAIR_SUCCESS')
except Exception as e:
    print('REPAIR_FAILED:', str(e))
`.trim()

    const child = spawn('python', ['-c', pythonCode, filePath], {
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    child.on('close', (code) => {
      if (code === 0 && stdout.includes('REPAIR_SUCCESS')) {
        console.log('[GIF REPAIR] Successfully repaired GIF in-place:', filePath)
        resolve(true)
      } else {
        console.error('[GIF REPAIR] Failed to repair GIF:', filePath, 'Code:', code, 'Stdout:', stdout, 'Stderr:', stderr)
        resolve(false)
      }
    })
  })
}

// Helper to get settings data
function getSettingsData() {
  if (!fs.existsSync(settingsPath)) {
    const defaults = {
      card_size: 'cozy',
      show_titles: true
    }
    fs.mkdirSync(cartridgesDir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 4), 'utf8')
    return defaults
  }
  try {
    const content = fs.readFileSync(settingsPath, 'utf8')
    return JSON.parse(content)
  } catch (e) {
    console.error('Failed to parse settings.json:', e)
    return {
      card_size: 'cozy',
      show_titles: true
    }
  }
}

// IPC Handlers
ipcMain.handle('get-games', async () => {
  if (!fs.existsSync(gamesPath)) {
    return []
  }

  try {
    const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    const gamesPromises = files.map(async (file) => {
      try {
        const content = fs.readFileSync(path.join(gamesPath, file), 'utf8')
        const data = JSON.parse(content)
        
        // Normalize source based on game_id prefix to handle legacy or incorrectly classified scanned games
        if (data.game_id && data.game_id.startsWith('steam_') && data.source === 'imported') {
          data.source = 'steam'
        } else if (data.game_id && data.game_id.startsWith('gog_') && data.source === 'imported') {
          data.source = 'gog'
        }

        if (data.removed || data.blacklisted) {
          return null
        }
        
        let coverUrl = null
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
          const coverFile = coverFiles.find(f => f.startsWith(`${data.game_id}.`) && supportedExts.includes(path.extname(f).toLowerCase()))
          if (coverFile) {
            const fullPath = path.join(coversDir, coverFile)
            
            // Check if the GIF file is healthy
            if (coverFile.toLowerCase().endsWith('.gif')) {
              try {
                await sharp(fullPath).metadata()
              } catch (err) {
                console.warn(`[GIF VALIDATION] GIF cover ${coverFile} is corrupt: ${err.message}. Triggering in-place repair...`)
                const success = await repairGif(fullPath)
                if (!success) {
                  console.error(`[GIF VALIDATION] Failed to repair corrupt GIF: ${coverFile}`)
                }
              }
            }
            
            const finalPath = fullPath.replace(/\\/g, '/')
            coverUrl = `media://${finalPath}`
          }
        }

        return { ...data, coverUrl }
      } catch (err) {
        console.error('Error parsing game file:', file, err)
        return null
      }
    })

    const games = (await Promise.all(gamesPromises)).filter(Boolean)
    return games
  } catch (e) {
    console.error('get-games error:', e)
    return []
  }
})

ipcMain.handle('launch-game', async (event, executable) => {
  console.log('Launching game:', executable)
  return new Promise((resolve, reject) => {
    try {
      let cmd = executable.trim()
      
      // Strip legacy "start " command prefix if present
      if (cmd.startsWith('start ')) {
        cmd = cmd.slice(6).trim()
      }
      
      // If it's a protocol URL, open it cleanly via Electron shell without cmd.exe
      if (cmd.startsWith('steam://') || cmd.startsWith('goggalaxy://') || cmd.startsWith('com.epicgames.launcher://') || cmd.startsWith('origin2://')) {
        shell.openExternal(cmd)
          .then(() => resolve(true))
          .catch(err => reject(err))
        return
      }

      // If it's a direct file path, spawn directly without shell: true
      let execPath = cmd
      if (execPath.startsWith('"') && execPath.endsWith('"')) {
        execPath = execPath.slice(1, -1)
      }

      // Determine working directory (cwd) automatically for the game process
      let launchCwd = undefined
      if (path.isAbsolute(execPath)) {
        launchCwd = path.dirname(execPath)
      }

      const child = spawn(execPath, [], {
        shell: false,
        detached: true,
        cwd: launchCwd,
        stdio: 'ignore',
        windowsHide: true
      })
      
      child.on('error', (err) => {
        console.warn('Failed direct spawn, falling back to shell: true:', err.message)
        try {
          const fallbackChild = spawn(executable, [], {
            shell: true,
            detached: true,
            cwd: launchCwd,
            stdio: 'ignore',
            windowsHide: true
          })
          fallbackChild.unref()
          resolve(true)
        } catch (fallbackErr) {
          reject(fallbackErr)
        }
      })

      child.unref()
      resolve(true)
    } catch (error) {
      console.error('Failed to launch game:', error)
      reject(error)
    }
  })
})

ipcMain.handle('get-settings', async () => {
  return getSettingsData()
})

function clearSteamGames() {
  console.log('[CLEANUP] Removing all Steam games and covers from library...')
  if (fs.existsSync(gamesPath)) {
    const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    for (const dbFile of dbFiles) {
      if (!dbFile.startsWith('steam_')) continue
      const gameId = dbFile.replace('.json', '')
      try {
        fs.unlinkSync(path.join(gamesPath, dbFile))
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          for (const cFile of coverFiles) {
            if (cFile.startsWith(`${gameId}.`)) {
              fs.unlinkSync(path.join(coversDir, cFile))
            }
          }
        }
      } catch (e) {
        console.error(`[CLEANUP] Failed to remove Steam game/cover ${gameId}:`, e.message)
      }
    }
  }
}

function clearGogGames() {
  console.log('[CLEANUP] Removing all GOG games and covers from library...')
  if (fs.existsSync(gamesPath)) {
    const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    for (const dbFile of dbFiles) {
      if (!dbFile.startsWith('gog_')) continue
      const gameId = dbFile.replace('.json', '')
      try {
        fs.unlinkSync(path.join(gamesPath, dbFile))
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          for (const cFile of coverFiles) {
            if (cFile.startsWith(`${gameId}.`)) {
              fs.unlinkSync(path.join(coversDir, cFile))
            }
          }
        }
      } catch (e) {
        console.error(`[CLEANUP] Failed to remove GOG game/cover ${gameId}:`, e.message)
      }
    }
  }
}

function clearEpicGames() {
  console.log('[CLEANUP] Removing all Epic games and covers from library...')
  if (fs.existsSync(gamesPath)) {
    const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    for (const dbFile of dbFiles) {
      if (!dbFile.startsWith('epic_')) continue
      const gameId = dbFile.replace('.json', '')
      try {
        fs.unlinkSync(path.join(gamesPath, dbFile))
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          for (const cFile of coverFiles) {
            if (cFile.startsWith(`${gameId}.`)) {
              fs.unlinkSync(path.join(coversDir, cFile))
            }
          }
        }
      } catch (e) {
        console.error(`[CLEANUP] Failed to remove Epic game/cover ${gameId}:`, e.message)
      }
    }
  }
}

function clearEaGames() {
  console.log('[CLEANUP] Removing all EA games and covers from library...')
  if (fs.existsSync(gamesPath)) {
    const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    for (const dbFile of dbFiles) {
      if (!dbFile.startsWith('ea_')) continue
      const gameId = dbFile.replace('.json', '')
      try {
        fs.unlinkSync(path.join(gamesPath, dbFile))
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          for (const cFile of coverFiles) {
            if (cFile.startsWith(`${gameId}.`)) {
              fs.unlinkSync(path.join(coversDir, cFile))
            }
          }
        }
      } catch (e) {
        console.error(`[CLEANUP] Failed to remove EA game/cover ${gameId}:`, e.message)
      }
    }
  }
}

ipcMain.handle('save-settings', async (event, newSettings) => {
  try {
    const current = getSettingsData()
    const merged = { ...current, ...newSettings }
    fs.mkdirSync(cartridgesDir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 4), 'utf8')
    return merged
  } catch (e) {
    console.error('Failed to save settings:', e)
    throw e
  }
})

ipcMain.handle('save-game', async (event, gameData) => {
  try {
    if (!fs.existsSync(gamesPath)) {
      fs.mkdirSync(gamesPath, { recursive: true })
    }

    let gameId = gameData.game_id
    let existingData = {}

    if (!gameId) {
      // Create new imported game
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
        const content = fs.readFileSync(gameFilePath, 'utf8')
        existingData = JSON.parse(content)
      }
    }

    const merged = { ...existingData, ...gameData, game_id: gameId }
    if (gameId.startsWith('imported_') && merged.source === 'manual') {
      merged.source = 'imported'
    }
    const gameFilePath = path.join(gamesPath, `${gameId}.json`)
    fs.writeFileSync(gameFilePath, JSON.stringify(merged, null, 4), 'utf8')
    
    if (mainWindow) {
      mainWindow.webContents.send('games-updated')
    }

    return { success: true, game: merged }
  } catch (e) {
    console.error('save-game error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('delete-game', async (event, gameId) => {
  try {
    const gameFilePath = path.join(gamesPath, `${gameId}.json`)
    if (fs.existsSync(gameFilePath)) {
      const content = fs.readFileSync(gameFilePath, 'utf8')
      const data = JSON.parse(content)
      
      if (data.source === 'steam' || data.source === 'gog' || gameId.startsWith('steam_') || gameId.startsWith('gog_')) {
        // Prevent auto-scanner from re-adding it
        data.removed = true
        fs.writeFileSync(gameFilePath, JSON.stringify(data, null, 4), 'utf8')
      } else {
        // Custom game, delete files
        fs.unlinkSync(gameFilePath)
        if (fs.existsSync(coversDir)) {
          const coverFiles = fs.readdirSync(coversDir)
          const coverFile = coverFiles.find(f => f.startsWith(`${gameId}.`))
          if (coverFile) {
            fs.unlinkSync(path.join(coversDir, coverFile))
          }
        }
      }

      if (mainWindow) {
        mainWindow.webContents.send('games-updated')
      }
      return true
    }
    return false
  } catch (e) {
    console.error('delete-game error:', e)
    return false
  }
})

ipcMain.handle('update-game-status', async (event, gameId, status) => {
  try {
    const gameFilePath = path.join(gamesPath, `${gameId}.json`)
    if (fs.existsSync(gameFilePath)) {
      const content = fs.readFileSync(gameFilePath, 'utf8')
      const data = JSON.parse(content)
      const updated = { ...data, ...status }
      fs.writeFileSync(gameFilePath, JSON.stringify(updated, null, 4), 'utf8')
      
      if (mainWindow) {
        mainWindow.webContents.send('games-updated')
      }
      return true
    }
    return false
  } catch (e) {
    console.error('update-game-status error:', e)
    return false
  }
})

ipcMain.handle('search-steamgriddb', async (event, query) => {
  try {
    const res = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${steamgriddbApiKey}` }
    })
    if (!res.ok) throw new Error(`SteamGridDB search request failed: ${res.statusText}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data.map(g => ({ id: g.id, name: g.name }))
    }
    return []
  } catch (e) {
    console.error('SteamGridDB search error:', e)
    throw e
  }
})

ipcMain.handle('fetch-steamgriddb-covers', async (event, gameId) => {
  try {
    let url = `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?types=animated,static`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${steamgriddbApiKey}` }
    })
    if (!res.ok) throw new Error(`SteamGridDB fetch covers request failed: ${res.statusText}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data.map(g => ({
        id: g.id,
        thumb: g.thumb || g.url,
        url: g.url,
        type: g.type || 'static',
        width: g.width || 0,
        height: g.height || 0
      }))
    }
    return []
  } catch (e) {
    console.error('SteamGridDB fetch covers error:', e)
    throw e
  }
})

async function downloadCoverFromUrl(gameId, imageUrl) {
  try {
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }
    
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch cover: ${res.statusText}`)
    
    const contentType = res.headers.get('content-type') || ''
    let ext = '.png'
    if (contentType.includes('image/gif')) ext = '.gif'
    else if (contentType.includes('image/webp')) ext = '.webp'
    else if (contentType.includes('image/jpeg')) ext = '.jpg'
    else {
      const urlPath = new URL(imageUrl).pathname
      const urlExt = path.extname(urlPath).toLowerCase()
      if (urlExt) ext = urlExt
    }
    
    // Clear any existing covers to prevent duplicates
    if (fs.existsSync(coversDir)) {
      const files = fs.readdirSync(coversDir)
      for (const file of files) {
        if (file.startsWith(`${gameId}.`)) {
          fs.unlinkSync(path.join(coversDir, file))
        }
      }
    }
    
    const targetPath = path.join(coversDir, `${gameId}${ext}`)
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(targetPath, buffer)
    
    console.log(`Successfully downloaded cover for ${gameId} to ${targetPath}`)
    
    if (ext === '.gif') {
      try {
        await sharp(targetPath).metadata()
      } catch (err) {
        console.warn(`[GIF VALIDATION] Downloaded GIF ${gameId}${ext} is corrupt: ${err.message}. Repairing...`)
        await repairGif(targetPath)
      }
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('games-updated')
    }
    
    const finalPath = targetPath.replace(/\\/g, '/')
    return { success: true, coverUrl: `media://${finalPath}` }
  } catch (e) {
    console.error('Failed to download cover:', e)
    return { success: false, error: e.message }
  }
}

ipcMain.handle('download-cover-url', async (event, gameId, imageUrl) => {
  return downloadCoverFromUrl(gameId, imageUrl)
})

// Quiet background Steam & GOG scanner on startup
async function scanSteamLibrary() {
  console.log('[AUTO-SCAN] Scanning Steam library...')
  let steamPath = 'C:\\Program Files (x86)\\Steam'
  
  try {
    const registryOutput = execSync('reg query HKCU\\Software\\Valve\\Steam /v SteamPath', { encoding: 'utf8', windowsHide: true })
    const match = registryOutput.match(/SteamPath\s+REG_SZ\s+(.+)/)
    if (match && match[1]) {
      steamPath = path.normalize(match[1].trim())
    }
  } catch (e) {
    console.log('[AUTO-SCAN] Could not read Steam path from registry, using default path.')
  }
  
  const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  if (!fs.existsSync(libraryFoldersPath)) {
    console.log('[AUTO-SCAN] Steam libraryfolders.vdf not found.')
    return
  }
  
  try {
    const content = fs.readFileSync(libraryFoldersPath, 'utf8')
    const libraryPaths = parseLibraryFolders(content)
    console.log('[AUTO-SCAN] Found Steam library paths:', libraryPaths)
    
    const foundSteamAppIds = new Set()
    
    for (const libraryPath of libraryPaths) {
      const steamappsDir = path.join(libraryPath, 'steamapps')
      if (!fs.existsSync(steamappsDir)) continue
      
      const files = fs.readdirSync(steamappsDir).filter(f => f.startsWith('appmanifest_') && f.endsWith('.acf'))
      for (const file of files) {
        try {
          const manifestPath = path.join(steamappsDir, file)
          const manifestContent = fs.readFileSync(manifestPath, 'utf8')
          const manifest = parseAcf(manifestContent)
          
          const appId = manifest['appid']
          const name = manifest['name']
          
          if (!appId || !name) continue
          
          const nameLower = name.toLowerCase()
          if (
            nameLower.includes('dedicated server') || 
            nameLower.includes('sdk') || 
            nameLower.includes('tool') || 
            nameLower.includes('steamworks') ||
            nameLower.includes('redistributables') ||
            nameLower.includes('server')
          ) {
            continue
          }
          
          const gameId = `steam_${appId}`
          foundSteamAppIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)
          
          if (!fs.existsSync(gameFilePath)) {
            const gameData = {
              added: Math.floor(Date.now() / 1000),
              developer: null,
              executable: `steam://rungameid/${appId}`,
              game_id: gameId,
              hidden: false,
              last_played: 0,
              name: name,
              removed: false,
              source: 'steam',
              version: 1.5
            }
            if (!fs.existsSync(gamesPath)) {
              fs.mkdirSync(gamesPath, { recursive: true })
            }
            fs.writeFileSync(gameFilePath, JSON.stringify(gameData, null, 4), 'utf8')
            console.log('[AUTO-SCAN] Added new Steam game:', name)
          } else {
            // Patch name only if the stored name appears to be a garbled/corrupted UTF-8 string from prior scans
            try {
              const existing = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
              const garbledSequences = ['â„¢', 'Â®', 'â€™', 'ï¿½', 'â\x84¢', 'Ã©', 'â€']
              const hasGarbled = garbledSequences.some(seq => existing.name && existing.name.includes(seq))
              
              if (hasGarbled && existing.name !== name) {
                existing.name = name
                fs.writeFileSync(gameFilePath, JSON.stringify(existing, null, 4), 'utf8')
                console.log('[AUTO-SCAN] Fixed garbled name for Steam game:', name)
              }
            } catch (e) {
              console.error('[AUTO-SCAN] Failed to patch name for', gameId, e.message)
            }
          }
        } catch (err) {
          console.error('[AUTO-SCAN] Error parsing manifest:', file, err)
        }
      }
    }
    
    // Clean up uninstalled Steam games
    if (fs.existsSync(gamesPath)) {
      const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
      for (const dbFile of dbFiles) {
        if (!dbFile.startsWith('steam_')) continue
        const gameId = dbFile.replace('.json', '')
        if (!foundSteamAppIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Steam game ${gameId} is no longer installed on the system. Removing from library...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
            if (fs.existsSync(coversDir)) {
              const coverFiles = fs.readdirSync(coversDir)
              for (const cFile of coverFiles) {
                if (cFile.startsWith(`${gameId}.`)) {
                  fs.unlinkSync(path.join(coversDir, cFile))
                }
              }
            }
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to clean up uninstalled Steam game ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Steam scan failed:', err)
  }
}

async function scanGogLibrary() {
  console.log('[AUTO-SCAN] Scanning GOG library via registry...')
  return new Promise((resolve) => {
    try {
      const cmd = 'reg query HKLM\\Software\\Wow6432Node\\GOG.com\\Games /s'
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          console.log('[AUTO-SCAN] No GOG games found in registry or query failed.')
          resolve()
          return
        }
        
        try {
          if (!stdout || !stdout.trim()) {
            resolve()
            return
          }
          
          const entries = []
          let currentEntry = null
          const lines = stdout.split(/\r?\n/)
          
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            
            if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\GOG.com\\Games\\')) {
              if (currentEntry && currentEntry.gameID && currentEntry.gameName) {
                entries.push(currentEntry)
              }
              currentEntry = {
                gameID: '',
                gameName: '',
                exe: '',
                path: '',
                dependsOn: ''
              }
              continue
            }
            
            if (currentEntry) {
              const match = trimmed.match(/^([a-zA-Z0-9_]+)\s+REG_SZ\s+(.*)$/)
              if (match) {
                const prop = match[1]
                const val = match[2].trim()
                if (prop === 'gameID') currentEntry.gameID = val
                else if (prop === 'gameName') currentEntry.gameName = val
                else if (prop === 'exe') currentEntry.exe = val
                else if (prop === 'path') currentEntry.path = val
                else if (prop === 'dependsOn') currentEntry.dependsOn = val
              }
            }
          }
          
          if (currentEntry && currentEntry.gameID && currentEntry.gameName) {
            entries.push(currentEntry)
          }
          
          const foundGogIds = new Set()
          
          for (const entry of entries) {
            if (!entry.gameID || !entry.gameName || !entry.exe) continue
            
            const gameId = `gog_${entry.gameID}`
            foundGogIds.add(gameId)
            const gameFilePath = path.join(gamesPath, `${gameId}.json`)
            
            if (!fs.existsSync(gameFilePath)) {
              let fullExe = entry.exe
              if (!path.isAbsolute(fullExe)) {
                fullExe = path.join(entry.path, entry.exe)
              }
              
              const gameData = {
                added: Math.floor(Date.now() / 1000),
                developer: null,
                executable: `"${fullExe}"`,
                game_id: gameId,
                hidden: false,
                last_played: 0,
                name: entry.gameName,
                removed: false,
                source: 'gog',
                version: 1.5
              }
              
              if (!fs.existsSync(gamesPath)) {
                fs.mkdirSync(gamesPath, { recursive: true })
              }
              fs.writeFileSync(gameFilePath, JSON.stringify(gameData, null, 4), 'utf8')
              console.log('[AUTO-SCAN] Added GOG game:', entry.gameName)
            }
          }
          
          // Clean up uninstalled GOG games
          if (fs.existsSync(gamesPath)) {
            const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
            for (const dbFile of dbFiles) {
              if (!dbFile.startsWith('gog_')) continue
              const gameId = dbFile.replace('.json', '')
              if (!foundGogIds.has(gameId)) {
                console.log(`[AUTO-SCAN] GOG game ${gameId} is no longer installed on the system. Removing from library...`)
                try {
                  fs.unlinkSync(path.join(gamesPath, dbFile))
                  if (fs.existsSync(coversDir)) {
                    const coverFiles = fs.readdirSync(coversDir)
                    for (const cFile of coverFiles) {
                      if (cFile.startsWith(`${gameId}.`)) {
                        fs.unlinkSync(path.join(coversDir, cFile))
                      }
                    }
                  }
                } catch (e) {
                  console.error(`[AUTO-SCAN] Failed to clean up uninstalled GOG game ${gameId}:`, e.message)
                }
              }
            }
          }
        } catch (err) {
          console.error('[AUTO-SCAN] Error processing GOG registry results:', err)
        }
        resolve()
      })
    } catch (err) {
      console.error('[AUTO-SCAN] GOG registry scan failed:', err)
      resolve()
    }
  })
}

async function scanEpicLibrary() {
  console.log('[AUTO-SCAN] Scanning Epic Games library...')
  const manifestsDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'
  if (!fs.existsSync(manifestsDir)) {
    console.log('[AUTO-SCAN] Epic Games manifests directory not found. Skipping.')
    return
  }

  try {
    const files = fs.readdirSync(manifestsDir).filter(f => f.endsWith('.item'))
    const foundEpicIds = new Set()

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(manifestsDir, file), 'utf8')
        const manifest = JSON.parse(content)

        // Skip incomplete installs
        if (manifest.bIsIncompleteInstall) continue

        // Skip non-game entries (e.g. Unreal Engine, launcher itself)
        const cats = Array.isArray(manifest.AppCategories) ? manifest.AppCategories : []
        if (!cats.includes('games')) continue

        const appName = manifest.AppName
        const displayName = manifest.DisplayName
        if (!appName || !displayName) continue

        const gameId = `epic_${appName}`
        foundEpicIds.add(gameId)
        const gameFilePath = path.join(gamesPath, `${gameId}.json`)

        if (!fs.existsSync(gameFilePath)) {
          const gameData = {
            added: Math.floor(Date.now() / 1000),
            developer: null,
            executable: `com.epicgames.launcher://apps/${appName}?action=launch`,
            game_id: gameId,
            hidden: false,
            last_played: 0,
            name: displayName,
            removed: false,
            source: 'epic',
            version: 1.5
          }
          if (!fs.existsSync(gamesPath)) {
            fs.mkdirSync(gamesPath, { recursive: true })
          }
          fs.writeFileSync(gameFilePath, JSON.stringify(gameData, null, 4), 'utf8')
          console.log('[AUTO-SCAN] Added Epic game:', displayName)
        }
      } catch (err) {
        console.error('[AUTO-SCAN] Error parsing Epic manifest:', file, err.message)
      }
    }

    // Clean up uninstalled Epic games
    if (fs.existsSync(gamesPath)) {
      const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
      for (const dbFile of dbFiles) {
        if (!dbFile.startsWith('epic_')) continue
        const gameId = dbFile.replace('.json', '')
        if (!foundEpicIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Epic game ${gameId} is no longer installed. Removing from library...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
            if (fs.existsSync(coversDir)) {
              const coverFiles = fs.readdirSync(coversDir)
              for (const cFile of coverFiles) {
                if (cFile.startsWith(`${gameId}.`)) {
                  fs.unlinkSync(path.join(coversDir, cFile))
                }
              }
            }
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to clean up uninstalled Epic game ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Epic scan failed:', err)
  }
}

async function scanEaLibrary() {
  console.log('[AUTO-SCAN] Scanning EA library via registry...')
  
  // Keys to skip — EA infrastructure, not games
  const EA_SKIP_KEYS = ['EA Core', 'EA Desktop', 'EADM', 'EA Games']

  return new Promise((resolve) => {
    const cmd = 'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts" /s'
    exec(cmd, { windowsHide: true }, (error, stdout) => {
      if (error || !stdout || !stdout.trim()) {
        console.log('[AUTO-SCAN] No EA games found in registry or query failed.')
        resolve()
        return
      }

      try {
        const entries = []
        let currentEntry = null
        const lines = stdout.split(/\r?\n/)

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          // Top-level game key (exactly one level deep, no sub-keys)
          const topKeyMatch = trimmed.match(/^HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\([^\\]+)$/i)
          if (topKeyMatch) {
            if (currentEntry && currentEntry.displayName && currentEntry.installDir) {
              entries.push(currentEntry)
            }
            const keyName = topKeyMatch[1]
            if (EA_SKIP_KEYS.some(k => keyName.toLowerCase() === k.toLowerCase())) {
              currentEntry = null
            } else {
              currentEntry = { keyName, displayName: '', installDir: '' }
            }
            continue
          }

          // Sub-key — save what we have, then stop collecting
          if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\')) {
            if (currentEntry && currentEntry.displayName && currentEntry.installDir) {
              entries.push(currentEntry)
            }
            currentEntry = null
            continue
          }

          if (currentEntry) {
            const dispMatch = trimmed.match(/^DisplayName\s+REG_SZ\s+(.+)$/)
            if (dispMatch) currentEntry.displayName = dispMatch[1].trim()
            const dirMatch = trimmed.match(/^Install Dir\s+REG_SZ\s+(.+)$/)
            if (dirMatch) currentEntry.installDir = dirMatch[1].trim()
          }
        }
        if (currentEntry && currentEntry.displayName && currentEntry.installDir) {
          entries.push(currentEntry)
        }

        const foundEaIds = new Set()

        for (const entry of entries) {
          if (!entry.displayName || !entry.installDir) continue

          // Try to get the contentID from installerdata.xml
          let contentId = null
          const xmlPath = path.join(entry.installDir.replace(/[\\/]+$/, ''), '__Installer', 'installerdata.xml')
          if (fs.existsSync(xmlPath)) {
            try {
              const xml = fs.readFileSync(xmlPath, 'utf8')
              const m = xml.match(/<contentID>([^<]+)<\/contentID>/)
              if (m) contentId = m[1].trim()
            } catch (e) {
              console.error('[AUTO-SCAN] Error reading EA installerdata.xml:', e.message)
            }
          }

          if (!contentId) {
            console.log(`[AUTO-SCAN] Skipping EA game with no contentID: ${entry.displayName}`)
            continue
          }

          const gameId = `ea_${contentId}`
          foundEaIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          if (!fs.existsSync(gameFilePath)) {
            const gameData = {
              added: Math.floor(Date.now() / 1000),
              developer: null,
              executable: `origin2://game/launch?offerIds=${contentId}`,
              game_id: gameId,
              hidden: false,
              last_played: 0,
              name: entry.displayName,
              removed: false,
              source: 'ea',
              version: 1.5
            }
            if (!fs.existsSync(gamesPath)) fs.mkdirSync(gamesPath, { recursive: true })
            fs.writeFileSync(gameFilePath, JSON.stringify(gameData, null, 4), 'utf8')
            console.log('[AUTO-SCAN] Added EA game:', entry.displayName)
          }
        }

        // Clean up uninstalled EA games
        if (fs.existsSync(gamesPath)) {
          const dbFiles = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
          for (const dbFile of dbFiles) {
            if (!dbFile.startsWith('ea_')) continue
            const gameId = dbFile.replace('.json', '')
            if (!foundEaIds.has(gameId)) {
              console.log(`[AUTO-SCAN] EA game ${gameId} is no longer installed. Removing from library...`)
              try {
                fs.unlinkSync(path.join(gamesPath, dbFile))
                if (fs.existsSync(coversDir)) {
                  const coverFiles = fs.readdirSync(coversDir)
                  for (const cFile of coverFiles) {
                    if (cFile.startsWith(`${gameId}.`)) fs.unlinkSync(path.join(coversDir, cFile))
                  }
                }
              } catch (e) {
                console.error(`[AUTO-SCAN] Failed to clean up uninstalled EA game ${gameId}:`, e.message)
              }
            }
          }
        }
      } catch (err) {
        console.error('[AUTO-SCAN] Error processing EA registry results:', err)
      }
      resolve()
    })
  })
}

async function runBackgroundCoverDownloader() {
  console.log('[BG-COVER] Starting background cover downloader...')
  if (!fs.existsSync(gamesPath)) return
  
  const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(gamesPath, file), 'utf8')
      const data = JSON.parse(content)
      
      if (data.removed || data.blacklisted) continue
      
      const gameId = data.game_id
      
      let hasCover = false
      if (fs.existsSync(coversDir)) {
        const coverFiles = fs.readdirSync(coversDir)
        const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
        hasCover = coverFiles.some(f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase()))
      }
      
      if (hasCover) continue
      
      console.log(`[BG-COVER] Missing cover for ${data.name} (${gameId}). Starting download...`)
      
      let sgdbSuccess = false
      
      // Try SteamGridDB cover downloader first
      try {
        console.log(`[BG-COVER] Querying SteamGridDB for ${data.name}...`)
        const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(data.name)}`, {
          headers: { 'Authorization': `Bearer ${steamgriddbApiKey}` }
        })
        if (searchRes.ok) {
          const searchJson = await searchRes.json()
          if (searchJson.success && Array.isArray(searchJson.data) && searchJson.data.length > 0) {
            const sgdbGameId = searchJson.data[0].id
            
            let grids = []
            // 1. Try animated grids first
            try {
              const animRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${sgdbGameId}?types=animated`, {
                headers: { 'Authorization': `Bearer ${steamgriddbApiKey}` }
              })
              if (animRes.ok) {
                const animJson = await animRes.json()
                if (animJson.success && Array.isArray(animJson.data) && animJson.data.length > 0) {
                  grids = animJson.data
                }
              }
            } catch (animErr) {
              console.error('[BG-COVER] SteamGridDB animated grid query failed:', animErr.message)
            }
            
            // 2. If no animated grids, try static grids
            if (grids.length === 0) {
              try {
                const statRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${sgdbGameId}?types=static`, {
                  headers: { 'Authorization': `Bearer ${steamgriddbApiKey}` }
                })
                if (statRes.ok) {
                  const statJson = await statRes.json()
                  if (statJson.success && Array.isArray(statJson.data) && statJson.data.length > 0) {
                     grids = statJson.data
                  }
                }
              } catch (statErr) {
                console.error('[BG-COVER] SteamGridDB static grid query failed:', statErr.message)
              }
            }
            
            if (grids.length > 0) {
              const firstGridUrl = grids[0].url
              console.log(`[BG-COVER] Selected SteamGridDB cover for ${data.name}: ${firstGridUrl}`)
              const dlResult = await downloadCoverFromUrl(gameId, firstGridUrl)
              if (dlResult.success) {
                console.log(`[BG-COVER] Successfully downloaded cover from SteamGridDB for ${data.name}`)
                sgdbSuccess = true
              } else {
                console.warn(`[BG-COVER] Failed to download SteamGridDB cover for ${data.name}:`, dlResult.error)
                if (mainWindow) {
                  mainWindow.webContents.send('show-toast', {
                    message: `SteamGridDB cover download failed for ${data.name}: ${dlResult.error}. Trying fallback...`,
                    type: 'error'
                  })
                }
              }
            }
          }
        }
      } catch (sgdbErr) {
        console.error(`[BG-COVER] SteamGridDB attempt failed for ${data.name}:`, sgdbErr.message)
        if (mainWindow) {
          mainWindow.webContents.send('show-toast', {
            message: `SteamGridDB search error for ${data.name}: ${sgdbErr.message}`,
            type: 'error'
          })
        }
      }
      
      if (sgdbSuccess) continue
      
      // Fallback to official native platform CDNs
      if (data.source === 'steam') {
        const appId = gameId.replace('steam_', '')
        const formats = [
          `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
          `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
          `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
        ]
        
        for (const url of formats) {
          try {
            const res = await fetch(url, { method: 'HEAD' })
            if (res.ok) {
              const dlResult = await downloadCoverFromUrl(gameId, url)
              if (dlResult.success) {
                console.log(`[BG-COVER] Successfully downloaded Steam cover for ${data.name} from CDN`)
                break
              }
            }
          } catch (err) {
            console.error(`[BG-COVER] Failed download attempt for ${data.name} from ${url}:`, err.message)
          }
        }
        
      } else if (data.source === 'gog') {
        const productId = gameId.replace('gog_', '')
        const apiUrl = `https://api.gog.com/products/${productId}`
        
        try {
          const res = await fetch(apiUrl)
          if (res.ok) {
            const json = await res.json()
            const iconUrl = json.images && json.images.icon
            if (iconUrl) {
              const hashMatch = iconUrl.match(/\/([a-f0-9]{64})/i)
              if (hashMatch) {
                const hash = hashMatch[1]
                const coverUrl = `https://images.gog-statics.com/${hash}_glx_vertical_cover.webp`
                const dlResult = await downloadCoverFromUrl(gameId, coverUrl)
                if (dlResult.success) {
                  console.log(`[BG-COVER] Successfully downloaded GOG cover for ${data.name}`)
                }
              }
            }
          }
        } catch (err) {
          console.error(`[BG-COVER] GOG API cover download failed for ${data.name}:`, err.message)
        }
      }
      
    } catch (err) {
      console.error(`[BG-COVER] Error processing cover for ${file}:`, err.message)
    }
  }
}

function parseLibraryFolders(content) {
  const paths = []
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*"path"\s*"([^"]+)"/i)
    if (match) {
      paths.push(match[1].replace(/\\\\/g, '\\'))
    }
  }
  return paths
}

function parseAcf(content) {
  const result = {}
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*"([^"]+)"\s*"([^"]+)"/)
    if (match) {
      result[match[1].toLowerCase()] = match[2]
    }
  }
  return result
}

function runAutoScan() {
  Promise.all([scanSteamLibrary(), scanGogLibrary(), scanEpicLibrary(), scanEaLibrary()]).then(() => {
    console.log('[AUTO-SCAN] Background auto-scan completed successfully.')
    if (mainWindow) {
      mainWindow.webContents.send('games-updated')
    }
    runBackgroundCoverDownloader()
  }).catch(e => {
    console.error('[AUTO-SCAN] Background auto-scan encountered an error:', e)
  })
}

// App lifecycle
app.whenReady().then(() => {
  protocol.handle('media', async (request) => {
    try {
      let urlStr = request.url
      urlStr = urlStr.replace(/^media:\/\/\/?/, 'file:///')
      if (urlStr.match(/^file:\/\/\/[a-zA-Z]\//)) {
        urlStr = urlStr.replace(/^file:\/\/\/([a-zA-Z])\//, 'file:///$1:/')
      }
      
      const filePath = fileURLToPath(urlStr)
      const ext = path.extname(filePath).toLowerCase()
      let mimeType = 'image/png'
      if (ext === '.gif') mimeType = 'image/gif'
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
      else if (ext === '.webp') mimeType = 'image/webp'
      else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff'

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

  setTimeout(runAutoScan, 2000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
