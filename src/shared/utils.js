export const hexToRgb = (hex) => {
  try {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `${r}, ${g}, ${b}`
  } catch {
    return '139, 92, 246'
  }
}

export const getSourceLabel = (src) => {
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

export const SORT_OPTIONS = [
  { label: 'A-Z', value: 'alphabetical' },
  { label: 'Z-A', value: 'z_to_a' },
  { label: 'Newest', value: 'added' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Last Played', value: 'last_played' }
]

export function compareGameNames(nameA, nameB) {
  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    return nameA.localeCompare(nameB)
  }

  const getCommonPrefix = (s1, s2) => {
    const minLength = Math.min(s1.length, s2.length)
    let prefix = ''
    for (let i = 0; i < minLength; i++) {
      if (s1[i].toLowerCase() === s2[i].toLowerCase()) {
        prefix += s1[i]
      } else {
        break
      }
    }
    if (prefix.length < s1.length && prefix.length < s2.length) {
      const lastSpace = Math.max(prefix.lastIndexOf(' '), prefix.lastIndexOf(':'), prefix.lastIndexOf('-'))
      if (lastSpace > 0) {
        prefix = prefix.substring(0, lastSpace + 1)
      }
    }
    return prefix
  }

  const prefix = getCommonPrefix(nameA, nameB)

  if (prefix.length > 0) {
    const suffixA = nameA.substring(prefix.length).trim()
    const suffixB = nameB.substring(prefix.length).trim()

    const parseSequenceNumber = (suffix) => {
      if (!suffix) return 1
      
      const numMatch = suffix.match(/^(\d+)\b/)
      if (numMatch) {
        return parseInt(numMatch[1], 10)
      }
      
      const romanMatch = suffix.match(/^(IX|IV|V?I{0,3}|X)\b/i)
      if (romanMatch) {
        const roman = romanMatch[1].toLowerCase()
        const romanMap = {
          i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10
        }
        if (romanMap[roman] !== undefined) {
          return romanMap[roman]
        }
      }
      
      const firstGameSubtitles = ['enchanted', 'enhanced', 'remastered', 'remake', 'goty', 'anniversary', 'definitive']
      const lowerSuffix = suffix.toLowerCase()
      if (firstGameSubtitles.some(sub => lowerSuffix.startsWith(sub))) {
        return 1
      }
      
      return null
    }

    const seqA = parseSequenceNumber(suffixA)
    const seqB = parseSequenceNumber(suffixB)

    if (seqA !== null && seqB !== null) {
      if (seqA !== seqB) {
        return seqA - seqB
      }
    }
  }

  return nameA.localeCompare(nameB)
}

export function sortGames(games, sortBy) {
  return [...games].sort((a, b) => {
    if (sortBy === 'alphabetical') return compareGameNames(a.name, b.name)
    if (sortBy === 'z_to_a') return compareGameNames(b.name, a.name)
    if (sortBy === 'added') {
      const diff = (b.added || 0) - (a.added || 0)
      return diff !== 0 ? diff : compareGameNames(a.name, b.name)
    }
    if (sortBy === 'oldest') {
      const diff = (a.added || 0) - (b.added || 0)
      return diff !== 0 ? diff : compareGameNames(a.name, b.name)
    }
    if (sortBy === 'last_played') {
      const diff = (b.last_played || 0) - (a.last_played || 0)
      return diff !== 0 ? diff : compareGameNames(a.name, b.name)
    }
    return 0
  })
}

export const normalizeGameName = (name) => {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => {
      switch (word) {
        case 'i': return '1'
        case 'ii': return '2'
        case 'iii': return '3'
        case 'iv': return '4'
        case 'v': return '5'
        case 'vi': return '6'
        case 'vii': return '7'
        case 'viii': return '8'
        case 'ix': return '9'
        case 'x': return '10'
        default: return word
      }
    })
    .join(' ')
}
