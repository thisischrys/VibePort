import fs from 'node:fs'
import path from 'node:path'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'

const MANIFESTS_DIR = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'

export async function scanEpicLibrary() {
  console.log('[AUTO-SCAN] Scanning Epic Games library...')

  if (!fs.existsSync(MANIFESTS_DIR)) {
    console.log('[AUTO-SCAN] Epic Games manifests directory not found. Skipping.')
    return
  }

  try {
    const files = fs.readdirSync(MANIFESTS_DIR).filter(f => f.endsWith('.item'))
    const foundIds = new Set()

    for (const file of files) {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf8'))

        if (manifest.bIsIncompleteInstall) continue
        const cats = Array.isArray(manifest.AppCategories) ? manifest.AppCategories : []
        if (!cats.includes('games')) continue

        const { AppName: appName, DisplayName: displayName } = manifest
        if (!appName || !displayName) continue

        const gameId = `epic_${appName}`
        foundIds.add(gameId)
        const gameFilePath = path.join(gamesPath, `${gameId}.json`)

        if (!fs.existsSync(gameFilePath)) {
          writeGame(gameId, {
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
          })
          console.log('[AUTO-SCAN] Added Epic game:', displayName)
        }
      } catch (err) {
        console.error('[AUTO-SCAN] Error parsing Epic manifest:', file, err.message)
      }
    }

    // Remove uninstalled Epic games
    if (fs.existsSync(gamesPath)) {
      for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('epic_') && f.endsWith('.json'))) {
        const gameId = dbFile.replace('.json', '')
        if (!foundIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Epic game ${gameId} uninstalled. Removing...`)
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
    console.error('[AUTO-SCAN] Epic scan failed:', err)
  }
}
