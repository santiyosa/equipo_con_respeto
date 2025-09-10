import { useState, useEffect } from 'react'
import { jugadoresService, multasService, pagosService } from '../services/api'

interface Jugador {
  cedula: string
  nombre: string
  nombre_inscripcion: string
  estado_cuenta: boolean
}

interface Multa {
  id: number
  jugador_cedula: string
  causal_descripcion: string
  causal_valor: number
  fecha_aplicacion: string
  pagada: boolean
}

interface PagoMensualidad {
  mes: number
  ano: number
  valor: number
}

interface MultaNueva {
  causal_descripcion: string
  causal_valor: number
  fecha_aplicacion: string
}

interface Configuracion {
  clave: string
  valor: number
  descripcion: string
}

function Pagos() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [selectedJugador, setSelectedJugador] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filteredJugadores, setFilteredJugadores] = useState<Jugador[]>([])
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [multasPendientes, setMultasPendientes] = useState<Multa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados del formulario
  const [mensualidades, setMensualidades] = useState<PagoMensualidad[]>([])
  const [multasSeleccionadas, setMultasSeleccionadas] = useState<number[]>([])
  const [multasNuevas, setMultasNuevas] = useState<MultaNueva[]>([])
  
  // Estado para el valor de mensualidad desde configuración
  const [valorMensualidad, setValorMensualidad] = useState<number>(20000)

  useEffect(() => {
    fetchJugadores()
    fetchValorMensualidad()
  }, [])

  const fetchValorMensualidad = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005'}/api/configuraciones/`)
      const configuraciones: Configuracion[] = await response.json()
      
      const configMensualidad = configuraciones.find(config => config.clave === 'mensualidad')
      if (configMensualidad) {
        setValorMensualidad(configMensualidad.valor)
      }
    } catch (error) {
      console.error('Error al cargar valor de mensualidad:', error)
      // Mantener valor por defecto si hay error
    }
  }

  useEffect(() => {
    // Filtrar jugadores basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredJugadores([])
      setShowDropdown(false)
    } else {
      const filtered = jugadores.filter(jugador =>
        jugador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jugador.nombre_inscripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jugador.cedula.includes(searchTerm)
      )
      setFilteredJugadores(filtered)
      setShowDropdown(filtered.length > 0)
    }
  }, [searchTerm, jugadores])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchJugadores = async () => {
    try {
      const data = await jugadoresService.getJugadores()
      setJugadores(data)
    } catch (err) {
      setError('Error al cargar jugadores')
    }
  }

  const handleJugadorChange = async (cedula: string) => {
    setSelectedJugador(cedula)
    setMultasPendientes([])
    setMultasSeleccionadas([])
    
    if (cedula) {
      try {
        const multas = await multasService.getMultas(false) // Solo pendientes
        const multasJugador = multas.filter((m: Multa) => m.jugador_cedula === cedula)
        setMultasPendientes(multasJugador)
      } catch (err) {
        setError('Error al cargar multas del jugador')
      }
    }
  }

  const handleSelectJugador = (jugador: Jugador) => {
    setSearchTerm(`${jugador.nombre} - ${jugador.nombre_inscripcion}`)
    setSelectedJugador(jugador.cedula)
    setShowDropdown(false)
    handleJugadorChange(jugador.cedula)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.trim() === '') {
      setSelectedJugador('')
      setMultasPendientes([])
      setMultasSeleccionadas([])
    }
  }

  const agregarMensualidad = () => {
    const nuevaMensualidad: PagoMensualidad = {
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      valor: valorMensualidad // Usar valor de configuración
    }
    setMensualidades([...mensualidades, nuevaMensualidad])
  }

  const eliminarMensualidad = (index: number) => {
    setMensualidades(mensualidades.filter((_, i) => i !== index))
  }

  const actualizarMensualidad = (index: number, field: keyof PagoMensualidad, value: any) => {
    // No permitir cambiar el valor, solo mes y año
    if (field === 'valor') return
    
    const nuevasMensualidades = [...mensualidades]
    nuevasMensualidades[index] = { ...nuevasMensualidades[index], [field]: value }
    setMensualidades(nuevasMensualidades)
  }

  const agregarMulta = () => {
    // Obtener fecha actual en formato local YYYY-MM-DD
    const hoy = new Date()
    const fechaLocal = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000))
    const fechaFormateada = fechaLocal.toISOString().split('T')[0]
    
    const nuevaMulta: MultaNueva = {
      causal_descripcion: '',
      causal_valor: 10000, // Valor por defecto
      fecha_aplicacion: fechaFormateada
    }
    setMultasNuevas([...multasNuevas, nuevaMulta])
  }

  const eliminarMulta = (index: number) => {
    setMultasNuevas(multasNuevas.filter((_, i) => i !== index))
  }

  const actualizarMulta = (index: number, field: keyof MultaNueva, value: any) => {
    const nuevasMultas = [...multasNuevas]
    nuevasMultas[index] = { ...nuevasMultas[index], [field]: value }
    setMultasNuevas(nuevasMultas)
  }

  const toggleMulta = (multaId: number) => {
    if (multasSeleccionadas.includes(multaId)) {
      setMultasSeleccionadas(multasSeleccionadas.filter(id => id !== multaId))
    } else {
      setMultasSeleccionadas([...multasSeleccionadas, multaId])
    }
  }

  const calcularTotal = () => {
    const totalMensualidades = mensualidades.reduce((sum, m) => sum + m.valor, 0)
    const totalMultasExistentes = multasPendientes
      .filter(m => multasSeleccionadas.includes(m.id))
      .reduce((sum, m) => sum + m.causal_valor, 0)
    const totalMultasNuevas = multasNuevas.reduce((sum, m) => sum + m.causal_valor, 0)
    return totalMensualidades + totalMultasExistentes + totalMultasNuevas
  }

  const registrarPago = async () => {
    if (!selectedJugador) {
      setError('Debe seleccionar un jugador')
      return
    }

    if (mensualidades.length === 0 && multasSeleccionadas.length === 0 && multasNuevas.length === 0) {
      setError('Debe seleccionar al menos una mensualidad o multa para pagar')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Primero crear las multas nuevas si existen
      const multasNuevasIds: number[] = []
      
      for (const multa of multasNuevas) {
        if (multa.causal_descripcion.trim() === '') {
          setError('Todas las multas deben tener una descripción')
          setLoading(false)
          return
        }
        
        // Validar que la fecha no sea más de un día en el futuro (para evitar problemas de zona horaria)
        const fechaMultaString = multa.fecha_aplicacion
        const hoy = new Date()
        const manana = new Date(hoy)
        manana.setDate(hoy.getDate() + 1)
        
        const fechaMananaString = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`
        
        if (fechaMultaString > fechaMananaString) {
          setError(`La fecha de la multa no puede ser más de un día en el futuro. Fecha seleccionada: ${fechaMultaString}, Fecha máxima: ${fechaMananaString}`)
          setLoading(false)
          return
        }
        
        // Primero crear la causal
        const causal = await multasService.createCausal({
          descripcion: multa.causal_descripcion,
          valor: multa.causal_valor
        })
        
        // Luego crear la multa con la causal
        const multaCreada = await multasService.createMulta({
          jugador_cedula: selectedJugador,
          causal_id: causal.id,
          fecha_multa: multa.fecha_aplicacion
        })
        multasNuevasIds.push(multaCreada.id)
      }

      // Combinar todas las multas (existentes + nuevas)
      const todasLasMultas = [...multasSeleccionadas, ...multasNuevasIds]

      const pagoData = {
        jugador_cedula: selectedJugador,
        mensualidades,
        multas: todasLasMultas,
        registrado_por: 1 // Hardcoded por ahora
      }

      // Registrar pago usando el servicio API
      await pagosService.registrarPagoCombinado(pagoData)
      
      setSuccess('Pago registrado exitosamente')
      setMensualidades([])
      setMultasSeleccionadas([])
      setMultasNuevas([])
      setSearchTerm('') // Limpiar campo de búsqueda
      setSelectedJugador('') // Limpiar jugador seleccionado
      setShowDropdown(false) // Cerrar dropdown
      handleJugadorChange('') // Reset completo del estado
    } catch (err: any) {
      console.error('Error al registrar el pago:', err)
      
      // Manejar errores específicos del backend
      if (err.response && err.response.data && err.response.data.detail) {
        const errorMessage = err.response.data.detail
        
        // Verificar si el error es por mes ya pagado
        if (errorMessage.toLowerCase().includes('ya está pagado') || 
            errorMessage.toLowerCase().includes('already paid') ||
            errorMessage.toLowerCase().includes('ya existe un pago')) {
          setError(`❌ ${errorMessage}`)
        } else if (errorMessage.toLowerCase().includes('multa') && 
                   errorMessage.toLowerCase().includes('no encontrada')) {
          setError(`❌ Una de las multas seleccionadas ya fue pagada o no existe`)
        } else {
          setError(`❌ Error: ${errorMessage}`)
        }
      } else {
        setError('❌ Error al registrar el pago. Por favor verifica los datos e intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Pagos</h1>
        <p className="text-gray-600">Registrar pagos de mensualidades y multas</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Selección de Jugador con Búsqueda */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Jugador
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Escribe nombre, alias o cédula..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Dropdown de resultados */}
            {showDropdown && filteredJugadores.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredJugadores.map((jugador) => (
                  <button
                    key={jugador.cedula}
                    onClick={() => handleSelectJugador(jugador)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{jugador.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {jugador.nombre_inscripcion} - {jugador.cedula}
                    </div>
                    <div className="text-xs text-gray-500">
                      Estado: {jugador.estado_cuenta ? 'Al día' : 'Con multas'}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Mensaje cuando no hay resultados */}
            {showDropdown && filteredJugadores.length === 0 && searchTerm.trim() !== '' && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                <div className="text-gray-500 text-center">
                  No se encontraron jugadores con "{searchTerm}"
                </div>
              </div>
            )}
          </div>

          {selectedJugador && (
            <>
              {/* Mensualidades */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Mensualidades</h3>
                  <button
                    onClick={agregarMensualidad}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Pagar mensualidad
                  </button>
                </div>

                {mensualidades.map((mensualidad, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 mb-2 p-4 bg-gray-50 rounded">
                    <select
                      value={mensualidad.mes}
                      onChange={(e) => actualizarMensualidad(index, 'mes', parseInt(e.target.value))}
                      className="p-2 border rounded"
                    >
                      {meses.map((mes, i) => (
                        <option key={i} value={i + 1}>{mes}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={mensualidad.ano}
                      onChange={(e) => actualizarMensualidad(index, 'ano', parseInt(e.target.value))}
                      className="p-2 border rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={mensualidad.valor}
                        readOnly
                        className="p-2 border rounded bg-gray-100 cursor-not-allowed"
                        title="Valor configurado en el sistema - No editable"
                      />
                      <span className="text-xs text-gray-500">
                        (Configurado)
                      </span>
                    </div>
                    <button
                      onClick={() => eliminarMensualidad(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              {/* Multas Pendientes */}
              {multasPendientes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Multas Pendientes</h3>
                  <div className="space-y-2">
                    {multasPendientes.map((multa) => (
                      <label key={multa.id} className="flex items-center p-3 bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={multasSeleccionadas.includes(multa.id)}
                          onChange={() => toggleMulta(multa.id)}
                          className="mr-3"
                        />
                        <div className="flex-grow">
                          <div className="font-medium">{multa.causal_descripcion}</div>
                          <div className="text-sm text-gray-600">
                            ${multa.causal_valor.toLocaleString()} - {new Date(multa.fecha_aplicacion).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Multas Nuevas */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Agregar Multas</h3>
                  <button
                    onClick={agregarMulta}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Pagar multa
                  </button>
                </div>

                {multasNuevas.map((multa, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 mb-2 p-4 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Descripción de la multa"
                      value={multa.causal_descripcion}
                      onChange={(e) => actualizarMulta(index, 'causal_descripcion', e.target.value)}
                      className="p-2 border rounded col-span-2"
                    />
                    <input
                      type="number"
                      placeholder="Valor"
                      value={multa.causal_valor}
                      onChange={(e) => actualizarMulta(index, 'causal_valor', parseInt(e.target.value))}
                      className="p-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={multa.fecha_aplicacion}
                        onChange={(e) => actualizarMulta(index, 'fecha_aplicacion', e.target.value)}
                        className="p-2 border rounded flex-grow"
                      />
                      <button
                        onClick={() => eliminarMulta(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen y Total */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Resumen del Pago</h4>
                <div className="text-sm text-blue-800">
                  <p>Mensualidades: {mensualidades.length}</p>
                  <p>Multas existentes: {multasSeleccionadas.length}</p>
                  <p>Multas nuevas: {multasNuevas.length}</p>
                  <p className="font-bold text-lg">Total: ${calcularTotal().toLocaleString()}</p>
                </div>
              </div>

              {/* Botón de Registro */}
              <button
                onClick={registrarPago}
                disabled={loading || (mensualidades.length === 0 && multasSeleccionadas.length === 0 && multasNuevas.length === 0)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pagos
