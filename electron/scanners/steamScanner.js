import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { gamesPath, coversDir } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

function parseLibraryFolders(content) {
  const paths = []
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*"path"\s*"([^"]+)"/i)
    if (match) paths.push(match[1].replace(/\\\\/g, '\\'))
  }
  return paths
}

function parseAcf(content) {
  const result = {}
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*"([^"]+)"\s*"([^"]+)"/)
    if (match) result[match[1].toLowerCase()] = match[2]
  }
  return result
}

export async function scanSteamLibrary() {
  console.log('[AUTO-SCAN] Scanning Steam library...')
  let steamPath = 'C:\\Program Files (x86)\\Steam'

  try {
    const registryOutput = execSync('reg query HKCU\\Software\\Valve\\Steam /v SteamPath', {
      encoding: 'utf8', windowsHide: true
    })
    const match = registryOutput.match(/SteamPath\s+REG_SZ\s+(.+)/)
    if (match?.[1]) steamPath = path.normalize(match[1].trim())
  } catch {
    console.log('[AUTO-SCAN] Could not read Steam path from registry, using default path.')
  }

  const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  if (!fs.existsSync(libraryFoldersPath)) {
    console.log('[AUTO-SCAN] Steam libraryfolders.vdf not found.')
    return
  }

  try {
    const libraryPaths = parseLibraryFolders(fs.readFileSync(libraryFoldersPath, 'utf8'))
    console.log('[AUTO-SCAN] Found Steam library paths:', libraryPaths)

    const foundIds = new Set()

    for (const libraryPath of libraryPaths) {
      const steamappsDir = path.join(libraryPath, 'steamapps')
      if (!fs.existsSync(steamappsDir)) continue

      const files = fs.readdirSync(steamappsDir).filter(f => f.startsWith('appmanifest_') && f.endsWith('.acf'))
      for (const file of files) {
        try {
          const manifest = parseAcf(fs.readFileSync(path.join(steamappsDir, file), 'utf8'))
          const { appid: appId, name } = manifest
          if (!appId || !name) continue

          const nameLower = name.toLowerCase()
          if (['dedicated server', 'sdk', 'tool', 'steamworks', 'redistributables', 'server'].some(k => nameLower.includes(k))) continue

          const gameId = `steam_${appId}`
          foundIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          if (!fs.existsSync(gameFilePath)) {
            writeGame(gameId, {
              added: Math.floor(Date.now() / 1000),
              developer: null,
              executable: `steam://rungameid/${appId}`,
              game_id: gameId,
              hidden: false,
              last_played: 0,
              name,
              removed: false,
              source: 'steam',
              version: 1.5
            })
            console.log('[AUTO-SCAN] Added new Steam game:', name)
          } else {
            // Fix garbled UTF-8 names from legacy scans
            try {
              const existing = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
              const garbled = ['â„¢', 'Â®', 'â€™', 'ï¿½', 'Ã©', 'â€']
              if (garbled.some(seq => existing.name?.includes(seq)) && existing.name !== name) {
                existing.name = name
                writeGame(gameId, existing)
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

    // Remove uninstalled Steam games
    const settings = getSettingsData()
    if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
      for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('steam_') && f.endsWith('.json'))) {
        const gameId = dbFile.replace('.json', '')
        if (!foundIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Steam game ${gameId} uninstalled. Removing...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
            removeCoverFiles(gameId)
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to remove ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Steam scan failed:', err)
  }
}
