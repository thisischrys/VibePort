import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
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
  try {
    const coverFiles = await fsPromises.readdir(coversDir)
    const coverFile = coverFiles.find(
      f => f.startsWith(`${gameId}.`) && supportedExts.includes(path.extname(f).toLowerCase())
    )

    if (!coverFile) return null

    const fullPath = path.join(coversDir, coverFile)
    const stats = await fsPromises.stat(fullPath)
    return `media://${fullPath.replace(/\\/g, '/')}?t=${stats.mtimeMs}`
  } catch (e) {
    return null
  }
}

// ─── Load All Games ───────────────────────────────────────────────────────────
// Reads all game JSON files from disk and resolves their cover URLs.
export async function loadAllGames() {
  if (!fs.existsSync(gamesPath)) return []

  try {
    const files = (await fsPromises.readdir(gamesPath)).filter(f => f.endsWith('.json'))
    
    // Build a map of gameId -> coverUrl in a single pass of the covers directory
    const coverMap = {}
    if (fs.existsSync(coversDir)) {
      const supportedExts = ['.gif', '.webp', '.png', '.jpg', '.jpeg']
      try {
        const coverFiles = await fsPromises.readdir(coversDir)
        for (const f of coverFiles) {
          const ext = path.extname(f).toLowerCase()
          if (supportedExts.includes(ext)) {
            const gameId = path.basename(f, ext)
            const fullPath = path.join(coversDir, f)
            const stats = await fsPromises.stat(fullPath)
            coverMap[gameId] = `media://${fullPath.replace(/\\/g, '/')}?t=${stats.mtimeMs}`
          }
        }
      } catch (e) {
        console.error('[gameStore] Failed to build cover map:', e.message)
      }
    }

    const gamePromises = files.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(gamesPath, file), 'utf8')
        const data = JSON.parse(content)

        // Normalize source based on game_id prefix to fix legacy misclassifications
        if (data.game_id?.startsWith('steam_') && data.source === 'imported') data.source = 'steam'
        else if (data.game_id?.startsWith('gog_') && data.source === 'imported') data.source = 'gog'

        if (data.removed || data.blacklisted) return null

        const coverUrl = coverMap[data.game_id] || data.coverUrl || null
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

export function sanitizeGameId(gameId) {
  if (typeof gameId !== 'string') throw new Error('Invalid gameId type')
  const clean = path.basename(gameId)
  if (clean !== gameId || gameId.includes('..') || gameId.includes('/') || gameId.includes('\\')) {
    throw new Error('Path traversal detected in gameId')
  }
  return gameId
}

// ─── Write Game ───────────────────────────────────────────────────────────────
export async function writeGame(gameId, data) {
  sanitizeGameId(gameId)
  if (!fs.existsSync(gamesPath)) await fsPromises.mkdir(gamesPath, { recursive: true })
  const gameFilePath = path.join(gamesPath, `${gameId}.json`)
  await fsPromises.writeFile(gameFilePath, JSON.stringify(data, null, 4), 'utf8')
}

// ─── Remove Cover Files ───────────────────────────────────────────────────────
export async function removeCoverFiles(gameId) {
  sanitizeGameId(gameId)
  if (!fs.existsSync(coversDir)) return
  try {
    const coverFiles = await fsPromises.readdir(coversDir)
    for (const f of coverFiles) {
      if (f.startsWith(`${gameId}.`)) {
        try { await fsPromises.unlink(path.join(coversDir, f)) } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* ignore readdir errors */ }
}

// ─── IO Helpers for Decoupling ────────────────────────────────────────────────
export async function readGame(gameId) {
  sanitizeGameId(gameId)
  const gameFilePath = path.join(gamesPath, `${gameId}.json`)
  if (!fs.existsSync(gameFilePath)) return null
  try {
    return JSON.parse(await fsPromises.readFile(gameFilePath, 'utf8'))
  } catch (e) {
    return null
  }
}

export async function deleteGameFile(gameId) {
  sanitizeGameId(gameId)
  const gameFilePath = path.join(gamesPath, `${gameId}.json`)
  if (fs.existsSync(gameFilePath)) {
    try { await fsPromises.unlink(gameFilePath) } catch (e) { /* ignore */ }
  }
}

export async function getAllGameIds() {
  if (!fs.existsSync(gamesPath)) return []
  try {
    const files = await fsPromises.readdir(gamesPath)
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  } catch (e) {
    return []
  }
}

export async function deleteAllGames() {
  if (!fs.existsSync(gamesPath)) return
  try {
    const files = (await fsPromises.readdir(gamesPath)).filter(f => f.endsWith('.json'))
    for (const file of files) {
      try { await fsPromises.unlink(path.join(gamesPath, file)) } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore readdir errors */ }
}
