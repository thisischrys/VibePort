import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, EyeOff, Trash2, X, Globe, Search, Loader } from 'lucide-react'
import { styles } from '../../theme/styles.js'
import { IpcManager } from '../../shared/IpcManager.js'
import { normalizeGameName, hexToRgb } from '../../shared/utils.js'
import SteamGridDBSearch from '../SteamGridDBSearch.jsx'

const findBestSgdbMatch = (searchData, targetName) => {
  if (!searchData || searchData.length === 0) return null
  const targetNorm = normalizeGameName(targetName)
  for (const item of searchData) {
    if (normalizeGameName(item.name) === targetNorm) {
      return item
    }
  }
  return searchData[0]
}

const EditGameModal = ({
  accentHex,
  editingGame,
  formName, setFormName,
  formExecutable, setFormExecutable,
  formCoverUrl, setFormCoverUrl,
  onSubmit, onClose, onToggleHide, onDelete,
}) => {
  const hasChanges = formName !== editingGame.name ||
                     formExecutable !== editingGame.executable ||
                     formCoverUrl !== (editingGame.coverUrl || '')

  // SteamGridDB search states
  const [showSgdb, setShowSgdb] = useState(false)
  const [sgdbQuery, setSgdbQuery] = useState(formName)
  const [sgdbResults, setSgdbResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingCovers, setLoadingCovers] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null)
  const [covers, setCovers] = useState([])
  const [coverTypeFilter, setCoverTypeFilter] = useState('animated')

  // Auto-search logic when browser toggled
  const handleToggleSgdb = () => {
    const nextVal = !showSgdb
    setShowSgdb(nextVal)
    if (nextVal && sgdbResults.length === 0) {
      setSgdbQuery(formName)
      handleSearchOnlineWithQuery(formName)
    }
  }

  const handleSearchOnline = async (e) => {
    if (e) e.preventDefault()
    handleSearchOnlineWithQuery(sgdbQuery)
  }

  const handleSearchOnlineWithQuery = async (queryStr) => {
    if (!queryStr.trim()) return
    setSearching(true)
    setSelectedGame(null)
    setCovers([])
    try {
      const results = await IpcManager.searchSteamGridDB(queryStr)
      setSgdbResults(results || [])
      if (results && results.length > 0) {
        const bestMatch = findBestSgdbMatch(results, queryStr)
        setSelectedGame(bestMatch)
        setLoadingCovers(true)
        const coverResults = await IpcManager.fetchSteamGridDBCovers(bestMatch.id)
        setCovers(coverResults || [])
        const hasAnim = coverResults?.some(c => c.type === 'animated')
        setCoverTypeFilter(hasAnim ? 'animated' : 'static')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
      setLoadingCovers(false)
    }
  }

  const handleSelectSgdbGame = async (game) => {
    setSelectedGame(game)
    setLoadingCovers(true)
    setCovers([])
    try {
      const results = await IpcManager.fetchSteamGridDBCovers(game.id)
      setCovers(results || [])
      const hasAnim = results?.some(c => c.type === 'animated')
      setCoverTypeFilter(hasAnim ? 'animated' : 'static')
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCovers(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        ...styles.modalOverlayClear,
        WebkitAppRegion: 'drag', // Make overlay background draggable to move main window!
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Game Details"
        initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
        style={{
          ...styles.modalContentLarge,
          width: showSgdb ? '880px' : '460px',
          transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          height: '660px', // Increased height to comfortably fit 200x300 cover preview
          WebkitAppRegion: 'no-drag' // Stop drag inside card content area
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', WebkitAppRegion: 'no-drag' }}>
          {/* Header Bar */}
          <div style={{
            ...styles.modalHeader,
            borderBottom: 'none',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            flexShrink: 0,
            WebkitAppRegion: 'drag', // Dragging the modal header moves the window!
            userSelect: 'none',
          }}>
            <button
              type="button"
              className="glass-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: '#cbd5e1',
                zIndex: 10,
                WebkitAppRegion: 'no-drag',
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '15px',
              fontWeight: '700',
              color: '#f8fafc',
              pointerEvents: 'none',
            }}>
              Game Details
            </div>
            <button
              type="submit"
              className={hasChanges ? "glass-btn glass-btn-active" : "glass-btn"}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                backgroundColor: hasChanges ? `#${accentHex}` : 'rgba(255, 255, 255, 0.04)',
                borderColor: hasChanges ? `#${accentHex}` : 'rgba(255, 255, 255, 0.05)',
                color: hasChanges ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                boxShadow: hasChanges ? `0 0 15px rgba(${hexToRgb(accentHex)}, 0.3)` : 'none',
                opacity: hasChanges ? 1 : 0.4,
                zIndex: 10,
                WebkitAppRegion: 'no-drag',
              }}
              disabled={!hasChanges}
            >
              Apply
            </button>
          </div>

          {/* Split Body Container */}
          <div style={{ display: 'flex', width: '100%', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Column: Form Details */}
            <div style={{
              width: '460px',
              flexShrink: 0,
              padding: '8px 20px 24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box',
              borderRight: showSgdb ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              transition: 'border-right 0.3s',
              overflowY: 'auto'
            }}>
              {/* Centered Game Cover Image Section */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', width: '100%' }}>
                <div style={{
                  position: 'relative',
                  width: '200px',
                  height: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {formCoverUrl ? (
                    <img
                      src={formCoverUrl}
                      alt="Game Cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontSize: '12px',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '600'
                    }}>
                      <div style={{ fontSize: '20px' }}>🖼️</div>
                      <div>No Cover Art</div>
                    </div>
                  )}

                  {/* Floating Action Buttons */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 20
                  }}>
                    {formCoverUrl && (
                      <button
                        type="button"
                        onClick={() => setFormCoverUrl('')}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(30, 30, 30, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#f8fafc',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}
                        title="Remove Cover"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const file = await IpcManager.selectImage()
                          if (file) {
                            setFormCoverUrl(`media://${file.replace(/\\/g, '/')}`)
                          }
                        } catch (e) {
                          console.error('Failed to select cover image:', e)
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(30, 30, 30, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#f8fafc',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                      title="Change Cover from Disk"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSgdb}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: showSgdb ? `#${accentHex}` : 'rgba(30, 30, 30, 0.85)',
                        border: showSgdb ? `1px solid #${accentHex}` : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#f8fafc',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.2s'
                      }}
                      title="Search Covers Online"
                    >
                      <Globe size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Title</label>
                <input
                  type="text" className="form-input"
                  value={formName} onChange={(e) => setFormName(e.target.value)} required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Executable</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    value={formExecutable} onChange={(e) => setFormExecutable(e.target.value)} required
                  />
                  <button
                    type="button"
                    className="glass-btn"
                    style={{
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                    onClick={async () => {
                      try {
                        const file = await IpcManager.selectFile()
                        if (file) setFormExecutable(file)
                      } catch (e) {
                        console.error('Failed to select file:', e)
                      }
                    }}
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>
            {showSgdb && (
              <SteamGridDBSearch
                accentHex={accentHex}
                sgdbSearchQuery={sgdbQuery}
                setSgdbSearchQuery={setSgdbQuery}
                sgdbGames={sgdbResults}
                sgdbSearching={searching}
                selectedSgdbGame={selectedGame}
                setSelectedSgdbGame={setSelectedGame}
                sgdbCovers={covers}
                sgdbCoversLoading={loadingCovers}
                downloadingCoverId={null}
                onSearch={handleSearchOnline}
                onSelectGame={handleSelectSgdbGame}
                onDownloadCover={(url) => setFormCoverUrl(url)}
              />
            )}

          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditGameModal
