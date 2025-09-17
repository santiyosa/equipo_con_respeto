from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
from .multas import MultaResumen
from .pagos import MesPago, OtroAporteResumen

class JugadorBase(BaseModel):
    nombre: str
    apellido: str
    cedula: str
    telefono: str
    email: str  # Email para credenciales
    fecha_nacimiento: date
    talla_uniforme: str
    numero_camiseta: Optional[int]
    contacto_emergencia_nombre: str
    contacto_emergencia_telefono: str
    recomendado_por_cedula: Optional[str] = None
    posicion: Optional[str] = None  # None para jugadores de campo, "arquero" para porteros
    activo: Optional[bool] = True
    # Campos de información médica
    eps: Optional[str] = None
    lugar_atencion: Optional[str] = None
    rh: Optional[str] = None

class JugadorCreate(JugadorBase):
    nombre_inscripcion: str  # Requerido en la creación

class JugadorUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    talla_uniforme: Optional[str] = None
    numero_camiseta: Optional[int] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    recomendado_por_cedula: Optional[str] = None
    posicion: Optional[str] = None
    activo: Optional[bool] = None
    # Campos de información médica
    eps: Optional[str] = None
    lugar_atencion: Optional[str] = None
    rh: Optional[str] = None

class Jugador(JugadorBase):
    nombre_inscripcion: str
    fecha_inscripcion: date
    estado_cuenta: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True

class JugadorDetalle(Jugador):
    recomendado_por: Optional['JugadorBase'] = None
    recomendados: List['JugadorBase'] = []

    class Config:
        from_attributes = True

class JugadorReporte(BaseModel):
    orden: int
    nombre: str
    estado: str  # "AL DÍA", "DEBE MENSUALIDAD", "TIENE MULTA PENDIENTE", "VERIFIQUE ESTADO"

class JugadorUniforme(BaseModel):
    nombre: str
    alias: str
    talla: str
    numero_camiseta: Optional[int]
    estado: str  # "AL DÍA", "DEBE MENSUALIDAD", "TIENE MULTA PENDIENTE"

class EstadoCuentaJugador(BaseModel):
    jugador_cedula: str
    nombre: str
    nombre_inscripcion: str
    meses_pagados: List[MesPago]
    multas: List[MultaResumen]
    otros_aportes: List[OtroAporteResumen]
    total_pagado: float
    total_multas_pendientes: float
    estado: str  # "AL DÍA", "DEBE MENSUALIDAD", "TIENE MULTA PENDIENTE"
