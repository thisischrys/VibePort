import React from 'react'
import { LayoutGrid, Plus, Globe } from 'lucide-react'

export const LauncherIcon = ({ source, size = 16, color = '#64748b' }) => {
  const normalized = (source || '').toLowerCase()

  switch (normalized) {
    case 'steam':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12a6 6 0 0 1 12 0" />
          <path d="M9 12l2-2" />
        </svg>
      )
    case 'gog':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Stylized GOG starry galaxy stars constellation */}
          <path d="M12 3l1.5 3.5h3.5l-2.8 2.2L15 12.2l-3-2.2-3 2.2.8-3.5-2.8-2.2h3.5z" />
          <path d="M5 16l.8 1.8 1.8.2-1.4 1 1.4 1.8-1.6-1.1L2.4 21l.7-1.8-1.5-1 1.8-.2z" />
          <path d="M19 16l.8 1.8 1.8.2-1.4 1 1.4 1.8-1.6-1.1L16.4 21l.7-1.8-1.5-1 1.8-.2z" />
        </svg>
      )
    case 'epic':
    case 'epic games':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Epic shield / diamond outline with inner E */}
          <path d="M12 2L3 5v6c0 5.5 4.5 10 9 11 4.5-1 9-5.5 9-11V5l-9-3z" />
          <path d="M9 8h6M9 12h4M9 16h6" />
        </svg>
      )
    case 'ea':
    case 'ea app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Stylized E and A chevrons */}
          <path d="M4 6h12M4 12h9M4 18h12M15 18l5-12 1 2.5" />
        </svg>
      )
    case 'ubisoft':
    case 'ubisoft connect':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Concentric spiral representing UbisoftConnect spiral swirl */}
          <path d="M12 2a10 10 0 1 0 10 10c0-2.8-1.1-5.3-3-7.1M12 6a6 6 0 1 0 6 6c0-1.6-.6-3.2-1.8-4.2M12 10a2 2 0 1 0 2 2" />
        </svg>
      )
    case 'battlenet':
    case 'battle.net':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Stylized battle.net concentric arches */}
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
        </svg>
      )
    case 'imported':
    case 'manual':
      return <Plus size={size} color={color} style={{ flexShrink: 0 }} />
    default:
      return <LayoutGrid size={size} color={color} style={{ flexShrink: 0 }} />
  }
}
