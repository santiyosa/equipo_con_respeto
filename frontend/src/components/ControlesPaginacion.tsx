interface ControlesPaginacionProps {
  paginaActual: number
  totalPaginas: number
  totalItems: number
  indicePrimerItem: number
  indiceUltimoItem: number
  siguientePagina: () => void
  paginaAnterior: () => void
  irAPagina: (pagina: number) => void
  mostrarInfo?: boolean
  className?: string
}

function ControlesPaginacion({
  paginaActual,
  totalPaginas,
  totalItems,
  indicePrimerItem,
  indiceUltimoItem,
  siguientePagina,
  paginaAnterior,
  irAPagina,
  mostrarInfo = true,
  className = ''
}: ControlesPaginacionProps) {
  if (totalPaginas <= 1) return null

  // Calcular qué páginas mostrar
  const generarNumerosPaginas = () => {
    const paginas: (number | string)[] = []
    const maxPaginasVisibles = 5
    
    if (totalPaginas <= maxPaginasVisibles) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i)
      }
    } else {
      // Lógica más compleja para muchas páginas
      if (paginaActual <= 3) {
        // Inicio: mostrar 1,2,3,4...última
        for (let i = 1; i <= 4; i++) {
          paginas.push(i)
        }
        if (totalPaginas > 5) paginas.push('...')
        paginas.push(totalPaginas)
      } else if (paginaActual >= totalPaginas - 2) {
        // Final: mostrar 1...antepenúltima,penúltima,última
        paginas.push(1)
        if (totalPaginas > 5) paginas.push('...')
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
          paginas.push(i)
        }
      } else {
        // Medio: mostrar 1...anterior,actual,siguiente...última
        paginas.push(1)
        paginas.push('...')
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
          paginas.push(i)
        }
        paginas.push('...')
        paginas.push(totalPaginas)
      }
    }
    
    return paginas
  }

  const numerosPaginas = generarNumerosPaginas()

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Información */}
      {mostrarInfo && (
        <div className="text-sm text-gray-700">
          Mostrando{' '}
          <span className="font-medium">{indicePrimerItem}</span>
          {' '}a{' '}
          <span className="font-medium">{indiceUltimoItem}</span>
          {' '}de{' '}
          <span className="font-medium">{totalItems}</span>
          {' '}resultado{totalItems !== 1 ? 's' : ''}
        </div>
      )}

      {/* Controles de navegación */}
      <div className="flex items-center space-x-1">
        {/* Botón Anterior */}
        <button
          onClick={paginaAnterior}
          disabled={paginaActual === 1}
          className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
        >
          <span className="sr-only">Anterior</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Números de página */}
        {numerosPaginas.map((numero, index) => (
          typeof numero === 'number' ? (
            <button
              key={numero}
              onClick={() => irAPagina(numero)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                numero === paginaActual
                  ? 'bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                  : 'text-gray-900'
              }`}
            >
              {numero}
            </button>
          ) : (
            <span
              key={`ellipsis-${index}`}
              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
            >
              {numero}
            </span>
          )
        ))}

        {/* Botón Siguiente */}
        <button
          onClick={siguientePagina}
          disabled={paginaActual === totalPaginas}
          className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
        >
          <span className="sr-only">Siguiente</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ControlesPaginacion
