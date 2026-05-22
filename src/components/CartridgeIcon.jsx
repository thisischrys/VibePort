// ─── CartridgeIcon ────────────────────────────────────────────────────────────
// Custom SVG cartridge icon used in the sidebar and empty states.

const CartridgeIcon = ({ size = 20, color = '#c084fc', className = '', style = {} }) => {
  const safeColor = color.replace('#', '')
  const bodyGradId = `cartridge-body-${safeColor}`
  const labelGradId = `cartridge-label-${safeColor}`

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      {/* Cartridge Outer Shell */}
      <path
        d="M5 3.5C5 3.22386 5.22386 3 5.5 3H18.5C18.7761 3 19 3.22386 19 3.5V17H5V3.5Z"
        fill={`url(#${bodyGradId})`}
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Bottom grip area */}
      <path
        d="M5 17L7 21.5C7.1 21.8 7.4 22 7.8 22H16.2C16.6 22 16.9 21.8 17 21.5L19 17"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sticker / Label */}
      <rect x="7.5" y="5.5" width="9" height="7.5" rx="1" fill={`url(#${labelGradId})`} stroke={color} strokeWidth="1.2" />

      {/* Label lines */}
      <line x1="9.5" y1="8" x2="14.5" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="9.5" y1="10" x2="12.5" y2="10" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* Grid line separator */}
      <line x1="5" y1="14.5" x2="19" y2="14.5" stroke={color} strokeWidth="1.2" opacity="0.4" />

      {/* Pin/contact slots */}
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

export default CartridgeIcon
