import { useState, useEffect } from 'react'
import { dashboardService } from '../services/api'
import EstadisticasJugadores from '../components/dashboard/EstadisticasJugadores'

// Tipos actualizados para coincidir con el backend
interface DashboardData {
  saldo_actual: number
  ingresos_mes_actual: number
  egresos_mes_actual: number
  total_jugadores: number
  jugadores_al_dia: number
  jugadores_con_multas: number
  top_3_jugadores_multas: any[]
  fecha_generacion: string
}

interface EstadisticasMultas {
  total_multas_aplicadas: number
  total_multas_pendientes: number
  total_multas_pagadas: number
  valor_total_multas: number
  valor_multas_pendientes: number
  valor_multas_pagadas: number
  promedio_multas_por_jugador: number
  jugador_con_mas_multas: string | null
  jugador_con_mayor_valor_multas: string | null
}

interface EstadisticasJugadores {
  total_jugadores: number
  jugadores_activos: number
  jugadores_inactivos: number
  jugadores_sin_multas: number
  jugadores_con_mensualidad_actual: number
  promedio_aportes_por_jugador: number
  distribucion_edades: {
    menores_20: number
    entre_20_25: number
    entre_25_30: number
    mayores_30: number
  }
  top_aportantes: Array<{
    nombre: string
    total_aportes: number
  }>
  fecha_generacion: string
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [estadisticasMultas, setEstadisticasMultas] = useState<EstadisticasMultas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  console.log('Dashboard component rendered')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching dashboard data...')
        
        // Obtener datos del dashboard y estadísticas de multas en paralelo
        const [dashboardData, multasData] = await Promise.all([
          dashboardService.getDashboardData(),
          dashboardService.getEstadisticasMultas()
        ])
        
        console.log('Dashboard data received:', dashboardData)
        console.log('Multas statistics received:', multasData)
        
        setData(dashboardData)
        setEstadisticasMultas(multasData)
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err : new Error('Error desconocido'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDownloadReport = async () => {
    try {
      console.log('Downloading report...')
      const blob = await dashboardService.downloadReport()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'reporte-ejecutivo.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('Report downloaded successfully')
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-14">
        <div className="text-gray-600">Cargando datos del dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-100 border border-red-300 text-red-700 p-14 rounded mb-10">
        Error al cargar los datos del dashboard: {error.message}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
        No hay datos disponibles
      </div>
    )
  }

  console.log('Data structure:', data)

  return (
    <div>
      {/* Header con botón de descarga */}
      <div className="flex justify-between items-center mb-8 lg:mt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Resumen General
        </h1>
        <button
          onClick={handleDownloadReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          📄 Descargar Reporte PDF
        </button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              👥
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jugadores</p>
              <p className="text-2xl font-bold text-gray-900">{data.total_jugadores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              ✅
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jugadores al Día</p>
              <p className="text-2xl font-bold text-gray-900">{data.jugadores_al_dia}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              ⚠️
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Multas</p>
              <p className="text-2xl font-bold text-gray-900">{data.jugadores_con_multas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              💰
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Actual</p>
              <p className="text-2xl font-bold text-gray-900">${data.saldo_actual.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Jugadores */}
      <EstadisticasJugadores />

      {/* Estadísticas de Multas */}
      {estadisticasMultas && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📊 Estadísticas de Multas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Multas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticasMultas.total_multas_aplicadas}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  📝
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Multas Pagadas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticasMultas.total_multas_pagadas}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  ✅
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Multas Pendientes</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticasMultas.total_multas_pendientes}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  ⏳
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Valores Monetarios</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total recaudado (pagadas):</span>
                  <span className="font-semibold text-green-600">
                    ${estadisticasMultas.valor_multas_pagadas.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pendiente por cobrar:</span>
                  <span className="font-semibold text-red-600">
                    ${estadisticasMultas.valor_multas_pendientes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Valor total multas:</span>
                  <span className="font-semibold text-gray-900">
                    ${estadisticasMultas.valor_total_multas.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Adicionales</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio multas/jugador:</span>
                  <span className="font-semibold text-blue-600">
                    {estadisticasMultas.promedio_multas_por_jugador}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tasa de pago:</span>
                  <span className="font-semibold text-green-600">
                    {((estadisticasMultas.total_multas_pagadas / estadisticasMultas.total_multas_aplicadas) * 100).toFixed(1)}%
                  </span>
                </div>
                {estadisticasMultas.jugador_con_mas_multas && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Jugador con más multas:</span>
                    <span className="font-semibold text-orange-600">
                      {estadisticasMultas.jugador_con_mas_multas}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Estado del Equipo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Cuentas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jugadores al día:</span>
                <span className="font-semibold text-green-600">{data.jugadores_al_dia}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jugadores con multas:</span>
                <span className="font-semibold text-red-600">{data.jugadores_con_multas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Porcentaje al día:</span>
                <span className="font-semibold text-blue-600">
                  {((data.jugadores_al_dia / data.total_jugadores) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Finanzas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Saldo actual:</span>
                <span className="font-semibold text-gray-900">${data.saldo_actual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ingresos del mes:</span>
                <span className="font-semibold text-green-600">${data.ingresos_mes_actual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Egresos del mes:</span>
                <span className="font-semibold text-red-600">${data.egresos_mes_actual.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            📅 Última actualización: {new Date(data.fecha_generacion).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
