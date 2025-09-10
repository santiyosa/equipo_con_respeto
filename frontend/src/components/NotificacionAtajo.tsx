import { useEffect } from 'react'

interface NotificacionAtajoProps {
  mostrar: boolean
  onCerrar: () => void
}

function NotificacionAtajo({ mostrar, onCerrar }: NotificacionAtajoProps) {
  useEffect(() => {
    if (mostrar) {
      const timer = setTimeout(onCerrar, 5000) // Auto-cerrar después de 5 segundos
      return () => clearTimeout(timer)
    }
  }, [mostrar, onCerrar])

  if (!mostrar) return null

  return (
    <div className="fixed bottom-4 right-4 z-50" style={{
      animation: mostrar ? 'slideUp 0.3s ease-out' : undefined
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium">
              💡 Nuevo: Búsqueda Global
            </div>
            <div className="text-xs text-blue-200 mt-1">
              Presiona{' '}
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-700 text-blue-200 border border-blue-500 mx-1">
                Ctrl+Shift+F
              </kbd>
              o{' '}
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-700 text-blue-200 border border-blue-500 mx-1">
                Alt+/
              </kbd>
              para buscar en todo el sistema
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="flex-shrink-0 ml-2 text-blue-200 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificacionAtajo
