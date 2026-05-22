import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Search, LayoutGrid, CheckCircle2, AlertCircle,
  Plus, EyeOff, Edit3, Info, X, Check, Loader2,
  Menu, ChevronRight, ChevronLeft, Sidebar,
  FolderPlus, PlusSquare
} from 'lucide-react'

import { styles } from './theme/styles.js'
import { DEFAULT_ACCENT, applyAccentPalette } from './theme/accent.js'
import CartridgeIcon from './components/CartridgeIcon.jsx'
import AddGameModal from './components/modals/AddGameModal.jsx'
import EditGameModal from './components/modals/EditGameModal.jsx'


import { TitleBar } from './components/TitleBar.jsx'

// ─── Global CSS Injection ─────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * {
    user-select: none;
    -webkit-user-select: none;
  }
  input, textarea, [contenteditable="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
  }

  .game-card-hover:hover .play-overlay { opacity: 1 !important; }
  .game-card-hover:hover .play-button-circle { transform: scale(1) !important; }
  .game-card-hover:hover .cover-image { transform: scale(1.04) !important; }
  .game-card-hover:hover .game-title { color: var(--accent) !important; }
  .game-card-hover:hover .cover-wrapper {
    box-shadow: 0 0 30px var(--accent-glow-strong) !important;
    border-color: var(--accent-border-strong) !important;
  }
  .game-card-hover:hover .edit-overlay-btn { opacity: 1 !important; transform: scale(1) !important; }

  .game-card-hover {
    transition: transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1);
    will-change: transform;
    contain: layout style;
  }
  .game-card-hover:hover { transform: translateY(-6px); }
  .cover-wrapper { will-change: box-shadow, border-color; }

  @keyframes spin { to { transform: rotate(360deg); } }

  .header-action:hover {
    background-color: rgba(255,255,255,0.06) !important;
    border-color: var(--accent-border) !important;
    box-shadow: 0 0 15px var(--accent-glow-faint) !important;
  }
  .header-action:hover svg { color: var(--accent) !important; }

  .search-input-focus:focus {
    border-color: var(--accent-border-strong) !important;
    background-color: rgba(255,255,255,0.05) !important;
    box-shadow: 0 0 20px var(--accent-glow-faint) !important;
  }

  .gtk-menu-item:hover { background-color: rgba(255,255,255,0.05) !important; color: #f8fafc !important; }
  .sidebar-nav-item:hover { background-color: rgba(255,255,255,0.02) !important; color: #f1f5f9 !important; }
  .sidebar-nav-item:hover svg { color: var(--accent) !important; }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 99px; border: 2px solid transparent; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-glow-mid); }

  .glass-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; transition: all 0.2s ease; }
  .glass-btn:hover { background: var(--accent-bg-faint); border-color: var(--accent-border); color: #f8fafc; }
  .glass-btn-active { background: var(--accent-bg-mid) !important; border-color: var(--accent-border-strong) !important; color: var(--accent) !important; box-shadow: 0 0 15px var(--accent-glow-faint); }

  .form-input { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.04); color: #f8fafc; border-radius: 8px; padding: 10px 12px; outline: none; transition: all 0.2s ease; }
  .form-input:focus { border-color: var(--accent-border-strong); box-shadow: 0 0 15px var(--accent-glow-faint); }

  .window-control-btn {
    background-color: transparent !important;
    border: none !important;
    cursor: pointer !important;
    color: #94a3b8 !important;
    transition: all 0.15s ease !important;
    outline: none !important;
  }
  .window-control-btn:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
    color: #f8fafc !important;
  }
  .window-control-btn.close:hover {
    background-color: rgba(239, 68, 68, 0.85) !important;
    color: #ffffff !important;
  }
`

// ─── Source Label Mapping ─────────────────────────────────────────────────────
const getSourceLabel = (src) => {
  const map = {
    all: 'All Games',
    imported: 'Added',
    manual: 'Custom',
    steam: 'Steam',
    gog: 'GOG',
    epic: 'Epic Games',
    ea: 'EA App',
    ubisoft: 'Ubisoft Connect',
    battlenet: 'Battle.net'
  }
  return map[src] || src.charAt(0).toUpperCase() + src.slice(1)
}

// ─── Card Sizing ──────────────────────────────────────────────────────────────
const getGridColumns = () => 'repeat(auto-fill, minmax(180px, 1fr))'
const getCardFontSize = () => '15.5px'

// ─── Sorting ──────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'A-Z', value: 'alphabetical' },
  { label: 'Z-A', value: 'z_to_a' },
  { label: 'Newest', value: 'added' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Last Played', value: 'last_played' }
]

function sortGames(games, sortBy) {
  return [...games].sort((a, b) => {
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name)
    if (sortBy === 'z_to_a') return b.name.localeCompare(a.name)
    if (sortBy === 'added') {
      const diff = (b.added || 0) - (a.added || 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    }
    if (sortBy === 'oldest') {
      const diff = (a.added || 0) - (b.added || 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    }
    if (sortBy === 'last_played') {
      const diff = (b.last_played || 0) - (a.last_played || 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    }
    return 0
  })
}

// ─── GameCard ─────────────────────────────────────────────────────────────────

const GameCard = ({ game, isHidden, failedCovers, cardFontSize, onLaunch, onEdit, onImageError }) => (
  <motion.div
    key={game.game_id}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="game-card-hover"
    style={{ ...styles.gameCard, ...(isHidden ? { opacity: 0.8 } : {}) }}
    onClick={(e) => onLaunch(game, e)}
  >
    <div className="cover-wrapper" style={styles.coverWrapper}>
      {isHidden && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 10,
          backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
          padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        }}>
          <EyeOff size={11} color="#cbd5e1" />
          <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '600' }}>Hidden</span>
        </div>
      )}
      <div style={styles.coverContainer}>
        {game.coverUrl && !failedCovers[game.game_id] ? (
          <img src={game.coverUrl} alt={game.name} className="cover-image" style={styles.cover}
            onError={() => onImageError(game.game_id)} />
        ) : (
          <div style={styles.coverPlaceholder}>
            <div style={styles.placeholderGlow} />
            <span style={styles.placeholderText}>{game.name[0]}</span>
          </div>
        )}
        <div className="play-overlay" style={styles.playOverlay}>
          <div className="play-button-circle" style={styles.playButtonCircle}>
            <Play size={22} fill="#0d0b14" color="#0d0b14" style={{ marginLeft: '3px' }} />
          </div>
        </div>
        <div className="edit-overlay-btn" style={styles.editActionContainer} onClick={(e) => onEdit(game, e)}>
          <Edit3 size={14} color="#ffffff" />
        </div>
      </div>
    </div>
    <div style={styles.gameInfo}>
      <div className="game-title" style={{ ...styles.gameTitle, fontSize: cardFontSize }}>{game.name}</div>
    </div>
  </motion.div>
)


// ─── Main App Component ───────────────────────────────────────────────────────
const App = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedSource, setSelectedSource] = useState('all')
  const [launchingGame, setLaunchingGame] = useState(null)
  const [launchStatus, setLaunchStatus] = useState(null) // 'success' | 'error' | null
  const [failedCovers, setFailedCovers] = useState({})
  const [accentHex, setAccentHex] = useState(DEFAULT_ACCENT)
  const [activeToast, setActiveToast] = useState(null)



  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)


  const [isScanning, setIsScanning] = useState(false)

  const [editingGame, setEditingGame] = useState(null)
  const [formName, setFormName] = useState('')
  const [formExecutable, setFormExecutable] = useState('')
  const [formDeveloper, setFormDeveloper] = useState('')
  const [formCoverUrl, setFormCoverUrl] = useState('')

  const [sgdbSearchQuery, setSgdbSearchQuery] = useState('')
  const [sgdbGames, setSgdbGames] = useState([])
  const [sgdbSearching, setSgdbSearching] = useState(false)
  const [selectedSgdbGame, setSelectedSgdbGame] = useState(null)
  const [sgdbCovers, setSgdbCovers] = useState([])
  const [sgdbCoversLoading, setSgdbCoversLoading] = useState(false)
  const [downloadingCoverId, setDownloadingCoverId] = useState(null)

  const [sortBy, setSortBy] = useState(() => localStorage.getItem('vibeport_sort_by') || 'alphabetical')
  const [showHidden, setShowHidden] = useState(() => localStorage.getItem('vibeport_show_hidden') === 'true')
  const [showSidebar, setShowSidebar] = useState(() => localStorage.getItem('vibeport_show_sidebar') !== 'false')

  // ── Persistence ────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('vibeport_sort_by', sortBy) }, [sortBy])
  useEffect(() => { localStorage.setItem('vibeport_show_hidden', showHidden) }, [showHidden])
  useEffect(() => { localStorage.setItem('vibeport_show_sidebar', showSidebar) }, [showSidebar])

  // ── Toast ──────────────────────────────────────────────────────────────────
  const triggerToast = (message, type = 'info') => setActiveToast({ message, type })

  useEffect(() => {
    if (!activeToast) return
    const t = setTimeout(() => setActiveToast(null), 5000)
    return () => clearTimeout(t)
  }, [activeToast])

  // ── Accent Color ───────────────────────────────────────────────────────────
  useEffect(() => {
    const applyColor = (hex) => {
      const useWindows = true
      const clean = (useWindows ? (hex || DEFAULT_ACCENT) : DEFAULT_ACCENT).replace('#', '')
      setAccentHex(clean)
      applyAccentPalette(clean)
    }

    if (window.api?.getAccentColor) {
      window.api.getAccentColor().then(applyColor).catch(() => applyColor(DEFAULT_ACCENT))
    } else {
      applyColor(DEFAULT_ACCENT)
    }

    let unsub
    if (window.api?.onAccentColorChanged) unsub = window.api.onAccentColorChanged(applyColor)
    return () => { if (unsub) unsub() }
  }, [])

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
        if (e.key === 'Escape') document.activeElement.blur()
        return
      }
      const mod = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'h') { e.preventDefault(); setShowHidden(p => !p) }
      if (e.key === 'Escape') {
        const anyOpen = showAddModal || showEditModal
        if (anyOpen) {
          setShowAddModal(false)
          setShowEditModal(false)
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
  }, [showHidden, showAddModal, showEditModal, showSearch, setSearchTerm])

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
  }, [showSearch])


  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchGames = async () => {
    try {
      const data = await window.api.getGames()
      setGames(data.map(g => g.source === 'manual' ? { ...g, source: 'imported' } : g))
    } catch (e) {
      console.error('Failed to fetch games:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
    const subs = []
    if (window.api.onGamesUpdated) subs.push(window.api.onGamesUpdated(fetchGames))
    if (window.api.onShowToast) subs.push(window.api.onShowToast((d) => { if (d?.message) triggerToast(d.message, d.type) }))
    return () => subs.forEach(fn => fn())
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLaunch = async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    if (launchingGame) return
    setLaunchingGame(game.name); setLaunchStatus(null)
    try {
      await window.api.launchGame(game.executable)
      setLaunchStatus('success')
      try { await window.api.updateGameStatus(game.game_id, { last_played: Math.floor(Date.now() / 1000) }) } catch { /* non-fatal */ }
      setTimeout(() => { setLaunchingGame(null); setLaunchStatus(null) }, 4000)
    } catch (err) {
      console.error('Failed to launch game:', err)
      setLaunchStatus('error')
      setTimeout(() => { setLaunchingGame(null); setLaunchStatus(null) }, 5000)
    }
  }



  const handleToggleHideGame = async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    try {
      await window.api.updateGameStatus(game.game_id, { hidden: !game.hidden })
      await fetchGames()
    } catch (e) { console.error('Failed to toggle hide:', e) }
  }

  const handleDeleteGame = async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    if (!confirm(`Are you sure you want to remove "${game.name}" from VibePort?`)) return
    try {
      await window.api.deleteGame(game.game_id)
      await fetchGames()
    } catch (e) { console.error('Failed to delete game:', e) }
  }

  const resetForm = () => {
    setFormName(''); setFormExecutable(''); setFormDeveloper(''); setFormCoverUrl('')
    setSgdbSearchQuery(''); setSgdbGames([]); setSelectedSgdbGame(null); setSgdbCovers([])
  }

  const openAddModal = () => { resetForm(); setShowAddModal(true) }

  const openEditModal = (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    setEditingGame(game)
    setFormName(game.name); setFormExecutable(game.executable)
    setFormDeveloper(game.developer || ''); setFormCoverUrl(game.coverUrl || '')
    resetForm()
    setFormName(game.name); setFormExecutable(game.executable); setFormDeveloper(game.developer || '')
    setShowEditModal(true)
  }

  const handleAddGameSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) return alert('Title and Executable Path are required!')
    try {
      const result = await window.api.saveGame({ name: formName, executable: formExecutable, developer: formDeveloper || null, source: 'imported', hidden: false })
      if (result.success) {
        if (formCoverUrl) await window.api.downloadCoverUrl(result.game.game_id, formCoverUrl)
        await fetchGames(); setShowAddModal(false); resetForm()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (e) { console.error('Failed to add game:', e) }
  }

  const handleEditGameSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) return alert('Title and Executable are required!')
    try {
      const result = await window.api.saveGame({ game_id: editingGame.game_id, name: formName, executable: formExecutable, developer: formDeveloper || null, source: editingGame.source || 'imported' })
      if (result.success) {
        if (formCoverUrl && formCoverUrl !== editingGame.coverUrl) await window.api.downloadCoverUrl(editingGame.game_id, formCoverUrl)
        await fetchGames(); setShowEditModal(false); resetForm()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (e) { console.error('Failed to update game:', e) }
  }

  const handleScanGamesFolder = async () => {
    try {
      const folderPath = await window.api.selectFolder()
      if (!folderPath) return
      setIsScanning(true)
      triggerToast('Scanning selected folder for games...', 'info')
      const result = await window.api.scanFolder(folderPath)
      setIsScanning(false)
      if (result.success) {
        triggerToast(result.count > 0 ? `Successfully scanned! Added ${result.count} new games.` : 'Scan complete. No new games found.', result.count > 0 ? 'success' : 'info')
        await fetchGames()
      } else {
        triggerToast(`Scan failed: ${result.error}`, 'error')
      }
    } catch (e) {
      console.error('Scan error:', e); setIsScanning(false)
      triggerToast('An error occurred during directory scanning.', 'error')
    }
  }

  const handleSgdbSearch = async () => {
    if (!sgdbSearchQuery) return
    setSgdbSearching(true); setSelectedSgdbGame(null); setSgdbCovers([])
    try { setSgdbGames(await window.api.searchSteamGridDB(sgdbSearchQuery)) } catch (e) { alert('Search failed: ' + e.message) } finally { setSgdbSearching(false) }
  }

  const handleSgdbSelectGame = async (game) => {
    setSelectedSgdbGame(game); setSgdbCoversLoading(true)
    try { setSgdbCovers(await window.api.fetchSteamGridDBCovers(game.id)) } catch (e) { alert('Failed to retrieve covers: ' + e.message) } finally { setSgdbCoversLoading(false) }
  }

  const handleSgdbDownloadCover = async (coverUrl, coverId) => {
    if (editingGame) {
      setDownloadingCoverId(coverId)
      try {
        const result = await window.api.downloadCoverUrl(editingGame.game_id, coverUrl)
        if (result.success) { setFormCoverUrl(result.coverUrl); setFailedCovers(p => ({ ...p, [editingGame.game_id]: false })) }
        else alert('Failed to apply cover: ' + result.error)
      } catch (e) { console.error('Cover download error:', e) } finally { setDownloadingCoverId(null) }
    } else {
      setFormCoverUrl(coverUrl)
      alert('Cover selected! It will be downloaded when you save the game.')
    }
  }

  // ── Derived State ──────────────────────────────────────────────────────────
  const activeGames = games.filter(g => !g.hidden)
  const rawSources = [...new Set(activeGames.map(g => g.source).filter(Boolean))]
  const sources = ['all', ...rawSources]

  const filterGames = (pool) => pool.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedSource === 'all' || g.source === selectedSource)
  )
  const sortedVisibleGames = sortGames(filterGames(activeGames), sortBy)
  const sortedHiddenGames = sortGames(filterGames(games.filter(g => g.hidden)), sortBy)

  const cardFontSize = getCardFontSize()
  const gridCols = getGridColumns()

  const commonCardProps = { failedCovers, cardFontSize, onLaunch: handleLaunch, onEdit: openEditModal, onImageError: (id) => setFailedCovers(p => ({ ...p, [id]: true })) }

  // ── Sidebar Source Nav Items ───────────────────────────────────────────────
  const renderSidebarItem = (src, label, icon) => {
    const isActive = selectedSource === src
    const count = src === 'all' ? activeGames.length : activeGames.filter(g => g.source === src).length
    return (
      <div key={src} className={isActive ? '' : 'sidebar-nav-item'}
        style={{ ...styles.sidebarItem, ...(isActive ? styles.activeSidebarItem : {}) }}
        onClick={() => setSelectedSource(src)}>
        {icon || <LayoutGrid size={16} color={isActive ? `#${accentHex}` : '#64748b'} />}
        <span style={{ fontWeight: isActive ? '700' : '500' }}>{label}</span>
        <span style={{ ...styles.itemCount, ...(isActive ? styles.activeItemCount : {}) }}>{count}</span>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.appWrapper}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* ── Custom Titlebar ── */}
      <TitleBar
        accentHex={accentHex}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSource={selectedSource}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        showHidden={showHidden}
        setShowHidden={setShowHidden}
        isScanning={isScanning}
        handleScanGamesFolder={handleScanGamesFolder}
        openAddModal={openAddModal}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />

      <div style={styles.container}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={{ ...styles.sidebar, width: showSidebar ? '260px' : '0px', padding: showSidebar ? '16px 0 24px 0' : '0', borderRight: showSidebar ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: showSidebar ? 1 : 0, overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.25,0.8,0.25,1)' }}>
          <div style={styles.sidebarNav}>
            {['all', 'imported'].filter(s => sources.includes(s)).map(s =>
              renderSidebarItem(s, getSourceLabel(s), s === 'imported'
                ? <Plus size={18} color={selectedSource === s ? `#${accentHex}` : '#64748b'} strokeWidth={2.5} />
                : null)
            )}
          </div>

          <div style={{ ...styles.sectionHeader, marginTop: '20px' }}>IMPORTED</div>
          <div style={styles.sidebarNav}>
            {rawSources
              .filter(s => s !== 'imported')
              .sort((a, b) => {
                const countA = activeGames.filter(g => g.source === a).length
                const countB = activeGames.filter(g => g.source === b).length
                return countB - countA
              })
              .map(s => renderSidebarItem(s, getSourceLabel(s)))}
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <div style={styles.main}>
          {/* Launch Toast */}
          <AnimatePresence>
            {launchingGame && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
                style={{ ...styles.toast, ...(launchStatus === 'error' ? styles.toastError : launchStatus === 'success' ? styles.toastSuccess : {}) }}
              >
                {launchStatus === 'success' ? <CheckCircle2 size={18} color="#4ade80" />
                  : launchStatus === 'error' ? <AlertCircle size={18} color="#f87171" />
                  : <div style={styles.spinner} />}
                <span style={styles.toastText}>
                  {launchStatus === 'success' ? `Started ${launchingGame} successfully!`
                    : launchStatus === 'error' ? `Failed to launch ${launchingGame}`
                    : `Launching ${launchingGame}...`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General Toast */}
          <AnimatePresence>
            {activeToast && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
                style={{ ...styles.toast, top: launchingGame ? '80px' : '20px', ...(activeToast.type === 'error' ? styles.toastError : activeToast.type === 'success' ? styles.toastSuccess : {}) }}
              >
                {activeToast.type === 'success' ? <CheckCircle2 size={18} color="#4ade80" />
                  : activeToast.type === 'error' ? <AlertCircle size={18} color="#f87171" />
                  : <Info size={18} color={`#${accentHex}`} />}
                <span style={styles.toastText}>{activeToast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

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
                    placeholder={showHidden ? "Search hidden games..." : `Search ${getSourceLabel(selectedSource).toLowerCase()}...`}
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

          {/* Horizontal Slide Wrapper (Library / Hidden) */}
          <div style={{ ...styles.mainSlider, transform: showHidden ? 'translateX(-50%)' : 'translateX(0)' }}>

            {/* ── PANEL 1: Library ──────────────────────────────────────── */}
            <div style={styles.mainPanel}>
              <div style={styles.gridContainer}>


                {loading ? (
                  <div style={styles.loadingContainer}><div style={styles.spinnerLarge} /><div style={styles.loadingText}>Syncing game libraries...</div></div>
                ) : sortedVisibleGames.length === 0 ? (
                  <div style={styles.emptyState}>
                    <CartridgeIcon size={48} color="#334155" style={{ marginBottom: '12px' }} />
                    <div style={styles.emptyStateTitle}>No games match your criteria</div>
                    <div style={styles.emptyStateSub}>Double check your search text or switch libraries.</div>
                  </div>
                ) : (
                  <div style={{ ...styles.grid, gridTemplateColumns: gridCols }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {sortedVisibleGames.map(game => <GameCard key={game.game_id} game={game} isHidden={false} {...commonCardProps} />)}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* ── PANEL 2: Hidden Games ─────────────────────────────────── */}
            <div style={styles.mainPanel}>
              <div style={styles.gridContainer}>


                {loading ? (
                  <div style={styles.loadingContainer}><div style={styles.spinnerLarge} /><div style={styles.loadingText}>Syncing game libraries...</div></div>
                ) : sortedHiddenGames.length === 0 ? (
                  <div style={styles.emptyState}>
                    <EyeOff size={48} color="#334155" style={{ marginBottom: '12px' }} />
                    <div style={styles.emptyStateTitle}>No Hidden Games</div>
                    <div style={styles.emptyStateSub}>Games you hide will appear here</div>
                  </div>
                ) : (
                  <div style={{ ...styles.grid, gridTemplateColumns: gridCols }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {sortedHiddenGames.map(game => <GameCard key={game.game_id} game={game} isHidden={true} {...commonCardProps} />)}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
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
              onSubmit={handleEditGameSubmit} onClose={() => { setShowEditModal(false); resetForm() }}
              onToggleHide={handleToggleHideGame} onDelete={handleDeleteGame}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App