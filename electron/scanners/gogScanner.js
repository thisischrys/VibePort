import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'

export function scanGogLibrary() {
  console.log('[AUTO-SCAN] Scanning GOG library via registry...')
  return new Promise((resolve) => {
    exec('reg query HKLM\\Software\\Wow6432Node\\GOG.com\\Games /s', { windowsHide: true }, (error, stdout) => {
      if (error || !stdout?.trim()) {
        console.log('[AUTO-SCAN] No GOG games found in registry or query failed.')
        return resolve()
      }

      try {
        const entries = []
        let current = null

        for (const line of stdout.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\GOG.com\\Games\\')) {
            if (current?.gameID && current?.gameName) entries.push(current)
            current = { gameID: '', gameName: '', exe: '', path: '' }
            continue
          }

          if (current) {
            const match = trimmed.match(/^([a-zA-Z0-9_]+)\s+REG_SZ\s+(.*)$/)
            if (match) {
              const [, prop, val] = match
              if (prop === 'gameID') current.gameID = val.trim()
              else if (prop === 'gameName') current.gameName = val.trim()
              else if (prop === 'exe') current.exe = val.trim()
              else if (prop === 'path') current.path = val.trim()
            }
          }
        }
        if (current?.gameID && current?.gameName) entries.push(current)

        const foundIds = new Set()

        for (const entry of entries) {
          if (!entry.gameID || !entry.gameName || !entry.exe) continue

          const gameId = `gog_${entry.gameID}`
          foundIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          if (!fs.existsSync(gameFilePath)) {
            let fullExe = entry.exe
            if (!path.isAbsolute(fullExe)) fullExe = path.join(entry.path, entry.exe)

            writeGame(gameId, {
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
            })
            console.log('[AUTO-SCAN] Added GOG game:', entry.gameName)
          }
        }

        // Remove uninstalled GOG games
        if (fs.existsSync(gamesPath)) {
          for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('gog_') && f.endsWith('.json'))) {
            const gameId = dbFile.replace('.json', '')
            if (!foundIds.has(gameId)) {
              console.log(`[AUTO-SCAN] GOG game ${gameId} uninstalled. Removing...`)
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
        console.error('[AUTO-SCAN] Error processing GOG registry results:', err)
      }
      resolve()
    })
  })
}
