from sqlalchemy.orm import Session
from datetime import datetime, date
from . import models as inscripcion_models
from .. import models
from . import schemas
from sqlalchemy import func

def crear_inscripcion(db: Session, inscripcion: schemas.InscripcionCreate):
    """
    Crea una nueva inscripción para un partido
    """
    # Obtener el último orden de inscripción para la fecha
    ultimo_orden = db.query(func.max(inscripcion_models.Inscripcion.orden_inscripcion))\
        .filter(inscripcion_models.Inscripcion.fecha_partido == inscripcion.fecha_partido)\
        .scalar() or 0

    # Crear la nueva inscripción
    db_inscripcion = inscripcion_models.Inscripcion(
        fecha_partido=inscripcion.fecha_partido,
        jugador_id=inscripcion.jugador_id,
        nombre_inscrito=inscripcion.nombre_inscrito,
        mensaje_whatsapp=inscripcion.mensaje_whatsapp,
        orden_inscripcion=ultimo_orden + 1
    )
    db.add(db_inscripcion)
    db.commit()
    db.refresh(db_inscripcion)
    return db_inscripcion

def generar_reporte_nomina(db: Session, fecha_partido: date):
    """
    Genera el reporte de nómina para un partido, mostrando los jugadores inscritos
    y su estado de cuenta (al día o con pagos pendientes)
    """
    # Configuración de cupos
    CUPOS_TITULARES = 18

    # Obtener todas las inscripciones ordenadas por orden de inscripción
    resultados = db.query(
        inscripcion_models.Inscripcion,
        models.Jugador,
        models.Multa
    ).outerjoin(
        models.Jugador,
        inscripcion_models.Inscripcion.jugador_id == models.Jugador.id
    ).outerjoin(
        models.Multa,
        (models.Multa.jugador_id == models.Jugador.id) & 
        (models.Multa.pagada == False)
    ).filter(
        inscripcion_models.Inscripcion.fecha_partido == fecha_partido
    ).order_by(
        inscripcion_models.Inscripcion.orden_inscripcion
    ).all()

    if not resultados:
        return None

    # Estructurar el reporte
    reporte = {
        "fecha_partido": fecha_partido,
        "fecha_generacion": datetime.now(),
        "total_inscritos": len(resultados),
        "cupos_titulares": CUPOS_TITULARES,
        "cupos_disponibles": max(0, CUPOS_TITULARES - len(resultados)),
        "titulares": [],
        "suplentes": [],
        "resumen": {
            "total_al_dia": sum(1 for _, j, _ in resultados if j and j.estado_cuenta),
            "total_con_multas": sum(1 for _, _, m in resultados if m is not None),
            "total_registrados": sum(1 for _, j, _ in resultados if j is not None),
            "total_invitados": sum(1 for _, j, _ in resultados if j is None)
        }
    }

    for idx, (inscripcion, jugador, multa) in enumerate(resultados):
        jugador_info = {
            "orden": inscripcion.orden_inscripcion,
            "nombre": inscripcion.nombre_inscrito,
            "mensaje_whatsapp": inscripcion.mensaje_whatsapp,
            "hora_inscripcion": inscripcion.fecha_inscripcion.strftime("%H:%M"),
            "telefono": jugador.telefono if jugador else None,
            "estado_cuenta": jugador.estado_cuenta if jugador else None,
            "tiene_multas": multa is not None,
            "es_registrado": jugador is not None,
            "estado": "Titular" if idx < CUPOS_TITULARES else "Suplente"
        }

        if idx < CUPOS_TITULARES:
            reporte["titulares"].append(jugador_info)
        else:
            reporte["suplentes"].append(jugador_info)

    return reporte
