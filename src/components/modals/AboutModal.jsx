import React from 'react'
import { motion } from 'framer-motion'
import { X, Info } from 'lucide-react'
import { styles } from '../../theme/styles.js'
import CartridgeIcon from '../CartridgeIcon.jsx'

const AboutModal = ({ accentHex, version, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={styles.modalOverlay}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 15 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 15 }}
      style={{
        ...styles.modalContentLarge,
        width: '380px',
        textAlign: 'center',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Close Button */}
      <div
        style={{
          alignSelf: 'flex-end',
          cursor: 'pointer',
          color: '#94a3b8',
          transition: 'color 0.2s',
          marginTop: '-12px',
          marginRight: '-8px'
        }}
        onClick={onClose}
        title="Close"
      >
        <X size={18} />
      </div>

      {/* Cartridge Icon with Hover Spin and Glowing Glow */}
      <motion.div
        whileHover={{ rotate: 10, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        style={{
          width: '72px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--accent-bg-faint)',
          border: '1.5px solid var(--accent-border-strong)',
          borderRadius: '16px',
          boxShadow: '0 0 25px var(--accent-glow-strong)',
          marginBottom: '8px'
        }}
      >
        <CartridgeIcon size={38} color={`#${accentHex}`} />
      </motion.div>

      {/* Title & Version Info */}
      <div>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '22px',
          fontWeight: '700',
          color: '#f8fafc',
          letterSpacing: '-0.5px',
          margin: 0
        }}>
          VibePort
        </h2>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--accent, #c084fc)',
          marginTop: '4px',
          backgroundColor: 'var(--accent-bg-faint)',
          padding: '2px 10px',
          borderRadius: '99px',
          border: '1px solid var(--accent-border)',
          display: 'inline-block'
        }}>
          v{version}
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: '#94a3b8',
        lineHeight: '1.6',
        margin: '8px 0 16px 0',
        fontWeight: '500'
      }}>
        A premium, native Windows game launcher designed for visual excellence, performance, and seamless library integration.
      </p>

      {/* Action Button */}
      <button
        className="glass-btn glass-btn-active"
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer'
        }}
        onClick={onClose}
      >
        Close
      </button>
    </motion.div>
  </motion.div>
)

export default AboutModal
