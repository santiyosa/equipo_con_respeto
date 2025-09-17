#!/usr/bin/env python3
"""
Script para agregar la columna 'apellido' a la tabla jugadores en PostgreSQL
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
        
        print("🔄 Agregando columna 'apellido' a la tabla jugadores...")
        
        # Verificar si la columna ya existe
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jugadores' AND column_name = 'apellido'
        """)
        
        exists = cur.fetchone()
        
        if exists:
            print("ℹ️  La columna 'apellido' ya existe en la tabla jugadores")
        else:
            # Agregar la columna apellido después de nombre
            cur.execute("""
                ALTER TABLE jugadores 
                ADD COLUMN apellido VARCHAR NOT NULL DEFAULT '';
            """)
            print("✅ Columna 'apellido' agregada exitosamente")
            
            # Confirmar los cambios
            conn.commit()
            print("✅ Cambios confirmados en la base de datos")
        
        # Mostrar la nueva estructura
        print("\n📋 Nueva estructura de la tabla jugadores:")
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'jugadores' 
            ORDER BY ordinal_position
        """)
        
        for row in cur.fetchall():
            column_name, data_type, is_nullable = row
            nullable = "✓" if is_nullable == "YES" else "✗"
            print(f"  - {column_name}: {data_type} (nullable: {nullable})")
        
        conn.close()
        print("\n🎉 Migración completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    main()