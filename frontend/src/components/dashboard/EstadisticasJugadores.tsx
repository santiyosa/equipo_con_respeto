import React, { useState, useEffect } from 'react';
import { dashboardService, EstadisticasJugadoresSimples } from '../../services/dashboardService';

// Componente Card simple
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>
    {children}
  </div>
);

const EstadisticasJugadores: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasJugadoresSimples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.obtenerEstadisticasJugadoresSimples();
        setEstadisticas(data);
      } catch (err) {
        console.error('Error al cargar estadísticas de jugadores:', err);
        setError('Error al cargar las estadísticas de jugadores');
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Estadísticas de Jugadores</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Promedio de pagos por jugador */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-2">
                💰 Promedio de Pagos por Jugador
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {formatearMoneda(estadisticas.promedio_pagos_por_jugador)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        {/* Jugadores con mensualidades al día */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">
                ✅ Jugadores con Mensualidades al Día
              </p>
              <p className="text-2xl font-bold text-green-700">
                {estadisticas.jugadores_mensualidades_al_dia}
              </p>
              <p className="text-xs text-green-600 mt-1">
                (Últimos 3 meses)
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </Card>

        {/* Top jugadores por aportes */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div>
            <p className="text-sm font-medium text-purple-600 mb-3">
              🏆 Top Jugadores por Aportes
            </p>
            <div className="space-y-2">
              {estadisticas.top_jugadores_aportes.slice(0, 3).map((jugador, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-sm font-medium text-purple-700 truncate">
                      {jugador.nombre.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {formatearMoneda(jugador.total_aportes)}
                  </span>
                </div>
              ))}
              {estadisticas.top_jugadores_aportes.length === 0 && (
                <p className="text-sm text-purple-600 italic">No hay datos disponibles</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EstadisticasJugadores;
