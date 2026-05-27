import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, EyeOff, Trash2, X, Globe, Search, Loader } from 'lucide-react'
import { styles } from '../../theme/styles.js'

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

  const hexToRgb = (hex) => {
    try {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `${r}, ${g}, ${b}`
    } catch {
      return '139, 92, 246'
    }
  }

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
      const results = await window.api.searchSteamGridDB(queryStr)
      setSgdbResults(results || [])
      if (results && results.length > 0) {
        // Auto-select first result to display vertical options right away!
        const bestMatch = results.find(r => r.name.toLowerCase() === queryStr.toLowerCase()) || results[0]
        setSelectedGame(bestMatch)
        setLoadingCovers(true)
        const coverResults = await window.api.fetchSteamGridDBCovers(bestMatch.id)
        setCovers(coverResults || [])
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
      const results = await window.api.fetchSteamGridDBCovers(game.id)
      setCovers(results || [])
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
                          const file = await window.api.selectImage()
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
                        const file = await window.api.selectFile()
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

            {/* Right Column: SteamGridDB Cover Art Browser */}
            {showSgdb && (
              <div style={{
                flex: 1,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minWidth: '400px',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.03)',
                height: '100%',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Globe size={15} color={`#${accentHex}`} />
                  SteamGridDB Cover Browser
                </div>

                {/* Autocomplete Search input */}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, fontSize: '12.5px' }}
                    value={sgdbQuery}
                    onChange={(e) => setSgdbQuery(e.target.value)}
                    placeholder="Search game covers..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchOnline(e) }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchOnline}
                    style={{
                      padding: '0 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {searching ? <Loader size={12} className="spin" /> : <Search size={12} />}
                    Search
                  </button>
                </div>

                {/* Match Autocomplete Games Dropdown List */}
                {sgdbResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Matching Games
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(0,0,0,0.18)',
                      borderRadius: '8px',
                      padding: '4px',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      {sgdbResults.map(r => (
                        <div
                          key={r.id}
                          onClick={() => handleSelectSgdbGame(r)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: selectedGame?.id === r.id ? '700' : '500',
                            backgroundColor: selectedGame?.id === r.id ? `rgba(${hexToRgb(accentHex)}, 0.15)` : 'transparent',
                            color: selectedGame?.id === r.id ? `#${accentHex}` : '#cbd5e1',
                            transition: 'all 0.12s'
                          }}
                        >
                          {r.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Scrollable Covers Grid */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                  {(() => {
                    const animated = covers.filter(c => c.type === 'animated')
                    const statics = covers.filter(c => c.type === 'static')
                    const hasAnimated = animated.length > 0
                    
                    const shouldShowStatic = !hasAnimated
                    const displayedCovers = shouldShowStatic ? statics : animated

                    return (
                      <>
                        {loadingCovers ? (
                          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#8e8e93', fontSize: '12.5px', gap: '8px' }}>
                            <Loader size={16} className="spin" />
                            Loading covers from SteamGridDB...
                          </div>
                        ) : displayedCovers.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px',
                            paddingBottom: '16px'
                          }}>
                            {displayedCovers.map(c => {
                              const isSelected = formCoverUrl === c.url
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => setFormCoverUrl(c.url)}
                                  style={{
                                    position: 'relative',
                                    aspectRatio: '2/3',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: isSelected ? `2px solid #${accentHex}` : '1px solid rgba(255,255,255,0.06)',
                                    boxShadow: isSelected ? `0 0 10px rgba(${hexToRgb(accentHex)}, 0.4)` : '0 4px 12px rgba(0,0,0,0.2)',
                                    transform: isSelected ? 'scale(0.96)' : 'none',
                                    transition: 'transform 0.15s, border-color 0.15s'
                                  }}
                                >
                                  <img
                                    src={c.thumb}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      if (e.target.src !== c.url) {
                                        e.target.src = c.url
                                      }
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                            {selectedGame ? 'No covers found for this game.' : 'Search and select a game to view covers.'}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

              </div>
            )}

          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditGameModal
