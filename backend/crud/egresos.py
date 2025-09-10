from sqlalchemy.orm import Session
import models
from schemas import egresos as schemas
from typing import List, Optional
from datetime import datetime

def get_egreso(db: Session, egreso_id: int):
    return db.query(models.Egreso).filter(models.Egreso.id == egreso_id).first()

def get_egresos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Egreso).order_by(models.Egreso.fecha.desc()).offset(skip).limit(limit).all()

def crear_egreso(db: Session, egreso: schemas.EgresoCreate, admin_id: int):
    # Verificar que existe la categoría
    categoria = db.query(models.CategoriaEgreso).filter(
        models.CategoriaEgreso.id == egreso.categoria_id
    ).first()
    if not categoria:
        raise ValueError("Categoría de egreso no encontrada")

    # Usar el registrado_por del esquema o el admin_id pasado como parámetro
    egreso_data = egreso.dict()
    registrado_por = egreso_data.pop('registrado_por', admin_id)
    
    # Si se envió una fecha, convertirla a datetime, sino usar la actual
    if egreso.fecha:
        # Convertir date a datetime con hora actual
        from datetime import datetime, time
        fecha_egreso = datetime.combine(egreso.fecha, time())
        egreso_data['fecha'] = fecha_egreso
    else:
        # Si no se especifica fecha, se usará el default del modelo
        egreso_data.pop('fecha', None)

    db_egreso = models.Egreso(
        **egreso_data,
        registrado_por=registrado_por
    )
    db.add(db_egreso)
    db.commit()
    db.refresh(db_egreso)
    return db_egreso

def eliminar_egreso(db: Session, egreso_id: int):
    # Verificar que existe el egreso
    db_egreso = get_egreso(db, egreso_id)
    if not db_egreso:
        raise ValueError("Egreso no encontrado")
    
    # Guardar información del egreso antes de eliminarlo
    concepto = db_egreso.concepto
    valor = db_egreso.valor
    
    db.delete(db_egreso)
    db.commit()
    return {"message": f"Egreso '{concepto}' por valor ${valor:,.0f} eliminado exitosamente"}

def get_categorias_egreso(db: Session):
    return db.query(models.CategoriaEgreso).all()

def crear_categoria_egreso(db: Session, categoria: schemas.CategoriaEgresoCreate):
    # Verificar si ya existe una categoría con ese nombre
    categoria_existente = db.query(models.CategoriaEgreso).filter(
        models.CategoriaEgreso.nombre == categoria.nombre
    ).first()
    
    if categoria_existente:
        raise ValueError(f"Ya existe una categoría con el nombre '{categoria.nombre}'")
    
    db_categoria = models.CategoriaEgreso(**categoria.dict())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def get_categoria_egreso(db: Session, categoria_id: int):
    return db.query(models.CategoriaEgreso).filter(models.CategoriaEgreso.id == categoria_id).first()

def actualizar_categoria_egreso(db: Session, categoria_id: int, categoria: schemas.CategoriaEgresoCreate):
    # Verificar que existe la categoría
    db_categoria = get_categoria_egreso(db, categoria_id)
    if not db_categoria:
        raise ValueError("Categoría no encontrada")
    
    # Verificar si ya existe otra categoría con ese nombre
    categoria_existente = db.query(models.CategoriaEgreso).filter(
        models.CategoriaEgreso.nombre == categoria.nombre,
        models.CategoriaEgreso.id != categoria_id
    ).first()
    
    if categoria_existente:
        raise ValueError(f"Ya existe otra categoría con el nombre '{categoria.nombre}'")
    
    # Actualizar campos
    for field, value in categoria.dict().items():
        setattr(db_categoria, field, value)
    
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def eliminar_categoria_egreso(db: Session, categoria_id: int):
    # Verificar que existe la categoría
    db_categoria = get_categoria_egreso(db, categoria_id)
    if not db_categoria:
        raise ValueError("Categoría no encontrada")
    
    # Contar cuántos egresos están usando esta categoría
    cantidad_egresos = db.query(models.Egreso).filter(
        models.Egreso.categoria_id == categoria_id
    ).count()
    
    if cantidad_egresos > 0:
        mensaje = f"No se puede eliminar la categoría '{db_categoria.nombre}' porque tiene {cantidad_egresos} egreso(s) asociado(s). "
        mensaje += "Para eliminar esta categoría, primero debe reasignar o eliminar todos los egresos que la usan."
        raise ValueError(mensaje)
    
    nombre_categoria = db_categoria.nombre
    db.delete(db_categoria)
    db.commit()
    return {"message": f"Categoría '{nombre_categoria}' eliminada exitosamente"}

def get_resumen_egresos(db: Session, fecha_inicio: Optional[datetime] = None, fecha_fin: Optional[datetime] = None):
    from typing import Optional  # Agregar importación
    
    query = db.query(models.Egreso)
    
    if fecha_inicio:
        query = query.filter(models.Egreso.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.Egreso.fecha <= fecha_fin)

    egresos = query.all()
    categorias = {}
    total_egresos = 0

    for egreso in egresos:
        if egreso.categoria.nombre not in categorias:
            categorias[egreso.categoria.nombre] = {
                'total': 0,
                'egresos': []
            }
        categorias[egreso.categoria.nombre]['total'] += egreso.valor
        categorias[egreso.categoria.nombre]['egresos'].append(egreso)
        total_egresos += egreso.valor

    resumen_categorias = [
        schemas.ResumenCategoria(
            nombre=nombre,
            total=datos['total'],
            egresos=datos['egresos']
        )
        for nombre, datos in categorias.items()
    ]

    return resumen_categorias, total_egresos
