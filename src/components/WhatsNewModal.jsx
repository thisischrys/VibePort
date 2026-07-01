import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { styles } from '../theme/styles.js'

export const WhatsNewModal = ({ isOpen, onClose, version }) => {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetch('./changelog.md')
        .then(res => res.text())
        .then(text => {
          const versionHeader = `# VibePort ${version}`
          const startIndex = text.indexOf(versionHeader)
          if (startIndex === -1) {
            setContent(text) // Fallback to full changelog if version not found
            return
          }
          
          let contentStr = text.slice(startIndex + versionHeader.length).trim()
          const nextHeaderIndex = contentStr.indexOf('\n# VibePort ')
          if (nextHeaderIndex !== -1) {
            contentStr = contentStr.slice(0, nextHeaderIndex).trim()
          }
          setContent(contentStr)
        })
        .catch(err => {
          console.error('Failed to load changelog:', err)
          setContent('Failed to load release notes.')
        })
    }
  }, [isOpen, version])

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={styles.modalOverlay} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="What's New"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              ...styles.modalContent,
              width: 600,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 32px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="gtk-modal-close-btn"
              onClick={onClose}
              style={styles.modalCloseBtn}
            >
              <X size={20} />
            </button>

            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--on-surface)',
              letterSpacing: '-0.5px'
            }}>
              What's New in {version}
            </h2>

            <div style={{
              overflowY: 'auto',
              paddingRight: '16px',
              color: 'var(--on-surface-secondary)',
              fontSize: '14.5px',
              lineHeight: '1.6'
            }} className="markdown-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="glass-btn glass-btn-active"
                onClick={onClose}
                style={{
                  ...styles.btn,
                  padding: '8px 24px',
                  fontWeight: '500',
                  borderRadius: '6px'
                }}
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
