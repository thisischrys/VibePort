import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

const legacyDir = path.join(app.getPath('home'), 'AppData', 'Local', 'vibeport')
const standardDir = app.getPath('userData')

let activeDir = standardDir

// If standard dir has no games/settings, but legacy dir exists, migrate it
if (
  !fs.existsSync(path.join(standardDir, 'settings.json')) &&
  !fs.existsSync(path.join(standardDir, 'games')) &&
  fs.existsSync(legacyDir)
) {
  try {
    console.log(`[PATHS] Migrating legacy AppData from ${legacyDir} to ${standardDir}...`)
    const parentDir = path.dirname(standardDir)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }
    fs.renameSync(legacyDir, standardDir)
    console.log('[PATHS] Migration successful!')
  } catch (err) {
    console.error(`[PATHS] Failed to migrate legacy folder: ${err.message}. Falling back to legacy path.`)
    activeDir = legacyDir
  }
}

export const vibeportDir = activeDir
export const gamesPath = path.join(vibeportDir, 'games')
export const coversDir = path.join(vibeportDir, 'covers')
export const settingsPath = path.join(vibeportDir, 'settings.json')

export const STEAMGRIDDB_API_KEY = 'a8dc25ee4cba2b7e42c459cad790da4f'
export const RAWG_API_KEY = 'c542e67aec3a4340908f9de9e86038af'

