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
import { PreferencesModal } from './components/modals/PreferencesModal.jsx'
import { ShortcutsModal } from './components/modals/ShortcutsModal.jsx'
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


  .game-card-hover:hover .game-title { color: var(--accent) !important; }
  .game-card-hover:hover .cover-wrapper {
    box-shadow: 0 0 30px var(--accent-glow-strong) !important;
    border-color: var(--accent-border-strong) !important;
  }
  .game-card-hover:hover .edit-overlay-btn { opacity: 1 !important; transform: scale(1) !important; }

  .game-card-hover {
    contain: layout style;
  }
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

  .gtk-window-btn:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
  }
  .gtk-window-btn.close:hover {
    background-color: #ef4444 !important;
  }
  .gtk-modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
  }
  .gtk-tab-hover:hover {
    background-color: rgba(255, 255, 255, 0.04) !important;
  }
  .gtk-danger-btn:hover {
    background-color: rgba(239, 68, 68, 0.1) !important;
  }

  /* Grid and Card sizing system - always 200px wide, cover is 300px tall */
  .game-grid {
    display: grid !important;
    gap: 32px !important;
    grid-template-columns: repeat(auto-fill, 200px) !important;
    justify-content: center !important;
  }

  .grid-container {
    padding: 40px !important;
    padding-bottom: 80px !important;
  }

  .game-card-hover {
    width: 200px !important;
  }

  .game-title {
    font-size: 15.5px !important;
  }

  /* Height-based responsive tiers for padding and font-size only, keeping card dimensions constant */
  @media (max-height: 1050px) {
    .grid-container {
      padding: 32px !important;
      padding-bottom: 64px !important;
    }
    .game-grid {
      gap: 28px !important;
    }
    .game-title {
      font-size: 13.5px !important;
    }
  }

  @media (max-height: 800px) {
    .grid-container {
      padding: 24px !important;
      padding-bottom: 48px !important;
    }
    .game-grid {
      gap: 20px !important;
    }
    .game-title {
      font-size: 12.5px !important;
    }
  }

  @media (max-height: 600px) {
    .grid-container {
      padding: 16px !important;
      padding-bottom: 32px !important;
    }
    .game-grid {
      gap: 14px !important;
    }
    .game-title {
      font-size: 11px !important;
    }
  }

  @media (max-height: 450px) {
    .grid-container {
      padding: 10px !important;
      padding-bottom: 24px !important;
    }
    .game-grid {
      gap: 10px !important;
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

const GameCard = ({ game, isHidden, failedCovers, cardFontSize, onLaunch, onEdit, onToggleHide, onDelete, onImageError, activeMenuGameId, setActiveMenuGameId }) => {
  const isOpen = activeMenuGameId === game.game_id

  return (
    <motion.div
      key={game.game_id}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="game-card-hover"
      style={{
        ...styles.gameCard,
        position: 'relative',
        zIndex: isOpen ? 1600 : 1,
        ...(isHidden ? { opacity: 0.8 } : {})
      }}
      onClick={(e) => onLaunch(game, e)}
    >
      <div className="cover-wrapper" style={{ ...styles.coverWrapper, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.04)' }}>

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

          <div 
            id={`trigger-${game.game_id}`}
            className="edit-overlay-btn" 
            style={{
              ...styles.editActionContainer,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              backgroundColor: 'rgba(15, 12, 28, 0.65)',
              ...(isOpen ? { opacity: 1, transform: 'scale(1)', backgroundColor: 'rgba(255, 255, 255, 0.15)' } : {})
            }} 
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenuGameId(isOpen ? null : game.game_id)
            }}
          >
            <MoreVertical size={16} color="#ffffff" />
          </div>

        </div>

        {/* Integrated Title Bar at the Bottom of the Card Wrapper */}
        <div style={{
          padding: '8px 12px 9px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderTop: '1px solid rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <div className="game-title" style={{ 
            ...styles.gameTitle, 
            margin: 0,
            color: '#cbd5e1',
            fontWeight: '500',
            letterSpacing: '-0.1px',
            lineHeight: '1.5',
            paddingBottom: '4px'
          }}>
            {game.name}
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          id={`menu-${game.game_id}`}
          className="card-menu-container"
          style={{
            position: 'absolute',
            top: '52px',
            right: '-31px',
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
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '10px',
            height: '10px',
            backgroundColor: 'rgba(15, 12, 28, 0.75)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
              onEdit(game, e)
              setActiveMenuGameId(null)
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
              onToggleHide(game, e)
              setActiveMenuGameId(null)
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
    const useWindows = localStorage.getItem('vibeport_use_windows_accent') !== 'false'
    if (useWindows && window.api?.getAccentColorSync) {
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



  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [isStandaloneShortcutsOpen, setIsStandaloneShortcutsOpen] = useState(false)
  const lastDeletedGameRef = React.useRef(null)
  const lastDeletedGamesListRef = React.useRef(null)
  const lastImportedGamesListRef = React.useRef(null)


  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 100, message: '' })

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
  const [activeMenuGameId, setActiveMenuGameId] = useState(null)

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
      const useWindows = localStorage.getItem('vibeport_use_windows_accent') !== 'false'
      const clean = (useWindows ? (hex || DEFAULT_ACCENT) : DEFAULT_ACCENT).replace('#', '')
      setAccentHex(clean)
      applyAccentPalette(clean)
    }

    let unsub
    if (window.api?.onAccentColorChanged) unsub = window.api.onAccentColorChanged(applyColor)
    return () => { if (unsub) unsub() }
  }, [])

  useEffect(() => {
    let unsub
    if (window.api?.onShortcutsWindowStatus) {
      unsub = window.api.onShortcutsWindowStatus((isOpen) => {
        setIsStandaloneShortcutsOpen(isOpen)
      })
    }
    return () => { if (unsub) unsub() }
  }, [])

  useEffect(() => {
    if (!isStandaloneShortcutsOpen) return

    const blockInteraction = (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (window.api?.openShortcutsWindow) {
        window.api.openShortcutsWindow()
      }
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

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
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
        window.api?.closeWindow()
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
        if (lastImportedGamesListRef.current) {
          const gamesToRestore = lastImportedGamesListRef.current
          triggerToast('Undoing library import...', 'info')
          
          window.api.removeAllGames().then(res => {
            if (!res) {
              triggerToast('Failed to clear imported library.', 'error')
              return
            }
            
            if (gamesToRestore.length === 0) {
              triggerToast('Library import undone successfully!', 'success')
              fetchGames()
              lastImportedGamesListRef.current = null
              return
            }
            
            const promises = gamesToRestore.map(game => {
              const { coverUrl, ...cleanGame } = game
              return window.api.saveGame(cleanGame)
            })
            
            Promise.all(promises).then(results => {
              triggerToast('Library import undone successfully!', 'success')
              fetchGames()
              lastImportedGamesListRef.current = null
            }).catch(err => {
              console.error(err)
              triggerToast('Failed to restore games after undo', 'error')
            })
          }).catch(err => {
            console.error(err)
            triggerToast('Failed to undo import', 'error')
          })
        } else if (lastDeletedGamesListRef.current && lastDeletedGamesListRef.current.length > 0) {
          const gamesToRestore = lastDeletedGamesListRef.current
          triggerToast(`Restoring ${gamesToRestore.length} games...`, 'info')
          
          const promises = gamesToRestore.map(game => {
            const { coverUrl, ...cleanGame } = game
            return window.api.saveGame(cleanGame)
          })
          
          Promise.all(promises).then(results => {
            const successCount = results.filter(r => r.success).length
            triggerToast(`Successfully restored ${successCount} games!`, 'success')
            fetchGames()
            lastDeletedGamesListRef.current = null
          }).catch(err => {
            console.error(err)
            triggerToast('Failed to restore games', 'error')
          })
        } else if (lastDeletedGameRef.current) {
          const game = lastDeletedGameRef.current
          const { coverUrl, ...cleanGame } = game
          window.api.saveGame(cleanGame).then(res => {
            if (res.success) {
              triggerToast(`Restored game "${game.name}"`, 'success')
              fetchGames()
              lastDeletedGameRef.current = null
            } else {
              triggerToast('Failed to restore game', 'error')
            }
          }).catch(console.error)
        } else {
          triggerToast('Nothing to undo!', 'info')
        }
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
  }, [showHidden, showAddModal, showEditModal, showAboutModal, showPreferencesModal, showShortcutsModal, showSearch, setSearchTerm])

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
    
    // Sync settings.json from backend to localStorage
    if (window.api?.getSettings) {
      window.api.getSettings().then(settings => {
        if (settings) {
          if (settings.use_windows_accent !== undefined) localStorage.setItem('vibeport_use_windows_accent', settings.use_windows_accent ? 'true' : 'false')
          if (settings.exit_after_launch !== undefined) localStorage.setItem('vibeport_exit_after_launch', settings.exit_after_launch ? 'true' : 'false')
          if (settings.auto_import !== undefined) localStorage.setItem('vibeport_auto_import', settings.auto_import ? 'true' : 'false')
          if (settings.remove_uninstalled !== undefined) localStorage.setItem('vibeport_remove_uninstalled', settings.remove_uninstalled ? 'true' : 'false')
          if (settings.scan_steam !== undefined) localStorage.setItem('vibeport_scan_steam', settings.scan_steam ? 'true' : 'false')
          if (settings.scan_gog !== undefined) localStorage.setItem('vibeport_scan_gog', settings.scan_gog ? 'true' : 'false')
          if (settings.scan_epic !== undefined) localStorage.setItem('vibeport_scan_epic', settings.scan_epic ? 'true' : 'false')
          if (settings.scan_ea !== undefined) localStorage.setItem('vibeport_scan_ea', settings.scan_ea ? 'true' : 'false')
          if (settings.scan_ubisoft !== undefined) localStorage.setItem('vibeport_scan_ubisoft', settings.scan_ubisoft ? 'true' : 'false')
          if (settings.scan_bnet !== undefined) localStorage.setItem('vibeport_scan_bnet', settings.scan_bnet ? 'true' : 'false')
        }
      }).catch(console.error)
    }

    const subs = []
    if (window.api.onGamesUpdated) subs.push(window.api.onGamesUpdated(fetchGames))
    if (window.api.onShowToast) subs.push(window.api.onShowToast((d) => { if (d?.message) triggerToast(d.message, d.type) }))
    if (window.api.onScanProgress) {
      subs.push(window.api.onScanProgress((progress) => {
        setScanProgress(progress)
      }))
    }
    return () => subs.forEach(fn => fn())
  }, [])

  // Click-eating outside dismisser in the capture phase
  useEffect(() => {
    if (activeMenuGameId === null) return

    const handleOutsideClick = (e) => {
      const inMenu = e.target.closest('.card-menu-container') !== null
      const inTrigger = e.target.closest('.edit-overlay-btn') !== null
      
      if (inMenu || inTrigger) {
        return
      }

      // Intercept, eat the event, and close the menu
      e.stopPropagation()
      e.preventDefault()
      setActiveMenuGameId(null)
    }

    document.addEventListener('click', handleOutsideClick, true)
    return () => {
      document.removeEventListener('click', handleOutsideClick, true)
    }
  }, [activeMenuGameId])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLaunch = async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    if (launchingGame) return
    setLaunchingGame(game.name); setLaunchStatus(null)
    try {
      await window.api.launchGame(game.executable)
      setLaunchStatus('success')
      try { await window.api.updateGameStatus(game.game_id, { last_played: Math.floor(Date.now() / 1000) }) } catch { /* non-fatal */ }
      
      if (localStorage.getItem('vibeport_exit_after_launch') === 'true') {
        setTimeout(() => {
          window.api?.closeWindow()
        }, 1200)
      }

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
      lastDeletedGamesListRef.current = null // Clear bulk delete cache
      lastDeletedGameRef.current = game
      await window.api.deleteGame(game.game_id)
      triggerToast(`Removed "${game.name}". Press Ctrl+Z to undo.`, 'info')
      await fetchGames()
    } catch (e) { console.error('Failed to delete game:', e) }
  }

  const handleRemoveAllGames = async () => {
    try {
      // Back up all current games before wiping
      lastDeletedGamesListRef.current = [...games]
      lastDeletedGameRef.current = null // Clear single game delete cache
      
      triggerToast('Removing all games...', 'info')
      await window.api.removeAllGames()
      triggerToast('All games removed. Press Ctrl+Z to undo.', 'success')
      await fetchGames()
    } catch (e) {
      console.error('Failed to remove all games:', e)
      triggerToast('Failed to remove some games.', 'error')
    }
  }

  const handleRunAutoScan = async () => {
    const enabledLaunchers = {
      steam: localStorage.getItem('vibeport_scan_steam') !== 'false',
      gog: localStorage.getItem('vibeport_scan_gog') !== 'false',
      epic: localStorage.getItem('vibeport_scan_epic') !== 'false',
      ea: localStorage.getItem('vibeport_scan_ea') !== 'false',
      ubisoft: localStorage.getItem('vibeport_scan_ubisoft') !== 'false',
      bnet: localStorage.getItem('vibeport_scan_bnet') !== 'false'
    }

    // Save current games list so user can undo this import using Ctrl + Z
    lastImportedGamesListRef.current = [...games]
    lastDeletedGamesListRef.current = null
    lastDeletedGameRef.current = null

    triggerToast('Rerunning scanners for enabled launchers...', 'info')
    setIsScanning(true)
    try {
      const res = await window.api.runAutoScan(enabledLaunchers)
      setIsScanning(false)
      if (res.success) {
        triggerToast('Library import complete! Press Ctrl+Z to undo.', 'success')
        await fetchGames()
      } else {
        triggerToast(`Import failed: ${res.error}`, 'error')
      }
    } catch (e) {
      console.error('Auto scan error:', e)
      setIsScanning(false)
      triggerToast('An error occurred during library scanning.', 'error')
    }
  }

  const handleToggleWindowsAccent = (enabled) => {
    localStorage.setItem('vibeport_use_windows_accent', enabled ? 'true' : 'false')
    if (enabled) {
      if (window.api?.getAccentColor) {
        window.api.getAccentColor().then(color => {
          const clean = (color || DEFAULT_ACCENT).replace('#', '')
          setAccentHex(clean)
          applyAccentPalette(clean)
        }).catch(console.error)
      }
    } else {
      const clean = DEFAULT_ACCENT.replace('#', '')
      setAccentHex(clean)
      applyAccentPalette(clean)
    }
  }

  const handleUpdateAllCovers = async () => {
    triggerToast('Updating library cover art...', 'info')
    try {
      const res = await window.api.updateAllCovers()
      if (res.success) {
        triggerToast('Cover art update triggered in background!', 'success')
      } else {
        triggerToast('Failed to trigger cover update.', 'error')
      }
    } catch (e) {
      console.error('Covers update error:', e)
      triggerToast('Failed to run covers update.', 'error')
    }
  }

  const resetForm = () => {
    setFormName(''); setFormExecutable(''); setFormDeveloper(''); setFormCoverUrl('')
    setSgdbSearchQuery(''); setSgdbGames([]); setSelectedSgdbGame(null); setSgdbCovers([])
  }

  const openAddModal = () => { resetForm(); setShowAddModal(true) }

  const handleOpenShortcuts = () => {
    if (window.api && window.api.openShortcutsWindow) {
      window.api.openShortcutsWindow()
      setIsStandaloneShortcutsOpen(true)
    } else {
      setShowShortcutsModal(true)
    }
  }

  const openEditModal = (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    resetForm()
    setEditingGame(game)
    setFormName(game.name); setFormExecutable(game.executable)
    setFormDeveloper(game.developer || ''); setFormCoverUrl(game.coverUrl || '')
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
        if (formCoverUrl !== editingGame.coverUrl) await window.api.downloadCoverUrl(editingGame.game_id, formCoverUrl)
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
  const sortedHiddenGames = sortGames(games.filter(g => g.hidden && g.name.toLowerCase().includes(searchTerm.toLowerCase())), sortBy)

  const cardFontSize = getCardFontSize()

  const commonCardProps = { 
    failedCovers, 
    cardFontSize, 
    onLaunch: handleLaunch, 
    onEdit: openEditModal, 
    onToggleHide: handleToggleHideGame,
    onDelete: handleDeleteGame,
    onImageError: (id) => setFailedCovers(p => ({ ...p, [id]: true })),
    activeMenuGameId,
    setActiveMenuGameId
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
        openPreferencesModal={() => setShowPreferencesModal(true)}
        openShortcutsModal={handleOpenShortcuts}
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

          {/* Horizontal Slide Wrapper (Library / Hidden) */}
          <div style={{ ...styles.mainSlider, transform: showHidden ? 'translateX(-50%)' : 'translateX(0)' }}>

            {/* ── PANEL 1: Library ──────────────────────────────────────── */}
            <div style={styles.mainPanel}>
              <div className="grid-container" style={styles.gridContainer}>


                {loading ? (
                  <div style={styles.loadingContainer}><div style={styles.spinnerLarge} /><div style={styles.loadingText}>Syncing game libraries...</div></div>
                ) : games.length === 0 ? (
                  <div style={styles.emptyState}>
                    <CartridgeIcon size={48} color="#334155" style={{ marginBottom: '12px' }} />
                    <div style={styles.emptyStateTitle}>No Games</div>
                    <div style={styles.emptyStateSub}>Use the + button to add games</div>
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
                  </div>
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
              onToggleWindowsAccent={handleToggleWindowsAccent}
              onUpdateCovers={handleUpdateAllCovers}
            />
          )}
          {showShortcutsModal && (
            <ShortcutsModal
              onClose={() => setShowShortcutsModal(false)}
            />
          )}
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                backdropFilter: 'none',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppRegion: 'drag' // Draggable overlay!
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                style={{
                  width: '380px',
                  backgroundColor: 'rgba(28, 28, 30, 0.94)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-glow-faint)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                  textAlign: 'center',
                  WebkitAppRegion: 'no-drag' // Stop drag inside card content area
                }}
              >
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#f8fafc',
                  letterSpacing: '-0.3px'
                }}>
                  Importing Games...
                </div>
                {/* Custom Animated Real Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    animate={{
                      width: `${(scanProgress.current / (scanProgress.total || 100)) * 100}%`
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 80,
                      damping: 15
                    }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      height: '100%',
                      backgroundColor: `#${accentHex}`,
                      borderRadius: '3px',
                      boxShadow: `0 0 10px rgba(${hexToRgb(accentHex)}, 0.5)`
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App