import React, { useEffect, useDeferredValue, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, EyeOff, Edit3, X, Trash2, Eye, Play } from 'lucide-react'
import { styles } from './theme/styles.js'
import CartridgeIcon from './components/CartridgeIcon.jsx'
import AddGameModal from './components/modals/AddGameModal.jsx'
import EditGameModal from './components/modals/EditGameModal.jsx'
import AboutModal from './components/modals/AboutModal.jsx'
import { PreferencesModal } from './components/modals/PreferencesModal.jsx'
import { ShortcutsModal } from './components/modals/ShortcutsModal.jsx'

import packageJson from '../package.json'
import { TitleBar } from './components/TitleBar.jsx'
import { IpcManager } from './shared/IpcManager.js'

import { GameGrid } from './components/GameGrid.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { Toast } from './components/Toast.jsx'
import { ScanOverlay } from './components/ScanOverlay.jsx'
import { useGames } from './hooks/useGames.js'
import { sortGames, hexToRgb } from './shared/utils.js'
import './App.css'

const App = () => {
  const {
    games,
    loading,
    searchTerm, setSearchTerm,
    showSearch, setShowSearch,
    selectedSource, setSelectedSource,
    launchingGame,
    failedCovers,
    settings,
    updateSettings,
    accentHex,
    themeMode, setThemeMode, isDark,
    activeToast, setActiveToast,
    showAddModal, setShowAddModal,
    showEditModal, setShowEditModal,
    showAboutModal, setShowAboutModal,
    showPreferencesModal, setShowPreferencesModal,
    preferencesInitialTab,
    showShortcutsModal, setShowShortcutsModal,
    isStandaloneShortcutsOpen,

    isScanning,
    scanMode,
    isCoverDownloading,
    coverDownloadProgress,
    scanProgress,
    editingGame,
    formName, setFormName,
    formExecutable, setFormExecutable,
    formDeveloper, setFormDeveloper,
    formCoverUrl, setFormCoverUrl,
    activeMenuGameId, setActiveMenuGameId,
    sortBy, setSortBy,
    showHidden, setShowHidden,
    showSidebar, setShowSidebar,
    viewState, setViewState,
    selectedGame, setSelectedGame,
    detailsDropdownOpen, setDetailsDropdownOpen,
    detailsGradient,
    fetchGames,
    handleUndo,
    handleLaunch,
    handleToggleHideGame,
    handleDeleteGame,
    handleImageError,
    handleRemoveAllGames,
    handleRunAutoScan,
    handleToggleWindowsAccent,
    handleUpdateAllCovers,
    resetForm,
    openAddModal,
    handleOpenShortcuts,
    openEditModal,
    handleAddGameSubmit,
    handleEditGameSubmit,
    handleScanGamesFolder,
    openDetailsView,
    closeDetailsView,
    handleSearchOn
  } = useGames()

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const modalOpen = showPreferencesModal || showShortcutsModal || showAboutModal || showAddModal || showEditModal
      if (modalOpen && e.key !== 'Escape') {
        return
      }
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
        if (e.key === 'Escape') document.activeElement.blur()
        return
      }
      const mod = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey

      // Ctrl + H -> Toggle Show Hidden
      if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setShowHidden(p => !p)
      }

      // Ctrl + F -> Toggle Search
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowSearch(p => !p)
      }

      // Ctrl + , -> Toggle Preferences
      if (mod && e.key === ',') {
        e.preventDefault()
        setShowPreferencesModal(p => !p)
        setShowAddModal(false)
        setShowEditModal(false)
        setShowAboutModal(false)
        setShowShortcutsModal(false)
      }

      // Ctrl + ? (with Shift) or Ctrl + / (standard) -> Toggle Shortcuts
      if (mod && (e.key === '?' || e.key === '/')) {
        e.preventDefault()
        handleOpenShortcuts()
        setShowAddModal(false)
        setShowEditModal(false)
        setShowAboutModal(false)
        setShowPreferencesModal(false)
      }

      // Ctrl + Q -> Quit App
      if (mod && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        IpcManager.closeWindow()
      }

      // Ctrl + N -> Add Game Modal
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openAddModal()
      }

      // Ctrl + G -> Scan Games Folder
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        handleScanGamesFolder()
      }

      // Ctrl + I -> Run Auto Scanners for Enabled Launchers
      if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        handleRunAutoScan()
      }

      // Ctrl + Z -> Undo Deleted Custom Game, Bulk Delete, or Library Import
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
      }

      // F9 -> Toggle Sidebar
      if (e.key === 'F9') {
        e.preventDefault()
        setShowSidebar(p => !p)
      }

      // F10 -> Main Menu Click dispatch
      if (e.key === 'F10') {
        e.preventDefault()
        const menuBtn = document.querySelector('[title="Main Menu"]')
        if (menuBtn) {
          menuBtn.click()
        }
      }

      // Escape key handlers
      if (e.key === 'Escape') {
        const anyOpen = showAddModal || showEditModal || showAboutModal || showPreferencesModal || showShortcutsModal
        if (anyOpen) {
          setShowAddModal(false)
          setShowEditModal(false)
          setShowAboutModal(false)
          setShowPreferencesModal(false)
          setShowShortcutsModal(false)
        } else if (showSearch) {
          setShowSearch(false)
          setSearchTerm('')
        } else if (showHidden) {
          setShowHidden(false)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    showHidden, showAddModal, showEditModal, showAboutModal, showPreferencesModal, showShortcutsModal, showSearch,
    setSearchTerm, setShowHidden, setShowSearch, setShowPreferencesModal, setShowAddModal, setShowEditModal,
    setShowAboutModal, setShowShortcutsModal, handleOpenShortcuts, handleScanGamesFolder, handleRunAutoScan,
    handleUndo, setShowSidebar
  ])

  // Track last details/hidden actions for forward navigation
  const lastNavActionRef = useRef(null)
  const prevShowHiddenRef = useRef(showHidden)

  useEffect(() => {
    if (prevShowHiddenRef.current && !showHidden) {
      lastNavActionRef.current = { type: 'hidden' }
    }
    prevShowHiddenRef.current = showHidden
  }, [showHidden])

  // Listen for Mouse back/forward button to navigate
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (e.button === 3) { // Mouse back button
        if (viewState === 'details') {
          e.preventDefault()
          closeDetailsView()
          if (selectedGame) {
            lastNavActionRef.current = { type: 'details', game: selectedGame }
          }
        } else if (showHidden) {
          e.preventDefault()
          setShowHidden(false)
        }
      } else if (e.button === 4) { // Mouse forward button (undo back)
        if (viewState === 'grid') {
          if (lastNavActionRef.current?.type === 'details') {
            e.preventDefault()
            openDetailsView(lastNavActionRef.current.game)
            lastNavActionRef.current = null
          } else if (lastNavActionRef.current?.type === 'hidden') {
            e.preventDefault()
            setShowHidden(true)
            lastNavActionRef.current = null
          }
        }
      }
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [viewState, closeDetailsView, openDetailsView, showHidden, setShowHidden, selectedGame])

  // Block interaction when standalone shortcuts window is open
  useEffect(() => {
    if (!isStandaloneShortcutsOpen) return

    const blockInteraction = (e) => {
      e.stopPropagation()
      e.preventDefault()
      IpcManager.openShortcutsWindow()
    }

    window.addEventListener('click', blockInteraction, true)
    window.addEventListener('mousedown', blockInteraction, true)
    window.addEventListener('mouseup', blockInteraction, true)
    window.addEventListener('contextmenu', blockInteraction, true)
    window.addEventListener('dblclick', blockInteraction, true)

    return () => {
      window.removeEventListener('click', blockInteraction, true)
      window.removeEventListener('mousedown', blockInteraction, true)
      window.removeEventListener('mouseup', blockInteraction, true)
      window.removeEventListener('contextmenu', blockInteraction, true)
      window.removeEventListener('dblclick', blockInteraction, true)
    }
  }, [isStandaloneShortcutsOpen])

  // Auto-focus search input when search bar opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        const el = document.getElementById('main-search-input')
        if (el) {
          el.focus()
          el.select()
        }
      }, 50)
    } else {
      setSearchTerm('')
    }
  }, [showSearch, setSearchTerm])

  // Click-eating outside dismisser in the capture phase for game context menu
  useEffect(() => {
    if (activeMenuGameId === null) return

    const handleOutsideClick = (e) => {
      const inMenu = e.target.closest('.card-menu-container') !== null
      const inTrigger = e.target.closest('.edit-overlay-btn') !== null
      
      if (inMenu || inTrigger) {
        return
      }

      e.stopPropagation()
      e.preventDefault()
      setActiveMenuGameId(null)
    }

    document.addEventListener('click', handleOutsideClick, true)
    return () => {
      document.removeEventListener('click', handleOutsideClick, true)
    }
  }, [activeMenuGameId, setActiveMenuGameId])

  // Derived State
  const activeGames = games.filter(g => !g.hidden)
  const rawSources = [...new Set(activeGames.map(g => g.source).filter(Boolean))]
  const sources = ['all', ...rawSources]

  const deferredSearchTerm = useDeferredValue(searchTerm)

  const filterGames = (pool) => pool.filter(g =>
    g.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) &&
    (selectedSource === 'all' || g.source === selectedSource)
  )

  const sortedVisibleGames = sortGames(filterGames(activeGames), sortBy)
  const sortedHiddenGames = sortGames(
    games.filter(g => g.hidden && g.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())),
    sortBy
  )

  return (
    <div style={styles.appWrapper}>
      {/* Custom Titlebar */}
      <TitleBar
        accentHex={accentHex}
        viewState={viewState}
        closeDetailsView={closeDetailsView}
        selectedGameName={selectedGame?.name}
        detailsGradient={detailsGradient}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSource={selectedSource}
        showSidebar={showSidebar && !showHidden && viewState !== 'details'}
        setShowSidebar={setShowSidebar}
        showHidden={showHidden}
        setShowHidden={setShowHidden}
        isScanning={isScanning}
        isCoverDownloading={isCoverDownloading}
        coverDownloadProgress={coverDownloadProgress}
        handleScanGamesFolder={handleScanGamesFolder}
        openAddModal={openAddModal}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        openAboutModal={() => setShowAboutModal(true)}
        openPreferencesModal={() => setShowPreferencesModal(true)}
        openShortcutsModal={handleOpenShortcuts}
        handleRunAutoScan={handleRunAutoScan}
      />

      <div style={styles.container}>
        {/* Sidebar */}
        <Sidebar
          sources={sources}
          activeGames={activeGames}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          showSidebar={showSidebar}
          showHidden={showHidden}
          viewState={viewState}
        />

        {/* Main Content */}
        <div style={styles.main}>
          {/* Slide-out Search Bar Row */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: '48px', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  ...styles.searchBarRow,
                  backgroundColor: 'var(--bg-deep)',
                  overflow: 'hidden'
                }}
              >
                <div style={styles.searchBarInner}>
                  <Search size={15} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
                  <input
                    id="main-search-input"
                    type="text"
                    placeholder="Search"
                    className="search-input-focus"
                    style={styles.searchBarInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <div
                      onClick={() => setSearchTerm('')}
                      style={{ cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      <X size={14} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Slider Area */}
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Horizontal Slide Wrapper (Library / Hidden) */}
            <div
              style={{
                ...styles.mainSlider,
                transform: showHidden ? 'translateX(-50%)' : 'translateX(0)',
                width: '200%',
                display: 'flex',
                height: '100%',
                transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              {/* PANEL 1: Library */}
              <div style={styles.mainPanel}>
                <div className="grid-container" style={styles.gridContainer}>
                  <GameGrid
                    games={sortedVisibleGames}
                    loading={loading}
                    failedCovers={failedCovers}
                    onLaunch={handleLaunch}
                    onEdit={openEditModal}
                    onDetails={openDetailsView}
                    onToggleHide={handleToggleHideGame}
                    onDelete={handleDeleteGame}
                    onImageError={handleImageError}
                    activeMenuGameId={activeMenuGameId}
                    setActiveMenuGameId={setActiveMenuGameId}
                    coverLaunchesGame={settings.cover_launches_game}
                    isCoverDownloading={isCoverDownloading}
                    emptyIcon={CartridgeIcon}
                    emptyTitle={games.length === 0 ? 'No Games' : 'No games match your criteria'}
                    emptySub={games.length === 0 ? 'Use the + button to add games' : 'Double check your search text or switch libraries.'}
                    emptyAction={games.length === 0 && (
                      <button
                        type="button"
                        className="glass-btn glass-btn-active"
                        style={{
                          marginTop: '16px',
                          padding: '10px 24px',
                          borderRadius: '20px',
                          fontSize: '13.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          backgroundColor: `#${accentHex}`,
                          borderColor: `#${accentHex}`,
                          color: '#ffffff',
                          boxShadow: `0 0 15px rgba(${hexToRgb(accentHex)}, 0.3)`
                        }}
                        onClick={handleRunAutoScan}
                      >
                        Import
                      </button>
                    )}
                  />
                </div>
              </div>

              {/* PANEL 2: Hidden Games */}
              <div style={styles.mainPanel}>
                <div className="grid-container" style={styles.gridContainer}>
                  <GameGrid
                    games={sortedHiddenGames}
                    loading={loading}
                    failedCovers={failedCovers}
                    onLaunch={handleLaunch}
                    onEdit={openEditModal}
                    onDetails={openDetailsView}
                    onToggleHide={handleToggleHideGame}
                    onDelete={handleDeleteGame}
                    onImageError={handleImageError}
                    activeMenuGameId={activeMenuGameId}
                    setActiveMenuGameId={setActiveMenuGameId}
                    coverLaunchesGame={settings.cover_launches_game}
                    isCoverDownloading={isCoverDownloading}
                    emptyIcon={EyeOff}
                    emptyTitle="No Hidden Games"
                    emptySub="Games you hide will appear here"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS VIEW SLIDER OVERLAY */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-deep, #08070d)',
          backgroundImage: detailsGradient || 'none',
          transform: viewState === 'details' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          pointerEvents: viewState === 'details' ? 'auto' : 'none',
          zIndex: 900
        }}
        onClick={() => setDetailsDropdownOpen(false)}
      >
        {selectedGame && (
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            gap: '48px',
            alignItems: 'center',
            maxWidth: '1000px',
            width: '100%',
            padding: '40px'
          }}>
            {/* Cover */}
            <div style={{ flexShrink: 0 }}>
              <img 
                src={selectedGame?.coverUrl} 
                alt={selectedGame?.name} 
                style={{
                  width: '200px',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }} 
              />
            </div>
            
            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h1 style={{ 
                fontFamily: "'Outfit', sans-serif",
                fontSize: '28px',
                fontWeight: '700',
                color: '#f8fafc',
                margin: '0',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                lineHeight: '1.2'
              }}>{selectedGame?.name}</h1>
              
              {selectedGame?.developer && (
                <div style={{
                  fontSize: '14px',
                  color: '#cbd5e1',
                  marginTop: '6px',
                  fontWeight: '600',
                  opacity: 0.9
                }}>{selectedGame?.developer}</div>
              )}
              
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '13px',
                color: '#94a3b8',
                marginTop: '15px',
                marginBottom: '24px'
              }}>
                <span>Added: {selectedGame?.added ? new Date(selectedGame.added * 1000).toLocaleDateString() : 'Unknown'}</span>
                <span>Last played: {selectedGame?.last_played ? new Date(selectedGame.last_played * 1000).toLocaleDateString() : 'Never'}</span>
              </div>
              
              {/* Actions Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={(e) => handleLaunch(selectedGame, e)}
                  className="details-action-btn"
                  style={{
                    padding: '0 32px',
                    height: '44px',
                    borderRadius: '22px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  Play
                </button>
                
                <button
                  onClick={(e) => openEditModal(selectedGame, e)}
                  className="details-action-btn"
                  style={styles.detailsIconBtn}
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                
                <button
                  onClick={(e) => handleToggleHideGame(selectedGame, e)}
                  className="details-action-btn"
                  style={styles.detailsIconBtn}
                  title={selectedGame?.hidden ? 'Unhide' : 'Hide'}
                >
                  {selectedGame?.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                
                <button
                  onClick={(e) => handleDeleteGame(selectedGame, e)}
                  className="details-action-btn"
                  style={styles.detailsIconBtn}
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
                
                {/* Search Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDetailsDropdownOpen(!detailsDropdownOpen)
                    }}
                    className="details-action-btn"
                    style={{
                      ...styles.detailsIconBtn,
                      backgroundColor: detailsDropdownOpen ? '#3a3a3c' : 'rgba(255, 255, 255, 0.05)',
                    }}
                    title="Search"
                  >
                    <Search size={18} />
                  </button>
                  {detailsDropdownOpen && (
                    <div
                      className="gtk-popover-container"
                      style={{
                        ...styles.popover,
                        right: '-10px',
                        top: '44px',
                        width: '200px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          ...styles.popoverArrow,
                          right: '24px'
                        }}
                      />
                      <div style={styles.popoverContent}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={styles.detailsDropdownHeader}>Search on...</div>
                          <div
                            className="gtk-menu-item"
                            style={styles.popoverItem}
                            onClick={() => handleSearchOn('https://www.igdb.com/search?type=1&q=')}
                          >
                            IGDB
                          </div>
                          <div
                            className="gtk-menu-item"
                            style={styles.popoverItem}
                            onClick={() => handleSearchOn('https://www.steamgriddb.com/search/grids?term=')}
                          >
                            SteamGridDB
                          </div>
                          <div
                            className="gtk-menu-item"
                            style={styles.popoverItem}
                            onClick={() => handleSearchOn('https://www.pcgamingwiki.com/w/index.php?search=')}
                          >
                            PCGamingWiki
                          </div>
                          <div
                            className="gtk-menu-item"
                            style={styles.popoverItem}
                            onClick={() => handleSearchOn('https://howlongtobeat.com/?q=')}
                          >
                            HowLongToBeat
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Notifications */}
      <AnimatePresence>
        {activeToast && (
          <Toast
            activeToast={activeToast}
            accentHex={accentHex}
            onClose={() => setActiveToast(null)}
          />
        )}
        {showAddModal && (
          <AddGameModal
            accentHex={accentHex}
            formName={formName} setFormName={setFormName}
            formExecutable={formExecutable} setFormExecutable={setFormExecutable}
            onSubmit={handleAddGameSubmit}
            onClose={() => { setShowAddModal(false); resetForm() }}
          />
        )}
        {showEditModal && editingGame && (
          <EditGameModal
            accentHex={accentHex}
            editingGame={editingGame}
            formName={formName} setFormName={setFormName}
            formExecutable={formExecutable} setFormExecutable={setFormExecutable}
            formCoverUrl={formCoverUrl} setFormCoverUrl={setFormCoverUrl}
            onSubmit={handleEditGameSubmit} onClose={() => { setShowEditModal(false); resetForm() }}
            onToggleHide={handleToggleHideGame} onDelete={handleDeleteGame}
          />
        )}
        {showAboutModal && (
          <AboutModal
            accentHex={accentHex}
            version={packageJson.version}
            onClose={() => setShowAboutModal(false)}
          />
        )}
        {showPreferencesModal && (
          <PreferencesModal
            accentHex={accentHex}
            onClose={() => setShowPreferencesModal(false)}
            onRemoveAllGames={handleRemoveAllGames}
            onUpdateCovers={handleUpdateAllCovers}
            onUndo={handleUndo}
            initialTab={preferencesInitialTab}
            settings={settings}
            updateSettings={updateSettings}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            isDark={isDark}
          />
        )}
        {showShortcutsModal && (
          <ShortcutsModal
            onClose={() => setShowShortcutsModal(false)}
          />
        )}

        {isScanning && (
          <ScanOverlay
            isScanning={isScanning}
            scanMode={scanMode}
            scanProgress={scanProgress}
            accentHex={accentHex}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App