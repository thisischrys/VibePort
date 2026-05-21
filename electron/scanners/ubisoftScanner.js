import fs from 'node:fs'
import path from 'node:path'
import { exec, execSync } from 'node:child_process'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'

export function scanUbisoftLibrary() {
  console.log('[AUTO-SCAN] Scanning Ubisoft library via registry...')

  return new Promise((resolve) => {
    exec('reg query "HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs" /s', { windowsHide: true }, (error, stdout) => {
      if (error || !stdout?.trim()) {
        console.log('[AUTO-SCAN] No Ubisoft games found in registry or query failed.')
        return resolve()
      }

      try {
        const entries = []
        let current = null

        for (const line of stdout.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const keyMatch = trimmed.match(/^HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs\\([0-9]+)$/i)
          if (keyMatch) {
            if (current?.id && current?.installDir) {
              entries.push(current)
            }
            current = { id: keyMatch[1], installDir: '' }
            continue
          }

          // If we hit a different key header, flush and stop collecting
          if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\SOFTWARE\\')) {
            if (current?.id && current?.installDir) {
              entries.push(current)
            }
            current = null
            continue
          }

          if (current) {
            const dirMatch = trimmed.match(/^InstallDir\s+REG_SZ\s+(.+)$/i)
            if (dirMatch) {
              current.installDir = dirMatch[1].trim()
            }
          }
        }
        if (current?.id && current?.installDir) {
          entries.push(current)
        }

        const foundIds = new Set()

        for (const entry of entries) {
          if (!entry.id || !entry.installDir) continue

          // Query display name from Windows Uninstall registry
          let displayName = ''
          try {
            const uninstallOutput = execSync(
              `reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Uplay Install ${entry.id}" /v DisplayName`,
              { encoding: 'utf8', windowsHide: true, timeout: 2000 }
            )
            const match = uninstallOutput.match(/DisplayName\s+REG_SZ\s+(.+)/)
            if (match?.[1]) {
              displayName = match[1].trim()
            }
          } catch (e) {
            // DisplayName query failed or timed out
          }

          // Fallback to directory name if registry DisplayName wasn't found
          if (!displayName) {
            const folderName = path.basename(entry.installDir.replace(/[\/\\]+$/, ''))
            displayName = folderName || `Ubisoft Game ${entry.id}`
          }

          const gameId = `ubisoft_${entry.id}`
          foundIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          if (!fs.existsSync(gameFilePath)) {
            writeGame(gameId, {
              added: Math.floor(Date.now() / 1000),
              developer: null,
              executable: `uplay://launch/${entry.id}`,
              game_id: gameId,
              hidden: false,
              last_played: 0,
              name: displayName,
              removed: false,
              source: 'ubisoft',
              version: 1.5
            })
            console.log('[AUTO-SCAN] Added Ubisoft game:', displayName)
          }
        }

        // Remove uninstalled Ubisoft games
        if (fs.existsSync(gamesPath)) {
          for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('ubisoft_') && f.endsWith('.json'))) {
            const gameId = dbFile.replace('.json', '')
            if (!foundIds.has(gameId)) {
              console.log(`[AUTO-SCAN] Ubisoft game ${gameId} uninstalled. Removing...`)
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
        console.error('[AUTO-SCAN] Error processing Ubisoft registry results:', err)
      }
      resolve()
    })
  })
}
