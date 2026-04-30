// File: main.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// The entry point of the app. It mounts the root React component so the app can be rendered in the browser

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
