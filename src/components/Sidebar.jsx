import React from 'react'
import { styles } from '../theme/styles.js'
import { LauncherIcon } from './LauncherIcon.jsx'
import { getSourceLabel } from '../shared/utils.js'

export const Sidebar = React.memo(({
  sources,
  activeGames,
  selectedSource,
  setSelectedSource,
  showSidebar,
  showHidden,
  viewState
}) => {
  const visible = showSidebar && !showHidden && viewState !== 'details'
  const rawSources = sources.filter(s => s !== 'all' && s !== 'imported')

  const renderSidebarItem = (src, label) => {
    const isActive = selectedSource === src
    const count = src === 'all' 
      ? activeGames.length 
      : activeGames.filter(g => g.source === src).length

    return (
      <div
        key={src}
        className={isActive ? '' : 'sidebar-nav-item'}
        style={{
          ...styles.sidebarItem,
          ...(isActive ? styles.activeSidebarItem : {}),
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onClick={() => setSelectedSource(src)}
      >
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            opacity: isActive ? 1 : 0.45, 
            transition: 'opacity 0.2s ease' 
          }} 
          className="sidebar-icon-wrapper"
        >
          <LauncherIcon source={src} size={16} />
        </div>
        <span style={{ fontWeight: isActive ? '700' : '500', flexGrow: 1 }}>{label}</span>
        <span style={{ ...styles.itemCount, ...(isActive ? styles.activeItemCount : {}) }}>
          {count}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        ...styles.sidebar,
        width: visible ? '260px' : '0px',
        padding: visible ? '16px 0 24px 0' : '0',
        borderRight: visible ? '1px solid rgba(255,255,255,0.04)' : 'none',
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
        transition: (showHidden || viewState === 'details') 
          ? 'none' 
          : 'all 0.25s cubic-bezier(0.25,0.8,0.25,1)'
      }}
    >
      <div style={styles.sidebarNav}>
        {['all', 'imported'].filter(s => sources.includes(s)).map(s =>
          renderSidebarItem(s, getSourceLabel(s))
        )}
      </div>

      <div style={{ ...styles.sectionHeader, marginTop: '20px' }}>Libraries</div>
      <div style={styles.sidebarNav}>
        {rawSources
          .sort((a, b) => {
            const countA = activeGames.filter(g => g.source === a).length
            const countB = activeGames.filter(g => g.source === b).length
            return countB - countA
          })
          .map(s => renderSidebarItem(s, getSourceLabel(s)))}
      </div>
    </div>
  )
})
