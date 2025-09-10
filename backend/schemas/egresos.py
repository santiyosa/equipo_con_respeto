from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel

class CategoriaEgresoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaEgresoCreate(CategoriaEgresoBase):
    pass

class CategoriaEgreso(CategoriaEgresoBase):
    id: int

    class Config:
        from_attributes = True

class EgresoBase(BaseModel):
    categoria_id: int
    concepto: str
    valor: float
    comprobante: Optional[str] = None
    notas: Optional[str] = None

class EgresoCreate(EgresoBase):
    registrado_por: int
    fecha: Optional[date] = None  # Fecha opcional, si no se envía usa la actual

class Egreso(EgresoBase):
    id: int
    fecha: datetime
    registrado_por: Optional[int] = None
    categoria: CategoriaEgreso

    class Config:
        from_attributes = True

class ResumenCategoria(BaseModel):
    nombre: str
    total: float
    egresos: List[Egreso]

class ResumenFinanciero(BaseModel):
    # Ingresos
    total_mensualidades: float
    total_multas_cobradas: float
    total_multas_pendientes: float
    total_otros_aportes: float
    
    # Egresos
    total_egresos: float
    egresos_por_categoria: List[ResumenCategoria]
    
    # Totales
    saldo_total: float
