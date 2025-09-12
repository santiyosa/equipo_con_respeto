from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import crud.articulos_normativa as crud
import schemas.articulos_normativa as schemas
from database import get_db

router = APIRouter(
    prefix="/articulos-normativa",
    tags=["Gestión de Normativa"]
)

@router.get("/", response_model=List[schemas.ArticuloNormativaResponse])
def listar_articulos(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a retornar"),
    solo_activos: bool = Query(True, description="Solo artículos activos"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: 'informativo' o 'sancionable'"),
    buscar: Optional[str] = Query(None, description="Buscar en número, título o contenido"),
    db: Session = Depends(get_db)
):
    """Obtiene lista de artículos de normativa con filtros opcionales"""
    if tipo and tipo not in ["informativo", "sancionable"]:
        raise HTTPException(status_code=400, detail="Tipo debe ser 'informativo' o 'sancionable'")
    
    articulos = crud.get_articulos(
        db=db, 
        skip=skip, 
        limit=limit,
        solo_activos=solo_activos,
        tipo=tipo,
        buscar=buscar
    )
    return articulos

@router.get("/sancionables", response_model=List[schemas.ArticuloNormativaResponse])
def listar_articulos_sancionables(
    solo_activos: bool = Query(True, description="Solo artículos activos"),
    db: Session = Depends(get_db)
):
    """Obtiene solo los artículos sancionables (para vincular con causales)"""
    return crud.get_articulos_sancionables(db=db, solo_activos=solo_activos)

@router.get("/count")
def contar_articulos(
    solo_activos: bool = Query(True, description="Solo artículos activos"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    db: Session = Depends(get_db)
):
    """Obtiene el conteo total de artículos con filtros"""
    if tipo and tipo not in ["informativo", "sancionable"]:
        raise HTTPException(status_code=400, detail="Tipo debe ser 'informativo' o 'sancionable'")
    
    count = crud.get_count_articulos(db=db, solo_activos=solo_activos, tipo=tipo)
    return {"total": count}

@router.get("/{articulo_id}", response_model=schemas.ArticuloNormativaCompleto)
def obtener_articulo(
    articulo_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene un artículo de normativa por su ID, incluyendo causales asociadas"""
    articulo = crud.get_articulo(db=db, articulo_id=articulo_id)
    if not articulo:
        raise HTTPException(status_code=404, detail="Artículo de normativa no encontrado")
    return articulo

@router.post("/", response_model=schemas.ArticuloNormativaResponse, status_code=201)
def crear_articulo(
    articulo: schemas.ArticuloNormativaCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuevo artículo de normativa"""
    # Verificar que el número de artículo no exista
    existing_articulo = crud.get_articulo_by_numero(db=db, numero_articulo=articulo.numero_articulo)
    if existing_articulo:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe un artículo con el número '{articulo.numero_articulo}'"
        )
    
    return crud.create_articulo(db=db, articulo=articulo)

@router.put("/{articulo_id}", response_model=schemas.ArticuloNormativaResponse)
def actualizar_articulo(
    articulo_id: int,
    articulo_update: schemas.ArticuloNormativaUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un artículo de normativa existente"""
    # Verificar que el artículo existe
    existing_articulo = crud.get_articulo(db=db, articulo_id=articulo_id)
    if not existing_articulo:
        raise HTTPException(status_code=404, detail="Artículo de normativa no encontrado")
    
    # Si se está actualizando el número de artículo, verificar que no exista
    if articulo_update.numero_articulo and articulo_update.numero_articulo != existing_articulo.numero_articulo:
        duplicate_articulo = crud.get_articulo_by_numero(db=db, numero_articulo=articulo_update.numero_articulo)
        if duplicate_articulo:
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un artículo con el número '{articulo_update.numero_articulo}'"
            )
    
    updated_articulo = crud.update_articulo(db=db, articulo_id=articulo_id, articulo_update=articulo_update)
    if not updated_articulo:
        raise HTTPException(status_code=500, detail="Error al actualizar el artículo")
    
    return updated_articulo

@router.delete("/{articulo_id}")
def eliminar_articulo(
    articulo_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un artículo de normativa (soft delete si tiene causales asociadas)"""
    success = crud.delete_articulo(db=db, articulo_id=articulo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Artículo de normativa no encontrado")
    
    return {"message": "Artículo eliminado exitosamente"}

@router.post("/reordenar")
def reordenar_articulos(
    reordenes: List[dict],
    db: Session = Depends(get_db)
):
    """
    Reordena múltiples artículos
    Body: [{"id": 1, "orden_display": 1}, {"id": 2, "orden_display": 2}, ...]
    """
    # Validar formato de entrada
    for reorden in reordenes:
        if "id" not in reorden or "orden_display" not in reorden:
            raise HTTPException(
                status_code=400, 
                detail="Cada elemento debe tener 'id' y 'orden_display'"
            )
        if not isinstance(reorden["id"], int) or not isinstance(reorden["orden_display"], int):
            raise HTTPException(
                status_code=400, 
                detail="'id' y 'orden_display' deben ser números enteros"
            )
    
    success = crud.reordenar_articulos(db=db, reordenes=reordenes)
    if not success:
        raise HTTPException(status_code=500, detail="Error al reordenar artículos")
    
    return {"message": "Artículos reordenados exitosamente"}

@router.post("/{articulo_id}/duplicar", response_model=schemas.ArticuloNormativaResponse)
def duplicar_articulo(
    articulo_id: int,
    nuevo_numero: str = Query(..., description="Número para el artículo duplicado"),
    db: Session = Depends(get_db)
):
    """Duplica un artículo existente con un nuevo número"""
    duplicado = crud.duplicar_articulo(db=db, articulo_id=articulo_id, nuevo_numero=nuevo_numero)
    if not duplicado:
        raise HTTPException(
            status_code=400, 
            detail="No se pudo duplicar el artículo. Verifique que existe y que el nuevo número no esté en uso."
        )
    
    return duplicado
