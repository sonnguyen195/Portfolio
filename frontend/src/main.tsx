/* Suppress THREE.Clock deprecation warning from @react-three/fiber until R3F migrates to THREE.Timer */
const origWarn = console.warn
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (msg.includes('THREE.Clock') && msg.includes('deprecated')) return
  origWarn.apply(console, args)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
