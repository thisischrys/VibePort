import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Settings, Search, LayoutGrid, Info } from 'lucide-react'

const App = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await window.api.getGames()
        setGames(data)
      } catch (error) {
        console.error('Failed to fetch games:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [])

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLaunch = (executable) => {
    window.api.launchGame(executable)
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <LayoutGrid size={24} color="#3584e4" />
          <span style={styles.sidebarBrandText}>Cartridges</span>
        </div>
        <div style={styles.sidebarNav}>
          <div style={{...styles.sidebarItem, ...styles.activeSidebarItem}}>All Games</div>
          <div style={styles.sidebarItem}>Added</div>
          <div style={styles.sidebarItem}>Steam</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search games..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={styles.headerActions}>
            <Settings size={20} style={styles.actionIcon} />
          </div>
        </div>

        <div style={styles.gridContainer}>
          {loading ? (
            <div style={styles.loading}>Loading Library...</div>
          ) : (
            <div style={styles.grid}>
              <AnimatePresence>
                {filteredGames.map((game) => (
                  <motion.div
                    key={game.game_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    style={styles.gameCard}
                    onClick={() => handleLaunch(game.executable)}
                  >
                    <div style={styles.coverContainer}>
                      {game.coverUrl ? (
                        <img 
                          src={game.coverUrl} 
                          alt={game.name} 
                          style={styles.cover}
                          // This will automatically play animated WebP
                        />
                      ) : (
                        <div style={styles.coverPlaceholder}>
                          <span style={styles.placeholderText}>{game.name[0]}</span>
                        </div>
                      )}
                      <div style={styles.playOverlay}>
                        <Play size={48} fill="white" />
                      </div>
                    </div>
                    <div style={styles.gameInfo}>
                      <div style={styles.gameTitle}>{game.name}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#2d2d2d',
    borderRight: '1px solid #3d3d3d',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
  },
  sidebarBrand: {
    padding: '0 20px 30px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sidebarBrandText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#eee',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 10px',
  },
  sidebarItem: {
    padding: '10px 15px',
    borderRadius: '6px',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  activeSidebarItem: {
    backgroundColor: '#3d3d3d',
    color: 'white',
    fontWeight: '500',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1e1e1e',
  },
  header: {
    height: '60px',
    padding: '0 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #2d2d2d',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#888',
  },
  searchInput: {
    backgroundColor: '#2d2d2d',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 15px 10px 40px',
    color: 'white',
    width: '300px',
    outline: 'none',
    fontSize: '14px',
  },
  headerActions: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  actionIcon: {
    color: '#888',
    cursor: 'pointer',
  },
  gridContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '30px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '25px',
  },
  gameCard: {
    cursor: 'pointer',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  coverContainer: {
    position: 'relative',
    aspectRatio: '2/3',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
    backgroundColor: '#333',
  },
  cover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
  },
  placeholderText: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#666',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  gameInfo: {
    marginTop: '12px',
    textAlign: 'center',
  },
  gameTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#eee',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  loading: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#888',
  }
}

// Add hover effect via JS for the play overlay
document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('[style*="gameCard"]')
  if (card) {
    const overlay = card.querySelector('[style*="playOverlay"]')
    if (overlay) overlay.style.opacity = 1
  }
})
document.addEventListener('mouseout', (e) => {
  const card = e.target.closest('[style*="gameCard"]')
  if (card) {
    const overlay = card.querySelector('[style*="playOverlay"]')
    if (overlay) overlay.style.opacity = 0
  }
})

export default App