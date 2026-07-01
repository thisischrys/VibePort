import React from 'react'
import { motion } from 'framer-motion'
import { hexToRgb } from '../shared/utils.js'

export const ScanOverlay = React.memo(({ isScanning, scanMode, scanProgress, accentHex }) => {
  if (!isScanning) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        backdropFilter: 'none',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'drag' // Draggable overlay!
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        style={{
          width: '380px',
          backgroundColor: 'var(--scan-bg)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-glow-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
          WebkitAppRegion: 'no-drag' // Stop drag inside card content area
        }}
      >
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '18px',
          fontWeight: '700',
          color: 'var(--on-surface)',
          letterSpacing: '-0.3px'
        }}>
          {scanMode === 'folder' ? 'Adding Games...' : 'Importing Games...'}
        </div>
        
        {/* Custom Animated Real Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--outline-variant)',
          borderRadius: '3px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            animate={{
              width: `${(scanProgress.current / (scanProgress.total || 100)) * 100}%`
            }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 15
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              height: '100%',
              backgroundColor: `#${accentHex}`,
              borderRadius: '3px',
              boxShadow: `0 0 10px rgba(${hexToRgb(accentHex)}, 0.5)`
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
})
