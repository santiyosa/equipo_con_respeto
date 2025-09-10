from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import admin as schemas
from crud import admin as crud

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
def login_admin(email: str, password: str, db: Session = Depends(get_db)):
    """Verifica las credenciales de un administrador"""
    if not crud.verificar_credenciales(db, email, password):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )
    admin = crud.get_admin_by_email(db, email)
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
