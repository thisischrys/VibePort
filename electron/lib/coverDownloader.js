import fs from 'node:fs'
import path from 'node:path'
import { IPC_EVENTS } from '../../src/shared/ipc-events.js'
import { BrowserWindow } from 'electron'
import { gamesPath, coversDir, STEAMGRIDDB_API_KEY } from '../lib/paths.js'
import { downloadCoverFromUrl } from './images.js'

let lastRequestTime = 0
async function throttledFetch(url, options) {
  const minInterval = 300 // 300ms minimum interval
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < minInterval) {
    await new Promise(r => setTimeout(r, minInterval - elapsed))
  }
  lastRequestTime = Date.now()
  return fetch(url, options)
}

import { scanManager } from './scanManager.js'

function normalizeGameName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => {
      switch (word) {
        case 'i': return '1'
        case 'ii': return '2'
        case 'iii': return '3'
        case 'iv': return '4'
        case 'v': return '5'
        case 'vi': return '6'
        case 'vii': return '7'
        case 'viii': return '8'
        case 'ix': return '9'
        case 'x': return '10'
        default: return word
      }
    })
    .join(' ')
}

function findBestSgdbMatch(searchData, targetName) {
  if (!searchData || searchData.length === 0) return null
  const targetNorm = normalizeGameName(targetName)
  for (const item of searchData) {
    if (normalizeGameName(item.name) === targetNorm) {
      return item
    }
  }
  return searchData[0]
}

// ─── Single Game Cover Downloader ──────────────────────────────────────────────
export async function downloadCoverForGame(gameData, notifyRenderer, preferStatic = false) {
  const { game_id: gameId, name, source } = gameData
  if (!name) return false

  const gameFilePath = path.join(gamesPath, `${gameId}.json`)

  // 1. Check if cover exists on disk
  let hasCover = false
  if (fs.existsSync(coversDir)) {
    const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
    hasCover = fs.readdirSync(coversDir).some(
      f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase())
    )
  }

  // 2. Determine skip rules
  if (preferStatic) {
    if (hasCover) return false

    // If we checked for static cover less than 7 days ago, skip it
    const lastCheck = gameData.last_static_check || 0
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - lastCheck < sevenDaysMs) {
      console.log(`[BG-COVER] Skipped static cover query for ${name} (searched less than 7 days ago)`)
      return false
    }
  } else {
    // If it's already animated, skip checking forever
    if (gameData.cover_type === 'animated') return false

    // If we checked for animations less than 24 hours ago, skip it
    const lastCheck = gameData.last_animated_check || 0
    const oneDayMs = 24 * 60 * 60 * 1000
    if (Date.now() - lastCheck < oneDayMs) {
      console.log(`[BG-COVER] Skipped animated check for ${name} (checked less than 24h ago)`)
      return false
    }
  }

  console.log(`[BG-COVER] Processing cover for ${name} (${gameId}) [preferStatic: ${preferStatic}]...`)

  // Helper to update game JSON metadata
  const updateGameMetadata = (coverType, lastCheckTime, lastStaticCheck) => {
    try {
      if (fs.existsSync(gameFilePath)) {
        const data = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
        if (coverType !== undefined) data.cover_type = coverType
        if (lastCheckTime !== undefined) data.last_animated_check = lastCheckTime
        if (lastStaticCheck !== undefined) data.last_static_check = lastStaticCheck
        // Remove legacy flag if it exists
        delete data.animated_cover_checked
        fs.writeFileSync(gameFilePath, JSON.stringify(data, null, 4), 'utf8')
        // Update the local gameData reference
        if (coverType !== undefined) gameData.cover_type = coverType
        if (lastCheckTime !== undefined) gameData.last_animated_check = lastCheckTime
        if (lastStaticCheck !== undefined) gameData.last_static_check = lastStaticCheck
      }
    } catch (e) {
      console.error('[BG-COVER] Failed to update game metadata:', e.message)
    }
  }

  // Helper for direct CDN fallback downloads
  const downloadFromCdn = async () => {
    if (source === 'steam') {
      const appId = gameId.replace('steam_', '')
      const urls = [
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
      ]
      for (const url of urls) {
        try {
          const check = await throttledFetch(url, { method: 'HEAD' })
          if (check.ok) {
            const dlResult = await downloadCoverFromUrl(gameId, url, notifyRenderer)
            if (dlResult.success) {
              console.log(`[BG-COVER] CDN Fallback: Downloaded Steam CDN cover for ${name}`)
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
        const res = await throttledFetch(`https://api.gog.com/products/${productId}`)
        if (res.ok) {
          const json = await res.json()
          const iconUrl = json.images?.icon
          if (iconUrl) {
            const hashMatch = iconUrl.match(/\/([a-f0-9]{64})/i)
            if (hashMatch) {
              const coverUrl = `https://images.gog-statics.com/${hashMatch[1]}_glx_vertical_cover.webp`
              const dlResult = await downloadCoverFromUrl(gameId, coverUrl, notifyRenderer)
              if (dlResult.success) {
                console.log(`[BG-COVER] CDN Fallback: Downloaded GOG CDN cover for ${name}`)
                return true
              }
            }
          }
        }
      } catch (e) {
        console.error(`[BG-COVER] GOG CDN attempt failed for ${name}:`, e.message)
      }
    }
    return false
  }

  // --- PASS 1: Static Cover Only ---
  if (preferStatic) {
    // Priority 1: Query SteamGridDB for static cover (Always try SGDB static first)
    try {
      console.log(`[BG-COVER] Querying SteamGridDB (static) for ${name}...`)
      const searchRes = await throttledFetch(
        `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
      )
      if (searchRes.ok) {
        const searchJson = await searchRes.json()
        if (searchJson.success && searchJson.data?.length > 0) {
          const bestMatch = findBestSgdbMatch(searchJson.data, name)
          const sgdbId = bestMatch.id
          const statRes = await throttledFetch(
            `https://www.steamgriddb.com/api/v2/grids/game/${sgdbId}?types=static`,
            { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
          )
          if (statRes.ok) {
            const statJson = await statRes.json()
            if (statJson.success && statJson.data?.length > 0) {
              const dlResult = await downloadCoverFromUrl(gameId, statJson.data[0].url, notifyRenderer)
              if (dlResult.success) {
                console.log(`[BG-COVER] Downloaded static cover from SteamGridDB for ${name}`)
                updateGameMetadata('static', 0, Date.now())
                return true
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`[BG-COVER] SteamGridDB static cover lookup failed for ${name}:`, e.message)
    }

    // Negative caching: mark search as failed so we don't query again for a week
    updateGameMetadata(undefined, undefined, Date.now())
    return false
  }

  // --- PASS 2: Animated Cover Upgrade & CDN Fallback ---
  let sgdbSuccess = false
  try {
    console.log(`[BG-COVER] Querying SteamGridDB (animated) for ${name}...`)
    const searchRes = await throttledFetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
    )
    if (searchRes.ok) {
      const searchJson = await searchRes.json()
      if (searchJson.success && searchJson.data?.length > 0) {
        const bestMatch = findBestSgdbMatch(searchJson.data, name)
        const sgdbId = bestMatch.id
        const animRes = await throttledFetch(
          `https://www.steamgriddb.com/api/v2/grids/game/${sgdbId}?types=animated`,
          { headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` } }
        )
        if (animRes.ok) {
          const animJson = await animRes.json()
          if (animJson.success) {
            if (animJson.data?.length > 0) {
              console.log(`[BG-COVER] Selected SteamGridDB animated cover for ${name}: ${animJson.data[0].url}`)
              const dlResult = await downloadCoverFromUrl(gameId, animJson.data[0].url, notifyRenderer)
              if (dlResult.success) {
                console.log(`[BG-COVER] Successfully downloaded/resized animated cover for ${name}`)
                sgdbSuccess = true
                updateGameMetadata('animated', Date.now())
              } else {
                console.log(`[BG-COVER] Animated cover download/resize failed for ${name}: ${dlResult.error}`)
              }
            } else {
              console.log(`[BG-COVER] No animated covers exist for ${name} on SteamGridDB.`)
              updateGameMetadata('static', Date.now())
            }
          }
        }
      } else {
        console.log(`[BG-COVER] Game ${name} not found on SteamGridDB.`)
        updateGameMetadata('static', Date.now())
      }
    }
  } catch (e) {
    console.error(`[BG-COVER] SteamGridDB animated check failed for ${name}:`, e.message)
    updateGameMetadata(undefined, Date.now())
  }

  if (hasCover) {
    return sgdbSuccess
  }

  // If the game still has NO cover (meaning BOTH static and animated checks on SteamGridDB returned nothing/failed),
  // we fall back to the direct Platform CDN cover.
  if (!sgdbSuccess) {
    console.log(`[BG-COVER] No cover found on SteamGridDB. Trying CDN fallback for ${name}...`)
    const cdnSuccess = await downloadFromCdn()
    if (cdnSuccess) {
      updateGameMetadata('static', Date.now())
      return true
    }
  }

  return sgdbSuccess
}

let isDownloadingCovers = false

// ─── Background Cover Downloader ──────────────────────────────────────────────
export async function runBackgroundCoverDownloader(notifyRenderer, preferStatic = false) {
  if (isDownloadingCovers) {
    console.log('[BG-COVER] Background cover downloader is already running. Skipping concurrent run.')
    return
  }
  isDownloadingCovers = true

  try {
    console.log(`[BG-COVER] Starting background cover downloader (preferStatic: ${preferStatic})...`)
    if (!fs.existsSync(gamesPath)) return

    const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]
      try {
        const data = JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8'))
        if (data.removed || data.blacklisted) continue

        const name = data.name || 'Unknown Game'
        const currentPercent = Math.round(10 + (90 * (i / totalFiles)))
        
        if (preferStatic) {
          scanManager.sendProgress(currentPercent, 100, `Synchronizing cover art for ${name}...`)
        }

        await downloadCoverForGame(data, notifyRenderer, preferStatic)
      } catch (err) {
        console.error(`[BG-COVER] Error processing cover for ${file}:`, err.message)
      }
    }
    
    if (preferStatic) {
      scanManager.sendProgress(100, 100, 'Cover art synchronization complete!')
    }
  } finally {
    isDownloadingCovers = false
    console.log(`[BG-COVER] Background cover downloader completed (preferStatic: ${preferStatic}).`)
  }
}
