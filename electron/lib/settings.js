import fs from 'node:fs'
import { cartridgesDir, settingsPath } from './paths.js'

const DEFAULTS = {
  card_size: 'cozy',
  show_titles: true,
  use_windows_accent: true
}

export function getSettingsData() {
  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(cartridgesDir, { recursive: true })
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
  fs.mkdirSync(cartridgesDir, { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 4), 'utf8')
  return merged
}
