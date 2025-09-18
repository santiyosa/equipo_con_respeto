from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from io import BytesIO
from database import get_db
from schemas import jugadores as schemas
from crud import jugadores as crud
import models

router = APIRouter()

@router.post("/jugadores/", response_model=schemas.Jugador)
def crear_jugador(jugador: schemas.JugadorCreate, db: Session = Depends(get_db)):
    """Crea un nuevo jugador"""
    return crud.create_jugador(db, jugador)

@router.get("/jugadores/", response_model=List[schemas.Jugador])
def listar_jugadores(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todos los jugadores"""
    return crud.get_jugadores(db, skip=skip, limit=limit)

@router.get("/jugadores/{cedula}", response_model=schemas.JugadorDetalle)
def obtener_jugador(cedula: str, db: Session = Depends(get_db)):
    """Obtiene los detalles de un jugador específico por cédula"""
    jugador = crud.get_jugador(db, cedula)
    if not jugador:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return jugador

@router.get("/jugadores/buscar/", response_model=List[schemas.Jugador])
def buscar_jugadores(
    termino: str = Query(..., min_length=3, description="Nombre o parte del nombre a buscar"),
    db: Session = Depends(get_db)
):
    """Busca jugadores por nombre, documento o alias"""
    return crud.buscar_jugadores(db, termino)

@router.get("/jugadores/{cedula}/estado-cuenta", response_model=schemas.EstadoCuentaJugador)
def obtener_estado_cuenta(cedula: str, db: Session = Depends(get_db)):
    """Obtiene el estado de cuenta detallado de un jugador por cédula"""
    try:
        return crud.get_estado_cuenta_jugador(db, cedula)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/jugadores/{cedula}", response_model=schemas.Jugador)
def actualizar_jugador(
    cedula: str, 
    jugador_data: schemas.JugadorUpdate, 
    db: Session = Depends(get_db)
):
    """Actualiza los datos de un jugador existente"""
    try:
        jugador_actualizado = crud.update_jugador(db, cedula, jugador_data)
        if not jugador_actualizado:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        return jugador_actualizado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/jugadores/{cedula}/estado", response_model=schemas.Jugador)
def cambiar_estado_jugador(
    cedula: str,
    estado_data: dict,
    db: Session = Depends(get_db)
):
    """Cambia el estado activo/inactivo de un jugador"""
    try:
        activo = estado_data.get("activo")
        if activo is None:
            raise HTTPException(status_code=400, detail="Campo 'activo' requerido")
        
        jugador_actualizado = crud.cambiar_estado_jugador(db, cedula, activo)
        if not jugador_actualizado:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        return jugador_actualizado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/jugadores/export/listado-basico/pdf")
async def exportar_listado_basico_pdf(
    solo_activos: bool = False,
    db: Session = Depends(get_db)
):
    """
    Exporta listado básico de jugadores con información actualizada del dashboard
    
    - solo_activos: Si es False (por defecto), incluye todos los jugadores (al día y morosos)
    - Si es True, solo incluye jugadores activos (estado_cuenta=True)
    - Incluye estadísticas del dashboard en el pie de página
    """
    try:
        from crud import dashboard as dashboard_crud
        from datetime import datetime
        
        # Obtener jugadores
        jugadores = crud.get_jugadores(db)
        if solo_activos:
            # Filtrar solo jugadores activos (excluir inactivos/retirados)
            jugadores = [j for j in jugadores if getattr(j, 'estado_cuenta', True)]
        
        if not jugadores:
            raise HTTPException(status_code=404, detail="No hay jugadores para exportar")
        
        # Obtener estadísticas del dashboard
        estadisticas = dashboard_crud.obtener_estadisticas_jugadores_simples(db)
        
        # Crear reporte básico
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Título con información adicional
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "LISTADO BÁSICO DE JUGADORES - ESTADO DE CUENTA")
        
        # Subtítulo con estadísticas
        p.setFont("Helvetica", 10)
        subtitle = f"Total: {len(jugadores)} jugadores | Al día: {estadisticas.jugadores_mensualidades_al_dia} | Promedio Pagos: ${estadisticas.promedio_pagos_por_jugador:,.0f}"
        p.drawString(50, height - 75, subtitle)
        
        # Headers
        y_position = height - 110
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y_position, "NOMBRE")
        p.drawString(200, y_position, "ALIAS")
        p.drawString(350, y_position, "ESTADO")
        p.drawString(450, y_position, "MULTAS")
        
        # Data
        p.setFont("Helvetica", 9)
        y_position -= 20
        
        for jugador in jugadores:
            if y_position < 80:  # Nueva página
                p.showPage()
                y_position = height - 50
                p.setFont("Helvetica", 9)
            
            nombre = str(getattr(jugador, 'nombre', ''))[:20]
            alias = str(getattr(jugador, 'nombre_inscripcion', ''))[:15]
            cedula = str(getattr(jugador, 'cedula', ''))
            
            # Calcular estado de deuda real consultando multas pendientes
            multas_pendientes = db.query(models.Multa).filter(
                models.Multa.jugador_cedula == cedula,
                models.Multa.pagada == False
            ).count()
            
            # Calcular total de multas pendientes usando join con causales
            total_multas = db.query(func.sum(models.CausalMulta.valor)).join(
                models.Multa, models.CausalMulta.id == models.Multa.causal_id
            ).filter(
                models.Multa.jugador_cedula == cedula,
                models.Multa.pagada == False
            ).scalar() or 0
            
            estado_deuda = "CON MULTAS" if multas_pendientes > 0 else "AL DÍA"
            valor_multas = f"${total_multas:,.0f}" if total_multas > 0 else "$0"
            
            p.drawString(50, y_position, nombre)
            p.drawString(200, y_position, alias)
            p.drawString(350, y_position, estado_deuda)
            p.drawString(450, y_position, valor_multas)
            y_position -= 15
        
        # Pie de página con estadísticas adicionales
        p.setFont("Helvetica", 8)
        p.drawString(50, 40, f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')} | Sistema de Gestión Deportiva")
        
        # Top aportantes en pie de página
        if estadisticas.top_jugadores_aportes:
            top_text = "Top Aportantes: "
            for i, aportante in enumerate(estadisticas.top_jugadores_aportes[:3]):
                if i > 0:
                    top_text += ", "
                top_text += f"{aportante['nombre']} (${aportante['total_aportes']:,.0f})"
            p.drawString(50, 25, top_text[:120] + "..." if len(top_text) > 120 else top_text)
        
        p.save()
        buffer.seek(0)
        
        return StreamingResponse(
            BytesIO(buffer.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=listado-basico-jugadores.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")

@router.get("/jugadores/export/listado-completo/pdf")
async def exportar_listado_completo_pdf(
    solo_activos: bool = False,
    db: Session = Depends(get_db)
):
    """
    Exporta listado completo de jugadores (todos los datos) a PDF
    
    - solo_activos: Si es False (por defecto), incluye todos los jugadores (al día y morosos)
    - Si es True, solo incluye jugadores activos (estado_cuenta=True)
    - Excluye solo los jugadores verdaderamente inactivos/retirados
    """
    try:
        # Obtener jugadores
        jugadores = crud.get_jugadores(db)
        if solo_activos:
            # Filtrar solo jugadores activos (excluir inactivos/retirados)
            jugadores = [j for j in jugadores if getattr(j, 'estado_cuenta', True)]
        
        if not jugadores:
            raise HTTPException(status_code=404, detail="No hay jugadores para exportar")
        
        # Crear reporte completo
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Título
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "LISTADO COMPLETO DE JUGADORES")
        
        y_position = height - 100
        
        for jugador in jugadores:
            if y_position < 100:  # Nueva página
                p.showPage()
                y_position = height - 50
            
            # Información del jugador
            nombre = str(getattr(jugador, 'nombre', ''))
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y_position, nombre)
            y_position -= 20
            
            cedula = str(getattr(jugador, 'cedula', ''))
            alias = str(getattr(jugador, 'nombre_inscripcion', ''))
            telefono = str(getattr(jugador, 'telefono', ''))
            talla = str(getattr(jugador, 'talla_uniforme', ''))
            numero = getattr(jugador, 'numero_camiseta', None)
            contacto_emergencia = str(getattr(jugador, 'contacto_emergencia_nombre', ''))
            contacto_telefono = str(getattr(jugador, 'contacto_emergencia_telefono', ''))
            
            # Calcular estado de deuda real consultando multas pendientes
            multas_pendientes = db.query(models.Multa).filter(
                models.Multa.jugador_cedula == cedula,
                models.Multa.pagada == False
            ).count()
            
            # Calcular total de multas pendientes usando join con causales
            total_multas = db.query(func.sum(models.CausalMulta.valor)).join(
                models.Multa, models.CausalMulta.id == models.Multa.causal_id
            ).filter(
                models.Multa.jugador_cedula == cedula,
                models.Multa.pagada == False
            ).scalar() or 0
            
            estado_deuda = "CON MULTAS PENDIENTES" if multas_pendientes > 0 else "AL DÍA"
            
            p.setFont("Helvetica", 10)
            p.drawString(70, y_position, f"Cédula: {cedula}")
            y_position -= 15
            p.drawString(70, y_position, f"Alias: {alias}")
            y_position -= 15
            p.drawString(70, y_position, f"Teléfono: {telefono}")
            y_position -= 15
            p.drawString(70, y_position, f"Contacto Emergencia: {contacto_emergencia}")
            y_position -= 15
            p.drawString(70, y_position, f"Teléfono Emergencia: {contacto_telefono}")
            y_position -= 15
            p.drawString(70, y_position, f"Talla: {talla}")
            y_position -= 15
            if numero is not None:
                p.drawString(70, y_position, f"Número: {numero}")
                y_position -= 15
            p.drawString(70, y_position, f"Estado financiero: {estado_deuda}")
            y_position -= 15
            if multas_pendientes > 0:
                p.drawString(70, y_position, f"Total multas pendientes: ${total_multas:,.0f}")
                y_position -= 15
            p.drawString(70, y_position, f"Estado en equipo: {'ACTIVO' if getattr(jugador, 'estado_cuenta', True) else 'INACTIVO'}")
            y_position -= 25
        
        p.save()
        buffer.seek(0)
        
        return StreamingResponse(
            BytesIO(buffer.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=listado-completo-jugadores.pdf"}
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error en export detallado: {error_details}")  # Para debug
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")

@router.get("/jugadores/export/pagos-mensuales/pdf")
async def exportar_listado_pagos_mensuales_pdf(
    año: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Exporta listado de jugadores con estado de pagos mensuales usando información del dashboard
    """
    try:
        from crud import dashboard as dashboard_crud
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.platypus import Table, TableStyle
        from datetime import datetime
        
        # Obtener datos del dashboard
        jugadores_pagos = dashboard_crud.obtener_estado_pagos_jugadores_por_mes(db, año)
        
        if not jugadores_pagos:
            raise HTTPException(status_code=404, detail="No hay datos de pagos para exportar")
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)
        
        # Título
        año_actual = año or datetime.now().year
        p.setFont("Helvetica-Bold", 16)
        title = f"ESTADO DE PAGOS MENSUALES - {año_actual}"
        title_width = p.stringWidth(title, "Helvetica-Bold", 16)
        p.drawString((width - title_width) / 2, height - 50, title)
        
        # Subtítulo con estadísticas
        estadisticas = dashboard_crud.obtener_estadisticas_jugadores_simples(db)
        p.setFont("Helvetica", 10)
        subtitle = f"Total Jugadores: {len(jugadores_pagos)} | Promedio Pagos: ${estadisticas.promedio_pagos_por_jugador:,.0f} | Al Día: {estadisticas.jugadores_mensualidades_al_dia}"
        subtitle_width = p.stringWidth(subtitle, "Helvetica", 10)
        p.drawString((width - subtitle_width) / 2, height - 70, subtitle)
        
        # Preparar datos para la tabla
        months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        
        # Headers
        headers = ['Jugador'] + months + ['Multas', 'Estado']
        table_data = [headers]
        
        # Datos de jugadores
        for jugador_data in jugadores_pagos:
            nombre = jugador_data['nombre_inscripcion'] or jugador_data['nombre']
            row = [nombre[:15]]  # Nombre corto
            
            # Estados de pago por mes
            for mes in range(1, 13):
                mes_data = jugador_data['meses'].get(str(mes), {'pagado': False})
                estado = '✓' if mes_data['pagado'] else '✗'
                row.append(estado)
            
            # Multas pendientes
            multas = f"${jugador_data['valor_multas_pendientes']:,.0f}" if jugador_data['valor_multas_pendientes'] > 0 else "-"
            row.append(multas)
            
            # Estado general
            estado = 'Al día' if jugador_data['estado_cuenta'] else 'Pendiente'
            row.append(estado)
            
            table_data.append(row)
        
        # Crear tabla
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        # Posicionar tabla
        table.wrapOn(p, width, height)
        table.drawOn(p, 30, height - 200 - len(table_data) * 15)
        
        # Pie de página
        p.setFont("Helvetica", 8)
        p.drawString(30, 30, f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        p.drawString(30, 15, "✓ = Pagado | ✗ = Pendiente")
        
        p.save()
        buffer.seek(0)
        
        return StreamingResponse(
            BytesIO(buffer.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=pagos-mensuales-{año_actual}.pdf"}
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error en export pagos mensuales: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")
