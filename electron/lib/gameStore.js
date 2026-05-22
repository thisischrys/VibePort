import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import sharp from 'sharp'
import { gamesPath, coversDir } from './paths.js'

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
  const coverFiles = fs.readdirSync(coversDir)
  const coverFile = coverFiles.find(
    f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase())
  )

  if (!coverFile) return null

  const fullPath = path.join(coversDir, coverFile)

  // Validate and auto-repair corrupt GIFs
  if (coverFile.toLowerCase().endsWith('.gif')) {
    try {
      await sharp(fullPath).metadata()
    } catch (err) {
      console.warn(`[GIF VALIDATION] Corrupt GIF ${coverFile}: ${err.message}. Repairing...`)
      await repairGif(fullPath)
    }
  }

  // Auto-optimize / downsize large covers in place (static and animated)
  try {
    const metadata = await sharp(fullPath).metadata()
    if (metadata.width && metadata.width > 300) {
      console.log(`[COVER-OPTIMIZE] Cover ${coverFile} is too large (${metadata.width}x${metadata.height}). Downsizing to 300px width in-place...`)
      const isAnimated = metadata.pages && metadata.pages > 1
      const ext = path.extname(coverFile).toLowerCase()
      const buffer = fs.readFileSync(fullPath)
      
      let sharpInstance = sharp(buffer, { animated: isAnimated, limitInputPixels: false })
        .resize({ width: 300, height: 450, fit: 'cover' })
      
      if (ext === '.webp') {
        sharpInstance = sharpInstance.webp({ quality: 80, effort: 4 })
      } else if (ext === '.png') {
        sharpInstance = sharpInstance.png({ quality: 80 })
      } else if (ext === '.gif') {
        // preserve gif
      } else {
        sharpInstance = sharpInstance.jpeg({ quality: 80 })
      }
      
      const optimizedBuffer = await sharpInstance.toBuffer()
      fs.writeFileSync(fullPath, optimizedBuffer)
      console.log(`[COVER-OPTIMIZE] Successfully downsized ${coverFile} to 300x450 in-place.`)
    }
  } catch (err) {
    console.error(`[COVER-OPTIMIZE] Failed to optimize cover ${coverFile}:`, err.message)
  }

  return `media://${fullPath.replace(/\\/g, '/')}`
}

// ─── Load All Games ───────────────────────────────────────────────────────────
// Reads all game JSON files from disk and resolves their cover URLs.
export async function loadAllGames() {
  if (!fs.existsSync(gamesPath)) return []

  try {
    const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
    const gamePromises = files.map(async (file) => {
      try {
        const content = fs.readFileSync(path.join(gamesPath, file), 'utf8')
        const data = JSON.parse(content)

        // Normalize source based on game_id prefix to fix legacy misclassifications
        if (data.game_id?.startsWith('steam_') && data.source === 'imported') data.source = 'steam'
        else if (data.game_id?.startsWith('gog_') && data.source === 'imported') data.source = 'gog'

        if (data.removed || data.blacklisted) return null

        const coverUrl = await resolveCoverUrl(data.game_id)
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
