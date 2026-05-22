import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { styles } from '../../theme/styles.js'

const AddGameModal = ({
  accentHex,
  formName, setFormName,
  formExecutable, setFormExecutable,
  onSubmit, onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
      style={{ ...styles.modalContentLarge, width: '460px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.modalHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} color={`#${accentHex}`} />
          <h2 style={styles.modalTitle}>Add Custom Game</h2>
        </div>
        <div style={styles.closeBtn} onClick={onClose}><X size={18} /></div>
      </div>

      <div style={{ ...styles.formLayout, height: 'auto' }}>
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

          <div style={styles.formActions}>
            <button type="button" className="glass-btn" style={styles.formBtnSec} onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-active" style={styles.formBtnPri}>Save Game</button>
          </div>
        </form>
      </div>
    </motion.div>
  </motion.div>
)

export default AddGameModal
