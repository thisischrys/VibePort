import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { coversDir } from './paths.js'
import { repairGif } from './gameStore.js'

// ─── Download & Compress Cover ────────────────────────────────────────────────
// Downloads a cover image from a URL, compresses it to 300x450 WebP, and saves
// it to the covers directory. Falls back to saving the original format if sharp
// compression fails (e.g. some unusual GIF encodings).
export async function downloadCoverFromUrl(gameId, imageUrl, notifyRenderer) {
  try {
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }

    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch cover: ${res.statusText}`)

    const contentType = res.headers.get('content-type') || ''
    let ext = '.png'
    if (contentType.includes('image/gif')) ext = '.gif'
    else if (contentType.includes('image/webp')) ext = '.webp'
    else if (contentType.includes('image/jpeg')) ext = '.jpg'
    else {
      const urlExt = path.extname(new URL(imageUrl).pathname).toLowerCase()
      if (urlExt) ext = urlExt
    }

    // Remove any existing covers for this game to avoid stale duplicates
    if (fs.existsSync(coversDir)) {
      for (const file of fs.readdirSync(coversDir)) {
        if (file.startsWith(`${gameId}.`)) {
          fs.unlinkSync(path.join(coversDir, file))
        }
      }
    }

    let targetPath = path.join(coversDir, `${gameId}.webp`)
    const buffer = Buffer.from(await res.arrayBuffer())

    try {
      // Permanently compress and resize to a 300x450 WebP for smooth rendering
      await sharp(buffer, { animated: true, limitInputPixels: false })
        .resize({ width: 300, height: 450, fit: 'cover' })
        .webp({ quality: 80, effort: 4 })
        .toFile(targetPath)
    } catch (sharpErr) {
      console.warn(`[SHARP] Compression failed for ${gameId}, saving original: ${sharpErr.message}`)
      targetPath = path.join(coversDir, `${gameId}${ext}`)
      fs.writeFileSync(targetPath, buffer)

      // Validate and repair GIFs that weren't compressible
      if (ext === '.gif') {
        try {
          await sharp(targetPath).metadata()
        } catch (err) {
          console.warn(`[GIF VALIDATION] Downloaded GIF is corrupt. Repairing...`)
          await repairGif(targetPath)
        }
      }
    }

    if (notifyRenderer) notifyRenderer()

    const finalPath = targetPath.replace(/\\/g, '/')
    return { success: true, coverUrl: `media://${finalPath}` }
  } catch (e) {
    console.error('Failed to download cover:', e)
    return { success: false, error: e.message }
  }
}
