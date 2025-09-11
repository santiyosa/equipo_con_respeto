from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.admin import RecuperarPasswordRequest, ResetPasswordRequest
from crud import jugadores as crud_jugadores
from services.email_service import email_service
import secrets
import datetime

router = APIRouter()

@router.post("/jugadores/recuperar-password")
def solicitar_recuperacion_password_jugador(request: RecuperarPasswordRequest, db: Session = Depends(get_db)):
    """Solicita recuperación de contraseña para jugador"""
    jugador = crud_jugadores.get_jugador_by_email(db, request.email)
    if not jugador:
        # Por seguridad, no revelamos si el email existe o no
        return {"message": "Si el email existe, recibirás un enlace de recuperación"}
    
    # Crear token de recuperación (reutilizamos la lógica de admin)
    from crud import admin as crud_admin
    crud_admin.limpiar_tokens_expirados(db)
    
    token = crud_admin.crear_token_recuperacion(db, request.email)
    
    if not token:
        raise HTTPException(
            status_code=500,
            detail="Error creando token de recuperación"
        )
    
    # Enviar email de recuperación
    email_sent = email_service.send_password_reset_email(
        to_email=request.email,
        token=token,
        recipient_name=str(jugador.nombre)
    )
    
    if not email_sent:
        print(f"⚠️ Warning: No se pudo enviar email a {request.email}")
    
    return {"message": "Si el email existe, recibirás un enlace de recuperación"}

@router.post("/jugadores/reset-password")
def resetear_password_jugador(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resetea la contraseña de un jugador usando el token"""
    
    # Validar el token (reutilizamos la lógica de admin)
    from crud import admin as crud_admin
    if not crud_admin.validar_token_recuperacion(db, request.email, request.token):
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )
    
    jugador = crud_jugadores.get_jugador_by_email(db, request.email)
    if not jugador:
        raise HTTPException(
            status_code=404,
            detail="Jugador no encontrado"
        )
    
    # Actualizar contraseña del jugador
    success = crud_jugadores.actualizar_credenciales_jugador(
        db, 
        str(jugador.cedula), 
        request.email, 
        request.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Error actualizando contraseña"
        )
    
    # Marcar token como usado
    crud_admin.marcar_token_como_usado(db, request.email, request.token)
    
    print(f"✅ Contraseña de jugador actualizada: {request.email}")
    
    return {"message": "Contraseña actualizada exitosamente"}
