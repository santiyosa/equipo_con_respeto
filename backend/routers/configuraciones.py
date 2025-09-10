from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from crud import configuraciones as crud_configuraciones
from schemas.configuraciones import Configuracion, ConfiguracionCreate, ConfiguracionUpdate

router = APIRouter()

@router.get("/", response_model=List[Configuracion])
def get_configuraciones(db: Session = Depends(get_db)):
    """Obtener todas las configuraciones del sistema"""
    return crud_configuraciones.get_configuraciones(db)

@router.get("/{clave}", response_model=Configuracion)
def get_configuracion(clave: str, db: Session = Depends(get_db)):
    """Obtener una configuración específica por su clave"""
    configuracion = crud_configuraciones.get_configuracion_by_clave(db, clave)
    if not configuracion:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return configuracion

@router.post("/", response_model=Configuracion)
def create_configuracion(configuracion: ConfiguracionCreate, db: Session = Depends(get_db)):
    """Crear una nueva configuración"""
    # Verificar que no exista ya una configuración con esa clave
    existing = crud_configuraciones.get_configuracion_by_clave(db, configuracion.clave)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una configuración con esa clave")
    
    return crud_configuraciones.create_configuracion(db, configuracion)

@router.put("/{clave}", response_model=Configuracion)
def update_configuracion(clave: str, configuracion: ConfiguracionUpdate, db: Session = Depends(get_db)):
    """Actualizar una configuración existente"""
    db_configuracion = crud_configuraciones.update_configuracion(db, clave, configuracion)
    if not db_configuracion:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return db_configuracion

@router.delete("/{clave}")
def delete_configuracion(clave: str, db: Session = Depends(get_db)):
    """Eliminar una configuración"""
    db_configuracion = crud_configuraciones.delete_configuracion(db, clave)
    if not db_configuracion:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return {"message": "Configuración eliminada exitosamente"}
