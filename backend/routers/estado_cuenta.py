from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date
import crud
import schemas
from database import get_db

router = APIRouter()

@router.get("/estado-cuenta-equipo/", response_model=schemas.EstadoCuentaEquipo)
def obtener_estado_cuenta_equipo(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del período (YYYY-MM-DD HH:MM:SS)"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del período (YYYY-MM-DD HH:MM:SS)"),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de cuenta completo del equipo.
    
    Incluye:
    - Total de ingresos por mensualidades
    - Total de ingresos por multas pagadas  
    - Total de otros aportes
    - Total de egresos
    - Saldo actual (ingresos - egresos)
    - Detalle de egresos por categoría
    
    Si no se especifican fechas, calcula desde el inicio de los tiempos.
    """
    try:
        estado_cuenta = crud.calcular_estado_cuenta_equipo(
            db=db,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return estado_cuenta
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular estado de cuenta: {str(e)}")

@router.get("/saldo-actual/")
def obtener_saldo_actual(db: Session = Depends(get_db)):
    """
    Obtiene únicamente el saldo actual del equipo (función rápida).
    
    Returns:
        dict: {"saldo_actual": float}
    """
    try:
        saldo = crud.obtener_saldo_actual(db=db)
        return {"saldo_actual": saldo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener saldo: {str(e)}")

@router.get("/resumen-financiero-mensual/", response_model=schemas.ResumenFinancieroEquipo)
def obtener_resumen_financiero_mensual(
    año: Optional[int] = Query(None, description="Año (por defecto: año actual)"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes (1-12, por defecto: mes actual)"),
    db: Session = Depends(get_db)
):
    """
    Obtiene un resumen financiero del mes especificado o del mes actual.
    
    Incluye:
    - Saldo actual total del equipo
    - Ingresos del mes especificado
    - Egresos del mes especificado  
    - Diferencia del mes (ingresos - egresos)
    """
    try:
        if año and (año < 2020 or año > 2030):
            raise HTTPException(status_code=400, detail="El año debe estar entre 2020 y 2030")
            
        resumen = crud.obtener_resumen_financiero_mensual(
            db=db,
            año=año,
            mes=mes
        )
        return resumen
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen financiero: {str(e)}")

@router.get("/egresos-por-categoria/", response_model=list[schemas.EgresoPorCategoria])
def obtener_egresos_por_categoria(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del período"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del período"),
    db: Session = Depends(get_db)
):
    """
    Obtiene un resumen de egresos agrupados por categoría.
    
    Para cada categoría muestra:
    - Nombre de la categoría
    - Total gastado en la categoría
    - Cantidad de egresos registrados
    """
    try:
        egresos = crud.obtener_egresos_por_categoria(
            db=db,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return egresos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener egresos por categoría: {str(e)}")

@router.get("/estado-cuenta-periodo/", response_model=schemas.EstadoCuentaEquipo)
def obtener_estado_cuenta_periodo(
    año: int = Query(..., description="Año del período"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes específico (opcional)"),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de cuenta del equipo para un período específico (año o año-mes).
    
    Si solo se especifica el año, calcula todo el año.
    Si se especifica año y mes, calcula solo ese mes.
    """
    try:
        if año < 2020 or año > 2030:
            raise HTTPException(status_code=400, detail="El año debe estar entre 2020 y 2030")
        
        if mes:
            # Período específico de un mes
            fecha_inicio = datetime(año, mes, 1)
            if mes == 12:
                fecha_fin = datetime(año + 1, 1, 1)
            else:
                fecha_fin = datetime(año, mes + 1, 1)
        else:
            # Todo el año
            fecha_inicio = datetime(año, 1, 1)
            fecha_fin = datetime(año + 1, 1, 1)
        
        estado_cuenta = crud.calcular_estado_cuenta_equipo(
            db=db,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return estado_cuenta
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular estado de cuenta del período: {str(e)}")
