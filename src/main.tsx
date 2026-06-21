import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initLocaleFromBrowser } from './i18n'

// Detect browser language on first load and set locale accordingly
initLocaleFromBrowser();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
