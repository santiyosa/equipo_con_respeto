import axios from 'axios'

// Configuración base de axios usando variables de entorno
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Servicios del Dashboard
export const dashboardService = {
  async getDashboardData() {
    const response = await api.get('/api/dashboard/resumen')
    return response.data
  },

  async getEstadisticasMultas() {
    const response = await api.get('/api/dashboard/estadisticas-multas')
    return response.data
  },

  async getRankingMultas(options?: {
    fechaInicio?: string,
    fechaFin?: string,
    incluirSoloConMultas?: boolean,
    limite?: number,
    incluirPagadas?: boolean,
    incluirPendientes?: boolean
  }) {
    const params = new URLSearchParams()
    
    if (options?.fechaInicio) params.append('fecha_inicio', options.fechaInicio)
    if (options?.fechaFin) params.append('fecha_fin', options.fechaFin)
    if (options?.incluirSoloConMultas !== undefined) params.append('incluir_solo_con_multas', options.incluirSoloConMultas.toString())
    if (options?.limite) params.append('limite', options.limite.toString())
    if (options?.incluirPagadas !== undefined) params.append('incluir_pagadas', options.incluirPagadas.toString())
    if (options?.incluirPendientes !== undefined) params.append('incluir_pendientes', options.incluirPendientes.toString())
    
    const response = await api.get(`/api/dashboard/ranking-multas?${params.toString()}`)
    return response.data
  },

  async downloadReport(): Promise<Blob> {
    const response = await api.get('/api/dashboard/reporte-ejecutivo/pdf', {
      responseType: 'blob'
    })
    return response.data
  }
}

// Servicios de Jugadores - Alineados con backend
export const jugadoresService = {
  async getJugadores() {
    const response = await api.get('/api/jugadores/')
    return response.data
  },

  async getJugador(cedula: string) {
    const response = await api.get(`/api/jugadores/${cedula}`)
    return response.data
  },

  async createJugador(jugadorData: any) {
    const response = await api.post('/api/jugadores/', jugadorData)
    return response.data
  },

  async updateJugador(cedula: string, jugadorData: any) {
    const response = await api.put(`/api/jugadores/${cedula}`, jugadorData)
    return response.data
  },

  async cambiarEstadoJugador(cedula: string, activo: boolean) {
    const response = await api.patch(`/api/jugadores/${cedula}/estado`, { activo })
    return response.data
  },

  async buscarJugadores(query: string) {
    const response = await api.get(`/api/jugadores/buscar/?q=${encodeURIComponent(query)}`)
    return response.data
  },

  async getEstadoCuenta(cedula: string) {
    const response = await api.get(`/api/jugadores/${cedula}/estado-cuenta`)
    return response.data
  },

  async exportarListadoBasicoPDF(): Promise<Blob> {
    const response = await api.get('/api/jugadores/export/listado-basico/pdf', {
      responseType: 'blob'
    })
    return response.data
  },

  async exportarListadoCompletoPDF(): Promise<Blob> {
    const response = await api.get('/api/jugadores/export/listado-completo/pdf', {
      responseType: 'blob'
    })
    return response.data
  },

  async exportarEstadoCuentaPDF(cedula: string): Promise<Blob> {
    const response = await api.get(`/api/jugadores/${cedula}/estado-cuenta/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  async exportarDatosCompletosPDF(cedula: string): Promise<Blob> {
    const response = await api.get(`/api/jugadores/${cedula}/datos-completos/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Nuevos exports con información del dashboard
  async exportarListadoConPagosMensualesPDF(): Promise<Blob> {
    const response = await api.get('/api/jugadores/export/pagos-mensuales/pdf', {
      responseType: 'blob'
    })
    return response.data
  },

  async exportarReporteDashboardPDF(): Promise<Blob> {
    const response = await api.get('/api/dashboard/reporte-ejecutivo/pdf', {
      responseType: 'blob'
    })
    return response.data
  }
}

// Servicios de Multas
export const multasService = {
  async getMultas(incluirPagadas: boolean = false) {
    const response = await api.get(`/api/multas/completas/?incluir_pagadas=${incluirPagadas}`)
    return response.data
  },

  async getCausales() {
    const response = await api.get('/api/multas/causales/')
    return response.data
  },

  async createCausal(causalData: any) {
    const response = await api.post('/api/multas/causales/', causalData)
    return response.data
  },

  async updateCausal(causalId: number, causalData: any) {
    const response = await api.put(`/api/multas/causales/${causalId}`, causalData)
    return response.data
  },

  async deleteCausal(causalId: number) {
    const response = await api.delete(`/api/multas/causales/${causalId}`)
    return response.data
  },

  async createMulta(multaData: any) {
    const response = await api.post('/api/multas/', multaData)
    return response.data
  },

  async updateMulta(multaId: number, multaData: any) {
    const response = await api.put(`/api/multas/${multaId}`, multaData)
    return response.data
  },

  async deleteMulta(multaId: number) {
    const response = await api.delete(`/api/multas/${multaId}`)
    return response.data
  },

  // Métodos para aportes grupales
  async createAporteGrupal(aporteData: any) {
    const response = await api.post('/api/aportes-grupales/', aporteData)
    return response.data
  },

  async getAportesGrupales() {
    const response = await api.get('/api/aportes-grupales/')
    return response.data
  },

  async getDetalleAporteGrupal(grupoMultaId: string) {
    const response = await api.get(`/api/aportes-grupales/${grupoMultaId}/detalle`)
    return response.data
  }
}

// Servicios de Pagos
export const pagosService = {
  async getPagos() {
    const response = await api.get('/api/pagos/')
    return response.data
  },

  async createPago(pagoData: any) {
    const response = await api.post('/api/pagos/', pagoData)
    return response.data
  },

  async registrarPagoCombinado(pagoData: any) {
    const response = await api.post('/api/pagos/combinado/', pagoData)
    return response.data
  }
}

// Servicios de Egresos
export const egresosService = {
  async getEgresos() {
    const response = await api.get('/api/egresos/')
    return response.data
  },

  async createEgreso(egresoData: any) {
    const response = await api.post('/api/egresos/', egresoData)
    return response.data
  },

  async deleteEgreso(egresoId: number) {
    const response = await api.delete(`/api/egresos/${egresoId}`)
    return response.data
  },

  async getCategorias() {
    const response = await api.get('/api/egresos/categorias/')
    return response.data
  },

  async createCategoria(categoriaData: any) {
    const response = await api.post('/api/egresos/categorias/', categoriaData)
    return response.data
  },

  async updateCategoria(categoriaId: number, categoriaData: any) {
    const response = await api.put(`/api/egresos/categorias/${categoriaId}`, categoriaData)
    return response.data
  },

  async deleteCategoria(categoriaId: number) {
    const response = await api.delete(`/api/egresos/categorias/${categoriaId}`)
    return response.data
  },

  async getResumen(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fecha_inicio', fechaInicio)
    if (fechaFin) params.append('fecha_fin', fechaFin)
    
    const response = await api.get(`/api/egresos/resumen/?${params.toString()}`)
    return response.data
  }
}

// Servicios de Estado de Cuenta (adicionales)
// Servicios de Estado de Cuenta (alineados con backend)
export const estadoCuentaService = {
  async getEstadoCuentaEquipo(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fecha_inicio', fechaInicio)
    if (fechaFin) params.append('fecha_fin', fechaFin)
    
    const response = await api.get(`/api/estado-cuenta-equipo/?${params.toString()}`)
    return response.data
  },

  async getSaldoActual() {
    const response = await api.get('/api/saldo-actual/')
    return response.data
  },

  async getEgresosPorCategoria(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fecha_inicio', fechaInicio)
    if (fechaFin) params.append('fecha_fin', fechaFin)
    
    const response = await api.get(`/api/egresos-por-categoria/?${params.toString()}`)
    return response.data
  },

  async getEstadoCuentaPeriodo(año: number, mes?: number) {
    const params = new URLSearchParams()
    params.append('año', año.toString())
    if (mes) params.append('mes', mes.toString())
    
    const response = await api.get(`/api/estado-cuenta-periodo/?${params.toString()}`)
    return response.data
  }
}

// Servicios de Configuraciones
export const configuracionesService = {
  async getConfiguraciones() {
    const response = await api.get('/api/configuraciones/')
    return response.data
  },

  async getConfiguracion(clave: string) {
    const response = await api.get(`/api/configuraciones/${clave}`)
    return response.data
  },

  async createConfiguracion(configuracionData: any) {
    const response = await api.post('/api/configuraciones/', configuracionData)
    return response.data
  },

  async updateConfiguracion(clave: string, configuracionData: any) {
    const response = await api.put(`/api/configuraciones/${clave}`, configuracionData)
    return response.data
  },

  async deleteConfiguracion(clave: string) {
    const response = await api.delete(`/api/configuraciones/${clave}`)
    return response.data
  }
}

export default api
