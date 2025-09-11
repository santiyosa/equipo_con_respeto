#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        # Crear la configuración inicial de mensualidad
        conn.execute(text("""
            INSERT INTO configuraciones (clave, valor, descripcion) 
            VALUES ('mensualidad', 20000.00, 'Valor de la mensualidad del equipo')
            ON CONFLICT (clave) DO NOTHING
        """))
        conn.commit()
        print("✅ Configuración de mensualidad creada exitosamente")
        
        # Verificar que se creó correctamente
        result = conn.execute(text("SELECT * FROM configuraciones WHERE clave = 'mensualidad'"))
        row = result.fetchone()
        if row:
            print(f"   Mensualidad configurada: ${row[2]:,.0f}")
        else:
            print("❌ Error: No se pudo crear la configuración")

except Exception as e:
    print(f"❌ Error: {e}")
