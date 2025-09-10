from sqlalchemy.orm import Session
import models
from schemas import admin as schemas
from typing import List
import hashlib

def get_admin(db: Session, admin_id: int):
    return db.query(models.Administrador).filter(models.Administrador.id == admin_id).first()

def get_admin_by_email(db: Session, email: str):
    return db.query(models.Administrador).filter(models.Administrador.email == email).first()

def get_admins(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Administrador).offset(skip).limit(limit).all()

def crear_admin(db: Session, admin: schemas.AdministradorCreate):
    # Hash de la contraseña antes de guardarla
    hashed_password = hashlib.sha256(admin.password.encode()).hexdigest()
    
    db_admin = models.Administrador(
        nombre=admin.nombre,
        email=admin.email,
        password=hashed_password,
        rol=admin.rol
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

def verificar_credenciales(db: Session, email: str, password: str) -> bool:
    admin = get_admin_by_email(db, email)
    if not admin:
        return False
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    return str(admin.password) == hashed_password  # Convertir a str para comparación segura
