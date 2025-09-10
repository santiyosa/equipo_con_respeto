import React, { useState, useEffect } from 'react'
import { dashboardService } from '../../services/api'

interface JugadorRanking {
  posicion: number
  cedula: string
  nombre: string
  total_multas: number
  valor_total_multas: number
}

interface RankingData {
  total_jugadores: number
  ranking: JugadorRanking[]
}

interface RankingMultasProps {
  incluirSoloConMultas?: boolean
  incluirPagadas?: boolean
  incluirPendientes?: boolean
  limite?: number
}

const RankingMultas: React.FC<RankingMultasProps> = ({ 
  incluirSoloConMultas = true,
  incluirPagadas = true,
  incluirPendientes = true,
  limite = 10
}) => {
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getRankingMultas({
          incluirSoloConMultas,
          incluirPagadas,
          incluirPendientes,
          limite
        })
        setRanking(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching ranking multas:', err)
        setError('Error al cargar el ranking de multas')
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [incluirSoloConMultas, incluirPagadas, incluirPendientes, limite])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getMedalIcon = (posicion: number) => {
    switch (posicion) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${posicion}`
    }
  }

  const getRowColor = (posicion: number) => {
    switch (posicion) {
      case 1: return 'bg-yellow-50 border-yellow-200'
      case 2: return 'bg-gray-50 border-gray-200'
      case 3: return 'bg-orange-50 border-orange-200'
      default: return 'bg-white border-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!ranking || ranking.ranking.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Ranking de Multas
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🏆</div>
          <p className="text-gray-600">No hay datos de multas para mostrar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Ranking de Multas
        </h3>
        <div className="text-sm text-gray-500">
          {ranking.total_jugadores} jugador{ranking.total_jugadores !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className={`px-2 py-1 rounded-full ${
          incluirSoloConMultas ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {incluirSoloConMultas ? 'Solo con multas' : 'Todos los jugadores'}
        </span>
        <span className={`px-2 py-1 rounded-full ${
          incluirPagadas ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {incluirPagadas ? 'Incluye pagadas' : 'Sin pagadas'}
        </span>
        <span className={`px-2 py-1 rounded-full ${
          incluirPendientes ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {incluirPendientes ? 'Incluye pendientes' : 'Solo pagadas'}
        </span>
      </div>

      <div className="space-y-2">
        {ranking.ranking.map((jugador) => (
          <div
            key={jugador.cedula}
            className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md ${getRowColor(jugador.posicion)}`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-lg font-bold w-10 text-center">
                {getMedalIcon(jugador.posicion)}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {jugador.nombre}
                </div>
                <div className="text-sm text-gray-500">
                  CC: {jugador.cedula}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-lg text-red-600">
                {jugador.total_multas} multa{jugador.total_multas !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(jugador.valor_total_multas)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas resumidas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-600">Total Multas</div>
            <div className="text-lg font-bold text-red-600">
              {ranking.ranking.reduce((sum, j) => sum + j.total_multas, 0)}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Valor Total</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(ranking.ranking.reduce((sum, j) => sum + j.valor_total_multas, 0))}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Promedio</div>
            <div className="text-lg font-bold text-gray-700">
              {(ranking.ranking.reduce((sum, j) => sum + j.total_multas, 0) / ranking.total_jugadores).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RankingMultas
