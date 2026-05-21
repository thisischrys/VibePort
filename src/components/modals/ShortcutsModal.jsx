import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { styles } from '../../theme/styles.js'

const SHORTCUT_GROUPS = [
  {
    label: 'General',
    shortcuts: [
      { desc: 'Focus Search Bar', keys: ['Ctrl', 'F'] },
      { desc: 'Open Preferences', keys: ['Ctrl', ','] },
      { desc: 'Show Keyboard Shortcuts', keys: ['Ctrl', '?'] },
      { desc: 'Toggle Show Hidden', keys: ['Ctrl', 'H'] },
    ]
  },
  {
    label: 'Navigation',
    shortcuts: [
      { desc: 'Close Modals / Popups', keys: ['Esc'] }
    ]
  }
]

const ShortcutsModal = ({ accentHex, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
      style={styles.shortcutsModal}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.shortcutsModalHeader}>
        <h2 style={styles.shortcutsModalTitle}>Keyboard Shortcuts</h2>
        <div onClick={onClose} style={styles.modalCloseBtn}><X size={18} /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {SHORTCUT_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: `#${accentHex}`, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {group.shortcuts.map(sc => (
                <div key={sc.desc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{sc.desc}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {sc.keys.map(k => (
                      <kbd key={k} style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11.5px',
                        color: '#f8fafc',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
                        fontWeight: '600',
                        fontFamily: 'inherit'
                      }}>{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
)

export default ShortcutsModal
