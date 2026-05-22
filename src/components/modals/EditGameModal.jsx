import { motion } from 'framer-motion'
import { Edit3, EyeOff, Trash2, X } from 'lucide-react'
import { styles } from '../../theme/styles.js'

const EditGameModal = ({
  accentHex,
  editingGame,
  formName, setFormName,
  formExecutable, setFormExecutable,
  onSubmit, onClose, onToggleHide, onDelete,
}) => {
  const hasChanges = formName !== editingGame.name || formExecutable !== editingGame.executable

  return (
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
            <Edit3 size={20} color={`#${accentHex}`} />
            <h2 style={styles.modalTitle}>Edit: {editingGame.name}</h2>
          </div>
          <div style={styles.closeBtn} onClick={onClose}><X size={18} /></div>
        </div>

        <div style={{ ...styles.formLayout, height: 'auto' }}>
          <form onSubmit={onSubmit} style={styles.formLeft}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Game Title</label>
              <input
                type="text" className="form-input"
                value={formName} onChange={(e) => setFormName(e.target.value)} required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Executable</label>
              <input
                type="text" className="form-input"
                value={formExecutable} onChange={(e) => setFormExecutable(e.target.value)} required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="glass-btn"
                style={{ ...styles.formToggleBtn, flex: 1 }}
                onClick={(e) => { onToggleHide(editingGame, e); onClose() }}
              >
                <EyeOff size={14} style={{ marginRight: '6px' }} />
                Hide Game
              </button>

              {['manual', 'imported'].includes(editingGame.source) && (
                <button
                  type="button"
                  className="glass-btn"
                  style={{ ...styles.formToggleBtn, flex: 1, borderColor: 'rgba(239,68,68,0.2)' }}
                  onClick={(e) => { onDelete(editingGame, e); onClose() }}
                >
                  <Trash2 size={14} color="#f87171" style={{ marginRight: '6px' }} />
                  <span style={{ color: '#f87171' }}>Delete Game</span>
                </button>
              )}
            </div>

            <div style={styles.formActions}>
              <button type="button" className="glass-btn" style={styles.formBtnSec} onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className={hasChanges ? "glass-btn glass-btn-active" : "glass-btn"}
                style={{
                  ...styles.formBtnPri,
                  opacity: hasChanges ? 1 : 0.4,
                  cursor: hasChanges ? 'pointer' : 'not-allowed'
                }}
                disabled={!hasChanges}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EditGameModal
