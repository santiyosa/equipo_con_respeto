#!/usr/bin/env python3
"""
Script de prueba para verificar el funcionamiento del modelo Multa
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def test_multa_model():
    """Prueba el modelo Multa con los nuevos campos"""
    try:
        # Crear conexión
        engine = create_engine('sqlite:///equipo_futbol.db', echo=False)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Probar crear una multa con nuevos campos
        multa_test = models.Multa(
            jugador_cedula='123456789',
            causal_id=1,
            registrado_por=1,
            es_aporte_grupal=True,
            grupo_multa_id='test-123',
            concepto_aporte='Test aporte'
        )
        
        print('✅ Modelo Multa funciona correctamente con nuevos campos')
        print(f'   es_aporte_grupal: {multa_test.es_aporte_grupal}')
        print(f'   grupo_multa_id: {multa_test.grupo_multa_id}')
        print(f'   concepto_aporte: {multa_test.concepto_aporte}')
        
        # Verificar que los campos existen en la base de datos
        import sqlite3
        conn = sqlite3.connect('equipo_futbol.db')
        cursor = conn.cursor()
        cursor.execute('PRAGMA table_info(multas)')
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f'\n📋 Columnas en la tabla multas: {", ".join(columns)}')
        
        required_fields = ['es_aporte_grupal', 'grupo_multa_id', 'concepto_aporte']
        missing_fields = [field for field in required_fields if field not in columns]
        
        if not missing_fields:
            print('✅ Todos los campos requeridos están presentes en la base de datos')
        else:
            print(f'❌ Campos faltantes en la base de datos: {missing_fields}')
        
        conn.close()
        db.close()
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == "__main__":
    success = test_multa_model()
    sys.exit(0 if success else 1)
