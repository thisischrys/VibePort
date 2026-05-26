import fs from 'node:fs'
import path from 'node:path'
import protobuf from 'protobufjs'
import { gamesPath } from '../lib/paths.js'
import { writeGame, removeCoverFiles } from '../lib/gameStore.js'
import { getSettingsData } from '../lib/settings.js'

// Inlined compiled Protobuf JSON schema for product.db decoding
const PROTO_SCHEMA = {
  nested: {
    LanguageSetting: {
      fields: {
        language: { type: 'string', id: 1 },
        option: { type: 'LanguageOption', id: 2 }
      }
    },
    UserSettings: {
      fields: {
        installPath: { type: 'string', id: 1 },
        playRegion: { type: 'string', id: 2 },
        desktopShortcut: { type: 'ShortcutOption', id: 3 },
        startmenuShortcut: { type: 'ShortcutOption', id: 4 },
        languageSettings: { type: 'LanguageSettingType', id: 5 },
        selectedTextLanguage: { type: 'string', id: 6 },
        selectedSpeechLanguage: { type: 'string', id: 7 },
        languages: { rule: 'repeated', type: 'LanguageSetting', id: 8 },
        gfxOverrideTags: { type: 'string', id: 9 },
        versionbranch: { type: 'string', id: 10 }
      }
    },
    InstallHandshake: {
      fields: {
        product: { type: 'string', id: 1 },
        uid: { type: 'string', id: 2 },
        settings: { type: 'UserSettings', id: 3 }
      }
    },
    BuildConfig: {
      fields: {
        region: { type: 'string', id: 1 },
        buildConfig: { type: 'string', id: 2 }
      }
    },
    BaseProductState: {
      fields: {
        installed: { type: 'bool', id: 1 },
        playable: { type: 'bool', id: 2 },
        updateComplete: { type: 'bool', id: 3 },
        backgroundDownloadAvailable: { type: 'bool', id: 4 },
        backgroundDownloadComplete: { type: 'bool', id: 5 },
        currentVersion: { type: 'string', id: 6 },
        currentVersionStr: { type: 'string', id: 7 },
        installedBuildConfig: { rule: 'repeated', type: 'BuildConfig', id: 8 },
        backgroundDownloadBuildConfig: { rule: 'repeated', type: 'BuildConfig', id: 9 },
        decryptionKey: { type: 'string', id: 10 },
        completedInstallActions: { rule: 'repeated', type: 'string', id: 11 }
      }
    },
    BackfillProgress: {
      fields: {
        progress: { type: 'double', id: 1 },
        backgrounddownload: { type: 'bool', id: 2 },
        paused: { type: 'bool', id: 3 },
        downloadLimit: { type: 'uint64', id: 4 }
      }
    },
    RepairProgress: {
      fields: {
        progress: { type: 'double', id: 1 }
      }
    },
    UpdateProgress: {
      fields: {
        lastDiscSetUsed: { type: 'string', id: 1 },
        progress: { type: 'double', id: 2 },
        discIgnored: { type: 'bool', id: 3 },
        totalToDownload: { type: 'uint64', id: 4, options: { default: 0 } },
        downloadRemaining: { type: 'uint64', id: 5, options: { default: 0 } }
      }
    },
    CachedProductState: {
      fields: {
        baseProductState: { type: 'BaseProductState', id: 1 },
        backfillProgress: { type: 'BackfillProgress', id: 2 },
        repairProgress: { type: 'RepairProgress', id: 3 },
        updateProgress: { type: 'UpdateProgress', id: 4 }
      }
    },
    ProductOperations: {
      fields: {
        activeOperation: { type: 'Operation', id: 1, options: { default: 'OP_NONE' } },
        priority: { type: 'uint64', id: 2 }
      }
    },
    ProductInstall: {
      fields: {
        uid: { type: 'string', id: 1 },
        productCode: { type: 'string', id: 2 },
        settings: { type: 'UserSettings', id: 3 },
        cachedProductState: { type: 'CachedProductState', id: 4 },
        productOperations: { type: 'ProductOperations', id: 5 }
      }
    },
    ProductConfig: {
      fields: {
        productCode: { type: 'string', id: 1 },
        metadataHash: { type: 'string', id: 2 },
        timestamp: { type: 'string', id: 3 }
      }
    },
    ActiveProcess: {
      fields: {
        processName: { type: 'string', id: 1 },
        pid: { type: 'int32', id: 2 },
        uri: { rule: 'repeated', type: 'string', id: 3 }
      }
    },
    DownloadSettings: {
      fields: {
        downloadLimit: { type: 'int32', id: 1, options: { default: -1 } },
        backfillLimit: { type: 'int32', id: 2, options: { default: -1 } }
      }
    },
    Database: {
      fields: {
        productInstall: { rule: 'repeated', type: 'ProductInstall', id: 1 },
        activeInstalls: { rule: 'repeated', type: 'InstallHandshake', id: 2 },
        activeProcesses: { rule: 'repeated', type: 'ActiveProcess', id: 3 },
        productConfigs: { rule: 'repeated', type: 'ProductConfig', id: 4 },
        downloadSettings: { type: 'DownloadSettings', id: 5 }
      }
    },
    LanguageOption: {
      values: {
        LANGOPTION_NONE: 0,
        LANGOPTION_TEXT: 1,
        LANGOPTION_SPEECH: 2,
        LANGOPTION_TEXT_AND_SPEECH: 3
      }
    },
    LanguageSettingType: {
      values: {
        LANGSETTING_NONE: 0,
        LANGSETTING_SINGLE: 1,
        LANGSETTING_SIMPLE: 2,
        LANGSETTING_ADVANCED: 3
      }
    },
    ShortcutOption: {
      values: {
        SHORTCUT_NONE: 0,
        SHORTCUT_USER: 1,
        SHORTCUT_ALL_USERS: 2
      }
    },
    Operation: {
      values: {
        OP_NONE: -1,
        OP_UPDATE: 0,
        OP_BACKFILL: 1,
        OP_REPAIR: 2
      }
    }
  }
}

// Map Battle.net UIDs to launch codes and display names
const BNET_GAMES = {
  s1: { name: 'StarCraft', code: 'S1' },
  s2: { name: 'StarCraft II', code: 'S2' },
  wow: { name: 'World of Warcraft', code: 'WoW' },
  wow_classic: { name: 'World of Warcraft Classic', code: 'WoW_wow_classic' },
  wow_classic_era: { name: 'World of Warcraft Classic Era', code: 'WoW_wow_classic_era' },
  pro: { name: 'Overwatch 2', code: 'Pro' },
  w1: { name: 'Warcraft: Orcs & Humans', code: 'W1' },
  w1r: { name: 'Warcraft I: Remastered', code: 'W1R' },
  w2bn: { name: 'Warcraft II: Battle.net Edition', code: 'W2BN' },
  w2r: { name: 'Warcraft II: Remastered', code: 'W2R' },
  w3: { name: 'Warcraft III', code: 'W3' },
  gryphon: { name: 'Warcraft Rumble', code: 'GRY' },
  hsb: { name: 'Hearthstone', code: 'WTCG' },
  hero: { name: 'Heroes of the Storm', code: 'Hero' },
  d3: { name: 'Diablo III', code: 'D3' },
  d3cn: { name: 'Diablo III (China)', code: 'D3CN' },
  fenris: { name: 'Diablo IV', code: 'Fen' },
  viper: { name: 'Call of Duty: Black Ops 4', code: 'VIPR' },
  odin: { name: 'Call of Duty: Modern Warfare', code: 'ODIN' },
  lazarus: { name: 'Call of Duty: MW2 Campaign Remastered', code: 'LAZR' },
  zeus: { name: 'Call of Duty: Black Ops Cold War', code: 'ZEUS' },
  auks: { name: 'Call of Duty: Modern Warfare II', code: 'AUKS' },
  codhq: { name: 'Call of Duty HQ', code: 'CODHQ' },
  rtro: { name: 'Blizzard Arcade Collection', code: 'RTRO' },
  wlby: { name: 'Crash Bandicoot 4: It\'s About Time', code: 'WLBY' },
  osi: { name: 'Diablo II: Resurrected', code: 'OSI' },
  fore: { name: 'Call of Duty: Vanguard', code: 'FORE' },
  d2: { name: 'Diablo II', code: 'Diablo II' },
  d2LOD: { name: 'Diablo II: Lord of Destruction', code: 'Diablo II' },
  anbs: { name: 'Diablo Immortal', code: 'ANBS' }
}

const BNET_SKIP_UIDS = ['agent', 'battle.net', 'bna']

export async function scanBattlenetLibrary() {
  console.log('[AUTO-SCAN] Scanning Battle.net library...')

  const dbPath = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Battle.net\\Agent\\product.db')

  if (!fs.existsSync(dbPath)) {
    console.log('[AUTO-SCAN] Battle.net product.db not found. Skipping.')
    return
  }

  try {
    const root = protobuf.Root.fromJSON(PROTO_SCHEMA)
    const Database = root.lookupType('Database')

    const buffer = fs.readFileSync(dbPath)
    const decoded = Database.decode(buffer)
    const data = Database.toObject(decoded, {
      defaults: true,
      longs: String,
      enums: String,
      bytes: String
    })

    const productInstalls = Array.isArray(data.productInstall) ? data.productInstall : []
    const foundIds = new Set()

    for (const element of productInstalls) {
      const uid = element.uid
      if (!uid || BNET_SKIP_UIDS.includes(uid.toLowerCase())) continue

      const state = element.cachedProductState?.baseProductState
      const installed = state?.installed === true && state?.playable === true

      if (!installed) continue

      const info = BNET_GAMES[uid]
      const folderName = path.basename(element.settings?.installPath || '')
      const displayName = info ? info.name : (folderName || uid.charAt(0).toUpperCase() + uid.slice(1))
      const shortcutCode = info ? info.code : (element.productCode || uid)

      const gameId = `battlenet_${uid}`
      foundIds.add(gameId)

      const gameFilePath = path.join(gamesPath, `${gameId}.json`)

      if (!fs.existsSync(gameFilePath)) {
        writeGame(gameId, {
          added: Math.floor(Date.now() / 1000),
          developer: null,
          executable: `battlenet://play/${shortcutCode}`,
          game_id: gameId,
          hidden: false,
          last_played: 0,
          name: displayName,
          removed: false,
          source: 'battlenet',
          version: 1.5
        })
        console.log('[AUTO-SCAN] Added Battle.net game:', displayName)
      } else {
        // Sync or update if needed
        try {
          const existing = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'))
          let changed = false
          if (existing.name !== displayName) {
            existing.name = displayName
            changed = true
          }
          if (existing.executable === `battlenet://${shortcutCode}` || !existing.executable.startsWith('battlenet://play/')) {
            existing.executable = `battlenet://play/${shortcutCode}`
            changed = true
          }
          if (changed) {
            writeGame(gameId, existing)
            console.log(`[AUTO-SCAN] Synced and updated Battle.net game: "${displayName}"`)
          }
        } catch (e) {
          console.error('[AUTO-SCAN] Failed to sync Battle.net game:', gameId, e.message)
        }
      }
    }

    // Clean up uninstalled Battle.net games
    const settings = getSettingsData()
    if (settings.remove_uninstalled !== false && fs.existsSync(gamesPath)) {
      const files = fs.readdirSync(gamesPath).filter(f => f.startsWith('battlenet_') && f.endsWith('.json'))
      for (const dbFile of files) {
        const gameId = dbFile.replace('.json', '')
        if (!foundIds.has(gameId)) {
          console.log(`[AUTO-SCAN] Battle.net game ${gameId} uninstalled. Removing...`)
          try {
            fs.unlinkSync(path.join(gamesPath, dbFile))
            removeCoverFiles(gameId)
          } catch (e) {
            console.error(`[AUTO-SCAN] Failed to remove ${gameId}:`, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCAN] Battle.net scan failed:', err)
  }
}
