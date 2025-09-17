#!/usr/bin/env python3
"""
Script para verificar las columnas de la tabla jugadores
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
        
        # Obtener columnas de la tabla jugadores
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'jugadores' 
            ORDER BY ordinal_position
        """)
        
        print("📋 Columnas en la tabla 'jugadores':")
        for row in cur.fetchall():
            column_name, data_type, is_nullable = row
            nullable = "✓" if is_nullable == "YES" else "✗"
            print(f"  - {column_name}: {data_type} (nullable: {nullable})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()