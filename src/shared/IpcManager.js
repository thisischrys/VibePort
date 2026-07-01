/**
 * IpcManager
 * Centralizes all Electron IPC actions.
 * Abstracts direct `window.api` calls.
 */
export class IpcManager {
  static getGames() {
    return window.api?.getGames() ?? Promise.resolve([]);
  }

  static launchGame(executable) {
    return window.api?.launchGame(executable) ?? Promise.resolve();
  }

  static getSettings() {
    return window.api?.getSettings() ?? Promise.resolve({});
  }

  static saveSettings(settings) {
    return window.api?.saveSettings(settings) ?? Promise.resolve();
  }

  static removeAllGames() {
    return window.api?.removeAllGames() ?? Promise.resolve();
  }

  static saveGame(gameData) {
    return window.api?.saveGame(gameData) ?? Promise.resolve();
  }

  static deleteGame(gameId) {
    return window.api?.deleteGame(gameId) ?? Promise.resolve();
  }

  static updateGameStatus(gameId, status) {
    return window.api?.updateGameStatus(gameId, status) ?? Promise.resolve();
  }

  static searchSteamGridDB(query) {
    return window.api?.searchSteamGridDB(query) ?? Promise.resolve([]);
  }

  static fetchSteamGridDBCovers(gameId) {
    return window.api?.fetchSteamGridDBCovers(gameId) ?? Promise.resolve([]);
  }

  static downloadCoverUrl(gameId, url) {
    return window.api?.downloadCoverUrl(gameId, url) ?? Promise.resolve();
  }

  static getAccentColor() {
    return window.api?.getAccentColor() ?? Promise.resolve('');
  }

  static getAccentColorSync() {
    return window.api?.getAccentColorSync() ?? '';
  }

  static onAccentColorChanged(callback) {
    if (!window.api?.onAccentColorChanged) {
      return () => {};
    }
    return window.api.onAccentColorChanged(callback);
  }

  static getNativeTheme() {
    return window.api?.getNativeTheme() ?? Promise.resolve(true);
  }

  static setThemeMode(mode) {
    return window.api?.setThemeMode(mode) ?? Promise.resolve();
  }

  static onThemeChanged(callback) {
    if (!window.api?.onThemeChanged) {
      return () => {};
    }
    return window.api.onThemeChanged(callback);
  }

  static selectFolder() {
    return window.api?.selectFolder() ?? Promise.resolve(null);
  }

  static selectFile() {
    return window.api?.selectFile() ?? Promise.resolve(null);
  }

  static selectImage() {
    return window.api?.selectImage() ?? Promise.resolve(null);
  }

  static scanFolder(folderPath) {
    return window.api?.scanFolder(folderPath) ?? Promise.resolve([]);
  }

  static undoImport(gamesToRestore) {
    return window.api?.undoImport(gamesToRestore) ?? Promise.resolve();
  }

  static onGamesUpdated(callback) {
    if (!window.api?.onGamesUpdated) {
      return () => {};
    }
    return window.api.onGamesUpdated(callback);
  }

  static onShowToast(callback) {
    if (!window.api?.onShowToast) {
      return () => {};
    }
    return window.api.onShowToast(callback);
  }

  static onShowWhatsNew(callback) {
    if (!window.api?.onShowWhatsNew) {
      return () => {};
    }
    return window.api.onShowWhatsNew(callback);
  }

  static minimizeWindow() {
    return window.api?.minimizeWindow();
  }

  static maximizeWindow() {
    return window.api?.maximizeWindow();
  }

  static closeWindow() {
    return window.api?.closeWindow();
  }

  static openShortcutsWindow() {
    return window.api?.openShortcutsWindow() ?? Promise.resolve();
  }

  static supportsShortcutsWindow() {
    return typeof window !== 'undefined' && !!window.api?.openShortcutsWindow;
  }

  static isMaximized() {
    return window.api?.isMaximized() ?? Promise.resolve(false);
  }

  static runAutoScan(enabledLaunchers) {
    return window.api?.runAutoScan(enabledLaunchers) ?? Promise.resolve();
  }

  static updateAllCovers() {
    return window.api?.updateAllCovers() ?? Promise.resolve();
  }

  static onWindowStateChanged(callback) {
    if (!window.api?.onWindowStateChanged) {
      return () => {};
    }
    return window.api.onWindowStateChanged(callback);
  }

  static onShortcutsWindowStatus(callback) {
    if (!window.api?.onShortcutsWindowStatus) {
      return () => {};
    }
    return window.api.onShortcutsWindowStatus(callback);
  }

  static onScanProgress(callback) {
    if (!window.api?.onScanProgress) {
      return () => {};
    }
    return window.api.onScanProgress(callback);
  }

  static onCoverDownloadStatus(callback) {
    if (!window.api?.onCoverDownloadStatus) {
      return () => {};
    }
    return window.api.onCoverDownloadStatus(callback);
  }

  static openExternalUrl(url) {
    return window.api?.openExternalUrl(url) ?? Promise.resolve(false);
  }
}
