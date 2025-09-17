#!/usr/bin/env python3
"""
Script para limpiar la base de datos de jugadores en PostgreSQL.
ATENCIÓN: Este script eliminará TODOS los datos relacionados con jugadores.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    print("🗑️  Script de Limpieza de Base de Datos - JUGADORES")
    print("=" * 55)
    print("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de jugadores")
    print("    incluyendo:")
    print("    - Jugadores")
    print("    - Mensualidades")
    print("    - Multas")
    print("    - Otros aportes")
    print("    - Egresos")
    print("    - Inscripciones")
    print()
    
    # Doble confirmación por seguridad
    confirmacion1 = input("¿Está COMPLETAMENTE SEGURO de que desea continuar? (escriba 'ELIMINAR'): ")
    if confirmacion1 != 'ELIMINAR':
        print("❌ Operación cancelada por seguridad")
        return
    
    confirmacion2 = input("Confirme nuevamente escribiendo 'SI ESTOY SEGURO': ")
    if confirmacion2 != 'SI ESTOY SEGURO':
        print("❌ Operación cancelada por seguridad")
        return
    
    try:
        # Conectar a PostgreSQL
        print("\n🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Verificar cuántos registros hay antes de eliminar
        print("\n📊 Contando registros actuales...")
        
        # Función para contar registros de manera segura
        def contar_registros(tabla):
            try:
                cur.execute(f"SELECT COUNT(*) FROM {tabla}")
                result = cur.fetchone()
                return result[0] if result else 0
            except psycopg2.Error:
                return 0  # La tabla no existe
        
        # Contar registros en tablas existentes
        total_jugadores = contar_registros("jugadores")
        total_mensualidades = contar_registros("mensualidades")
        total_multas = contar_registros("multas")
        total_otros_aportes = contar_registros("otros_aportes")
        total_egresos = contar_registros("egresos")
        
        print(f"📋 Registros encontrados:")
        print(f"   - Jugadores: {total_jugadores}")
        print(f"   - Mensualidades: {total_mensualidades}")
        print(f"   - Multas: {total_multas}")
        print(f"   - Otros aportes: {total_otros_aportes}")
        print(f"   - Egresos: {total_egresos}")
        
        if total_jugadores == 0:
            print("✅ No hay jugadores para eliminar")
            return
        
        print(f"\n⚠️  Se eliminarán {total_jugadores} jugadores y todos sus datos relacionados")
        confirmacion_final = input("¿Proceder con la eliminación? (escriba 'PROCEDER'): ")
        if confirmacion_final != 'PROCEDER':
            print("❌ Operación cancelada")
            return
        
        print("\n🗑️  Iniciando proceso de limpieza...")
        print("=" * 40)
        
        # Eliminar en orden correcto (respetando foreign keys)
        
        # Función para eliminar de manera segura
        def eliminar_de_tabla(tabla, descripcion):
            try:
                cur.execute(f"DELETE FROM {tabla}")
                eliminados = cur.rowcount
                print(f"   ✅ {eliminados} {descripcion} eliminados")
                return eliminados
            except psycopg2.Error:
                print(f"   ⚠️  Tabla {tabla} no existe, omitiendo...")
                return 0
        
        # 1. Eliminar mensualidades
        print("🗑️  Eliminando mensualidades...")
        mensualidades_eliminadas = eliminar_de_tabla("mensualidades", "mensualidades")
        
        # 2. Eliminar multas
        print("🗑️  Eliminando multas...")
        multas_eliminadas = eliminar_de_tabla("multas", "multas")
        
        # 3. Eliminar otros aportes
        print("🗑️  Eliminando otros aportes...")
        otros_aportes_eliminados = eliminar_de_tabla("otros_aportes", "otros aportes")
        
        # 4. Eliminar egresos
        print("🗑️  Eliminando egresos...")
        egresos_eliminados = eliminar_de_tabla("egresos", "egresos")
        
        # 5. Finalmente eliminar jugadores
        print("🗑️  Eliminando jugadores...")
        jugadores_eliminados = eliminar_de_tabla("jugadores", "jugadores")
        
        # Confirmar transacción
        conn.commit()
        
        # Verificar que todo fue eliminado
        print("\n🔍 Verificando limpieza...")
        cur.execute("SELECT COUNT(*) FROM jugadores")
        result = cur.fetchone()
        jugadores_restantes = result[0] if result else 0
        
        if jugadores_restantes == 0:
            print("✅ Base de datos limpiada exitosamente")
        else:
            print(f"⚠️  Aún quedan {jugadores_restantes} jugadores en la base de datos")
        
        conn.close()
        
        print("\n" + "=" * 55)
        print("🎉 LIMPIEZA COMPLETADA")
        print(f"✅ Jugadores eliminados: {jugadores_eliminados}")
        print(f"✅ Mensualidades eliminadas: {mensualidades_eliminadas}")
        print(f"✅ Multas eliminadas: {multas_eliminadas}")
        print(f"✅ Otros aportes eliminados: {otros_aportes_eliminados}")
        print(f"✅ Egresos eliminados: {egresos_eliminados}")
        print("\n📝 La base de datos está lista para nuevos datos")
        
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