from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from models import Configuracion
from schemas.configuraciones import ConfiguracionCreate, ConfiguracionUpdate

def get_configuraciones(db: Session):
    """Obtener todas las configuraciones"""
    return db.query(Configuracion).order_by(Configuracion.clave).all()

def get_configuracion_by_clave(db: Session, clave: str):
    """Obtener una configuración por su clave"""
    return db.query(Configuracion).filter(Configuracion.clave == clave).first()

def create_configuracion(db: Session, configuracion: ConfiguracionCreate, admin_id: Optional[int] = None):
    """Crear una nueva configuración"""
    db_configuracion = Configuracion(
        clave=configuracion.clave,
        valor=configuracion.valor,
        descripcion=configuracion.descripcion,
        actualizado_por=admin_id
    )
    db.add(db_configuracion)
    db.commit()
    db.refresh(db_configuracion)
    return db_configuracion

def update_configuracion(db: Session, clave: str, configuracion: ConfiguracionUpdate, admin_id: Optional[int] = None):
    """Actualizar una configuración existente"""
    db_configuracion = get_configuracion_by_clave(db, clave)
    if db_configuracion:
        for key, value in configuracion.model_dump(exclude_unset=True).items():
            setattr(db_configuracion, key, value)
        if admin_id is not None:
            setattr(db_configuracion, 'actualizado_por', admin_id)
        db.commit()
        db.refresh(db_configuracion)
    return db_configuracion

def delete_configuracion(db: Session, clave: str):
    """Eliminar una configuración"""
    db_configuracion = get_configuracion_by_clave(db, clave)
    if db_configuracion:
        db.delete(db_configuracion)
        db.commit()
    return db_configuracion
