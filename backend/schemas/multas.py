from typing import Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, validator, Field

class CausalMultaBase(BaseModel):
    descripcion: str = Field(..., min_length=3, max_length=200, description="Descripción de la causal")
    valor: float = Field(..., gt=0, description="Valor de la multa debe ser mayor a 0")
    articulo_id: Optional[int] = Field(None, description="ID del artículo de normativa que respalda esta causal")

class CausalMultaCreate(CausalMultaBase):
    pass

class CausalMultaUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=3, max_length=200)
    valor: Optional[float] = Field(None, gt=0)
    articulo_id: Optional[int] = None

class CausalMultaResponse(CausalMultaBase):
    id: int

    class Config:
        from_attributes = True

class MultaBase(BaseModel):
    jugador_cedula: str = Field(..., min_length=8, max_length=15, description="Cédula del jugador")
    causal_id: int = Field(..., gt=0, description="ID de la causal de multa")

class MultaCreate(MultaBase):
    fecha_multa: Optional[date] = Field(default=None, description="Fecha de la multa")
    
    @validator('fecha_multa', pre=True, always=True)
    def set_fecha_multa(cls, v):
        if v is None:
            return date.today()
        return v
    
    @validator('fecha_multa')
    def validate_fecha_multa(cls, v):
        today = date.today()
        # Permitir hasta mañana para evitar problemas de zona horaria
        max_date = today + timedelta(days=1)
        
        if v > max_date:
            raise ValueError(f'La fecha de la multa no puede ser más de un día en el futuro. Fecha máxima: {max_date}')
        # No permitir multas de más de 1 año atrás
        if v < today.replace(year=today.year - 1):
            raise ValueError('La fecha de la multa no puede ser de más de 1 año atrás')
        return v

class MultaUpdate(BaseModel):
    jugador_cedula: Optional[str] = Field(None, min_length=8, max_length=15)
    causal_id: Optional[int] = Field(None, gt=0)
    pagada: Optional[bool] = None
    fecha_pago: Optional[datetime] = None
    fecha_multa: Optional[date] = None
    
    @validator('fecha_multa')
    def validate_fecha_multa(cls, v):
        if v is not None:
            if v > date.today():
                raise ValueError('La fecha de la multa no puede ser futura')
            if v < date.today().replace(year=date.today().year - 1):
                raise ValueError('La fecha de la multa no puede ser de más de 1 año atrás')
        return v
    
    @validator('fecha_pago')
    def validate_fecha_pago(cls, v, values):
        if v is not None:
            if v.date() > date.today():
                raise ValueError('La fecha de pago no puede ser futura')
            # Si hay fecha_multa, el pago no puede ser anterior a la multa
            if 'fecha_multa' in values and values['fecha_multa'] and v.date() < values['fecha_multa']:
                raise ValueError('La fecha de pago no puede ser anterior a la fecha de la multa')
        return v

class Multa(MultaBase):
    id: int
    valor: float = Field(..., gt=0, description="Valor de la multa al momento de creación")
    fecha_multa: date
    pagada: bool
    fecha_pago: Optional[datetime]
    registrado_por: int

    class Config:
        from_attributes = True

class MultaResumen(BaseModel):
    descripcion: str
    valor: float
    fecha_multa: date
    pagada: bool
    fecha_pago: Optional[datetime]

class MultaCompleta(BaseModel):
    id: int
    jugador_cedula: str
    jugador_nombre: str
    causal_id: int
    causal_descripcion: str
    causal_valor: float  # Valor actual de la causal (para referencia)
    valor: float = Field(..., gt=0, description="Valor de la multa al momento de creación")
    fecha_multa: date
    pagada: bool
    fecha_pago: Optional[datetime]
    registrado_por: int
    # Campos para aportes grupales
    es_aporte_grupal: Optional[bool] = False
    grupo_multa_id: Optional[str] = None
    concepto_aporte: Optional[str] = None

    class Config:
        from_attributes = True

# Esquemas para aportes grupales
class AporteGrupalCreate(BaseModel):
    causal_id: int = Field(..., gt=0, description="ID de la causal de multa para el aporte")
    concepto_aporte: str = Field(..., min_length=3, max_length=200, description="Descripción del aporte grupal")
    fecha_multa: Optional[date] = Field(default=None, description="Fecha del aporte")
    
    @validator('fecha_multa', pre=True, always=True)
    def set_fecha_multa(cls, v):
        if v is None:
            return date.today()
        return v
    
    @validator('fecha_multa')
    def validate_fecha_multa(cls, v):
        today = date.today()
        max_date = today + timedelta(days=1)
        
        if v > max_date:
            raise ValueError(f'La fecha del aporte no puede ser más de un día en el futuro. Fecha máxima: {max_date}')
        if v < today.replace(year=today.year - 1):
            raise ValueError('La fecha del aporte no puede ser de más de 1 año atrás')
        return v

class AporteGrupalResumen(BaseModel):
    grupo_multa_id: str
    concepto_aporte: str
    fecha_multa: date
    causal_descripcion: str
    valor_unitario: float
    total_jugadores: int
    pagadas: int
    pendientes: int
    porcentaje_pagado: float

class AporteGrupalDetalle(BaseModel):
    id: int
    jugador_cedula: str
    jugador_nombre: str
    causal_descripcion: str
    causal_valor: float
    fecha_multa: date
    pagada: bool
    fecha_pago: Optional[datetime]
    concepto_aporte: str

class AporteGrupalResponse(BaseModel):
    grupo_multa_id: str
    concepto_aporte: str
    total_jugadores: int
    multas_creadas: int  # Número de multas creadas, no lista de objetos
