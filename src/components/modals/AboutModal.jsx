import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { styles } from '../../theme/styles.js'
import CartridgeIcon from '../CartridgeIcon.jsx'

const AboutModal = ({ accentHex, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
      style={{ ...styles.shortcutsModal, width: '360px', padding: '32px 24px', textAlign: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div onClick={onClose} style={{ ...styles.modalCloseBtn, position: 'absolute', top: '16px', right: '16px' }}>
        <X size={18} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <CartridgeIcon size={64} color={`#${accentHex}`} />

        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0' }}>Cartridges</h2>
          <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600', marginTop: '4px' }}>v1.0.0</div>
        </div>

        <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', margin: '0' }}>
          A beautiful, lightweight game launcher that aggregates your Steam, GOG, Epic Games, EA, and custom libraries into one unified, gorgeous place.
        </p>

        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.05)', margin: '8px 0' }} />

        <div style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>
          Inspired by https://codeberg.org/kramo/cartridges
        </div>
      </div>
    </motion.div>
  </motion.div>
)

export default AboutModal
