import { contextBridge, ipcRenderer } from 'electron'

import { IPC_EVENTS } from '../src/shared/ipc-events.js'

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke(IPC_EVENTS.GET_GAMES),
  launchGame: (executable) => ipcRenderer.invoke(IPC_EVENTS.LAUNCH_GAME, executable),
  getSettings: () => ipcRenderer.invoke(IPC_EVENTS.GET_SETTINGS),
  saveSettings: (settings) => ipcRenderer.invoke(IPC_EVENTS.SAVE_SETTINGS, settings),
  removeAllGames: () => ipcRenderer.invoke(IPC_EVENTS.REMOVE_ALL_GAMES),
  saveGame: (gameData) => ipcRenderer.invoke(IPC_EVENTS.SAVE_GAME, gameData),
  deleteGame: (gameId) => ipcRenderer.invoke(IPC_EVENTS.DELETE_GAME, gameId),
  updateGameStatus: (gameId, status) => ipcRenderer.invoke(IPC_EVENTS.UPDATE_GAME_STATUS, gameId, status),
  searchSteamGridDB: (query) => ipcRenderer.invoke(IPC_EVENTS.SEARCH_STEAMGRIDDB, query),
  fetchSteamGridDBCovers: (gameId) => ipcRenderer.invoke(IPC_EVENTS.FETCH_STEAMGRIDDB_COVERS, gameId),
  downloadCoverUrl: (gameId, url) => ipcRenderer.invoke(IPC_EVENTS.DOWNLOAD_COVER_URL, gameId, url),
  getAccentColor: () => ipcRenderer.invoke(IPC_EVENTS.GET_ACCENT_COLOR),
  getAccentColorSync: () => ipcRenderer.sendSync(IPC_EVENTS.GET_ACCENT_COLOR_SYNC),
  onAccentColorChanged: (callback) => {
    const listener = (event, color) => callback(color)
    ipcRenderer.on(IPC_EVENTS.ACCENT_COLOR_CHANGED, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.ACCENT_COLOR_CHANGED, listener)
  },
  selectFolder: () => ipcRenderer.invoke(IPC_EVENTS.SELECT_FOLDER),
  selectFile: () => ipcRenderer.invoke(IPC_EVENTS.SELECT_FILE),
  selectImage: () => ipcRenderer.invoke(IPC_EVENTS.SELECT_IMAGE),
  scanFolder: (folderPath) => ipcRenderer.invoke(IPC_EVENTS.SCAN_FOLDER, folderPath),
  undoImport: (gamesToRestore) => ipcRenderer.invoke(IPC_EVENTS.UNDO_IMPORT, gamesToRestore),
  onGamesUpdated: (callback) => {
    const listener = () => callback()
    ipcRenderer.on(IPC_EVENTS.GAMES_UPDATED, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.GAMES_UPDATED, listener)
  },
  onShowToast: (callback) => {
    const listener = (event, message, type) => callback(message, type)
    ipcRenderer.on(IPC_EVENTS.SHOW_TOAST, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SHOW_TOAST, listener)
  },
  onShowWhatsNew: (callback) => {
    const listener = (event, version) => callback(version)
    ipcRenderer.on(IPC_EVENTS.SHOW_WHATS_NEW, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SHOW_WHATS_NEW, listener)
  },
  minimizeWindow: () => ipcRenderer.send(IPC_EVENTS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC_EVENTS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_EVENTS.WINDOW_CLOSE),
  openShortcutsWindow: () => ipcRenderer.invoke(IPC_EVENTS.OPEN_SHORTCUTS_WINDOW),
  isMaximized: () => ipcRenderer.invoke(IPC_EVENTS.WINDOW_IS_MAXIMIZED),
  runAutoScan: (enabledLaunchers) => ipcRenderer.invoke(IPC_EVENTS.RUN_AUTO_SCAN, enabledLaunchers),
  updateAllCovers: () => ipcRenderer.invoke(IPC_EVENTS.UPDATE_ALL_COVERS),
  onWindowStateChanged: (callback) => {
    const listener = (event, isMaximized) => callback(isMaximized)
    ipcRenderer.on(IPC_EVENTS.WINDOW_STATE_CHANGED, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.WINDOW_STATE_CHANGED, listener)
  },
  onShortcutsWindowStatus: (callback) => {
    const listener = (event, isOpen) => callback(isOpen)
    ipcRenderer.on(IPC_EVENTS.SHORTCUTS_WINDOW_STATUS, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SHORTCUTS_WINDOW_STATUS, listener)
  },
  onScanProgress: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on(IPC_EVENTS.SCAN_PROGRESS, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SCAN_PROGRESS, listener)
  },
  onCoverDownloadStatus: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on(IPC_EVENTS.COVER_DOWNLOAD_STATUS, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.COVER_DOWNLOAD_STATUS, listener)
  },
  openExternalUrl: (url) => ipcRenderer.invoke(IPC_EVENTS.OPEN_EXTERNAL_URL, url),
  onSetAccentColor: (callback) => {
    const listener = (event, color) => callback(color)
    ipcRenderer.on(IPC_EVENTS.SET_ACCENT_COLOR, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SET_ACCENT_COLOR, listener)
  },
  onUpdateStatus: (callback) => {
    const listener = (event, text) => callback(text)
    ipcRenderer.on(IPC_EVENTS.UPDATE_STATUS, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.UPDATE_STATUS, listener)
  },
  onUpdateProgress: (callback) => {
    const listener = (event, percent) => callback(percent)
    ipcRenderer.on(IPC_EVENTS.UPDATE_PROGRESS, listener)
    return () => ipcRenderer.removeListener(IPC_EVENTS.UPDATE_PROGRESS, listener)
  }
})