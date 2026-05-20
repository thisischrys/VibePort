import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  launchGame: (executable) => ipcRenderer.invoke('launch-game', executable),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  saveGame: (gameData) => ipcRenderer.invoke('save-game', gameData),
  deleteGame: (gameId) => ipcRenderer.invoke('delete-game', gameId),
  updateGameStatus: (gameId, status) => ipcRenderer.invoke('update-game-status', gameId, status),
  searchSteamGridDB: (query) => ipcRenderer.invoke('search-steamgriddb', query),
  fetchSteamGridDBCovers: (gameId) => ipcRenderer.invoke('fetch-steamgriddb-covers', gameId),
  downloadCoverUrl: (gameId, url) => ipcRenderer.invoke('download-cover-url', gameId, url),
  onGamesUpdated: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('games-updated', listener)
    return () => ipcRenderer.removeListener('games-updated', listener)
  },
  onShowToast: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('show-toast', listener)
    return () => ipcRenderer.removeListener('show-toast', listener)
  }
})