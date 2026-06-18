import fs from 'node:fs'
import { vibeportDir, settingsPath } from './paths.js'

const DEFAULTS = {
  use_windows_accent: true,
  exit_after_launch: false,
  auto_import: true,
  remove_uninstalled: true,
  scan_steam: true,
  scan_gog: true,
  scan_epic: true,
  scan_ea: true,
  scan_ubisoft: true,
  scan_bnet: true,
  scan_xbox: true,
  scan_amazon: true,
  cover_launches_game: true,
  last_version_run: '0.0.0',
  window_bounds: { width: 1280, height: 720 },
  window_maximized: false,
  sort_by: 'alphabetical',
  show_hidden: false,
  show_sidebar: true
}


export function getSettingsData() {
  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(vibeportDir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULTS, null, 4), 'utf8')
    return { ...DEFAULTS }
  }
  try {
    const content = fs.readFileSync(settingsPath, 'utf8')
    return { ...DEFAULTS, ...JSON.parse(content) }
  } catch (e) {
    console.error('Failed to parse settings.json:', e)
    return { ...DEFAULTS }
  }
}

export function saveSettingsData(newSettings) {
  const current = getSettingsData()
  const merged = { ...current, ...newSettings }
  fs.mkdirSync(vibeportDir, { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 4), 'utf8')
  return merged
}
