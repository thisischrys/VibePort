import React from 'react'
import { LayoutGrid, Plus, EyeOff } from 'lucide-react'

export const LauncherIcon = ({ source, size = 16, color }) => {
  const normalized = (source || '').toLowerCase()

  // Default to our theme's active accent color (var(--accent))
  const resolvedColor = color || 'var(--accent, #a855f7)'

  switch (normalized) {
    case 'hidden':
      return <EyeOff size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
    case 'steam':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill={resolvedColor} style={{ flexShrink: 0 }}>
          {/* Steam Logo: Solid circular icon with piston cutout */}
          <path d="M.329 10.333A8.01 8.01 0 0 0 7.99 16C12.414 16 16 12.418 16 8s-3.586-8-8.009-8A8.006 8.006 0 0 0 0 7.468l.003.006 4.304 1.769A2.2 2.2 0 0 1 5.62 8.88l1.96-2.844-.001-.04a3.046 3.046 0 0 1 3.042-3.043 3.046 3.046 0 0 1 3.042 3.043 3.047 3.047 0 0 1-3.111 3.044l-2.804 2a2.223 2.223 0 0 1-3.075 2.11 2.22 2.22 0 0 1-1.312-1.568L.33 10.333Z" />
          <path d="M4.868 12.683a1.715 1.715 0 0 0 1.318-3.165 1.7 1.7 0 0 0-1.263-.02l1.023.424a1.261 1.261 0 1 1-.97 2.33l-.99-.41a1.7 1.7 0 0 0 .882.84Zm3.726-6.687a2.03 2.03 0 0 0 2.027 2.029 2.03 2.03 0 0 0 2.027-2.029 2.03 2.03 0 0 0-2.027-2.027 2.03 2.03 0 0 0-2.027 2.027m2.03-1.527a1.524 1.524 0 1 1-.002 3.048 1.524 1.524 0 0 1 .002-3.048" />
        </svg>
      )
    case 'gog':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor} style={{ flexShrink: 0 }}>
          {/* GOG Galaxy: Solid primary star and solid constellation nodes */}
          <path d="M12 3.5l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6z" />
          <circle cx="4" cy="7" r="1.5" />
          <circle cx="20" cy="7" r="1.5" />
          <circle cx="5" cy="16" r="1.5" />
          <circle cx="19" cy="16" r="1.5" />
          <circle cx="12" cy="20" r="1.5" />
        </svg>
      )
    case 'epic':
    case 'epic games':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor} style={{ flexShrink: 0 }}>
          {/* Epic Games: Solid shield with negative-space E cutout */}
          <path 
            fillRule="evenodd" 
            clipRule="evenodd"
            d="M12 2L4.5 5.5v6.5c0 4.8 7.5 9 7.5 9s7.5-4.2 7.5-9V5.5L12 2zm2 6H9.5v1.2h3.5v1.2h-3.5v1.2H14v1.2H8.5V8H14v1.2z" 
          />
        </svg>
      )
    case 'ea':
    case 'ea app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <defs>
            <mask id={`ea-mask-${size}`}>
              <rect width="24" height="24" fill="white" />
              <path d="M6.5 15V9h4M6.5 12h3M6.5 15H11m2.5 0l2.5-6 2.5 6M14.2 13h3.6" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </mask>
          </defs>
          <circle cx="12" cy="12" r="11" fill={resolvedColor} mask={`url(#ea-mask-${size})`} />
        </svg>
      )
    case 'ubisoft':
    case 'ubisoft connect':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <defs>
            <mask id={`ubisoft-mask-${size}`}>
              <rect width="24" height="24" fill="white" />
              <path d="M12 6.5a5.5 5.5 0 1 0 5.5 5.5c0-2.3-1.4-4.1-3.2-4.9a3.2 3.2 0 1 0-4.1 4.1" stroke="black" strokeWidth="2.2" fill="none" />
            </mask>
          </defs>
          <circle cx="12" cy="12" r="11" fill={resolvedColor} mask={`url(#ubisoft-mask-${size})`} />
        </svg>
      )
    case 'battlenet':
    case 'battle.net':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <defs>
            <mask id={`bnet-mask-${size}`}>
              <rect width="24" height="24" fill="white" />
              <circle cx="12" cy="12" r="2.8" fill="black" />
              <line x1="12" y1="9.8" x2="12" y2="5.5" stroke="black" strokeWidth="2" />
              <circle cx="12" cy="5.5" r="1.8" fill="black" />
              
              <line x1="10.1" y1="13.1" x2="6.3" y2="15.3" stroke="black" strokeWidth="2" />
              <circle cx="6.3" cy="15.3" r="1.8" fill="black" />
              
              <line x1="13.9" y1="13.1" x2="17.7" y2="15.3" stroke="black" strokeWidth="2" />
              <circle cx="17.7" cy="15.3" r="1.8" fill="black" />
            </mask>
          </defs>
          <circle cx="12" cy="12" r="11" fill={resolvedColor} mask={`url(#bnet-mask-${size})`} />
        </svg>
      )
    case 'imported':
    case 'manual':
      return <Plus size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
    default:
      return <LayoutGrid size={size} color={resolvedColor} style={{ flexShrink: 0 }} />
  }
}
