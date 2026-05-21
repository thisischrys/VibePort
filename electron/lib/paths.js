import { app } from 'electron'
import path from 'node:path'

export const cartridgesDir = path.join(app.getPath('home'), 'AppData', 'Local', 'cartridges-native')
export const gamesPath = path.join(cartridgesDir, 'games')
export const coversDir = path.join(cartridgesDir, 'covers')
export const settingsPath = path.join(cartridgesDir, 'settings.json')

export const STEAMGRIDDB_API_KEY = 'a8dc25ee4cba2b7e42c459cad790da4f'
