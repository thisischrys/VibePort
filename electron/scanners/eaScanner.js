import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'

const EA_SKIP_KEYS = ['EA Core', 'EA Desktop', 'EADM', 'EA Games']

export function scanEaLibrary() {
  console.log('[AUTO-SCAN] Scanning EA library via registry...')

  return new Promise((resolve) => {
    exec('reg query "HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts" /s', { windowsHide: true }, (error, stdout) => {
      if (error || !stdout?.trim()) {
        console.log('[AUTO-SCAN] No EA games found in registry or query failed.')
        return resolve()
      }

      try {
        const entries = []
        let current = null

        for (const line of stdout.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const topKey = trimmed.match(/^HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\([^\\]+)$/i)
          if (topKey) {
            if (current?.displayName && current?.installDir) entries.push(current)
            const keyName = topKey[1]
            current = EA_SKIP_KEYS.some(k => keyName.toLowerCase() === k.toLowerCase())
              ? null
              : { keyName, displayName: '', installDir: '' }
            continue
          }

          // Sub-key — flush and stop collecting
          if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\')) {
            if (current?.displayName && current?.installDir) entries.push(current)
            current = null
            continue
          }

          if (current) {
            const dispMatch = trimmed.match(/^DisplayName\s+REG_SZ\s+(.+)$/)
            if (dispMatch) current.displayName = dispMatch[1].trim()
            const dirMatch = trimmed.match(/^Install Dir\s+REG_SZ\s+(.+)$/)
            if (dirMatch) current.installDir = dirMatch[1].trim()
          }
        }
        if (current?.displayName && current?.installDir) entries.push(current)

        const foundIds = new Set()

        for (const entry of entries) {
          if (!entry.displayName || !entry.installDir) continue

          // Resolve the EA contentID from installerdata.xml
          let contentId = null
          const xmlPath = path.join(entry.installDir.replace(/[\/\\]+$/, ''), '__Installer', 'installerdata.xml')
          if (fs.existsSync(xmlPath)) {
            try {
              const m = fs.readFileSync(xmlPath, 'utf8').match(/<contentID>([^<]+)<\/contentID>/)
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
          foundIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          if (!fs.existsSync(gameFilePath)) {
            writeGame(gameId, {
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
            })
            console.log('[AUTO-SCAN] Added EA game:', entry.displayName)
          }
        }

        // Remove uninstalled EA games
        if (fs.existsSync(gamesPath)) {
          for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('ea_') && f.endsWith('.json'))) {
            const gameId = dbFile.replace('.json', '')
            if (!foundIds.has(gameId)) {
              console.log(`[AUTO-SCAN] EA game ${gameId} uninstalled. Removing...`)
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
        console.error('[AUTO-SCAN] Error processing EA registry results:', err)
      }
      resolve()
    })
  })
}
