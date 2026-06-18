import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { gamesPath } from '../lib/paths.js'
import { writeGame } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

const execAsync = promisify(exec)

const AMAZON_POWERSHELL_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$games = @()
$paths = @("HKLM:SOFTWAREMicrosoftWindowsCurrentVersionUninstall*", "HKLM:SOFTWAREWOW6432NodeMicrosoftWindowsCurrentVersionUninstall*", "HKCU:SoftwareMicrosoftWindowsCurrentVersionUninstall*")
foreach ($p in $paths) {
    $keys = Get-ItemProperty $p -ErrorAction SilentlyContinue
    foreach ($key in $keys) {
        if ($key.UninstallString -match "Amazon Games.exe") {
            if ($key.PSChildName -ne "Amazon Games") {
                $games += [PSCustomObject]@{
                    Name = $key.DisplayName
                    Id = $key.PSChildName
                }
            }
        }
    }
}
$games | ConvertTo-Json -Compress
`

export async function scanAmazonLibrary() {
  console.log('[AUTO-SCAN] Scanning Amazon Games library...')

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -Command "${AMAZON_POWERSHELL_SCRIPT.replace(/"/g, '"').replace(/\n/g, ' ')}"`)
    
    if (!stdout.trim()) {
      return
    }

    let parsed = JSON.parse(stdout.trim())
    if (!Array.isArray(parsed)) {
      parsed = [parsed]
    }

    const foundIds = new Set()

    for (const game of parsed) {
      if (!game.Name || !game.Id) continue

      const gameId = `amazon_${game.Id}`
      foundIds.add(gameId)
      const gameFilePath = path.join(gamesPath, `${gameId}.json`)

      if (!fs.existsSync(gameFilePath)) {
        writeGame(gameId, {
          added: Math.floor(Date.now() / 1000),
          developer: null,
          executable: `amazon-games://play/${game.Id}`,
          game_id: gameId,
          hidden: false,
          last_played: 0,
          name: game.Name,
          removed: false,
          source: 'amazon',
          version: 1.5
        })
        console.log('[AUTO-SCAN] Added Amazon game:', game.Name)
      }
    }

    // Remove uninstalled Amazon games
    const settings = getSettingsData()
    if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
      for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('amazon_') && f.endsWith('.json'))) {
        const gameId = dbFile.replace('.json', '')
        if (!foundIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Amazon game ${gameId} uninstalled. Removing...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to remove ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Amazon scan failed:', err)
  }
}
