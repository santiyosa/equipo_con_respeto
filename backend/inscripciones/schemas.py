from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class InscripcionBase(BaseModel):
    fecha_partido: date
    nombre_inscrito: str
    mensaje_whatsapp: Optional[str] = None
    jugador_id: Optional[int] = None

class InscripcionCreate(InscripcionBase):
    pass

class Inscripcion(InscripcionBase):
    id: int
    fecha_inscripcion: datetime
    orden_inscripcion: int

    class Config:
        orm_mode = True

class ReporteNomina(BaseModel):
    fecha_partido: date
    fecha_generacion: datetime
    total_inscritos: int
    cupos_titulares: int
    cupos_disponibles: int
    titulares: list
    suplentes: list
    resumen: dict
