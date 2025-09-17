#!/usr/bin/env python3
"""
Script para verificar la importación de jugadores en PostgreSQL
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
        
        # Contar jugadores
        cur.execute('SELECT COUNT(*) FROM jugadores')
        count = cur.fetchone()[0]
        print(f"📊 Total jugadores en PostgreSQL: {count}")
        
        if count > 0:
            print("\n🎯 Algunos jugadores importados:")
            cur.execute('''
                SELECT cedula, nombre, apellido, numero_camiseta, posicion, email 
                FROM jugadores 
                ORDER BY nombre 
                LIMIT 5
            ''')
            
            for row in cur.fetchall():
                cedula, nombre, apellido, camiseta, posicion, email = row
                print(f"✅ {nombre} {apellido} (Cédula: {cedula}, Camiseta: {camiseta}, Posición: {posicion})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()