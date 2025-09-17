#!/usr/bin/env python3
"""
Script para eliminar un jugador específico de la base de datos
"""

import psycopg2
import os
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        cedula = '98765432'
        print(f'🔍 Buscando jugador con cédula {cedula}...')
        
        # Buscar el jugador
        cur.execute('SELECT cedula, nombre, apellido, email FROM jugadores WHERE cedula = %s', (cedula,))
        jugador = cur.fetchone()
        
        if jugador:
            print(f'👤 Jugador encontrado: {jugador[1]} {jugador[2]} (Email: {jugador[3]})')
            
            # Eliminar registros relacionados primero
            print('🗑️  Eliminando registros relacionados...')
            
            # Eliminar mensualidades
            cur.execute('DELETE FROM mensualidades WHERE jugador_cedula = %s', (cedula,))
            mensualidades_eliminadas = cur.rowcount
            print(f'   - Mensualidades eliminadas: {mensualidades_eliminadas}')
            
            # Eliminar multas
            cur.execute('DELETE FROM multas WHERE jugador_cedula = %s', (cedula,))
            multas_eliminadas = cur.rowcount
            print(f'   - Multas eliminadas: {multas_eliminadas}')
            
            # Eliminar otros aportes
            cur.execute('DELETE FROM otros_aportes WHERE jugador_cedula = %s', (cedula,))
            aportes_eliminados = cur.rowcount
            print(f'   - Otros aportes eliminados: {aportes_eliminados}')
            
            # Finalmente eliminar el jugador
            cur.execute('DELETE FROM jugadores WHERE cedula = %s', (cedula,))
            jugador_eliminado = cur.rowcount
            
            conn.commit()
            
            print(f'✅ Jugador {jugador[1]} {jugador[2]} eliminado completamente')
            print(f'   Total registros eliminados: {mensualidades_eliminadas + multas_eliminadas + aportes_eliminados + jugador_eliminado}')
            
        else:
            print('❌ No se encontró jugador con esa cédula')
        
        conn.close()
        
    except Exception as e:
        print(f'❌ Error: {e}')
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    main()