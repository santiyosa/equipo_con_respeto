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
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'jugadores' 
                AND column_name = 'apellido'
            )
        """)
        
        exists = cur.fetchone()[0]
        
        if exists:
            print("✅ La columna 'apellido' ya existe en la tabla")
        else:
            # Agregar la columna apellido
            cur.execute("""
                ALTER TABLE jugadores 
                ADD COLUMN apellido VARCHAR NOT NULL DEFAULT ''
            """)
            
            print("✅ Columna 'apellido' agregada exitosamente")
        
        # Verificar la estructura actualizada
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'jugadores' 
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Estructura actualizada de la tabla jugadores:")
        for row in cur.fetchall():
            column_name, data_type, is_nullable = row
            print(f"- {column_name}: {data_type} ({'NULL' if is_nullable == 'YES' else 'NOT NULL'})")
        
        # Confirmar los cambios
        conn.commit()
        conn.close()
        
        print("\n🎉 ¡Migración completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    main()