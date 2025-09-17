#!/usr/bin/env python3
"""
Script para importar jugadores desde un archivo Excel
"""

import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime
import sys

def procesar_numero_camiseta(valor):
    """Procesa el número de camiseta, convirtiendo 0 a None"""
    if pd.isna(valor) or valor == 0 or valor == '0':
        return None
    try:
        return int(valor)
    except (ValueError, TypeError):
        return None

def procesar_fecha(fecha_str):
    """Procesa las fechas del Excel"""
    if pd.isna(fecha_str):
        return None
    
    if isinstance(fecha_str, str):
        # Intentar varios formatos de fecha
        formatos = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']
        for formato in formatos:
            try:
                return datetime.strptime(fecha_str, formato).date()
            except ValueError:
                continue
        return None
    
    # Si ya es un objeto datetime
    if hasattr(fecha_str, 'date'):
        return fecha_str.date()
    
    return fecha_str

def limpiar_texto(texto):
    """Limpia y normaliza texto"""
    if pd.isna(texto):
        return ''
    return str(texto).strip()

def main():
    if len(sys.argv) != 2:
        print("Uso: python importar_jugadores_excel.py <archivo_excel>")
        print("Ejemplo: python importar_jugadores_excel.py jugadores.xlsx")
        return
    
    archivo_excel = sys.argv[1]
    
    load_dotenv()
    
    print("📋 Script de Importación de Jugadores desde Excel")
    print("=" * 50)
    print(f"📁 Archivo: {archivo_excel}")
    
    try:
        # Verificar que el archivo existe
        if not os.path.exists(archivo_excel):
            print(f"❌ Error: El archivo {archivo_excel} no existe")
            return
        
        # Leer el archivo Excel
        print("📖 Leyendo archivo Excel...")
        df = pd.read_excel(archivo_excel)
        
        print(f"📊 Encontradas {len(df)} filas en el Excel")
        print(f"📋 Columnas detectadas: {list(df.columns)}")
        
        # Conectar a PostgreSQL
        print("\n🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Mapeo de columnas Excel a base de datos
        columnas_mapping = {
            'nombre': 'nombre',
            'apellido': 'apellido', 
            'cedula': 'cedula',
            'telefono': 'telefono',
            'email': 'email',
            'fecha_nacimiento': 'fecha_nacimiento',
            'talla_uniforme': 'talla_uniforme',
            'numero_camiseta': 'numero_camiseta',
            'Nombre Contacto de Emergencia': 'contacto_emergencia_nombre',
            'Telefono Contacto de Emergencia': 'contacto_emergencia_telefono',
            'recomendado_por_cedula': 'recomendado_por_cedula',
            'posicion': 'posicion',
            'activo': 'activo',
            'eps': 'eps',
            'lugar_atencion': 'lugar_atencion',
            'rh': 'rh',
            'nombre_inscripcion': 'nombre_inscripcion'
        }
        
        print(f"\n🚀 Iniciando importación de {len(df)} jugadores...")
        print("=" * 50)
        
        jugadores_creados = 0
        jugadores_omitidos = 0
        
        for index, fila in df.iterrows():
            try:
                # Extraer datos básicos
                cedula = limpiar_texto(fila.get('cedula', ''))
                nombre = limpiar_texto(fila.get('nombre', ''))
                apellido = limpiar_texto(fila.get('apellido', ''))
                nombre_inscripcion = limpiar_texto(fila.get('nombre_inscripcion', ''))
                
                # Validaciones básicas
                if not cedula or not nombre or not apellido:
                    print(f"⚠️  Fila {index + 1}: Datos obligatorios faltantes (cédula, nombre o apellido)")
                    jugadores_omitidos += 1
                    continue
                
                # Verificar si el jugador ya existe
                cur.execute("SELECT cedula FROM jugadores WHERE cedula = %s", (cedula,))
                if cur.fetchone():
                    print(f"⚠️  {nombre} {apellido}: Ya existe, omitiendo...")
                    jugadores_omitidos += 1
                    continue
                
                # Procesar datos
                telefono = limpiar_texto(fila.get('telefono', ''))
                email = limpiar_texto(fila.get('email', ''))
                fecha_nacimiento = procesar_fecha(fila.get('fecha_nacimiento'))
                talla_uniforme = limpiar_texto(fila.get('talla_uniforme', 'M'))
                numero_camiseta = procesar_numero_camiseta(fila.get('numero_camiseta'))
                contacto_emergencia_nombre = limpiar_texto(fila.get('Nombre Contacto de Emergencia', ''))
                contacto_emergencia_telefono = limpiar_texto(fila.get('Telefono Contacto de Emergencia', ''))
                recomendado_por_cedula = limpiar_texto(fila.get('recomendado_por_cedula', '')) or None
                posicion = limpiar_texto(fila.get('posicion', '')) or None
                activo = bool(fila.get('activo', True))
                eps = limpiar_texto(fila.get('eps', '')) or None
                lugar_atencion = limpiar_texto(fila.get('lugar_atencion', '')) or None
                rh = limpiar_texto(fila.get('rh', '')) or None
                
                # Si no tiene nombre_inscripcion, usar nombre + apellido
                if not nombre_inscripcion:
                    nombre_inscripcion = f"{nombre} {apellido}"
                
                # Insertar en PostgreSQL
                cur.execute("""
                    INSERT INTO jugadores (
                        cedula, nombre, apellido, nombre_inscripcion, telefono, email,
                        fecha_nacimiento, talla_uniforme, numero_camiseta,
                        contacto_emergencia_nombre, contacto_emergencia_telefono,
                        recomendado_por_cedula, posicion, activo, eps, lugar_atencion, rh
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    cedula, nombre, apellido, nombre_inscripcion, telefono, email,
                    fecha_nacimiento, talla_uniforme, numero_camiseta,
                    contacto_emergencia_nombre, contacto_emergencia_telefono,
                    recomendado_por_cedula, posicion, activo, eps, lugar_atencion, rh
                ))
                
                conn.commit()
                jugadores_creados += 1
                print(f"✅ {nombre} {apellido}: Creado exitosamente")
                
            except Exception as e:
                print(f"❌ Error en fila {index + 1} ({nombre} {apellido}): {e}")
                conn.rollback()
                jugadores_omitidos += 1
                continue
        
        conn.close()
        
        print("\n" + "=" * 50)
        print("🎉 IMPORTACIÓN COMPLETADA")
        print(f"✅ Jugadores creados: {jugadores_creados}")
        print(f"⏭️  Jugadores omitidos: {jugadores_omitidos}")
        print(f"📊 Total procesado: {jugadores_creados + jugadores_omitidos}")
        
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    main()