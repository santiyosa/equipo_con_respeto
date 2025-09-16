import api from './api';

export interface EstadisticasJugadoresSimples {
  promedio_pagos_por_jugador: number;
  jugadores_mensualidades_al_dia: number;
  top_jugadores_aportes: Array<{
    nombre: string;
    total_aportes: number;
  }>;
  fecha_generacion: string;
}

export interface EstadoPagoMes {
  pagado: boolean;
  valor: number;
  fecha_pago: string | null;
}

export interface JugadorConPagosMensuales {
  cedula: string;
  nombre: string;
  nombre_inscripcion: string;
  estado_cuenta: boolean;
  meses: { [mes: string]: EstadoPagoMes };
  valor_multas_pendientes: number;
}

export interface UltimoEgreso {
  id: number;
  descripcion: string;
  valor: number;
  fecha: string | null;
  categoria: string;
}

export interface UltimosEgresosResponse {
  egresos: UltimoEgreso[];
  total: number;
  limite_solicitado: number;
}

export const dashboardService = {
  /**
   * Obtiene estadísticas simplificadas de jugadores
   */
  async obtenerEstadisticasJugadoresSimples(): Promise<EstadisticasJugadoresSimples> {
    const response = await api.get('/api/dashboard/estadisticas-jugadores-simples');
    return response.data;
  },

  /**
   * Obtiene el estado de pagos de todos los jugadores por mes
   */
  async obtenerEstadoPagosPorMes(año?: number): Promise<JugadorConPagosMensuales[]> {
    const params = año ? { año } : {};
    const response = await api.get('/api/dashboard/estado-pagos-por-mes', { params });
    return response.data;
  },

  /**
   * Exporta el reporte ejecutivo del dashboard en PDF
   */
  async exportarReporteEjecutivoPDF(): Promise<Blob> {
    const response = await api.get('/api/dashboard/reporte-ejecutivo/pdf', {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Obtiene los últimos egresos registrados
   */
  async obtenerUltimosEgresos(limite: number = 5): Promise<UltimoEgreso[]> {
    const response = await api.get(`/api/dashboard/ultimos-egresos?limite=${limite}`);
    return response.data.egresos; // Extraer solo el array de egresos
  }
};
