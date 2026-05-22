// ─── Accent Color Palette Builder ────────────────────────────────────────────
// Converts a Windows RRGGBB hex string into a full set of CSS custom properties
// that replace every hardcoded purple throughout the app.

export const DEFAULT_ACCENT = 'c084fc' // fallback purple if no Windows accent available

export function buildAccentPalette(hex) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return {
    '--accent-r': r,
    '--accent-g': g,
    '--accent-b': b,
    '--accent': `rgb(${r},${g},${b})`,
    '--accent-light': `rgba(${r},${g},${b},0.85)`,
    '--accent-bg-faint': `rgba(${r},${g},${b},0.08)`,
    '--accent-bg-mid': `rgba(${r},${g},${b},0.12)`,
    '--accent-border': `rgba(${r},${g},${b},0.25)`,
    '--accent-border-strong': `rgba(${r},${g},${b},0.40)`,
    '--accent-glow-faint': `rgba(${r},${g},${b},0.10)`,
    '--accent-glow-mid': `rgba(${r},${g},${b},0.20)`,
    '--accent-glow-strong': `rgba(${r},${g},${b},0.35)`,
    '--bg-deep': `rgb(${Math.round(r * 0.04 + 14)},${Math.round(g * 0.04 + 12)},${Math.round(b * 0.06 + 20)})`,
    '--bg-mid': `rgba(${Math.round(r * 0.06 + 20)},${Math.round(g * 0.06 + 18)},${Math.round(b * 0.08 + 28)},0.95)`,
    '--sidebar-bg': `rgba(${Math.round(r * 0.01 + 6)},${Math.round(g * 0.01 + 5)},${Math.round(b * 0.02 + 9)},0.98)`,
  }
}

export function applyAccentPalette(hex) {
  const palette = buildAccentPalette(hex || DEFAULT_ACCENT)
  const root = document.documentElement
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value)
  }
}
