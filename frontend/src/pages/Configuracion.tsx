import { useState, useEffect } from 'react'
import { multasService, configuracionesService } from '../services/api'

interface CausalMulta {
  id: number
  descripcion: string
  valor: number
}

interface NuevaCausal {
  descripcion: string
  valor: number
}

interface Configuracion {
  id: number
  clave: string
  valor: number
  descripcion: string
  actualizado_en: string
  actualizado_por?: number
}

interface PosicionJuego {
  id: number
  nombre: string
  descripcion: string
  paga_mensualidad: boolean
}

interface NuevaPosicion {
  nombre: string
  descripcion: string
  paga_mensualidad: boolean
}

function Configuracion() {
  const [causales, setCausales] = useState<CausalMulta[]>([])
  const [mensualidad, setMensualidad] = useState<number>(0)
  const [posiciones, setPosiciones] = useState<PosicionJuego[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados para causales de multa
  const [showFormularioCausal, setShowFormularioCausal] = useState(false)
  const [editandoCausal, setEditandoCausal] = useState<CausalMulta | null>(null)
  const [formDataCausal, setFormDataCausal] = useState<NuevaCausal>({
    descripcion: '',
    valor: 0
  })

  // Estados para mensualidad
  const [editandoMensualidad, setEditandoMensualidad] = useState(false)
  const [nuevoValorMensualidad, setNuevoValorMensualidad] = useState<number>(0)

  // Estados para posiciones de juego
  const [showFormularioPosicion, setShowFormularioPosicion] = useState(false)
  const [editandoPosicion, setEditandoPosicion] = useState<PosicionJuego | null>(null)
  const [formDataPosicion, setFormDataPosicion] = useState<NuevaPosicion>({
    nombre: '',
    descripcion: '',
    paga_mensualidad: true
  })

  // Estados para secciones colapsables
  const [seccionMensualidad, setSeccionMensualidad] = useState(true)
  const [seccionCausales, setSeccionCausales] = useState(false)
  const [seccionPosiciones, setSeccionPosiciones] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Intentar conectar con la API, usar datos estáticos como fallback
      try {
        const [causalesData, configuracionesData] = await Promise.all([
          multasService.getCausales(),
          configuracionesService.getConfiguraciones()
        ])
        
        setCausales(causalesData)
        
        // Buscar la configuración de mensualidad
        const configMensualidad = configuracionesData.find(
          (config: Configuracion) => config.clave === 'mensualidad'
        )
        if (configMensualidad) {
          setMensualidad(configMensualidad.valor)
          setNuevoValorMensualidad(configMensualidad.valor)
        }
      } catch (apiError) {
        console.warn('API no disponible, usando datos estáticos:', apiError)
        
        // Datos estáticos de fallback
        const causalesEstaticas: CausalMulta[] = [
          { id: 1, descripcion: "Llegada tarde al entrenamiento", valor: 5000 },
          { id: 2, descripcion: "Falta injustificada al entrenamiento", valor: 15000 },
          { id: 3, descripcion: "No usar el uniforme completo", valor: 3000 },
          { id: 4, descripcion: "Comportamiento inadecuado", valor: 10000 }
        ]
        
        setCausales(causalesEstaticas)
        setMensualidad(50000)
        setNuevoValorMensualidad(50000)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCausal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setError(null)
    
    // Validaciones más estrictas
    if (!formDataCausal.descripcion.trim()) {
      setError('La descripción es obligatoria y no puede estar vacía')
      return
    }
    
    if (formDataCausal.descripcion.trim().length < 3) {
      setError('La descripción debe tener al menos 3 caracteres')
      return
    }
    
    if (formDataCausal.valor <= 0) {
      setError('El valor debe ser mayor a 0')
      return
    }
    
    if (formDataCausal.valor > 1000000) {
      setError('El valor no puede exceder $1,000,000')
      return
    }

    try {
      try {
        if (editandoCausal) {
          await multasService.updateCausal(editandoCausal.id, formDataCausal)
          setSuccess('Causal actualizada exitosamente')
        } else {
          await multasService.createCausal(formDataCausal)
          setSuccess('Causal creada exitosamente')
        }
        
        await fetchData()
      } catch (apiError) {
        console.warn('API no disponible, simulando guardado:', apiError)
        
        // Simular guardado local
        if (editandoCausal) {
          setCausales(prev => prev.map(c => 
            c.id === editandoCausal.id 
              ? { ...c, descripcion: formDataCausal.descripcion, valor: formDataCausal.valor }
              : c
          ))
          setSuccess('Causal actualizada exitosamente (modo offline)')
        } else {
          const nuevaCausal: CausalMulta = {
            id: Math.max(...causales.map(c => c.id), 0) + 1,
            descripcion: formDataCausal.descripcion,
            valor: formDataCausal.valor
          }
          setCausales(prev => [...prev, nuevaCausal])
          setSuccess('Causal creada exitosamente (modo offline)')
        }
      }
      
      cerrarFormularioCausal()
    } catch (err: any) {
      console.error('Error saving causal:', err)
      const errorMessage = err.response?.data?.detail || 'Error al guardar la causal'
      setError(errorMessage)
    }
  }

  const editarCausal = (causal: CausalMulta) => {
    setEditandoCausal(causal)
    setFormDataCausal({
      descripcion: causal.descripcion,
      valor: causal.valor
    })
    setShowFormularioCausal(true)
  }

  const eliminarCausal = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta causal?')) {
      return
    }

    try {
      await multasService.deleteCausal(id)
      setSuccess('Causal eliminada exitosamente')
      await fetchData()
    } catch (err: any) {
      console.error('Error deleting causal:', err)
      const errorMessage = err.response?.data?.detail || 'Error al eliminar la causal'
      setError(errorMessage)
    }
  }

  const cerrarFormularioCausal = () => {
    setShowFormularioCausal(false)
    setEditandoCausal(null)
    setFormDataCausal({
      descripcion: '',
      valor: 0
    })
  }

  const actualizarMensualidad = async () => {
    // Limpiar errores previos
    setError(null)
    
    // Validaciones mejoradas
    if (nuevoValorMensualidad <= 0) {
      setError('El valor de la mensualidad debe ser mayor a 0')
      return
    }
    
    if (nuevoValorMensualidad > 10000000) {
      setError('El valor de la mensualidad no puede exceder $10,000,000')
      return
    }

    try {
      try {
        await configuracionesService.updateConfiguracion('mensualidad', {
          valor: nuevoValorMensualidad,
          descripcion: 'Valor de la mensualidad del equipo'
        })
        
        setMensualidad(nuevoValorMensualidad)
        setEditandoMensualidad(false)
        setSuccess('Mensualidad actualizada exitosamente')
        await fetchData()
      } catch (apiError) {
        console.warn('API no disponible, simulando actualización:', apiError)
        
        // Simular actualización local
        setMensualidad(nuevoValorMensualidad)
        setEditandoMensualidad(false)
        setSuccess('Mensualidad actualizada exitosamente (modo offline)')
      }
    } catch (err: any) {
      console.error('Error updating mensualidad:', err)
      const errorMessage = err.response?.data?.detail || 'Error al actualizar la mensualidad'
      setError(errorMessage)
    }
  }

  const cancelarEditarMensualidad = () => {
    setNuevoValorMensualidad(mensualidad)
    setEditandoMensualidad(false)
  }

  // Funciones para manejo de posiciones
  const fetchPosiciones = async () => {
    try {
      // Por ahora usaremos posiciones estáticas
      const posicionesEstaticas: PosicionJuego[] = [
        { id: 1, nombre: "arquero", descripcion: "Portero", paga_mensualidad: false },
        { id: 2, nombre: "defensa", descripcion: "Defensor", paga_mensualidad: true },
        { id: 3, nombre: "medio", descripcion: "Mediocampista", paga_mensualidad: true },
        { id: 4, nombre: "delantero", descripcion: "Delantero", paga_mensualidad: true }
      ]
      
      setPosiciones(posicionesEstaticas)
    } catch (err) {
      console.error('Error fetching posiciones:', err)
      setError('Error al cargar las posiciones')
    }
  }

  const handleSubmitPosicion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError(null)
    
    if (!formDataPosicion.nombre.trim()) {
      setError('El nombre de la posición es obligatorio')
      return
    }
    
    if (!formDataPosicion.descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    try {
      if (editandoPosicion) {
        // Editar posición existente
        const posicionActualizada = {
          ...editandoPosicion,
          ...formDataPosicion
        }
        
        setPosiciones(posiciones.map(p => 
          p.id === editandoPosicion.id ? posicionActualizada : p
        ))
        setSuccess('Posición actualizada exitosamente')
      } else {
        // Crear nueva posición
        const nuevaPosicion = {
          id: Date.now(), // ID temporal
          ...formDataPosicion
        }
        
        setPosiciones([...posiciones, nuevaPosicion])
        setSuccess('Posición creada exitosamente')
      }
      
      cerrarFormularioPosicion()
    } catch (err: any) {
      console.error('Error saving posicion:', err)
      setError('Error al guardar la posición')
    }
  }

  const editarPosicion = (posicion: PosicionJuego) => {
    setEditandoPosicion(posicion)
    setFormDataPosicion({
      nombre: posicion.nombre,
      descripcion: posicion.descripcion,
      paga_mensualidad: posicion.paga_mensualidad
    })
    setShowFormularioPosicion(true)
  }

  const eliminarPosicion = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta posición?')) {
      return
    }

    try {
      setPosiciones(posiciones.filter(p => p.id !== id))
      setSuccess('Posición eliminada exitosamente')
    } catch (err: any) {
      console.error('Error deleting posicion:', err)
      setError('Error al eliminar la posición')
    }
  }

  const cerrarFormularioPosicion = () => {
    setShowFormularioPosicion(false)
    setEditandoPosicion(null)
    setFormDataPosicion({
      nombre: '',
      descripcion: '',
      paga_mensualidad: true
    })
  }

  useEffect(() => {
    fetchPosiciones()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium">Cargando configuración...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>

      {/* Mensajes de éxito y error */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Sección de Mensualidad */}
        <div className="bg-white rounded-lg shadow">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => setSeccionMensualidad(!seccionMensualidad)}
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              💰 Valor de la Mensualidad
            </h2>
            <svg 
              className={`w-5 h-5 transform transition-transform ${seccionMensualidad ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {seccionMensualidad && (
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Mensualidad Actual</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${mensualidad.toLocaleString('es-CO')}
                  </p>
                </div>
                <button
                  onClick={() => setEditandoMensualidad(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Editar
                </button>
              </div>

              {editandoMensualidad && (
                <div className="p-4 border border-gray-300 rounded-lg">
                  <h4 className="font-medium mb-3">Actualizar Mensualidad</h4>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={nuevoValorMensualidad}
                      onChange={(e) => setNuevoValorMensualidad(Number(e.target.value))}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nuevo valor (ej: 50000)"
                      min="1"
                      max="10000000"
                      step="1000"
                      required
                      aria-label="Nuevo valor de mensualidad"
                    />
                    <button
                      onClick={actualizarMensualidad}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEditarMensualidad}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección de Causales de Multa */}
        <div className="bg-white rounded-lg shadow">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => setSeccionCausales(!seccionCausales)}
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              ⚠️ Causales de Multa
            </h2>
            <svg 
              className={`w-5 h-5 transform transition-transform ${seccionCausales ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {seccionCausales && (
            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {causales.length} causal{causales.length !== 1 ? 'es' : ''} configurada{causales.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowFormularioCausal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Nueva Causal
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {causales.map(causal => (
                  <div key={causal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{causal.descripcion}</h3>
                      <p className="text-lg font-bold text-red-600">
                        ${causal.valor.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarCausal(causal)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCausal(causal.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {causales.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay causales de multa configuradas
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sección de Posiciones de Juego */}
        <div className="bg-white rounded-lg shadow">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => setSeccionPosiciones(!seccionPosiciones)}
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              ⚽ Posiciones de Juego
            </h2>
            <svg 
              className={`w-5 h-5 transform transition-transform ${seccionPosiciones ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {seccionPosiciones && (
            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {posiciones.length} posicion{posiciones.length !== 1 ? 'es' : ''} configurada{posiciones.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowFormularioPosicion(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Nueva Posición
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {posiciones.map(posicion => (
                  <div key={posicion.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium capitalize">{posicion.nombre}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          posicion.paga_mensualidad 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {posicion.paga_mensualidad ? 'Paga mensualidad' : 'Exento de mensualidad'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{posicion.descripcion}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarPosicion(posicion)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarPosicion(posicion.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {posiciones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay posiciones configuradas
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar causal */}
      {showFormularioCausal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editandoCausal ? 'Editar Causal' : 'Nueva Causal de Multa'}
            </h3>
            
            <form onSubmit={handleSubmitCausal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción/Causa</label>
                <input
                  type="text"
                  value={formDataCausal.descripcion}
                  onChange={(e) => setFormDataCausal(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Llegada tarde al entrenamiento"
                  minLength={3}
                  maxLength={100}
                  required
                  aria-label="Descripción de la causal de multa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Valor de la Multa</label>
                <input
                  type="number"
                  value={formDataCausal.valor}
                  onChange={(e) => setFormDataCausal(prev => ({
                    ...prev,
                    valor: Number(e.target.value)
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 5000"
                  min="1"
                  max="1000000"
                  step="1000"
                  required
                  aria-label="Valor de la multa en pesos"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
                >
                  {editandoCausal ? 'Actualizar' : 'Crear'} Causal
                </button>
                <button
                  type="button"
                  onClick={cerrarFormularioCausal}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear/editar posición */}
      {showFormularioPosicion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editandoPosicion ? 'Editar Posición' : 'Nueva Posición de Juego'}
            </h3>
            
            <form onSubmit={handleSubmitPosicion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Posición</label>
                <input
                  type="text"
                  value={formDataPosicion.nombre}
                  onChange={(e) => setFormDataPosicion(prev => ({
                    ...prev,
                    nombre: e.target.value.toLowerCase()
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: lateral, volante, centro"
                  minLength={2}
                  maxLength={50}
                  required
                  aria-label="Nombre de la posición"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={formDataPosicion.descripcion}
                  onChange={(e) => setFormDataPosicion(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Defensa lateral izquierdo"
                  minLength={3}
                  maxLength={100}
                  required
                  aria-label="Descripción de la posición"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formDataPosicion.paga_mensualidad}
                    onChange={(e) => setFormDataPosicion(prev => ({
                      ...prev,
                      paga_mensualidad: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    Esta posición debe pagar mensualidad
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Si no está marcado, los jugadores con esta posición estarán exentos del pago de mensualidad
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                >
                  {editandoPosicion ? 'Actualizar' : 'Crear'} Posición
                </button>
                <button
                  type="button"
                  onClick={cerrarFormularioPosicion}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Configuracion
