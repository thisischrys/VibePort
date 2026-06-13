import React, { useEffect, useState, useRef } from 'react'
import {
  Plus, PlusSquare, FolderPlus, Search, X,
  Menu, ChevronRight, ChevronLeft, Loader2, Check, Info
} from 'lucide-react'
import { styles } from '../theme/styles.js'
import { IpcManager } from '../shared/IpcManager.js'

// Shaded sidebar toggle icon reminiscent of the app window
const Sidebar = ({ size = 18, style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-sidebar"
    style={style}
  >
    {/* Shaded left portion representing the sidebar */}
    <path
      d="M 5 3 H 9 V 21 H 5 A 2 2 0 0 1 3 19 V 5 A 2 2 0 0 1 5 3 Z"
      fill="currentColor"
      opacity="0.55"
      stroke="none"
    />
    {/* Outline frame */}
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
)

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
  viewState,
  closeDetailsView,
  selectedGameName,
  searchTerm,
  setSearchTerm,
  selectedSource,
  showSidebar,
  setShowSidebar,
  showHidden,
  setShowHidden,
  isScanning,
  isCoverDownloading,
  coverDownloadProgress,
  handleScanGamesFolder,
  openAddModal,
  sortBy,
  setSortBy,
  showSearch,
  setShowSearch,
  openAboutModal,
  openPreferencesModal,
  openShortcutsModal,
  handleRunAutoScan
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
    IpcManager.isMaximized().then(setIsMaximized).catch(console.error)

    const unsub = IpcManager.onWindowStateChanged((isMax) => {
      setIsMaximized(isMax)
    })
    return () => { if (unsub) unsub() }
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
          backgroundColor: showPlusDropdown ? '#3a3a3c' : 'transparent',
          borderColor: 'transparent',
          borderRadius: '8px',
          transition: 'all 0.15s ease'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (showMenu) {
            setShowMenu(false)
          } else {
            setShowPlusDropdown(!showPlusDropdown)
          }
        }}
        title="Add Games"
      >
        {isScanning ? (
          <Loader2 size={18} style={{ color: '#ffffff', animation: 'spin 1s linear infinite' }} />
        ) : isCoverDownloading ? (
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="9"
              cy="9"
              r="7"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="2"
              fill="transparent"
            />
            <circle
              cx="9"
              cy="9"
              r="7"
              stroke="var(--accent, #ffffff)"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={43.98}
              strokeDashoffset={
                coverDownloadProgress?.total > 0
                  ? 43.98 * (1 - (coverDownloadProgress.current || 0) / coverDownloadProgress.total)
                  : 43.98
              }
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        ) : (
          <Plus size={18} style={{ color: '#ffffff' }} />
        )}
      </div>

      {showPlusDropdown && (
        <div className="gtk-popover-container" style={{
          ...styles.popoverLeft,
          left: '-10px',
          top: '44px'
        }}>
          <div style={{
            ...styles.popoverArrowLeft,
            left: '24px'
          }} />
          <div style={styles.popoverContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                className="gtk-menu-item"
                style={{
                  ...styles.popoverItem,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  openAddModal()
                  setShowPlusDropdown(false)
                }}
              >
                <span>Add Game</span>
                <span style={styles.popoverShortcut}>Ctrl+N</span>
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
                <span>Scan Games</span>
                <span style={styles.popoverShortcut}>Ctrl+G</span>
              </div>
              <div style={styles.popoverSeparator} />
              <div
                className="gtk-menu-item"
                style={styles.popoverItem}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRunAutoScan()
                  setShowPlusDropdown(false)
                }}
              >
                <span>Import</span>
                <span style={styles.popoverShortcut}>Ctrl+I</span>
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
          borderColor: 'transparent',
          borderRadius: '8px',
          transition: 'all 0.15s ease'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (showPlusDropdown || showMenu) {
            setShowPlusDropdown(false)
            setShowMenu(false)
          } else {
            setShowSearch(!showSearch)
          }
        }}
        title="Search"
      >
        <Search size={18} style={{ color: showSearch ? '#ffffff' : '#cbd5e1' }} />
      </div>

      {/* Main Menu Button */}
      <div ref={menuContainerRef} style={{ position: 'relative' }}>
        <div
          className="header-action"
          style={{
            ...styles.actionIconContainer,
            backgroundColor: showMenu ? '#3a3a3c' : 'transparent',
            borderColor: 'transparent',
            borderRadius: '8px',
            transition: 'all 0.15s ease'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (showPlusDropdown) {
              setShowPlusDropdown(false)
            } else {
              setShowMenu(!showMenu)
              setMenuPanel('main')
            }
          }}
          title="Main Menu"
        >
          <Menu size={18} style={{ color: '#ffffff' }} />
        </div>

        {showMenu && (
          <div className="gtk-popover-container" style={{
            ...styles.popover,
            right: '-10px',
            top: '44px'
          }}>
            <div style={{
              ...styles.popoverArrow,
              right: '24px'
            }} />
            <div style={styles.popoverContent}>
              {menuPanel === 'main' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    className="gtk-menu-item"
                    style={{
                      ...styles.popoverItem,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuPanel('sort')
                    }}
                  >
                    <span>Sort</span>
                    <ChevronRight size={14} color="#8e8e93" />
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
                    <span>Show Hidden</span>
                    <span style={styles.popoverShortcut}>Ctrl+H</span>
                  </div>
                  <div style={styles.popoverSeparator} />
                  <div
                    className="gtk-menu-item"
                    style={styles.popoverItem}
                    onClick={(e) => {
                      e.stopPropagation()
                      openPreferencesModal()
                      setShowMenu(false)
                    }}
                  >
                    <span>Preferences</span>
                    <span style={styles.popoverShortcut}>Ctrl+,</span>
                  </div>
                  <div
                    className="gtk-menu-item"
                    style={styles.popoverItem}
                    onClick={(e) => {
                      e.stopPropagation()
                      openShortcutsModal()
                      setShowMenu(false)
                    }}
                  >
                    <span>Keyboard Shortcuts</span>
                    <span style={styles.popoverShortcut}>Ctrl+?</span>
                  </div>
                  <div
                    className="gtk-menu-item"
                    style={styles.popoverItem}
                    onClick={(e) => {
                      e.stopPropagation()
                      openAboutModal()
                      setShowMenu(false)
                    }}
                  >
                    <span>About VibePort</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    className="gtk-menu-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      gap: '8px',
                      transition: 'all 0.15s'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuPanel('main')
                    }}
                  >
                    <ChevronLeft size={16} color="#ffffff" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#ffffff' }}>Sort</span>
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

      {/* Custom Window Controls (GNOME circle-style indicator buttons) */}
      <div style={{ ...styles.windowControls, gap: '6px' }}>
        <button
          className="gtk-window-btn minimize"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onClick={() => IpcManager.minimizeWindow()}
          title="Minimize"
        >
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="10" height="2" fill="currentColor"/>
          </svg>
        </button>

        <button
          className="gtk-window-btn maximize"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onClick={() => IpcManager.maximizeWindow()}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 1.5H7.5V6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1.5" y="2.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="7" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="none"/>
            </svg>
          )}
        </button>

        <button
          className="gtk-window-btn close"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onClick={() => IpcManager.closeWindow()}
          title="Close"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )

  const activeTitle = showHidden ? 'Hidden Games' : getSourceLabel(selectedSource)

  return (
    <div style={{
      ...styles.titlebar,
      WebkitAppRegion: (showPlusDropdown || showMenu) ? 'no-drag' : 'drag',
      backgroundColor: 'transparent',
      background: 'transparent',
      borderBottom: 'none',
      backdropFilter: viewState === 'details' ? 'none' : (styles.titlebar?.backdropFilter || 'blur(24px)'),
      padding: 0,
      position: 'relative'
    }}>
      {/* ─── 1. LEFT SIDEBAR / CONTROL REGION ─── */}
      <div style={{
        height: '100%',
        display: 'flex', 
        alignItems: 'center', 
        width: (showSidebar && !showHidden && viewState !== 'details') ? '260px' : '52px',
        paddingLeft: (showSidebar && !showHidden && viewState !== 'details') ? '16px' : '7px',
        borderRight: (showSidebar && !showHidden && viewState !== 'details') ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
        boxSizing: 'border-box',
        backgroundColor: (showSidebar && !showHidden && viewState !== 'details') 
          ? 'var(--sidebar-bg, #12111b)' 
          : (viewState === 'details' ? 'transparent' : 'var(--bg-deep, #08070d)'),
        overflow: 'hidden',
        transition: (showHidden || viewState === 'details') ? 'none' : 'width 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), padding-left 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
        WebkitAppRegion: 'no-drag',
        position: 'relative',
        flexShrink: 0
      }}>
        <div style={{
          width: '228px', // Fixed static width for alignment
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          flexShrink: 0
        }}>
          {/* Main Action Button (Back or Sidebar Toggle) */}
          {viewState === 'details' ? (
            <div
              className="header-action"
              style={styles.actionIconContainer}
              onClick={(e) => {
                e.stopPropagation()
                closeDetailsView()
              }}
              title="Back to Grid"
            >
              <ChevronLeft size={18} style={styles.actionIcon} />
            </div>
          ) : showHidden ? (
            <div
              className="header-action"
              style={styles.actionIconContainer}
              onClick={(e) => {
                e.stopPropagation()
                if (showPlusDropdown || showMenu) {
                  setShowPlusDropdown(false)
                  setShowMenu(false)
                } else {
                  setShowHidden(false)
                }
              }}
              title="Back to Library"
            >
              <ChevronLeft size={18} style={styles.actionIcon} />
            </div>
          ) : (
            <div
              className="header-action"
              style={styles.actionIconContainer}
              onClick={(e) => {
                e.stopPropagation()
                if (showPlusDropdown || showMenu) {
                  setShowPlusDropdown(false)
                  setShowMenu(false)
                } else {
                  setShowSidebar(!showSidebar)
                }
              }}
              title="Toggle Sidebar"
            >
              <Sidebar size={18} style={styles.actionIcon} />
            </div>
          )}
          
          {/* Absolute Centered VibePort Logo (Visible only when sidebar is open) */}
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
            WebkitAppRegion: (showPlusDropdown || showMenu) ? 'no-drag' : 'drag',
            opacity: (showSidebar && !showHidden && viewState !== 'details') ? 1 : 0,
            transition: 'opacity 0.15s ease'
          }}>
            VibePort
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN CONTENT AREA (Remaining space) ─── */}
      <div style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: viewState === 'details' ? 'transparent' : 'var(--bg-deep, #08070d)',
        paddingLeft: '16px',
        paddingRight: '10px'
      }}>
        {/* Left Side: + (Add Options) button */}
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          {!showHidden && viewState !== 'details' && renderPlusDropdown()}
        </div>

        {/* Centered active source name/title absolute-centered within the main area */}
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
          WebkitAppRegion: (showPlusDropdown || showMenu) ? 'no-drag' : 'drag'
        }}>
          {viewState === 'details' ? (
            <span>{selectedGameName}</span>
          ) : (
            <span>{showHidden ? 'Hidden Games' : getSourceLabel(selectedSource)}</span>
          )}
        </div>

        {/* Right Controls Container */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          WebkitAppRegion: 'no-drag'
        }}>
          {/* Search, Menu, and Window Controls */}
          {renderRightControls()}
        </div>
      </div>
    </div>
  )
}
