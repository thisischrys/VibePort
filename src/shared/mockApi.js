export function setupMockApi() {
  if (typeof window !== 'undefined' && !window.api) {
    console.log('[VibePort] window.api is undefined (outside Electron). Injecting mock API for browser viewing/testing...');
    
    const MOCK_STORAGE_KEY = 'vibeport_mock_games';
    if (!localStorage.getItem(MOCK_STORAGE_KEY)) {
      const initialMockGames = [
        {
          game_id: 'mock_diablo_iv',
          name: 'Diablo IV',
          developer: 'Blizzard Entertainment',
          executable: 'battlenet://play/FEN',
          source: 'battlenet',
          added: Math.floor(Date.now() / 1000) - 100000,
          last_played: Math.floor(Date.now() / 1000) - 5000,
          hidden: false,
          coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80'
        },
        {
          game_id: 'mock_cyberpunk',
          name: 'Cyberpunk 2077',
          developer: 'CD Projekt Red',
          executable: 'steam://run/1091500',
          source: 'steam',
          added: Math.floor(Date.now() / 1000) - 200000,
          last_played: 0,
          hidden: false,
          coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'
        },
        {
          game_id: 'mock_witcher_3',
          name: 'The Witcher 3: Wild Hunt',
          developer: 'CD Projekt Red',
          executable: 'goggalaxy://openGameFlow/1242051612',
          source: 'gog',
          added: Math.floor(Date.now() / 1000) - 300000,
          last_played: 0,
          hidden: false,
          coverUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80'
        },
        {
          game_id: 'mock_hades',
          name: 'Hades',
          developer: 'Supergiant Games',
          executable: 'C:\\Games\\Hades\\Hades.exe',
          source: 'imported',
          added: Math.floor(Date.now() / 1000) - 50000,
          last_played: Math.floor(Date.now() / 1000) - 2000,
          hidden: false,
          coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80'
        }
      ];
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockGames));
    }

    const getMockGames = () => {
      try {
        return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY)) || [];
      } catch {
        return [];
      }
    };

    const saveMockGames = (games) => {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(games));
    };

    window.api = {
      getGames: async () => {
        return getMockGames();
      },
      saveGame: async (gameData) => {
        const games = getMockGames();
        let game = { ...gameData };
        if (!game.game_id) {
          game.game_id = `imported_${Date.now()}`;
          game.added = Math.floor(Date.now() / 1000);
          game.last_played = 0;
          game.hidden = false;
          game.source = 'imported';
        }
        const existingIdx = games.findIndex(g => g.game_id === game.game_id);
        if (existingIdx >= 0) {
          games[existingIdx] = { ...games[existingIdx], ...game };
          game = games[existingIdx];
        } else {
          games.push(game);
        }
        saveMockGames(games);
        
        if (window.api._onGamesUpdatedCallback) {
          window.api._onGamesUpdatedCallback();
        }
        return { success: true, game };
      },
      deleteGame: async (gameId) => {
        let games = getMockGames();
        const gameIdx = games.findIndex(g => g.game_id === gameId);
        if (gameIdx >= 0) {
          const game = games[gameIdx];
          if (game.source !== 'imported' && game.source !== 'manual' && !gameId.startsWith('imported_')) {
            games[gameIdx] = { ...game, removed: true };
          } else {
            games.splice(gameIdx, 1);
          }
          saveMockGames(games);
        }
        if (window.api._onGamesUpdatedCallback) {
          window.api._onGamesUpdatedCallback();
        }
        return true;
      },
      updateGameStatus: async (gameId, status) => {
        const games = getMockGames();
        const gameIdx = games.findIndex(g => g.game_id === gameId);
        if (gameIdx >= 0) {
          games[gameIdx] = { ...games[gameIdx], ...status };
          saveMockGames(games);
          if (window.api._onGamesUpdatedCallback) {
            window.api._onGamesUpdatedCallback();
          }
          return true;
        }
        return false;
      },
      launchGame: async (executable) => {
        console.log('[Mock API] launchGame:', executable);
        if (window.api._onShowToastCallback) {
          window.api._onShowToastCallback({
            message: `Launched game successfully: ${executable}`,
            type: 'success'
          });
        }
        return true;
      },
      getAccentColor: async () => '8b5cf6',
      getAccentColorSync: () => '8b5cf6',
      selectFolder: async () => 'C:\\Games',
      selectFile: async () => 'C:\\Games\\CustomGame\\Game.exe',
      scanFolder: async (folderPath) => {
        const games = getMockGames();
        const newGame = {
          game_id: `imported_${Date.now()}`,
          name: 'Scanned Game ' + (games.length + 1),
          developer: 'Imported',
          executable: folderPath + '\\Game.exe',
          source: 'imported',
          added: Math.floor(Date.now() / 1000),
          last_played: 0,
          hidden: false,
          coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80'
        };
        games.push(newGame);
        saveMockGames(games);
        if (window.api._onGamesUpdatedCallback) {
          window.api._onGamesUpdatedCallback();
        }
        return { success: true, count: 1 };
      },
      searchSteamGridDB: async (query) => {
        return [
          { id: 1, name: query || 'Search Result Game' },
          { id: 2, name: (query || 'Search Result') + ' Sequel' }
        ];
      },
      fetchSteamGridDBCovers: async (id) => {
        return [
          { id: 'c1', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80', type: 'static', width: 400, height: 600 },
          { id: 'c2', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&q=80', url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80', type: 'static', width: 400, height: 600 }
        ];
      },
      downloadCoverUrl: async (gameId, imageUrl) => {
        const games = getMockGames();
        const gameIdx = games.findIndex(g => g.game_id === gameId);
        if (gameIdx >= 0) {
          games[gameIdx].coverUrl = imageUrl;
          saveMockGames(games);
          if (window.api._onGamesUpdatedCallback) {
            window.api._onGamesUpdatedCallback();
          }
        }
        return true;
      },
      isMaximized: async () => false,
      minimizeWindow: () => console.log('[Mock API] minimizeWindow'),
      maximizeWindow: () => console.log('[Mock API] maximizeWindow'),
      closeWindow: () => console.log('[Mock API] closeWindow'),
      
      // Event listeners
      onGamesUpdated: (fn) => {
        window.api._onGamesUpdatedCallback = fn;
        return () => { window.api._onGamesUpdatedCallback = null; };
      },
      onShowToast: (fn) => {
        window.api._onShowToastCallback = fn;
        return () => { window.api._onShowToastCallback = null; };
      },
      onAccentColorChanged: (fn) => {
        return () => {};
      },
      onWindowStateChanged: (fn) => {
        return () => {};
      }
    };
  }
}
