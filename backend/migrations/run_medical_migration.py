#!/usr/bin/env python3
"""
Script para ejecutar la migración de campos médicos
"""
import sqlite3
import os

def run_migration():
    # Conectar a la base de datos
    db_path = "equipo_futbol.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Ejecutando migración: Agregar campos médicos...")
        
        # Agregar las nuevas columnas
        print("📝 Agregando columna 'eps'...")
        cursor.execute("ALTER TABLE jugadores ADD COLUMN eps TEXT")
        
        print("📝 Agregando columna 'lugar_atencion'...")
        cursor.execute("ALTER TABLE jugadores ADD COLUMN lugar_atencion TEXT")
        
        print("📝 Agregando columna 'rh'...")
        cursor.execute("ALTER TABLE jugadores ADD COLUMN rh TEXT")
        
        # Verificar que las columnas se agregaron
        cursor.execute("PRAGMA table_info(jugadores)")
        columns = cursor.fetchall()
        
        medical_fields = ['eps', 'lugar_atencion', 'rh']
        found_fields = []
        
        for column in columns:
            if column[1] in medical_fields:
                found_fields.append(column[1])
        
        print(f"✅ Campos médicos agregados: {found_fields}")
        
        # Guardar cambios
        conn.commit()
        
        # Verificar total de jugadores
        cursor.execute("SELECT COUNT(*) FROM jugadores")
        total = cursor.fetchone()[0]
        print(f"📊 Total de jugadores en la base: {total}")
        
        conn.close()
        print("✅ Migración completada exitosamente!")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error en la migración: {e}")
        if 'conn' in locals():
            conn.close()
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    run_migration()
