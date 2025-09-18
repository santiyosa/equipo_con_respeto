from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import models
from schemas import jugadores as schemas
from services.estado_cuenta_service import EstadoCuentaService
from typing import List, Optional
import hashlib

def get_jugador(db: Session, cedula: str):
    return db.query(models.Jugador).filter(models.Jugador.cedula == cedula).first()

def get_jugador_by_cedula(db: Session, cedula: str):
    return db.query(models.Jugador).filter(models.Jugador.cedula == cedula).first()

def get_jugadores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Jugador).offset(skip).limit(limit).all()

def create_jugador(db: Session, jugador: schemas.JugadorCreate):
    # Crear hash de la contraseña inicial (cédula)
    password_hash = hashlib.sha256(jugador.cedula.encode()).hexdigest()
    
    # Crear el jugador con credenciales automáticas
    jugador_data = jugador.dict()
    jugador_data['password'] = password_hash  # Cédula como contraseña inicial

    # Corregir recomendado_por_cedula si viene como 'NULL', '' o no existe
    recomendado = jugador_data.get('recomendado_por_cedula', None)
    if recomendado in [None, '', 'NULL', 'null', 0, '0']:
        jugador_data['recomendado_por_cedula'] = None

    db_jugador = models.Jugador(**jugador_data)
    db.add(db_jugador)
    db.commit()
    db.refresh(db_jugador)

    print(f"✅ Jugador creado: {jugador.nombre}")
    print(f"📧 Email: {jugador.email}")
    print(f"🔑 Contraseña inicial: {jugador.cedula} (puede cambiarla con recuperar contraseña)")

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
        if str(jugador.posicion) == "arquero":
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
    try:
        # Actualizar usando query para evitar problemas de tipo
        result = db.query(models.Jugador).filter(
            models.Jugador.cedula == cedula
        ).update({"activo": activo})
        
        if result == 0:
            return None  # No se encontró el jugador
        
        db.commit()
        
        # Retornar el jugador actualizado
        return get_jugador(db, cedula)
    
    except Exception as e:
        db.rollback()
        print(f"Error cambiando estado del jugador: {e}")
        return None

def get_jugador_by_email(db: Session, email: str):
    """Obtiene un jugador por su email"""
    return db.query(models.Jugador).filter(models.Jugador.email == email).first()

def verificar_credenciales_jugador(db: Session, email: str, password: str) -> bool:
    """Verifica las credenciales de un jugador"""
    jugador = get_jugador_by_email(db, email)
    if not jugador or jugador.password is None:
        return False
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    return str(jugador.password) == hashed_password

def actualizar_credenciales_jugador(db: Session, cedula: str, email: str, password: str) -> bool:
    """Actualiza email y contraseña de un jugador"""
    try:
        jugador = get_jugador(db, cedula)
        if not jugador:
            return False
        
        # Hash de la contraseña
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Actualizar en la base de datos
        db.query(models.Jugador).filter(
            models.Jugador.cedula == cedula
        ).update({
            "email": email,
            "password": password_hash
        })
        
        db.commit()
        return True
    
    except Exception as e:
        db.rollback()
        print(f"Error actualizando credenciales del jugador: {e}")
        return False
