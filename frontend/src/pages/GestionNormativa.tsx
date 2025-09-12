import React, { useState, useEffect } from 'react'

interface ArticuloNormativa {
  id: number
  numero_articulo: string
  titulo: string
  contenido: string
  tipo: 'informativo' | 'sancionable'
  vigencia_desde: string
  orden_display: number
  activo: boolean
  created_at: string
  updated_at: string
}

interface CausalMulta {
  id: number
  descripcion: string
  valor: number
  articulo_id?: number
}

const GestionNormativa: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articulos' | 'causales' | 'vista-previa'>('articulos')
  const [articulos, setArticulos] = useState<ArticuloNormativa[]>([])
  const [causales, setCausales] = useState<CausalMulta[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showCausalModal, setShowCausalModal] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState<ArticuloNormativa | null>(null)
  const [editingCausal, setEditingCausal] = useState<CausalMulta | null>(null)
  const [formData, setFormData] = useState({
    numero_articulo: '',
    titulo: '',
    contenido: '',
    tipo: 'informativo' as 'informativo' | 'sancionable',
    orden_display: 0
  })
  const [causalFormData, setCausalFormData] = useState({
    descripcion: '',
    valor: 1000, // Valor por defecto mayor a 0
    articulo_id: undefined as number | undefined
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (activeTab === 'articulos') {
      cargarArticulos()
    } else if (activeTab === 'causales') {
      cargarCausales()
      cargarArticulos() // También cargar artículos para el dropdown
    }
  }, [activeTab])

  const cargarArticulos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/articulos-normativa/')
      if (response.ok) {
        const data = await response.json()
        setArticulos(data)
      }
    } catch (error) {
      console.error('Error cargando artículos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCausales = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/multas/causales/')
      if (response.ok) {
        const data = await response.json()
        setCausales(data)
      }
    } catch (error) {
      console.error('Error cargando causales:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitArticulo = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingArticulo 
        ? `/api/articulos-normativa/${editingArticulo.id}`
        : '/api/articulos-normativa/'
      
      const method = editingArticulo ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await cargarArticulos()
        setShowModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error al guardar artículo')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar artículo')
    } finally {
      setLoading(false)
    }
  }

  const handleEditArticulo = (articulo: ArticuloNormativa) => {
    setEditingArticulo(articulo)
    setFormData({
      numero_articulo: articulo.numero_articulo,
      titulo: articulo.titulo,
      contenido: articulo.contenido,
      tipo: articulo.tipo,
      orden_display: articulo.orden_display
    })
    setShowModal(true)
  }

  const handleDeleteArticulo = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este artículo?')) return

    try {
      const response = await fetch(`/api/articulos-normativa/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await cargarArticulos()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error al eliminar artículo')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar artículo')
    }
  }

  const resetForm = () => {
    setFormData({
      numero_articulo: '',
      titulo: '',
      contenido: '',
      tipo: 'informativo',
      orden_display: 0
    })
    setEditingArticulo(null)
  }

  // Funciones para manejar causales
  const handleSubmitCausal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingCausal 
        ? `/api/multas/causales/${editingCausal.id}`
        : '/api/multas/causales/'
      
      const method = editingCausal ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(causalFormData),
      })

      if (response.ok) {
        await cargarCausales()
        setShowCausalModal(false)
        resetCausalForm()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error al guardar causal')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar causal')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCausal = (causal: CausalMulta) => {
    setEditingCausal(causal)
    setCausalFormData({
      descripcion: causal.descripcion,
      valor: causal.valor,
      articulo_id: causal.articulo_id
    })
    setShowCausalModal(true)
  }

  const handleDeleteCausal = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta causal?')) return

    try {
      const response = await fetch(`/api/multas/causales/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await cargarCausales()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error al eliminar causal')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar causal')
    }
  }

  const resetCausalForm = () => {
    setCausalFormData({
      descripcion: '',
      valor: 1000, // Valor por defecto mayor a 0
      articulo_id: undefined
    })
    setEditingCausal(null)
  }

  const generarVistaPrevia = () => {
    const articulosOrdenados = [...articulos]
      .filter(a => a.activo)
      .sort((a, b) => a.orden_display - b.orden_display || a.numero_articulo.localeCompare(b.numero_articulo))

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">REGLAMENTO INTERNO</h1>
          <h2 className="text-xl text-gray-600">Equipo de Fútbol</h2>
          <p className="text-sm text-gray-500 mt-4">
            Documento generado automáticamente - {new Date().toLocaleDateString()}
          </p>
        </div>

        {articulosOrdenados.map((articulo) => (
          <div key={articulo.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Artículo {articulo.numero_articulo}: {articulo.titulo}
              {articulo.tipo === 'sancionable' && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  Sancionable
                </span>
              )}
            </h3>
            <div className="pl-4 border-l-2 border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{articulo.contenido}</p>
              
              {articulo.tipo === 'sancionable' && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-600 mb-2">Causales de multa asociadas:</p>
                  {causales
                    .filter(c => c.articulo_id === articulo.id)
                    .map(causal => (
                      <div key={causal.id} className="text-sm text-gray-700">
                        • {causal.descripcion}: ${causal.valor.toLocaleString()}
                      </div>
                    ))
                  }
                  {causales.filter(c => c.articulo_id === articulo.id).length === 0 && (
                    <p className="text-sm text-gray-500 italic">Sin causales asociadas</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Normativa</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('articulos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'articulos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Artículos de Normativa
          </button>
          <button
            onClick={() => setActiveTab('causales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'causales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Causales de Multa
          </button>
          <button
            onClick={() => setActiveTab('vista-previa')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vista-previa'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vista Previa del Reglamento
          </button>
        </nav>
      </div>

      {/* Contenido de Artículos */}
      {activeTab === 'articulos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Artículos de Normativa</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Nuevo Artículo
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {articulos.map((articulo) => (
                  <li key={articulo.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Art. {articulo.numero_articulo}: {articulo.titulo}
                          </p>
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            articulo.tipo === 'sancionable' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {articulo.tipo}
                          </span>
                          {!articulo.activo && (
                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {articulo.contenido.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditArticulo(articulo)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteArticulo(articulo.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Contenido de Causales */}
      {activeTab === 'causales' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Causales de Multa</h2>
            <button
              onClick={() => {
                resetCausalForm()
                setShowCausalModal(true)
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              + Agregar Causal
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">
            Gestiona las causales de multa y vincula cada causal con los artículos de normativa correspondientes.
          </p>
          
          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {causales.map((causal) => {
                  const articulo = articulos.find(a => a.id === causal.articulo_id)
                  return (
                    <li key={causal.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {causal.descripcion}
                          </p>
                          <p className="text-sm text-gray-600">
                            Valor: ${causal.valor.toLocaleString()}
                            {articulo && (
                              <span className="ml-4 text-blue-600">
                                → Artículo {articulo.numero_articulo}: {articulo.titulo}
                              </span>
                            )}
                            {!articulo && causal.articulo_id && (
                              <span className="ml-4 text-red-600">
                                → Artículo no encontrado
                              </span>
                            )}
                            {!causal.articulo_id && (
                              <span className="ml-4 text-gray-500">
                                → Sin artículo vinculado
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCausal(causal)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCausal(causal.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
                {causales.length === 0 && (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No hay causales registradas
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Vista Previa */}
      {activeTab === 'vista-previa' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vista Previa del Reglamento</h2>
            <button
              onClick={() => window.print()}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Imprimir / Exportar PDF
            </button>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {generarVistaPrevia()}
          </div>
        </div>
      )}

      {/* Modal para crear/editar artículo */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              
              <form onSubmit={handleSubmitArticulo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Artículo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_articulo}
                    onChange={(e) => setFormData({...formData, numero_articulo: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="ej: 5.2, 12.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="ej: Puntualidad en entrenamientos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'informativo' | 'sancionable'})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="informativo">Informativo</option>
                    <option value="sancionable">Sancionable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contenido *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.contenido}
                    onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Texto completo del artículo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    value={formData.orden_display}
                    onChange={(e) => setFormData({...formData, orden_display: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Causales */}
      {showCausalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCausal ? 'Editar Causal' : 'Agregar Nueva Causal'}
              </h3>
              <form onSubmit={handleSubmitCausal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    value={causalFormData.descripcion}
                    onChange={(e) => setCausalFormData({...causalFormData, descripcion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Llegada tarde a entrenamientos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de la Multa *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={causalFormData.valor}
                    onChange={(e) => setCausalFormData({...causalFormData, valor: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El valor debe ser mayor a 0 (mínimo $1)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Artículo de Normativa (Opcional)
                  </label>
                  <select
                    value={causalFormData.articulo_id || ''}
                    onChange={(e) => setCausalFormData({
                      ...causalFormData, 
                      articulo_id: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Sin artículo vinculado --</option>
                    {articulos
                      .filter(a => a.tipo === 'sancionable' && a.activo)
                      .sort((a, b) => a.numero_articulo.localeCompare(b.numero_articulo))
                      .map(articulo => (
                        <option key={articulo.id} value={articulo.id}>
                          Artículo {articulo.numero_articulo}: {articulo.titulo}
                        </option>
                      ))
                    }
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo se pueden vincular artículos de tipo "sancionable"
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCausalModal(false)
                      resetCausalForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionNormativa
