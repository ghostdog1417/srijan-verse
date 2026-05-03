import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import faviconUrl from './assets/favicon.ico?url'
import manifestUrl from './assets/manifest.webmanifest?url'

const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link')
faviconLink.rel = 'icon'
faviconLink.type = 'image/x-icon'
faviconLink.href = faviconUrl

if (!faviconLink.parentNode) {
  document.head.appendChild(faviconLink)
}

const manifestLink = document.querySelector('link[rel="manifest"]') || document.createElement('link')
manifestLink.rel = 'manifest'
manifestLink.href = manifestUrl

if (!manifestLink.parentNode) {
  document.head.appendChild(manifestLink)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
