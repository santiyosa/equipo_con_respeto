from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import multas as schemas
from crud import multas as crud
import models

router = APIRouter()

@router.get("/multas/", response_model=List[schemas.Multa])
def listar_todas_multas(
    incluir_pagadas: bool = False,  # Por defecto solo multas pendientes
    db: Session = Depends(get_db)
):
    """Lista todas las multas del sistema. Por defecto solo multas pendientes."""
    return crud.get_todas_multas(db, incluir_pagadas)

@router.get("/multas/completas/")
def listar_multas_completas(
    incluir_pagadas: bool = False,  # Por defecto solo multas pendientes
    db: Session = Depends(get_db)
):
    """Lista todas las multas con información completa (jugador y causal). Por defecto solo multas pendientes."""
    return crud.get_multas_completas(db, incluir_pagadas)

@router.post("/multas/", response_model=schemas.Multa)
def crear_multa(
    multa: schemas.MultaCreate,
    admin_id: int = 1,  # TODO: Obtener del token de autenticación
    db: Session = Depends(get_db)
):
    """Registra una nueva multa a un jugador"""
    try:
        return crud.crear_multa(db, multa, admin_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# NUEVOS ENDPOINTS PARA APORTES GRUPALES
@router.post("/aportes-grupales/", response_model=schemas.AporteGrupalResponse)
def crear_aporte_grupal(
    aporte: schemas.AporteGrupalCreate,
    admin_id: int = 1,  # TODO: Obtener del token de autenticación  
    db: Session = Depends(get_db)
):
    """Crea un aporte grupal asignándolo a todos los jugadores activos"""
    try:
        return crud.crear_aporte_grupal(db, aporte, admin_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/aportes-grupales/", response_model=List[schemas.AporteGrupalResumen])
def listar_aportes_grupales(db: Session = Depends(get_db)):
    """Lista todos los aportes grupales con resumen de pagos"""
    return crud.get_aportes_grupales(db)

@router.get("/aportes-grupales/{grupo_multa_id}/detalle", response_model=List[schemas.AporteGrupalDetalle])
def obtener_detalle_aporte_grupal(
    grupo_multa_id: str,
    db: Session = Depends(get_db)
):
    """Obtiene el detalle de pagos de un aporte grupal específico"""
    detalle = crud.get_detalle_aporte_grupal(db, grupo_multa_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Aporte grupal no encontrado")
    return detalle

@router.put("/multas/{multa_id}", response_model=schemas.Multa)
def actualizar_multa(
    multa_id: int,
    multa: schemas.MultaUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza una multa existente con validaciones avanzadas"""
    try:
        db_multa = crud.get_multa(db, multa_id)
        if not db_multa:
            raise HTTPException(status_code=404, detail="Multa no encontrada")
        
        return crud.actualizar_multa(db, multa_id, multa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.delete("/multas/{multa_id}")
def eliminar_multa(
    multa_id: int,
    db: Session = Depends(get_db)
):
    """Elimina una multa"""
    db_multa = crud.get_multa(db, multa_id)
    if not db_multa:
        raise HTTPException(status_code=404, detail="Multa no encontrada")
    crud.eliminar_multa(db, multa_id)
    return {"message": "Multa eliminada exitosamente"}

@router.get("/multas/jugador/{cedula}", response_model=List[schemas.MultaCompleta])
def listar_multas_jugador(
    cedula: str,
    incluir_pagadas: bool = False,
    db: Session = Depends(get_db)
):
    """Lista todas las multas de un jugador por cédula"""
    return crud.get_multas_jugador(db, cedula, incluir_pagadas)

@router.get("/multas/causales/", response_model=List[schemas.CausalMultaResponse])
def listar_causales_multa(db: Session = Depends(get_db)):
    """Lista todas las causales de multa disponibles"""
    return crud.get_causales_multa(db)

@router.post("/multas/causales/", response_model=schemas.CausalMultaResponse)
def crear_causal_multa(
    causal: schemas.CausalMultaCreate,
    db: Session = Depends(get_db)
):
    """Crea una nueva causal de multa"""
    return crud.crear_causal_multa(db, causal)

@router.put("/multas/causales/{causal_id}", response_model=schemas.CausalMultaResponse)
def actualizar_causal_multa(
    causal_id: int,
    causal: schemas.CausalMultaUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza una causal de multa existente"""
    try:
        db_causal = crud.get_causal_multa(db, causal_id)
        if not db_causal:
            raise HTTPException(status_code=404, detail="Causal de multa no encontrada")
        
        return crud.actualizar_causal_multa(db, causal_id, causal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/multas/causales/{causal_id}")
def eliminar_causal_multa(
    causal_id: int,
    db: Session = Depends(get_db)
):
    """Elimina una causal de multa"""
    try:
        db_causal = crud.get_causal_multa(db, causal_id)
        if not db_causal:
            raise HTTPException(status_code=404, detail="Causal de multa no encontrada")
        
        # Verificar si la causal está siendo usada
        multas_con_causal = db.query(models.Multa).filter(models.Multa.causal_id == causal_id).count()
        if multas_con_causal > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la causal porque está siendo usada en {multas_con_causal} multa(s)"
            )
        
        crud.eliminar_causal_multa(db, causal_id)
        return {"message": "Causal eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
