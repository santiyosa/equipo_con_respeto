from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from models import Jugador, Mensualidad, Multa

class EstadoCuentaService:
    @staticmethod
    def calcular_estado_al_dia(jugador: Jugador, db: Session) -> bool:
        """
        Calcula si un jugador está al día basado en las reglas de negocio:
        
        1. Si es arquero: solo debe tener multas pagadas (no mensualidades)
        2. Si es jugador regular: debe tener mensualidades desde su inscripción + multas pagadas
        3. Si se inscribió en el transcurso del año: solo paga desde el mes de inscripción
        
        Args:
            jugador: El jugador a evaluar
            db: Sesión de base de datos
            
        Returns:
            bool: True si está al día, False en caso contrario
        """
        
        # 1. Verificar multas pendientes (aplica para todos)
        multas_pendientes = db.query(Multa).filter(
            Multa.jugador_cedula == jugador.cedula,
            Multa.pagada == False
        ).count()
        
        if multas_pendientes > 0:
            return False
        
        # 2. Solo los arqueros no pagan mensualidades
        # Cualquier otra posición (defensa, medio, delantero, etc.) SÍ paga mensualidades
        posicion_actual = getattr(jugador, 'posicion', None)
        if posicion_actual is not None and posicion_actual == "arquero":
            return True
        
        # 3. Para jugadores regulares, verificar mensualidades
        return EstadoCuentaService._verificar_mensualidades_al_dia(jugador, db)
    
    @staticmethod
    def _verificar_mensualidades_al_dia(jugador: Jugador, db: Session) -> bool:
        """
        Verifica si un jugador regular tiene las mensualidades al día
        desde su fecha de inscripción hasta el mes actual.
        """
        año_actual = datetime.now().year
        mes_actual = datetime.now().month
        
        # Obtener año y mes de inscripción
        fecha_inscripcion = jugador.fecha_inscripcion
        año_inscripcion = fecha_inscripcion.year
        mes_inscripcion = fecha_inscripcion.month
        
        # Calcular meses que debe tener pagados
        meses_debe_pagar = EstadoCuentaService._calcular_meses_a_pagar(
            año_inscripcion, mes_inscripcion, año_actual, mes_actual
        )
        
        # Obtener mensualidades pagadas
        mensualidades_pagadas = db.query(Mensualidad).filter(
            Mensualidad.jugador_cedula == jugador.cedula
        ).all()
        
        # Crear set de (año, mes) pagados
        meses_pagados = {(m.ano, m.mes) for m in mensualidades_pagadas}
        
        # Verificar si todos los meses requeridos están pagados
        for año, mes in meses_debe_pagar:
            if (año, mes) not in meses_pagados:
                return False
        
        return True
    
    @staticmethod
    def _calcular_meses_a_pagar(año_inicio: int, mes_inicio: int, año_fin: int, mes_fin: int) -> List[tuple]:
        """
        Calcula la lista de (año, mes) que un jugador debe tener pagados
        desde su inscripción hasta el mes actual.
        """
        meses = []
        
        año_actual = año_inicio
        mes_actual = mes_inicio
        
        while (año_actual < año_fin) or (año_actual == año_fin and mes_actual <= mes_fin):
            meses.append((año_actual, mes_actual))
            
            mes_actual += 1
            if mes_actual > 12:
                mes_actual = 1
                año_actual += 1
        
        return meses
    
    @staticmethod
    def obtener_detalles_estado(jugador: Jugador, db: Session) -> dict:
        """
        Obtiene detalles completos del estado de cuenta de un jugador.
        
        Returns:
            dict con información detallada del estado
        """
        multas_pendientes = db.query(Multa).filter(
            Multa.jugador_cedula == jugador.cedula,
            Multa.pagada == False
        ).all()
        
        valor_multas = sum(multa.causal.valor for multa in multas_pendientes)
        
        resultado = {
            "cedula": jugador.cedula,
            "nombre": jugador.nombre,
            "posicion": jugador.posicion,
            "fecha_inscripcion": jugador.fecha_inscripcion,
            "al_dia": EstadoCuentaService.calcular_estado_al_dia(jugador, db),
            "multas_pendientes": len(multas_pendientes),
            "valor_multas_pendientes": valor_multas,
        }
        
        # Si no es arquero, agregar información de mensualidades
        posicion_actual = getattr(jugador, 'posicion', None)
        if posicion_actual is None or posicion_actual != "arquero":
            año_actual = datetime.now().year
            mes_actual = datetime.now().month
            
            meses_debe_pagar = EstadoCuentaService._calcular_meses_a_pagar(
                jugador.fecha_inscripcion.year,
                jugador.fecha_inscripcion.month,
                año_actual,
                mes_actual
            )
            
            mensualidades_pagadas = db.query(Mensualidad).filter(
                Mensualidad.jugador_cedula == jugador.cedula
            ).all()
            
            meses_pagados = {(m.ano, m.mes) for m in mensualidades_pagadas}
            meses_pendientes = [
                f"{año}-{mes:02d}" for año, mes in meses_debe_pagar 
                if (año, mes) not in meses_pagados
            ]
            
            resultado.update({
                "mensualidades_pendientes": len(meses_pendientes),
                "meses_pendientes": meses_pendientes,
                "total_meses_debe": len(meses_debe_pagar),
                "total_meses_pagados": len(meses_pagados)
            })
        
        return resultado
