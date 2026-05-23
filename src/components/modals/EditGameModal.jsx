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

  const hexToRgb = (hex) => {
    try {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `${r}, ${g}, ${b}`
    } catch {
      return '139, 92, 246'
    }
  }

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
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ ...styles.modalHeader, borderBottom: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <button
              type="button"
              className="glass-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: '#cbd5e1',
                zIndex: 10
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '15px',
              fontWeight: '700',
              color: '#f8fafc',
              pointerEvents: 'none'
            }}>
              Game Details
            </div>
            <button
              type="submit"
              className={hasChanges ? "glass-btn glass-btn-active" : "glass-btn"}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                backgroundColor: hasChanges ? `#${accentHex}` : 'rgba(255, 255, 255, 0.04)',
                borderColor: hasChanges ? `#${accentHex}` : 'rgba(255, 255, 255, 0.05)',
                color: hasChanges ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                boxShadow: hasChanges ? `0 0 15px rgba(${hexToRgb(accentHex)}, 0.3)` : 'none',
                opacity: hasChanges ? 1 : 0.4,
                zIndex: 10
              }}
              disabled={!hasChanges}
            >
              Apply
            </button>
          </div>

          <div style={{ ...styles.formLeft, padding: '12px 20px 24px 20px', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Game Title</label>
              <input
                type="text" className="form-input"
                value={formName} onChange={(e) => setFormName(e.target.value)} required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Executable</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" className="form-input" style={{ flex: 1 }}
                  value={formExecutable} onChange={(e) => setFormExecutable(e.target.value)} required
                />
                <button
                  type="button"
                  className="glass-btn"
                  style={{
                    padding: '0 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                  onClick={async () => {
                    try {
                      const file = await window.api.selectFile()
                      if (file) setFormExecutable(file)
                    } catch (e) {
                      console.error('Failed to select file:', e)
                    }
                  }}
                >
                  Browse
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditGameModal
