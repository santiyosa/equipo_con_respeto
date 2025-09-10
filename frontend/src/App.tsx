import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Jugadores from './pages/Jugadores'
import Multas from './pages/Multas'
import Finanzas from './pages/Finanzas'
import Pagos from './pages/Pagos'
import Configuracion from './pages/Configuracion'
import './utils/debug' // Import debug utilities

type Page = 'dashboard' | 'jugadores' | 'multas' | 'finanzas' | 'pagos' | 'configuracion'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'jugadores':
        return <Jugadores />
      case 'multas':
        return <Multas />
      case 'finanzas':
        return <Finanzas />
      case 'pagos':
        return <Pagos />
      case 'configuracion':
        return <Configuracion />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
