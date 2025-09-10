from sqlalchemy.orm import Session
from datetime import datetime
import models
from schemas.pagos import PagoCombinado
from sqlalchemy import and_
from crud.configuraciones import get_configuracion_by_clave

def registrar_pago_combinado(db: Session, pago: PagoCombinado):
    """
    Registra un pago que puede incluir tanto mensualidades como multas en una sola transacción.
    """
    try:
        fecha_pago = pago.fecha_pago or datetime.now()
        
        # Validar que el jugador exista
        jugador = db.query(models.Jugador).filter(models.Jugador.cedula == pago.jugador_cedula).first()
        if not jugador:
            raise ValueError("Jugador no encontrado")

        # Obtener el valor de la mensualidad desde la configuración
        config_mensualidad = get_configuracion_by_clave(db, "mensualidad")
        if not config_mensualidad:
            raise ValueError("No se ha configurado el valor de la mensualidad en el sistema")
        
        valor_mensualidad = config_mensualidad.valor  # Ya es float en la base de datos

        # Registrar pagos de mensualidades
        for mensualidad in pago.mensualidades:
            # Validar que no exista ya un pago para ese mes/año
            existe_pago = db.query(models.Mensualidad).filter(
                and_(
                    models.Mensualidad.jugador_cedula == pago.jugador_cedula,
                    models.Mensualidad.mes == mensualidad.mes,
                    models.Mensualidad.ano == mensualidad.ano
                )
            ).first()
            
            if existe_pago:
                meses = {
                    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
                    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
                    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
                }
                mes_nombre = meses.get(mensualidad.mes, str(mensualidad.mes))
                raise ValueError(f"El mes {mes_nombre} {mensualidad.ano} ya está pagado para este jugador")
            
            # Usar el valor de la configuración en lugar del valor enviado
            nuevo_pago = models.Mensualidad(
                jugador_cedula=pago.jugador_cedula,
                mes=mensualidad.mes,
                ano=mensualidad.ano,
                valor=valor_mensualidad,  # Usar valor de la configuración
                fecha_pago=fecha_pago,
                registrado_por=pago.registrado_por
            )
            db.add(nuevo_pago)

        # Registrar pagos de multas
        for multa_id in pago.multas:
            multa = db.query(models.Multa).filter(
                and_(
                    models.Multa.id == multa_id,
                    models.Multa.jugador_cedula == pago.jugador_cedula,
                    models.Multa.pagada == False
                )
            ).first()
            
            if not multa:
                raise ValueError(f"Multa {multa_id} no encontrada o ya está pagada")
            
            # Actualizar multa como pagada
            db.query(models.Multa).filter(models.Multa.id == multa_id).update({
                models.Multa.pagada: True,
                models.Multa.fecha_pago: fecha_pago
            })

        # Actualizar estado de cuenta del jugador
        multas_pendientes = db.query(models.Multa).filter(
            and_(
                models.Multa.jugador_cedula == pago.jugador_cedula,
                models.Multa.pagada == False
            )
        ).count()

        # Si no hay multas pendientes, actualizar estado de cuenta
        if multas_pendientes == 0:
            db.query(models.Jugador).filter(models.Jugador.cedula == pago.jugador_cedula).update({
                models.Jugador.estado_cuenta: True
            })

        # Commit de la transacción
        db.commit()

        return {
            "mensaje": "Pagos registrados exitosamente",
            "fecha_pago": fecha_pago,
            "mensualidades_registradas": len(pago.mensualidades),
            "multas_pagadas": len(pago.multas),
            "estado_cuenta": True if multas_pendientes == 0 else False
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al registrar los pagos: {str(e)}")
