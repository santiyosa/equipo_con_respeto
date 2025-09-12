from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
import models
import schemas.articulos_normativa as schemas
from datetime import datetime

def get_articulo(db: Session, articulo_id: int) -> Optional[models.ArticuloNormativa]:
    """Obtiene un artículo de normativa por su ID"""
    return db.query(models.ArticuloNormativa).filter(models.ArticuloNormativa.id == articulo_id).first()

def get_articulo_by_numero(db: Session, numero_articulo: str) -> Optional[models.ArticuloNormativa]:
    """Obtiene un artículo de normativa por su número"""
    return db.query(models.ArticuloNormativa).filter(models.ArticuloNormativa.numero_articulo == numero_articulo).first()

def get_articulos(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    solo_activos: bool = True,
    tipo: Optional[str] = None,
    buscar: Optional[str] = None
) -> List[models.ArticuloNormativa]:
    """Obtiene lista de artículos de normativa con filtros opcionales"""
    query = db.query(models.ArticuloNormativa)
    
    # Filtro por estado activo
    if solo_activos:
        query = query.filter(models.ArticuloNormativa.activo == True)
    
    # Filtro por tipo
    if tipo:
        query = query.filter(models.ArticuloNormativa.tipo == tipo)
    
    # Filtro de búsqueda en número, título o contenido
    if buscar:
        buscar_pattern = f"%{buscar}%"
        query = query.filter(
            or_(
                models.ArticuloNormativa.numero_articulo.ilike(buscar_pattern),
                models.ArticuloNormativa.titulo.ilike(buscar_pattern),
                models.ArticuloNormativa.contenido.ilike(buscar_pattern)
            )
        )
    
    # Ordenar por orden_display y luego por numero_articulo
    query = query.order_by(
        asc(models.ArticuloNormativa.orden_display),
        asc(models.ArticuloNormativa.numero_articulo)
    )
    
    return query.offset(skip).limit(limit).all()

def get_articulos_sancionables(db: Session, solo_activos: bool = True) -> List[models.ArticuloNormativa]:
    """Obtiene solo artículos sancionables (que pueden tener causales)"""
    query = db.query(models.ArticuloNormativa).filter(models.ArticuloNormativa.tipo == "sancionable")
    
    if solo_activos:
        query = query.filter(models.ArticuloNormativa.activo == True)
    
    return query.order_by(
        asc(models.ArticuloNormativa.orden_display),
        asc(models.ArticuloNormativa.numero_articulo)
    ).all()

def create_articulo(db: Session, articulo: schemas.ArticuloNormativaCreate) -> models.ArticuloNormativa:
    """Crea un nuevo artículo de normativa"""
    db_articulo = models.ArticuloNormativa(**articulo.dict())
    db.add(db_articulo)
    db.commit()
    db.refresh(db_articulo)
    return db_articulo

def update_articulo(
    db: Session, 
    articulo_id: int, 
    articulo_update: schemas.ArticuloNormativaUpdate
) -> Optional[models.ArticuloNormativa]:
    """Actualiza un artículo de normativa existente"""
    db_articulo = get_articulo(db, articulo_id)
    if not db_articulo:
        return None
    
    # Obtener solo los campos que se están actualizando
    update_data = articulo_update.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(db_articulo, field, value)
    
    # Actualizar timestamp usando update query
    db.query(models.ArticuloNormativa).filter(
        models.ArticuloNormativa.id == articulo_id
    ).update({"updated_at": datetime.now()})
    
    db.commit()
    db.refresh(db_articulo)
    return db_articulo

def delete_articulo(db: Session, articulo_id: int) -> bool:
    """Elimina un artículo de normativa (soft delete - marca como inactivo)"""
    db_articulo = get_articulo(db, articulo_id)
    if not db_articulo:
        return False
    
    # Verificar si tiene causales asociadas
    causales_count = db.query(models.CausalMulta).filter(
        models.CausalMulta.articulo_id == articulo_id
    ).count()
    
    if causales_count > 0:
        # Solo marcar como inactivo si tiene causales asociadas usando update query
        db.query(models.ArticuloNormativa).filter(
            models.ArticuloNormativa.id == articulo_id
        ).update({
            "activo": False,
            "updated_at": datetime.now()
        })
        db.commit()
        return True
    else:
        # Eliminar físicamente si no tiene causales asociadas
        db.delete(db_articulo)
        db.commit()
        return True

def get_count_articulos(db: Session, solo_activos: bool = True, tipo: Optional[str] = None) -> int:
    """Obtiene el conteo total de artículos con filtros"""
    query = db.query(models.ArticuloNormativa)
    
    if solo_activos:
        query = query.filter(models.ArticuloNormativa.activo == True)
    
    if tipo:
        query = query.filter(models.ArticuloNormativa.tipo == tipo)
    
    return query.count()

def reordenar_articulos(db: Session, reordenes: List[dict]) -> bool:
    """
    Reordena múltiples artículos
    reordenes: [{"id": 1, "orden_display": 1}, {"id": 2, "orden_display": 2}, ...]
    """
    try:
        for reorden in reordenes:
            db.query(models.ArticuloNormativa).filter(
                models.ArticuloNormativa.id == reorden["id"]
            ).update({
                "orden_display": reorden["orden_display"],
                "updated_at": datetime.now()
            })
        
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False

def duplicar_articulo(db: Session, articulo_id: int, nuevo_numero: str) -> Optional[models.ArticuloNormativa]:
    """Duplica un artículo existente con un nuevo número"""
    original = get_articulo(db, articulo_id)
    if not original:
        return None
    
    # Verificar que el nuevo número no exista
    if get_articulo_by_numero(db, nuevo_numero):
        return None
    
    # Crear copia
    duplicado = models.ArticuloNormativa(
        numero_articulo=nuevo_numero,
        titulo=f"[COPIA] {original.titulo}",
        contenido=original.contenido,
        tipo=original.tipo,
        orden_display=original.orden_display + 1,
        activo=True
    )
    
    db.add(duplicado)
    db.commit()
    db.refresh(duplicado)
    return duplicado
