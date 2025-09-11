from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from crud.admin import get_admin_by_email
from crud.jugadores import get_jugador_by_email

class CurrentUser:
    def __init__(self, id: str, email: str, nombre: str, rol: str, cedula: Optional[str] = None):
        self.id = id
        self.email = email
        self.nombre = nombre
        self.rol = rol  # 'admin' o 'jugador'
        self.cedula = cedula

# Para implementación futura con JWT
# Por ahora, usamos un sistema simple de verificación por parámetros

def get_current_user_simple(
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Optional[CurrentUser]:
    """
    Función auxiliar para verificar usuario (implementación simple)
    En el futuro se puede expandir para usar JWT tokens
    """
    if not user_email or not user_role:
        return None
        
    try:
        if user_role == "admin":
            user = get_admin_by_email(db, user_email)
            if user:
                return CurrentUser(
                    id=str(user.id),
                    email=str(user.email),
                    nombre=str(user.nombre),
                    rol="admin"
                )
        elif user_role == "jugador":
            user = get_jugador_by_email(db, user_email)
            if user:
                return CurrentUser(
                    id=str(user.cedula),
                    email=str(user.email),
                    nombre=str(user.nombre),
                    rol="jugador",
                    cedula=str(user.cedula)
                )
    except Exception:
        pass
    
    return None

def require_admin_simple(current_user: Optional[CurrentUser]) -> bool:
    """
    Verifica si el usuario actual es admin
    """
    return current_user is not None and current_user.rol == "admin"

def can_access_jugador_data(current_user: Optional[CurrentUser], jugador_cedula: str) -> bool:
    """
    Verifica si el usuario puede acceder a los datos del jugador específico
    - Admin: puede acceder a cualquier jugador
    - Jugador: solo puede acceder a sus propios datos
    """
    if not current_user:
        return False
        
    if current_user.rol == "admin":
        return True
    elif current_user.rol == "jugador":
        return current_user.cedula == jugador_cedula
    
    return False
