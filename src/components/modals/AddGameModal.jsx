import { motion } from 'framer-motion'
import { Plus, X, Image as ImageIcon } from 'lucide-react'
import { styles } from '../../theme/styles.js'
import SteamGridDBSearch from '../SteamGridDBSearch.jsx'

const AddGameModal = ({
  accentHex,
  formName, setFormName,
  formExecutable, setFormExecutable,
  formDeveloper, setFormDeveloper,
  formCoverUrl,
  sgdbSearchQuery, setSgdbSearchQuery,
  sgdbGames, sgdbSearching,
  selectedSgdbGame, setSelectedSgdbGame,
  sgdbCovers, sgdbCoversLoading,
  onSearch, onSelectGame, onDownloadCover,
  onSubmit, onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
      style={styles.modalContentLarge}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.modalHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} color={`#${accentHex}`} />
          <h2 style={styles.modalTitle}>Add Custom Game</h2>
        </div>
        <div style={styles.closeBtn} onClick={onClose}><X size={18} /></div>
      </div>

      <div style={styles.formLayout}>
        <form onSubmit={onSubmit} style={styles.formLeft}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Game Title *</label>
            <input
              type="text" className="form-input" placeholder="e.g. Hades II"
              value={formName} onChange={(e) => setFormName(e.target.value)} required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Command / Executable Path *</label>
            <input
              type="text" className="form-input" placeholder='e.g. "C:\\Games\\Hades2\\Hades2.exe"'
              value={formExecutable} onChange={(e) => setFormExecutable(e.target.value)} required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Developer</label>
            <input
              type="text" className="form-input" placeholder="e.g. Supergiant Games"
              value={formDeveloper} onChange={(e) => setFormDeveloper(e.target.value)}
            />
          </div>

          {formCoverUrl && (
            <div style={styles.formCoverStatus}>
              <ImageIcon size={14} color={`#${accentHex}`} />
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Selected cover from SteamGridDB</span>
            </div>
          )}

          <div style={styles.formActions}>
            <button type="button" className="glass-btn" style={styles.formBtnSec} onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-active" style={styles.formBtnPri}>Save Game</button>
          </div>
        </form>

        <SteamGridDBSearch
          accentHex={accentHex}
          sgdbSearchQuery={sgdbSearchQuery} setSgdbSearchQuery={setSgdbSearchQuery}
          sgdbGames={sgdbGames} sgdbSearching={sgdbSearching}
          selectedSgdbGame={selectedSgdbGame} setSelectedSgdbGame={setSelectedSgdbGame}
          sgdbCovers={sgdbCovers} sgdbCoversLoading={sgdbCoversLoading}
          downloadingCoverId={null}
          onSearch={onSearch} onSelectGame={onSelectGame} onDownloadCover={onDownloadCover}
        />
      </div>
    </motion.div>
  </motion.div>
)

export default AddGameModal
