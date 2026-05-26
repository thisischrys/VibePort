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

    let buffer
    let ext = '.png'

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`Failed to fetch cover: ${res.statusText}`)

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('image/gif')) ext = '.gif'
      else if (contentType.includes('image/webp')) ext = '.webp'
      else if (contentType.includes('image/jpeg')) ext = '.jpg'
      else {
        const urlExt = path.extname(new URL(imageUrl).pathname).toLowerCase()
        if (urlExt) ext = urlExt
      }
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      let localPath = imageUrl.replace(/^media:\/\/\/?/, '')
      if (localPath.match(/^\/[a-zA-Z]:/)) {
        localPath = localPath.substring(1)
      }
      if (!fs.existsSync(localPath)) throw new Error(`Local cover file not found: ${localPath}`)
      buffer = fs.readFileSync(localPath)
      ext = path.extname(localPath).toLowerCase()
    }

    // Remove any existing covers for this game to avoid stale duplicates
    if (fs.existsSync(coversDir)) {
      for (const file of fs.readdirSync(coversDir)) {
        if (file.startsWith(`${gameId}.`)) {
          fs.unlinkSync(path.join(coversDir, file))
        }
      }
    }
    let targetPath

    // APNGs are natively rendered by Chromium. Since sharp cannot write APNGs,
    // we bypass sharp entirely and save the raw original buffer as .png so it plays animated!
    if (isApng(buffer)) {
      console.log(`[COVER-DL] Saving raw APNG animation directly for ${gameId}...`)
      targetPath = path.join(coversDir, `${gameId}.png`)
      fs.writeFileSync(targetPath, buffer)
      if (notifyRenderer) notifyRenderer()
      return { success: true, coverUrl: `media://${targetPath.replace(/\\/g, '/')}` }
    }

    // Detect if the cover is animated (animated WebP or animated GIF)
    let isAnimated = false
    let animExt = ext

    try {
      const metadata = await sharp(buffer).metadata()
      if (metadata.pages && metadata.pages > 1 && !isApng(buffer)) {
        isAnimated = true
        if (metadata.format === 'webp') animExt = '.webp'
        else if (metadata.format === 'gif') animExt = '.gif'
      }
    } catch (err) {
      // Keep isAnimated as false and fall back to static resizing
    }

    if (isAnimated) {
      console.log(`[COVER-DL] Detected animated cover for ${gameId}. Resizing and compressing animation to 300x450...`)
      targetPath = path.join(coversDir, `${gameId}${animExt}`)
      try {
        await sharp(buffer, { animated: true, limitInputPixels: false })
          .resize({ width: 300, height: 450, fit: 'cover' })
          .toFile(targetPath)
      } catch (sharpErr) {
        console.warn(`[SHARP] Animated compression failed for ${gameId}, saving original: ${sharpErr.message}`)
        fs.writeFileSync(targetPath, buffer)
      }

      if (animExt === '.gif') {
        try {
          await sharp(targetPath).metadata()
        } catch (err) {
          console.warn(`[GIF VALIDATION] Resized GIF is corrupt or needs repair. Repairing...`)
          await repairGif(targetPath)
        }
      }
    } else {
      targetPath = path.join(coversDir, `${gameId}.webp`)
      try {
        // Permanently compress and resize to a 300x450 WebP for smooth rendering
        await sharp(buffer, { limitInputPixels: false })
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
    }

    if (notifyRenderer) notifyRenderer()

    const finalPath = targetPath.replace(/\\/g, '/')
    return { success: true, coverUrl: `media://${finalPath}` }
  } catch (e) {
    console.error('Failed to download cover:', e)
    return { success: false, error: e.message }
  }
}

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
