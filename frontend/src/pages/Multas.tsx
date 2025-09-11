import { useState, useEffect } from 'react'
import { multasService, jugadoresService } from '../services/api'
import ControlesPaginacion from '../components/ControlesPaginacion'
import { usePaginacion } from '../hooks/usePaginacion'
import { useAuth } from '../contexts/AuthContext'

// Tipos para la gestión de multas (alineados con backend)
interface CausalMulta {
  id: number
  descripcion: string
  valor: number
}

interface Multa {
  id: number
  jugador_cedula: string
  jugador_nombre?: string
  causal_id: number
  causal_descripcion?: string
  causal_valor?: number
  fecha_multa: string
  pagada: boolean
  fecha_pago?: string
}

interface Jugador {
  cedula: string
  nombre: string
  nombre_inscripcion: string
}

type ModalMode = 'create' | 'edit' | 'view' | null

function Multas() {
  const { isJugador, user } = useAuth()
  
  // Función auxiliar para obtener la fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = () => {
    const ahora = new Date()
    const offset = ahora.getTimezoneOffset() * 60000
    const fechaLocal = new Date(Date.now() - offset)
    return fechaLocal.toISOString().split('T')[0]
  }

  const [multas, setMultas] = useState<Multa[]>([])
  const [causales, setCausales] = useState<CausalMulta[]>([])
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedMulta, setSelectedMulta] = useState<Multa | null>(null)
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    jugador_cedula: '',
    causal_id: 0,
    fecha_multa: obtenerFechaLocal()
  })

  // Estados para aporte grupal
  const [showAporteGrupal, setShowAporteGrupal] = useState(false)
  const [formAporteGrupal, setFormAporteGrupal] = useState({
    descripcion_causal: '',
    valor_causal: 0,
    concepto_aporte: '',
    fecha_multa: obtenerFechaLocal()
  })
  
  // Estado para modal de éxito
  const [showExitoModal, setShowExitoModal] = useState(false)
  const [aporteCreado, setAporteCreado] = useState<{
    total_jugadores: number
    concepto_aporte: string
    grupo_multa_id: string
  } | null>(null)

  const estados = [
    { value: 'pendiente', label: 'Pendiente', color: 'text-yellow-800 bg-yellow-100' },
    { value: 'pagada', label: 'Pagada', color: 'text-green-800 bg-green-100' }
  ]

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchMultas(),
        fetchJugadores(), 
        fetchCausales()
      ])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const fetchMultas = async () => {
    try {
      let data
      if (isJugador && user?.cedula) {
        // Los jugadores solo ven sus propias multas
        data = await multasService.getMultasByJugador(user.cedula)
      } else {
        // Los admins ven todas las multas
        data = await multasService.getMultas(true)
      }
      setMultas(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching multas:', err)
      setError('Error al cargar las multas')
      setMultas([]) // Fallback a array vacío
    } finally {
      setLoading(false)
    }
  }

  const fetchJugadores = async () => {
    // Los jugadores no necesitan ver la lista de todos los jugadores
    if (isJugador) {
      setJugadores([])
      return
    }
    
    try {
      const data = await jugadoresService.getJugadores()
      setJugadores(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching jugadores:', err)
      setJugadores([])
    }
  }

  const fetchCausales = async () => {
    try {
      const data = await multasService.getCausales()
      setCausales(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching causales:', err)
      // Fallback a causales predefinidas
      setCausales([
        { id: 1, descripcion: 'Llegada tarde al entrenamiento', valor: 5000 },
        { id: 2, descripcion: 'Falta injustificada', valor: 15000 },
        { id: 3, descripcion: 'Tarjeta amarilla', valor: 10000 },
        { id: 4, descripcion: 'Tarjeta roja', valor: 20000 }
      ])
    }
  }

  // Funciones de utilidad
  const getJugadorNombre = (multa: Multa) => {
    return multa.jugador_nombre || 'Desconocido'
  }

  const getCausalDescripcion = (multa: Multa) => {
    return multa.causal_descripcion || 'Desconocida'
  }

  const getCausalValor = (multa: Multa) => {
    return multa.causal_valor || 0
  }

  const getEstadoInfo = (pagada: boolean) => {
    return pagada ? estados[1] : estados[0]
  }

  // Función de filtro para la paginación
  const filtroMultas = (multa: Multa, termino: string) => {
    const jugador = getJugadorNombre(multa)
    const causal = getCausalDescripcion(multa)
    
    const matchesSearch = 
      jugador.toLowerCase().includes(termino.toLowerCase()) ||
      multa.jugador_cedula.includes(termino) ||
      causal.toLowerCase().includes(termino.toLowerCase())
    
    const matchesEstado = estadoFilter === '' || 
      (estadoFilter === 'pendiente' && !multa.pagada) ||
      (estadoFilter === 'pagada' && multa.pagada)
    
    return (!termino || matchesSearch) && matchesEstado
  }

  // Hook de paginación
  const paginacion = usePaginacion({
    datos: multas,
    itemsPorPagina: 10,
    filtro: filtroMultas,
    terminoBusqueda: terminoBusqueda
  })

  // Cálculos
  const calcularTotalPendiente = () => {
    return multas
      .filter(multa => !multa.pagada)
      .reduce((total, multa) => total + getCausalValor(multa), 0)
  }

  const calcularTotalRecaudado = () => {
    return multas
      .filter(multa => multa.pagada)
      .reduce((total, multa) => total + getCausalValor(multa), 0)
  }

  // Modal handlers
  const openModal = (mode: ModalMode, multa?: Multa) => {
    setModalMode(mode)
    setSelectedMulta(multa || null)
    
    if (mode === 'create') {
      setFormData({
        jugador_cedula: '',
        causal_id: 0,
        fecha_multa: obtenerFechaLocal()
      })
    } else if (mode === 'edit' && multa) {
      setFormData({
        jugador_cedula: multa.jugador_cedula,
        causal_id: multa.causal_id,
        fecha_multa: multa.fecha_multa
      })
    }
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedMulta(null)
    setFormData({
      jugador_cedula: '',
      causal_id: 0,
      fecha_multa: obtenerFechaLocal()
    })
  }

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.jugador_cedula) {
      setError('Por favor selecciona un jugador')
      return
    }
    
    if (!formData.causal_id || formData.causal_id === 0) {
      setError('Por favor selecciona una causal')
      return
    }
    
    const fechaSeleccionada = new Date(formData.fecha_multa)
    const hoy = new Date()
    if (fechaSeleccionada > hoy) {
      setError('La fecha de la multa no puede ser futura')
      return
    }
    
    try {
      if (modalMode === 'create') {
        await multasService.createMulta(formData)
      } else if (modalMode === 'edit' && selectedMulta) {
        await multasService.updateMulta(selectedMulta.id, formData)
      }
      
      await fetchMultas()
      closeModal()
      setError(null)
    } catch (err: any) {
      console.error('Error saving multa:', err)
      let errorMessage = 'Error al guardar la multa'
      
      if (err.response?.data?.detail) {
        // Si el detalle es un string, usarlo directamente
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        } else {
          // Si es un objeto o array, convertirlo a string
          errorMessage = JSON.stringify(err.response.data.detail)
        }
      }
      
      setError(errorMessage)
    }
  }

  const handleDelete = async (multa: Multa) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta multa?`)) {
      try {
        await multasService.deleteMulta(multa.id)
        await fetchMultas()
      } catch (err) {
        console.error('Error deleting multa:', err)
        setError('Error al eliminar la multa')
      }
    }
  }

  const handleAporteGrupal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formAporteGrupal.descripcion_causal.trim()) {
      setError('La descripción de la causal es obligatoria')
      return
    }

    if (formAporteGrupal.valor_causal <= 0) {
      setError('El valor debe ser mayor a 0')
      return
    }

    if (!formAporteGrupal.concepto_aporte.trim()) {
      setError('El concepto del aporte es obligatorio')
      return
    }

    try {
      // Primero crear la causal específica para este aporte
      const nuevaCausal = await multasService.createCausal({
        descripcion: formAporteGrupal.descripcion_causal,
        valor: formAporteGrupal.valor_causal
      })

      // Luego crear el aporte grupal con esa causal
      const aporteData = {
        causal_id: nuevaCausal.id,
        concepto_aporte: formAporteGrupal.concepto_aporte,
        fecha_multa: formAporteGrupal.fecha_multa
      }

      const response = await multasService.createAporteGrupal(aporteData)
      
      // Guardar datos del aporte creado y mostrar modal elegante
      setAporteCreado({
        total_jugadores: response.total_jugadores,
        concepto_aporte: response.concepto_aporte,
        grupo_multa_id: response.grupo_multa_id
      })
      setShowExitoModal(true)
      
      // Actualizar datos
      await Promise.all([fetchMultas(), fetchCausales()])

    } catch (err: any) {
      console.error('Error creating aporte grupal:', err)
      let errorMessage = 'Error al crear el aporte grupal'
      
      if (err.response?.data?.detail) {
        // Si el detalle es un string, usarlo directamente
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        } else {
          // Si es un objeto o array, convertirlo a string
          errorMessage = JSON.stringify(err.response.data.detail)
        }
      }
      
      setError(errorMessage)
    }
  }

  const cerrarModalExito = () => {
    setShowExitoModal(false)
    setAporteCreado(null)
    
    // Limpiar formulario y cerrar modal de aporte grupal
    setFormAporteGrupal({
      descripcion_causal: '',
      valor_causal: 0,
      concepto_aporte: '',
      fecha_multa: obtenerFechaLocal()
    })
    setShowAporteGrupal(false)
  }

  // Render

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-gray-600">Cargando multas...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 lg:mt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {isJugador ? 'Mis Multas' : 'Gestión de Multas'}
        </h1>
        {!isJugador && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAporteGrupal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              💰 Aporte Grupal
            </button>
            <button
              onClick={() => openModal('create')}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              + Nueva Multa
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Multas Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                ${calcularTotalPendiente().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recaudado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${calcularTotalRecaudado().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Multas</p>
              <p className="text-2xl font-bold text-gray-900">{multas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar jugador
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los estados</option>
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-600">
          {paginacion.totalItems} multa(s) encontrada(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Causal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
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
              {paginacion.datosPaginados.map((multa: Multa) => {
                const estadoInfo = getEstadoInfo(multa.pagada)
                return (
                  <tr key={multa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getJugadorNombre(multa)}
                        </div>
                        <div className="text-sm text-gray-500">{multa.jugador_cedula}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getCausalDescripcion(multa)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${getCausalValor(multa).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(multa.fecha_multa).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal('view', multa)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                      {!isJugador && (
                        <>
                          <button
                            onClick={() => openModal('edit', multa)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(multa)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {paginacion.totalItems === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {estadoFilter ? 'No se encontraron multas con el filtro aplicado' : 'No hay multas registradas'}
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {modalMode === 'create' && 'Nueva Multa'}
                  {modalMode === 'edit' && 'Editar Multa'}
                  {modalMode === 'view' && 'Detalles de la Multa'}
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

              {modalMode === 'view' && selectedMulta ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jugador</label>
                    <p className="mt-1 text-sm text-gray-900">{getJugadorNombre(selectedMulta)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Causal</label>
                    <p className="mt-1 text-sm text-gray-900">{getCausalDescripcion(selectedMulta)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <p className="mt-1 text-sm text-gray-900">${getCausalValor(selectedMulta).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedMulta.fecha_multa).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <p className="mt-1 text-sm text-gray-900">{getEstadoInfo(selectedMulta.pagada).label}</p>
                  </div>
                  {selectedMulta.fecha_pago && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedMulta.fecha_pago).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jugador *
                    </label>
                    <select
                      required
                      value={formData.jugador_cedula}
                      onChange={(e) => setFormData({ ...formData, jugador_cedula: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Seleccionar jugador</option>
                      {jugadores.map(jugador => (
                        <option key={jugador.cedula} value={jugador.cedula}>
                          {jugador.nombre} ({jugador.nombre_inscripcion}) - {jugador.cedula}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Causal *
                    </label>
                    <select
                      required
                      value={formData.causal_id}
                      onChange={(e) => setFormData({ ...formData, causal_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value={0}>Seleccionar causal</option>
                      {causales.map(causal => (
                        <option key={causal.id} value={causal.id}>
                          {causal.descripcion} - ${causal.valor.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fecha_multa}
                      onChange={(e) => setFormData({ ...formData, fecha_multa: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
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
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                      {modalMode === 'create' ? 'Crear Multa' : 'Actualizar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aporte Grupal */}
      {showAporteGrupal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  💰 Crear Aporte Grupal
                </h3>
                <button
                  onClick={() => setShowAporteGrupal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>¿Qué es un aporte grupal?</strong><br/>
                  Se creará una nueva causal para aporte grupal y se asignará automáticamente a todos los jugadores activos del equipo.
                </p>
              </div>

              <form onSubmit={handleAporteGrupal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la Causal *
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Aporte para trofeos, Contribución para uniformes..."
                    value={formAporteGrupal.descripcion_causal}
                    onChange={(e) => setFormAporteGrupal({...formAporteGrupal, descripcion_causal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor por Jugador *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    placeholder="10000"
                    value={formAporteGrupal.valor_causal || ''}
                    onChange={(e) => setFormAporteGrupal({...formAporteGrupal, valor_causal: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cada jugador activo deberá aportar este valor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concepto del Aporte *
                  </label>
                  <textarea
                    placeholder="Describir para qué es este aporte grupal..."
                    value={formAporteGrupal.concepto_aporte}
                    onChange={(e) => setFormAporteGrupal({...formAporteGrupal, concepto_aporte: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Aporte
                  </label>
                  <input
                    type="date"
                    value={formAporteGrupal.fecha_multa}
                    onChange={(e) => setFormAporteGrupal({...formAporteGrupal, fecha_multa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAporteGrupal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors"
                  >
                    Crear Aporte Grupal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito para Aporte Grupal */}
      {showExitoModal && aporteCreado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header del modal */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Aporte Grupal Creado Exitosamente!
                </h3>
                <p className="text-gray-600">
                  El aporte se ha asignado automáticamente a todos los jugadores activos
                </p>
              </div>

              {/* Detalles del aporte */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Concepto:</span>
                    <span className="text-sm text-gray-900 font-semibold">{aporteCreado.concepto_aporte}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Jugadores incluidos:</span>
                    <span className="text-sm text-orange-700 font-bold">{aporteCreado.total_jugadores} jugadores</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">ID del grupo:</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                      {aporteCreado.grupo_multa_id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>¿Qué sigue?</strong><br/>
                      Cada jugador ahora tiene esta multa en su cuenta. Puedes ver el estado de los pagos en la lista de multas o en la sección de pagos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={cerrarModalExito}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    cerrarModalExito()
                    // Opcionalmente navegar a la lista de multas filtrada
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Ver Multas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Multas
