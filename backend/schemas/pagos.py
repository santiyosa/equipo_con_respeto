from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class PagoMensualidadCreate(BaseModel):
    mes: int
    ano: int
    # valor se obtiene automáticamente de la configuración

class PagoMultaCreate(BaseModel):
    multa_id: int
    
class PagoCombinado(BaseModel):
    jugador_cedula: str
    mensualidades: List[PagoMensualidadCreate]
    multas: List[int]  # Lista de IDs de multas a pagar
    fecha_pago: Optional[datetime] = None  # Si no se proporciona, se usa la fecha actual
    registrado_por: int  # ID del administrador que registra el pago

class PagoResponse(BaseModel):
    mensaje: str
    fecha_pago: datetime
    mensualidades_registradas: int
    multas_pagadas: int
    estado_cuenta: bool

    class Config:
        from_attributes = True

class MensualidadBase(BaseModel):
    jugador_cedula: str
    mes: int
    ano: int
    valor: float

class MensualidadCreate(MensualidadBase):
    pass

class Mensualidad(MensualidadBase):
    id: int
    fecha_pago: datetime
    registrado_por: int

    class Config:
        from_attributes = True

class OtroAporteBase(BaseModel):
    jugador_cedula: str
    concepto: str
    valor: float

class OtroAporteCreate(OtroAporteBase):
    pass

class OtroAporte(OtroAporteBase):
    id: int
    fecha_aporte: datetime
    registrado_por: int

    class Config:
        from_attributes = True

class MesPago(BaseModel):
    mes: int
    ano: int
    valor: float
    fecha_pago: datetime

class OtroAporteResumen(BaseModel):
    concepto: str
    valor: float
    fecha_aporte: datetime

class PagoMensual(BaseModel):
    valor: Optional[float] = None
    pagado: bool = False
    fecha_pago: Optional[datetime] = None

class ResumenPagosMensualesJugador(BaseModel):
    nombre: str
    pagos_mensuales: Dict[str, PagoMensual]  # mes_año -> estado
    total_pagado: float
    estado: str  # "AL DÍA", "DEBE MENSUALIDAD", "TIENE MULTA PENDIENTE"
