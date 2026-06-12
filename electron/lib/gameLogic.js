export function calculateDeleteAction(gameData, gameId) {
  if (!gameData) return { action: 'none' }
  const isStoreGame = gameData.source === 'steam' || gameData.source === 'gog' || gameId.startsWith('steam_') || gameId.startsWith('gog_')
  
  if (isStoreGame) {
    return { action: 'mark_removed', game: { ...gameData, removed: true } }
  } else {
    return { action: 'delete_file' }
  }
}

export function calculateUndoDeletions(existingGameIds, restoreIds) {
  const restoreSet = new Set(restoreIds);
  return existingGameIds.filter(id => !restoreSet.has(id));
}
