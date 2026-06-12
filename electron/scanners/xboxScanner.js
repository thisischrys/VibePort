import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { gamesPath } from '../lib/paths.js'
import { writeGame } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

const execAsync = promisify(exec)

const XBOX_POWERSHELL_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$games = @()
$packages = Get-AppxPackage
foreach ($p in $packages) {
    if ($p.IsFramework) { continue }
    $manifestPath = Join-Path $p.InstallLocation "AppxManifest.xml"
    if (Test-Path $manifestPath) {
        $xml = [xml](Get-Content $manifestPath)
        $category = $xml.Package.Properties.Category
        if ($category -eq "games") {
            $appId = "App"
            $apps = $xml.Package.Applications.Application
            if ($apps.Count -gt 0) {
                $appId = $apps[0].Id
            } elseif ($apps -ne $null) {
                $appId = $apps.Id
            }
            $displayName = $xml.Package.Properties.DisplayName
            # Sometimes display name is a resource string (ms-resource:...)
            if ($displayName -match "^ms-resource:") {
                # Fallback to the package name
                $displayName = $p.Name
            }
            
            $games += [PSCustomObject]@{
                Name = $p.Name
                PackageFamilyName = $p.PackageFamilyName
                InstallLocation = $p.InstallLocation
                DisplayName = $displayName
                AppId = $appId
            }
        }
    }
}
$games | ConvertTo-Json -Compress
`

export async function scanXboxLibrary() {
  console.log('[AUTO-SCAN] Scanning Xbox/UWP Games library...')

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -Command "${XBOX_POWERSHELL_SCRIPT.replace(/"/g, '"').replace(/n/g, ' ')}"`)
    
    if (!stdout.trim()) {
      return
    }

    let parsed = JSON.parse(stdout.trim())
    if (!Array.isArray(parsed)) {
      parsed = [parsed]
    }

    const foundIds = new Set()

    for (const game of parsed) {
      if (!game.DisplayName || !game.PackageFamilyName) continue

      const gameId = `xbox_${game.PackageFamilyName}`
      foundIds.add(gameId)
      const gameFilePath = path.join(gamesPath, `${gameId}.json`)

      if (!fs.existsSync(gameFilePath)) {
        writeGame(gameId, {
          added: Math.floor(Date.now() / 1000),
          developer: null,
          executable: `explorer.exe shell:AppsFolder${game.PackageFamilyName}!${game.AppId}`,
          game_id: gameId,
          hidden: false,
          last_played: 0,
          name: game.DisplayName,
          removed: false,
          source: 'xbox',
          version: 1.5
        })
        console.log('[AUTO-SCAN] Added Xbox game:', game.DisplayName)
      }
    }

    // Remove uninstalled Xbox games
    const settings = getSettingsData()
    if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
      for (const dbFile of fs.readdirSync(gamesPath).filter(f => f.startsWith('xbox_') && f.endsWith('.json'))) {
        const gameId = dbFile.replace('.json', '')
        if (!foundIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Xbox game ${gameId} uninstalled. Removing...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to remove ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Xbox scan failed:', err)
  }
}
