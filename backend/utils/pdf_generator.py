"""
Generador base de reportes PDF para el sistema de gestión del equipo
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Union
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from io import BytesIO
import tempfile
import os

class PDFGenerator:
    """Generador base para reportes PDF con estilos corporativos"""
    
    def __init__(self, title: str = "Reporte del Equipo", author: str = "Sistema de Gestión"):
        self.title = title
        self.author = author
        self.page_width, self.page_height = A4
        self.margin = 2 * cm
        self.styles = self._create_styles()
        self.story = []
        
    def _create_styles(self):
        """Crear estilos personalizados para el documento"""
        styles = getSampleStyleSheet()
        
        # Estilo para el título principal
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),  # Verde oscuro deportivo
            alignment=TA_CENTER,
            spaceAfter=30,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para subtítulos
        styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2d5a3d'),
            spaceBefore=20,
            spaceAfter=10,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Estilo para información destacada
        styles.add(ParagraphStyle(
            name='Highlight',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#d32f2f'),  # Rojo para alertas
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para métricas importantes
        styles.add(ParagraphStyle(
            name='Metric',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#1976d2'),  # Azul para métricas
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        return styles
    
    def add_header(self, equipo_nombre: str = "Equipo de Fútbol"):
        """Agregar header corporativo al documento"""
        # Título principal
        title_text = f"📊 {self.title}"
        self.story.append(Paragraph(title_text, self.styles['CustomTitle']))
        
        # Información del equipo y fecha
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        header_info = f"""
        <b>{equipo_nombre}</b><br/>
        Fecha de generación: {fecha_actual}<br/>
        Sistema de Gestión Deportiva
        """
        self.story.append(Paragraph(header_info, self.styles['CustomNormal']))
        self.story.append(Spacer(1, 20))
        
        # Línea separadora
        self._add_line_separator()
    
    def add_section_title(self, title: str):
        """Agregar título de sección"""
        self.story.append(Spacer(1, 15))
        self.story.append(Paragraph(title, self.styles['CustomHeading2']))
        self.story.append(Spacer(1, 10))
    
    def add_metrics_grid(self, metrics: List[Dict[str, Any]]):
        """Agregar grid de métricas importantes"""
        if not metrics:
            return
            
        # Crear tabla de métricas (2 columnas)
        data = []
        row = []
        
        for i, metric in enumerate(metrics):
            metric_text = f"""
            <b>{metric.get('label', 'Métrica')}</b><br/>
            <font size="16" color="#1976d2">{metric.get('value', '0')}</font><br/>
            <font size="8">{metric.get('description', '')}</font>
            """
            row.append(Paragraph(metric_text, self.styles['CustomNormal']))
            
            # Cada 2 métricas, crear nueva fila
            if (i + 1) % 2 == 0:
                data.append(row)
                row = []
        
        # Agregar última fila si es impar
        if row:
            if len(row) == 1:
                row.append('')  # Celda vacía
            data.append(row)
        
        if data:
            table = Table(data, colWidths=[8*cm, 8*cm])
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
            ]))
            self.story.append(table)
            self.story.append(Spacer(1, 15))
    
    def add_table(self, data: List[List[str]], headers: List[str], title: Optional[str] = None):
        """Agregar tabla con datos"""
        if title:
            self.add_section_title(title)
        
        if not data:
            self.story.append(Paragraph("No hay datos disponibles", self.styles['CustomNormal']))
            return
        
        # Preparar datos con headers
        table_data = [headers] + data
        
        # Calcular ancho de columnas dinámicamente
        num_cols = len(headers)
        col_width = (self.page_width - 2 * self.margin) / num_cols
        col_widths = [col_width] * num_cols
        
        table = Table(table_data, colWidths=col_widths)
        
        # Estilo de la tabla
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a472a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Datos
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            
            # Filas alternadas
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
        ]))
        
        self.story.append(table)
        self.story.append(Spacer(1, 15))
    
    def add_alert_section(self, alerts: List[Dict[str, str]]):
        """Agregar sección de alertas importantes"""
        if not alerts:
            return
            
        self.add_section_title("⚠️ Alertas y Problemas Prioritarios")
        
        for alert in alerts:
            alert_text = f"🔸 <b>{alert.get('tipo', 'Alerta')}</b>: {alert.get('mensaje', '')}"
            self.story.append(Paragraph(alert_text, self.styles['Highlight']))
            self.story.append(Spacer(1, 5))
    
    def add_chart_placeholder(self, chart_title: str, chart_description: str = ""):
        """Agregar placeholder para gráficos (implementar después)"""
        self.add_section_title(f"📈 {chart_title}")
        
        # Por ahora, agregar texto descriptivo
        chart_text = f"[Gráfico: {chart_title}]"
        if chart_description:
            chart_text += f"<br/>{chart_description}"
        
        self.story.append(Paragraph(chart_text, self.styles['CustomNormal']))
        self.story.append(Spacer(1, 15))
    
    def _add_line_separator(self):
        """Agregar línea separadora visual"""
        from reportlab.platypus import HRFlowable
        self.story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a472a')))
        self.story.append(Spacer(1, 10))
    
    def add_footer_info(self):
        """Agregar información del pie de página"""
        self.story.append(Spacer(1, 20))
        self._add_line_separator()
        
        footer_text = f"""
        <font size="8">
        Reporte generado automáticamente por el Sistema de Gestión del Equipo<br/>
        Fecha y hora: {datetime.now().strftime("%d/%m/%Y a las %H:%M")}<br/>
        Para consultas o aclaraciones, contactar con la administración del equipo
        </font>
        """
        self.story.append(Paragraph(footer_text, self.styles['CustomNormal']))
    
    def build_pdf(self, filename: Optional[str] = None) -> Union[BytesIO, str]:
        """Generar el archivo PDF"""
        if filename is None:
            # Usar BytesIO para retornar el PDF como stream
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, 
                                  rightMargin=self.margin, leftMargin=self.margin,
                                  topMargin=self.margin, bottomMargin=self.margin)
        else:
            doc = SimpleDocTemplate(filename, pagesize=A4,
                                  rightMargin=self.margin, leftMargin=self.margin,
                                  topMargin=self.margin, bottomMargin=self.margin)
            buffer = None
        
        # Configurar metadata del documento
        doc.title = self.title
        doc.author = self.author
        
        # Generar el PDF
        doc.build(self.story)
        
        if buffer:
            buffer.seek(0)
            return buffer
        else:
            return filename or "reporte.pdf"
