import pandas as pd

# Crear datos de ejemplo
datos_ejemplo = {
    'nombre': [
        'Juan Pérez García',
        'María López Rodríguez', 
        'Carlos Martínez Sánchez',
        'Ana Fernández Torres',
        'Luis García Muñoz'
    ],
    'email': [
        'juan.perez@email.com',
        'maria.lopez@email.com',
        'carlos.martinez@email.com', 
        'ana.fernandez@email.com',
        'luis.garcia@email.com'
    ],
    'telefono': [
        '3001234567',
        '3101234567',
        '3201234567',
        '3301234567',
        '3401234567'
    ],
    'fecha_nacimiento': [
        '1990-05-15',
        '1988-12-03',
        '1992-08-22',
        '1991-01-10',
        '1989-06-18'
    ],
    'direccion': [
        'Calle 123 #45-67',
        'Carrera 78 #90-12',
        'Avenida 34 #56-78',
        'Calle 90 #12-34',
        'Carrera 56 #78-90'
    ]
}

# Crear DataFrame
df = pd.DataFrame(datos_ejemplo)

# Guardar como Excel
df.to_excel('jugadores_ejemplo.xlsx', index=False)
print("✅ Archivo 'jugadores_ejemplo.xlsx' creado exitosamente")
print("📋 Puedes usar este archivo como plantilla")
print("\nEstructura del archivo:")
print(df.to_string(index=False))