export function calculateDeleteAction(gameData, gameId) {
  if (!gameData) return { action: 'none' }
  const isStoreGame = gameData.source !== 'imported' && gameData.source !== 'manual' && !gameId.startsWith('imported_')
  
  if (isStoreGame) {
    return { action: 'mark_removed', game: { ...gameData, removed: true } }
  } else {
    return { action: 'delete_file' }
  }
}

export function calculateUndoDeletions(existingGameIds, restoreIds) {
  const restoreSet = new Set(restoreIds.map(item => typeof item === 'object' ? item.game_id : item));
  return existingGameIds.filter(id => !restoreSet.has(id));
}
