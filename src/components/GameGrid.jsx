import React from 'react'
import { styles } from '../theme/styles.js'
import { GameCard } from './GameCard.jsx'

export const GameGrid = React.memo(({
  games,
  loading,
  failedCovers,
  cardFontSize,
  onLaunch,
  onEdit,
  onDetails,
  onToggleHide,
  onDelete,
  onImageError,
  activeMenuGameId,
  setActiveMenuGameId,
  coverLaunchesGame,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptySub,
  emptyAction,
  isCoverDownloading
}) => {
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinnerLarge} />
        <div style={styles.loadingText}>Syncing game libraries...</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div style={styles.emptyState}>
        {EmptyIcon && <EmptyIcon size={48} color="#334155" style={{ marginBottom: '12px' }} />}
        <div style={styles.emptyStateTitle}>{emptyTitle}</div>
        <div style={styles.emptyStateSub}>{emptySub}</div>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className="game-grid" style={styles.grid}>
      {games.map(game => (
        <GameCard
          key={game.game_id}
          game={game}
          isHidden={game.hidden}
          hasFailedCover={!!failedCovers[game.game_id]}
          cardFontSize={cardFontSize}
          onLaunch={onLaunch}
          onEdit={onEdit}
          onDetails={onDetails}
          onToggleHide={onToggleHide}
          onDelete={onDelete}
          onImageError={onImageError}
          isOpen={activeMenuGameId === game.game_id}
          setActiveMenuGameId={setActiveMenuGameId}
          coverLaunchesGame={coverLaunchesGame}
          isCoverDownloading={isCoverDownloading}
        />
      ))}
    </div>
  )
})
