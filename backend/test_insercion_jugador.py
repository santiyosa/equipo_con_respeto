import os
import psycopg2
import hashlib
from dotenv import load_dotenv
from datetime import date

load_dotenv()

print('🧪 PROBANDO INSERCIÓN DIRECTA EN POSTGRESQL')
print('=' * 45)

try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    # Datos de prueba
    cedula_test = '98765432'
    nombre_test = 'Carlos'
    apellido_test = 'Rodríguez'
    
    # Verificar si el jugador ya existe
    cur.execute('SELECT cedula FROM jugadores WHERE cedula = %s', (cedula_test,))
    if cur.fetchone():
        print(f'⚠️  Eliminando jugador existente con cédula {cedula_test}...')
        cur.execute('DELETE FROM jugadores WHERE cedula = %s', (cedula_test,))
        conn.commit()
    
    # Crear hash de contraseña
    password_hash = hashlib.sha256(cedula_test.encode()).hexdigest()
    
    print(f'📤 Insertando jugador: {nombre_test} {apellido_test}')
    
    # Insertar jugador con todos los campos incluyendo apellido
    cur.execute('''
        INSERT INTO jugadores (
            cedula, nombre, apellido, nombre_inscripcion, telefono, email,
            fecha_nacimiento, talla_uniforme, contacto_emergencia_nombre,
            contacto_emergencia_telefono, password, activo, estado_cuenta
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    ''', (
        cedula_test, nombre_test, apellido_test, f'{nombre_test} {apellido_test}',
        '3001234567', 'carlos.rodriguez@test.com', '1985-03-20', 'L',
        'Ana Rodríguez', '3007654321', password_hash, True, True
    ))
    
    conn.commit()
    print('✅ Jugador insertado exitosamente')
    
    # Verificar que se guardó correctamente
    print('\n🔍 Verificando datos guardados...')
    cur.execute('''
        SELECT cedula, nombre, apellido, nombre_inscripcion, email
        FROM jugadores 
        WHERE cedula = %s
    ''', (cedula_test,))
    
    result = cur.fetchone()
    if result:
        cedula, nombre, apellido, nombre_inscripcion, email = result
        print(f'✅ Datos verificados:')
        print(f'   - Cédula: {cedula}')
        print(f'   - Nombre: {nombre}')
        print(f'   - Apellido: {apellido}')
        print(f'   - Nombre inscripción: {nombre_inscripcion}')
        print(f'   - Email: {email}')
        
        if apellido == apellido_test:
            print('\n✅ EL APELLIDO SE GUARDÓ CORRECTAMENTE')
        else:
            print(f'\n❌ Error: Apellido esperado "{apellido_test}", obtenido "{apellido}"')
    else:
        print('❌ No se encontró el jugador insertado')
    
    conn.close()
    
except Exception as e:
    print(f'❌ Error en la prueba: {e}')
    try:
        conn.rollback()
    except:
        pass