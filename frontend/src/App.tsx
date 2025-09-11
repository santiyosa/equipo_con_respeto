import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Jugadores from './pages/Jugadores'
import Multas from './pages/Multas'
import Finanzas from './pages/Finanzas'
import Pagos from './pages/Pagos'
import Configuracion from './pages/Configuracion'

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
    <AuthProvider>
      <PrivateRoute>
        <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
          {renderPage()}
        </Layout>
      </PrivateRoute>
    </AuthProvider>
  )
}

export default App
