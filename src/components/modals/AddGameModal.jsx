import { motion } from 'framer-motion'
import { styles } from '../../theme/styles.js'
import { IpcManager } from '../../shared/IpcManager.js'
import { hexToRgb } from '../../shared/utils.js'

const AddGameModal = ({
  accentHex,
  formName, setFormName,
  formExecutable, setFormExecutable,
  onSubmit, onClose,
}) => {
  const hasInputs = formName.trim() !== '' && formExecutable.trim() !== ''

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        ...styles.modalOverlayClear,
        WebkitAppRegion: 'drag', // Make overlay background draggable to move main window!
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Add Game"
        initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
        style={{
          ...styles.modalContentLarge,
          width: '460px',
          WebkitAppRegion: 'no-drag', // Stop drag inside card content area
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', WebkitAppRegion: 'no-drag' }}>
          {/* Header Bar aligned exactly with Edit Modal */}
          <div style={{
            ...styles.modalHeader,
            borderBottom: 'none',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            WebkitAppRegion: 'drag', // Dragging the modal header moves the window!
            userSelect: 'none',
          }}>
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
                zIndex: 10,
                WebkitAppRegion: 'no-drag',
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
              pointerEvents: 'none',
            }}>
              Add Game
            </div>
            <button
              type="submit"
              className={hasInputs ? "glass-btn glass-btn-active" : "glass-btn"}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: hasInputs ? 'pointer' : 'not-allowed',
                backgroundColor: hasInputs ? `#${accentHex}` : 'rgba(255, 255, 255, 0.04)',
                borderColor: hasInputs ? `#${accentHex}` : 'rgba(255, 255, 255, 0.05)',
                color: hasInputs ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                boxShadow: hasInputs ? `0 0 15px rgba(${hexToRgb(accentHex)}, 0.3)` : 'none',
                opacity: hasInputs ? 1 : 0.4,
                zIndex: 10,
                WebkitAppRegion: 'no-drag',
              }}
              disabled={!hasInputs}
            >
              Add
            </button>
          </div>

          <div style={{ ...styles.formLeft, padding: '12px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Title</label>
              <input
                type="text" className="form-input" placeholder=""
                value={formName} onChange={(e) => setFormName(e.target.value)} required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Executable</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" className="form-input" placeholder=""
                  style={{ flex: 1 }}
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
                      const file = await IpcManager.selectFile()
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

export default AddGameModal
