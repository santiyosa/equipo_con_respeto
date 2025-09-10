import { useState, useMemo, useEffect } from 'react'

interface UsePaginacionOptions<T> {
  datos: T[]
  itemsPorPagina?: number
  filtro?: (item: T, termino: string) => boolean
  terminoBusqueda?: string
}

interface UsePaginacionResult<T> {
  paginaActual: number
  totalPaginas: number
  datosPaginados: T[]
  siguientePagina: () => void
  paginaAnterior: () => void
  irAPagina: (pagina: number) => void
  setPaginaActual: (pagina: number) => void
  totalItems: number
  itemsEnPaginaActual: number
  indicePrimerItem: number
  indiceUltimoItem: number
}

export function usePaginacion<T>({
  datos,
  itemsPorPagina = 10,
  filtro,
  terminoBusqueda = ''
}: UsePaginacionOptions<T>): UsePaginacionResult<T> {
  const [paginaActual, setPaginaActual] = useState(1)

  const datosFiltrados = useMemo(() => {
    if (!filtro) {
      return datos
    }
    return datos.filter(item => filtro(item, terminoBusqueda))
  }, [datos, filtro, terminoBusqueda])

  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina)

  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina
    const fin = inicio + itemsPorPagina
    return datosFiltrados.slice(inicio, fin)
  }, [datosFiltrados, paginaActual, itemsPorPagina])

  const siguientePagina = () => {
    setPaginaActual(prev => Math.min(prev + 1, totalPaginas))
  }

  const paginaAnterior = () => {
    setPaginaActual(prev => Math.max(prev - 1, 1))
  }

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina)
    }
  }

  // Reiniciar a la primera página cuando cambian los datos o el filtro
  useEffect(() => {
    setPaginaActual(1)
  }, [datosFiltrados.length])

  const indicePrimerItem = (paginaActual - 1) * itemsPorPagina + 1
  const indiceUltimoItem = Math.min(paginaActual * itemsPorPagina, datosFiltrados.length)

  return {
    paginaActual,
    totalPaginas,
    datosPaginados,
    siguientePagina,
    paginaAnterior,
    irAPagina,
    setPaginaActual,
    totalItems: datosFiltrados.length,
    itemsEnPaginaActual: datosPaginados.length,
    indicePrimerItem,
    indiceUltimoItem
  }
}
