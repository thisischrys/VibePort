import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Search, LayoutGrid, CheckCircle2, AlertCircle,
  Plus, EyeOff, Edit3, Info, X, Check, Loader2,
  Menu, ChevronRight, ChevronLeft,
  FolderPlus, PlusSquare, MoreVertical
} from 'lucide-react'

import { styles } from './theme/styles.js'
import { DEFAULT_ACCENT, applyAccentPalette } from './theme/accent.js'
import CartridgeIcon from './components/CartridgeIcon.jsx'
import { LauncherIcon } from './components/LauncherIcon.jsx'
import AddGameModal from './components/modals/AddGameModal.jsx'
import EditGameModal from './components/modals/EditGameModal.jsx'
import AboutModal from './components/modals/AboutModal.jsx'
import packageJson from '../package.json'

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
  .sidebar-nav-item:hover .sidebar-icon-wrapper { opacity: 0.95 !important; }

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

  /* Grid and Card sizing system */
  .game-grid {
    display: grid !important;
    gap: 28px;
    grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  }

  .grid-container {
    padding: 32px;
  }

  /* Vertical resizing constraints for game cards and grids */
  @media (max-height: 800px) {
    .grid-container {
      padding: 20px !important;
    }
    .game-grid {
      grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr)) !important;
      gap: 20px !important;
    }
    .game-card-hover {
      max-width: 160px !important;
    }
    .game-info {
      margin-top: 8px !important;
    }
    .game-title {
      font-size: 13px !important;
    }
  }

  @media (max-height: 600px) {
    .grid-container {
      padding: 16px !important;
    }
    .game-grid {
      grid-template-columns: repeat(auto-fill, minmax(min(110px, 100%), 1fr)) !important;
      gap: 14px !important;
    }
    .game-card-hover {
      max-width: 120px !important;
    }
    .game-info {
      margin-top: 6px !important;
    }
    .game-title {
      font-size: 11px !important;
    }
  }

  @media (max-height: 450px) {
    .grid-container {
      padding: 10px !important;
    }
    .game-grid {
      grid-template-columns: repeat(auto-fill, minmax(min(90px, 100%), 1fr)) !important;
      gap: 10px !important;
    }
    .game-card-hover {
      max-width: 100px !important;
    }
    .game-info {
      margin-top: 4px !important;
    }
    .game-title {
      font-size: 9.5px !important;
    }
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

const GameCard = ({ game, isHidden, failedCovers, cardFontSize, onLaunch, onEdit, onToggleHide, onDelete, onImageError }) => {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <motion.div
      key={game.game_id}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="game-card-hover"
      style={{ ...styles.gameCard, ...(isHidden ? { opacity: 0.8 } : {}) }}
      onClick={(e) => onLaunch(game, e)}
    >
      {menuOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
        />
      )}

      <div className="cover-wrapper" style={{ ...styles.coverWrapper, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.04)' }}>
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
          <div 
            className="edit-overlay-btn" 
            style={{
              ...styles.editActionContainer,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              backgroundColor: 'rgba(15, 12, 28, 0.65)',
              ...(menuOpen ? { opacity: 1, transform: 'scale(1)', backgroundColor: 'rgba(255, 255, 255, 0.15)' } : {})
            }} 
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(prev => !prev)
            }}
          >
            <MoreVertical size={16} color="#ffffff" />
          </div>

          {menuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '52px',
                right: '12px',
                width: '120px',
                backgroundColor: 'rgba(15, 12, 28, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '6px',
                zIndex: 50,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '12px',
                width: '10px',
                height: '10px',
                backgroundColor: 'rgba(15, 12, 28, 0.75)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                transform: 'rotate(45deg)',
                zIndex: 49
              }} />

              <div 
                className="gtk-menu-item"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: 51
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onEdit(game, e)
                }}
              >
                Edit
              </div>

              <div 
                className="gtk-menu-item"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: 51
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onToggleHide(game, e)
                }}
              >
                {isHidden ? 'Unhide' : 'Hide'}
              </div>

              <div 
                className="gtk-menu-item"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: 51
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete(game, e)
                }}
              >
                Remove
              </div>
            </div>
          )}
        </div>

        {/* Integrated Title Bar at the Bottom of the Card Wrapper */}
        <div style={{
          padding: '12px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderTop: '1px solid rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div className="game-title" style={{ 
            ...styles.gameTitle, 
            fontSize: '13px',
            margin: 0,
            color: '#cbd5e1',
            fontWeight: '500',
            letterSpacing: '-0.1px'
          }}>
            {game.name}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


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
  const [accentHex, setAccentHex] = useState(() => {
    let initialColor = DEFAULT_ACCENT
    if (window.api?.getAccentColorSync) {
      try {
        const syncColor = window.api.getAccentColorSync()
        if (syncColor) initialColor = syncColor
      } catch (e) {
        console.error('Failed to get synchronous accent color:', e)
      }
    }
    const clean = initialColor.replace('#', '')
    applyAccentPalette(clean)
    return clean
  })
  const [activeToast, setActiveToast] = useState(null)



  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)


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
        const anyOpen = showAddModal || showEditModal || showAboutModal
        if (anyOpen) {
          setShowAddModal(false)
          setShowEditModal(false)
          setShowAboutModal(false)
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
  }, [showHidden, showAddModal, showEditModal, showAboutModal, showSearch, setSearchTerm])

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

  const commonCardProps = { 
    failedCovers, 
    cardFontSize, 
    onLaunch: handleLaunch, 
    onEdit: openEditModal, 
    onToggleHide: handleToggleHideGame,
    onDelete: handleDeleteGame,
    onImageError: (id) => setFailedCovers(p => ({ ...p, [id]: true })) 
  }

  // ── Sidebar Source Nav Items ───────────────────────────────────────────────
  const renderSidebarItem = (src, label) => {
    const isActive = selectedSource === src
    const count = src === 'all' ? activeGames.length : activeGames.filter(g => g.source === src).length
    return (
      <div key={src} className={isActive ? '' : 'sidebar-nav-item'}
        style={{ 
          ...styles.sidebarItem, 
          ...(isActive ? styles.activeSidebarItem : {}),
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onClick={() => setSelectedSource(src)}>
        <div style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.45, transition: 'opacity 0.2s ease' }} className="sidebar-icon-wrapper">
          <LauncherIcon source={src} size={16} />
        </div>
        <span style={{ fontWeight: isActive ? '700' : '500', flexGrow: 1 }}>{label}</span>
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
        showSidebar={showSidebar && !showHidden}
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
        openAboutModal={() => setShowAboutModal(true)}
      />

      <div style={styles.container}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={{ ...styles.sidebar, width: (showSidebar && !showHidden) ? '260px' : '0px', padding: (showSidebar && !showHidden) ? '16px 0 24px 0' : '0', borderRight: (showSidebar && !showHidden) ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: (showSidebar && !showHidden) ? 1 : 0, overflow: 'hidden', transition: showHidden ? 'none' : 'all 0.25s cubic-bezier(0.25,0.8,0.25,1)' }}>
          <div style={styles.sidebarNav}>
            {['all', 'imported'].filter(s => sources.includes(s)).map(s =>
              renderSidebarItem(s, getSourceLabel(s))
            )}
          </div>

          <div style={{ ...styles.sectionHeader, marginTop: '20px' }}>Libraries</div>
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
              <div className="grid-container" style={styles.gridContainer}>


                {loading ? (
                  <div style={styles.loadingContainer}><div style={styles.spinnerLarge} /><div style={styles.loadingText}>Syncing game libraries...</div></div>
                ) : sortedVisibleGames.length === 0 ? (
                  <div style={styles.emptyState}>
                    <CartridgeIcon size={48} color="#334155" style={{ marginBottom: '12px' }} />
                    <div style={styles.emptyStateTitle}>No games match your criteria</div>
                    <div style={styles.emptyStateSub}>Double check your search text or switch libraries.</div>
                  </div>
                ) : (
                  <div className="game-grid" style={styles.grid}>
                    {sortedVisibleGames.map(game => (
                      <GameCard key={game.game_id} game={game} isHidden={false} {...commonCardProps} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── PANEL 2: Hidden Games ─────────────────────────────────── */}
            <div style={styles.mainPanel}>
              <div className="grid-container" style={styles.gridContainer}>


                {loading ? (
                  <div style={styles.loadingContainer}><div style={styles.spinnerLarge} /><div style={styles.loadingText}>Syncing game libraries...</div></div>
                ) : sortedHiddenGames.length === 0 ? (
                  <div style={styles.emptyState}>
                    <EyeOff size={48} color="#334155" style={{ marginBottom: '12px' }} />
                    <div style={styles.emptyStateTitle}>No Hidden Games</div>
                    <div style={styles.emptyStateSub}>Games you hide will appear here</div>
                  </div>
                ) : (
                  <div className="game-grid" style={styles.grid}>
                    {sortedHiddenGames.map(game => (
                      <GameCard key={game.game_id} game={game} isHidden={true} {...commonCardProps} />
                    ))}
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
          {showAboutModal && (
            <AboutModal
              accentHex={accentHex}
              version={packageJson.version}
              onClose={() => setShowAboutModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App