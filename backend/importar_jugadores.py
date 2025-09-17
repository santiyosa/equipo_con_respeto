#!/usr/bin/env python3
"""
Script de Importación de Jugadores desde Excel
==============================================

Este script permite importar jugadores masivamente desde un archivo Excel
a la base de datos PostgreSQL del sistema.

INSTRUCCIONES:
1. Prepara tu archivo Excel con las columnas: nombre, email, telefono, fecha_nacimiento, direccion
2. Guarda el archivo como "jugadores.xlsx" en esta carpeta
3. Ejecuta: python importar_jugadores.py

FORMATO DEL EXCEL:
- Columna A: nombre (OBLIGATORIO)
- Columna B: email (opcional)
- Columna C: telefono (opcional) 
- Columna D: fecha_nacimiento (opcional, formato: YYYY-MM-DD o DD/MM/YYYY)
- Columna E: direccion (opcional)
"""

import pandas as pd
import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def conectar_postgresql():
    """Conectar a PostgreSQL usando DATABASE_URL"""
    try:
        postgresql_url = os.getenv('DATABASE_URL')
        if postgresql_url and postgresql_url.startswith('postgres://'):
            postgresql_url = postgresql_url.replace('postgres://', 'postgresql://', 1)
        
        conn = psycopg2.connect(postgresql_url)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        return None

def validar_email(email):
    """Validar formato básico de email"""
    if pd.isna(email) or email == '':
        return None
    if '@' in str(email) and '.' in str(email):
        return str(email).strip()
    return None

def convertir_fecha(fecha_str):
    """Convertir diferentes formatos de fecha a YYYY-MM-DD"""
    if pd.isna(fecha_str) or fecha_str == '':
        return None
    
    try:
        # Si es un timestamp de pandas
        if isinstance(fecha_str, pd.Timestamp):
            return fecha_str.strftime('%Y-%m-%d')
        
        fecha_str = str(fecha_str).strip()
        
        # Si contiene timestamp completo, extraer solo la fecha
        if ' 00:00:00' in fecha_str:
            fecha_str = fecha_str.split(' ')[0]
        
        # Intentar diferentes formatos
        formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y']
        
        for formato in formatos:
            try:
                fecha = datetime.strptime(fecha_str, formato)
                return fecha.strftime('%Y-%m-%d')
            except:
                continue
                
        print(f"⚠️  Fecha no reconocida: {fecha_str}")
        return None
        
    except Exception as e:
        print(f"⚠️  Error procesando fecha {fecha_str}: {e}")
        return None

def importar_jugadores_desde_excel(archivo_excel):
    """Función principal para importar jugadores"""
    
    print("🚀 Iniciando importación de jugadores desde Excel")
    print("=" * 55)
    
    # Verificar que el archivo existe
    if not os.path.exists(archivo_excel):
        print(f"❌ Archivo no encontrado: {archivo_excel}")
        print("💡 Asegúrate de que el archivo esté en la misma carpeta que este script")
        return
    
    # Conectar a PostgreSQL
    conn = conectar_postgresql()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    try:
        # Leer archivo Excel
        print(f"📖 Leyendo archivo: {archivo_excel}")
        df = pd.read_excel(archivo_excel)
        
        print(f"📊 Encontradas {len(df)} filas en el Excel")
        print(f"📋 Columnas detectadas: {list(df.columns)}")
        
        # Verificar columnas obligatorias
        columnas_requeridas = ['Nombres', 'Apellidos']
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        
        if columnas_faltantes:
            print(f"❌ ERROR: Faltan columnas obligatorias: {columnas_faltantes}")
            return
        
        # Procesar cada jugador
        jugadores_creados = 0
        jugadores_omitidos = 0
        
        for index, row in df.iterrows():
            try:
                # Datos obligatorios
                nombres = str(row['Nombres']).strip() if pd.notna(row['Nombres']) else ''
                apellidos = str(row['Apellidos']).strip() if pd.notna(row['Apellidos']) else ''
                
                if not nombres or not apellidos:
                    print(f"⏭️  Fila {index + 2}: Nombres o apellidos vacíos, omitiendo...")
                    jugadores_omitidos += 1
                    continue
                # Obtener datos del Excel con las columnas exactas
                documento_identidad = str(row.get('Número Documento Identidad', '')).strip()
                nombres = str(row.get('Nombres', '')).strip()
                apellidos = str(row.get('Apellidos', '')).strip()
                alias = str(row.get('Alias - Nombre con el que se inscribe normalmente para los partidos', '')).strip()
                telefono = str(row.get('Número de Celular', '')).strip()
                email = str(row.get('Correo Electrónico, o uno al que tenga acceso.', '')).strip()
                fecha_nacimiento = convertir_fecha(row.get('Fecha Nacimiento', ''))
                posicion = str(row.get('Posición de juego en la que se le asigna normalmente en las convocatorias', '')).strip()
                numero_camiseta = row.get('Número de Camiseta que tiene asignado actualmente. Si no tiene asignado número, ingrese un cero', 0)
                talla_uniforme = str(row.get('Talla Uniforme', '')).strip()
                contacto_emergencia = str(row.get('Nombre Contacto de Emergencia', '')).strip()
                telefono_emergencia = str(row.get('Telefono Contacto de Emergencia', '')).strip()
                eps = str(row.get('Información medica - Nombre Prestador de Servicio de Salud EPS', '')).strip()
                lugar_atencion = str(row.get('Información medica - Lugar de Atención', '')).strip()
                rh = str(row.get('Información medica - RH', '')).strip()
                
                # Crear nombre completo
                nombre_completo = f"{nombres} {apellidos}".strip()
                
                # Verificar si el jugador ya existe (por cedula o email)
                if documento_identidad:
                    cursor.execute("SELECT cedula FROM jugadores WHERE cedula = %s", (documento_identidad,))
                    if cursor.fetchone():
                        print(f"⏭️  {nombre_completo}: Ya existe (cédula), omitiendo...")
                        jugadores_omitidos += 1
                        continue
                
                if email and email != 'nan':
                    cursor.execute("SELECT cedula FROM jugadores WHERE email = %s", (email,))
                    if cursor.fetchone():
                        print(f"⏭️  {nombre_completo}: Ya existe (email), omitiendo...")
                        jugadores_omitidos += 1
                        continue
                
                # Convertir número de camiseta (0 significa sin asignar)
                numero_camiseta_final = None if numero_camiseta == 0 else int(numero_camiseta) if pd.notna(numero_camiseta) else None
                
                # Insertar jugador con la estructura correcta de la tabla
                cursor.execute("""
                    INSERT INTO jugadores (
                        cedula, nombre, nombre_inscripcion, telefono, fecha_nacimiento, 
                        talla_uniforme, numero_camiseta, contacto_emergencia_nombre, 
                        contacto_emergencia_telefono, fecha_inscripcion, posicion, 
                        activo, email, eps, lugar_atencion, rh
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    documento_identidad, nombre_completo, alias, telefono, fecha_nacimiento,
                    talla_uniforme, numero_camiseta_final, contacto_emergencia,
                    telefono_emergencia, datetime.now().date(), posicion,
                    True, email if email != 'nan' else None, eps, lugar_atencion, rh
                ))
                
                print(f"✅ {nombre_completo}: Creado exitosamente")
                jugadores_creados += 1
                
            except Exception as e:
                nombre_para_error = f"{nombres} {apellidos}" if 'nombres' in locals() and 'apellidos' in locals() else f"Fila {index + 2}"
                print(f"❌ Error en {nombre_para_error}: {e}")
                jugadores_omitidos += 1
                continue
        
        # Commit de todos los cambios
        conn.commit()
        
        # Resumen final
        print("\n" + "=" * 55)
        print(f"🎉 IMPORTACIÓN COMPLETADA")
        print(f"✅ Jugadores creados: {jugadores_creados}")
        print(f"⏭️  Jugadores omitidos: {jugadores_omitidos}")
        print(f"📊 Total procesado: {len(df)}")
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Nombre del archivo Excel por defecto
    archivo_excel = "jugadores.xlsx"
    
    print("📋 Script de Importación de Jugadores")
    print("=" * 40)
    
    # Permitir especificar archivo diferente
    import sys
    if len(sys.argv) > 1:
        archivo_excel = sys.argv[1]
    
    print(f"📁 Buscando archivo: {archivo_excel}")
    
    # Ejecutar importación
    importar_jugadores_desde_excel(archivo_excel)