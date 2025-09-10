from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, date
from typing import Optional, List
import models
import schemas

def calcular_estado_cuenta_equipo(
    db: Session,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> schemas.EstadoCuentaEquipo:
    """
    Calcula el estado de cuenta completo del equipo
    
    Args:
        db: Sesión de base de datos
        fecha_inicio: Fecha de inicio del período (opcional)
        fecha_fin: Fecha de fin del período (opcional)
    
    Returns:
        EstadoCuentaEquipo con todos los cálculos
    """
    
    # 1. INGRESOS POR MENSUALIDADES
    query_mensualidades = db.query(func.coalesce(func.sum(models.Mensualidad.valor), 0))
    if fecha_inicio:
        query_mensualidades = query_mensualidades.filter(models.Mensualidad.fecha_pago >= fecha_inicio)
    if fecha_fin:
        query_mensualidades = query_mensualidades.filter(models.Mensualidad.fecha_pago <= fecha_fin)
    
    total_ingresos_mensualidades = query_mensualidades.scalar()
    
    # 2. INGRESOS POR MULTAS PAGADAS
    query_multas = db.query(func.coalesce(func.sum(models.CausalMulta.valor), 0))\
        .join(models.Multa, models.CausalMulta.id == models.Multa.causal_id)\
        .filter(models.Multa.pagada == True)
    
    if fecha_inicio:
        query_multas = query_multas.filter(models.Multa.fecha_pago >= fecha_inicio)
    if fecha_fin:
        query_multas = query_multas.filter(models.Multa.fecha_pago <= fecha_fin)
    
    total_ingresos_multas = query_multas.scalar()
    
    # 3. OTROS APORTES
    query_otros_aportes = db.query(func.coalesce(func.sum(models.OtroAporte.valor), 0))
    if fecha_inicio:
        query_otros_aportes = query_otros_aportes.filter(models.OtroAporte.fecha_aporte >= fecha_inicio)
    if fecha_fin:
        query_otros_aportes = query_otros_aportes.filter(models.OtroAporte.fecha_aporte <= fecha_fin)
    
    total_otros_aportes = query_otros_aportes.scalar()
    
    # 4. TOTAL INGRESOS
    total_ingresos = total_ingresos_mensualidades + total_ingresos_multas + total_otros_aportes
    
    # 5. EGRESOS TOTALES
    query_egresos = db.query(func.coalesce(func.sum(models.Egreso.valor), 0))
    if fecha_inicio:
        query_egresos = query_egresos.filter(models.Egreso.fecha >= fecha_inicio)
    if fecha_fin:
        query_egresos = query_egresos.filter(models.Egreso.fecha <= fecha_fin)
    
    total_egresos = query_egresos.scalar()
    
    # 6. SALDO ACTUAL
    saldo_actual = total_ingresos - total_egresos
    
    # 7. EGRESOS POR CATEGORÍA
    egresos_por_categoria = obtener_egresos_por_categoria(db, fecha_inicio, fecha_fin)
    
    return schemas.EstadoCuentaEquipo(
        total_ingresos_mensualidades=float(total_ingresos_mensualidades),
        total_ingresos_multas=float(total_ingresos_multas),
        total_otros_aportes=float(total_otros_aportes),
        total_ingresos=float(total_ingresos),
        total_egresos=float(total_egresos),
        saldo_actual=float(saldo_actual),
        egresos_por_categoria=egresos_por_categoria,
        fecha_calculo=datetime.now(),
        periodo_inicio=fecha_inicio,
        periodo_fin=fecha_fin
    )

def obtener_egresos_por_categoria(
    db: Session,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> List[schemas.EgresoPorCategoria]:
    """
    Obtiene un resumen de egresos agrupados por categoría
    """
    query = db.query(
        models.CategoriaEgreso.id,
        models.CategoriaEgreso.nombre,
        func.coalesce(func.sum(models.Egreso.valor), 0).label('total'),
        func.count(models.Egreso.id).label('cantidad')
    ).outerjoin(models.Egreso)\
     .group_by(models.CategoriaEgreso.id, models.CategoriaEgreso.nombre)
    
    if fecha_inicio:
        query = query.filter(models.Egreso.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.Egreso.fecha <= fecha_fin)
    
    resultados = query.all()
    
    return [
        schemas.EgresoPorCategoria(
            categoria_id=resultado.id,
            categoria_nombre=resultado.nombre,
            total_categoria=float(resultado.total),
            cantidad_egresos=resultado.cantidad
        )
        for resultado in resultados
    ]

def obtener_resumen_financiero_mensual(
    db: Session,
    año: Optional[int] = None,
    mes: Optional[int] = None
) -> schemas.ResumenFinancieroEquipo:
    """
    Obtiene un resumen financiero del mes actual o del mes especificado
    """
    if not año:
        año = datetime.now().year
    if not mes:
        mes = datetime.now().month
    
    # Ingresos del mes
    ingresos_mensualidades = db.query(func.coalesce(func.sum(models.Mensualidad.valor), 0))\
        .filter(
            extract('year', models.Mensualidad.fecha_pago) == año,
            extract('month', models.Mensualidad.fecha_pago) == mes
        ).scalar()
    
    ingresos_multas = db.query(func.coalesce(func.sum(models.CausalMulta.valor), 0))\
        .join(models.Multa, models.CausalMulta.id == models.Multa.causal_id)\
        .filter(
            models.Multa.pagada == True,
            extract('year', models.Multa.fecha_pago) == año,
            extract('month', models.Multa.fecha_pago) == mes
        ).scalar()
    
    ingresos_otros = db.query(func.coalesce(func.sum(models.OtroAporte.valor), 0))\
        .filter(
            extract('year', models.OtroAporte.fecha_aporte) == año,
            extract('month', models.OtroAporte.fecha_aporte) == mes
        ).scalar()
    
    total_ingresos_mes = ingresos_mensualidades + ingresos_multas + ingresos_otros
    
    # Egresos del mes
    total_egresos_mes = db.query(func.coalesce(func.sum(models.Egreso.valor), 0))\
        .filter(
            extract('year', models.Egreso.fecha) == año,
            extract('month', models.Egreso.fecha) == mes
        ).scalar()
    
    # Saldo actual total (histórico)
    estado_total = calcular_estado_cuenta_equipo(db)
    
    return schemas.ResumenFinancieroEquipo(
        saldo_actual=estado_total.saldo_actual,
        total_ingresos_mes_actual=float(total_ingresos_mes),
        total_egresos_mes_actual=float(total_egresos_mes),
        diferencia_mes_actual=float(total_ingresos_mes - total_egresos_mes)
    )

def obtener_saldo_actual(db: Session) -> float:
    """
    Obtiene únicamente el saldo actual del equipo (función rápida)
    """
    # Total ingresos históricos
    total_mensualidades = db.query(func.coalesce(func.sum(models.Mensualidad.valor), 0)).scalar()
    
    total_multas = db.query(func.coalesce(func.sum(models.CausalMulta.valor), 0))\
        .join(models.Multa, models.CausalMulta.id == models.Multa.causal_id)\
        .filter(models.Multa.pagada == True).scalar()
    
    total_otros_aportes = db.query(func.coalesce(func.sum(models.OtroAporte.valor), 0)).scalar()
    
    total_ingresos = total_mensualidades + total_multas + total_otros_aportes
    
    # Total egresos históricos
    total_egresos = db.query(func.coalesce(func.sum(models.Egreso.valor), 0)).scalar()
    
    return float(total_ingresos - total_egresos)
