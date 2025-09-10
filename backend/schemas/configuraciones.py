from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConfiguracionBase(BaseModel):
    clave: str
    valor: float
    descripcion: Optional[str] = None

class ConfiguracionCreate(ConfiguracionBase):
    pass

class ConfiguracionUpdate(BaseModel):
    valor: float
    descripcion: Optional[str] = None

class Configuracion(ConfiguracionBase):
    id: int
    actualizado_en: datetime
    actualizado_por: Optional[int] = None

    class Config:
        from_attributes = True
