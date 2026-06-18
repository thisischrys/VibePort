import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Home, Download, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { LauncherIcon } from '../LauncherIcon.jsx'
import { IpcManager } from '../../shared/IpcManager.js'

// Custom modern Adwaita-style toggle switch
const GtkSwitch = ({ active, onChange, accentColor }) => (
  <div
    style={{
      width: '46px',
      height: '24px',
      borderRadius: '99px',
      backgroundColor: active ? (accentColor ? `#${accentColor}` : '#8b5cf6') : '#48484a',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background-color 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2px',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
    }}
    onClick={onChange}
  >
    <div
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        transform: active ? 'translateX(22px)' : 'translateX(0px)',
        transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    />
  </div>
)

export const PreferencesModal = ({
  accentHex,
  onClose,
  onRemoveAllGames,
  onUpdateCovers,
  onUndo,
  initialTab = 'general',
  settings = {},
  updateSettings
}) => {
  const [activeTab, setActiveTab] = useState(initialTab) // 'general' | 'import'
  const [modalToast, setModalToast] = useState(null)

  const triggerModalToast = (message, type = 'info', showUndo = false) => {
    setModalToast({ message, type, showUndo })
  }

  React.useEffect(() => {
    if (!modalToast) return
    const t = setTimeout(() => setModalToast(null), 5000)
    return () => clearTimeout(t)
  }, [modalToast])

  const handleToggleAccent = () => {
    const nextVal = !settings.use_windows_accent
    updateSettings({ use_windows_accent: nextVal }).catch(console.error)
  }

  const handleRemoveAllClick = () => {
    onRemoveAllGames(triggerModalToast)
  }

  const renderGeneralTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Behavior Section */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
          Behavior
        </h4>
        <div style={{ backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.4))', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          {/* Row 1: Exit After Launch */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Exit After Launching Games</span>
            </div>
            <GtkSwitch active={!!settings.exit_after_launch} onChange={() => updateSettings({ exit_after_launch: !settings.exit_after_launch })} accentColor={accentHex} />
          </div>
          {/* Row 1.5: Cover Image Launches Game */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Cover Image Launches Game</span>
              <span style={{ fontSize: '10.5px', color: '#8e8e93', fontWeight: '500' }}>Swaps the behavior of the cover image and the play button</span>
            </div>
            <GtkSwitch active={!!settings.cover_launches_game} onChange={() => updateSettings({ cover_launches_game: !settings.cover_launches_game })} accentColor={accentHex} />
          </div>
          {/* Row 2: Use Windows Accent Color */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Use Windows Theme Color</span>
            </div>
            <GtkSwitch active={!!settings.use_windows_accent} onChange={handleToggleAccent} accentColor={accentHex} />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
          Images
        </h4>
        <div style={{ backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.4))', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          {/* Row 1: Update Covers */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Update Covers</span>
              <span style={{ fontSize: '10.5px', color: '#8e8e93', fontWeight: '500' }}>Fetch covers for games already in your library</span>
            </div>
            <button
              type="button"
              className="glass-btn"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: '#3a3a3c',
                border: 'none',
                color: '#ffffff',
                transition: 'background-color 0.15s ease',
              }}
              onClick={() => onUpdateCovers(triggerModalToast)}
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
          Danger Zone
        </h4>
        <div
          style={{
            backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.4))',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '42px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          className="gtk-danger-btn"
          onClick={handleRemoveAllClick}
        >
          <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '700' }}>Remove All Games</span>
        </div>
      </div>
    </div>
  )

  const renderImportTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Behavior Section */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
          Behavior
        </h4>
        <div style={{ backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.4))', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          {/* Row 1: Import Automatically */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Import Games Automatically</span>
            <GtkSwitch active={!!settings.auto_import} onChange={() => updateSettings({ auto_import: !settings.auto_import })} accentColor={accentHex} />
          </div>
          {/* Row 2: Remove Uninstalled */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Remove Uninstalled Games</span>
            <GtkSwitch active={!!settings.remove_uninstalled} onChange={() => updateSettings({ remove_uninstalled: !settings.remove_uninstalled })} accentColor={accentHex} />
          </div>
        </div>
      </div>

      {/* Sources Section */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
          Sources
        </h4>
        <div style={{ backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.4))', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          {[
            { label: 'Amazon Games', val: !!settings.scan_amazon, key: 'scan_amazon', source: 'amazon' },
            { label: 'Battle.net', val: !!settings.scan_bnet, key: 'scan_bnet', source: 'battlenet' },
            { label: 'EA App', val: !!settings.scan_ea, key: 'scan_ea', source: 'ea' },
            { label: 'Epic Games', val: !!settings.scan_epic, key: 'scan_epic', source: 'epic' },
            { label: 'GOG Galaxy', val: !!settings.scan_gog, key: 'scan_gog', source: 'gog' },
            { label: 'Steam', val: !!settings.scan_steam, key: 'scan_steam', source: 'steam' },
            { label: 'Ubisoft Connect', val: !!settings.scan_ubisoft, key: 'scan_ubisoft', source: 'ubisoft' },
            { label: 'Xbox App', val: !!settings.scan_xbox, key: 'scan_xbox', source: 'xbox' },
          ].map((item, idx, arr) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: idx === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LauncherIcon source={item.source} size={16} color={accentHex ? `#${accentHex}` : 'var(--accent)'} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{item.label}</span>
              </div>
              <GtkSwitch active={item.val} onChange={() => updateSettings({ [item.key]: !item.val })} accentColor={accentHex} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        WebkitAppRegion: 'drag', // Make background overlay draggable to move main window!
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Preferences"
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '640px',
          height: '640px', // Increased height to fit all launchers without scrolling
          background: 'var(--bg-mid, rgba(15, 12, 28, 0.95))',
          border: '1px solid var(--accent-border, rgba(139, 92, 246, 0.22))',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          WebkitAppRegion: 'no-drag', // Stop drag inside card content area
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            height: '54px',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            userSelect: 'none',
            WebkitAppRegion: 'drag', // Dragging the modal topbar moves the main window!
            boxSizing: 'border-box',
          }}
        >
          {/* Left spacer for perfect header alignment symmetry */}
          <div
            style={{
              width: '32px',
              height: '32px',
            }}
          />

          {/* Segmented Tab controls */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-deep, rgba(8, 7, 13, 0.6))',
              padding: '3px',
              borderRadius: '99px',
              gap: '2px',
              WebkitAppRegion: 'no-drag', // Keep tab controls clickable
            }}
          >
            {[
              { id: 'general', label: 'General', icon: Home },
              { id: 'import', label: 'Import', icon: Download },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--accent-bg-mid, rgba(139, 92, 246, 0.15))' : 'transparent',
                    transition: 'all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  }}
                  className={isSelected ? '' : 'gtk-tab-hover'}
                >
                  <TabIcon size={14} color="#ffffff" strokeWidth={2.5} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{tab.label}</span>
                </div>
              )
            })}
          </div>

          {/* Right close button */}
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
              WebkitAppRegion: 'no-drag', // Keep close button clickable
            }}
            className="gtk-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, padding: '20px 32px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'import' && renderImportTab()}
        </div>

        {/* Modal Notification toast */}
        <AnimatePresence>
          {modalToast && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: 10, scale: 0.97, x: '-50%' }}
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                backgroundColor: '#0f0e16',
                border: modalToast.type === 'error' ? '1px solid rgba(248, 113, 113, 0.18)' : modalToast.type === 'success' ? '1px solid rgba(74, 222, 128, 0.18)' : '1px solid rgba(139, 92, 246, 0.22)',
                boxShadow: '0 20px 30px -5px rgba(0,0,0,0.7), 0 0 30px rgba(139, 92, 246, 0.08)',
                borderRadius: '12px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 100,
                width: 'max-content',
                maxWidth: '90%',
              }}
            >
              {modalToast.type === 'success' ? <CheckCircle2 size={18} color="#4ade80" />
                : modalToast.type === 'error' ? <AlertCircle size={18} color="#f87171" />
                : <Info size={18} color={`#${accentHex}`} />}
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>{modalToast.message}</span>
              {modalToast.showUndo && (
                <button
                  type="button"
                  onClick={() => {
                    onUndo()
                    setModalToast(null)
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#f8fafc',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginLeft: '6px',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                  className="glass-btn"
                >
                  Undo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
