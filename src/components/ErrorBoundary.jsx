import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface-deep)',
            fontFamily: "'Inter', sans-serif",
            color: 'var(--on-surface)',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'rgba(20, 18, 36, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={32} color="#ef4444" />
            </div>

            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '22px',
                fontWeight: '700',
                margin: '0 0 10px 0',
                color: '#ffffff',
              }}
            >
              VibePort Encountered an Issue
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--on-surface-muted)',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
              }}
            >
              An unexpected error occurred in the user interface. You can try reloading VibePort to restore functionality.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '99px',
                backgroundColor: 'var(--accent, #8b5cf6)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                marginBottom: '24px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <RefreshCw size={16} />
              Reload Application
            </button>

            {this.state.error && (
              <details
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  padding: '12px',
                  boxSizing: 'border-box',
                }}
              >
                <summary
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--on-surface-muted)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                  }}
                >
                  Error Details
                </summary>
                <pre
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#f87171',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '150px',
                    overflowY: 'auto',
                  }}
                >
                  {this.state.error.stack || this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
