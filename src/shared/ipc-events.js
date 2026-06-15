export const IPC_EVENTS = {
  // Games
  GET_GAMES: 'get-games',
  SAVE_GAME: 'save-game',
  DELETE_GAME: 'delete-game',
  UPDATE_GAME_STATUS: 'update-game-status',
  LAUNCH_GAME: 'launch-game',
  REMOVE_ALL_GAMES: 'remove-all-games',
  UNDO_IMPORT: 'undo-import',
  GAMES_UPDATED: 'games-updated',

  // Settings
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',

  // Window Management
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  WINDOW_IS_MAXIMIZED: 'window-is-maximized',
  WINDOW_STATE_CHANGED: 'window-state-changed',
  OPEN_SHORTCUTS_WINDOW: 'open-shortcuts-window',
  SHORTCUTS_WINDOW_STATUS: 'shortcuts-window-status',

  // Theming
  GET_ACCENT_COLOR: 'get-accent-color',
  GET_ACCENT_COLOR_SYNC: 'get-accent-color-sync',
  ACCENT_COLOR_CHANGED: 'accent-color-changed',
  SET_ACCENT_COLOR: 'set-accent-color',

  // Dialogs
  SELECT_FOLDER: 'select-folder',
  SELECT_FILE: 'select-file',
  SELECT_IMAGE: 'select-image',

  // Scanning & Covers
  SCAN_FOLDER: 'scan-folder',
  RUN_AUTO_SCAN: 'run-auto-scan',
  SEARCH_STEAMGRIDDB: 'search-steamgriddb',
  FETCH_STEAMGRIDDB_COVERS: 'fetch-steamgriddb-covers',
  DOWNLOAD_COVER_URL: 'download-cover-url',
  UPDATE_ALL_COVERS: 'update-all-covers',
  SCAN_PROGRESS: 'scan-progress',
  COVER_DOWNLOAD_STATUS: 'cover-download-status',

  // Splash
  UPDATE_STATUS: 'update-status',
  UPDATE_PROGRESS: 'update-progress',
  
  // App
  SHOW_TOAST: 'show-toast',
  OPEN_EXTERNAL_URL: 'open-external-url',
  SHOW_WHATS_NEW: 'show-whats-new',

  // RAWG Video Support
  FETCH_RAWG_VIDEOS: 'fetch-rawg-videos',
};
