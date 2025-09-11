from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import hashlib
import secrets
import datetime
from database import get_db
from schemas import admin as schemas
from crud import admin as crud
from services.email_service import email_service

router = APIRouter()

@router.post("/admin/", response_model=schemas.Administrador)
def crear_admin(
    admin: schemas.AdministradorCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuevo administrador"""
    db_admin = crud.get_admin_by_email(db, admin.email)
    if db_admin:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    return crud.crear_admin(db, admin)

@router.post("/admin/login")
def login_admin(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Verifica las credenciales de un administrador"""
    if not crud.verificar_credenciales(db, credentials.email, credentials.password):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )
    admin = crud.get_admin_by_email(db, credentials.email)
    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )
    return {
        "id": admin.id,
        "nombre": admin.nombre,
        "email": admin.email,
        "rol": admin.rol
    }

@router.post("/admin/recuperar-password")
def solicitar_recuperacion_password(request: schemas.RecuperarPasswordRequest, db: Session = Depends(get_db)):
    """Solicita recuperación de contraseña"""
    admin = crud.get_admin_by_email(db, request.email)
    if not admin:
        # Por seguridad, no revelamos si el email existe o no
        return {"message": "Si el email existe, recibirás un enlace de recuperación"}
    
    # Limpiar tokens expirados primero
    crud.limpiar_tokens_expirados(db)
    
    # Crear token de recuperación real
    token = crud.crear_token_recuperacion(db, request.email)
    
    if not token:
        raise HTTPException(
            status_code=500,
            detail="Error creando token de recuperación"
        )
    
    # Enviar email de recuperación
    email_sent = email_service.send_password_reset_email(
        to_email=request.email,
        token=token,
        recipient_name=str(admin.nombre)
    )
    
    if not email_sent:
        print(f"⚠️ Warning: No se pudo enviar email a {request.email}")
    
    return {"message": "Si el email existe, recibirás un enlace de recuperación"}

@router.post("/admin/reset-password")
def resetear_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resetea la contraseña usando el token"""
    
    # Validar el token
    if not crud.validar_token_recuperacion(db, request.email, request.token):
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )
    
    admin = crud.get_admin_by_email(db, request.email)
    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )
    
    # Actualizar contraseña usando CRUD
    success = crud.actualizar_password(db, request.email, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Error actualizando contraseña"
        )
    
    # Marcar token como usado
    crud.marcar_token_como_usado(db, request.email, request.token)
    
    print(f"✅ Contraseña actualizada exitosamente para: {request.email}")
    
    return {"message": "Contraseña actualizada exitosamente"}

@router.get("/admin/email-config")
def verificar_configuracion_email():
    """Verifica si la configuración de email está funcionando"""
    is_configured = email_service.test_email_config()
    
    return {
        "email_configured": is_configured,
        "smtp_server": email_service.smtp_server,
        "smtp_port": email_service.smtp_port,
        "sender_email": email_service.sender_email if email_service.sender_email else "No configurado",
        "message": "Email configurado correctamente" if is_configured else "Configuración de email pendiente"
    }
