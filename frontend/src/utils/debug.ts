import { jugadoresService, multasService, egresosService } from '../services/api'

// Función de debug para probar las APIs
export const debugAPIs = async () => {
  try {
    console.log('=== DEBUG APIs ===')
    
    // Probar jugadores
    console.log('Probando jugadoresService.getJugadores()...')
    const jugadores = await jugadoresService.getJugadores()
    console.log('Jugadores:', jugadores.length, 'elementos')
    if (jugadores.length > 0) {
      console.log('Primer jugador:', jugadores[0])
      console.log('Campos del primer jugador:', Object.keys(jugadores[0]))
    }
    
    // Probar multas
    console.log('Probando multasService.getMultas()...')
    const multas = await multasService.getMultas(true)
    console.log('Multas:', multas.length, 'elementos')
    if (multas.length > 0) {
      console.log('Primera multa:', multas[0])
      console.log('Campos de la primera multa:', Object.keys(multas[0]))
    }
    
    // Probar egresos
    console.log('Probando egresosService.getEgresos()...')
    const egresos = await egresosService.getEgresos()
    console.log('Egresos:', egresos.length, 'elementos')
    if (egresos.length > 0) {
      console.log('Primer egreso:', egresos[0])
      console.log('Campos del primer egreso:', Object.keys(egresos[0]))
    }
    
    console.log('=== FIN DEBUG ===')
    
    return { jugadores, multas, egresos }
  } catch (error) {
    console.error('Error en debug:', error)
    return null
  }
}

// Hacer disponible globalmente para testing
if (typeof window !== 'undefined') {
  (window as any).debugAPIs = debugAPIs
}
