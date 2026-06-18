import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export const ShortcutsModal = ({ onClose, standalone = false }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    // Only drag on left click and not on the close button or icon
    if (e.button !== 0) return
    const target = e.target
    if (target.closest('.gtk-modal-close-btn') || target.closest('svg')) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  useEffect(() => {
    if (standalone) {
      document.documentElement.style.setProperty('background', 'transparent', 'important')
      document.body.style.setProperty('background', 'transparent', 'important')
      document.documentElement.style.setProperty('background-color', 'transparent', 'important')
      document.body.style.setProperty('background-color', 'transparent', 'important')
      const rootEl = document.getElementById('root')
      if (rootEl) {
        rootEl.style.setProperty('background', 'transparent', 'important')
        rootEl.style.setProperty('background-color', 'transparent', 'important')
      }
    }
  }, [standalone])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const generalShortcuts = [
    { keys: ['Ctrl', 'F'], label: 'Search' },
    { keys: ['Ctrl', ','], label: 'Preferences' },
    { keys: ['Ctrl', '?'], label: 'Keyboard Shortcuts' },
    { keys: ['Ctrl', 'Z'], label: 'Undo' },
    { keys: ['Ctrl', 'Q'], label: 'Quit' },
    { keys: ['F9'], label: 'Toggle Sidebar' },
    { keys: ['F10'], label: 'Main Menu' },
  ]

  const gameShortcuts = [
    { keys: ['Ctrl', 'N'], label: 'Add Game' },
    { keys: ['Ctrl', 'G'], label: 'Scan Games' },
    { keys: ['Ctrl', 'I'], label: 'Import' },
    { keys: ['Ctrl', 'H'], label: 'Show Hidden Games' },
    { keys: ['Delete'], label: 'Remove Game' },
  ]

  const renderShortcutRow = (shortcut, index) => (
    <div
      key={index}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '38px',
        padding: '1px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '110px', flexShrink: 0 }}>
        {shortcut.keys.map((key, kIndex) => (
          <React.Fragment key={kIndex}>
            {kIndex > 0 && <span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: '500' }}>+</span>}
            <kbd
              className="gtk-keycap"
              style={{
                backgroundColor: '#38383a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderBottomWidth: '2.5px',
                borderBottomColor: 'rgba(0,0,0,0.35)',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#ffffff',
                fontFamily: "system-ui, -apple-system, sans-serif",
                minWidth: '22px',
                textAlign: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
      <span
        style={{
          color: '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500',
          marginLeft: '12px',
          textAlign: 'left',
        }}
      >
        {shortcut.label}
      </span>
    </div>
  )

  if (standalone) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'var(--bg-mid-solid, #0f0c1c)',
          border: '1px solid var(--accent-border, rgba(139, 92, 246, 0.22))',
          borderRadius: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            userSelect: 'none',
            WebkitAppRegion: 'drag',
            boxSizing: 'border-box',
          }}
        >
          {/* Left spacer for perfect symmetry */}
          <div style={{ width: '30px', height: '30px' }} />

          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#cbd5e1',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Shortcuts
          </h2>

          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              WebkitAppRegion: 'no-drag',
            }}
            className="gtk-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Content columns */}
        <div style={{ flex: 1, display: 'flex', gap: '48px', padding: '0 32px 24px 32px', boxSizing: 'border-box' }}>
          {/* General column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '14.5px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              General
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {generalShortcuts.map((s, idx) => renderShortcutRow(s, idx))}
            </div>
          </div>

          {/* Games column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '14.5px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Games
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {gameShortcuts.map((s, idx) => renderShortcutRow(s, idx))}
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts"
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '640px',
          height: '420px',
          background: 'var(--bg-mid, rgba(15, 12, 28, 0.95))',
          border: '1px solid var(--accent-border, rgba(139, 92, 246, 0.22))',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
        >
          {/* Left spacer for perfect symmetry */}
          <div style={{ width: '30px', height: '30px' }} />

          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14.5px',
              fontWeight: '700',
              color: '#cbd5e1',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Shortcuts
          </h2>

          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="gtk-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Content columns */}
        <div style={{ flex: 1, display: 'flex', gap: '48px', padding: '0 32px 24px 32px', boxSizing: 'border-box' }}>
          {/* General column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '14.5px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              General
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {generalShortcuts.map((s, idx) => renderShortcutRow(s, idx))}
            </div>
          </div>

          {/* Games column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '14.5px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Games
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {gameShortcuts.map((s, idx) => renderShortcutRow(s, idx))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
