import { BrowserWindow, shell, nativeTheme } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getSettingsData, saveSettingsData } from './lib/settings.js'
import { IPC_EVENTS } from '../src/shared/ipc-events.js'
import { state } from './state.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon_transparent.png')
  const settings = getSettingsData()
  const bounds = settings.window_bounds || { width: 1280, height: 720 }
  
  state.mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true,
    show: !settings.window_maximized
  })

  if (settings.window_maximized) {
    state.mainWindow.maximize()
    state.mainWindow.show()
  }

  state.mainWindow.setMenu(null)
  
  state.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    state.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    state.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Window state event listeners to push state to React
  state.mainWindow.on('maximize', () => {
    state.mainWindow.webContents.send(IPC_EVENTS.WINDOW_STATE_CHANGED, true)
  })
  state.mainWindow.on('unmaximize', () => {
    state.mainWindow.webContents.send(IPC_EVENTS.WINDOW_STATE_CHANGED, false)
  })

  const saveGeometry = () => {
    if (!state.mainWindow) return
    const isMaximized = state.mainWindow.isMaximized()
    const bounds = state.mainWindow.getBounds()
    const update = { window_maximized: isMaximized }
    if (!isMaximized) {
      update.window_bounds = bounds
    }
    saveSettingsData(update)
  }

  state.mainWindow.on('resize', saveGeometry)
  state.mainWindow.on('move', saveGeometry)
  state.mainWindow.on('close', saveGeometry)

  state.mainWindow.on('closed', () => { state.mainWindow = null })
}

export function createShortcutsWindow() {
  if (state.shortcutsWindow) {
    state.shortcutsWindow.focus()
    return
  }

  const iconPath = path.join(__dirname, '../build/icon_transparent.png')
  state.shortcutsWindow = new BrowserWindow({
    parent: state.mainWindow || undefined,
    width: 640,
    height: 420,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    thickFrame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false
  })

  state.shortcutsWindow.setMenu(null)

  if (process.env.VITE_DEV_SERVER_URL) {
    state.shortcutsWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#shortcuts')
  } else {
    state.shortcutsWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'shortcuts' })
  }

  // Natively freeze main window dragging and resizing silently
  if (state.mainWindow) {
    state.mainWindow.setMovable(false)
    state.mainWindow.setResizable(false)
    state.mainWindow.webContents.send(IPC_EVENTS.SHORTCUTS_WINDOW_STATUS, true)
  }

  state.shortcutsWindow.once('ready-to-show', () => {
    state.shortcutsWindow.center()
    state.shortcutsWindow.show()
  })

  state.shortcutsWindow.on('closed', () => {
    state.shortcutsWindow = null
    if (state.mainWindow) {
      state.mainWindow.setMovable(true)
      state.mainWindow.setResizable(true)
      state.mainWindow.webContents.send(IPC_EVENTS.SHORTCUTS_WINDOW_STATUS, false)
      state.mainWindow.focus()
    }
  })
}

export function createSplashWindow() {
  const accentColor = state.lastAccentColor || '8b5cf6'
  
  state.splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  let splashPath = path.join(__dirname, 'splash.html')
  if (process.env.VITE_DEV_SERVER_URL) {
    splashPath = path.join(__dirname, '../electron/splash.html')
  }
  state.splashWindow.loadFile(splashPath)

  state.splashWindow.webContents.on('did-finish-load', () => {
    state.splashWindow.webContents.send(IPC_EVENTS.SET_ACCENT_COLOR, accentColor)
    state.splashWindow.webContents.send(IPC_EVENTS.THEME_CHANGED, nativeTheme.shouldUseDarkColors)
  })

  state.splashWindow.on('closed', () => {
    state.splashWindow = null
  })
}

export function launchApp() {
  if (state.splashWindow) {
    try { state.splashWindow.close() } catch (e) { console.error(e) }
  }
  if (state.mainWindow) {
    state.mainWindow.show()
    state.mainWindow.focus()
  }
}
