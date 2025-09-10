from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EstadoCuentaEquipo(BaseModel):
    """Estado financiero del equipo"""
    total_ingresos_mensualidades: float
    total_ingresos_multas: float
    total_otros_aportes: float
    total_ingresos: float  # Suma de todos los ingresos
    total_egresos: float
    saldo_actual: float  # total_ingresos - total_egresos
    
    # Detalles por categoría
    egresos_por_categoria: List['EgresoPorCategoria']
    
    # Información adicional
    fecha_calculo: datetime
    periodo_inicio: Optional[datetime] = None
    periodo_fin: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class EgresoPorCategoria(BaseModel):
    """Resumen de egresos por categoría"""
    categoria_id: int
    categoria_nombre: str
    total_categoria: float
    cantidad_egresos: int
    
    class Config:
        from_attributes = True

class ResumenFinanciero(BaseModel):
    """Resumen financiero básico del equipo"""
    saldo_actual: float
    total_ingresos_mes_actual: float
    total_egresos_mes_actual: float
    diferencia_mes_actual: float  # ingresos - egresos del mes
    
    class Config:
        from_attributes = True

class FiltroEstadoCuenta(BaseModel):
    """Filtros para el estado de cuenta"""
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    incluir_detalles: bool = True
