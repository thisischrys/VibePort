import fs from 'node:fs'
import path from 'node:path'
import { gamesPath, coversDir, STEAMGRIDDB_API_KEY } from '../lib/paths.js'
import { downloadCoverFromUrl } from './images.js'

// ─── Single Game Cover Downloader ──────────────────────────────────────────────
export async function downloadCoverForGame(gameData, notifyRenderer) {
  const { game_id: gameId, name, source } = gameData
  if (!name) return false

  // Skip games that already have a cover on disk
  if (fs.existsSync(coversDir)) {
    const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
    const hasCover = fs.readdirSync(coversDir).some(
      f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase())
    )
    if (hasCover) return false
  }

  console.log(`[BG-COVER] Missing cover for ${name} (${gameId}). Starting download...`)
  let sgdbSuccess = false

  // ── 1. Try SteamGridDB ─────────────────────────────────────────────────
  try {
    console.log(`[BG-COVER] Querying SteamGridDB for ${name}...`)
    const searchRes = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
    )
    if (searchRes.ok) {
      const searchJson = await searchRes.json()
      if (searchJson.success && searchJson.data?.length > 0) {
        const sgdbId = searchJson.data[0].id

        let grids = []

        // Try animated grids first
        try {
          const animRes = await fetch(
            `https://www.steamgriddb.com/api/v2/grids/game/${sgdbId}?types=animated`,
            { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
          )
          if (animRes.ok) {
            const animJson = await animRes.json()
            if (animJson.success && animJson.data?.length > 0) grids = animJson.data
          }
        } catch (e) {
          console.error('[BG-COVER] Animated grid query failed:', e.message)
        }

        // Fall back to static grids
        if (grids.length === 0) {
          try {
            const statRes = await fetch(
              `https://www.steamgriddb.com/api/v2/grids/game/${sgdbId}?types=static`,
              { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
            )
            if (statRes.ok) {
              const statJson = await statRes.json()
              if (statJson.success && statJson.data?.length > 0) grids = statJson.data
            }
          } catch (e) {
            console.error('[BG-COVER] Static grid query failed:', e.message)
          }
        }

        if (grids.length > 0) {
          console.log(`[BG-COVER] Selected SteamGridDB cover for ${name}: ${grids[0].url}`)
          const dlResult = await downloadCoverFromUrl(gameId, grids[0].url, notifyRenderer)
          if (dlResult.success) {
            console.log(`[BG-COVER] Successfully downloaded cover from SteamGridDB for ${name}`)
            sgdbSuccess = true
          }
        }
      }
    }
  } catch (e) {
    console.error(`[BG-COVER] SteamGridDB attempt failed for ${name}:`, e.message)
  }

  if (sgdbSuccess) return true

  // ── 2. Platform CDN fallback ───────────────────────────────────────────
  if (source === 'steam') {
    const appId = gameId.replace('steam_', '')
    const urls = [
      `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
    ]
    for (const url of urls) {
      try {
        const check = await fetch(url, { method: 'HEAD' })
        if (check.ok) {
          const dlResult = await downloadCoverFromUrl(gameId, url, notifyRenderer)
          if (dlResult.success) {
            console.log(`[BG-COVER] Downloaded Steam CDN cover for ${name}`)
            return true
          }
        }
      } catch (e) {
        console.error(`[BG-COVER] Steam CDN attempt failed for ${name}:`, e.message)
      }
    }
  } else if (source === 'gog') {
    const productId = gameId.replace('gog_', '')
    try {
      const res = await fetch(`https://api.gog.com/products/${productId}`)
      if (res.ok) {
        const json = await res.json()
        const iconUrl = json.images?.icon
        if (iconUrl) {
          const hashMatch = iconUrl.match(/\/([a-f0-9]{64})/i)
          if (hashMatch) {
            const coverUrl = `https://images.gog-statics.com/${hashMatch[1]}_glx_vertical_cover.webp`
            const dlResult = await downloadCoverFromUrl(gameId, coverUrl, notifyRenderer)
            if (dlResult.success) {
              console.log(`[BG-COVER] Downloaded GOG cover for ${name}`)
              return true
            }
          }
        }
      }
    } catch (e) {
      console.error(`[BG-COVER] GOG cover download failed for ${name}:`, e.message)
    }
  }

  return false
}

// ─── Background Cover Downloader ──────────────────────────────────────────────
// Runs after startup scan. For each game without a cover, tries to download one.
export async function runBackgroundCoverDownloader(notifyRenderer) {
  console.log('[BG-COVER] Starting background cover downloader...')
  if (!fs.existsSync(gamesPath)) return

  const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8'))
      if (data.removed || data.blacklisted) continue

      await downloadCoverForGame(data, notifyRenderer)
    } catch (err) {
      console.error(`[BG-COVER] Error processing cover for ${file}:`, err.message)
    }
  }
}
