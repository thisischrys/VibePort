import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { styles } from '../theme/styles.js'

// ─── SteamGridDB Cover Search Panel ──────────────────────────────────────────
// Reusable cover search UI embedded inside the Add and Edit modals.
// All state lives in the parent; this component is purely presentational.

const SteamGridDBSearch = ({
  accentHex,
  sgdbSearchQuery, setSgdbSearchQuery,
  sgdbGames, sgdbSearching,
  selectedSgdbGame, setSelectedSgdbGame,
  sgdbCovers, sgdbCoversLoading,
  downloadingCoverId,
  onSearch,
  onSelectGame,
  onDownloadCover,
}) => {
  return (
    <div style={styles.formRight}>
      <h3 style={styles.settingsSecTitle}>Search SteamGridDB Covers</h3>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Search title on SteamGridDB..."
            value={sgdbSearchQuery}
            onChange={(e) => setSgdbSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button
            type="button"
            className="glass-btn"
            style={styles.sgdbSearchBtn}
            onClick={onSearch}
            disabled={sgdbSearching}
          >
            {sgdbSearching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
          </button>
        </div>

        {/* Game list results */}
        {sgdbGames.length > 0 && !selectedSgdbGame && (
          <div style={styles.sgdbResultsList}>
            {sgdbGames.map(game => (
              <div
                key={game.id}
                style={styles.sgdbResultItem}
                onClick={() => onSelectGame(game)}
              >
                <Sparkles size={14} color={`#${accentHex}`} style={{ flexShrink: 0 }} />
                <span style={styles.sgdbResultName}>{game.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cover grid for selected game */}
        {selectedSgdbGame && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <div style={styles.selectedGameHeader}>
              <span style={styles.selectedGameLabel}>
                Grids for: <strong>{selectedSgdbGame.name}</strong>
              </span>
              <span
                style={{ fontSize: '11px', color: '#8b5cf6', cursor: 'pointer' }}
                onClick={() => setSelectedSgdbGame(null)}
              >
                Change
              </span>
            </div>

            {sgdbCoversLoading ? (
              <div style={styles.coversLoader}>
                <Loader2 size={24} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12.5px', color: '#475569' }}>Fetching artworks...</span>
              </div>
            ) : (
              <div style={styles.coversGrid}>
                {sgdbCovers.map(grid => {
                  const isDownloading = downloadingCoverId === grid.id
                  return (
                    <div key={grid.id} style={styles.coverThumbnailCard}>
                      <img src={grid.thumb} style={styles.coverThumbImg} alt="Cover Thumbnail" />
                      <div style={styles.coverThumbInfo}>
                        <span style={styles.coverThumbBadge}>
                          {(grid.type || 'static').toUpperCase()} ({grid.width || '?'}x{grid.height || '?'})
                        </span>
                        <button
                          type="button"
                          className="glass-btn"
                          style={styles.applyCoverBtn}
                          onClick={() => onDownloadCover(grid.url, grid.id)}
                          disabled={isDownloading}
                        >
                          {isDownloading
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : 'Download Grid'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state — no search yet */}
        {sgdbGames.length === 0 && !selectedSgdbGame && !sgdbSearching && (
          <div style={styles.sgdbEmpty}>
            <AlertCircle size={24} color="#334155" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', color: '#475569', textAlign: 'center' }}>
              Search above to find and download cover artwork from SteamGridDB.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SteamGridDBSearch
