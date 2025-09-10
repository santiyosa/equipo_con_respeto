from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ..database import get_db
from . import crud, schemas

router = APIRouter()

@router.post("/inscripciones/", response_model=schemas.Inscripcion, tags=["inscripciones"])
def crear_inscripcion(
    inscripcion: schemas.InscripcionCreate,
    db: Session = Depends(get_db)
):
    """
    Crea una nueva inscripción para un partido.
    """
    return crud.crear_inscripcion(db, inscripcion)

@router.get("/inscripciones/nomina/{fecha}", response_model=schemas.ReporteNomina, tags=["inscripciones"])
def obtener_nomina(
    fecha: date,
    db: Session = Depends(get_db)
):
    """
    Obtiene el reporte de nómina para una fecha específica.
    """
    reporte = crud.generar_reporte_nomina(db, fecha)
    if not reporte:
        raise HTTPException(status_code=404, detail="No hay inscripciones para esta fecha")
    return reporte
