from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from datetime import datetime
from database import get_db
from schemas.pagos import PagoCombinado
from crud.pagos import registrar_pago_combinado
from models import Mensualidad, OtroAporte, Jugador, Administrador

router = APIRouter()

@router.get("/pagos/", tags=["pagos"])
def obtener_pagos(
    jugador_cedula: Optional[str] = None,
    limite: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtiene un listado de todos los pagos registrados (mensualidades y otros aportes).
    
    - **jugador_cedula**: Filtrar por jugador específico (opcional)
    - **limite**: Número máximo de registros a retornar (default: 100)
    
    Retorna una lista unificada de pagos ordenados por fecha de pago descendente.
    """
    try:
        # Obtener mensualidades
        mensualidades_query = db.query(
            Mensualidad.id,
            Mensualidad.jugador_cedula,
            Jugador.nombre,
            Mensualidad.mes,
            Mensualidad.ano,
            Mensualidad.valor,
            Mensualidad.fecha_pago
        ).join(Jugador, Mensualidad.jugador_cedula == Jugador.cedula)
        
        # Obtener otros aportes
        otros_aportes_query = db.query(
            OtroAporte.id,
            OtroAporte.jugador_cedula,
            Jugador.nombre,
            OtroAporte.valor,
            OtroAporte.fecha_aporte,
            OtroAporte.concepto
        ).join(Jugador, OtroAporte.jugador_cedula == Jugador.cedula)
        
        # Filtrar por jugador si se especifica
        if jugador_cedula:
            mensualidades_query = mensualidades_query.filter(Mensualidad.jugador_cedula == jugador_cedula)
            otros_aportes_query = otros_aportes_query.filter(OtroAporte.jugador_cedula == jugador_cedula)
        
        # Combinar consultas y ordenar por fecha
        mensualidades = mensualidades_query.limit(limite//2).all()
        otros_aportes = otros_aportes_query.limit(limite//2).all()
        
        # Convertir a diccionarios y combinar
        pagos = []
        
        for m in mensualidades:
            pagos.append({
                "id": f"mens_{m[0]}",
                "jugador_cedula": m[1],
                "jugador_nombre": m[2],
                "tipo_pago": "mensualidad",
                "concepto": f"Mensualidad {m[3]}/{m[4]}",
                "valor": m[5],
                "fecha_pago": m[6],
                "mes": m[3],
                "ano": m[4]
            })
        
        for a in otros_aportes:
            pagos.append({
                "id": f"aporte_{a[0]}",
                "jugador_cedula": a[1],
                "jugador_nombre": a[2],
                "tipo_pago": "otro_aporte",
                "concepto": a[5],
                "valor": a[3],
                "fecha_pago": a[4],
                "mes": None,
                "ano": None
            })
        
        # Ordenar por fecha de pago descendente
        pagos.sort(key=lambda x: x['fecha_pago'], reverse=True)
        
        return pagos[:limite]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener pagos: {str(e)}")

@router.post("/pagos/", tags=["pagos"])
def crear_pago_simple(
    pago_data: dict,
    db: Session = Depends(get_db)
):
    """
    Registra un pago simple (mensualidad u otro aporte).
    
    Ejemplo para mensualidad:
    {
        "tipo": "mensualidad",
        "jugador_cedula": "12345678",
        "mes": 9,
        "ano": 2025,
        "valor": 50000
    }
    
    Ejemplo para otro aporte:
    {
        "tipo": "otro_aporte",
        "jugador_cedula": "12345678",
        "concepto": "Aporte rifas",
        "valor": 25000
    }
    """
    try:
        tipo_pago = pago_data.get("tipo")
        jugador_cedula = pago_data.get("jugador_cedula")
        valor = pago_data.get("valor")
        
        if not all([tipo_pago, jugador_cedula, valor]):
            raise HTTPException(status_code=400, detail="Faltan campos requeridos: tipo, jugador_cedula, valor")
        
        # Verificar que el jugador existe
        jugador = db.query(Jugador).filter(Jugador.cedula == jugador_cedula).first()
        if not jugador:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        
        if tipo_pago == "mensualidad":
            mes = pago_data.get("mes")
            ano = pago_data.get("ano")
            
            if not mes or not ano:
                raise HTTPException(status_code=400, detail="Para mensualidades se requieren mes y año")
            
            # Verificar que no exista ya esta mensualidad
            mensualidad_existente = db.query(Mensualidad).filter(
                Mensualidad.jugador_cedula == jugador_cedula,
                Mensualidad.mes == mes,
                Mensualidad.ano == ano
            ).first()
            
            if mensualidad_existente:
                raise HTTPException(status_code=400, detail=f"Ya existe un pago para {mes}/{ano}")
            
            # Crear mensualidad
            nueva_mensualidad = Mensualidad(
                jugador_cedula=jugador_cedula,
                mes=mes,
                ano=ano,
                valor=valor,
                registrado_por=1  # TODO: Obtener del usuario autenticado
            )
            
            db.add(nueva_mensualidad)
            db.commit()
            db.refresh(nueva_mensualidad)
            
            return {
                "id": nueva_mensualidad.id,
                "tipo": "mensualidad",
                "jugador_cedula": jugador_cedula,
                "jugador_nombre": jugador.nombre,
                "mes": mes,
                "ano": ano,
                "valor": valor,
                "fecha_pago": nueva_mensualidad.fecha_pago,
                "concepto": f"Mensualidad {mes}/{ano}"
            }
            
        elif tipo_pago == "otro_aporte":
            concepto = pago_data.get("concepto")
            
            if not concepto:
                raise HTTPException(status_code=400, detail="Para otros aportes se requiere el concepto")
            
            # Crear otro aporte
            nuevo_aporte = OtroAporte(
                jugador_cedula=jugador_cedula,
                concepto=concepto,
                valor=valor,
                registrado_por=1  # TODO: Obtener del usuario autenticado
            )
            
            db.add(nuevo_aporte)
            db.commit()
            db.refresh(nuevo_aporte)
            
            return {
                "id": nuevo_aporte.id,
                "tipo": "otro_aporte",
                "jugador_cedula": jugador_cedula,
                "jugador_nombre": jugador.nombre,
                "concepto": concepto,
                "valor": valor,
                "fecha_pago": nuevo_aporte.fecha_aporte
            }
        
        else:
            raise HTTPException(status_code=400, detail="Tipo de pago no válido. Use 'mensualidad' o 'otro_aporte'")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear pago: {str(e)}")

@router.post("/pagos/combinado/", tags=["pagos"])
def crear_pago_combinado(
    pago: PagoCombinado,
    db: Session = Depends(get_db)
):
    """
    Registra un pago que puede incluir tanto mensualidades como multas en una sola transacción.
    
    - Se pueden pagar una o más mensualidades
    - Se pueden pagar una o más multas
    - Todo se registra en una sola transacción
    - Si algo falla, se hace rollback de todo
    - Actualiza automáticamente el estado de cuenta del jugador
    """
    try:
        resultado = registrar_pago_combinado(db, pago)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
