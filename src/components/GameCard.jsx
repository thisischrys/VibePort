import React from 'react'
import { motion } from 'framer-motion'
import { Play, EyeOff, Edit3, MoreVertical, Trash2, Eye } from 'lucide-react'
import { styles } from '../theme/styles.js'
import { LauncherIcon } from './LauncherIcon.jsx'

export const GameCard = React.memo(({ game, isHidden, hasFailedCover, cardFontSize, onLaunch, onEdit, onDetails, onToggleHide, onDelete, onImageError, isOpen, setActiveMenuGameId, coverLaunchesGame, isCoverDownloading }) => {
  const hasCover = game.coverUrl && !hasFailedCover;
  
  // Show skeleton while cover download is still in progress and we have no cover or failure
  const isImageLoading = !hasCover && !hasFailedCover && isCoverDownloading;
  
  if (isImageLoading) {
    return (
      <motion.div
        layoutId={`game-card-${game.game_id}`}
        style={{
          ...styles.gameCard,
          fontSize: cardFontSize,
          outline: 'none'
        }}
      >
        <div style={styles.coverWrapper}>
          <div className="skeleton-shimmer" style={{
            width: '200px',
            height: '300px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            background: 'linear-gradient(135deg, var(--placeholder-start) 0%, var(--placeholder-end) 100%)',
          }} />
        </div>
        <div style={styles.cardTitleBar}>
          <div style={{
            width: '70%',
            height: '14px',
            borderRadius: '4px',
            background: 'var(--surface-elevated)',
          }} />
        </div>
      </motion.div>
    )
  }

  const handleCardClick = (e) => {
    if (coverLaunchesGame) {
      onLaunch(game, e)
    } else {
      onDetails(game)
    }
  }

  const handleLaunchClick = (e) => {
    e.stopPropagation()
    onLaunch(game, e)
  }

  const handleOverlayDetailsClick = (e) => {
    e.stopPropagation()
    onDetails(game)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick(e)
    }
  }

  return (
    <motion.div
      layoutId={`game-card-${game.game_id}`}
      style={{
        ...styles.gameCard,
        fontSize: cardFontSize,
        outline: 'none'
      }}
      className="game-card-hover"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={game.name}
    >
      {/* Cover Image and Overlay Wrapper */}
      <div style={styles.coverWrapper}>
        {/* ── Cover Image or Placeholder ── */}
        {hasCover ? (
          <img
            src={game.coverUrl}
            alt={game.name}
            style={styles.coverImage}
            onError={() => onImageError(game.game_id)}
            loading="lazy"
          />
        ) : (
          <div style={styles.coverPlaceholder}>
            <LauncherIcon source={game.source} style={styles.placeholderLauncherIcon} />
            <span style={styles.placeholderText}>{game.name}</span>
          </div>
        )}

        {/* ── Hover Overlay Controls ── */}
        <div className="card-overlay" style={styles.cardOverlay}>
          {/* Top-Left Play/Details Button */}
          <div 
            className="play-osd-btn"
            style={{ ...styles.osdBtn, ...styles.osdPlayBtn }}
            onClick={coverLaunchesGame ? handleOverlayDetailsClick : handleLaunchClick}
            title={coverLaunchesGame ? "Details" : "Play"}
          >
            {coverLaunchesGame ? (
              <Eye size={16} color="#ffffff" />
            ) : (
              <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2.5px' }} />
            )}
          </div>

          {/* Top-Right Menu Button */}
          <div 
            className="menu-osd-btn"
            style={{ 
              ...styles.osdBtn, 
              ...styles.osdMenuBtn,
              opacity: isOpen ? 1 : undefined,
              transform: isOpen ? 'scale(1)' : undefined,
              backgroundColor: isOpen ? 'var(--osd-bg-active)' : undefined
            }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenuGameId(isOpen ? null : game.game_id)
            }}
            title="Menu"
          >
            <MoreVertical size={16} color="#ffffff" />
          </div>
        </div>

        {/* ── Inline Context Dropdown Menu ── */}
        {isOpen && (
          <div className="card-menu-container" style={styles.cardMenu}>
            <div style={styles.cardMenuArrow} />
            <div 
              className="gtk-menu-item"
              style={styles.gtkMenuItem}
              onClick={(e) => {
                e.stopPropagation()
                onLaunch(game, e)
                setActiveMenuGameId(null)
              }}
            >
              Play
            </div>
            
            <div 
              className="gtk-menu-item"
              style={styles.gtkMenuItem}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(game, e)
                setActiveMenuGameId(null)
              }}
            >
              Edit
            </div>

            <div 
              className="gtk-menu-item"
              style={styles.gtkMenuItem}
              onClick={(e) => {
                e.stopPropagation()
                onToggleHide(game, e)
                setActiveMenuGameId(null)
              }}
            >
              {isHidden ? 'Unhide' : 'Hide'}
            </div>

            <div 
              className="gtk-menu-item"
              style={styles.gtkMenuItem}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(game, e)
                setActiveMenuGameId(null)
              }}
            >
              Remove
            </div>
          </div>
        )}
      </div>

      {/* ── Title Label ── */}
      <div style={styles.cardTitleBar}>
        <span className="game-title" style={styles.cardTitleText}>{game.name}</span>
      </div>
    </motion.div>
  )
})
