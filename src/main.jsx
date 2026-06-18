import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ShortcutsModal } from './components/modals/ShortcutsModal.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { IpcManager } from './shared/IpcManager.js'

import { setupMockApi } from './shared/mockApi.js'

setupMockApi()

if (window.location.hash === '#shortcuts') {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ShortcutsModal standalone={true} onClose={() => IpcManager.closeWindow()} />
      </ErrorBoundary>
    </React.StrictMode>,
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}