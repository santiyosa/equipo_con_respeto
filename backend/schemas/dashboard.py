from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class JugadorRankingMultas(BaseModel):
    """Ranking de jugador por cantidad de multas"""
    posicion: int
    cedula: str
    nombre: str
    nombre_inscripcion: str
    total_multas: int
    multas_pendientes: int
    multas_pagadas: int
    valor_total_multas: float
    valor_multas_pendientes: float
    valor_multas_pagadas: float
    ultima_multa: Optional[date] = None
    
    class Config:
        from_attributes = True

class RankingMultasResponse(BaseModel):
    """Respuesta completa del ranking de multas"""
    fecha_generacion: datetime
    total_jugadores: int
    periodo_inicio: Optional[date] = None
    periodo_fin: Optional[date] = None
    ranking: List[JugadorRankingMultas]
    
    class Config:
        from_attributes = True

class FiltroRankingMultas(BaseModel):
    """Filtros para el ranking de multas"""
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    incluir_solo_con_multas: bool = True
    limite: int = 50
    incluir_pagadas: bool = True
    incluir_pendientes: bool = True

class EstadisticasMultas(BaseModel):
    """Estadísticas generales de multas"""
    total_multas_aplicadas: int
    total_multas_pendientes: int
    total_multas_pagadas: int
    valor_total_multas: float
    valor_multas_pendientes: float
    valor_multas_pagadas: float
    promedio_multas_por_jugador: float
    jugador_con_mas_multas: Optional[str] = None  # cedula
    jugador_con_mayor_valor_multas: Optional[str] = None  # cedula
    
    class Config:
        from_attributes = True

class EstadisticasJugadoresSimples(BaseModel):
    """Estadísticas simplificadas de jugadores"""
    promedio_pagos_por_jugador: float
    jugadores_mensualidades_al_dia: int
    top_jugadores_aportes: List[dict]
    fecha_generacion: datetime
    
    class Config:
        from_attributes = True

class EstadisticasJugadores(BaseModel):
    """Estadísticas completas de jugadores"""
    # Contadores básicos
    total_jugadores: int
    jugadores_activos: int
    jugadores_inactivos: int
    jugadores_sin_multas: int
    jugadores_con_mensualidad_actual: int
    promedio_aportes_por_jugador: float
    
    # Distribución por edades
    distribucion_edades: dict
    
    # Top aportantes
    top_aportantes: List[dict]
    
    # Fecha de generación
    fecha_generacion: datetime
    
    class Config:
        from_attributes = True

class ResumenDashboard(BaseModel):
    """Resumen ejecutivo para dashboard"""
    # Estadísticas financieras
    saldo_actual: float
    ingresos_mes_actual: float
    egresos_mes_actual: float
    
    # Estadísticas de jugadores
    total_jugadores: int
    jugadores_al_dia: int
    jugadores_con_multas: int
    
    # Top rankings
    top_3_jugadores_multas: List[JugadorRankingMultas]
    
    # Fechas
    fecha_generacion: datetime
    
    class Config:
        from_attributes = True
