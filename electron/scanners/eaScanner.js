import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

const EA_SKIP_KEYS = ['EA Core', 'EA Desktop', 'EADM', 'EA Games']

function getEaGamesFromUninstallKeys(registryPath) {
  return new Promise((resolve) => {
    const execCmd = `reg query "${registryPath}" /s /f "EAInstaller"`
    exec(execCmd, { windowsHide: true }, (err, stdout) => {
      if (err || !stdout?.trim()) return resolve([])
      
      const subkeys = []
      for (const line of stdout.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\')) {
          subkeys.push(trimmed)
        }
      }
      
      if (subkeys.length === 0) return resolve([])
      
      const promises = subkeys.map(subkey => {
        return new Promise((res) => {
          exec(`reg query "${subkey}"`, { windowsHide: true }, (e, out) => {
            if (e || !out?.trim()) return res(null)
            
            let displayName = ''
            let installDir = ''
            
            for (const line of out.split(/\r?\n/)) {
              const trimmed = line.trim()
              const dispMatch = trimmed.match(/^DisplayName\s+REG_SZ\s+(.+)$/i)
              if (dispMatch) displayName = dispMatch[1].trim()
              
              const locMatch = trimmed.match(/^InstallLocation\s+REG_SZ\s+(.+)$/i)
              if (locMatch) installDir = locMatch[1].trim()
            }
            
            if (displayName && installDir) {
              res({ displayName, installDir })
            } else {
              res(null)
            }
          })
        })
      })
      
      Promise.all(promises).then(results => {
        resolve(results.filter(Boolean))
      })
    })
  })
}

export async function scanEaLibrary() {
  console.log('[AUTO-SCAN] Scanning EA library via registry...')

  const entries = []
  const seenPaths = new Set()

  const addEntry = (displayName, installDir) => {
    if (!displayName || !installDir) return
    const normalized = path.normalize(installDir).toLowerCase()
    if (seenPaths.has(normalized)) return
    seenPaths.add(normalized)
    
    // Clean up trademark symbols or codepage character corruptions in DisplayName
    let name = displayName
      .replace(/[\u00AE\u2122]/g, '') // strip registered trademark and trademark symbols
      .replace(/Bejeweledr/g, 'Bejeweled') // Clean up codepage mismatch for Bejeweled®
      .trim()
      
    entries.push({ displayName: name, installDir })
  }

  // 1. Scan the legacy Electronic Arts registry key path
  await new Promise((resolve) => {
    exec('reg query "HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts" /s', { windowsHide: true }, (error, stdout) => {
      if (error || !stdout?.trim()) return resolve()
      try {
        let current = null
        for (const line of stdout.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const topKey = trimmed.match(/^HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\([^\\]+)$/i)
          if (topKey) {
            if (current?.displayName && current?.installDir) {
              addEntry(current.displayName, current.installDir)
            }
            const keyName = topKey[1]
            current = EA_SKIP_KEYS.some(k => keyName.toLowerCase() === k.toLowerCase())
              ? null
              : { keyName, displayName: '', installDir: '' }
            continue
          }

          if (trimmed.startsWith('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\')) {
            if (current?.displayName && current?.installDir) {
              addEntry(current.displayName, current.installDir)
            }
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
        if (current?.displayName && current?.installDir) {
          addEntry(current.displayName, current.installDir)
        }
      } catch (err) {
        console.error('[AUTO-SCAN] Error parsing legacy EA registry:', err)
      }
      resolve()
    })
  })

  // 2. Scan HKLM WOW6432Node and 64-bit Windows Uninstall Keys
  try {
    const uninstallGames32 = await getEaGamesFromUninstallKeys('HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
    for (const g of uninstallGames32) {
      addEntry(g.displayName, g.installDir)
    }
  } catch (e) {
    console.error('[AUTO-SCAN] Error scanning 32-bit uninstall keys:', e)
  }

  try {
    const uninstallGames64 = await getEaGamesFromUninstallKeys('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
    for (const g of uninstallGames64) {
      addEntry(g.displayName, g.installDir)
    }
  } catch (e) {
    console.error('[AUTO-SCAN] Error scanning 64-bit uninstall keys:', e)
  }

  // 3. Process the collected EA game installations
  const foundIds = new Set()

  for (const entry of entries) {
    // Resolve the EA contentID from installerdata.xml
    let contentId = null
    const xmlPath = path.join(entry.installDir.replace(/[\/\\]+$/, ''), '__Installer', 'installerdata.xml')
    if (fs.existsSync(xmlPath)) {
      try {
        let content = fs.readFileSync(xmlPath, 'utf8')
        // Automatically check if the XML is encoded in UTF-16LE (contains null characters when read as UTF-8)
        if (content.includes('\u0000')) {
          content = fs.readFileSync(xmlPath, 'utf16le')
        }
        const m = content.match(/<contentID>([^<]+)<\/contentID>/i)
        if (m) {
          contentId = m[1].trim()
        } else {
          // Fallback regex to capture variations
          const m2 = content.match(/contentID["']>([^<]+)</i)
          if (m2) contentId = m2[1].trim()
        }
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

  // 4. Remove uninstalled EA games
  const settings = getSettingsData()
  if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
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
}
