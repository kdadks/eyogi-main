import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import SEOProvider from './components/seo/SEOProvider'
import App from './App'
import './index.css'
import { initializeDefaultData } from './lib/local-data/storage'

// Initialize default data on app start
initializeDefaultData()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SEOProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SEOProvider>
  </React.StrictMode>,
)