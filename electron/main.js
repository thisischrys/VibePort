import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { exec } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(createWindow)

// API for the renderer
ipcMain.handle('get-games', async () => {
  const gamesPath = path.join(app.getPath('home'), 'AppData', 'Local', 'cartridges', 'games')
  console.log('Scanning games at:', gamesPath)
  if (!fs.existsSync(gamesPath)) {
    console.log('Games path does not exist!')
    return []
  }

  const files = fs.readdirSync(gamesPath).filter(f => f.endsWith('.json'))
  console.log('Found files:', files.length)
  const games = files.map(file => {
    try {
      const content = fs.readFileSync(path.join(gamesPath, file), 'utf8')
      const data = JSON.parse(content)
      
      // Find cover
      const coverPath = path.join(app.getPath('home'), 'AppData', 'Local', 'cartridges', 'covers', `${data.game_id}.webp`)
      const coverUrl = fs.existsSync(coverPath) ? `file://${coverPath}` : null

      return { ...data, coverUrl }
    } catch (e) {
      console.error('Error parsing game file:', file, e)
      return null
    }
  }).filter(Boolean)

  console.log('Successfully loaded games:', games.length)
  return games
})

ipcMain.handle('launch-game', async (event, executable) => {
  return new Promise((resolve, reject) => {
    // We use the same 'cd' logic we found earlier
    exec(executable, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
})
