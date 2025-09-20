import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { jugadoresService, multasService } from '../services/api'
import { dashboardService, JugadorConPagosMensuales } from '../services/dashboardService'

// Tipos alineados con el backend
interface Jugador {
  cedula: string
  nombre: string
  apellido: string // ✅ Agregado campo apellido que existe en el backend
  nombre_inscripcion: string
  telefono: string
  email?: string
  fecha_nacimiento: string
  posicion?: string
  numero_camiseta?: number
  talla_uniforme: string
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
  recomendado_por_cedula?: string // Campo para la cédula del recomendador
  estado_cuenta: boolean
  estado?: string
  activo: boolean
  fecha_inscripcion: string
  created_at: string
  // Campos médicos
  eps?: string
  lugar_atencion?: string
  rh?: string
}

interface JugadorConEstadoCompleto extends Jugador {
  valor_multas_pendientes: number
  meses: { [mes: string]: { pagado: boolean, valor: number, fecha_pago: string | null } }
}

// Nombres de los meses
const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

type ModalMode = 'view' | 'edit' | 'create';

interface JugadorFormData {
  cedula?: string
  nombre: string
  apellido: string // ✅ Campo apellido sí existe en el backend
  telefono: string
  email?: string
  fecha_nacimiento: string
  posicion?: string
  numero_camiseta?: number
  talla_uniforme: string  // Cambiado de talla_camiseta
  direccion?: string  // Este campo no existe en el backend
  contacto_emergencia_nombre: string  // Separado en nombre y teléfono
  contacto_emergencia_telefono: string
  nombre_inscripcion: string
  recomendado_por_cedula?: string  // Campo para la cédula del jugador que recomienda
  // Campos médicos
  eps?: string
  lugar_atencion?: string
  rh?: string
}

function Jugadores() {
  const { user, isJugador, isAdmin } = useAuth()
  const [jugadores, setJugadores] = useState<JugadorConEstadoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [añoActual] = useState(new Date().getFullYear())
  const [filtro, setFiltro] = useState('')
  
  // Estados para ordenamiento
  const [ordenarPor, setOrdenarPor] = useState<string>('nombre')
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('asc')
  
  // Estados para el modal de edición
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedJugador, setSelectedJugador] = useState<Jugador | null>(null)
  const [formData, setFormData] = useState<JugadorFormData>({
    cedula: '',
    nombre: '',
    apellido: '', // ✅ Agregado el campo apellido
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    posicion: '',
    numero_camiseta: 0,
    talla_uniforme: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    nombre_inscripcion: '',
    recomendado_por_cedula: '', // Campo para la cédula del recomendador
    // Campos médicos
    eps: '',
    lugar_atencion: '',
    rh: ''
  })

  useEffect(() => {
    fetchJugadores()
  }, [])

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (isJugador && user?.cedula) {
        // Para jugadores, obtener SOLO su información, no la de otros
        const [miInfo, multasData, pagosMensualesData] = await Promise.all([
          jugadoresService.getJugador(user.cedula),
          multasService.getMultasByJugador(user.cedula, false), // Solo multas pendientes del jugador
          dashboardService.obtenerEstadoPagosPorMes(añoActual)
        ])
        
        // Calcular valor de multas pendientes del jugador
        const valorMultas = multasData.reduce((total: number, multa: any) => 
          total + (multa.valor || 0), 0  // Usar valor real de la multa
        )
        
        // Buscar datos de pagos mensuales del jugador
        const pagosMensuales = pagosMensualesData.find((jp: JugadorConPagosMensuales) => 
          jp.cedula === user.cedula
        )
        
        const jugadorCompleto: JugadorConEstadoCompleto = {
          ...miInfo,
          valor_multas_pendientes: valorMultas,
          meses: pagosMensuales?.meses || {}
        }
        setJugadores([jugadorCompleto])
      } else if (isAdmin) {
        // SOLO los administradores pueden ver todos los jugadores
        const [jugadoresData, multasData, pagosMensualesData] = await Promise.all([
          jugadoresService.getJugadores(),
          multasService.getMultas(false), // Solo multas pendientes
          dashboardService.obtenerEstadoPagosPorMes(añoActual)
        ])

        // Calcular valor de multas pendientes por jugador y combinar con datos de pagos
        const jugadoresCompletos = jugadoresData.map((jugador: Jugador) => {
          const multasJugador = multasData.filter((multa: any) => 
            multa.jugador_cedula === jugador.cedula && !multa.pagada
          )
          const valorMultas = multasJugador.reduce((total: number, multa: any) => 
            total + (multa.valor || 0), 0  // Usar valor real de la multa
          )

          // Buscar datos de pagos mensuales
          const pagosMensuales = pagosMensualesData.find((jp: JugadorConPagosMensuales) => 
            jp.cedula === jugador.cedula
          )
          
          return {
            ...jugador,
            valor_multas_pendientes: valorMultas,
            meses: pagosMensuales?.meses || {}
          }
        })

        setJugadores(jugadoresCompletos)
      } else {
        // Si no es ni jugador ni admin, no mostrar nada
        setJugadores([])
        setError('No tienes permisos para ver esta información')
      }
    } catch (err: any) {
      console.error('Error fetching jugadores:', err)
      setError('Error al cargar los jugadores')
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoJugador = async (cedula: string, activo: boolean) => {
    if (!isAdmin) {
      setError('No tienes permisos para realizar esta acción')
      return
    }

    try {
      await jugadoresService.cambiarEstadoJugador(cedula, activo)
      // Recargar la lista de jugadores para mostrar el cambio
      await fetchJugadores()
      setError(null)
    } catch (err) {
      console.error('Error cambiando estado del jugador:', err)
      const errorMessage = err instanceof Error ? err.message : 
                          (typeof err === 'object' && err !== null) ? JSON.stringify(err) : 
                          String(err)
      setError(`Error al ${activo ? 'activar' : 'desactivar'} el jugador: ${errorMessage}`)
    }
  }

  const openModal = (mode: ModalMode, jugador?: Jugador) => {
    if (!isAdmin && (mode === 'edit' || mode === 'create')) {
      setError('Solo los administradores pueden editar o crear jugadores')
      return
    }

    setModalMode(mode)
    setSelectedJugador(jugador || null)
    
    if (mode === 'edit' && jugador) {
      setFormData({
        cedula: jugador.cedula || '',
        nombre: jugador.nombre || '',
        apellido: jugador.apellido || '', // ✅ Agregado campo apellido
        telefono: jugador.telefono || '',
        email: jugador.email || '',
        fecha_nacimiento: jugador.fecha_nacimiento || '',
        posicion: jugador.posicion || '',
        numero_camiseta: jugador.numero_camiseta || 0,
        talla_uniforme: jugador.talla_uniforme || '',
        contacto_emergencia_nombre: jugador.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: jugador.contacto_emergencia_telefono || '',
        nombre_inscripcion: jugador.nombre_inscripcion || '',
        recomendado_por_cedula: jugador.recomendado_por_cedula || '',
        // Campos médicos
        eps: jugador.eps || '',
        lugar_atencion: jugador.lugar_atencion || '',
        rh: jugador.rh || ''
      })
    } else if (mode === 'create') {
      // Resetear formulario para nuevo jugador
      setFormData({
        cedula: '',
        nombre: '',
        apellido: '', // ✅ Agregado campo apellido
        telefono: '',
        email: '',
        fecha_nacimiento: '',
        posicion: '',
        numero_camiseta: 0,
        talla_uniforme: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        nombre_inscripcion: '',
        recomendado_por_cedula: '',
        // Campos médicos
        eps: '',
        lugar_atencion: '',
        rh: ''
      })
    }
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedJugador(null)
  }

  // Función para manejar el ordenamiento
  const manejarOrdenamiento = (campo: string) => {
    if (ordenarPor === campo) {
      // Si ya está ordenado por este campo, cambiar dirección
      setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc')
    } else {
      // Si es un campo diferente, ordenar ascendente
      setOrdenarPor(campo)
      setDireccionOrden('asc')
    }
  }

  // Función para filtrar y ordenar jugadores
  const jugadoresFiltraysOrdenados = jugadores
    .filter(jugador => {
      if (!filtro) return true
      
      const filtroLower = filtro.toLowerCase()
      return (
        (jugador.nombre && jugador.nombre.toLowerCase().includes(filtroLower)) ||
        (jugador.apellido && jugador.apellido.toLowerCase().includes(filtroLower)) ||
        (jugador.cedula && jugador.cedula.toLowerCase().includes(filtroLower)) ||
        (jugador.nombre_inscripcion && jugador.nombre_inscripcion.toLowerCase().includes(filtroLower))
      )
    })
    .sort((a, b) => {
      let valorA: any = ''
      let valorB: any = ''
      
      switch (ordenarPor) {
        case 'nombre':
          valorA = a.nombre || ''
          valorB = b.nombre || ''
          break
        case 'apellido':
          valorA = a.apellido || ''
          valorB = b.apellido || ''
          break
        case 'cedula':
          valorA = a.cedula || ''
          valorB = b.cedula || ''
          break
        case 'estado':
          // Ordenar por estado de cuenta (al día primero)
          valorA = a.estado_cuenta ? 0 : 1
          valorB = b.estado_cuenta ? 0 : 1
          break
        case 'multas':
          valorA = a.valor_multas_pendientes || 0
          valorB = b.valor_multas_pendientes || 0
          break
        case 'numero_camiseta':
          valorA = a.numero_camiseta || 0
          valorB = b.numero_camiseta || 0
          break
        default:
          valorA = a.nombre || ''
          valorB = b.nombre || ''
      }
      
      // Comparar valores
      if (typeof valorA === 'string' && typeof valorB === 'string') {
        const resultado = valorA.localeCompare(valorB)
        return direccionOrden === 'asc' ? resultado : -resultado
      } else {
        const resultado = (valorA as number) - (valorB as number)
        return direccionOrden === 'asc' ? resultado : -resultado
      }
    })

  // Componente para header ordenable
  const HeaderOrdenable = ({ campo, children }: { campo: string; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => manejarOrdenamiento(campo)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {ordenarPor === campo && (
          <span className="text-gray-400">
            {direccionOrden === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAdmin) {
      setError('No tienes permisos para realizar esta acción')
      return
    }

    try {
      if (modalMode === 'create') {
        // Crear nuevo jugador
        await jugadoresService.createJugador(formData)
      } else if (modalMode === 'edit' && selectedJugador) {
        // Editar jugador existente
        await jugadoresService.updateJugador(selectedJugador.cedula, formData)
      }
      
      await fetchJugadores()
      closeModal()
      setError(null)
    } catch (err) {
      console.error('Error saving jugador:', err)
      const errorMessage = err instanceof Error ? err.message : 
                          (typeof err === 'object' && err !== null) ? JSON.stringify(err) : 
                          String(err)
      setError(modalMode === 'create' ? `Error al crear el jugador: ${errorMessage}` : `Error al actualizar el jugador: ${errorMessage}`)
    }
  }

  // Si es jugador y está cargando, mostrar loading
  if (isJugador && loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">Cargando tu información personal...</p>
        </div>
      </div>
    )
  }

  // Si es jugador y no tiene datos, mostrar mensaje
  if (isJugador && !loading && jugadores.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No se pudo cargar tu información personal.</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-gray-600">Cargando jugadores...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isJugador ? 'Mi Información Personal' : 'Gestión de Jugadores'}
        </h1>
        {isAdmin && (
          <button
            onClick={() => openModal('create')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nuevo Jugador</span>
          </button>
        )}
      </div>

      {/* Barra de búsqueda para admins */}
      {!isJugador && (
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar jugador por nombre, apellido, cédula o alias..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Controles de ordenamiento */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
            {[
              { campo: 'nombre', label: 'Nombre' },
              { campo: 'apellido', label: 'Apellido' },
              { campo: 'estado', label: 'Estado' },
              { campo: 'multas', label: 'Multas' },
              { campo: 'numero_camiseta', label: '#' }
            ].map(({ campo, label }) => (
              <button
                key={campo}
                onClick={() => manejarOrdenamiento(campo)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  ordenarPor === campo
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {label} {ordenarPor === campo && (direccionOrden === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Mensaje informativo para jugadores */}
      {isJugador && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
          <p className="text-sm">
            <strong>Información:</strong> Aquí puedes ver tu información personal registrada en el sistema. 
            Si necesitas actualizar algún dato, contacta con algun miembro de la junta.
          </p>
        </div>
      )}

      {/* Resumen de Jugadores con Pagos Mensuales */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <HeaderOrdenable campo="nombre">
                  Jugador
                </HeaderOrdenable>
                {MESES.map((mes, index) => (
                  <th key={index + 1} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mes}
                  </th>
                ))}
                <HeaderOrdenable campo="multas">
                  Multas
                </HeaderOrdenable>
                <HeaderOrdenable campo="estado">
                  Estado
                </HeaderOrdenable>
                {!isJugador && isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jugadoresFiltraysOrdenados.filter(jugador => jugador && jugador.cedula).map((jugador) => (
                <tr key={jugador.cedula} className={`hover:bg-gray-50 ${!jugador.activo ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {(jugador.nombre || '').charAt(0)}{(jugador.nombre_inscripcion || '').charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {(jugador.nombre || 'Sin nombre')} {(jugador.apellido || '')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {jugador.nombre_inscripcion || 'Sin alias'} - #{jugador.numero_camiseta || 'N/A'}
                        </div>
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
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        jugador.activo 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {jugador.activo ? '🟢 Activo' : '🔴 Inactivo'}
                      </div>
                      
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        jugador.estado_cuenta
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {jugador.estado ? jugador.estado : (jugador.estado_cuenta ? '💰 Al día' : '⚠️ Pendiente')}
                      </div>
                    </div>
                  </td>
                  {!isJugador && isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => cambiarEstadoJugador(jugador.cedula, !jugador.activo)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            jugador.activo 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {jugador.activo ? '❌ Inactivar' : '✅ Activar'}
                        </button>
                        <button
                          onClick={() => openModal('edit', jugador)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => openModal('view', jugador)}
                          className="px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                        >
                          👁️ Ver
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {jugadores.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No hay jugadores registrados
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición/Visualización/Creación */}
      {modalMode && (modalMode === 'create' || selectedJugador) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {modalMode === 'create' ? 'Crear Nuevo Jugador' : 
                   modalMode === 'edit' ? 'Editar Jugador' : 'Detalles del Jugador'}
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
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.apellido || 'No disponible'}</p>
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
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.email || 'No disponible'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.fecha_nacimiento ? new Date(selectedJugador.fecha_nacimiento).toLocaleDateString() : 'No disponible'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recomendado por (Cédula)</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.recomendado_por_cedula || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Posición</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.posicion || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número Camiseta</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.numero_camiseta || 'No asignado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Talla Uniforme</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.talla_uniforme}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado de Cuenta</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.estado ? selectedJugador.estado : (selectedJugador.estado_cuenta ? 'AL DÍA' : 'CON PENDIENTES')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.activo ? 'ACTIVO' : 'INACTIVO'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">EPS</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.eps || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar de Atención</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.lugar_atencion || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Sangre (RH)</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedJugador.rh || 'No especificado'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Contacto de Emergencia</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedJugador.contacto_emergencia_nombre} - {selectedJugador.contacto_emergencia_telefono}
                    </p>
                  </div>
                </div>
              ) : (modalMode === 'edit' || modalMode === 'create') ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalMode === 'create' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cédula *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cedula || ''}
                          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Número de cédula"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
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
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
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
                        Recomendado por (Cédula)
                      </label>
                      <input
                        type="text"
                        value={formData.recomendado_por_cedula || ''}
                        onChange={(e) => setFormData({ ...formData, recomendado_por_cedula: e.target.value })}
                        placeholder="Cédula del jugador que lo recomienda"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        Posición
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
                        onChange={(e) => setFormData({ ...formData, numero_camiseta: e.target.value ? parseInt(e.target.value) : 0 })}
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
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Contacto de Emergencia*
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contacto_emergencia_nombre}
                        onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del contacto de emergencia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Contacto de Emergencia*
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contacto_emergencia_telefono}
                        onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Teléfono del contacto de emergencia"
                      />
                    </div>

                  </div>

                  {/* Información Médica */}
                  <div className="col-span-2">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información Médica</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* EPS */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          EPS <span className="text-gray-400">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.eps || ''}
                          onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Entidad Promotora de Salud"
                        />
                      </div>

                      {/* Lugar de Atención */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lugar de Atención <span className="text-gray-400">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lugar_atencion || ''}
                          onChange={(e) => setFormData({ ...formData, lugar_atencion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Hospital, clínica, centro médico"
                        />
                      </div>

                      {/* RH (Tipo de Sangre) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RH <span className="text-gray-400">(Opcional)</span>
                        </label>
                        <select
                          value={formData.rh || ''}
                          onChange={(e) => setFormData({ ...formData, rh: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar tipo de sangre</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

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
                      {modalMode === 'create' ? 'Crear Jugador' : 'Actualizar Jugador'}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Jugadores
