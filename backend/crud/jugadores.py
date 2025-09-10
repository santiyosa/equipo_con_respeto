from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import models
from schemas import jugadores as schemas
from services.estado_cuenta_service import EstadoCuentaService
from typing import List, Optional

def get_jugador(db: Session, cedula: str):
    return db.query(models.Jugador).filter(models.Jugador.cedula == cedula).first()

def get_jugador_by_cedula(db: Session, cedula: str):
    return db.query(models.Jugador).filter(models.Jugador.cedula == cedula).first()

def get_jugadores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Jugador).offset(skip).limit(limit).all()

def create_jugador(db: Session, jugador: schemas.JugadorCreate):
    db_jugador = models.Jugador(**jugador.dict())
    db.add(db_jugador)
    db.commit()
    db.refresh(db_jugador)
    return db_jugador

def buscar_jugadores(db: Session, termino: str):
    """Busca jugadores por nombre, cédula o alias de inscripción"""
    return db.query(models.Jugador).filter(
        (models.Jugador.nombre.ilike(f"%{termino}%")) |
        (models.Jugador.cedula.ilike(f"%{termino}%")) |
        (models.Jugador.nombre_inscripcion.ilike(f"%{termino}%"))
    ).all()

def get_estado_cuenta_jugador(db: Session, cedula: str) -> schemas.EstadoCuentaJugador:
    """Obtiene el estado de cuenta detallado de un jugador"""
    jugador = get_jugador(db, cedula)
    if not jugador:
        raise ValueError("Jugador no encontrado")

    # Usar el nuevo servicio para calcular el estado
    detalles_estado = EstadoCuentaService.obtener_detalles_estado(jugador, db)

    # Obtener mensualidades pagadas
    meses_pagados = [
        schemas.MesPago(
            mes=m.mes,
            ano=m.ano,
            valor=m.valor,
            fecha_pago=m.fecha_pago
        ) for m in jugador.mensualidades
    ]

    # Obtener multas
    multas = [
        schemas.MultaResumen(
            descripcion=m.causal.descripcion,
            valor=m.causal.valor,
            fecha_multa=m.fecha_multa,
            pagada=m.pagada,
            fecha_pago=m.fecha_pago
        ) for m in jugador.multas
    ]

    # Obtener otros aportes (si existe la relación)
    otros_aportes = []
    if hasattr(jugador, 'otros_aportes'):
        otros_aportes = [
            schemas.OtroAporteResumen(
                concepto=a.concepto,
                valor=a.valor,
                fecha_aporte=a.fecha_aporte
            ) for a in jugador.otros_aportes
        ]

    # Calcular totales
    total_pagado = sum(m.valor for m in meses_pagados)
    total_multas_pendientes = detalles_estado["valor_multas_pendientes"]

    # Determinar estado usando la nueva lógica
    if detalles_estado["al_dia"]:
        estado = "AL DÍA"
    else:
        if jugador.posicion == "arquero":
            estado = "ARQUERO CON MULTAS PENDIENTES"
        elif total_multas_pendientes > 0:
            if "mensualidades_pendientes" in detalles_estado and detalles_estado["mensualidades_pendientes"] > 0:
                estado = "DEBE MENSUALIDADES Y TIENE MULTAS"
            else:
                estado = "TIENE MULTAS PENDIENTES"
        else:
            estado = "DEBE MENSUALIDADES"

    return schemas.EstadoCuentaJugador(
        jugador_cedula=str(jugador.cedula),
        nombre=str(jugador.nombre),
        nombre_inscripcion=str(jugador.nombre_inscripcion),
        meses_pagados=meses_pagados,
        multas=multas,
        otros_aportes=otros_aportes,
        total_pagado=total_pagado,
        total_multas_pendientes=total_multas_pendientes,
        estado=estado
    )

def update_jugador(db: Session, cedula: str, jugador: schemas.JugadorUpdate):
    """Actualiza los datos de un jugador"""
    db_jugador = get_jugador(db, cedula)
    if not db_jugador:
        return None
    
    # Actualizar solo los campos que se envían
    update_data = jugador.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_jugador, field, value)
    
    db.commit()
    db.refresh(db_jugador)
    return db_jugador

def cambiar_estado_jugador(db: Session, cedula: str, activo: bool):
    """Cambia el estado activo/inactivo de un jugador"""
    db_jugador = get_jugador(db, cedula)
    if not db_jugador:
        return None
    
    db_jugador.activo = activo
    db.commit()
    db.refresh(db_jugador)
    return db_jugador
