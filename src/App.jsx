import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Settings, Search, LayoutGrid, Sparkles, 
  CheckCircle2, AlertCircle, Plus, Eye, EyeOff, Trash2, 
  Edit3, Image as ImageIcon, Check, Loader2, X, Info,
  ArrowUpDown, Menu, ChevronRight, ChevronLeft, Sidebar,
  Sliders, Download as DownloadIcon
} from 'lucide-react'

const CartridgeIcon = ({ size = 20, color = "#c084fc", className = "", style = {} }) => {
  const safeColor = color.replace('#', '');
  const bodyGradId = `cartridge-body-${safeColor}`;
  const labelGradId = `cartridge-label-${safeColor}`;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      style={style}
    >
      {/* Cartridge Outer Shell with slightly beveled top corners */}
      <path 
        d="M5 3.5C5 3.22386 5.22386 3 5.5 3H18.5C18.7761 3 19 3.22386 19 3.5V17H5V3.5Z" 
        fill={`url(#${bodyGradId})`}
        stroke={color} 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
      
      {/* Bottom grip area with indentations */}
      <path 
        d="M5 17L7 21.5C7.1 21.8 7.4 22 7.8 22H16.2C16.6 22 16.9 21.8 17 21.5L19 17" 
        fill="none" 
        stroke={color} 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Sticker / Label */}
      <rect 
        x="7.5" 
        y="5.5" 
        width="9" 
        height="7.5" 
        rx="1" 
        fill={`url(#${labelGradId})`}
        stroke={color} 
        strokeWidth="1.2" 
      />
      
      {/* Indents/Lines on the label to simulate a design */}
      <line x1="9.5" y1="8" x2="14.5" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="9.5" y1="10" x2="12.5" y2="10" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* Grid line separator */}
      <line x1="5" y1="14.5" x2="19" y2="14.5" stroke={color} strokeWidth="1.2" opacity="0.4" />

      {/* Pin/contacts slots */}
      <line x1="9.5" y1="19.5" x2="9.5" y2="21" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="12" y1="19.5" x2="12" y2="21" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="14.5" y1="19.5" x2="14.5" y2="21" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.8" />

      <defs>
        <linearGradient id={bodyGradId} x1="12" y1="3" x2="12" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} stopOpacity="0.15" />
          <stop offset="1" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={labelGradId} x1="12" y1="5.5" x2="12" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const App = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [launchingGame, setLaunchingGame] = useState(null)
  const [launchStatus, setLaunchStatus] = useState(null) // 'success' | 'error' | null
  const [failedCovers, setFailedCovers] = useState({})

  // Settings state
  const [settings, setSettings] = useState({
    card_size: 'cozy',
    show_titles: true
  })

  // Settings Tab and Toasts
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')
  const [activeToast, setActiveToast] = useState(null)

  const triggerToast = (message, type = 'info') => {
    setActiveToast({ message, type })
  }

  // Effect to automatically clear activeToast after 5 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [activeToast])

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGame, setEditingGame] = useState(null)

  // Game Form states (for Add/Edit)
  const [formName, setFormName] = useState('')
  const [formExecutable, setFormExecutable] = useState('')
  const [formDeveloper, setFormDeveloper] = useState('')
  const [formCoverUrl, setFormCoverUrl] = useState('')

  // SteamGridDB search states
  const [sgdbSearchQuery, setSgdbSearchQuery] = useState('')
  const [sgdbGames, setSgdbGames] = useState([])
  const [sgdbSearching, setSgdbSearching] = useState(false)
  const [selectedSgdbGame, setSelectedSgdbGame] = useState(null)
  const [sgdbCovers, setSgdbCovers] = useState([])
  const [sgdbCoversLoading, setSgdbCoversLoading] = useState(false)
  const [downloadingCoverId, setDownloadingCoverId] = useState(null)

  // Sorting state with localStorage persistence
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('cartridges_sort_by') || 'alphabetical')

  // Persist sort preference
  useEffect(() => {
    localStorage.setItem('cartridges_sort_by', sortBy)
  }, [sortBy])

  // GTK4-inspired Menu Popover & Hidden/Modal States
  const [showMenu, setShowMenu] = useState(false)
  const [menuPanel, setMenuPanel] = useState('main') // 'main' | 'sort'
  const [showHidden, setShowHidden] = useState(() => localStorage.getItem('cartridges_show_hidden') === 'true')
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(() => localStorage.getItem('cartridges_show_sidebar') !== 'false')
  const [showSearch, setShowSearch] = useState(false)

  // Persist showSidebar preference
  useEffect(() => {
    localStorage.setItem('cartridges_show_sidebar', showSidebar)
  }, [showSidebar])

  // Persist showHidden preference
  useEffect(() => {
    localStorage.setItem('cartridges_show_hidden', showHidden)
  }, [showHidden])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events when typing inside search inputs, custom forms, etc.
      if (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        if (e.key === 'Escape') {
          document.activeElement.blur()
        }
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey
      
      // Ctrl + H -> Toggle Show Hidden
      if (modifier && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setShowHidden(prev => !prev)
      }
      // Ctrl + , -> Preferences / Settings
      if (modifier && e.key === ',') {
        e.preventDefault()
        setShowSettingsModal(true)
      }
      // Ctrl + ? (or Ctrl + /) -> Keyboard Shortcuts
      if (modifier && (e.key === '?' || e.key === '/')) {
        e.preventDefault()
        setShowShortcutsModal(true)
      }
      // Ctrl + F -> Focus Search Bar
      if (modifier && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder="Search library..."]')
          if (searchInput) {
            searchInput.focus()
            searchInput.select()
          }
        }, 50)
      }
      // Escape -> Close all modals/menus/search
      if (e.key === 'Escape') {
        const hasOpenModalOrMenu = 
          showMenu || 
          showSettingsModal || 
          showAddModal || 
          showEditModal || 
          showShortcutsModal || 
          showAboutModal || 
          showSearch;

        if (hasOpenModalOrMenu) {
          setShowMenu(false)
          setShowSettingsModal(false)
          setShowAddModal(false)
          setShowEditModal(false)
          setShowShortcutsModal(false)
          setShowAboutModal(false)
          setShowSearch(false)
        } else if (showHidden) {
          setShowHidden(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHidden, showMenu, showSettingsModal, showAddModal, showEditModal, showShortcutsModal, showAboutModal, showSearch])

  // Close popup menu on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showMenu && !e.target.closest('.gtk-popover-container')) {
        setShowMenu(false)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [showMenu])

  // Fetch all games
  const fetchGames = async () => {
    console.log('App: Fetching games from main process...')
    try {
      const data = await window.api.getGames()
      const normalizedData = data.map(game => {
        if (game.source === 'manual') {
          return { ...game, source: 'imported' }
        }
        return game
      })
      console.log('App: Received games data:', normalizedData)
      setGames(normalizedData)
    } catch (error) {
      console.error('App: Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const data = await window.api.getSettings()
      console.log('App: Loaded settings:', data)
      setSettings(data)
    } catch (error) {
      console.error('App: Failed to load settings:', error)
    }
  }

  useEffect(() => {
    fetchGames()
    fetchSettings()

    const unsubscribes = []

    if (window.api.onGamesUpdated) {
      console.log('App: Registered background games-updated event listener')
      const unsubscribe = window.api.onGamesUpdated(() => {
        console.log('App: Games updated in background, reloading UI...')
        fetchGames()
      })
      unsubscribes.push(unsubscribe)
    }

    if (window.api.onShowToast) {
      console.log('App: Registered background show-toast event listener')
      const unsubscribe = window.api.onShowToast((data) => {
        console.log('App: Received background toast:', data)
        if (data && data.message) {
          triggerToast(data.message, data.type)
        }
      })
      unsubscribes.push(unsubscribe)
    }

    return () => {
      unsubscribes.forEach(fn => fn())
    }
  }, [])

  // Handle Game Launch
  const handleLaunch = async (game, e) => {
    // Avoid double trigger if clicking overlay edit buttons
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    if (launchingGame) return
    
    setLaunchingGame(game.name)
    setLaunchStatus(null)
    
    try {
      await window.api.launchGame(game.executable)
      setLaunchStatus('success')
      
      // Update last played timestamp in the backend database
      try {
        await window.api.updateGameStatus(game.game_id, {
          last_played: Math.floor(Date.now() / 1000)
        })
      } catch (trackError) {
        console.error('Failed to update last played timestamp:', trackError)
      }

      setTimeout(() => {
        setLaunchingGame(null)
        setLaunchStatus(null)
      }, 4000)
    } catch (error) {
      console.error('Failed to launch game:', error)
      setLaunchStatus('error')
      setTimeout(() => {
        setLaunchingGame(null)
        setLaunchStatus(null)
      }, 5000)
    }
  }

  const handleImageError = (gameId) => {
    setFailedCovers(prev => ({ ...prev, [gameId]: true }))
  }

  // Handle saving general settings
  const handleSaveSettingsValue = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    try {
      await window.api.saveSettings(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Handle hide / unhide a game
  const handleToggleHideGame = async (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    const targetHidden = !game.hidden
    try {
      const success = await window.api.updateGameStatus(game.game_id, { hidden: targetHidden })
      if (success) {
        await fetchGames()
      }
    } catch (error) {
      console.error('Failed to toggle hide state:', error)
    }
  }

  // Handle deleting a game completely
  const handleDeleteGame = async (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    if (!confirm(`Are you sure you want to remove "${game.name}" from Cartridges?`)) return
    try {
      const success = await window.api.deleteGame(game.game_id)
      if (success) {
        await fetchGames()
      }
    } catch (error) {
      console.error('Failed to delete game:', error)
    }
  }

  // Add custom manual game submission
  const handleAddGameSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) {
      alert('Title and Executable Path are required!')
      return
    }
    try {
      const gameData = {
        name: formName,
        executable: formExecutable,
        developer: formDeveloper || null,
        source: 'imported',
        hidden: false
      }
      const result = await window.api.saveGame(gameData)
      if (result.success) {
        // If a cover URL was selected from SteamGridDB, download it now
        if (formCoverUrl) {
          await window.api.downloadCoverUrl(result.game.game_id, formCoverUrl)
        }
        await fetchGames()
        setShowAddModal(false)
        resetForm()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to add custom game:', error)
    }
  }

  // Edit game submission
  const handleEditGameSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) {
      alert('Title and Executable are required!')
      return
    }
    try {
      const gameData = {
        game_id: editingGame.game_id,
        name: formName,
        executable: formExecutable,
        developer: formDeveloper || null,
        source: editingGame.source || 'imported'
      }
      const result = await window.api.saveGame(gameData)
      if (result.success) {
        // If cover changed
        if (formCoverUrl && formCoverUrl !== editingGame.coverUrl) {
          await window.api.downloadCoverUrl(editingGame.game_id, formCoverUrl)
        }
        await fetchGames()
        setShowEditModal(false)
        resetForm()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to update game details:', error)
    }
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setEditingGame(game)
    setFormName(game.name)
    setFormExecutable(game.executable)
    setFormDeveloper(game.developer || '')
    setFormCoverUrl(game.coverUrl || '')
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormName('')
    setFormExecutable('')
    setFormDeveloper('')
    setFormCoverUrl('')
    setSgdbSearchQuery('')
    setSgdbGames([])
    setSelectedSgdbGame(null)
    setSgdbCovers([])
  }

  // SteamGridDB search handle
  const handleSgdbSearch = async () => {
    if (!sgdbSearchQuery) return
    setSgdbSearching(true)
    setSelectedSgdbGame(null)
    setSgdbCovers([])
    try {
      const results = await window.api.searchSteamGridDB(sgdbSearchQuery)
      setSgdbGames(results)
    } catch (error) {
      console.error('SteamGridDB Search error:', error)
      alert('Search failed: ' + error.message)
    } finally {
      setSgdbSearching(false)
    }
  }

  // SteamGridDB fetch grids/covers handle
  const handleSgdbSelectGame = async (game) => {
    setSelectedSgdbGame(game)
    setSgdbCoversLoading(true)
    try {
      const covers = await window.api.fetchSteamGridDBCovers(game.id)
      setSgdbCovers(covers)
    } catch (error) {
      console.error('SteamGridDB Cover fetch error:', error)
      alert('Failed to retrieve cover art: ' + error.message)
    } finally {
      setSgdbCoversLoading(false)
    }
  }

  // SteamGridDB cover downloader trigger (during Edit)
  const handleSgdbDownloadCover = async (coverUrl, coverId) => {
    if (editingGame) {
      setDownloadingCoverId(coverId)
      try {
        const result = await window.api.downloadCoverUrl(editingGame.game_id, coverUrl)
        if (result.success) {
          setFormCoverUrl(result.coverUrl)
          // Keep key mapping for covers fresh
          setFailedCovers(prev => ({ ...prev, [editingGame.game_id]: false }))
        } else {
          alert('Failed to apply cover art: ' + result.error)
        }
      } catch (error) {
        console.error('Failed to download cover:', error)
      } finally {
        setDownloadingCoverId(null)
      }
    } else {
      // During Add game, just save the url locally to form state and download after save game creates ID
      setFormCoverUrl(coverUrl)
      alert('Selected cover. It will be downloaded automatically when you save the game!')
    }
  }

  // Calculate dynamic source tabs based on available source properties
  // The sidebar counts and tabs represent standard visible games for stability
  const activeGames = games.filter(g => !g.hidden)
  const rawSources = [...new Set(activeGames.map(g => g.source).filter(Boolean))]
  const sources = ['all', ...rawSources]

  const sortFunction = (a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'z_to_a') {
      return b.name.localeCompare(a.name)
    }
    if (sortBy === 'added') {
      const dateA = a.added || 0
      const dateB = b.added || 0
      if (dateA !== dateB) return dateB - dateA
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'oldest') {
      const dateA = a.added || 0
      const dateB = b.added || 0
      if (dateA !== dateB) return dateA - dateB
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'last_played') {
      const playA = a.last_played || 0
      const playB = b.last_played || 0
      if (playA !== playB) return playB - playA
      return a.name.localeCompare(b.name)
    }
    return 0
  }

  // Standard Library View games pipeline
  const visibleGames = games.filter(g => !g.hidden)
  const filteredVisibleGames = visibleGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = selectedSource === 'all' || game.source === selectedSource
    return matchesSearch && matchesSource
  })
  const sortedVisibleGames = [...filteredVisibleGames].sort(sortFunction)

  // Hidden Games View games pipeline
  const hiddenGames = games.filter(g => g.hidden)
  const filteredHiddenGames = hiddenGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = selectedSource === 'all' || game.source === selectedSource
    return matchesSearch && matchesSource
  })
  const sortedHiddenGames = [...filteredHiddenGames].sort(sortFunction)

  const getSourceLabel = (src) => {
    if (src === 'all') return 'All Games'
    if (src === 'imported') return 'Added'
    if (src === 'steam') return 'Steam'
    if (src === 'gog') return 'GOG'
    if (src === 'manual') return 'Custom'
    return src.charAt(0).toUpperCase() + src.slice(1)
  }

  // Sizing reflow mapping
  const getGridColumns = () => {
    if (settings.card_size === 'compact') return 'repeat(auto-fill, minmax(130px, 1fr))'
    if (settings.card_size === 'large') return 'repeat(auto-fill, minmax(220px, 1fr))'
    return 'repeat(auto-fill, minmax(180px, 1fr))' // Cozy
  }

  const getCardFontSize = () => {
    if (settings.card_size === 'compact') return '12.5px'
    if (settings.card_size === 'large') return '16.5px'
    return '14.5px'
  }

  return (
    <div style={styles.container}>
      {/* CSS Injection for custom visual polish */}
      <style dangerouslySetInnerHTML={{__html: `
        .game-card-hover:hover .play-overlay {
          opacity: 1 !important;
        }
        .game-card-hover:hover .play-button-circle {
          transform: scale(1) !important;
        }
        .game-card-hover:hover .cover-image {
          transform: scale(1.04) !important;
        }
        .game-card-hover:hover .game-title {
          color: #c084fc !important;
        }
        .game-card-hover:hover .cover-wrapper {
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.35) !important;
          border-color: rgba(192, 132, 252, 0.4) !important;
        }
        .game-card-hover:hover .edit-overlay-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .header-action:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(192, 132, 252, 0.25) !important;
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.15) !important;
        }
        .header-action:hover svg {
          color: #c084fc !important;
        }
        .search-input-focus:focus {
          border-color: rgba(192, 132, 252, 0.35) !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 0 20px rgba(167, 139, 250, 0.15) !important;
        }
        .gtk-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #f8fafc !important;
        }
        
        .sidebar-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
          color: #f1f5f9 !important;
        }
        .sidebar-nav-item:hover svg {
          color: #c084fc !important;
        }

        /* Glassmorphic custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 99px;
          border: 2px solid transparent;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.2);
        }

        .glass-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: #cbd5e1;
          transition: all 0.2s ease;
        }
        .glass-btn:hover {
          background: rgba(167, 139, 250, 0.08);
          border-color: rgba(167, 139, 250, 0.25);
          color: #f8fafc;
        }
        .glass-btn-active {
          background: rgba(167, 139, 250, 0.12) !important;
          border-color: rgba(167, 139, 250, 0.4) !important;
          color: #c084fc !important;
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.1);
        }
        
        .form-input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.04);
          color: #f8fafc;
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-input:focus {
          border-color: rgba(167, 139, 250, 0.35);
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.1);
        }
      `}} />

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: showSidebar ? '260px' : '0px',
        padding: showSidebar ? '0 0 24px 0' : '0px',
        borderRight: showSidebar ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
        opacity: showSidebar ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}>
        <div style={styles.sidebarHeader}>
          <div 
            className="header-action" 
            style={styles.sidebarToggleBtn}
            onClick={() => setShowSidebar(false)}
            title="Hide Sidebar"
          >
            <Sidebar size={16} style={styles.actionIcon} />
          </div>
          <span style={styles.sidebarHeaderText}>Cartridges</span>
          <span style={styles.badge}>NATIVE</span>
        </div>

        <div style={styles.sectionHeader}>LIBRARY</div>
        <div style={styles.sidebarNav}>
          {['all', 'imported'].filter(src => sources.includes(src)).map((src) => {
            const isActive = selectedSource === src
            return (
              <div 
                key={src}
                className={isActive ? "" : "sidebar-nav-item"}
                style={{
                  ...styles.sidebarItem, 
                  ...(isActive ? styles.activeSidebarItem : {})
                }}
                onClick={() => setSelectedSource(src)}
              >
                {src === 'imported' ? (
                  <Plus size={18} color={isActive ? '#c084fc' : '#64748b'} strokeWidth={2.5} />
                ) : (
                  <LayoutGrid size={16} color={isActive ? '#c084fc' : '#64748b'} />
                )}
                <span>{getSourceLabel(src)}</span>
                <span style={{
                  ...styles.itemCount,
                  ...(isActive ? styles.activeItemCount : {})
                }}>
                  {src === 'all' ? activeGames.length : activeGames.filter(g => g.source === src).length}
                </span>
              </div>
            )
          })}
        </div>

        <>
          <div style={{ ...styles.sectionHeader, marginTop: '20px' }}>IMPORTED</div>
          <div style={styles.sidebarNav}>
            {[
              { id: 'steam', label: 'Steam' },
              { id: 'gog', label: 'GOG' },
              { id: 'epic', label: 'Epic Games' },
              { id: 'ea', label: 'EA' }
            ].map((launcher) => {
              const isActive = selectedSource === launcher.id
              const count = activeGames.filter(g => g.source === launcher.id).length

              return (
                <div 
                  key={launcher.id}
                  className={isActive ? "" : "sidebar-nav-item"}
                  style={{
                    ...styles.sidebarItem,
                    ...(isActive ? styles.activeSidebarItem : {}),
                  }}
                  onClick={() => setSelectedSource(launcher.id)}
                >
                  <LayoutGrid size={16} color={isActive ? '#c084fc' : '#64748b'} />
                  <span style={{ fontWeight: isActive ? '700' : '500' }}>
                    {launcher.label}
                  </span>
                  <span style={{
                    ...styles.itemCount,
                    ...(isActive ? styles.activeItemCount : {})
                  }}>
                    {count}
                  </span>
                </div>
              )
            })}

            {/* Other dynamic sources if any exist */}
            {sources.filter(s => s !== 'all' && s !== 'imported' && s !== 'steam' && s !== 'gog' && s !== 'epic' && s !== 'ea').map((src) => {
              const isActive = selectedSource === src
              return (
                <div 
                  key={src}
                  className={isActive ? "" : "sidebar-nav-item"}
                  style={{
                    ...styles.sidebarItem, 
                    ...(isActive ? styles.activeSidebarItem : {})
                  }}
                  onClick={() => setSelectedSource(src)}
                >
                  <LayoutGrid size={16} color={isActive ? '#c084fc' : '#64748b'} />
                  <span>{getSourceLabel(src)}</span>
                  <span style={{
                    ...styles.itemCount,
                    ...(isActive ? styles.activeItemCount : {})
                  }}>
                    {activeGames.filter(g => g.source === src).length}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Dynamic Launch Toast Notifications */}
        <AnimatePresence>
          {launchingGame && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
              style={{
                ...styles.toast,
                ...(launchStatus === 'error' ? styles.toastError : launchStatus === 'success' ? styles.toastSuccess : {})
              }}
            >
              {launchStatus === 'success' ? (
                <CheckCircle2 size={18} color="#4ade80" />
              ) : launchStatus === 'error' ? (
                <AlertCircle size={18} color="#f87171" />
              ) : (
                <div style={styles.spinner} />
              )}
              <span style={styles.toastText}>
                {launchStatus === 'success' 
                  ? `Started ${launchingGame} successfully!` 
                  : launchStatus === 'error' 
                  ? `Failed to launch ${launchingGame}` 
                  : `Launching ${launchingGame}...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic General Toast Notifications */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
              style={{
                ...styles.toast,
                top: launchingGame ? '80px' : '20px',
                ...(activeToast.type === 'error' ? styles.toastError : activeToast.type === 'success' ? styles.toastSuccess : {})
              }}
            >
              {activeToast.type === 'success' ? (
                <CheckCircle2 size={18} color="#4ade80" />
              ) : activeToast.type === 'error' ? (
                <AlertCircle size={18} color="#f87171" />
              ) : (
                <Info size={18} color="#c084fc" />
              )}
              <span style={styles.toastText}>
                {activeToast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Horizontal Slider Wrapper */}
        <div style={{ ...styles.mainSlider, transform: showHidden ? 'translateX(-50%)' : 'translateX(0)' }}>
          {/* PANEL 1: Standard Library View */}
          <div style={styles.mainPanel}>
            {/* Header */}
            <div style={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {!showSidebar && (
                  <div 
                    className="header-action" 
                    style={{ ...styles.actionIconContainer, marginRight: '8px' }}
                    onClick={() => setShowSidebar(true)}
                    title="Show Sidebar"
                  >
                    <Sidebar size={18} style={styles.actionIcon} />
                  </div>
                )}
                
                {/* Add Custom Game Action */}
                <div 
                  className="header-action" 
                  style={styles.actionIconContainer}
                  onClick={openAddModal}
                  title="Add Custom Game"
                >
                  <Plus size={18} style={styles.actionIcon} />
                </div>
              </div>

              {/* Centered Active Title */}
              <div style={styles.mainHeaderTitle}>
                {getSourceLabel(selectedSource)}
              </div>
              
              <div style={styles.headerActions}>
                {/* Search Toggle Action */}
                <div 
                  className="header-action" 
                  style={{
                    ...styles.actionIconContainer,
                    backgroundColor: showSearch ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    borderColor: showSearch ? 'rgba(192, 132, 252, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                  }}
                  onClick={() => setShowSearch(prev => !prev)}
                  title="Search Games"
                >
                  <Search size={18} style={{ color: showSearch ? '#c084fc' : '#cbd5e1' }} />
                </div>

                {/* Custom Burger Menu Button (GTK4 Style) */}
                <div style={{ position: 'relative' }}>
                  <div 
                    className="header-action gtk-popover-container" 
                    style={{
                      ...styles.actionIconContainer,
                      backgroundColor: showMenu && !showHidden ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      borderColor: showMenu && !showHidden ? 'rgba(192, 132, 252, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(prev => !prev);
                      setMenuPanel('main');
                    }}
                    title="Main Menu"
                  >
                    <Menu size={18} style={{ color: showMenu && !showHidden ? '#c084fc' : '#f8fafc' }} />
                  </div>
                  
                  {showMenu && !showHidden && (
                    <div className="gtk-popover-container" style={styles.popover}>
                      {/* Popover triangle/bubble arrow */}
                      <div style={styles.popoverArrow} />
                      
                      <div style={styles.popoverContent}>
                        {menuPanel === 'main' ? (
                          /* Main menu panel */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuPanel('sort');
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Sort</span>
                              </div>
                              <ChevronRight size={14} color="#94a3b8" />
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHidden(prev => !prev);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                  {showHidden && <Check size={14} color="#c084fc" strokeWidth={2.5} />}
                                </div>
                                <span>Show Hidden</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+H</span>
                            </div>
                            
                            <div style={styles.popoverSeparator} />
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSettingsModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Preferences</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+,</span>
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowShortcutsModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Keyboard Shortcuts</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+?</span>
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAboutModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>About Cartridges</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Sort panel */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {/* Centered header back row */}
                            <div 
                              className="gtk-menu-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                marginBottom: '6px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                gap: '8px',
                                transition: 'all 0.15s ease',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuPanel('main');
                              }}
                            >
                              <ChevronLeft size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              <span style={{ 
                                fontWeight: '600',
                                fontSize: '13px',
                                color: '#f8fafc'
                              }}>Sort</span>
                            </div>
                            
                            {[
                              { label: 'A-Z', value: 'alphabetical' },
                              { label: 'Z-A', value: 'z_to_a' },
                              { label: 'Newest', value: 'added' },
                              { label: 'Oldest', value: 'oldest' },
                              { label: 'Last Played', value: 'last_played' }
                            ].map(opt => {
                              const isSelected = sortBy === opt.value;
                              return (
                                <div 
                                  key={opt.value}
                                  className="gtk-menu-item" 
                                  style={{
                                    ...styles.popoverItem,
                                    justifyContent: 'flex-start',
                                    gap: '10px',
                                    color: isSelected ? '#c084fc' : '#cbd5e1'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSortBy(opt.value);
                                    setShowMenu(false);
                                  }}
                                >
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: `1.5px solid ${isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.2)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSelected ? 'rgba(192, 132, 252, 0.1)' : 'transparent',
                                    transition: 'all 0.15s'
                                  }}>
                                    {isSelected && (
                                      <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: '#c084fc'
                                      }} />
                                    )}
                                  </div>
                                  <span>{opt.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Search Row */}
            <AnimatePresence>
              {showSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '48px', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={styles.searchBarRow}
                >
                  <div style={styles.searchBarInner}>
                    <Search size={16} color="#cbd5e1" style={{ marginRight: '8px', flexShrink: 0 }} />
                    <input 
                      type="text" 
                      placeholder="Search library..." 
                      className="search-input-focus"
                      style={styles.searchBarInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                    {searchTerm && (
                      <div 
                        onClick={() => setSearchTerm('')} 
                        style={{
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          userSelect: 'none',
                        }}
                      >
                        <X size={14} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid View Container */}
            <div style={styles.gridContainer}>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinnerLarge} />
                  <div style={styles.loadingText}>Syncing game libraries...</div>
                </div>
              ) : sortedVisibleGames.length === 0 ? (
                <div style={styles.emptyState}>
                  <CartridgeIcon size={48} color="#334155" style={{ marginBottom: '12px' }} />
                  <div style={styles.emptyStateTitle}>No games match your criteria</div>
                  <div style={styles.emptyStateSub}>Double check your search text or switch libraries.</div>
                </div>
              ) : (
                <motion.div layout style={{ ...styles.grid, gridTemplateColumns: getGridColumns() }}>
                  <AnimatePresence mode="popLayout">
                    {sortedVisibleGames.map((game) => {
                      return (
                        <motion.div
                          key={game.game_id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          whileHover={{ y: -6 }}
                          className="game-card-hover"
                          style={styles.gameCard}
                          onClick={(e) => handleLaunch(game, e)}
                        >
                          <div className="cover-wrapper" style={styles.coverWrapper}>
                            <div style={styles.coverContainer}>
                              {game.coverUrl && !failedCovers[game.game_id] ? (
                                <img 
                                  src={game.coverUrl} 
                                  alt={game.name} 
                                  className="cover-image"
                                  style={styles.cover}
                                  onError={() => handleImageError(game.game_id)}
                                />
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
                                style={styles.editActionContainer}
                                onClick={(e) => openEditModal(game, e)}
                              >
                                <Edit3 size={14} color="#ffffff" />
                              </div>
                            </div>
                          </div>
                          
                          {settings.show_titles && (
                            <div style={styles.gameInfo}>
                              <div className="game-title" style={{ ...styles.gameTitle, fontSize: getCardFontSize() }}>{game.name}</div>
                              <div style={styles.gameSourceBadge}>
                                {game.source === 'steam' ? 'STEAM' : game.source === 'gog' ? 'GOG' : 'LOCAL'}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>

          {/* PANEL 2: Hidden Games View */}
          <div style={styles.mainPanel}>
            {/* Header */}
            <div style={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div 
                  className="header-action" 
                  style={{ ...styles.actionIconContainer, marginRight: '8px' }}
                  onClick={() => setShowHidden(false)}
                  title="Back to Library"
                >
                  <ChevronLeft size={18} style={styles.actionIcon} />
                </div>
              </div>

              {/* Centered Active Title */}
              <div style={styles.mainHeaderTitle}>
                Hidden Games
              </div>
              
              <div style={styles.headerActions}>
                {/* Search Toggle Action */}
                <div 
                  className="header-action" 
                  style={{
                    ...styles.actionIconContainer,
                    backgroundColor: showSearch ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    borderColor: showSearch ? 'rgba(192, 132, 252, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                  }}
                  onClick={() => setShowSearch(prev => !prev)}
                  title="Search Games"
                >
                  <Search size={18} style={{ color: showSearch ? '#c084fc' : '#cbd5e1' }} />
                </div>

                {/* Custom Burger Menu Button (GTK4 Style) */}
                <div style={{ position: 'relative' }}>
                  <div 
                    className="header-action gtk-popover-container" 
                    style={{
                      ...styles.actionIconContainer,
                      backgroundColor: showMenu && showHidden ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      borderColor: showMenu && showHidden ? 'rgba(192, 132, 252, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(prev => !prev);
                      setMenuPanel('main');
                    }}
                    title="Main Menu"
                  >
                    <Menu size={18} style={{ color: showMenu && showHidden ? '#c084fc' : '#f8fafc' }} />
                  </div>
                  
                  {showMenu && showHidden && (
                    <div className="gtk-popover-container" style={styles.popover}>
                      {/* Popover triangle/bubble arrow */}
                      <div style={styles.popoverArrow} />
                      
                      <div style={styles.popoverContent}>
                        {menuPanel === 'main' ? (
                          /* Main menu panel */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuPanel('sort');
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Sort</span>
                              </div>
                              <ChevronRight size={14} color="#94a3b8" />
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHidden(prev => !prev);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                  {showHidden && <Check size={14} color="#c084fc" strokeWidth={2.5} />}
                                </div>
                                <span>Show Hidden</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+H</span>
                            </div>
                            
                            <div style={styles.popoverSeparator} />
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSettingsModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Preferences</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+,</span>
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowShortcutsModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>Keyboard Shortcuts</span>
                              </div>
                              <span style={styles.popoverShortcut}>Ctrl+?</span>
                            </div>
                            
                            <div 
                              className="gtk-menu-item" 
                              style={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAboutModal(true);
                                setShowMenu(false);
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                                <span>About Cartridges</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Sort panel */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {/* Centered header back row */}
                            <div 
                              className="gtk-menu-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                marginBottom: '6px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                gap: '8px',
                                transition: 'all 0.15s ease',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuPanel('main');
                              }}
                            >
                              <ChevronLeft size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              <span style={{ 
                                fontWeight: '600',
                                fontSize: '13px',
                                color: '#f8fafc'
                              }}>Sort</span>
                            </div>
                            
                            {[
                              { label: 'A-Z', value: 'alphabetical' },
                              { label: 'Z-A', value: 'z_to_a' },
                              { label: 'Newest', value: 'added' },
                              { label: 'Oldest', value: 'oldest' },
                              { label: 'Last Played', value: 'last_played' }
                            ].map(opt => {
                              const isSelected = sortBy === opt.value;
                              return (
                                <div 
                                  key={opt.value}
                                  className="gtk-menu-item" 
                                  style={{
                                    ...styles.popoverItem,
                                    justifyContent: 'flex-start',
                                    gap: '10px',
                                    color: isSelected ? '#c084fc' : '#cbd5e1'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSortBy(opt.value);
                                    setShowMenu(false);
                                  }}
                                >
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: `1.5px solid ${isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.2)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSelected ? 'rgba(192, 132, 252, 0.1)' : 'transparent',
                                    transition: 'all 0.15s'
                                  }}>
                                    {isSelected && (
                                      <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: '#c084fc'
                                      }} />
                                    )}
                                  </div>
                                  <span>{opt.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Search Row */}
            <AnimatePresence>
              {showSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '48px', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={styles.searchBarRow}
                >
                  <div style={styles.searchBarInner}>
                    <Search size={16} color="#cbd5e1" style={{ marginRight: '8px', flexShrink: 0 }} />
                    <input 
                      type="text" 
                      placeholder="Search library..." 
                      className="search-input-focus"
                      style={styles.searchBarInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                    {searchTerm && (
                      <div 
                        onClick={() => setSearchTerm('')} 
                        style={{
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          userSelect: 'none',
                        }}
                      >
                        <X size={14} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid View Container */}
            <div style={styles.gridContainer}>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinnerLarge} />
                  <div style={styles.loadingText}>Syncing game libraries...</div>
                </div>
              ) : sortedHiddenGames.length === 0 ? (
                <div style={styles.emptyState}>
                  <EyeOff size={48} color="#334155" style={{ marginBottom: '12px' }} />
                  <div style={styles.emptyStateTitle}>No Hidden Games</div>
                  <div style={styles.emptyStateSub}>Games you hide will appear here</div>
                </div>
              ) : (
                <motion.div layout style={{ ...styles.grid, gridTemplateColumns: getGridColumns() }}>
                  <AnimatePresence mode="popLayout">
                    {sortedHiddenGames.map((game) => {
                      return (
                        <motion.div
                          key={game.game_id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          whileHover={{ y: -6 }}
                          className="game-card-hover"
                          style={{
                            ...styles.gameCard,
                            opacity: 0.8,
                          }}
                          onClick={(e) => handleLaunch(game, e)}
                        >
                          <div className="cover-wrapper" style={styles.coverWrapper}>
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              zIndex: 10,
                              backgroundColor: 'rgba(15, 23, 42, 0.85)',
                              backdropFilter: 'blur(4px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '3px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            }}>
                              <EyeOff size={11} color="#cbd5e1" />
                              <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '600' }}>Hidden</span>
                            </div>
                            <div style={styles.coverContainer}>
                              {game.coverUrl && !failedCovers[game.game_id] ? (
                                <img 
                                  src={game.coverUrl} 
                                  alt={game.name} 
                                  className="cover-image"
                                  style={styles.cover}
                                  onError={() => handleImageError(game.game_id)}
                                />
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
                                style={styles.editActionContainer}
                                onClick={(e) => openEditModal(game, e)}
                              >
                                <Edit3 size={14} color="#ffffff" />
                              </div>
                            </div>
                          </div>
                          
                          {settings.show_titles && (
                            <div style={styles.gameInfo}>
                              <div className="game-title" style={{ ...styles.gameTitle, fontSize: getCardFontSize() }}>{game.name}</div>
                              <div style={styles.gameSourceBadge}>
                                {game.source === 'steam' ? 'STEAM' : game.source === 'gog' ? 'GOG' : 'LOCAL'}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RENDER MODALS */}
      <AnimatePresence>
        {/* Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowShortcutsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={styles.shortcutsModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.shortcutsModalHeader}>
                <h2 style={styles.shortcutsModalTitle}>Keyboard Shortcuts</h2>
                <div onClick={() => setShowShortcutsModal(false)} style={styles.modalCloseBtn}>
                  <X size={18} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {[
                  { label: 'General', shortcuts: [
                    { desc: 'Focus Search Bar', keys: ['Ctrl', 'F'] },
                    { desc: 'Open Preferences', keys: ['Ctrl', ','] },
                    { desc: 'Show Keyboard Shortcuts', keys: ['Ctrl', '?'] },
                    { desc: 'Toggle Show Hidden', keys: ['Ctrl', 'H'] },
                  ]},
                  { label: 'Navigation', shortcuts: [
                    { desc: 'Close Modals / Popups', keys: ['Esc'] }
                  ]}
                ].map(group => (
                  <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {group.shortcuts.map(sc => (
                        <div key={sc.desc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{sc.desc}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {sc.keys.map(k => (
                              <kbd key={k} style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '11.5px',
                                color: '#f8fafc',
                                boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
                                fontWeight: '600',
                                fontFamily: 'inherit'
                              }}>{k}</kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* About Cartridges Modal */}
        {showAboutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowAboutModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{ ...styles.shortcutsModal, width: '360px', padding: '32px 24px', textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div onClick={() => setShowAboutModal(false)} style={{ ...styles.modalCloseBtn, position: 'absolute', top: '16px', right: '16px' }}>
                <X size={18} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <CartridgeIcon size={64} color="#c084fc" />
                
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0' }}>Cartridges</h2>
                  <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600', marginTop: '4px' }}>v1.5.0 Native</div>
                </div>
                
                <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', margin: '0' }}>
                  A beautiful, lightweight, native game launcher that brings all your GOG, Steam, and manually added games together in one gorgeous place.
                </p>
                
                <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.05)', margin: '8px 0' }} />
                
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                  Inspired by GTK4 Cartridges & Libadwaita designs.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{ ...styles.modalContentLarge, width: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={20} color="#c084fc" />
                  <h2 style={styles.modalTitle}>Preferences</h2>
                </div>
                <div style={styles.closeBtn} onClick={() => setShowSettingsModal(false)}>
                  <X size={18} />
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={styles.settingsSecTitle}>Visual Preferences</h3>
                
                {/* Grid Sizing */}
                <div style={styles.settingsRow}>
                  <span style={styles.settingsLabel}>Grid Card Size</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['compact', 'cozy', 'large'].map(sz => (
                      <button
                        key={sz}
                        className={`glass-btn ${settings.card_size === sz ? 'glass-btn-active' : ''}`}
                        style={styles.pillButton}
                        onClick={() => handleSaveSettingsValue('card_size', sz)}
                      >
                        {sz.charAt(0).toUpperCase() + sz.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titles Toggle */}
                <div style={styles.settingsRow}>
                  <span style={styles.settingsLabel}>Show Game Titles</span>
                  <button
                    className={`glass-btn ${settings.show_titles ? 'glass-btn-active' : ''}`}
                    style={styles.toggleButton}
                    onClick={() => handleSaveSettingsValue('show_titles', !settings.show_titles)}
                  >
                    {settings.show_titles ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Game Modal */}
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={styles.modalContentLarge}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#c084fc" />
                  <h2 style={styles.modalTitle}>Add Custom Game</h2>
                </div>
                <div style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                  <X size={18} />
                </div>
              </div>

              <div style={styles.formLayout}>
                {/* Form fields */}
                <form onSubmit={handleAddGameSubmit} style={styles.formLeft}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Game Title *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Hades II"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Command / Executable Path *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder='e.g. "C:\\Games\\Hades2\\Hades2.exe"'
                      value={formExecutable}
                      onChange={(e) => setFormExecutable(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Developer</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Supergiant Games"
                      value={formDeveloper}
                      onChange={(e) => setFormDeveloper(e.target.value)}
                    />
                  </div>



                  {formCoverUrl && (
                    <div style={styles.formCoverStatus}>
                      <ImageIcon size={14} color="#c084fc" />
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Selected cover from SteamGridDB</span>
                    </div>
                  )}

                  <div style={styles.formActions}>
                    <button type="button" className="glass-btn" style={styles.formBtnSec} onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="glass-btn glass-btn-active" style={styles.formBtnPri}>
                      Save Game
                    </button>
                  </div>
                </form>

                {/* SteamGridDB Cover Search Downloader */}
                <div style={styles.formRight}>
                  <h3 style={styles.settingsSecTitle}>Search SteamGridDB Covers</h3>
                  
                  {true ? (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input 
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder="Search title on SteamGridDB..."
                          value={sgdbSearchQuery}
                          onChange={(e) => setSgdbSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSgdbSearch()}
                        />
                        <button 
                          type="button" 
                          className="glass-btn" 
                          style={styles.sgdbSearchBtn}
                          onClick={handleSgdbSearch}
                          disabled={sgdbSearching}
                        >
                          {sgdbSearching ? <Loader2 size={16} className="spin" /> : 'Search'}
                        </button>
                      </div>

                      {/* Display search autocomplete results */}
                      {sgdbGames.length > 0 && !selectedSgdbGame && (
                        <div style={styles.sgdbResultsList}>
                          {sgdbGames.map(game => (
                            <div 
                              key={game.id} 
                              style={styles.sgdbResultItem}
                              onClick={() => handleSgdbSelectGame(game)}
                            >
                              <Sparkles size={14} color="#c084fc" style={{ flexShrink: 0 }} />
                              <span style={styles.sgdbResultName}>{game.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Grid covers */}
                      {selectedSgdbGame && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                          <div style={styles.selectedGameHeader}>
                            <span style={styles.selectedGameLabel}>Grids for: <strong>{selectedSgdbGame.name}</strong></span>
                            <span style={{ fontSize: '11px', color: '#8b5cf6', cursor: 'pointer' }} onClick={() => setSelectedSgdbGame(null)}>Change</span>
                          </div>
                          
                          {sgdbCoversLoading ? (
                            <div style={styles.coversLoader}>
                              <Loader2 size={24} className="spin" color="#8b5cf6" />
                              <span style={{ fontSize: '12.5px', color: '#475569' }}>Fetching artworks...</span>
                            </div>
                          ) : (
                            <div style={styles.coversGrid}>
                              {sgdbCovers.map(grid => (
                                <div key={grid.id} style={styles.coverThumbnailCard}>
                                  <img src={grid.thumb} style={styles.coverThumbImg} alt="Cover Thumbnail" />
                                  <div style={styles.coverThumbInfo}>
                                    <span style={styles.coverThumbBadge}>
                                      {(grid.type || 'static').toUpperCase()} ({grid.width || '?' }x{grid.height || '?'})
                                    </span>
                                    <button
                                      type="button"
                                      className="glass-btn"
                                      style={styles.applyCoverBtn}
                                      onClick={() => handleSgdbDownloadCover(grid.url, grid.id)}
                                    >
                                      Select Art
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.sgdbEmpty}>
                      <AlertCircle size={24} color="#334155" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                        Configure your SteamGridDB API key in Settings to search and download dynamic game cover artworks directly!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Game Modal */}
        {showEditModal && editingGame && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={styles.modalContentLarge}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={20} color="#c084fc" />
                  <h2 style={styles.modalTitle}>Edit: {editingGame.name}</h2>
                </div>
                <div style={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                  <X size={18} />
                </div>
              </div>

              <div style={styles.formLayout}>
                {/* Form fields */}
                <form onSubmit={handleEditGameSubmit} style={styles.formLeft}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Game Title *</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Command / Executable Path *</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={formExecutable}
                      onChange={(e) => setFormExecutable(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Developer</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={formDeveloper}
                      onChange={(e) => setFormDeveloper(e.target.value)}
                    />
                  </div>



                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    {/* Hide Button */}
                    <button
                      type="button"
                      className={`glass-btn`}
                      style={{ ...styles.formToggleBtn, flex: 1 }}
                      onClick={(e) => {
                        handleToggleHideGame(editingGame, e)
                        setShowEditModal(false)
                      }}
                    >
                      <EyeOff size={14} style={{ marginRight: '6px' }} />
                      Hide Game
                    </button>

                    {/* Delete Custom button */}
                    {(editingGame.source === 'manual' || editingGame.source === 'imported') && (
                      <button
                        type="button"
                        className="glass-btn"
                        style={{ ...styles.formToggleBtn, flex: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onClick={(e) => {
                          handleDeleteGame(editingGame, e)
                          setShowEditModal(false)
                        }}
                      >
                        <Trash2 size={14} color="#f87171" style={{ marginRight: '6px' }} />
                        <span style={{ color: '#f87171' }}>Delete Game</span>
                      </button>
                    )}
                  </div>

                  <div style={styles.formActions}>
                    <button type="button" className="glass-btn" style={styles.formBtnSec} onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="glass-btn glass-btn-active" style={styles.formBtnPri}>
                      Save Changes
                    </button>
                  </div>
                </form>

                {/* SteamGridDB Cover Search Downloader */}
                <div style={styles.formRight}>
                  <h3 style={styles.settingsSecTitle}>Search SteamGridDB Covers</h3>
                  
                  {true ? (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input 
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder="Search title on SteamGridDB..."
                          value={sgdbSearchQuery}
                          onChange={(e) => setSgdbSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSgdbSearch()}
                        />
                        <button 
                          type="button" 
                          className="glass-btn" 
                          style={styles.sgdbSearchBtn}
                          onClick={handleSgdbSearch}
                          disabled={sgdbSearching}
                        >
                          {sgdbSearching ? <Loader2 size={16} className="spin" /> : 'Search'}
                        </button>
                      </div>

                      {/* Display search autocomplete results */}
                      {sgdbGames.length > 0 && !selectedSgdbGame && (
                        <div style={styles.sgdbResultsList}>
                          {sgdbGames.map(game => (
                            <div 
                              key={game.id} 
                              style={styles.sgdbResultItem}
                              onClick={() => handleSgdbSelectGame(game)}
                            >
                              <Sparkles size={14} color="#c084fc" style={{ flexShrink: 0 }} />
                              <span style={styles.sgdbResultName}>{game.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Grid covers */}
                      {selectedSgdbGame && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                          <div style={styles.selectedGameHeader}>
                            <span style={styles.selectedGameLabel}>Grids for: <strong>{selectedSgdbGame.name}</strong></span>
                            <span style={{ fontSize: '11px', color: '#8b5cf6', cursor: 'pointer' }} onClick={() => setSelectedSgdbGame(null)}>Change</span>
                          </div>
                          
                          {sgdbCoversLoading ? (
                            <div style={styles.coversLoader}>
                              <Loader2 size={24} className="spin" color="#8b5cf6" />
                              <span style={{ fontSize: '12.5px', color: '#475569' }}>Fetching artworks...</span>
                            </div>
                          ) : (
                            <div style={styles.coversGrid}>
                              {sgdbCovers.map(grid => {
                                const isDownloading = downloadingCoverId === grid.id
                                return (
                                  <div key={grid.id} style={styles.coverThumbnailCard}>
                                    <img src={grid.thumb} style={styles.coverThumbImg} alt="Cover Thumbnail" />
                                    <div style={styles.coverThumbInfo}>
                                      <span style={styles.coverThumbBadge}>
                                        {(grid.type || 'static').toUpperCase()} ({grid.width || '?' }x{grid.height || '?'})
                                      </span>
                                      <button
                                        type="button"
                                        className="glass-btn"
                                        style={styles.applyCoverBtn}
                                        onClick={() => handleSgdbDownloadCover(grid.url, grid.id)}
                                        disabled={isDownloading}
                                      >
                                        {isDownloading ? <Loader2 size={12} className="spin" /> : 'Download Grid'}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.sgdbEmpty}>
                      <AlertCircle size={24} color="#334155" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                        Configure your SteamGridDB API key in Settings to search and download dynamic game cover artworks directly!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'radial-gradient(circle at top right, #17152b 0%, #08070d 80%)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'rgba(10, 9, 16, 0.82)',
    borderRight: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 24px 0',
    backdropFilter: 'blur(24px)',
    zIndex: 10,
  },
  sidebarHeader: {
    height: '56px',
    padding: '0 16px 0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    marginBottom: '20px',
  },
  sidebarHeaderText: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '15px',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '-0.3px',
  },
  sidebarToggleBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  badge: {
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '99px',
    marginLeft: 'auto',
    letterSpacing: '0.5px',
  },
  sectionHeader: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '1.5px',
    padding: '0 24px 10px 24px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    border: '1px solid transparent',
  },
  activeSidebarItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.07)',
    border: '1px solid rgba(139, 92, 246, 0.12)',
    color: '#c084fc',
  },
  itemCount: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#475569',
    fontWeight: '700',
  },
  activeItemCount: {
    color: '#c084fc',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  mainSlider: {
    display: 'flex',
    flexDirection: 'row',
    width: '200%',
    height: '100%',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  mainPanel: {
    width: '50%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: '56px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    position: 'relative',
    backgroundColor: 'rgba(10, 9, 16, 0.15)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
  },
  mainHeaderTitle: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '15px',
    fontWeight: '700',
    color: '#cbd5e1',
    pointerEvents: 'none',
    letterSpacing: '-0.3px',
  },
  searchBarRow: {
    height: '48px',
    backgroundColor: 'rgba(10, 9, 16, 0.4)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  searchBarInner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '4px 10px',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
  },
  searchBarInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '13px',
    fontWeight: '500',
    flex: 1,
    padding: 0,
  },
  popover: {
    position: 'absolute',
    top: '46px',
    right: '0',
    width: '230px',
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
    overflow: 'visible',
    padding: '8px',
  },
  popoverArrow: {
    position: 'absolute',
    top: '-6px',
    right: '14px',
    width: '10px',
    height: '10px',
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    transform: 'rotate(45deg)',
    zIndex: 999,
  },
  popoverContent: {
    position: 'relative',
    zIndex: 1001,
  },
  popoverItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  popoverShortcut: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '400',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  popoverSeparator: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    margin: '4px 0',
  },
  shortcutsModal: {
    width: '400px',
    background: 'rgba(15, 12, 28, 0.88)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(139, 92, 246, 0.22)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 50px rgba(139, 92, 246, 0.12)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 201,
  },
  shortcutsModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
  },
  shortcutsModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0,
  },
  modalCloseBtn: {
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionIcon: {
    color: '#64748b',
  },
  gridContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
  },
  grid: {
    display: 'grid',
    gap: '28px',
  },
  gameCard: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  coverWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
  },
  coverContainer: {
    position: 'relative',
    aspectRatio: '2/3',
    backgroundColor: '#07060a',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #100f23 0%, #1e092b 100%)',
    position: 'relative',
  },
  placeholderGlow: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#7c3aed',
    filter: 'blur(30px)',
    opacity: 0.4,
  },
  placeholderText: {
    fontSize: '56px',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 6, 10, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    backdropFilter: 'blur(3px)',
  },
  playButtonCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
    transform: 'scale(0.85)',
    transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
  },
  editActionContainer: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transform: 'scale(0.9)',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    zIndex: 5,
  },
  gameInfo: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  gameTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '600',
    color: '#cbd5e1',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'color 0.2s ease',
  },
  gameSourceBadge: {
    fontSize: '8.5px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '1px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
  },
  loadingText: {
    fontSize: '14.5px',
    fontWeight: '500',
    color: '#475569',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '8px',
    padding: '40px',
  },
  emptyStateTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '16.5px',
    fontWeight: '600',
    color: '#475569',
  },
  emptyStateSub: {
    fontSize: '13px',
    color: '#334155',
    maxWidth: '280px',
  },
  toast: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    backgroundColor: '#0f0e16',
    border: '1px solid rgba(139, 92, 246, 0.22)',
    boxShadow: '0 20px 30px -5px rgba(0,0,0,0.7), 0 0 30px rgba(139, 92, 246, 0.08)',
    borderRadius: '12px',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 100,
  },
  toastSuccess: {
    border: '1px solid rgba(74, 222, 128, 0.18)',
    boxShadow: '0 20px 30px -5px rgba(0,0,0,0.7), 0 0 30px rgba(74, 222, 128, 0.04)',
  },
  toastError: {
    border: '1px solid rgba(248, 113, 113, 0.18)',
    boxShadow: '0 20px 30px -5px rgba(0,0,0,0.7), 0 0 30px rgba(248, 113, 113, 0.04)',
  },
  toastText: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  spinner: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#c084fc',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerLarge: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid rgba(139, 92, 246, 0.08)',
    borderTopColor: '#8b5cf6',
    animation: 'spin 1s linear infinite',
  },
  
  // Modals Styling
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 4, 10, 0.72)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalContentLarge: {
    width: '900px',
    maxHeight: '90vh',
    background: 'rgba(15, 12, 28, 0.82)',
    border: '1px solid rgba(139, 92, 246, 0.22)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 50px rgba(139, 92, 246, 0.12)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '18px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0,
  },
  closeBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  // Settings layout
  settingsLayout: {
    display: 'flex',
    height: '520px',
    overflow: 'hidden',
  },
  settingsMain: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  settingsSidebar: {
    width: '320px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
    background: 'rgba(5, 4, 10, 0.25)',
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  settingsSecTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#c084fc',
    margin: '0 0 4px 0',
    letterSpacing: '0.5px',
  },
  settingsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  settingsLabel: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  pillButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  toggleButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    width: '100px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  infoBox: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.12)',
    borderRadius: '8px',
    marginTop: '6px',
  },
  infoText: {
    fontSize: '11px',
    lineHeight: '1.4',
    color: '#94a3b8',
  },
  
  // Hidden list
  hiddenManagerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
    flex: 1,
    overflowY: 'auto',
  },
  hiddenEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#475569',
    fontSize: '12.5px',
    gap: '4px',
    padding: '40px 0',
  },
  hiddenGameItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '10px',
  },
  hiddenGameInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '190px',
  },
  hiddenGameName: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  hiddenGameSource: {
    fontSize: '8px',
    fontWeight: '800',
    color: '#475569',
  },
  hiddenActionBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  // Form Modals Layout
  formLayout: {
    display: 'flex',
    height: '520px',
    overflow: 'hidden',
  },
  formLeft: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRight: {
    width: '420px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
    background: 'rgba(5, 4, 10, 0.25)',
    padding: '24px',
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  formCoverStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '6px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    paddingTop: '20px',
  },
  formBtnSec: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  formBtnPri: {
    flex: 2,
    padding: '12px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
  },
  formToggleBtn: {
    padding: '10px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  // SteamGridDB search Right Layout
  sgdbSearchBtn: {
    padding: '0 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sgdbEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '0 32px',
  },
  sgdbResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    flex: 1,
  },
  sgdbResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sgdbResultName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  selectedGameHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    marginBottom: '12px',
  },
  selectedGameLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  coversLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '8px',
  },
  coversGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    overflowY: 'auto',
    flex: 1,
    padding: '2px',
    paddingRight: '6px',
    minHeight: 0,
  },
  coverThumbnailCard: {
    background: '#07060a',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.03)',
    display: 'flex',
    flexDirection: 'column',
    height: '260px',
    position: 'relative',
  },
  coverThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverThumbInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
    padding: '12px 8px 8px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  coverThumbBadge: {
    fontSize: '8px',
    fontWeight: '700',
    color: '#c084fc',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  applyCoverBtn: {
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    background: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
    color: '#c084fc',
  }
}

export default App