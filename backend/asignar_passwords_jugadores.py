#!/usr/bin/env python3
"""
Script para asignar contraseñas a jugadores que no tienen una configurada.
La contraseña inicial será el hash de su cédula.
"""

import os
import sys
import hashlib
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    print("🔑 Script de Asignación de Contraseñas para Jugadores")
    print("=" * 55)
    
    try:
        # Conectar a PostgreSQL
        print("🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Verificar jugadores sin contraseña
        print("\n📋 Verificando jugadores sin contraseña...")
        cur.execute("""
            SELECT cedula, nombre, apellido, email 
            FROM jugadores 
            WHERE password IS NULL OR password = ''
        """)
        
        jugadores_sin_password = cur.fetchall()
        
        if not jugadores_sin_password:
            print("✅ Todos los jugadores ya tienen contraseña configurada")
            return
        
        print(f"⚠️  Encontrados {len(jugadores_sin_password)} jugadores sin contraseña")
        print()
        
        # Mostrar lista de jugadores que serán actualizados
        for cedula, nombre, apellido, email in jugadores_sin_password:
            print(f"  - {nombre} {apellido} (Cédula: {cedula}, Email: {email})")
        
        print()
        respuesta = input("¿Continuar con la asignación de contraseñas? (s/N): ")
        if respuesta.lower() not in ['s', 'sí', 'si', 'y', 'yes']:
            print("❌ Operación cancelada")
            return
        
        print("\n🚀 Asignando contraseñas...")
        print("=" * 40)
        
        jugadores_actualizados = 0
        
        for cedula, nombre, apellido, email in jugadores_sin_password:
            try:
                # Generar hash de la contraseña (cédula)
                password_hash = hashlib.sha256(cedula.encode()).hexdigest()
                
                # Actualizar la contraseña en la base de datos
                cur.execute("""
                    UPDATE jugadores 
                    SET password = %s 
                    WHERE cedula = %s
                """, (password_hash, cedula))
                
                conn.commit()
                jugadores_actualizados += 1
                
                print(f"✅ {nombre} {apellido}")
                print(f"   📧 Email: {email}")
                print(f"   🔑 Contraseña inicial: {cedula}")
                print()
                
            except Exception as e:
                print(f"❌ Error actualizando {nombre} {apellido}: {e}")
                conn.rollback()
                continue
        
        conn.close()
        
        print("=" * 55)
        print("🎉 ASIGNACIÓN DE CONTRASEÑAS COMPLETADA")
        print(f"✅ Jugadores actualizados: {jugadores_actualizados}")
        print()
        print("📝 INSTRUCCIONES PARA JUGADORES:")
        print("- Email: El email registrado en su perfil")
        print("- Contraseña inicial: Su número de cédula")
        print("- Pueden cambiar su contraseña usando 'Recuperar contraseña'")
        print()
        print("🔗 URL de acceso: https://equipo-con-respeto.onrender.com")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()