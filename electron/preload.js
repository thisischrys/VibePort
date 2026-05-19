import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  launchGame: (executable) => ipcRenderer.invoke('launch-game', executable),
})