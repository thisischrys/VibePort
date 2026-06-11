import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import sharp from 'sharp'
import { gamesPath, coversDir } from './paths.js'

// Helper: Checks if a buffer represents an Animated PNG (APNG)
function isApng(buffer) {
  if (buffer.length < 8) return false
  const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== pngSig[i]) return false
  }

  let pos = 8
  while (pos < buffer.length - 12) {
    const length = buffer.readUInt32BE(pos)
    const type = buffer.toString('ascii', pos + 4, pos + 8)
    if (type === 'acTL') {
      return true
    }
    if (type === 'IDAT' || type === 'IEND') {
      break
    }
    pos += 12 + length
    if (length <= 0) break
  }
  return false
}

// ─── GIF Repair ──────────────────────────────────────────────────────────────
// Attempts to repair a corrupt GIF in-place using Python + Pillow.
export function repairGif(filePath) {
  return new Promise((resolve) => {
    console.log('[GIF REPAIR] Attempting to repair corrupt GIF in-place:', filePath)

    const pythonCode = `
import sys, os
from PIL import Image, ImageSequence
f = sys.argv[1]
try:
    im = Image.open(f)
    duration = im.info.get('duration', 100)
    loop = im.info.get('loop', 0)
    frames = [frame.copy() for frame in ImageSequence.Iterator(im)]
    im.close()
    frames[0].save(f, save_all=True, append_images=frames[1:], loop=loop, duration=duration, format='GIF')
    print('REPAIR_SUCCESS')
except Exception as e:
    print('REPAIR_FAILED:', str(e))
`.trim()

    const child = spawn('python', ['-c', pythonCode, filePath], { windowsHide: true })

    let stdout = ''
    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { /* suppress */ }) // eslint-disable-line no-unused-vars

    child.on('close', (code) => {
      if (code === 0 && stdout.includes('REPAIR_SUCCESS')) {
        console.log('[GIF REPAIR] Successfully repaired GIF in-place:', filePath)
        resolve(true)
      } else {
        console.error('[GIF REPAIR] Failed to repair GIF:', filePath)
        resolve(false)
      }
    })
  })
}

// ─── Cover URL Resolution ─────────────────────────────────────────────────────
// Given a game_id, resolves the local media:// cover URL if one exists on disk.
export async function resolveCoverUrl(gameId) {
  if (!fs.existsSync(coversDir)) return null

  const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
  try {
    const coverFiles = fs.readdirSync(coversDir)
    const coverFile = coverFiles.find(
      f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase())
    )

    if (!coverFile) return null

    const fullPath = path.join(coversDir, coverFile)
    const mtime = fs.statSync(fullPath).mtimeMs
    return `media://${fullPath.replace(/\\/g, '/')}?t=${mtime}`
  } catch (e) {
    return null
  }
}

// ─── Load All Games ───────────────────────────────────────────────────────────
// Reads all game JSON files from disk and resolves their cover URLs.
export async function loadAllGames() {
  if (!fs.existsSync(gamesPath)) return []

  try {
    const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    
    // Build a map of gameId -> coverUrl in a single pass of the covers directory
    const coverMap = {}
    if (fs.existsSync(coversDir)) {
      const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
      try {
        const coverFiles = fs.readdirSync(coversDir)
        for (const f of coverFiles) {
          const ext = path.extname(f).toLowerCase()
          if (supportedExts.includes(ext)) {
            const gameId = path.basename(f, ext)
            const fullPath = path.join(coversDir, f)
            const mtime = fs.statSync(fullPath).mtimeMs
            coverMap[gameId] = `media://${fullPath.replace(/\\/g, '/')}?t=${mtime}`
          }
        }
      } catch (e) {
        console.error('[gameStore] Failed to build cover map:', e.message)
      }
    }

    const gamePromises = files.map(async (file) => {
      try {
        const content = fs.readFileSync(path.join(gamesPath, file), 'utf8')
        const data = JSON.parse(content)

        // Normalize source based on game_id prefix to fix legacy misclassifications
        if (data.game_id?.startsWith('steam_') && data.source === 'imported') data.source = 'steam'
        else if (data.game_id?.startsWith('gog_') && data.source === 'imported') data.source = 'gog'

        if (data.removed || data.blacklisted) return null

        const coverUrl = coverMap[data.game_id] || null
        return { ...data, coverUrl }
      } catch (err) {
        console.error('Error parsing game file:', file, err)
        return null
      }
    })

    return (await Promise.all(gamePromises)).filter(Boolean)
  } catch (e) {
    console.error('loadAllGames error:', e)
    return []
  }
}

// ─── Write Game ───────────────────────────────────────────────────────────────
export function writeGame(gameId, data) {
  if (!fs.existsSync(gamesPath)) fs.mkdirSync(gamesPath, { recursive: true })
  const gameFilePath = path.join(gamesPath, `${gameId}.json`)
  fs.writeFileSync(gameFilePath, JSON.stringify(data, null, 4), 'utf8')
}

// ─── Remove Cover Files ───────────────────────────────────────────────────────
export function removeCoverFiles(gameId) {
  if (!fs.existsSync(coversDir)) return
  const coverFiles = fs.readdirSync(coversDir)
  for (const f of coverFiles) {
    if (f.startsWith(`${gameId}.`)) {
      try { fs.unlinkSync(path.join(coversDir, f)) } catch (e) { /* ignore */ }
    }
  }
}
