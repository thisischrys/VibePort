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
    style={{
      ...styles.modalOverlay,
      backdropFilter: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      WebkitAppRegion: 'drag', // Make overlay background draggable to move main window!
    }}
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
        padding: '16px 24px 28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        WebkitAppRegion: 'no-drag', // Stop drag inside card content area
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Drag Header Bar */}
      <div
        style={{
          width: '100%',
          height: '24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          WebkitAppRegion: 'drag', // Dragging this top header bar moves the main window!
          userSelect: 'none',
        }}
      >
        <div
          style={{
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'color 0.2s',
            marginRight: '-8px',
            WebkitAppRegion: 'no-drag', // Keep close button clickable
          }}
          onClick={onClose}
          title="Close"
        >
          <X size={18} />
        </div>
      </div>



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
