import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { styles } from '../theme/styles.js'
import { hexToRgb } from '../shared/utils.js'

export const Toast = React.memo(({ activeToast, accentHex, onClose }) => {
  if (!activeToast) return null

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
      exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
      style={{
        ...styles.toast,
        bottom: '20px',
        ...(activeToast.type === 'error' ? styles.toastError : activeToast.type === 'success' ? styles.toastSuccess : {}),
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      {activeToast.type === 'success' ? (
        <CheckCircle2 size={18} color="#4ade80" />
      ) : activeToast.type === 'error' ? (
        <AlertCircle size={18} color="#f87171" />
      ) : (
        <Info size={18} color={`#${accentHex}`} />
      )}
      
      <span style={styles.toastText}>{activeToast.message}</span>
      
      {activeToast.button && (
        <button
          type="button"
          onClick={() => {
            if (typeof activeToast.button.onClick === 'function') {
              activeToast.button.onClick()
            }
            onClose()
          }}
          style={{
            backgroundColor: 'var(--active-bg)',
            border: '1px solid var(--menu-border)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: 'var(--on-surface)',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginLeft: '6px',
            fontFamily: "'Outfit', sans-serif"
          }}
          className="glass-btn"
        >
          {activeToast.button.label}
        </button>
      )}
    </motion.div>
  )
})
