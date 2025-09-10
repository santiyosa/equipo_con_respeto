from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text
from datetime import datetime, date
from typing import Optional, List
import models
from schemas import dashboard as dashboard_schemas

def obtener_resumen_dashboard(db: Session) -> dashboard_schemas.ResumenDashboard:
    """
    Obtiene un resumen completo para el dashboard
    """
    try:
        # Contar total de jugadores
        total_jugadores = db.query(models.Jugador).count()
        
        # Contar jugadores al día (sin multas pendientes)
        jugadores_con_multas_pendientes = db.query(models.Jugador.cedula).join(
            models.Multa
        ).filter(
            models.Multa.pagada == False
        ).distinct().count()
        
        jugadores_al_dia = total_jugadores - jugadores_con_multas_pendientes
        jugadores_con_multas = jugadores_con_multas_pendientes
        
        # Calcular estadísticas financieras reales
        # 1. Calcular ingresos totales (mensualidades + otros aportes + multas pagadas)
        total_mensualidades = db.query(func.sum(models.Mensualidad.valor)).scalar() or 0.0
        total_otros_aportes = db.query(func.sum(models.OtroAporte.valor)).scalar() or 0.0
        total_multas_pagadas = db.query(func.sum(models.CausalMulta.valor))\
                               .select_from(models.Multa)\
                               .join(models.CausalMulta)\
                               .filter(models.Multa.pagada == True)\
                               .scalar() or 0.0
        
        total_ingresos = float(total_mensualidades) + float(total_otros_aportes) + float(total_multas_pagadas)
        
        # 2. Calcular egresos totales
        total_egresos = db.query(func.sum(models.Egreso.valor)).scalar() or 0.0
        total_egresos = float(total_egresos)
        
        # 3. Calcular saldo actual (ingresos - egresos)
        saldo_actual = total_ingresos - total_egresos
        
        # 4. Ingresos y egresos del mes actual (simplificado por ahora)
        # TODO: Implementar filtros por mes actual cuando sea necesario
        ingresos_mes_actual = total_ingresos
        egresos_mes_actual = total_egresos
        
        # Top 3 jugadores con más multas (simplificado)
        top_3_jugadores_multas = []
        
        return dashboard_schemas.ResumenDashboard(
            saldo_actual=saldo_actual,
            ingresos_mes_actual=ingresos_mes_actual,
            egresos_mes_actual=egresos_mes_actual,
            total_jugadores=total_jugadores,
            jugadores_al_dia=jugadores_al_dia,
            jugadores_con_multas=jugadores_con_multas,
            top_3_jugadores_multas=top_3_jugadores_multas,
            fecha_generacion=datetime.now()
        )
        
    except Exception as e:
        raise Exception(f"Error al obtener resumen del dashboard: {str(e)}")
    
    # Enfoque simplificado: usar múltiples consultas simples para compatibilidad con SQLite
    
    # 1. Obtener todos los jugadores básicos
    jugadores_base = db.query(
        models.Jugador.cedula,
        models.Jugador.nombre,
        models.Jugador.nombre_inscripcion
    ).all()
    
    ranking = []
    
    for jugador in jugadores_base:
        # 2. Contar multas para este jugador específico
        query_multas = db.query(models.Multa)\
                        .filter(models.Multa.jugador_cedula == jugador.cedula)
        
        # Aplicar filtros de fecha
        for filtro in filtros_multas:
            if hasattr(filtro.left, 'key') and filtro.left.key == 'fecha_multa':
                query_multas = query_multas.filter(filtro)
        
        # Contar total de multas
        total_multas = query_multas.count()
        
        # Si no tiene multas y solo queremos jugadores con multas, saltar
        if incluir_solo_con_multas and total_multas == 0:
            continue
        
        # Contar multas pendientes y pagadas
        multas_pendientes = 0
        multas_pagadas = 0
        if incluir_pendientes:
            multas_pendientes = query_multas.filter(models.Multa.pagada == False).count()
        if incluir_pagadas:
            multas_pagadas = query_multas.filter(models.Multa.pagada == True).count()
        
        # Obtener valores monetarios
        query_valores = db.query(func.sum(models.CausalMulta.valor).label('total'))\
                         .select_from(models.Multa)\
                         .join(models.CausalMulta)\
                         .filter(models.Multa.jugador_cedula == jugador.cedula)
        
        # Aplicar filtros de fecha a valores
        for filtro in filtros_multas:
            if hasattr(filtro.left, 'key') and filtro.left.key == 'fecha_multa':
                query_valores = query_valores.filter(filtro)
        
        valor_total = query_valores.scalar() or 0
        
        # Valores pendientes
        valor_pendientes = 0
        if incluir_pendientes:
            valor_pendientes = db.query(func.sum(models.CausalMulta.valor))\
                                .select_from(models.Multa)\
                                .join(models.CausalMulta)\
                                .filter(models.Multa.jugador_cedula == jugador.cedula)\
                                .filter(models.Multa.pagada == False)\
                                .scalar() or 0
        
        # Valores pagados
        valor_pagadas = 0
        if incluir_pagadas:
            valor_pagadas = db.query(func.sum(models.CausalMulta.valor))\
                             .select_from(models.Multa)\
                             .join(models.CausalMulta)\
                             .filter(models.Multa.jugador_cedula == jugador.cedula)\
                             .filter(models.Multa.pagada == True)\
                             .scalar() or 0
        
        # Última multa
        ultima_multa = db.query(func.max(models.Multa.fecha_multa))\
                        .filter(models.Multa.jugador_cedula == jugador.cedula)\
                        .scalar()
        
        # Agregar al ranking si cumple criterios
        if not incluir_solo_con_multas or total_multas > 0:
            ranking.append({
                'cedula': jugador.cedula,
                'nombre': jugador.nombre,
                'nombre_inscripcion': jugador.nombre_inscripcion,
                'total_multas': total_multas,
                'multas_pendientes': multas_pendientes,
                'multas_pagadas': multas_pagadas,
                'valor_total_multas': float(valor_total),
                'valor_multas_pendientes': float(valor_pendientes),
                'valor_multas_pagadas': float(valor_pagadas),
                'ultima_multa': ultima_multa
            })
    
    # Ordenar por total de multas y valor
    ranking.sort(key=lambda x: (x['total_multas'], x['valor_total_multas']), reverse=True)
    
    # Aplicar límite
    if limite > 0:
        ranking = ranking[:limite]
    
    # Construir objetos del ranking con posición
    ranking_objetos = []
    for i, datos in enumerate(ranking, 1):
        jugador_ranking = dashboard_schemas.JugadorRankingMultas(
            posicion=i,
            **datos
        )
        ranking_objetos.append(jugador_ranking)
    
    return dashboard_schemas.RankingMultasResponse(
        fecha_generacion=datetime.now(),
        total_jugadores=len(ranking_objetos),
        periodo_inicio=fecha_inicio,
        periodo_fin=fecha_fin,
        ranking=ranking_objetos
    )

def obtener_estadisticas_multas(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> dashboard_schemas.EstadisticasMultas:
    """
    Obtiene estadísticas generales sobre las multas del equipo
    """
    
    # Filtros de fecha
    filtros = []
    if fecha_inicio:
        filtros.append(models.Multa.fecha_multa >= fecha_inicio)
    if fecha_fin:
        filtros.append(models.Multa.fecha_multa <= fecha_fin)
    
    # Query base para estadísticas
    query_base = db.query(models.Multa).join(models.CausalMulta)
    for filtro in filtros:
        query_base = query_base.filter(filtro)
    
    # Estadísticas básicas
    total_multas = query_base.count()
    multas_pendientes = query_base.filter(models.Multa.pagada == False).count()
    multas_pagadas = query_base.filter(models.Multa.pagada == True).count()
    
    # Valores monetarios
    valor_total = query_base.with_entities(func.sum(models.CausalMulta.valor)).scalar() or 0
    valor_pendientes = query_base.filter(models.Multa.pagada == False)\
                                .with_entities(func.sum(models.CausalMulta.valor)).scalar() or 0
    valor_pagadas = query_base.filter(models.Multa.pagada == True)\
                             .with_entities(func.sum(models.CausalMulta.valor)).scalar() or 0
    
    # Promedio de multas por jugador
    total_jugadores = db.query(models.Jugador).count()
    promedio_multas = total_multas / total_jugadores if total_jugadores > 0 else 0
    
    # Jugador con más multas
    jugador_mas_multas = db.query(
        models.Multa.jugador_cedula,
        func.count(models.Multa.id).label('total')
    ).group_by(models.Multa.jugador_cedula)\
     .order_by(desc('total'))\
     .first()
    
    # Jugador con mayor valor en multas
    jugador_mayor_valor = db.query(
        models.Multa.jugador_cedula,
        func.sum(models.CausalMulta.valor).label('total_valor')
    ).join(models.CausalMulta)\
     .group_by(models.Multa.jugador_cedula)\
     .order_by(desc('total_valor'))\
     .first()
    
    return dashboard_schemas.EstadisticasMultas(
        total_multas_aplicadas=total_multas,
        total_multas_pendientes=multas_pendientes,
        total_multas_pagadas=multas_pagadas,
        valor_total_multas=float(valor_total),
        valor_multas_pendientes=float(valor_pendientes),
        valor_multas_pagadas=float(valor_pagadas),
        promedio_multas_por_jugador=round(promedio_multas, 2),
        jugador_con_mas_multas=jugador_mas_multas.jugador_cedula if jugador_mas_multas else None,
        jugador_con_mayor_valor_multas=jugador_mayor_valor.jugador_cedula if jugador_mayor_valor else None
    )

def obtener_ranking_jugadores_multas(
    db: Session, 
    limite: int = 10
) -> dashboard_schemas.RankingMultasResponse:
    """
    Obtiene el ranking de jugadores con más multas - Versión simplificada
    """
    try:
        # Consulta simplificada: contar multas por jugador
        ranking_data = db.query(
            models.Jugador.cedula,
            models.Jugador.nombre,
            models.Jugador.nombre_inscripcion,
            func.count(models.Multa.id).label('total_multas')
        ).outerjoin(
            models.Multa, 
            and_(
                models.Jugador.cedula == models.Multa.jugador_cedula,
                models.Multa.pagada == False
            )
        ).group_by(
            models.Jugador.cedula, 
            models.Jugador.nombre, 
            models.Jugador.nombre_inscripcion
        ).order_by(
            desc(func.count(models.Multa.id))
        ).limit(limite).all()
        
        # Construir lista de jugadores en ranking
        ranking_list = []
        for idx, row in enumerate(ranking_data):
            # Calcular valor de multas pendientes para este jugador
            valor_multas = db.query(
                func.coalesce(func.sum(models.CausalMulta.valor), 0)
            ).join(
                models.Multa, models.CausalMulta.id == models.Multa.causal_id
            ).filter(
                models.Multa.jugador_cedula == row.cedula,
                models.Multa.pagada == False
            ).scalar() or 0
            
            jugador_ranking = dashboard_schemas.JugadorRankingMultas(
                posicion=idx + 1,
                cedula=row.cedula,
                nombre=row.nombre,
                nombre_inscripcion=row.nombre_inscripcion,
                total_multas=row.total_multas,
                multas_pendientes=row.total_multas,
                multas_pagadas=0,
                valor_total_multas=float(valor_multas),
                valor_multas_pendientes=float(valor_multas),
                valor_multas_pagadas=0.0,
                ultima_multa=None
            )
            ranking_list.append(jugador_ranking)
        
        # Construir respuesta completa
        return dashboard_schemas.RankingMultasResponse(
            fecha_generacion=datetime.now(),
            total_jugadores=len(ranking_list),
            periodo_inicio=None,
            periodo_fin=None,
            ranking=ranking_list
        )
        
    except Exception as e:
        # En caso de error, retornar ranking vacío
        print(f"Error en ranking multas: {e}")
        return dashboard_schemas.RankingMultasResponse(
            fecha_generacion=datetime.now(),
            total_jugadores=0,
            periodo_inicio=None,
            periodo_fin=None,
            ranking=[]
        )

def obtener_estadisticas_jugadores(db: Session) -> dashboard_schemas.EstadisticasJugadores:
    """
    Obtiene estadísticas completas de jugadores
    """
    try:
        # 1. Contadores básicos
        total_jugadores = db.query(models.Jugador).count()
        jugadores_activos = db.query(models.Jugador).filter(models.Jugador.activo == True).count()
        jugadores_inactivos = total_jugadores - jugadores_activos
        
        # 2. Distribución por edades
        from dateutil.relativedelta import relativedelta
        hoy = date.today()
        
        menores_20 = db.query(models.Jugador).filter(
            models.Jugador.fecha_nacimiento > hoy - relativedelta(years=20)
        ).count()
        
        entre_20_25 = db.query(models.Jugador).filter(
            and_(
                models.Jugador.fecha_nacimiento <= hoy - relativedelta(years=20),
                models.Jugador.fecha_nacimiento > hoy - relativedelta(years=25)
            )
        ).count()
        
        entre_25_30 = db.query(models.Jugador).filter(
            and_(
                models.Jugador.fecha_nacimiento <= hoy - relativedelta(years=25),
                models.Jugador.fecha_nacimiento > hoy - relativedelta(years=30)
            )
        ).count()
        
        mayores_30 = db.query(models.Jugador).filter(
            models.Jugador.fecha_nacimiento <= hoy - relativedelta(years=30)
        ).count()
        
        # 3. Estadísticas de pagos
        # Jugadores con mensualidades al día (este mes)
        mes_actual = hoy.month
        ano_actual = hoy.year
        
        jugadores_con_mensualidad_actual = db.query(models.Jugador.cedula)\
            .join(models.Mensualidad)\
            .filter(
                and_(
                    models.Mensualidad.mes == mes_actual,
                    models.Mensualidad.ano == ano_actual
                )
            ).distinct().count()
            
        # Promedio de aportes por jugador
        total_aportes = db.query(func.sum(models.OtroAporte.valor)).scalar() or 0.0
        promedio_aportes = total_aportes / total_jugadores if total_jugadores > 0 else 0.0
        
        # Top 3 jugadores por aportes
        top_aportantes = db.query(
            models.Jugador.nombre,
            func.sum(models.OtroAporte.valor).label('total_aportes')
        ).join(models.OtroAporte)\
         .group_by(models.Jugador.cedula, models.Jugador.nombre)\
         .order_by(desc('total_aportes'))\
         .limit(3).all()
        
        # Jugadores sin multas
        jugadores_con_multas = db.query(models.Jugador.cedula)\
            .join(models.Multa)\
            .filter(models.Multa.pagada == False)\
            .distinct().count()
            
        jugadores_sin_multas = total_jugadores - jugadores_con_multas
        
        return dashboard_schemas.EstadisticasJugadores(
            total_jugadores=total_jugadores,
            jugadores_activos=jugadores_activos,
            jugadores_inactivos=jugadores_inactivos,
            jugadores_sin_multas=jugadores_sin_multas,
            jugadores_con_mensualidad_actual=jugadores_con_mensualidad_actual,
            promedio_aportes_por_jugador=promedio_aportes,
            distribucion_edades={
                "menores_20": menores_20,
                "entre_20_25": entre_20_25,
                "entre_25_30": entre_25_30,
                "mayores_30": mayores_30
            },
            top_aportantes=[
                {"nombre": nombre, "total_aportes": float(total)} 
                for nombre, total in top_aportantes
            ],
            fecha_generacion=datetime.now()
        )
        
    except Exception as e:
        raise Exception(f"Error al obtener estadísticas de jugadores: {str(e)}")

def obtener_estadisticas_jugadores_simples(db: Session) -> dashboard_schemas.EstadisticasJugadoresSimples:
    """
    Obtiene estadísticas específicas de jugadores
    """
    try:
        # 1. Promedio de pagos por jugador (mensualidades + otros aportes)
        total_jugadores = db.query(models.Jugador).count()
        
        # Sumar mensualidades
        total_mensualidades = db.query(func.sum(models.Mensualidad.valor)).scalar() or 0.0
        # Sumar otros aportes  
        total_otros_aportes = db.query(func.sum(models.OtroAporte.valor)).scalar() or 0.0
        
        promedio_pagos = (float(total_mensualidades) + float(total_otros_aportes)) / max(total_jugadores, 1)
        
        # 2. Jugadores con mensualidades al día (últimos 3 meses)
        from datetime import date
        from dateutil.relativedelta import relativedelta
        
        fecha_limite = date.today() - relativedelta(months=3)
        
        # Contar jugadores que han pagado en los últimos 3 meses
        jugadores_con_mensualidades_recientes = db.query(models.Jugador.cedula).join(
            models.Mensualidad
        ).filter(
            models.Mensualidad.fecha_pago >= fecha_limite
        ).distinct().count()
        
        # 3. Top 3 jugadores por aportes (mensualidades + otros aportes)
        # Obtener aportes por jugador
        query_aportes = db.query(
            models.Jugador.nombre,
            (func.coalesce(func.sum(models.Mensualidad.valor), 0) + 
             func.coalesce(func.sum(models.OtroAporte.valor), 0)).label('total_aportes')
        ).select_from(models.Jugador)\
        .outerjoin(models.Mensualidad)\
        .outerjoin(models.OtroAporte)\
        .group_by(models.Jugador.cedula, models.Jugador.nombre)\
        .order_by(text('total_aportes DESC'))\
        .limit(3)
        
        top_aportantes = query_aportes.all()
        
        return dashboard_schemas.EstadisticasJugadoresSimples(
            promedio_pagos_por_jugador=promedio_pagos,
            jugadores_mensualidades_al_dia=jugadores_con_mensualidades_recientes,
            top_jugadores_aportes=[
                {"nombre": nombre, "total_aportes": float(total)} 
                for nombre, total in top_aportantes
            ],
            fecha_generacion=datetime.now()
        )
        
    except Exception as e:
        raise Exception(f"Error al obtener estadísticas de jugadores: {str(e)}")

def obtener_estado_pagos_jugadores_por_mes(db: Session, año: Optional[int] = None) -> List[dict]:
    """
    Obtiene el estado de pagos de todos los jugadores por mes
    """
    try:
        if año is None:
            año = datetime.now().year
            
        # Obtener todos los jugadores
        jugadores = db.query(models.Jugador).all()
        
        resultado = []
        
        for jugador in jugadores:
            estado_jugador = {
                'cedula': jugador.cedula,
                'nombre': jugador.nombre,
                'nombre_inscripcion': jugador.nombre_inscripcion,
                'estado_cuenta': jugador.estado_cuenta,
                'meses': {}
            }
            
            # Para cada mes del año, verificar si pagó
            for mes in range(1, 13):
                mensualidad = db.query(models.Mensualidad).filter(
                    models.Mensualidad.jugador_cedula == jugador.cedula,
                    models.Mensualidad.mes == mes,
                    models.Mensualidad.ano == año
                ).first()
                
                estado_jugador['meses'][str(mes)] = {
                    'pagado': mensualidad is not None,
                    'valor': mensualidad.valor if mensualidad else 0,
                    'fecha_pago': mensualidad.fecha_pago.isoformat() if mensualidad and mensualidad.fecha_pago is not None else None
                }
            
            # Agregar valor de multas pendientes
            total_multas_pendientes = db.query(func.sum(models.CausalMulta.valor))\
                                      .select_from(models.Multa)\
                                      .join(models.CausalMulta)\
                                      .filter(
                                          models.Multa.jugador_cedula == jugador.cedula,
                                          models.Multa.pagada == False
                                      ).scalar() or 0.0
            
            estado_jugador['valor_multas_pendientes'] = float(total_multas_pendientes)
            
            resultado.append(estado_jugador)
        
        return resultado
        
    except Exception as e:
        raise Exception(f"Error al obtener estado de pagos por mes: {str(e)}")
