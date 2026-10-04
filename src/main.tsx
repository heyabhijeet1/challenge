import { createRoot } from 'react-dom/client'
import './index.css'
import './fonts.css'
import App from './App'

// No StrictMode: the app logic initialises once against the rendered DOM.
createRoot(document.getElementById('root')!).render(<App />)
