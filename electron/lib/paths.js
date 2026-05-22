import { app } from 'electron'
import path from 'node:path'

export const vibeportDir = path.join(app.getPath('home'), 'AppData', 'Local', 'vibeport')
export const gamesPath = path.join(vibeportDir, 'games')
export const coversDir = path.join(vibeportDir, 'covers')
export const settingsPath = path.join(vibeportDir, 'settings.json')

export const STEAMGRIDDB_API_KEY = 'a8dc25ee4cba2b7e42c459cad790da4f'
