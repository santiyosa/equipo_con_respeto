"""
Generador de reportes específicos para el dashboard del equipo
"""

from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, date
from io import BytesIO
from crud import dashboard as dashboard_crud
from crud import estado_cuenta as estado_cuenta_crud
from utils.pdf_generator import PDFGenerator
import models
from sqlalchemy import func

class ReporteDashboard:
    """Generador de reporte PDF del dashboard ejecutivo"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def generar_reporte_ejecutivo(
        self,
        fecha_inicio: Optional[date] = None,
        fecha_fin: Optional[date] = None,
        incluir_detalles: bool = True
    ) -> bytes:
        """
        Generar reporte PDF ejecutivo con:
        - Ranking de jugadores con más multas
        - Jugadores con cuotas pendientes  
        - Estado financiero general
        - Alertas prioritarias
        """
        
        # Crear generador PDF
        pdf = PDFGenerator(
            title="Reporte Ejecutivo del Equipo",
            author="Sistema de Gestión Deportiva"
        )
        
        # Header del documento
        pdf.add_header("⚽ Club Deportivo")
        
        # 1. Métricas principales
        metricas = self._obtener_metricas_principales()
        pdf.add_metrics_grid(metricas)
        
        # 2. Alertas prioritarias
        alertas = self._obtener_alertas_prioritarias()
        pdf.add_alert_section(alertas)
        
        # 3. Ranking de multas
        ranking_multas = self._obtener_ranking_multas_resumido()
        pdf.add_table(
            data=ranking_multas['data'],
            headers=ranking_multas['headers'],
            title="🏆 Top 10 - Jugadores con Más Multas"
        )
        
        # 4. Jugadores con cuotas pendientes
        cuotas_pendientes = self._obtener_cuotas_pendientes()
        pdf.add_table(
            data=cuotas_pendientes['data'],
            headers=cuotas_pendientes['headers'],
            title="💰 Jugadores con Cuotas Pendientes"
        )
        
        # 5. Estado financiero resumido
        estado_financiero = self._obtener_estado_financiero_resumido()
        pdf.add_table(
            data=estado_financiero['data'],
            headers=estado_financiero['headers'],
            title="📊 Resumen Financiero"
        )
        
        # 6. Información adicional si se requiere
        if incluir_detalles:
            detalles_adicionales = self._obtener_detalles_adicionales()
            pdf.add_table(
                data=detalles_adicionales['data'],
                headers=detalles_adicionales['headers'],
                title="📋 Información Adicional"
            )
        
        # Footer
        pdf.add_footer_info()
        
        # Generar y retornar PDF
        buffer = pdf.build_pdf()
        if isinstance(buffer, BytesIO):
            return buffer.getvalue()
        else:
            # Si es un archivo, retornar bytes vacío por ahora
            return b''
    
    def _obtener_metricas_principales(self) -> List[Dict[str, Any]]:
        """Obtener métricas principales para el dashboard"""
        
        # Total de jugadores
        total_jugadores = self.db.query(models.Jugador).count()
        
        # Jugadores al día
        jugadores_al_dia = self.db.query(models.Jugador)\
                                 .filter(models.Jugador.estado_cuenta == True).count()
        
        # Total de multas pendientes (conteo)
        multas_pendientes = self.db.query(models.Multa)\
                                  .filter(models.Multa.pagada == False).count()
        
        # Valor total de multas pendientes
        valor_multas_pendientes = self.db.query(func.sum(models.CausalMulta.valor))\
                                        .select_from(models.Multa)\
                                        .join(models.CausalMulta)\
                                        .filter(models.Multa.pagada == False)\
                                        .scalar() or 0
        
        # Saldo actual del equipo
        saldo_actual = estado_cuenta_crud.obtener_saldo_actual(self.db)
        
        # Jugadores con multas (únicos)
        jugadores_con_multas = self.db.query(models.Multa.jugador_cedula)\
                                     .filter(models.Multa.pagada == False)\
                                     .distinct().count()
        
        return [
            {
                'label': 'Total Jugadores',
                'value': str(total_jugadores),
                'description': 'Jugadores registrados'
            },
            {
                'label': 'Jugadores al Día',
                'value': f"{jugadores_al_dia}/{total_jugadores}",
                'description': f'{round(jugadores_al_dia/total_jugadores*100, 1) if total_jugadores > 0 else 0}% del equipo'
            },
            {
                'label': 'Multas Pendientes',
                'value': str(multas_pendientes),
                'description': f'${valor_multas_pendientes:,.0f} en valor'
            },
            {
                'label': 'Saldo del Equipo',
                'value': f'${saldo_actual:,.0f}',
                'description': 'Balance actual'
            },
            {
                'label': 'Jugadores con Multas',
                'value': str(jugadores_con_multas),
                'description': 'Requieren atención'
            },
            {
                'label': 'Porcentaje Disciplinario',
                'value': f'{round((total_jugadores - jugadores_con_multas)/total_jugadores*100, 1) if total_jugadores > 0 else 100}%',
                'description': 'Sin multas pendientes'
            }
        ]
    
    def _obtener_alertas_prioritarias(self) -> List[Dict[str, str]]:
        """Obtener alertas y problemas que requieren atención inmediata"""
        alertas = []
        
        # Alerta: Jugadores con muchas multas
        jugadores_problematicos = self.db.query(
            models.Multa.jugador_cedula,
            func.count(models.Multa.id).label('total_multas')
        ).filter(models.Multa.pagada == False)\
         .group_by(models.Multa.jugador_cedula)\
         .having(func.count(models.Multa.id) >= 3)\
         .count()
        
        if jugadores_problematicos > 0:
            alertas.append({
                'tipo': 'Disciplina',
                'mensaje': f'{jugadores_problematicos} jugador(es) con 3+ multas pendientes'
            })
        
        # Alerta: Saldo bajo
        saldo_actual = estado_cuenta_crud.obtener_saldo_actual(self.db)
        if saldo_actual < 500000:  # Menos de 500k
            alertas.append({
                'tipo': 'Finanzas',
                'mensaje': f'Saldo bajo: ${saldo_actual:,.0f} (Revisar flujo de caja)'
            })
        
        # Alerta: Muchos jugadores sin pagar
        total_jugadores = self.db.query(models.Jugador).count()
        jugadores_al_dia = self.db.query(models.Jugador)\
                                 .filter(models.Jugador.estado_cuenta == True).count()
        
        porcentaje_al_dia = (jugadores_al_dia / total_jugadores * 100) if total_jugadores > 0 else 100
        
        if porcentaje_al_dia < 70:  # Menos del 70% al día
            alertas.append({
                'tipo': 'Pagos',
                'mensaje': f'Solo {porcentaje_al_dia:.1f}% de jugadores al día con pagos'
            })
        
        # Alerta: Valor alto de multas pendientes
        valor_multas_pendientes = self.db.query(func.sum(models.CausalMulta.valor))\
                                        .select_from(models.Multa)\
                                        .join(models.CausalMulta)\
                                        .filter(models.Multa.pagada == False)\
                                        .scalar() or 0
        
        if valor_multas_pendientes > 200000:  # Más de 200k en multas
            alertas.append({
                'tipo': 'Multas',
                'mensaje': f'${valor_multas_pendientes:,.0f} en multas pendientes de cobro'
            })
        
        return alertas
    
    def _obtener_ranking_multas_resumido(self) -> Dict[str, Any]:
        """Obtener top 10 jugadores con más multas"""
        
        ranking_response = dashboard_crud.obtener_ranking_jugadores_multas(
            db=self.db,
            limite=10
        )
        
        headers = ['Pos.', 'Jugador', 'Multas', 'Valor Total']
        data = []
        
        # Acceder a la lista de ranking dentro del response
        for jugador in ranking_response.ranking:
            data.append([
                str(jugador.posicion),
                jugador.nombre_inscripcion or jugador.nombre[:20],
                str(jugador.total_multas),
                f'${jugador.valor_total_multas:,.0f}'
            ])
        
        return {'headers': headers, 'data': data}
    
    def _obtener_cuotas_pendientes(self) -> Dict[str, Any]:
        """Obtener jugadores con cuotas pendientes"""
        
        # Obtener jugadores que no están al día
        jugadores_pendientes = self.db.query(models.Jugador)\
                                     .filter(models.Jugador.estado_cuenta == False)\
                                     .limit(15)\
                                     .all()
        
        headers = ['Cédula', 'Nombre', 'Teléfono', 'Estado']
        data = []
        
        for jugador in jugadores_pendientes:
            # Verificar si tiene multas pendientes también
            multas_pendientes = self.db.query(models.Multa)\
                                      .filter(models.Multa.jugador_cedula == jugador.cedula)\
                                      .filter(models.Multa.pagada == False)\
                                      .count()
            
            estado = "Cuota pendiente"
            if multas_pendientes > 0:
                estado += f" + {multas_pendientes} multa(s)"
            
            data.append([
                jugador.cedula,
                jugador.nombre_inscripcion or jugador.nombre[:25],
                jugador.telefono or 'No registrado',
                estado
            ])
        
        return {'headers': headers, 'data': data}
    
    def _obtener_estado_financiero_resumido(self) -> Dict[str, Any]:
        """Obtener resumen del estado financiero"""
        
        # Obtener datos financieros básicos
        saldo_actual = estado_cuenta_crud.obtener_saldo_actual(self.db)
        
        # Ingresos del mes actual (usando Mensualidad en lugar de Pago)
        hoy = date.today()
        ingresos_mes = self.db.query(func.sum(models.Mensualidad.valor))\
                             .filter(func.extract('month', models.Mensualidad.fecha_pago) == hoy.month)\
                             .filter(func.extract('year', models.Mensualidad.fecha_pago) == hoy.year)\
                             .scalar() or 0
        
        # Egresos del mes actual  
        egresos_mes = self.db.query(func.sum(models.Egreso.valor))\
                            .filter(func.extract('month', models.Egreso.fecha) == hoy.month)\
                            .filter(func.extract('year', models.Egreso.fecha) == hoy.year)\
                            .scalar() or 0
        
        # Multas pendientes de cobro
        multas_por_cobrar = self.db.query(func.sum(models.CausalMulta.valor))\
                                  .select_from(models.Multa)\
                                  .join(models.CausalMulta)\
                                  .filter(models.Multa.pagada == False)\
                                  .scalar() or 0
        
        headers = ['Concepto', 'Valor', 'Observaciones']
        data = [
            ['Saldo Actual', f'${saldo_actual:,.0f}', 'Balance en caja'],
            ['Ingresos del Mes', f'${ingresos_mes:,.0f}', f'{hoy.strftime("%B %Y")}'],
            ['Egresos del Mes', f'${egresos_mes:,.0f}', f'{hoy.strftime("%B %Y")}'],
            ['Balance Mensual', f'${(ingresos_mes - egresos_mes):,.0f}', 'Ingresos - Egresos'],
            ['Multas por Cobrar', f'${multas_por_cobrar:,.0f}', 'Ingresos potenciales']
        ]
        
        return {'headers': headers, 'data': data}
    
    def _obtener_detalles_adicionales(self) -> Dict[str, Any]:
        """Obtener información adicional del equipo"""
        
        # Estadísticas de multas por tipo
        estadisticas_multas = self.db.query(
            models.CausalMulta.descripcion,
            func.count(models.Multa.id).label('cantidad'),
            func.sum(models.CausalMulta.valor).label('valor_total')
        ).join(models.Multa)\
         .group_by(models.CausalMulta.id, models.CausalMulta.descripcion)\
         .order_by(func.count(models.Multa.id).desc())\
         .limit(5).all()
        
        headers = ['Tipo de Multa', 'Cantidad', 'Valor Total']
        data = []
        
        for stat in estadisticas_multas:
            data.append([
                stat.descripcion[:30] + ('...' if len(stat.descripcion) > 30 else ''),
                str(stat.cantidad),
                f'${stat.valor_total:,.0f}'
            ])
        
        return {'headers': headers, 'data': data}
