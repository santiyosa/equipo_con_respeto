import React, { useState, useEffect } from 'react';
import { dashboardService, UltimoEgreso } from '../../services/dashboardService';

// Componente Card simple
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>
    {children}
  </div>
);

const UltimosEgresos: React.FC = () => {
  const [egresos, setEgresos] = useState<UltimoEgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEgresos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.obtenerUltimosEgresos(5);
        setEgresos(data);
      } catch (err) {
        console.error('Error al cargar últimos egresos:', err);
        setError('Error al cargar los últimos egresos');
      } finally {
        setLoading(false);
      }
    };

    cargarEgresos();
  }, []);

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Sin fecha';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    const categoriaLower = categoria.toLowerCase();
    if (categoriaLower.includes('transporte')) return '🚌';
    if (categoriaLower.includes('equipamiento') || categoriaLower.includes('equipo')) return '⚽';
    if (categoriaLower.includes('arbitraje') || categoriaLower.includes('árbitro')) return '👨‍⚖️';
    if (categoriaLower.includes('alimentación') || categoriaLower.includes('comida')) return '🍕';
    if (categoriaLower.includes('mantenimiento')) return '🔧';
    if (categoriaLower.includes('medicamento') || categoriaLower.includes('medicina')) return '💊';
    if (categoriaLower.includes('varios') || categoriaLower.includes('otros')) return '📋';
    return '💰'; // Icono por defecto
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💸 Últimos Egresos</h2>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="ml-4">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💸 Últimos Egresos</h2>
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!egresos || egresos.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💸 Últimos Egresos</h2>
        <Card className="p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No hay egresos registrados</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">💸 Últimos Egresos</h2>
      
      <Card className="p-6">
        <div className="space-y-4">
          {egresos.map((egreso) => (
            <div 
              key={egreso.id} 
              className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-2xl">
                  {getCategoriaIcon(egreso.categoria)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800 truncate">
                      {egreso.descripcion}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                      {egreso.categoria}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatearFecha(egreso.fecha)}
                  </p>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="font-semibold text-red-600 text-lg">
                  -{formatearMoneda(egreso.valor)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {egresos.length >= 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Mostrando los últimos 5 egresos
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UltimosEgresos;