import React from 'react'
import { motion } from 'framer-motion'
import { Play, EyeOff, Edit3, MoreVertical, Trash2, Eye } from 'lucide-react'
import { styles } from '../theme/styles.js'
import { LauncherIcon } from './LauncherIcon.jsx'

export const GameCard = React.memo(({ game, isHidden, hasFailedCover, cardFontSize, onLaunch, onEdit, onDetails, onToggleHide, onDelete, onImageError, isOpen, setActiveMenuGameId, coverLaunchesGame }) => {
  const hasCover = game.coverUrl && !hasFailedCover;
  
  // Hide game card until we have a cover OR we have finished all background checks (failed)
  const isImageLoading = game.coverUrl && !hasCover;

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
          {/* Play Button Overlay */}
          <div 
            style={styles.playButtonOverlay}
            onClick={handleLaunchClick}
          >
            <Play size={28} color="#ffffff" style={styles.playIcon} />
          </div>

          {/* Small Bottom Info/More Bar */}
          <div style={styles.bottomOverlayBar}>
            <div style={styles.cardLauncherBadge}>
              <LauncherIcon source={game.source} style={styles.launcherIconMini} />
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <div 
                className="edit-overlay-btn"
                style={styles.overlayEditBtn}
                onClick={handleOverlayDetailsClick}
              >
                {coverLaunchesGame ? <Play size={12} color="#ffffff" /> : <Eye size={12} color="#ffffff" />}
              </div>
              <div 
                className="edit-overlay-btn"
                style={styles.overlayEditBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveMenuGameId(isOpen ? null : game.game_id)
                }}
              >
                <MoreVertical size={12} color="#ffffff" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Title Label underneath cover (hidden via styles usually but keeps semantics) ── */}
      <div style={styles.cardTitleBar}>
        <span className="game-title" style={styles.cardTitleText}>{game.name}</span>
      </div>

      {/* ── Inline Context Dropdown Menu ── */}
      {isOpen && (
        <div className="card-menu-container" style={styles.cardMenu}>
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
    </motion.div>
  )
})
