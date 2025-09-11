import React, { useState } from 'react'
import { dashboardService } from '../../services/api'

interface ReporteJugadoresProps {
  className?: string
}

const ReporteJugadores: React.FC<ReporteJugadoresProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDownloadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const blob = await dashboardService.downloadReport()
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `reporte-ejecutivo-dashboard-${new Date().toISOString().split('T')[0]}.pdf`
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess(true)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (err) {
      console.error('Error downloading report:', err)
      setError('Error al descargar el reporte. Por favor, intenta nuevamente.')
      
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Reporte Ejecutivo Dashboard
          </h3>
          <p className="text-sm text-gray-600">
            Descarga un reporte ejecutivo completo del dashboard
          </p>
        </div>
        <div className="text-4xl">📊</div>
      </div>

      {/* Descripción del reporte */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">El reporte incluye:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Estadísticas generales del equipo
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Resumen financiero completo
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Rankings y análisis de rendimiento
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Métricas de gestión del equipo
          </li>
        </ul>
      </div>

      {/* Botón de descarga */}
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={handleDownloadReport}
          disabled={loading}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando reporte...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Reporte PDF
            </div>
          )}
        </button>

        {/* Mensajes de estado */}
        {success && (
          <div className="flex items-center text-green-600 text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            ¡Reporte descargado exitosamente!
          </div>
        )}

        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          El archivo se descargará en formato PDF con la fecha actual en el nombre
        </p>
      </div>
    </div>
  )
}

export default ReporteJugadores
