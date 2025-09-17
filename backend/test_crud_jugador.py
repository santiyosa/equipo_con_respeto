import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from schemas.jugadores import JugadorCreate
from crud.jugadores import create_jugador
from datetime import date

print('🧪 PROBANDO FUNCIÓN CRUD CREATE_JUGADOR')
print('=' * 45)

# Crear sesión de base de datos
db = SessionLocal()

try:
    # Datos de prueba usando el schema JugadorCreate
    jugador_data = JugadorCreate(
        nombre="Ana",
        apellido="Martínez",
        cedula="87654321",
        telefono="3009876543",
        email="ana.martinez@test.com",
        fecha_nacimiento=date(1992, 8, 10),
        talla_uniforme="S",
        numero_camiseta=7,
        contacto_emergencia_nombre="Luis Martínez",
        contacto_emergencia_telefono="3001234567",
        nombre_inscripcion="Anita"
    )
    
    print(f'📤 Creando jugador: {jugador_data.nombre} {jugador_data.apellido}')
    print(f'   - Cédula: {jugador_data.cedula}')
    print(f'   - Email: {jugador_data.email}')
    
    # Eliminar jugador si ya existe
    from models import Jugador
    existing = db.query(Jugador).filter(Jugador.cedula == jugador_data.cedula).first()
    if existing:
        print(f'⚠️  Eliminando jugador existente...')
        db.delete(existing)
        db.commit()
    
    # Crear jugador usando la función CRUD
    resultado = create_jugador(db, jugador_data)
    
    print('✅ Jugador creado exitosamente vía CRUD')
    
    # Verificar que se guardó correctamente
    print('\n🔍 Verificando datos guardados...')
    jugador_guardado = db.query(Jugador).filter(Jugador.cedula == jugador_data.cedula).first()
    
    if jugador_guardado:
        print(f'✅ Datos verificados:')
        print(f'   - Cédula: {jugador_guardado.cedula}')
        print(f'   - Nombre: {jugador_guardado.nombre}')
        print(f'   - Apellido: {jugador_guardado.apellido}')
        print(f'   - Email: {jugador_guardado.email}')
        print(f'   - Nombre inscripción: {jugador_guardado.nombre_inscripcion}')
        
        if jugador_guardado.apellido == jugador_data.apellido:
            print('\n✅ EL APELLIDO SE GUARDÓ CORRECTAMENTE VÍA CRUD')
        else:
            print(f'\n❌ Error: Apellido esperado "{jugador_data.apellido}", obtenido "{jugador_guardado.apellido}"')
    else:
        print('❌ No se encontró el jugador creado')
    
except Exception as e:
    print(f'❌ Error en la prueba CRUD: {e}')
    import traceback
    traceback.print_exc()
    
finally:
    db.close()