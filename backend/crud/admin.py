from sqlalchemy.orm import Session
import models
from schemas import admin as schemas
from typing import List
import hashlib
import secrets
import datetime

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

def actualizar_password(db: Session, email: str, nueva_password: str) -> bool:
    """Actualiza la contraseña de un administrador"""
    try:
        admin = get_admin_by_email(db, email)
        if not admin:
            return False
        
        # Hash de la nueva contraseña
        nueva_password_hash = hashlib.sha256(nueva_password.encode()).hexdigest()
        
        # Actualizar en la base de datos
        db.query(models.Administrador).filter(
            models.Administrador.email == email
        ).update({"password": nueva_password_hash})
        
        db.commit()
        return True
    
    except Exception as e:
        db.rollback()
        print(f"Error actualizando contraseña: {e}")
        return False

def crear_token_recuperacion(db: Session, email: str) -> str | None:
    """Crea un token de recuperación para el email dado"""
    try:
        # Generar token único
        token = secrets.token_urlsafe(32)
        
        # Limpiar tokens antiguos del mismo email
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.email == email
        ).delete()
        
        # Crear nuevo token (válido por 1 hora)
        expires_at = datetime.datetime.now() + datetime.timedelta(hours=1)
        
        nuevo_token = models.PasswordResetToken(
            email=email,
            token=token,
            expires_at=expires_at
        )
        
        db.add(nuevo_token)
        db.commit()
        
        return token
    
    except Exception as e:
        db.rollback()
        print(f"Error creando token: {e}")
        return None

def validar_token_recuperacion(db: Session, email: str, token: str) -> bool:
    """Valida si un token de recuperación es válido"""
    try:
        token_record = db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.email == email,
            models.PasswordResetToken.token == token,
            models.PasswordResetToken.used == False,
            models.PasswordResetToken.expires_at > datetime.datetime.now()
        ).first()
        
        return token_record is not None
    
    except Exception as e:
        print(f"Error validando token: {e}")
        return False

def marcar_token_como_usado(db: Session, email: str, token: str) -> bool:
    """Marca un token como usado para que no se pueda reutilizar"""
    try:
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.email == email,
            models.PasswordResetToken.token == token
        ).update({"used": True})
        
        db.commit()
        return True
    
    except Exception as e:
        db.rollback()
        print(f"Error marcando token como usado: {e}")
        return False

def limpiar_tokens_expirados(db: Session):
    """Limpia tokens expirados de la base de datos"""
    try:
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.expires_at < datetime.datetime.now()
        ).delete()
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error limpiando tokens expirados: {e}")
