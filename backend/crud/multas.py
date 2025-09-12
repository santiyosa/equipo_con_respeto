from sqlalchemy.orm import Session
from datetime import datetime
import models
from schemas import multas as schemas

def get_multa(db: Session, multa_id: int):
    return db.query(models.Multa).filter(models.Multa.id == multa_id).first()

def get_todas_multas(db: Session, incluir_pagadas: bool = False):
    """Obtiene todas las multas del sistema. Por defecto solo multas pendientes."""
    query = db.query(models.Multa)
    if not incluir_pagadas:
        query = query.filter(models.Multa.pagada == False)
    return query.all()

def get_multas_completas(db: Session, incluir_pagadas: bool = False):
    """Obtiene todas las multas con información completa del jugador y causal"""
    query = db.query(
        models.Multa,
        models.Jugador.nombre.label('jugador_nombre'),
        models.CausalMulta.descripcion.label('causal_descripcion'),
        models.CausalMulta.valor.label('causal_valor')
    ).join(
        models.Jugador, models.Multa.jugador_cedula == models.Jugador.cedula
    ).join(
        models.CausalMulta, models.Multa.causal_id == models.CausalMulta.id
    )
    
    if not incluir_pagadas:
        query = query.filter(models.Multa.pagada == False)
    
    results = query.all()
    
    # Convertir a formato MultaCompleta
    multas_completas = []
    for multa, jugador_nombre, causal_descripcion, causal_valor in results:
        multa_completa = {
            'id': multa.id,
            'jugador_cedula': multa.jugador_cedula,
            'jugador_nombre': jugador_nombre,
            'causal_id': multa.causal_id,
            'causal_descripcion': causal_descripcion,
            'causal_valor': causal_valor,  # Valor actual de la causal (para referencia)
            'valor': multa.valor,  # Valor real de la multa al momento de creación
            'fecha_multa': multa.fecha_multa,
            'pagada': multa.pagada,
            'fecha_pago': multa.fecha_pago,
            'registrado_por': multa.registrado_por,
            'es_aporte_grupal': getattr(multa, 'es_aporte_grupal', False),
            'grupo_multa_id': getattr(multa, 'grupo_multa_id', None),
            'concepto_aporte': getattr(multa, 'concepto_aporte', None)
        }
        multas_completas.append(multa_completa)
    
    return multas_completas

def get_multas_jugador(db: Session, cedula: str, incluir_pagadas: bool = False):
    """
    Obtiene las multas de un jugador específico con información completa de la causal
    """
    query = db.query(
        models.Multa,
        models.Jugador.nombre.label('jugador_nombre'),
        models.CausalMulta.descripcion.label('causal_descripcion'),
        models.CausalMulta.valor.label('causal_valor')
    ).join(
        models.Jugador, models.Multa.jugador_cedula == models.Jugador.cedula
    ).join(
        models.CausalMulta, models.Multa.causal_id == models.CausalMulta.id
    ).filter(models.Multa.jugador_cedula == cedula)
    
    if not incluir_pagadas:
        query = query.filter(models.Multa.pagada == False)
    
    results = query.all()
    
    # Convertir a formato MultaCompleta similar al get_multas()
    multas_completas = []
    for multa, jugador_nombre, causal_descripcion, causal_valor in results:
        multa_completa = {
            'id': multa.id,
            'jugador_cedula': multa.jugador_cedula,
            'jugador_nombre': jugador_nombre,
            'causal_id': multa.causal_id,
            'causal_descripcion': causal_descripcion,
            'causal_valor': causal_valor,  # Valor actual de la causal (para referencia)
            'valor': multa.valor,  # Valor real de la multa al momento de creación
            'fecha_multa': multa.fecha_multa,
            'pagada': multa.pagada,
            'fecha_pago': multa.fecha_pago,
            'registrado_por': multa.registrado_por,
            'es_aporte_grupal': getattr(multa, 'es_aporte_grupal', False),
            'grupo_multa_id': getattr(multa, 'grupo_multa_id', None),
            'concepto_aporte': getattr(multa, 'concepto_aporte', None)
        }
        multas_completas.append(multa_completa)
    
    return multas_completas

def crear_multa(db: Session, multa: schemas.MultaCreate, admin_id: int):
    # Verificar que existe el jugador
    jugador = db.query(models.Jugador).filter(models.Jugador.cedula == multa.jugador_cedula).first()
    if not jugador:
        raise ValueError("Jugador no encontrado")

    # Verificar que existe la causal
    causal = db.query(models.CausalMulta).filter(models.CausalMulta.id == multa.causal_id).first()
    if not causal:
        raise ValueError("Causal de multa no encontrada")

    db_multa = models.Multa(
        jugador_cedula=multa.jugador_cedula,
        causal_id=multa.causal_id,
        valor=causal.valor,  # Guardar el valor actual de la causal
        registrado_por=admin_id,
        es_aporte_grupal=getattr(multa, 'es_aporte_grupal', False),
        grupo_multa_id=getattr(multa, 'grupo_multa_id', None),
        concepto_aporte=getattr(multa, 'concepto_aporte', None)
    )
    db.add(db_multa)
    
    # Actualizar estado de cuenta del jugador
    db.query(models.Jugador).filter(models.Jugador.cedula == multa.jugador_cedula).update({
        models.Jugador.estado_cuenta: False
    })
    
    db.commit()
    db.refresh(db_multa)
    return db_multa

def crear_aporte_grupal(db: Session, aporte: schemas.AporteGrupalCreate, admin_id: int):
    """Crea un aporte grupal asignándolo a todos los jugadores activos"""
    import uuid
    
    # Verificar que existe la causal
    causal = db.query(models.CausalMulta).filter(models.CausalMulta.id == aporte.causal_id).first()
    if not causal:
        raise ValueError("Causal de multa no encontrada")
    
    # Obtener todos los jugadores activos
    jugadores_activos = db.query(models.Jugador).filter(models.Jugador.activo == True).all()
    
    if not jugadores_activos:
        raise ValueError("No hay jugadores activos para asignar el aporte")
    
    # Generar ID único para agrupar todas las multas de este aporte
    grupo_id = str(uuid.uuid4())
    
    multas_creadas = []
    
    # Crear una multa para cada jugador activo
    for jugador in jugadores_activos:
        db_multa = models.Multa(
            jugador_cedula=jugador.cedula,
            causal_id=aporte.causal_id,
            fecha_multa=aporte.fecha_multa,
            registrado_por=admin_id,
            es_aporte_grupal=True,
            grupo_multa_id=grupo_id,
            concepto_aporte=aporte.concepto_aporte
        )
        db.add(db_multa)
        multas_creadas.append(db_multa)
        
        # Actualizar estado de cuenta del jugador
        db.query(models.Jugador).filter(models.Jugador.cedula == jugador.cedula).update({
            models.Jugador.estado_cuenta: False
        })
    
    db.commit()
    
    # Refrescar todas las multas creadas
    for multa in multas_creadas:
        db.refresh(multa)
    
    return {
        "grupo_multa_id": grupo_id,
        "concepto_aporte": aporte.concepto_aporte,
        "total_jugadores": len(multas_creadas),
        "multas_creadas": len(multas_creadas)  # Solo devolver el número, no los objetos
    }

def get_aportes_grupales(db: Session):
    """Obtiene un resumen de todos los aportes grupales"""
    # Obtener grupos únicos de aportes
    grupos = db.query(
        models.Multa.grupo_multa_id,
        models.Multa.concepto_aporte,
        models.Multa.fecha_multa,
        models.CausalMulta.descripcion.label('causal_descripcion'),
        models.CausalMulta.valor.label('valor_unitario')
    ).join(
        models.CausalMulta, models.Multa.causal_id == models.CausalMulta.id
    ).filter(
        models.Multa.es_aporte_grupal == True
    ).distinct().all()
    
    aportes_resumen = []
    
    for grupo in grupos:
        # Contar pagadas y pendientes para este grupo
        total_multas = db.query(models.Multa).filter(
            models.Multa.grupo_multa_id == grupo.grupo_multa_id
        ).count()
        
        pagadas = db.query(models.Multa).filter(
            models.Multa.grupo_multa_id == grupo.grupo_multa_id,
            models.Multa.pagada == True
        ).count()
        
        pendientes = total_multas - pagadas
        
        aporte_info = {
            "grupo_multa_id": grupo.grupo_multa_id,
            "concepto_aporte": grupo.concepto_aporte,
            "fecha_multa": grupo.fecha_multa,
            "causal_descripcion": grupo.causal_descripcion,
            "valor_unitario": grupo.valor_unitario,
            "total_jugadores": total_multas,
            "pagadas": pagadas,
            "pendientes": pendientes,
            "porcentaje_pagado": round((pagadas / total_multas) * 100, 1) if total_multas > 0 else 0
        }
        aportes_resumen.append(aporte_info)
    
    return aportes_resumen

def get_detalle_aporte_grupal(db: Session, grupo_multa_id: str):
    """Obtiene el detalle de un aporte grupal específico"""
    multas = db.query(
        models.Multa,
        models.Jugador.nombre.label('jugador_nombre'),
        models.CausalMulta.descripcion.label('causal_descripcion'),
        models.CausalMulta.valor.label('causal_valor')
    ).join(
        models.Jugador, models.Multa.jugador_cedula == models.Jugador.cedula
    ).join(
        models.CausalMulta, models.Multa.causal_id == models.CausalMulta.id
    ).filter(
        models.Multa.grupo_multa_id == grupo_multa_id
    ).all()
    
    detalle = []
    for multa, jugador_nombre, causal_descripcion, causal_valor in multas:
        detalle.append({
            'id': multa.id,
            'jugador_cedula': multa.jugador_cedula,
            'jugador_nombre': jugador_nombre,
            'causal_descripcion': causal_descripcion,
            'causal_valor': causal_valor,
            'fecha_multa': multa.fecha_multa,
            'pagada': multa.pagada,
            'fecha_pago': multa.fecha_pago,
            'concepto_aporte': multa.concepto_aporte
        })
    
    return detalle

def actualizar_multa(db: Session, multa_id: int, multa_update: schemas.MultaUpdate):
    """Actualiza una multa existente con validaciones avanzadas"""
    db_multa = db.query(models.Multa).filter(models.Multa.id == multa_id).first()
    if not db_multa:
        return None
    
    # Validaciones de negocio
    update_data = multa_update.dict(exclude_unset=True)
    
    # Si se está actualizando el jugador, verificar que existe
    if 'jugador_cedula' in update_data:
        jugador = db.query(models.Jugador).filter(
            models.Jugador.cedula == update_data['jugador_cedula']
        ).first()
        if not jugador:
            raise ValueError("Jugador no encontrado")
    
    # Si se está actualizando la causal, verificar que existe
    if 'causal_id' in update_data:
        causal = db.query(models.CausalMulta).filter(
            models.CausalMulta.id == update_data['causal_id']
        ).first()
        if not causal:
            raise ValueError("Causal de multa no encontrada")
    
    # Validaciones de estado: no permitir "despagar" multas pagadas sin justificación
    if 'pagada' in update_data and db_multa.pagada is True and update_data['pagada'] is False:
        # Solo permitir marcar como no pagada si es el mismo día o un admin
        from datetime import date
        if db_multa.fecha_pago is not None and db_multa.fecha_pago.date() < date.today():
            raise ValueError("No se puede marcar como no pagada una multa pagada en días anteriores")
    
    # Si se marca como pagada, establecer fecha de pago automáticamente
    if 'pagada' in update_data and update_data['pagada'] is True and db_multa.pagada is False:
        from datetime import datetime
        update_data['fecha_pago'] = datetime.now()
    
    # Si se desmarca como pagada, limpiar fecha de pago
    if 'pagada' in update_data and update_data['pagada'] is False:
        update_data['fecha_pago'] = None
    
    # Validar coherencia de fechas
    if 'fecha_pago' in update_data and update_data['fecha_pago'] is not None:
        fecha_multa = update_data.get('fecha_multa', db_multa.fecha_multa)
        if update_data['fecha_pago'].date() < fecha_multa:
            raise ValueError("La fecha de pago no puede ser anterior a la fecha de la multa")
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(db_multa, field, value)
    
    # Actualizar estado de cuenta del jugador si cambia el jugador o el estado de pago
    if 'jugador_cedula' in update_data or 'pagada' in update_data:
        jugador_cedula = update_data.get('jugador_cedula', db_multa.jugador_cedula)
        
        # Verificar si el jugador tiene multas pendientes
        multas_pendientes = db.query(models.Multa).filter(
            models.Multa.jugador_cedula == jugador_cedula,
            models.Multa.pagada == False,
            models.Multa.id != multa_id  # Excluir la multa actual
        ).count()
        
        # Si la multa actual se está marcando como pendiente, sumar 1
        if 'pagada' in update_data and update_data['pagada'] is False:
            multas_pendientes += 1
        
        # Actualizar estado de cuenta
        estado_cuenta = multas_pendientes == 0
        db.query(models.Jugador).filter(models.Jugador.cedula == jugador_cedula).update({
            models.Jugador.estado_cuenta: estado_cuenta
        })
    
    db.commit()
    db.refresh(db_multa)
    return db_multa

def eliminar_multa(db: Session, multa_id: int):
    """Elimina una multa"""
    db_multa = db.query(models.Multa).filter(models.Multa.id == multa_id).first()
    if db_multa:
        db.delete(db_multa)
        db.commit()
        return True
    return False

def get_causales_multa(db: Session):
    return db.query(models.CausalMulta).all()

def get_causal_multa(db: Session, causal_id: int):
    """Obtiene una causal de multa por ID"""
    return db.query(models.CausalMulta).filter(models.CausalMulta.id == causal_id).first()

def crear_causal_multa(db: Session, causal: schemas.CausalMultaCreate):
    db_causal = models.CausalMulta(**causal.dict())
    db.add(db_causal)
    db.commit()
    db.refresh(db_causal)
    return db_causal

def actualizar_causal_multa(db: Session, causal_id: int, causal: schemas.CausalMultaUpdate):
    """Actualiza una causal de multa existente"""
    db_causal = db.query(models.CausalMulta).filter(models.CausalMulta.id == causal_id).first()
    if not db_causal:
        raise ValueError("Causal de multa no encontrada")
    
    # Verificar si ya existe otra causal con la misma descripción (si se está actualizando)
    if causal.descripcion and causal.descripcion != db_causal.descripcion:
        causal_existente = db.query(models.CausalMulta).filter(
            models.CausalMulta.descripcion == causal.descripcion,
            models.CausalMulta.id != causal_id
        ).first()
        
        if causal_existente:
            raise ValueError(f"Ya existe una causal con la descripción '{causal.descripcion}'")
    
    # Actualizar solo los campos proporcionados
    update_data = causal.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_causal, field, value)
    
    db.commit()
    db.refresh(db_causal)
    return db_causal

def eliminar_causal_multa(db: Session, causal_id: int):
    """Elimina una causal de multa"""
    db_causal = db.query(models.CausalMulta).filter(models.CausalMulta.id == causal_id).first()
    if db_causal:
        db.delete(db_causal)
        db.commit()
        return True
    return False
