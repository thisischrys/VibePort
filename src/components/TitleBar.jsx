import React, { useEffect, useState, useRef } from 'react'
import {
  Sidebar, Plus, PlusSquare, FolderPlus, Search, X,
  Menu, ChevronRight, ChevronLeft, Loader2, Check
} from 'lucide-react'
import { styles } from '../theme/styles.js'

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
  showSearch,
  setShowSearch
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

  const renderPlusDropdown = () => (
    <div ref={plusContainerRef} style={{ position: 'relative' }}>
      <div
        className="header-action"
        style={{
          ...styles.actionIconContainer,
          backgroundColor: showPlusDropdown ? 'rgba(255,255,255,0.08)' : 'transparent',
          borderColor: showPlusDropdown ? 'rgba(192,132,252,0.35)' : 'transparent'
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
  )

  const renderRightControls = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' }}>
      {/* Search Toggle Button */}
      <div
        className="header-action"
        style={{
          ...styles.actionIconContainer,
          backgroundColor: showSearch ? 'rgba(255,255,255,0.08)' : 'transparent',
          borderColor: showSearch ? 'rgba(192,132,252,0.35)' : 'transparent'
        }}
        onClick={(e) => {
          e.stopPropagation()
          setShowSearch(!showSearch)
        }}
        title="Search Games"
      >
        <Search size={18} style={{ color: showSearch ? `#${accentHex}` : '#cbd5e1' }} />
      </div>

      {/* Main Menu Button */}
      <div ref={menuContainerRef} style={{ position: 'relative' }}>
        <div
          className="header-action"
          style={{
            ...styles.actionIconContainer,
            backgroundColor: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderColor: showMenu ? 'rgba(192,132,252,0.35)' : 'transparent'
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

      {/* Custom Window Controls */}
      <div style={styles.windowControls}>
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
  )

  const activeTitle = showHidden ? 'Hidden Games' : getSourceLabel(selectedSource)

  return (
    <div style={{
      ...styles.titlebar,
      backgroundColor: 'transparent',
      background: 'transparent',
      borderBottom: 'none',
      padding: 0,
      position: 'relative'
    }}>
      {showSidebar ? (
        // ─── STATE A: SIDEBAR OPEN ───
        <>
          {/* Sidebar part of the top bar (Left 260px) */}
          <div style={{
            width: '260px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            borderRight: '1px solid rgba(255, 255, 255, 0.04)',
            boxSizing: 'border-box',
            backgroundColor: 'var(--sidebar-bg, #12111b)',
            WebkitAppRegion: 'no-drag',
            position: 'relative'
          }}>
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
              <div
                className="header-action"
                style={styles.actionIconContainer}
                onClick={() => setShowSidebar(false)}
                title="Hide Sidebar"
              >
                <Sidebar size={18} style={styles.actionIcon} />
              </div>
            )}
            
            {/* Absolute Centered VibePort Logo in the Sidebar portion */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#f8fafc',
              letterSpacing: '-0.3px',
              WebkitAppRegion: 'drag'
            }}>
              VibePort
            </div>
          </div>

          {/* Main content part of the top bar (Remaining space) */}
          <div style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '16px',
            paddingRight: '10px',
            backgroundColor: 'var(--bg-deep, #08070d)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            {/* The + button aligns above the main content on the left of this part */}
            <div style={{ WebkitAppRegion: 'no-drag' }}>
              {!showHidden && renderPlusDropdown()}
            </div>

            {/* Centered active source name inside the main content part */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#cbd5e1',
              letterSpacing: '-0.3px',
              WebkitAppRegion: 'drag'
            }}>
              {activeTitle}
            </div>

            {/* Search, Menu, and Window Controls */}
            {renderRightControls()}
          </div>
        </>
      ) : (
        // ─── STATE B: SIDEBAR CLOSED ───
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-deep, #08070d)',
          paddingLeft: '16px',
          paddingRight: '10px',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {/* Left Controls (Toggle + Plus buttons next to each other) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            WebkitAppRegion: 'no-drag'
          }}>
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
                  onClick={() => setShowSidebar(true)}
                  title="Show Sidebar"
                >
                  <Sidebar size={18} style={styles.actionIcon} />
                </div>
                {renderPlusDropdown()}
              </>
            )}
          </div>

          {/* Centered active source name centered across the entire window */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '14.5px',
            fontWeight: '700',
            color: '#cbd5e1',
            letterSpacing: '-0.3px',
            WebkitAppRegion: 'drag'
          }}>
            {activeTitle}
          </div>

          {/* Search, Menu, and Window Controls (Pushed to far right) */}
          <div style={{ marginLeft: 'auto', WebkitAppRegion: 'no-drag' }}>
            {renderRightControls()}
          </div>
        </div>
      )}
    </div>
  )
}
