import React from 'react'
import { LayoutGrid, Plus, EyeOff } from 'lucide-react'

export const LauncherIcon = ({ source, size = 16, color }) => {
  const normalized = (source || '').toLowerCase()

  // Premium brand color mapping for game launchers
  const brandColors = {
    steam: '#66c0f4',       // Steam Electric Blue
    gog: '#c766ff',         // GOG Purple
    epic: '#e2e8f0',        // Epic Silver-White
    'epic games': '#e2e8f0',
    ea: '#ff4747',          // EA Vibrant Red
    'ea app': '#ff4747',
    ubisoft: '#00d0ff',     // Ubisoft Cyan
    'ubisoft connect': '#00d0ff',
    battlenet: '#00aeff',   // Battle.net Sky Blue
    'battle.net': '#00aeff',
    imported: '#10b981',    // Imported Emerald Green
    manual: '#10b981',
    hidden: '#94a3b8',
    all: '#a855f7'          // All games sleek purple accent
  }

  const resolvedColor = color && color !== 'brand' ? color : (brandColors[normalized] || '#94a3b8')

  switch (normalized) {
    case 'hidden':
      return <EyeOff size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
    case 'steam':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Steam Logo: Interlocking crank wheel and arm */}
          <circle cx="8" cy="15" r="4.5" />
          <circle cx="8" cy="15" r="1.5" fill={resolvedColor} />
          <circle cx="16" cy="8" r="3" />
          <circle cx="16" cy="8" r="1" fill={resolvedColor} />
          <path d="M12 11.2l2.4-2.4" />
          <path d="M8.8 10.8l5.2-5.2" />
        </svg>
      )
    case 'gog':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* GOG Galaxy: Stylized primary star surrounded by constellation nodes */}
          <path d="M12 4.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
          <circle cx="5" cy="8" r="0.8" fill={resolvedColor} />
          <circle cx="19" cy="8" r="0.8" fill={resolvedColor} />
          <circle cx="6" cy="16" r="0.8" fill={resolvedColor} />
          <circle cx="18" cy="16" r="0.8" fill={resolvedColor} />
          <circle cx="12" cy="19.5" r="0.8" fill={resolvedColor} />
        </svg>
      )
    case 'epic':
    case 'epic games':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Epic Games: Sleek double-bordered hex diamond shield with internal E */}
          <path d="M12 2L4.5 5.5v6.5c0 4.8 7.5 9 7.5 9s7.5-4.2 7.5-9V5.5L12 2z" />
          <path d="M9.5 8h4.5v1.2H9.5v1.2h3.5v1.2h-3.5v1.2H14v1.2H8.5V8z" />
        </svg>
      )
    case 'ea':
    case 'ea app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* EA App: Stylized script EA letters in circle */}
          <circle cx="12" cy="12" r="10" />
          <path d="M6.5 15V9h4M6.5 12h3M6.5 15H11m2.5 0l2.5-6 2.5 6M14.2 13h3.6" />
        </svg>
      )
    case 'ubisoft':
    case 'ubisoft connect':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Ubisoft swirl concentric portal */}
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6.5a5.5 5.5 0 1 0 5.5 5.5c0-2.3-1.4-4.1-3.2-4.9a3.2 3.2 0 1 0-4.1 4.1" />
        </svg>
      )
    case 'battlenet':
    case 'battle.net':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Battle.net: Triple radiating node connections inside a outer ring */}
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2.2" fill={resolvedColor} />
          
          <line x1="12" y1="9.8" x2="12" y2="5.5" />
          <circle cx="12" cy="5.5" r="1.3" fill={resolvedColor} />
          
          <line x1="10.1" y1="13.1" x2="6.3" y2="15.3" />
          <circle cx="6.3" cy="15.3" r="1.3" fill={resolvedColor} />
          
          <line x1="13.9" y1="13.1" x2="17.7" y2="15.3" />
          <circle cx="17.7" cy="15.3" r="1.3" fill={resolvedColor} />
        </svg>
      )
    case 'imported':
    case 'manual':
      return <Plus size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
    default:
      return <LayoutGrid size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
  }
}
