#!/usr/bin/env python3
"""
Script para limpiar ÚNICAMENTE la tabla de jugadores en PostgreSQL.
ATENCIÓN: Este script eliminará TODOS los jugadores.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    print("🗑️  Script de Limpieza - TABLA JUGADORES")
    print("=" * 45)
    print("⚠️  ADVERTENCIA: Este script eliminará TODOS los jugadores")
    print("    de la base de datos PostgreSQL")
    print()
    
    # Confirmación de seguridad
    confirmacion = input("¿Está seguro de que desea eliminar TODOS los jugadores? (escriba 'ELIMINAR'): ")
    if confirmacion != 'ELIMINAR':
        print("❌ Operación cancelada por seguridad")
        return
    
    try:
        # Conectar a PostgreSQL
        print("\n🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Verificar cuántos jugadores hay antes de eliminar
        print("📊 Contando jugadores actuales...")
        cur.execute("SELECT COUNT(*) FROM jugadores")
        result = cur.fetchone()
        total_jugadores = result[0] if result else 0
        
        print(f"📋 Jugadores encontrados: {total_jugadores}")
        
        if total_jugadores == 0:
            print("✅ No hay jugadores para eliminar")
            return
        
        print(f"\n⚠️  Se eliminarán {total_jugadores} jugadores")
        confirmacion_final = input("¿Proceder con la eliminación? (escriba 'SI'): ")
        if confirmacion_final != 'SI':
            print("❌ Operación cancelada")
            return
        
        print("\n🗑️  Eliminando jugadores...")
        print("=" * 30)
        
        # Eliminar todos los jugadores
        cur.execute("DELETE FROM jugadores")
        jugadores_eliminados = cur.rowcount
        
        # Confirmar transacción
        conn.commit()
        
        print(f"✅ {jugadores_eliminados} jugadores eliminados exitosamente")
        
        # Verificar que la tabla quedó vacía
        print("\n🔍 Verificando limpieza...")
        cur.execute("SELECT COUNT(*) FROM jugadores")
        result = cur.fetchone()
        jugadores_restantes = result[0] if result else 0
        
        if jugadores_restantes == 0:
            print("✅ Tabla de jugadores limpiada exitosamente")
        else:
            print(f"⚠️  Aún quedan {jugadores_restantes} jugadores en la tabla")
        
        conn.close()
        
        print("\n" + "=" * 45)
        print("🎉 LIMPIEZA COMPLETADA")
        print(f"✅ Total de jugadores eliminados: {jugadores_eliminados}")
        print("\n📝 La tabla de jugadores está lista para nuevos datos")
        
    except Exception as e:
        print(f"❌ Error durante la limpieza: {e}")
        try:
            conn.rollback()
            print("🔄 Se hizo rollback de los cambios")
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()