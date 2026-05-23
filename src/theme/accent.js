// ─── Accent Color Palette Builder ────────────────────────────────────────────
// Converts a Windows RRGGBB hex string into a full set of CSS custom properties
// that replace every hardcoded purple throughout the app.

export const DEFAULT_ACCENT = 'c084fc' // fallback purple if no Windows accent available

export function buildAccentPalette(hex) {
  let r = parseInt(hex.slice(0, 2), 16)
  let g = parseInt(hex.slice(2, 4), 16)
  let b = parseInt(hex.slice(4, 6), 16)

  // Convert to HSL color space
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break
      case gNorm: h = (bNorm - rNorm) / d + 2; break
      case bNorm: h = (rNorm - gNorm) / d + 4; break
    }
    h /= 6
  }

  h = h * 360
  s = s * 100
  l = l * 100

  // Intelligent contrast boost: Ensure accent color is bright enough for text/highlights on a dark theme.
  // We enforce a minimum lightness floor of 68%.
  const MIN_LIGHTNESS = 68
  if (l < MIN_LIGHTNESS) {
    l = MIN_LIGHTNESS
    // If the color was extremely dark/grayish, boost saturation slightly to ensure high premium vibrancy
    if (s < 35) s = 35

    // Convert back to RGB
    const hRad = h / 360
    const sRad = s / 100
    const lRad = l / 100
    
    const q = lRad < 0.5 ? lRad * (1 + sRad) : lRad + sRad - lRad * sRad
    const p = 2 * lRad - q
    
    const hue2rgb = (pVal, qVal, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return pVal + (qVal - pVal) * 6 * t
      if (t < 1/2) return qVal
      if (t < 2/3) return pVal + (qVal - pVal) * (2/3 - t) * 6
      return pVal
    }

    r = Math.round(hue2rgb(p, q, hRad + 1/3) * 255)
    g = Math.round(hue2rgb(p, q, hRad) * 255)
    b = Math.round(hue2rgb(p, q, hRad - 1/3) * 255)
  }

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
