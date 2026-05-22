import React, { useEffect, useState, useRef } from 'react'
import {
  Sidebar, Plus, PlusSquare, FolderPlus, Search, X,
  Menu, ChevronRight, ChevronLeft, Loader2, Check
} from 'lucide-react'
import { styles } from '../theme/styles.js'
import CartridgeIcon from './CartridgeIcon.jsx'

const SORT_OPTIONS = [
  { label: 'A-Z', value: 'alphabetical' },
  { label: 'Z-A', value: 'z_to_a' },
  { label: 'Newest', value: 'added' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Last Played', value: 'last_played' }
]

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

export const TitleBar = ({
  accentHex,
  searchTerm,
  setSearchTerm,
  selectedSource,
  showSidebar,
  setShowSidebar,
  showHidden,
  setShowHidden,
  isScanning,
  handleScanGamesFolder,
  openAddModal,
  sortBy,
  setSortBy,
  setShowSettingsModal,
  setShowShortcutsModal,
  setShowAboutModal
}) => {
  // Window State
  const [isMaximized, setIsMaximized] = useState(false)

  // Local Dropdown & Popover States
  const [showPlusDropdown, setShowPlusDropdown] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPanel, setMenuPanel] = useState('main')

  const plusContainerRef = useRef(null)
  const menuContainerRef = useRef(null)

  // Subscribe to Electron window events
  useEffect(() => {
    if (window.api?.isMaximized) {
      window.api.isMaximized().then(setIsMaximized).catch(console.error)
    }

    if (window.api?.onWindowStateChanged) {
      const unsub = window.api.onWindowStateChanged((isMax) => {
        setIsMaximized(isMax)
      })
      return () => unsub()
    }
  }, [])

  // Handle outside clicks to close popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPlusDropdown && plusContainerRef.current && !plusContainerRef.current.contains(e.target)) {
        setShowPlusDropdown(false)
      }
      if (showMenu && menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [showPlusDropdown, showMenu])

  return (
    <div style={styles.titlebar}>
      {/* ── Left Section ── */}
      <div style={styles.titlebarLeft}>
        {showHidden ? (
          <div
            className="header-action"
            style={styles.actionIconContainer}
            onClick={() => setShowHidden(false)}
            title="Back to Library"
          >
            <ChevronLeft size={18} style={styles.actionIcon} />
          </div>
        ) : (
          <>
            <div
              className="header-action"
              style={styles.actionIconContainer}
              onClick={() => setShowSidebar(!showSidebar)}
              title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Sidebar size={18} style={styles.actionIcon} />
            </div>

            {/* VibePort Brand */}
            <div style={styles.titlebarBrand}>
              <CartridgeIcon size={16} color={`#${accentHex}`} />
              <span style={styles.titlebarBrandText}>VibePort</span>
            </div>

            {/* Add Game Plus Dropdown */}
            <div ref={plusContainerRef} style={{ position: 'relative' }}>
              <div
                className="header-action"
                style={{
                  ...styles.actionIconContainer,
                  backgroundColor: showPlusDropdown ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderColor: showPlusDropdown ? 'rgba(192,132,252,0.35)' : 'rgba(255,255,255,0.04)'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPlusDropdown(!showPlusDropdown)
                }}
                title="Add Options"
              >
                {isScanning ? (
                  <Loader2 size={18} style={{ color: `#${accentHex}`, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Plus size={18} style={{ color: showPlusDropdown ? `#${accentHex}` : '#cbd5e1' }} />
                )}
              </div>

              {showPlusDropdown && (
                <div className="gtk-popover-container" style={styles.popoverLeft}>
                  <div style={styles.popoverArrowLeft} />
                  <div style={styles.popoverContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div
                        className="gtk-menu-item"
                        style={styles.popoverItem}
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddModal()
                          setShowPlusDropdown(false)
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                            <PlusSquare size={16} color={`#${accentHex}`} />
                          </div>
                          <span>Add Custom Game</span>
                        </div>
                      </div>
                      <div
                        className="gtk-menu-item"
                        style={styles.popoverItem}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScanGamesFolder()
                          setShowPlusDropdown(false)
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                            <FolderPlus size={16} color={`#${accentHex}`} />
                          </div>
                          <span>Scan Games Folder</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Center Section: Permanent Search or View Title ── */}
      <div style={styles.titlebarCenter}>
        <div style={styles.titlebarSearchInner}>
          <Search size={15} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={showHidden ? "Search hidden games..." : `Search ${getSourceLabel(selectedSource).toLowerCase()}...`}
            className="search-input-focus"
            style={styles.titlebarSearchInput}
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
      </div>

      {/* ── Right Section ── */}
      <div style={styles.titlebarRight}>
        {/* Main Menu Button */}
        <div ref={menuContainerRef} style={{ position: 'relative' }}>
          <div
            className="header-action"
            style={{
              ...styles.actionIconContainer,
              backgroundColor: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: showMenu ? 'rgba(192,132,252,0.35)' : 'rgba(255,255,255,0.04)'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
              setMenuPanel('main')
            }}
            title="Main Menu"
          >
            <Menu size={18} style={{ color: showMenu ? `#${accentHex}` : '#cbd5e1' }} />
          </div>

          {showMenu && (
            <div className="gtk-popover-container" style={styles.popover}>
              <div style={styles.popoverArrow} />
              <div style={styles.popoverContent}>
                {menuPanel === 'main' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div
                      className="gtk-menu-item"
                      style={styles.popoverItem}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuPanel('sort')
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px' }} />
                        <span>Sort</span>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" />
                    </div>
                    <div
                      className="gtk-menu-item"
                      style={styles.popoverItem}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowHidden(!showHidden)
                        setShowMenu(false)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                          {showHidden && <Check size={14} color={`#${accentHex}`} strokeWidth={2.5} />}
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
                        e.stopPropagation()
                        setShowSettingsModal(true)
                        setShowMenu(false)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px' }} />
                        <span>Preferences</span>
                      </div>
                      <span style={styles.popoverShortcut}>Ctrl+,</span>
                    </div>
                    <div
                      className="gtk-menu-item"
                      style={styles.popoverItem}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowShortcutsModal(true)
                        setShowMenu(false)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px' }} />
                        <span>Keyboard Shortcuts</span>
                      </div>
                      <span style={styles.popoverShortcut}>Ctrl+?</span>
                    </div>
                    <div
                      className="gtk-menu-item"
                      style={styles.popoverItem}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAboutModal(true)
                        setShowMenu(false)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px' }} />
                        <span>About VibePort</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div
                      className="gtk-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        gap: '8px',
                        transition: 'all 0.15s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuPanel('main')
                      }}
                    >
                      <ChevronLeft size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#f8fafc' }}>Sort</span>
                    </div>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.value
                      return (
                        <div
                          key={opt.value}
                          className="gtk-menu-item"
                          style={{
                            ...styles.popoverItem,
                            justifyContent: 'flex-start',
                            gap: '10px',
                            color: isSelected ? `#${accentHex}` : '#cbd5e1'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSortBy(opt.value)
                            setShowMenu(false)
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              border: `1.5px solid ${isSelected ? `#${accentHex}` : 'rgba(255,255,255,0.2)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isSelected ? 'var(--accent-bg-faint)' : 'transparent',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isSelected && (
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: `#${accentHex}`
                                }}
                              />
                            )}
                          </div>
                          <span>{opt.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Custom Window Controls ── */}
        <div style={styles.windowControls}>
          {/* Minimize */}
          <button
            className="window-control-btn"
            style={styles.windowBtn}
            onClick={() => window.api?.minimizeWindow()}
            title="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="4.5" width="10" height="1" fill="currentColor"/>
            </svg>
          </button>

          {/* Maximize / Restore */}
          <button
            className="window-control-btn"
            style={styles.windowBtn}
            onClick={() => window.api?.maximizeWindow()}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 1H9V7H8V8H10V0H2V2H3V1ZM7 3H1V9H7V3ZM0 2V10H8V2H0ZM6 8H2V4H6V8Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            className="window-control-btn close"
            style={styles.windowBtn}
            onClick={() => window.api?.closeWindow()}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
