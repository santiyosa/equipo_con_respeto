import { useState, useEffect, useRef } from 'react'
import { jugadoresService, multasService, egresosService } from '../services/api'

interface ResultadoBusqueda {
  id: string
  tipo: 'jugador' | 'multa' | 'egreso'
  titulo: string
  subtitulo: string
  icono: string
  datos: any
}

interface ModalBusquedaGlobalProps {
  isOpen: boolean
  onClose: () => void
  onResultadoSeleccionado: (resultado: ResultadoBusqueda) => void
}

function ModalBusquedaGlobal({ isOpen, onClose, onResultadoSeleccionado }: ModalBusquedaGlobalProps) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [cargando, setCargando] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Enfocar input cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      setQuery('')
      setResultados([])
      setSelectedIndex(-1)
    }
  }, [isOpen])

  // Manejar teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < resultados.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && resultados[selectedIndex]) {
            manejarSeleccion(resultados[selectedIndex])
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, resultados, selectedIndex, onClose])

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        realizarBusqueda()
      } else {
        setResultados([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const realizarBusqueda = async () => {
    if (query.length < 2) return

    setCargando(true)
    try {
      const [jugadores, multas, egresos] = await Promise.all([
        buscarJugadores(query),
        buscarMultas(query),
        buscarEgresos(query)
      ])

      const todosResultados = [
        ...jugadores.map((j: any) => ({
          id: `jugador-${j.cedula}`,
          tipo: 'jugador' as const,
          titulo: j.nombre,
          subtitulo: `${j.nombre_inscripcion || 'Sin alias'} - ${j.activo ? 'Activo' : 'Inactivo'}`,
          icono: '👤',
          datos: j
        })),
        ...multas.map((m: any) => ({
          id: `multa-${m.id}`,
          tipo: 'multa' as const,
          titulo: `Multa: ${m.causal_descripcion || m.concepto_aporte || 'Sin causal'}`,
          subtitulo: `${m.jugador_nombre || 'Sin jugador'} - $${(m.causal_valor || 0).toLocaleString()}`,
          icono: '💰',
          datos: m
        })),
        ...egresos.map((e: any) => ({
          id: `egreso-${e.id}`,
          tipo: 'egreso' as const,
          titulo: e.descripcion || 'Sin descripción',
          subtitulo: `$${(e.valor || 0).toLocaleString()} - ${e.fecha ? new Date(e.fecha).toLocaleDateString() : 'Sin fecha'}`,
          icono: '📊',
          datos: e
        }))
      ]

      setResultados(todosResultados)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error en búsqueda:', error)
    } finally {
      setCargando(false)
    }
  }

  const buscarJugadores = async (termino: string) => {
    try {
      const jugadores = await jugadoresService.getJugadores()
      
      const filtrados = jugadores.filter((j: any) => 
        j.nombre?.toLowerCase().includes(termino.toLowerCase()) ||
        j.cedula?.includes(termino) ||
        j.nombre_inscripcion?.toLowerCase().includes(termino.toLowerCase()) ||
        (j.numero_camiseta && j.numero_camiseta.toString().includes(termino))
      )
      
      return filtrados
    } catch (error) {
      console.error('Error buscando jugadores:', error)
      return []
    }
  }

  const buscarMultas = async (termino: string) => {
    try {
      const multas = await multasService.getMultas(true) // incluir todas las multas
      return multas.filter((m: any) => 
        m.jugador_nombre?.toLowerCase().includes(termino.toLowerCase()) ||
        m.jugador_cedula?.includes(termino) ||
        m.causal_descripcion?.toLowerCase().includes(termino.toLowerCase()) ||
        m.concepto_aporte?.toLowerCase().includes(termino.toLowerCase())
      )
    } catch (error) {
      console.error('Error buscando multas:', error)
      return []
    }
  }

  const buscarEgresos = async (termino: string) => {
    try {
      const egresos = await egresosService.getEgresos()
      return egresos.filter((e: any) => 
        e.descripcion?.toLowerCase().includes(termino.toLowerCase()) ||
        e.categoria?.nombre?.toLowerCase().includes(termino.toLowerCase())
      )
    } catch (error) {
      console.error('Error buscando egresos:', error)
      return []
    }
  }

  const manejarSeleccion = (resultado: ResultadoBusqueda) => {
    onResultadoSeleccionado(resultado)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugadores, multas, egresos..."
              className="block w-full pl-10 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
            />
            {cargando && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-lg font-medium mb-2">Búsqueda Global</div>
              <div className="text-sm">Escribe al menos 2 caracteres para buscar</div>
              <div className="mt-4 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑</kbd>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">↓</kbd> para navegar • 
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">Enter</kbd> para seleccionar • 
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">Esc</kbd> para cerrar
              </div>
            </div>
          ) : resultados.length === 0 && !cargando ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">😕</div>
              <div className="text-lg font-medium mb-2">Sin resultados</div>
              <div className="text-sm">No se encontraron resultados para "{query}"</div>
            </div>
          ) : (
            <div>
              {resultados.map((resultado, index) => (
                <button
                  key={resultado.id}
                  onClick={() => manejarSeleccion(resultado)}
                  className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <span className="text-xl mr-3">{resultado.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {resultado.titulo}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {resultado.subtitulo}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      resultado.tipo === 'jugador' ? 'bg-blue-100 text-blue-800' :
                      resultado.tipo === 'multa' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {resultado.tipo}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
          Busca en todas las secciones: jugadores, multas y egresos
        </div>
      </div>
    </div>
  )
}

export default ModalBusquedaGlobal
