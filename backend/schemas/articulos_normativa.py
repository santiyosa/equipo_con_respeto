from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TipoArticulo(str, Enum):
    informativo = "informativo"
    sancionable = "sancionable"

class ArticuloNormativaBase(BaseModel):
    numero_articulo: str = Field(..., min_length=1, max_length=20, description="Número del artículo, ej: '5.2', '12.1'")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título descriptivo del artículo")
    contenido: str = Field(..., min_length=1, description="Texto completo del artículo")
    tipo: TipoArticulo = Field(default=TipoArticulo.informativo, description="Tipo de artículo")
    orden_display: int = Field(default=0, ge=0, description="Orden para mostrar en la normativa")
    activo: bool = Field(default=True, description="Indica si el artículo está activo")

class ArticuloNormativaCreate(ArticuloNormativaBase):
    """Schema para crear un nuevo artículo de normativa"""
    pass

class ArticuloNormativaUpdate(BaseModel):
    """Schema para actualizar un artículo de normativa"""
    numero_articulo: Optional[str] = Field(None, min_length=1, max_length=20)
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    contenido: Optional[str] = Field(None, min_length=1)
    tipo: Optional[TipoArticulo] = None
    orden_display: Optional[int] = Field(None, ge=0)
    activo: Optional[bool] = None

class ArticuloNormativaResponse(ArticuloNormativaBase):
    """Schema para respuesta de artículo de normativa"""
    id: int
    vigencia_desde: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArticuloNormativaCompleto(ArticuloNormativaResponse):
    """Schema para artículo de normativa con sus causales asociadas"""
    causales: List["CausalMultaResponse"] = []

    class Config:
        from_attributes = True

# Importar aquí para evitar circular imports
from .multas import CausalMultaResponse
ArticuloNormativaCompleto.model_rebuild()
