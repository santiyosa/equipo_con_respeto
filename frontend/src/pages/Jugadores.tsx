import { useState, useEffect } from 'react'
import { jugadoresService, multasService } from '../services/api'
import { dashboardService, JugadorConPagosMensuales } from '../services/dashboardService'
import ControlesPaginacion from '../components/ControlesPaginacion'
import { usePaginacion } from '../hooks/usePaginacion'

// Tipos alineados con el backend
interface Jugador {
  nombre: string
  cedula: string
  telefono: string
  fecha_nacimiento: string
  talla_uniforme: string
  numero_camiseta?: number
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
  recomendado_por_cedula?: string
  nombre_inscripcion: string
  fecha_inscripcion: string
  posicion?: string  // null/undefined para jugadores de campo, "arquero" para porteros
  estado_cuenta: boolean
  activo: boolean
  created_at: string
}

interface JugadorConMultas extends Jugador {
  valor_multas_pendientes?: number
}

interface JugadorFormData {
  nombre: string
  cedula: string
  telefono: string
  fecha_nacimiento: string
  talla_uniforme: string
  numero_camiseta?: number
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
  recomendado_por_cedula?: string
  nombre_inscripcion: string
  posicion: string  // "" para jugadores de campo, "arquero" para porteros
}

type ModalMode = 'create' | 'edit' | 'view' | null

// Nombres de los meses
const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

function Jugadores() {
  const [jugadores, setJugadores] = useState<JugadorConMultas[]>([])
  const [jugadoresConPagos, setJugadoresConPagos] = useState<JugadorConPagosMensuales[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedJugador, setSelectedJugador] = useState<Jugador | null>(null)
  const [añoActual] = useState(new Date().getFullYear())
  
  // Estados para ordenamiento y filtrado
  const [ordenPor, setOrdenPor] = useState<'nombre' | 'multas' | null>(null)
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al-dia' | 'con-multas'>('todos')
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  
  const [formData, setFormData] = useState<JugadorFormData>({
    nombre: '',
    cedula: '',
    telefono: '',
    fecha_nacimiento: '',
    talla_uniforme: '',
    numero_camiseta: undefined,
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    recomendado_por_cedula: '',
    nombre_inscripcion: '',
    posicion: ''
  })

  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  useEffect(() => {
    fetchJugadores()
  }, [])

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      // Cargar jugadores, multas y pagos mensuales en paralelo
      const [jugadoresData, multasData, pagosMensualesData] = await Promise.all([
        jugadoresService.getJugadores(),
        multasService.getMultas(false), // Solo multas pendientes
        dashboardService.obtenerEstadoPagosPorMes(añoActual)
      ])
      
      // Calcular valor de multas pendientes por jugador
      const jugadoresConMultas = jugadoresData.map((jugador: Jugador) => {
        const multasJugador = multasData.filter((multa: any) => 
          multa.jugador_cedula === jugador.cedula && !multa.pagada
        )
        const valorMultas = multasJugador.reduce((total: number, multa: any) => 
          total + (multa.causal_valor || 0), 0
        )
        
        return {
          ...jugador,
          valor_multas_pendientes: valorMultas
        }
      })
      
      setJugadores(jugadoresConMultas)
      setJugadoresConPagos(pagosMensualesData)
      setError(null)
    } catch (err) {
      setError('Error al cargar los jugadores')
      console.error('Error fetching jugadores:', err)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoJugador = async (cedula: string, activo: boolean) => {
    try {
      await jugadoresService.cambiarEstadoJugador(cedula, activo)
      // Recargar la lista de jugadores para mostrar el cambio
      await fetchJugadores()
      setError(null)
    } catch (err) {
      setError(`Error al ${activo ? 'activar' : 'desactivar'} el jugador`)
      console.error('Error cambiando estado del jugador:', err)
    }
  }

  // Función para manejar ordenamiento
  const manejarOrdenamiento = (criterio: 'nombre' | 'multas') => {
    if (ordenPor === criterio) {
      // Si ya está ordenado por este criterio, cambiar dirección
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')
    } else {
      // Cambiar criterio de ordenamiento
      setOrdenPor(criterio)
      setOrdenDireccion('asc')
    }
  }

  // Combinar datos de jugadores con pagos mensuales
  const jugadoresCompletos = jugadores.map(jugador => {
    const pagosMensuales = jugadoresConPagos.find(jp => jp.cedula === jugador.cedula)
    return {
      ...jugador,
      meses: pagosMensuales?.meses || {}
    }
  })

  // Ordenar jugadores después de combinar datos
  const jugadoresOrdenados = [...jugadoresCompletos].sort((a, b) => {
    // Prioridad 1: Jugadores activos siempre van antes que los inactivos
    if (a.activo !== b.activo) {
      return a.activo ? -1 : 1 // Activos (-1) van antes que inactivos (1)
    }

    // Prioridad 2: Si ambos tienen el mismo estado activo, aplicar ordenamiento seleccionado
    if (!ordenPor) return 0

    let comparacion = 0
    
    if (ordenPor === 'nombre') {
      comparacion = a.nombre.localeCompare(b.nombre)
    } else if (ordenPor === 'multas') {
      const multasA = a.valor_multas_pendientes || 0
      const multasB = b.valor_multas_pendientes || 0
      comparacion = multasA - multasB
    }

    return ordenDireccion === 'desc' ? -comparacion : comparacion
  })

  // Función para calcular si un jugador está al día
  const calcularEstadoAlDia = (jugador: any) => {
    const multasPendientes = (jugador.valor_multas_pendientes || 0) > 0
    
    // Si tiene multas pendientes, NO está al día
    if (multasPendientes) {
      return false
    }
    
    // Solo los arqueros no pagan mensualidades - cualquier otra posición SÍ paga
    if (jugador.posicion === 'arquero') {
      return true // Solo necesita tener multas pagadas
    }
    
    // Para todas las demás posiciones (jugador, defensa, medio, delantero, etc.), verificar mensualidades
    // (Esta lógica se simplifica por ahora, el backend debería calcular esto)
    const fechaInscripcion = new Date(jugador.fecha_inscripcion)
    const hoy = new Date()
    const añoActual = hoy.getFullYear()
    const mesActual = hoy.getMonth() + 1
    
    // Calcular meses que debería tener pagados desde la inscripción
    const añoInscripcion = fechaInscripcion.getFullYear()
    const mesInscripcion = fechaInscripcion.getMonth() + 1
    
    let mesesDebe = 0
    for (let año = añoInscripcion; año <= añoActual; año++) {
      const mesInicio = año === añoInscripcion ? mesInscripcion : 1
      const mesFin = año === añoActual ? mesActual : 12
      mesesDebe += (mesFin - mesInicio + 1)
    }
    
    // Por simplicidad, asumimos que si no tiene multas pendientes y es jugador regular,
    // necesitaríamos consultar las mensualidades pagadas al backend
    // Por ahora usamos el estado_cuenta del backend como referencia
    return jugador.estado_cuenta === true
  }

  // Aplicar filtrado por estado
  const jugadoresFiltrados = jugadoresOrdenados.filter(jugador => {
    if (filtroEstado === 'al-dia') {
      return calcularEstadoAlDia(jugador)
    } else if (filtroEstado === 'con-multas') {
      return (jugador.valor_multas_pendientes || 0) > 0
    }
    return true // 'todos'
  })

  // Función de filtro para búsqueda por nombre
  const filtroJugador = (jugador: any, termino: string) => {
    if (!termino) return true
    return jugador.nombre.toLowerCase().includes(termino.toLowerCase()) ||
           jugador.cedula.includes(termino)
  }

  // Hook de paginación con filtro de búsqueda
  const paginacion = usePaginacion({
    datos: jugadoresFiltrados,
    itemsPorPagina: 20,
    filtro: filtroJugador,
    terminoBusqueda: terminoBusqueda
  })

  const openModal = (mode: ModalMode, jugador?: Jugador) => {
    setModalMode(mode)
    setSelectedJugador(jugador || null)
    
    if (mode === 'create') {
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        fecha_nacimiento: '',
        talla_uniforme: '',
        numero_camiseta: undefined,
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        recomendado_por_cedula: '',
        nombre_inscripcion: '',
        posicion: ''
      })
    } else if (mode === 'edit' && jugador) {
      setFormData({
        nombre: jugador.nombre,
        cedula: jugador.cedula,
        telefono: jugador.telefono,
        fecha_nacimiento: jugador.fecha_nacimiento,
        talla_uniforme: jugador.talla_uniforme,
        numero_camiseta: jugador.numero_camiseta,
        contacto_emergencia_nombre: jugador.contacto_emergencia_nombre,
        contacto_emergencia_telefono: jugador.contacto_emergencia_telefono,
        recomendado_por_cedula: jugador.recomendado_por_cedula || '',
        nombre_inscripcion: jugador.nombre_inscripcion,
        posicion: jugador.posicion || ''
      })
    }
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedJugador(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (modalMode === 'create') {
        await jugadoresService.createJugador(formData)
      } else if (modalMode === 'edit' && selectedJugador) {
        await jugadoresService.updateJugador(selectedJugador.cedula, formData)
      }
      
      await fetchJugadores()
      closeModal()
    } catch (err) {
      console.error('Error saving jugador:', err)
      setError('Error al guardar el jugador')
    }
  }

  const handleExportarListadoBasico = async () => {
    try {
      console.log('Exportando listado básico de jugadores activos')
      // Filtrar solo jugadores activos
      const jugadoresActivos = jugadores.filter(jugador => jugador.estado_cuenta)
      if (jugadoresActivos.length === 0) {
        setError('No hay jugadores activos para exportar')
        return
      }
      
      // Usar el nuevo endpoint específico
      const blob = await jugadoresService.exportarListadoBasicoPDF()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `listado-basico-jugadores-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('Listado básico exportado exitosamente')
    } catch (error) {
      console.error('Error exportando listado básico:', error)
      setError('Error al exportar el listado básico')
    }
  }

  const handleExportarListadoCompleto = async () => {
    try {
      console.log('Exportando listado completo de jugadores activos')
      // Filtrar solo jugadores activos
      const jugadoresActivos = jugadores.filter(jugador => jugador.estado_cuenta)
      if (jugadoresActivos.length === 0) {
        setError('No hay jugadores activos para exportar')
        return
      }
      
      // Usar el nuevo endpoint específico
      const blob = await jugadoresService.exportarListadoCompletoPDF()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `listado-completo-jugadores-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('Listado completo exportado exitosamente')
    } catch (error) {
      console.error('Error exportando listado completo:', error)
      setError('Error al exportar el listado completo')
    }
  }

  const handleExportarPagosMensuales = async () => {
    try {
      console.log('Exportando estado de pagos mensuales')
      const blob = await jugadoresService.exportarListadoConPagosMensualesPDF()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `pagos-mensuales-${new Date().getFullYear()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('Reporte de pagos mensuales exportado exitosamente')
    } catch (error) {
      console.error('Error exportando pagos mensuales:', error)
      setError('Error al exportar el reporte de pagos mensuales')
    }
  }

  const handleExportarReporteDashboard = async () => {
    try {
      console.log('Exportando reporte ejecutivo del dashboard')
      const { dashboardService } = await import('../services/dashboardService')
      const blob = await dashboardService.exportarReporteEjecutivoPDF()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `reporte-ejecutivo-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('Reporte ejecutivo exportado exitosamente')
    } catch (error) {
      console.error('Error exportando reporte ejecutivo:', error)
      setError('Error al exportar el reporte ejecutivo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-gray-600">Cargando jugadores...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 lg:mt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Jugadores
        </h1>
        <div className="flex space-x-3">
          {/* Dropdown para exportar listado completo */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
            >
              📄 Exportar PDF
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="hidden origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleExportarListadoBasico();
                    // Ocultar dropdown
                    const dropdown = document.querySelector('.hidden') as HTMLElement;
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  📊 Listado Básico (Estado de Cuenta)
                </button>
                <button
                  onClick={() => {
                    handleExportarListadoCompleto();
                    // Ocultar dropdown
                    const dropdown = document.querySelector('.hidden') as HTMLElement;
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  📋 Listado Completo (Todos los Datos)
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    handleExportarPagosMensuales();
                    // Ocultar dropdown
                    const dropdown = document.querySelector('.hidden') as HTMLElement;
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  📅 Estado de Pagos Mensuales (Dashboard)
                </button>
                <button
                  onClick={() => {
                    handleExportarReporteDashboard();
                    // Ocultar dropdown
                    const dropdown = document.querySelector('.hidden') as HTMLElement;
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  📈 Reporte Ejecutivo (Dashboard)
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + Nuevo Jugador
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Controles de Ordenamiento y Filtrado */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Campo de búsqueda */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Buscar:</span>
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
            <button
              onClick={() => manejarOrdenamiento('nombre')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                ordenPor === 'nombre'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } border`}
            >
              Nombre {ordenPor === 'nombre' && (ordenDireccion === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => manejarOrdenamiento('multas')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                ordenPor === 'multas'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } border`}
            >
              Multas {ordenPor === 'multas' && (ordenDireccion === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Filtrado por estado */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Mostrar:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'al-dia' | 'con-multas')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los jugadores</option>
              <option value="al-dia">Solo jugadores al día</option>
              <option value="con-multas">Solo con multas</option>
            </select>
          </div>

          {/* Contador de resultados */}
          <div className="ml-auto text-sm text-gray-600">
            {paginacion.totalItems} jugador(es) encontrado(s)
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre y Alias
                </th>
                {MESES.map((mes, index) => (
                  <th key={index + 1} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mes}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Multas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginacion.datosPaginados.map((jugador: any) => (
                <tr key={jugador.cedula} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {jugador.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {jugador.nombre_inscripcion}
                      </div>
                    </div>
                  </td>
                  {/* Columnas de meses */}
                  {Array.from({ length: 12 }, (_, index) => {
                    const mes = (index + 1).toString()
                    const estadoPago = jugador.meses[mes]
                    const pagado = estadoPago?.pagado || false
                    
                    return (
                      <td key={mes} className="px-2 py-4 text-center">
                        <div className="flex justify-center">
                          {pagado ? (
                            <span 
                              className="text-green-600 text-lg font-bold" 
                              title={`Pagado - $${estadoPago.valor?.toLocaleString()}`}
                            >
                              ✅
                            </span>
                          ) : (
                            <span 
                              className="text-red-600 text-lg font-bold" 
                              title="No pagado"
                            >
                              ❌
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                      (jugador.valor_multas_pendientes || 0) === 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      ${(jugador.valor_multas_pendientes || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {/* Indicador de posición */}
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        jugador.posicion === 'arquero' 
                          ? 'bg-blue-100 text-blue-800'
                          : jugador.posicion && jugador.posicion.trim() !== ''
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {jugador.posicion === 'arquero' 
                          ? '🥅 Arquero' 
                          : jugador.posicion && jugador.posicion.trim() !== ''
                          ? `⚽ ${jugador.posicion.charAt(0).toUpperCase() + jugador.posicion.slice(1)}`
                          : '⚽ Jugador'
                        }
                      </div>
                      
                      {/* Estado de cuenta */}
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        calcularEstadoAlDia(jugador)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {calcularEstadoAlDia(jugador) ? '✅ Al día' : '⚠️ Debe'}
                      </div>
                      
                      {/* Estado activo/inactivo */}
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        jugador.activo 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {jugador.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openModal('view', jugador)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => openModal('edit', jugador)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => cambiarEstadoJugador(jugador.cedula, !jugador.activo)}
                        className={`font-medium ${
                          jugador.activo 
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {jugador.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paginacion.totalItems === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No hay jugadores registrados
              </div>
            </div>
          )}
        </div>
        
        {/* Controles de paginación */}
        {paginacion.totalItems > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <ControlesPaginacion
              paginaActual={paginacion.paginaActual}
              totalPaginas={paginacion.totalPaginas}
              totalItems={paginacion.totalItems}
              indicePrimerItem={paginacion.indicePrimerItem}
              indiceUltimoItem={paginacion.indiceUltimoItem}
              siguientePagina={paginacion.siguientePagina}
              paginaAnterior={paginacion.paginaAnterior}
              irAPagina={paginacion.irAPagina}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {modalMode === 'create' && 'Nuevo Jugador'}
                  {modalMode === 'edit' && 'Editar Jugador'}
                  {modalMode === 'view' && 'Detalles del Jugador'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalMode === 'view' && selectedJugador ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alias/Inscripción</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.nombre_inscripcion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cédula</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.cedula}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.telefono}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedJugador.fecha_nacimiento).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Talla Uniforme</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.talla_uniforme}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número Camiseta</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.numero_camiseta || 'No asignado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado de Cuenta</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.estado_cuenta ? 'AL DÍA' : 'CON DEUDA'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Contacto de Emergencia</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedJugador.contacto_emergencia_nombre} - {selectedJugador.contacto_emergencia_telefono}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Inscripción</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedJugador.fecha_inscripcion).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias/Nombre Inscripción *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre_inscripcion}
                        onChange={(e) => setFormData({ ...formData, nombre_inscripcion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        disabled={modalMode === 'edit'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_nacimiento}
                        onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Talla Uniforme *
                      </label>
                      <select
                        required
                        value={formData.talla_uniforme}
                        onChange={(e) => setFormData({ ...formData, talla_uniforme: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar talla</option>
                        {tallas.map(talla => (
                          <option key={talla} value={talla}>{talla}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Camiseta
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.numero_camiseta || ''}
                        onChange={(e) => setFormData({ ...formData, numero_camiseta: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Posición *
                      </label>
                      <select
                        value={formData.posicion}
                        onChange={(e) => setFormData({ ...formData, posicion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Jugador de Campo</option>
                        <option value="defensa">Defensa</option>
                        <option value="medio">Medio Campo</option>
                        <option value="delantero">Delantero</option>
                        <option value="arquero">Arquero (Portero)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Solo los arqueros no pagan mensualidades. Todas las demás posiciones pagan mensualidades y multas
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contacto Emergencia - Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contacto_emergencia_nombre}
                        onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contacto Emergencia - Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contacto_emergencia_telefono}
                        onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recomendado por (Cédula)
                      </label>
                      <input
                        type="text"
                        value={formData.recomendado_por_cedula}
                        onChange={(e) => setFormData({ ...formData, recomendado_por_cedula: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cédula del jugador que lo recomendó"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      {modalMode === 'create' ? 'Crear Jugador' : 'Actualizar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Jugadores
