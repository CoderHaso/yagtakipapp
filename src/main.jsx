import { createRoot } from 'react-dom/client'
import App from './App'
import TabletApp from './pages/TabletApp'
import './styles.css'

// Ana adres = tablet/fabrika uygulaması (PWA ana ekrana eklenince burası açılır).
// Yönetim paneli /pcmod altında; /tablet eski bağlantılar için ana uygulamaya düşer.
var path = window.location.pathname.replace(/\/+$/, '')
var isPanel = path === '/pcmod'

createRoot(document.getElementById('root')).render(
  isPanel ? <App /> : <TabletApp />
)
