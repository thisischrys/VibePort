import { useState, useEffect, useCallback, useRef } from 'react'
import { IpcManager } from '../shared/IpcManager.js'
import { DEFAULT_ACCENT, applyAccentPalette, getDefaultAccent } from '../theme/accent.js'

export function useGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedSource, setSelectedSource] = useState('all')
  const [launchingGame, setLaunchingGame] = useState(null)
  const [failedCovers, setFailedCovers] = useState({})
  
  // Settings owned by main process
  const [settings, setSettings] = useState({
    use_windows_accent: true,
    exit_after_launch: false,
    auto_import: true,
    remove_uninstalled: true,
    scan_steam: true,
    scan_gog: true,
    scan_epic: true,
    scan_ea: true,
    scan_ubisoft: true,
    scan_bnet: true,
    scan_xbox: true,
    scan_amazon: true,
    cover_launches_game: true,
    sort_by: 'alphabetical',
    show_hidden: false,
    show_sidebar: true
  })

  // Theme mode
  const [themeMode, setThemeModeState] = useState('system') // 'system' | 'light' | 'dark'
  const [isDark, setIsDark] = useState(true)

  // Accent color Hex
  const [accentHex, setAccentHex] = useState(() => {
    let initialColor = DEFAULT_ACCENT
    const syncColor = IpcManager.getAccentColorSync()
    if (syncColor) initialColor = syncColor
    const clean = initialColor.replace('#', '')
    applyAccentPalette(clean, true) // default to dark on initial render
    return clean
  })

  // Toast
  const [activeToast, setActiveToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  const triggerToast = useCallback((message, type = 'info', buttonOptions = null) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    let btn = null
    if (buttonOptions === true) {
      btn = { label: 'Undo', onClick: handleUndo }
    } else if (buttonOptions && typeof buttonOptions === 'object') {
      btn = { label: buttonOptions.label, onClick: buttonOptions.onClick }
    }
    setActiveToast({ message, type, button: btn })
  }, [])

  const dismissToast = useCallback(() => {
    setActiveToast(null)
  }, [])

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [preferencesInitialTab, setPreferencesInitialTab] = useState('general')
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [isStandaloneShortcutsOpen, setIsStandaloneShortcutsOpen] = useState(false)
  // Scanning progress
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState('import') // 'import' | 'folder'
  const [isCoverDownloading, setIsCoverDownloading] = useState(false)
  const [coverDownloadProgress, setCoverDownloadProgress] = useState({ current: 0, total: 0 })
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 100, message: '' })

  // Editing form states
  const [editingGame, setEditingGame] = useState(null)
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

  // Context menu
  const [activeMenuGameId, setActiveMenuGameId] = useState(null)

  // Layout options backed by settings.json
  const [sortBy, setSortByState] = useState('alphabetical')
  const [showHidden, setShowHiddenState] = useState(false)
  const [showSidebar, setShowSidebarState] = useState(true)

  // Details panel
  const [viewState, setViewState] = useState('grid') // 'grid' | 'details'
  const [selectedGame, setSelectedGame] = useState(null)
  const [detailsDropdownOpen, setDetailsDropdownOpen] = useState(false)
  const [detailsGradient, setDetailsGradient] = useState('')

  // Refs for undo
  const lastDeletedGameRef = useRef(null)
  const lastDeletedGamesListRef = useRef(null)
  const lastImportedGamesListRef = useRef(null)
  const lastToggledHideGameRef = useRef(null)

  // Fetch games
  const fetchGames = useCallback(async () => {
    try {
      const data = await IpcManager.getGames()
      setGames(data.map(g => g.source === 'manual' ? { ...g, source: 'imported' } : g))
      setFailedCovers({}) // Reset failed covers on fetch
    } catch (e) {
      console.error('Failed to fetch games:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load settings initially
  useEffect(() => {
    IpcManager.getSettings().then(data => {
      if (data) {
        setSettings(data)
        if (data.sort_by !== undefined) setSortByState(data.sort_by)
        if (data.show_hidden !== undefined) setShowHiddenState(data.show_hidden)
        if (data.show_sidebar !== undefined) setShowSidebarState(data.show_sidebar)
        if (data.theme_mode) setThemeModeState(data.theme_mode)

        // Get OS theme state and apply
        IpcManager.getNativeTheme().then(osIsDark => {
          const resolvedDark = data.theme_mode === 'light' ? false :
                               data.theme_mode === 'dark' ? true : osIsDark
          setIsDark(resolvedDark)
          document.documentElement.setAttribute('data-theme', resolvedDark ? 'dark' : 'light')
          const clean = (data.use_windows_accent 
            ? (accentHex || getDefaultAccent(resolvedDark)) 
            : (data.custom_accent_color || getDefaultAccent(resolvedDark))
          ).replace('#', '')
          setAccentHex(clean)
          applyAccentPalette(clean, resolvedDark)
        }).catch(console.error)
      }
    }).catch(console.error)
  }, [])

  // Save settings helper
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const merged = await IpcManager.saveSettings(newSettings)
      setSettings(merged)

      // Handle theme mode change
      if (newSettings.theme_mode !== undefined) {
        setThemeModeState(newSettings.theme_mode)
        const osIsDark = await IpcManager.setThemeMode(newSettings.theme_mode)
        const resolvedDark = newSettings.theme_mode === 'light' ? false :
                             newSettings.theme_mode === 'dark' ? true : osIsDark
        setIsDark(resolvedDark)
        document.documentElement.setAttribute('data-theme', resolvedDark ? 'dark' : 'light')
        // Re-apply accent for new mode
        const currentAccent = merged.use_windows_accent 
          ? (accentHex || getDefaultAccent(resolvedDark)) 
          : (merged.custom_accent_color || getDefaultAccent(resolvedDark))
        const clean = currentAccent.replace('#', '')
        setAccentHex(clean)
        applyAccentPalette(clean, resolvedDark)
      }

      if (newSettings.use_windows_accent !== undefined) {
        const syncColor = IpcManager.getAccentColorSync()
        const clean = (newSettings.use_windows_accent 
          ? (syncColor || getDefaultAccent(isDark)) 
          : (merged.custom_accent_color || getDefaultAccent(isDark))
        ).replace('#', '')
        setAccentHex(clean)
        applyAccentPalette(clean, isDark)
      }

      if (newSettings.custom_accent_color !== undefined) {
        const clean = newSettings.custom_accent_color.replace('#', '')
        setAccentHex(clean)
        applyAccentPalette(clean, isDark)
      }
      return merged
    } catch (e) {
      console.error('Failed to update settings:', e)
    }
  }, [accentHex, isDark])

  const setSortBy = useCallback((val) => {
    setSortByState(val)
    updateSettings({ sort_by: val })
  }, [updateSettings])

  const setShowHidden = useCallback((val) => {
    setShowHiddenState(val)
    updateSettings({ show_hidden: val })
  }, [updateSettings])

  const setShowSidebar = useCallback((val) => {
    setShowSidebarState(val)
    updateSettings({ show_sidebar: val })
  }, [updateSettings])

  // Toast timer
  useEffect(() => {
    if (!activeToast) return
    toastTimeoutRef.current = setTimeout(() => setActiveToast(null), 5000)
    return () => clearTimeout(toastTimeoutRef.current)
  }, [activeToast])

  // Accent listener
  useEffect(() => {
    const applyColor = (hex) => {
      if (settings.use_windows_accent) {
        const clean = (hex || getDefaultAccent(isDark)).replace('#', '')
        setAccentHex(clean)
        applyAccentPalette(clean, isDark)
      }
    }
    const unsub = IpcManager.onAccentColorChanged(applyColor)
    return () => { if (unsub) unsub() }
  }, [settings.use_windows_accent, isDark])

  // OS theme change listener (fires when system switches light/dark)
  useEffect(() => {
    const handleThemeChange = (osIsDark) => {
      if (themeMode === 'system') {
        setIsDark(osIsDark)
        document.documentElement.setAttribute('data-theme', osIsDark ? 'dark' : 'light')
        const accent = settings.use_windows_accent 
          ? accentHex 
          : (settings.custom_accent_color || getDefaultAccent(osIsDark))
        const clean = accent.replace('#', '')
        setAccentHex(clean)
        applyAccentPalette(clean, osIsDark)
      }
    }
    const unsub = IpcManager.onThemeChanged(handleThemeChange)
    return () => { if (unsub) unsub() }
  }, [themeMode, settings.use_windows_accent, accentHex, settings.custom_accent_color])

  // Shortcuts status
  useEffect(() => {
    const unsub = IpcManager.onShortcutsWindowStatus((isOpen) => {
      setIsStandaloneShortcutsOpen(isOpen)
    })
    return () => { if (unsub) unsub() }
  }, [])

  // IPC listeners
  useEffect(() => {
    const subs = [
      IpcManager.onGamesUpdated(fetchGames),
      IpcManager.onShowToast((d) => { if (d?.message) triggerToast(d.message, d.type) }),
      IpcManager.onScanProgress((progress) => {
        setScanProgress(progress)
        if (progress.active !== undefined) setIsScanning(progress.active)
        if (progress.mode) setScanMode(progress.mode)
      }),
      IpcManager.onCoverDownloadStatus((status) => {
        setIsCoverDownloading(status.active)
        setCoverDownloadProgress(status)
      })
    ]
    return () => subs.forEach(fn => fn())
  }, [fetchGames, triggerToast])

  // details panel gradient color extractor
  useEffect(() => {
    if (!selectedGame) {
      setDetailsGradient('')
      return
    }

    const defaultGrad = isDark
      ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(8, 7, 13, 0.7) 100%), linear-gradient(135deg, var(--accent-bg-faint, #1e092b) 0%, var(--bg-deep, #08070d) 100%)`
      : `linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, rgba(250, 250, 250, 0.8) 100%), linear-gradient(135deg, var(--accent-bg-faint, #f0e8f4) 0%, var(--bg-deep, #fafafa) 100%)`
    setDetailsGradient(defaultGrad)

    if (!selectedGame.coverUrl) {
      return
    }

    let active = true
    let objectUrl = null

    fetch(selectedGame.coverUrl)
      .then(res => res.blob())
      .then(blob => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          if (!active) {
            URL.revokeObjectURL(objectUrl)
            return
          }
          try {
            const canvas = document.createElement('canvas')
            canvas.width = 4
            canvas.height = 6
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Could not get canvas context')
            ctx.drawImage(img, 0, 0, 4, 6)
            const data = ctx.getImageData(0, 0, 4, 6).data
            
            const getRowAverage = (rowY) => {
              let rSum = 0, gSum = 0, bSum = 0
              const width = 4
              for (let x = 0; x < width; x++) {
                const idx = (rowY * width + x) * 4
                rSum += data[idx]
                gSum += data[idx + 1]
                bSum += data[idx + 2]
              }
              return `rgb(${Math.round(rSum / width)}, ${Math.round(gSum / width)}, ${Math.round(bSum / width)})`
            }
            
            const topColor = getRowAverage(0)
            const midColor = getRowAverage(3)
            const bottomColor = getRowAverage(5)
            
            const gradient = isDark
              ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(8, 7, 13, 0.7) 100%), linear-gradient(135deg, ${topColor} 0%, ${midColor} 50%, ${bottomColor} 100%)`
              : `linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, rgba(250, 250, 250, 0.8) 100%), linear-gradient(135deg, ${topColor} 0%, ${midColor} 50%, ${bottomColor} 100%)`
            setDetailsGradient(gradient)
          } catch (e) {
            console.warn('Failed to extract cover colors for gradient:', e)
          } finally {
            URL.revokeObjectURL(objectUrl)
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
        }
        img.src = objectUrl
      })
      .catch(err => {
        console.warn('Failed to fetch cover blob for color extraction:', err)
      })

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [selectedGame, isDark])

  // Actions / Handlers

  const handleUndo = useCallback(() => {
    if (lastImportedGamesListRef.current) {
      const gamesToRestore = lastImportedGamesListRef.current
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null

      triggerToast('Undoing library import...', 'info')
      
      IpcManager.undoImport(gamesToRestore).then(success => {
        if (success) {
          triggerToast('Library import undone successfully!', 'success')
          fetchGames()
        } else {
          triggerToast('Failed to undo library import.', 'error')
        }
      }).catch(err => {
        console.error(err)
        triggerToast('Failed to undo import', 'error')
      })
    } else if (lastDeletedGamesListRef.current && lastDeletedGamesListRef.current.length > 0) {
      const gamesToRestore = lastDeletedGamesListRef.current
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null

      triggerToast(`Restoring ${gamesToRestore.length} games...`, 'info')
      
      const promises = gamesToRestore.map(game => {
        const { coverUrl, ...cleanGame } = game
        return IpcManager.saveGame(cleanGame)
      })
      
      Promise.all(promises).then(results => {
        const successCount = results.filter(r => r.success).length
        triggerToast(`Successfully restored ${successCount} games!`, 'success')
        fetchGames()
      }).catch(err => {
        console.error(err)
        triggerToast('Failed to restore games', 'error')
      })
    } else if (lastDeletedGameRef.current) {
      const game = lastDeletedGameRef.current
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null

      const { coverUrl, ...cleanGame } = game
      IpcManager.saveGame(cleanGame).then(res => {
        if (res.success) {
          triggerToast(`Restored game "${game.name}"`, 'success')
          fetchGames()
        } else {
          triggerToast('Failed to restore game', 'error')
        }
      }).catch(console.error)
    } else if (lastToggledHideGameRef.current) {
      const { game_id, wasHidden } = lastToggledHideGameRef.current
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null
      lastToggledHideGameRef.current = null

      triggerToast(wasHidden ? 'Hiding game...' : 'Unhiding game...', 'info')
      IpcManager.updateGameStatus(game_id, { hidden: wasHidden }).then(res => {
        triggerToast(wasHidden ? 'Game hidden' : 'Game unhidden', 'success')
        fetchGames()
      }).catch(err => {
        console.error(err)
        triggerToast('Failed to undo visibility change', 'error')
      })
    } else {
      triggerToast('Nothing to undo!', 'info')
    }
  }, [fetchGames, triggerToast])

  const openDetailsView = useCallback((game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    setSelectedGame(game)
    setViewState('details')
    setDetailsDropdownOpen(false)
  }, [])

  const closeDetailsView = useCallback(() => {
    setViewState('grid')
    setDetailsDropdownOpen(false)
    setTimeout(() => setSelectedGame(null), 300)
  }, [])

  const handleLaunch = useCallback(async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    if (launchingGame) return
    setLaunchingGame(game.name)
    try {
      await IpcManager.launchGame(game.executable)
      triggerToast(`${game.name} launched`, 'success')
      try { await IpcManager.updateGameStatus(game.game_id, { last_played: Math.floor(Date.now() / 1000) }) } catch { /* non-fatal */ }
      
      if (settings.exit_after_launch) {
        setTimeout(() => {
          IpcManager.closeWindow()
        }, 1200)
      }

      setLaunchingGame(null)
    } catch (err) {
      console.error('Failed to launch game:', err)
      triggerToast(`Failed to launch ${game.name}`, 'error')
      setLaunchingGame(null)
    }
  }, [launchingGame, settings.exit_after_launch, triggerToast])

  const handleToggleHideGame = useCallback(async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    try {
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null
      lastToggledHideGameRef.current = { game_id: game.game_id, wasHidden: game.hidden }

      await IpcManager.updateGameStatus(game.game_id, { hidden: !game.hidden })
      triggerToast(game.hidden ? `"${game.name}" unhidden.` : `"${game.name}" hidden.`, 'info', true)
      await fetchGames()
      
      if (viewState === 'details' && selectedGame?.game_id === game.game_id) {
        closeDetailsView()
      }
    } catch (e) { console.error('Failed to toggle hide:', e) }
  }, [fetchGames, viewState, selectedGame, closeDetailsView, triggerToast])

  const handleDeleteGame = useCallback(async (game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    try {
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = game
      lastToggledHideGameRef.current = null
      await IpcManager.deleteGame(game.game_id)
      triggerToast(`${game.name} removed`, 'info', true)
      await fetchGames()

      if (viewState === 'details' && selectedGame?.game_id === game.game_id) {
        closeDetailsView()
      }
    } catch (e) { console.error('Failed to delete game:', e) }
  }, [fetchGames, viewState, selectedGame, closeDetailsView, triggerToast])

  const handleImageError = useCallback((id) => {
    setFailedCovers(p => ({ ...p, [id]: true }))
  }, [])

  const handleRemoveAllGames = useCallback(async (customTriggerToast) => {
    const toast = typeof customTriggerToast === 'function' ? customTriggerToast : triggerToast
    try {
      lastImportedGamesListRef.current = null
      lastDeletedGamesListRef.current = [...games]
      lastDeletedGameRef.current = null
      lastToggledHideGameRef.current = null
      
      toast('Removing all games...', 'info')
      await IpcManager.removeAllGames()
      toast('All games removed.', 'success', true)
      await fetchGames()
    } catch (e) {
      console.error('Failed to remove all games:', e)
      toast('Failed to remove some games.', 'error')
    }
  }, [games, fetchGames, triggerToast])

  const openPreferences = useCallback((tab = 'general') => {
    setPreferencesInitialTab(tab)
    setShowPreferencesModal(true)
  }, [])

  const handleRunAutoScan = useCallback(async () => {
    const enabledLaunchers = {
      steam: settings.scan_steam,
      gog: settings.scan_gog,
      epic: settings.scan_epic,
      ea: settings.scan_ea,
      ubisoft: settings.scan_ubisoft,
      bnet: settings.scan_bnet,
      xbox: settings.scan_xbox,
      amazon: settings.scan_amazon
    }

    lastImportedGamesListRef.current = [...games]
    lastDeletedGamesListRef.current = null
    lastDeletedGameRef.current = null
    lastToggledHideGameRef.current = null

    setScanProgress({ current: 0, total: 100, message: '' })
    setScanMode('import')
    setIsScanning(true)
    try {
      const res = await IpcManager.runAutoScan(enabledLaunchers)
      setIsScanning(false)
      await new Promise(resolve => setTimeout(resolve, 350))
      if (res.success) {
        const data = await IpcManager.getGames()
        const updatedGames = data.map(g => g.source === 'manual' ? { ...g, source: 'imported' } : g)
        setGames(updatedGames)

        const importedCount = res.importedCount ?? 0
        const removedCount = res.removedCount ?? 0

        if (importedCount === 0 && removedCount === 0) {
          triggerToast('No new games found', 'info', {
            label: 'Preferences',
            onClick: () => openPreferences('import')
          })
        } else {
          let msg = ''
          if (importedCount > 0) {
            msg += `${importedCount} ${importedCount === 1 ? 'game' : 'games'} imported`
          }
          if (removedCount > 0) {
            if (msg) msg += ', '
            msg += `${removedCount} removed`
          }
          triggerToast(msg, 'success', true)
        }
      } else {
        triggerToast(`Import failed: ${res.error}`, 'error')
      }
    } catch (e) {
      console.error('Auto scan error:', e)
      setIsScanning(false)
      triggerToast('An error occurred during library scanning.', 'error')
    }
  }, [games, settings, openPreferences, triggerToast])

  const handleToggleWindowsAccent = useCallback((enabled) => {
    updateSettings({ use_windows_accent: enabled })
  }, [updateSettings])

  const handleUpdateAllCovers = useCallback(async (customTriggerToast) => {
    const toast = typeof customTriggerToast === 'function' ? customTriggerToast : triggerToast
    toast('Downloading covers…', 'info')
    try {
      const res = await IpcManager.updateAllCovers()
      if (res.success) {
        toast('Covers updated', 'success')
      } else {
        toast('Failed to trigger cover update.', 'error')
      }
    } catch (e) {
      console.error('Covers update error:', e)
      toast('Failed to run covers update.', 'error')
    }
  }, [triggerToast])

  const resetForm = useCallback(() => {
    setFormName(''); setFormExecutable(''); setFormDeveloper(''); setFormCoverUrl('')
    setSgdbSearchQuery(''); setSgdbGames([]); setSelectedSgdbGame(null); setSgdbCovers([])
  }, [])

  const openAddModal = useCallback(() => { resetForm(); setShowAddModal(true) }, [resetForm])

  const handleOpenShortcuts = useCallback(() => {
    if (IpcManager.supportsShortcutsWindow()) {
      IpcManager.openShortcutsWindow()
      setIsStandaloneShortcutsOpen(true)
    } else {
      setShowShortcutsModal(true)
    }
  }, [])

  const openEditModal = useCallback((game, e) => {
    if (e?.stopPropagation) e.stopPropagation()
    resetForm()
    setEditingGame(game)
    setFormName(game.name); setFormExecutable(game.executable)
    setFormDeveloper(game.developer || ''); setFormCoverUrl(game.coverUrl || '')
    setShowEditModal(true)
  }, [resetForm])

  const handleAddGameSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) return triggerToast('Title and Executable Path are required!', 'error')
    try {
      const result = await IpcManager.saveGame({ name: formName, executable: formExecutable, developer: formDeveloper || null, source: 'imported', hidden: false })
      if (result.success) {
        if (formCoverUrl) await IpcManager.downloadCoverUrl(result.game.game_id, formCoverUrl)
        await fetchGames(); setShowAddModal(false); resetForm()
      } else {
        triggerToast('Error: ' + result.error, 'error')
      }
    } catch (e) { console.error('Failed to add game:', e) }
  }, [formName, formExecutable, formDeveloper, formCoverUrl, fetchGames, resetForm, triggerToast])

  const handleEditGameSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!formName || !formExecutable) return triggerToast('Title and Executable are required!', 'error')
    try {
      const result = await IpcManager.saveGame({ game_id: editingGame.game_id, name: formName, executable: formExecutable, developer: formDeveloper || null, source: editingGame.source || 'imported' })
      if (result.success) {
        if (formCoverUrl !== editingGame.coverUrl) await IpcManager.downloadCoverUrl(editingGame.game_id, formCoverUrl)
        await fetchGames(); setShowEditModal(false); resetForm()
      } else {
        triggerToast('Error: ' + result.error, 'error')
      }
    } catch (e) { console.error('Failed to update game:', e) }
  }, [editingGame, formName, formExecutable, formDeveloper, formCoverUrl, fetchGames, resetForm, triggerToast])

  const handleScanGamesFolder = useCallback(async () => {
    try {
      const folderPath = await IpcManager.selectFolder()
      if (!folderPath) return

      lastImportedGamesListRef.current = [...games]
      lastDeletedGamesListRef.current = null
      lastDeletedGameRef.current = null
      lastToggledHideGameRef.current = null

      setScanProgress({ current: 0, total: 100, message: '' })
      setScanMode('folder')
      setIsScanning(true)
      const result = await IpcManager.scanFolder(folderPath)
      setIsScanning(false)
      await new Promise(resolve => setTimeout(resolve, 350))
      if (result.success) {
        if (result.count === 0) {
          triggerToast('No new games found', 'info', {
            label: 'Preferences',
            onClick: () => openPreferences('import')
          })
        } else {
          triggerToast(`${result.count} ${result.count === 1 ? 'game' : 'games'} imported`, 'success', true)
        }
        await fetchGames()
      } else {
        triggerToast(`Scan failed: ${result.error}`, 'error')
      }
    } catch (e) {
      console.error('Scan error:', e); setIsScanning(false)
      triggerToast('An error occurred during directory scanning.', 'error')
    }
  }, [games, openPreferences, fetchGames, triggerToast])

  const handleSgdbSearch = useCallback(async () => {
    if (!sgdbSearchQuery) return
    setSgdbSearching(true); setSelectedSgdbGame(null); setSgdbCovers([])
    try { setSgdbGames(await IpcManager.searchSteamGridDB(sgdbSearchQuery)) } catch (e) { triggerToast('Search failed: ' + e.message, 'error') } finally { setSgdbSearching(false) }
  }, [sgdbSearchQuery, triggerToast])

  const handleSgdbSelectGame = useCallback(async (game) => {
    setSelectedSgdbGame(game); setSgdbCoversLoading(true)
    try { setSgdbCovers(await IpcManager.fetchSteamGridDBCovers(game.id)) } catch (e) { triggerToast('Failed to retrieve covers: ' + e.message, 'error') } finally { setSgdbCoversLoading(false) }
  }, [triggerToast])

  const handleSgdbDownloadCover = useCallback(async (coverUrl, coverId) => {
    if (editingGame) {
      setDownloadingCoverId(coverId)
      try {
        const result = await IpcManager.downloadCoverUrl(editingGame.game_id, coverUrl)
        if (result.success) { setFormCoverUrl(result.coverUrl); setFailedCovers(p => ({ ...p, [editingGame.game_id]: false })) }
        else triggerToast('Failed to apply cover: ' + result.error, 'error')
      } catch (e) { console.error('Cover download error:', e) } finally { setDownloadingCoverId(null) }
    } else {
      setFormCoverUrl(coverUrl)
      triggerToast('Cover selected! It will be downloaded when you save the game.', 'info')
    }
  }, [editingGame, triggerToast])

  const handleSearchOn = useCallback((baseUrl) => {
    if (selectedGame?.name) {
      const sanitizedQuery = selectedGame.name
        .replace(/[-:_!@#$%^&*()_+={}\[\]|\\;'"<>,.?/~`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const url = `${baseUrl}${encodeURIComponent(sanitizedQuery)}`
      IpcManager.openExternalUrl(url)
      setDetailsDropdownOpen(false)
    }
  }, [selectedGame])

  return {
    games,
    loading,
    searchTerm, setSearchTerm,
    showSearch, setShowSearch,
    selectedSource, setSelectedSource,
    launchingGame,
    failedCovers,
    settings, updateSettings,
    accentHex,
    themeMode, setThemeMode: (mode) => updateSettings({ theme_mode: mode }),
    isDark,
    activeToast, triggerToast, dismissToast,
    showAddModal, setShowAddModal,
    showEditModal, setShowEditModal,
    showAboutModal, setShowAboutModal,
    showPreferencesModal, setShowPreferencesModal,
    preferencesInitialTab, setPreferencesInitialTab,
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
    sgdbSearchQuery, setSgdbSearchQuery,
    sgdbGames,
    sgdbSearching,
    selectedSgdbGame,
    sgdbCovers,
    sgdbCoversLoading,
    downloadingCoverId,
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
    handleSgdbSearch,
    handleSgdbSelectGame,
    handleSgdbDownloadCover,
    openDetailsView,
    closeDetailsView,
    handleSearchOn
  }
}
