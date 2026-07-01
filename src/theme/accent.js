// ─── Accent Color Palette Builder ────────────────────────────────────────────
// Converts a hex string into a full set of CSS custom properties.
// Mode-aware: produces brighter accents for dark mode, deeper for light mode.

export const DEFAULT_ACCENT_DARK = 'c084fc'   // soft purple for dark backgrounds
export const DEFAULT_ACCENT_LIGHT = '613583'  // deep purple for light backgrounds (Adwaita purple-5)

// Legacy export kept for backward compat
export const DEFAULT_ACCENT = DEFAULT_ACCENT_DARK

function hexToHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const hue2rgb = (pVal, qVal, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return pVal + (qVal - pVal) * 6 * t
    if (t < 1/2) return qVal
    if (t < 2/3) return pVal + (qVal - pVal) * (2/3 - t) * 6
    return pVal
  }

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  }
}

export function buildAccentPalette(hex, isDark = true) {
  const clean = (hex || (isDark ? DEFAULT_ACCENT_DARK : DEFAULT_ACCENT_LIGHT)).replace('#', '')
  let { h, s, l } = hexToHsl(clean)
  let { r, g, b } = { r: parseInt(clean.slice(0, 2), 16), g: parseInt(clean.slice(2, 4), 16), b: parseInt(clean.slice(4, 6), 16) }

  if (isDark) {
    // Dark mode: boost lightness so accent is bright enough for text/highlights
    const MIN_LIGHTNESS = 68
    if (l < MIN_LIGHTNESS) {
      l = MIN_LIGHTNESS
      if (s < 35) s = 35
      const rgb = hslToRgb(h, s, l)
      r = rgb.r; g = rgb.g; b = rgb.b
    }
  } else {
    // Light mode: reduce lightness so accent has contrast on light backgrounds
    const MAX_LIGHTNESS = 42
    if (l > MAX_LIGHTNESS) {
      l = MAX_LIGHTNESS
      if (s < 40) s = 40
      const rgb = hslToRgb(h, s, l)
      r = rgb.r; g = rgb.g; b = rgb.b
    }
  }

  const palette = {
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
  }

  if (isDark) {
    // Dark mode: tint backgrounds with accent hue
    palette['--bg-deep'] = `rgb(${Math.round(r * 0.04 + 14)},${Math.round(g * 0.04 + 12)},${Math.round(b * 0.06 + 20)})`
    palette['--bg-mid'] = `rgba(${Math.round(r * 0.06 + 20)},${Math.round(g * 0.06 + 18)},${Math.round(b * 0.08 + 28)},0.95)`
    palette['--bg-mid-solid'] = `rgb(${Math.round(r * 0.06 + 20)},${Math.round(g * 0.06 + 18)},${Math.round(b * 0.08 + 28)})`
    palette['--sidebar-bg'] = `rgba(${Math.round(r * 0.01 + 6)},${Math.round(g * 0.01 + 5)},${Math.round(b * 0.02 + 9)},0.98)`
  } else {
    // Light mode: subtle accent tint on surfaces
    palette['--bg-deep'] = `rgb(${Math.round(250 - r * 0.02)},${Math.round(250 - g * 0.02)},${Math.round(252 - b * 0.01)})`
    palette['--bg-mid'] = `rgba(${Math.round(245 - r * 0.03)},${Math.round(245 - g * 0.03)},${Math.round(248 - b * 0.02)},0.95)`
    palette['--bg-mid-solid'] = `rgb(${Math.round(245 - r * 0.03)},${Math.round(245 - g * 0.03)},${Math.round(248 - b * 0.02)})`
    palette['--sidebar-bg'] = `rgba(${Math.round(240 - r * 0.02)},${Math.round(240 - g * 0.02)},${Math.round(242 - b * 0.01)},0.98)`
  }

  return palette
}

export function getDefaultAccent(isDark = true) {
  return isDark ? DEFAULT_ACCENT_DARK : DEFAULT_ACCENT_LIGHT
}

export function applyAccentPalette(hex, isDark = true) {
  const palette = buildAccentPalette(hex || getDefaultAccent(isDark), isDark)
  const root = document.documentElement
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value)
  }
}
