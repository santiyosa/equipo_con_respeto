from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from datetime import datetime
from database import get_db
from schemas import egresos as schemas
from crud import egresos as crud

router = APIRouter()

@router.post("/egresos/", response_model=schemas.Egreso)
def crear_egreso(
    egreso: schemas.EgresoCreate,
    db: Session = Depends(get_db)
):
    """Registra un nuevo egreso"""
    try:
        return crud.crear_egreso(db, egreso, egreso.registrado_por)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/egresos/{egreso_id}")
def eliminar_egreso(
    egreso_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un egreso específico"""
    try:
        return crud.eliminar_egreso(db, egreso_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/egresos/", response_model=List[schemas.Egreso])
def listar_egresos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todos los egresos ordenados por fecha"""
    return crud.get_egresos(db, skip=skip, limit=limit)

@router.get("/egresos/categorias/", response_model=List[schemas.CategoriaEgreso])
def listar_categorias_egreso(db: Session = Depends(get_db)):
    """Lista todas las categorías de egreso disponibles"""
    return crud.get_categorias_egreso(db)

@router.post("/egresos/categorias/", response_model=schemas.CategoriaEgreso)
def crear_categoria_egreso(
    categoria: schemas.CategoriaEgresoCreate,
    db: Session = Depends(get_db)
):
    """Crea una nueva categoría de egreso"""
    try:
        return crud.crear_categoria_egreso(db, categoria)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/egresos/categorias/{categoria_id}", response_model=schemas.CategoriaEgreso)
def obtener_categoria_egreso(
    categoria_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene una categoría específica por ID"""
    categoria = crud.get_categoria_egreso(db, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria

@router.put("/egresos/categorias/{categoria_id}", response_model=schemas.CategoriaEgreso)
def actualizar_categoria_egreso(
    categoria_id: int,
    categoria: schemas.CategoriaEgresoCreate,
    db: Session = Depends(get_db)
):
    """Actualiza una categoría de egreso existente"""
    try:
        return crud.actualizar_categoria_egreso(db, categoria_id, categoria)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/egresos/categorias/{categoria_id}")
def eliminar_categoria_egreso(
    categoria_id: int,
    db: Session = Depends(get_db)
):
    """Elimina una categoría de egreso"""
    try:
        return crud.eliminar_categoria_egreso(db, categoria_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/egresos/resumen/", response_model=List[schemas.ResumenCategoria])
def obtener_resumen_egresos(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Obtiene un resumen de egresos agrupados por categoría"""
    resumen_categorias, _ = crud.get_resumen_egresos(db, fecha_inicio, fecha_fin)
    return resumen_categorias
