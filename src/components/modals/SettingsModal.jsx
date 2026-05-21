import { motion } from 'framer-motion'
import { Settings, X } from 'lucide-react'
import { styles } from '../../theme/styles.js'

const SettingsModal = ({ accentHex, settings, onClose, onSaveSetting }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
      style={{ ...styles.modalContentLarge, width: '480px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.modalHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color={`#${accentHex}`} />
          <h2 style={styles.modalTitle}>Preferences</h2>
        </div>
        <div style={styles.closeBtn} onClick={onClose}><X size={18} /></div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={styles.settingsSecTitle}>Visual Preferences</h3>

        {/* Grid Card Size */}
        <div style={styles.settingsRow}>
          <span style={styles.settingsLabel}>Grid Card Size</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['compact', 'cozy', 'large'].map(sz => (
              <button
                key={sz}
                className={`glass-btn ${settings.card_size === sz ? 'glass-btn-active' : ''}`}
                style={styles.pillButton}
                onClick={() => onSaveSetting('card_size', sz)}
              >
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Show Titles */}
        <div style={styles.settingsRow}>
          <span style={styles.settingsLabel}>Show Game Titles</span>
          <button
            className={`glass-btn ${settings.show_titles ? 'glass-btn-active' : ''}`}
            style={styles.toggleButton}
            onClick={() => onSaveSetting('show_titles', !settings.show_titles)}
          >
            {settings.show_titles ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Windows Accent Color */}
        <div style={styles.settingsRow}>
          <span style={styles.settingsLabel}>Use Windows Accent Color</span>
          <button
            className={`glass-btn ${settings.use_windows_accent !== false ? 'glass-btn-active' : ''}`}
            style={styles.toggleButton}
            onClick={() => onSaveSetting('use_windows_accent', settings.use_windows_accent === false)}
          >
            {settings.use_windows_accent !== false ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)

export default SettingsModal
