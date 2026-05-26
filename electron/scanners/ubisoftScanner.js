import fs from 'node:fs'
import path from 'node:path'
import { exec, execSync } from 'node:child_process'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

function getUbisoftGameNameFromState(stateFilePath) {
  if (!fs.existsSync(stateFilePath)) return null
  try {
    const buffer = fs.readFileSync(stateFilePath)
    const candidates = new Set()
    for (let i = 0; i < buffer.length; i++) {
      const len = buffer[i]
      if (len >= 3 && len <= 100 && i + 1 + len <= buffer.length) {
        let isPrintable = true
        const chars = []
        for (let j = 0; j < len; j++) {
          const b = buffer[i + 1 + j]
          if (b < 32 || b > 126) {
            isPrintable = false
            break
          }
          chars.push(String.fromCharCode(b))
        }
        if (isPrintable) {
          candidates.add(chars.join(''))
        }
      }
    }

    const list = Array.from(candidates).filter(s => {
      if (s.length === 40 && /^[0-9a-fA-F]+$/.test(s)) return false
      if (['EULA', 'en-US', 'en-GB'].includes(s)) return false
      const lower = s.toLowerCase()
      if (lower.includes('license agreement')) return false
      if (lower.includes('user license')) return false
      if (lower.includes('end user')) return false
      if (lower.includes('eula')) return false
      if (lower.includes('vcredist')) return false
      if (s.startsWith('vcredist')) return false
      return true
    })

    const withSpaces = list.filter(s => s.includes(' '))
    if (withSpaces.length > 0) {
      return withSpaces.reduce((a, b) => b.length > a.length ? b : a)
    }

    if (list.length > 0) {
      return list.reduce((a, b) => b.length > a.length ? b : a)
    }
  } catch (e) {
    console.error('[AUTO-SCAN] Error parsing uplay_install.state:', e.message)
  }
  return null
}

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

          // 1. Try to query state file for correct name first (contains precise display name)
          let displayName = ''
          const stateFilePath = path.join(entry.installDir.replace(/[\/\\]+$/, ''), 'uplay_install.state')
          if (fs.existsSync(stateFilePath)) {
            displayName = getUbisoftGameNameFromState(stateFilePath) || ''
          }

          // 2. Query display name from Windows Uninstall registry as second choice
          if (!displayName) {
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
          }

          // 3. Fallback to directory name if all else fails
          if (!displayName) {
            const folderName = path.basename(entry.installDir.replace(/[\/\\]+$/, ''))
            displayName = folderName || `Ubisoft Game ${entry.id}`
          }

          const gameId = `ubisoft_${entry.id}`
          foundIds.add(gameId)
          const gameFilePath = path.join(gamesPath, `${gameId}.json`)

          // Check if game json already exists or has mismatching name
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
          } else {
            // Update name in existing file if it changed or needs update
            try {
              const existing = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
              if (existing.name !== displayName) {
                existing.name = displayName
                writeGame(gameId, existing)
                console.log(`[AUTO-SCAN] Updated Ubisoft game name to: "${displayName}"`)
              }
            } catch (e) {
              console.error('[AUTO-SCAN] Failed to update name for', gameId, e.message)
            }
          }
        }

        // Remove uninstalled Ubisoft games
        const settings = getSettingsData()
        if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
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
