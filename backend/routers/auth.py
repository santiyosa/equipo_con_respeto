from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.admin import LoginRequest
from crud import admin as crud_admin
from crud import jugadores as crud_jugadores
import hashlib

router = APIRouter()

@router.post("/auth/login")
def login_unificado(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login unificado para administradores y jugadores"""
    
    # Primero intentar como administrador
    admin = crud_admin.get_admin_by_email(db, credentials.email)
    if admin and crud_admin.verificar_credenciales(db, credentials.email, credentials.password):
        return {
            "id": admin.id,
            "nombre": str(admin.nombre),
            "email": str(admin.email),
            "rol": "admin",
            "tipo_usuario": "administrador"
        }
    
    # Luego intentar como jugador
    jugador = crud_jugadores.get_jugador_by_email(db, credentials.email)
    if jugador and crud_jugadores.verificar_credenciales_jugador(db, credentials.email, credentials.password):
        return {
            "id": str(jugador.cedula),
            "nombre": str(jugador.nombre),
            "email": str(jugador.email),
            "rol": "jugador",
            "tipo_usuario": "jugador",
            "cedula": str(jugador.cedula)
        }
    
    # Si no es ni admin ni jugador
    raise HTTPException(
        status_code=401,
        detail="Credenciales incorrectas"
    )
