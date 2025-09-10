import { useState, useEffect } from 'react'
import { egresosService } from '../services/api'

interface CategoriaEgreso {
  id: number
  nombre: string
  descripcion: string
}

interface Egreso {
  id: number
  categoria_id: number
  concepto: string
  valor: number
  fecha: string
  comprobante?: string
  notas?: string
  registrado_por?: number
  categoria: CategoriaEgreso
}

interface NuevoEgreso {
  categoria_id: number
  concepto: string
  valor: number
  comprobante?: string
  notas?: string
  fecha: string
}

function Finanzas() {
  // Función auxiliar para obtener la fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = () => {
    const ahora = new Date()
    const offset = ahora.getTimezoneOffset() * 60000
    const fechaLocal = new Date(Date.now() - offset)
    return fechaLocal.toISOString().split('T')[0]
  }

  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [categorias, setCategorias] = useState<CategoriaEgreso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados del formulario de egreso
  const [showFormulario, setShowFormulario] = useState(false)
  const [nuevoEgreso, setNuevoEgreso] = useState<NuevoEgreso>({
    categoria_id: 0,
    concepto: '',
    valor: 0,
    comprobante: '',
    notas: '',
    fecha: obtenerFechaLocal() // Fecha local actual
  })

  // Estados del formulario de categoría
  const [showFormularioCategoria, setShowFormularioCategoria] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: '',
    descripcion: ''
  })
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaEgreso | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)

  // Estados de filtros
  const [filtroCategoria, setFiltroCategoria] = useState<number>(0)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroTexto, setFiltroTexto] = useState('')
  const [valorMinimo, setValorMinimo] = useState<number | ''>('')
  const [valorMaximo, setValorMaximo] = useState<number | ''>('')
  const [ordenamiento, setOrdenamiento] = useState<'fecha-desc' | 'fecha-asc' | 'valor-desc' | 'valor-asc'>('fecha-desc')

  // Estado para sidebar colapsable
  const [sidebarColapsado, setSidebarColapsado] = useState(false)

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
      setError(null)
      
      const [egresosData, categoriasData] = await Promise.all([
        egresosService.getEgresos(),
        egresosService.getCategorias()
      ])
      
      setEgresos(egresosData)
      setCategorias(categoriasData)
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar datos financieros')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setError(null)
    
    // Validaciones mejoradas
    if (!nuevoEgreso.categoria_id || nuevoEgreso.categoria_id === 0) {
      setError('Debe seleccionar una categoría')
      return
    }
    
    if (!nuevoEgreso.concepto.trim()) {
      setError('El concepto es obligatorio')
      return
    }
    
    if (nuevoEgreso.concepto.trim().length < 3) {
      setError('El concepto debe tener al menos 3 caracteres')
      return
    }
    
    if (!nuevoEgreso.valor || nuevoEgreso.valor <= 0) {
      setError('El valor debe ser mayor a 0')
      return
    }
    
    if (nuevoEgreso.valor > 100000000) {
      setError('El valor no puede exceder $100,000,000')
      return
    }

    try {
      setLoading(true)
      
      // TODO: Implementar sistema de autenticación para obtener el ID del usuario actual
      const CURRENT_USER_ID = 1 // Temporal: usuario predeterminado
      
      console.log('Datos a enviar:', {
        ...nuevoEgreso,
        registrado_por: CURRENT_USER_ID
      })
      
      const result = await egresosService.createEgreso({
        ...nuevoEgreso,
        registrado_por: CURRENT_USER_ID
      })
      
      console.log('Resultado:', result)
      setSuccess('Egreso registrado exitosamente')
      setNuevoEgreso({
        categoria_id: 0,
        concepto: '',
        valor: 0,
        comprobante: '',
        notas: '',
        fecha: obtenerFechaLocal()
      })
      setShowFormulario(false)
      fetchData()
    } catch (err) {
      console.error('Error completo:', err)
      setError('Error al registrar el egreso: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setError(null)
    
    // Validaciones mejoradas
    if (!nuevaCategoria.nombre.trim()) {
      setError('El nombre de la categoría es obligatorio')
      return
    }
    
    if (nuevaCategoria.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    
    if (nuevaCategoria.nombre.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres')
      return
    }

    try {
      setLoading(true)
      
      if (modoEdicion && categoriaEditando) {
        // Actualizar categoría existente
        await egresosService.updateCategoria(categoriaEditando.id, nuevaCategoria)
        setSuccess('Categoría actualizada exitosamente')
      } else {
        // Crear nueva categoría
        await egresosService.createCategoria(nuevaCategoria)
        setSuccess('Categoría creada exitosamente')
      }
      
      setNuevaCategoria({ nombre: '', descripcion: '' })
      setShowFormularioCategoria(false)
      setCategoriaEditando(null)
      setModoEdicion(false)
      fetchData()
    } catch (err) {
      setError(modoEdicion ? 'Error al actualizar la categoría' : 'Error al crear la categoría')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicionCategoria = (categoria: CategoriaEgreso) => {
    setCategoriaEditando(categoria)
    setNuevaCategoria({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || ''
    })
    setModoEdicion(true)
    setShowFormularioCategoria(true)
  }

  const eliminarCategoria = async (categoriaId: number, nombre: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar la categoría "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      setLoading(true)
      await egresosService.deleteCategoria(categoriaId)
      setSuccess('Categoría eliminada exitosamente')
      fetchData()
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err)
      
      // Extraer mensaje de error específico del backend
      let mensajeError = 'Error al eliminar la categoría'
      
      if (err?.response?.data?.detail) {
        mensajeError = err.response.data.detail
      } else if (err?.message) {
        mensajeError = err.message
      }
      
      setError(mensajeError)
    } finally {
      setLoading(false)
    }
  }

  const cancelarEdicionCategoria = () => {
    setCategoriaEditando(null)
    setNuevaCategoria({ nombre: '', descripcion: '' })
    setModoEdicion(false)
    setShowFormularioCategoria(false)
  }

  const contarEgresosPorCategoria = (categoriaId: number): number => {
    return egresos.filter(egreso => egreso.categoria_id === categoriaId).length
  }

  const eliminarEgreso = async (egresoId: number, concepto: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el egreso "${concepto}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      setLoading(true)
      await egresosService.deleteEgreso(egresoId)
      setSuccess('Egreso eliminado exitosamente')
      fetchData()
    } catch (err: any) {
      console.error('Error al eliminar egreso:', err)
      
      // Extraer mensaje de error específico del backend
      let mensajeError = 'Error al eliminar el egreso'
      
      if (err?.response?.data?.detail) {
        mensajeError = err.response.data.detail
      } else if (err?.message) {
        mensajeError = err.message
      }
      
      setError(mensajeError)
    } finally {
      setLoading(false)
    }
  }

  const filtrarEgresos = () => {
    return egresos.filter(egreso => {
      // Filtro por categoría
      const cumpleCategoria = filtroCategoria === 0 || egreso.categoria_id === filtroCategoria
      
      // Filtro por fecha - corregido para manejar fechas correctamente
      let cumpleFecha = true
      
      if (fechaInicio) {
        const fechaEgresoDate = new Date(egreso.fecha).toISOString().split('T')[0]
        cumpleFecha = cumpleFecha && fechaEgresoDate >= fechaInicio
      }
      
      if (fechaFin) {
        const fechaEgresoDate = new Date(egreso.fecha).toISOString().split('T')[0]
        cumpleFecha = cumpleFecha && fechaEgresoDate <= fechaFin
      }
      
      // Filtro por texto/concepto
      const cumpleTexto = filtroTexto.trim() === '' || 
                          egreso.concepto.toLowerCase().includes(filtroTexto.toLowerCase())
      
      // Filtro por rango de valores
      const cumpleValorMin = valorMinimo === '' || egreso.valor >= Number(valorMinimo)
      const cumpleValorMax = valorMaximo === '' || egreso.valor <= Number(valorMaximo)
      
      return cumpleCategoria && cumpleFecha && cumpleTexto && cumpleValorMin && cumpleValorMax
    }).sort((a, b) => {
      // Aplicar ordenamiento
      switch (ordenamiento) {
        case 'fecha-asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        case 'fecha-desc':
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        case 'valor-asc':
          return a.valor - b.valor
        case 'valor-desc':
          return b.valor - a.valor
        default:
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      }
    })
  }

  const calcularTotal = () => {
    return filtrarEgresos().reduce((sum, egreso) => sum + egreso.valor, 0)
  }

  const limpiarFiltros = () => {
    setFiltroCategoria(0)
    setFechaInicio('')
    setFechaFin('')
    setFiltroTexto('')
    setValorMinimo('')
    setValorMaximo('')
    setOrdenamiento('fecha-desc')
  }

  const exportarCSV = () => {
    const datosFiltrados = filtrarEgresos()
    if (datosFiltrados.length === 0) {
      setError('No hay datos para exportar')
      return
    }

    // Crear encabezados CSV
    const headers = ['Fecha', 'Concepto', 'Categoría', 'Valor']
    
    // Crear filas de datos
    const rows = datosFiltrados.map(egreso => {
      const categoria = categorias.find(c => c.id === egreso.categoria_id)?.nombre || 'Sin categoría'
      return [
        egreso.fecha,
        `"${egreso.concepto}"`, // Escapar comillas
        categoria,
        egreso.valor
      ]
    })

    // Combinar encabezados y filas
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `egresos_${obtenerFechaLocal()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setSuccess('CSV exportado correctamente')
  }

  const exportarPDF = () => {
    const datosFiltrados = filtrarEgresos()
    if (datosFiltrados.length === 0) {
      setError('No hay datos para exportar')
      return
    }

    // Crear contenido HTML para el PDF
    const total = calcularTotal()
    const fechaReporte = new Date().toLocaleDateString('es-CO')
    
    let htmlContent = `
      <html>
        <head>
          <title>Reporte de Egresos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; color: #dc2626; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Egresos</h1>
            <p>Fecha del reporte: ${fechaReporte}</p>
          </div>
          
          <div class="summary">
            <h3>Resumen</h3>
            <p><strong>Total de registros:</strong> ${datosFiltrados.length}</p>
            <p><strong>Total general:</strong> $${total.toLocaleString('es-CO')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
    `

    datosFiltrados.forEach(egreso => {
      htmlContent += `
        <tr>
          <td>${new Date(egreso.fecha).toLocaleDateString('es-CO')}</td>
          <td>${egreso.categoria.nombre}</td>
          <td>${egreso.concepto}</td>
          <td class="total">$${egreso.valor.toLocaleString('es-CO')}</td>
          <td>${egreso.notas || '-'}</td>
        </tr>
      `
    })

    htmlContent += `
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generado el ${new Date().toLocaleString('es-CO')} por Sistema de Gestión de Equipo</p>
          </div>
        </body>
      </html>
    `

    // Abrir en nueva ventana para imprimir/guardar como PDF
    const ventana = window.open('', '_blank')
    if (ventana) {
      ventana.document.write(htmlContent)
      ventana.document.close()
      ventana.focus()
      
      // Automaticamente abrir el diálogo de impresión
      setTimeout(() => {
        ventana.print()
      }, 500)
      
      setSuccess('Reporte PDF generado. Use Ctrl+P para guardar como PDF.')
    } else {
      setError('No se pudo abrir la ventana de exportación. Verifique que no esté bloqueada por el navegador.')
    }
  }

  const egresosFiltrados = filtrarEgresos()

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium">Cargando datos financieros...</div>
          <div className="text-sm text-gray-500 mt-2">Estado: {loading ? 'Cargando' : 'Listo'}</div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="flex h-screen bg-gray-100">
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Principal */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Control Financiero - Egresos</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowFormulario(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                💰 Registrar Egreso
              </button>
              <button
                onClick={exportarPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                📄 Exportar PDF
              </button>
            </div>
          </div>

          {/* Mensajes de éxito y error */}
          {success && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Contenido de Egresos */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Egresos Registrados</h2>            {/* Filtros */}
            <div className="space-y-4 mb-6">
              {/* Primera fila - Categoría, búsqueda y ordenamiento */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(Number(e.target.value))}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar por concepto..."
                  className="p-2 border border-gray-300 rounded-md"
                />
                
                <select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value as any)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="fecha-desc">Más reciente</option>
                  <option value="fecha-asc">Más antiguo</option>
                  <option value="valor-desc">Mayor valor</option>
                  <option value="valor-asc">Menor valor</option>
                </select>

                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Limpiar
                </button>
              </div>

              {/* Segunda fila - Fechas y valores */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  placeholder="Fecha inicio"
                  className="p-2 border border-gray-300 rounded-md"
                />
                
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  placeholder="Fecha fin"
                  className="p-2 border border-gray-300 rounded-md"
                />

                <input
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Valor mínimo"
                  className="p-2 border border-gray-300 rounded-md"
                />

                <input
                  type="number"
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Valor máximo"
                  className="p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Total Filtrado y Exportaciones */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-blue-900">
                    Total: ${calcularTotal().toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">
                    {egresosFiltrados.length} egreso(s) mostrado(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportarCSV}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    disabled={egresosFiltrados.length === 0}
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    disabled={egresosFiltrados.length === 0}
                  >
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Egresos */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-center text-gray-500">Cargando...</p>
              ) : egresosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500">No hay egresos registrados</p>
              ) : (
                egresosFiltrados.map(egreso => (
                  <div key={egreso.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">{egreso.concepto}</h3>
                        <p className="text-sm text-gray-600">
                          {egreso.categoria.nombre} • {new Date(egreso.fecha).toLocaleDateString()}
                        </p>
                        {egreso.comprobante && (
                          <p className="text-xs text-gray-500 mt-1">
                            📄 Comprobante: {egreso.comprobante}
                          </p>
                        )}
                        {egreso.notas && (
                          <p className="text-xs text-gray-500 mt-1">
                            📝 {egreso.notas}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-lg font-semibold text-red-600">
                            -${egreso.valor.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarEgreso(egreso.id, egreso.concepto)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                          title="Eliminar egreso"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Derecho - Gestión de Categorías */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarColapsado ? 'w-16' : 'w-80'
      } flex flex-col border-l border-gray-200`}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setSidebarColapsado(!sidebarColapsado)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title={sidebarColapsado ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${sidebarColapsado ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          {!sidebarColapsado && (
            <h2 className="text-lg font-semibold text-gray-800">
              ⚙️ Gestión de Categorías
            </h2>
          )}
        </div>

        {/* Contenido del Sidebar */}
        {!sidebarColapsado && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4">
              <button
                onClick={() => {
                  setModoEdicion(false)
                  setCategoriaEditando(null)
                  setNuevaCategoria({ nombre: '', descripcion: '' })
                  setShowFormularioCategoria(true)
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                ➕ Nueva Categoría
              </button>
            </div>

            <div className="space-y-3">
              {categorias.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📂</div>
                  <p>No hay categorías registradas</p>
                </div>
              ) : (
                categorias.map(categoria => {
                  const cantidadEgresos = contarEgresosPorCategoria(categoria.id)
                  const puedeEliminar = cantidadEgresos === 0
                  
                  return (
                    <div key={categoria.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-blue-900">{categoria.nombre}</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                              {cantidadEgresos}
                            </span>
                          </div>
                          {categoria.descripcion && (
                            <p className="text-sm text-blue-700 mb-2">{categoria.descripcion}</p>
                          )}
                          {!puedeEliminar && (
                            <p className="text-xs text-yellow-600 flex items-center gap-1">
                              ⚠️ Tiene egresos asociados
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => iniciarEdicionCategoria(categoria)}
                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                            title="Editar categoría"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarCategoria(categoria.id, categoria.nombre)}
                            disabled={!puedeEliminar}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              puedeEliminar
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={puedeEliminar ? 'Eliminar categoría' : 'No se puede eliminar: tiene egresos asociados'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Sidebar colapsado - Solo iconos */}
        {sidebarColapsado && (
          <div className="flex-1 p-2 flex flex-col items-center gap-4 mt-4">
            <button
              onClick={() => {
                setModoEdicion(false)
                setCategoriaEditando(null)
                setNuevaCategoria({ nombre: '', descripcion: '' })
                setShowFormularioCategoria(true)
              }}
              className="w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              title="Nueva Categoría"
            >
              ➕
            </button>
            <div className="text-center">
              <div className="text-2xl text-gray-400">📂</div>
              <div className="text-xs text-gray-500 mt-1">{categorias.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Modales */}
    {showFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Egreso</h3>
            <form onSubmit={handleSubmitEgreso}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={nuevoEgreso.categoria_id}
                    onChange={(e) => setNuevoEgreso({...nuevoEgreso, categoria_id: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value={0}>Seleccionar categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={nuevoEgreso.fecha}
                    onChange={(e) => setNuevoEgreso({...nuevoEgreso, fecha: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    aria-label="Fecha del egreso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={nuevoEgreso.concepto}
                    onChange={(e) => setNuevoEgreso({...nuevoEgreso, concepto: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Compra de balones"
                    minLength={3}
                    maxLength={200}
                    required
                    aria-label="Concepto o descripción del egreso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={nuevoEgreso.valor || ''}
                    onChange={(e) => {
                      const valor = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setNuevoEgreso({...nuevoEgreso, valor});
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 50000"
                    min="1"
                    max="100000000"
                    step="any"
                    required
                    aria-label="Valor del egreso en pesos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante (opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoEgreso.comprobante || ''}
                    onChange={(e) => setNuevoEgreso({...nuevoEgreso, comprobante: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Número de factura o recibo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={nuevoEgreso.notas || ''}
                    onChange={(e) => setNuevoEgreso({...nuevoEgreso, notas: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormulario(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Guardando...' : 'Guardar Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formulario de Categoría */}
      {showFormularioCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {modoEdicion ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            </h3>
            <form onSubmit={handleSubmitCategoria}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    value={nuevaCategoria.nombre}
                    onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Uniformes, Transporte, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={nuevaCategoria.descripcion}
                    onChange={(e) => setNuevaCategoria({...nuevaCategoria, descripcion: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Descripción de la categoría..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={cancelarEdicionCategoria}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 
                    (modoEdicion ? 'Actualizando...' : 'Creando...') : 
                    (modoEdicion ? 'Actualizar' : 'Crear Categoría')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Finanzas
