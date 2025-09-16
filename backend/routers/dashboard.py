from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from io import BytesIO

from database import get_db
from crud import dashboard as dashboard_crud
from schemas import dashboard as dashboard_schemas
from reportes.dashboard_report import ReporteDashboard

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/estadisticas-jugadores-simples", response_model=dashboard_schemas.EstadisticasJugadoresSimples)
async def obtener_estadisticas_jugadores_simples(db: Session = Depends(get_db)):
    """
    Obtiene estadísticas simplificadas de jugadores para el dashboard.
    
    Incluye:
    - Promedio de pagos por jugador
    - Jugadores con mensualidades al día
    - Top jugadores por aportes
    """
    try:
        return dashboard_crud.obtener_estadisticas_jugadores_simples(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas de jugadores: {str(e)}"
        )

@router.get("/estado-pagos-por-mes")
async def obtener_estado_pagos_jugadores_por_mes(
    año: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de pagos de todos los jugadores por mes.
    
    - **año**: Año para consultar (opcional, por defecto año actual)
    """
    try:
        return dashboard_crud.obtener_estado_pagos_jugadores_por_mes(db, año)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estado de pagos por mes: {str(e)}"
        )

@router.get("/ranking-multas", response_model=dashboard_schemas.RankingMultasResponse)
async def obtener_ranking_jugadores_multas(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    incluir_solo_con_multas: bool = True,
    limite: int = 50,
    incluir_pagadas: bool = True,
    incluir_pendientes: bool = True,
    db: Session = Depends(get_db)
):
    """
    Obtiene el ranking de jugadores ordenados por cantidad de multas.
    
    - **fecha_inicio**: Fecha de inicio del período (opcional)
    - **fecha_fin**: Fecha de fin del período (opcional)
    - **incluir_solo_con_multas**: Si solo incluir jugadores que tienen multas
    - **limite**: Número máximo de jugadores en el ranking (máximo 100)
    - **incluir_pagadas**: Si incluir multas ya pagadas en el conteo
    - **incluir_pendientes**: Si incluir multas pendientes en el conteo
    """
    
    # Validar parámetros
    if limite > 100:
        raise HTTPException(
            status_code=400,
            detail="El límite máximo permitido es 100 jugadores"
        )
    
    if not incluir_pagadas and not incluir_pendientes:
        raise HTTPException(
            status_code=400,
            detail="Debe incluir al menos un tipo de multa (pagadas o pendientes)"
        )
    
    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio no puede ser posterior a la fecha de fin"
        )
    
    try:
        ranking = dashboard_crud.obtener_ranking_jugadores_multas(
            db=db,
            limite=limite
        )
        return ranking
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar el ranking: {str(e)}"
        )

@router.get("/estadisticas-multas", response_model=dashboard_schemas.EstadisticasMultas)
async def obtener_estadisticas_multas(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas generales sobre las multas del equipo.
    
    - **fecha_inicio**: Fecha de inicio del período (opcional)
    - **fecha_fin**: Fecha de fin del período (opcional)
    """
    
    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio no puede ser posterior a la fecha de fin"
        )
    
    try:
        estadisticas = dashboard_crud.obtener_estadisticas_multas(
            db=db,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return estadisticas
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/resumen", response_model=dashboard_schemas.ResumenDashboard)
async def obtener_resumen_dashboard(db: Session = Depends(get_db)):
    """
    Obtiene un resumen ejecutivo para el dashboard principal.
    
    Incluye información financiera actual, estadísticas de jugadores
    y el top 3 de jugadores con más multas.
    """
    
    try:
        resumen = dashboard_crud.obtener_resumen_dashboard(db=db)
        return resumen
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resumen del dashboard: {str(e)}"
        )

@router.get("/reporte-ejecutivo/pdf")
async def generar_reporte_ejecutivo_pdf(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    incluir_detalles: bool = True,
    db: Session = Depends(get_db)
):
    """
    Genera un reporte PDF ejecutivo del dashboard.
    
    Incluye:
    - Métricas principales del equipo
    - Ranking de jugadores con más multas
    - Jugadores con cuotas pendientes  
    - Estado financiero resumido
    - Alertas prioritarias
    
    - **fecha_inicio**: Filtrar datos desde fecha específica (opcional)
    - **fecha_fin**: Filtrar datos hasta fecha específica (opcional)
    - **incluir_detalles**: Si incluir información adicional detallada
    """
    
    try:
        # Crear generador de reporte
        reporte = ReporteDashboard(db)
        
        # Generar PDF
        pdf_bytes = reporte.generar_reporte_ejecutivo(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            incluir_detalles=incluir_detalles
        )
        
        # Crear stream de respuesta
        pdf_stream = BytesIO(pdf_bytes)
        
        # Generar nombre de archivo con fecha
        fecha_actual = date.today().strftime("%Y%m%d")
        filename = f"reporte_ejecutivo_{fecha_actual}.pdf"
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar el reporte PDF: {str(e)}"
        )

@router.get("/ultimos-egresos")
async def obtener_ultimos_egresos(
    limite: int = 5,
    db: Session = Depends(get_db)
):
    """
    Obtiene los últimos egresos registrados en el sistema.
    
    - **limite**: Número de egresos a retornar (máximo 10, default 5)
    
    Retorna información detallada de los egresos más recientes
    incluyendo descripción, valor, fecha y categoría.
    """
    
    # Validar parámetros
    if limite > 10:
        raise HTTPException(
            status_code=400,
            detail="El límite máximo permitido es 10 egresos"
        )
    
    if limite < 1:
        raise HTTPException(
            status_code=400,
            detail="El límite debe ser al menos 1"
        )
    
    try:
        egresos = dashboard_crud.obtener_ultimos_egresos(db=db, limite=limite)
        return {
            "egresos": egresos,
            "total": len(egresos),
            "limite_solicitado": limite
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener últimos egresos: {str(e)}"
        )
