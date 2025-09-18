import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ModalBusquedaGlobal from './ModalBusquedaGlobal'
import NotificacionAtajo from './NotificacionAtajo'
import PermissionGuard from './PermissionGuard'

type Page = 'dashboard' | 'jugadores' | 'multas' | 'finanzas' | 'pagos' | 'configuracion' | 'gestion-normativa'

interface LayoutProps {
  children: React.ReactNode
  currentPage: Page
  setCurrentPage: (page: Page) => void
}

interface ResultadoBusqueda {
  id: string
  tipo: 'jugador' | 'multa' | 'egreso'
  titulo: string
  subtitulo: string
  icono: string
  datos: any
}

function Layout({ children, currentPage, setCurrentPage }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalBusquedaOpen, setModalBusquedaOpen] = useState(false)
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout, isJugador } = useAuth()
  const isActive = (page: string) => currentPage === page

  // Mostrar notificación al cargar por primera vez
  useEffect(() => {
    const hasSeenNotification = localStorage.getItem('hasSeenSearchNotification')
    if (!hasSeenNotification) {
      setTimeout(() => setMostrarNotificacion(true), 2000) // Mostrar después de 2 segundos
    }
  }, [])

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showUserMenu && !target.closest('.user-menu')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const cerrarNotificacion = () => {
    setMostrarNotificacion(false)
    localStorage.setItem('hasSeenSearchNotification', 'true')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
    setMobileMenuOpen(false) // Cerrar menú al navegar en móvil
  }

  const manejarResultadoBusqueda = (resultado: ResultadoBusqueda) => {
    setModalBusquedaOpen(false)
    
    if (resultado.tipo === 'jugador') {
      // Navegar a la página de jugadores y mostrar el jugador seleccionado
      setCurrentPage('jugadores')
      // Aquí podrías implementar un scroll hacia el jugador o destacarlo
    } else if (resultado.tipo === 'multa') {
      // Navegar a la página de multas
      setCurrentPage('multas')
    } else if (resultado.tipo === 'egreso') {
      // Navegar a la página de finanzas
      setCurrentPage('finanzas')
    }
  }

  // Manejar atajo de teclado para búsqueda
  useEffect(() => {
    const manejarAtajo = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setModalBusquedaOpen(true)
      }
    }

    document.addEventListener('keydown', manejarAtajo)
    return () => document.removeEventListener('keydown', manejarAtajo)
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center ml-2 lg:ml-0">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚽</span>
                </div>
                <div className="ml-3">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-bold text-gray-900">Gestión Deportiva</h1>
                    <a
                      href="/reglamento_equipo.pdf"
                      download
                      className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 transition-colors"
                      title="Descargar normativa del equipo"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 8v4m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Descargar Normativa
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de búsqueda y acciones */}
            <div className="flex items-center space-x-4">
              {/* Botón de búsqueda */}
              <button
                onClick={() => setModalBusquedaOpen(true)}
                className="hidden sm:flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar...
                <span className="ml-auto text-xs text-gray-400">⌘K</span>
              </button>

              {/* Botón de búsqueda móvil */}
              <button
                onClick={() => setModalBusquedaOpen(true)}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Avatar/Usuario */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.nombre}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menú desplegable del usuario */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{user?.nombre}</p>
                      <p className="text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notificación de atajo */}
      {mostrarNotificacion && (
        <NotificacionAtajo mostrar={mostrarNotificacion} onCerrar={cerrarNotificacion} />
      )}

      {/* Modal de búsqueda */}
      <ModalBusquedaGlobal 
        isOpen={modalBusquedaOpen} 
        onClose={() => setModalBusquedaOpen(false)}
        onResultadoSeleccionado={manejarResultadoBusqueda}
      />

      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-screen w-full bg-gray-800 text-white overflow-y-auto p-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:w-64 lg:h-[calc(100vh-4rem)] z-30 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="space-y-2">
          {/* Dashboard - Todos pueden ver */}
          <button 
            onClick={() => handlePageChange('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
              isActive('dashboard') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg mr-3">📊</span>
            <span className="font-medium">Dashboard</span>
          </button>

          {/* Pagos - Todos pueden ver, solo admin puede crear */}
          <button 
            onClick={() => handlePageChange('pagos')}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
              isActive('pagos') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg mr-3">💸</span>
            <span className="font-medium">Pagos</span>
          </button>
          
          {/* Jugadores - Todos pueden ver (pero con restricciones) */}
          <button 
            onClick={() => handlePageChange('jugadores')}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
              isActive('jugadores') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg mr-3">👥</span>
            <span className="font-medium">Jugadores</span>
          </button>
          
          {/* Multas - Todos pueden ver (pero con restricciones) */}
          <button 
            onClick={() => handlePageChange('multas')}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
              isActive('multas') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg mr-3">💰</span>
            <span className="font-medium">Multas</span>
          </button>
          
          {/* Finanzas - Solo admin */}
          {!isJugador && (
            <button 
              onClick={() => handlePageChange('finanzas')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                isActive('finanzas') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg mr-3">📈</span>
              <span className="font-medium">Finanzas</span>
            </button>
          )}

          {/* Configuración - Solo admin */}
          <PermissionGuard permission="configuraciones.view">
            <button 
              onClick={() => handlePageChange('configuracion')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                isActive('configuracion') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg mr-3">⚙️</span>
              <span className="font-medium">Configuración</span>
            </button>
          </PermissionGuard>
          
          {/* Separador */}
          <div className="my-4 border-t border-gray-700"></div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 p-4 lg:p-12 min-h-screen relative z-10">
        {children}
      </main>
    </div>
  )
}

export default Layout
