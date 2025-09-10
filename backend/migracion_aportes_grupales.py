#!/usr/bin/env python3
"""
Migración para agregar campos de aportes grupales a la tabla multas
"""
import sqlite3
import os
import sys

def migrar_base_datos():
    """Ejecuta la migración para agregar campos de aportes grupales"""
    
    db_path = 'equipo_futbol.db'  # Nombre correcto de la base de datos
    
    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada. Asegúrate de estar en el directorio correcto.")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando estructura actual de la tabla multas...")
        
        # Verificar si las columnas ya existen
        cursor.execute('PRAGMA table_info(multas)')
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"📋 Columnas actuales: {', '.join(columns)}")
        
        # Definir nuevas columnas
        new_columns = [
            ('es_aporte_grupal', 'BOOLEAN DEFAULT FALSE'),
            ('grupo_multa_id', 'TEXT'),
            ('concepto_aporte', 'TEXT')
        ]
        
        columns_added = 0
        
        # Agregar cada columna si no existe
        for col_name, col_def in new_columns:
            if col_name not in columns:
                try:
                    cursor.execute(f'ALTER TABLE multas ADD COLUMN {col_name} {col_def}')
                    print(f"✅ Columna '{col_name}' agregada exitosamente")
                    columns_added += 1
                except sqlite3.Error as e:
                    print(f"❌ Error agregando columna '{col_name}': {e}")
                    return False
            else:
                print(f"ℹ️  Columna '{col_name}' ya existe")
        
        # Confirmar cambios
        conn.commit()
        
        if columns_added > 0:
            print(f"\n🎉 Migración completada exitosamente! Se agregaron {columns_added} columnas.")
        else:
            print(f"\n✅ La base de datos ya está actualizada.")
        
        # Verificar estructura final
        cursor.execute('PRAGMA table_info(multas)')
        final_columns = [col[1] for col in cursor.fetchall()]
        print(f"\n📋 Estructura final de multas: {', '.join(final_columns)}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error de SQLite: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def insertar_causal_ejemplo():
    """Inserta una causal de ejemplo para aportes grupales"""
    try:
        conn = sqlite3.connect('equipo_futbol.db')  # Nombre correcto de la base de datos
        cursor = conn.cursor()
        
        # Verificar si ya existe una causal de aporte grupal
        cursor.execute("SELECT id FROM causales_multa WHERE descripcion LIKE '%aporte%' OR descripcion LIKE '%Aporte%'")
        existing = cursor.fetchone()
        
        if not existing:
            cursor.execute("""
                INSERT INTO causales_multa (descripcion, valor) 
                VALUES ('Aporte Grupal - General', 10000)
            """)
            conn.commit()
            print("✅ Causal de ejemplo 'Aporte Grupal - General' creada exitosamente")
        else:
            print("ℹ️  Ya existe una causal de aporte grupal")
            
    except Exception as e:
        print(f"⚠️  Error creando causal de ejemplo: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 Iniciando migración para aportes grupales...")
    print("=" * 50)
    
    if migrar_base_datos():
        print("\n" + "=" * 50)
        print("🎯 Creando causal de ejemplo...")
        insertar_causal_ejemplo()
        print("\n" + "=" * 50)
        print("✅ ¡Migración completada! El sistema de aportes grupales está listo.")
        print("\n📖 Cómo usar:")
        print("1. Ve a la página de Multas")
        print("2. Haz clic en '💰 Aporte Grupal'")
        print("3. Completa el formulario")
        print("4. El sistema creará automáticamente una multa para cada jugador activo")
    else:
        print("❌ La migración falló. Revisa los errores anteriores.")
        sys.exit(1)
