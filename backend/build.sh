#!/bin/bash
# Script de inicialización para Render
# Se ejecuta automáticamente durante el despliegue

echo "🚀 Iniciando despliegue en Render..."

# Instalar dependencias
echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

# Crear tablas en PostgreSQL
echo "🗄️  Inicializando base de datos..."
python -c "
import models
from database import engine
print('Creando todas las tablas...')
models.Base.metadata.create_all(bind=engine)
print('✅ Tablas creadas exitosamente')
"

# Verificar conexión a BD
echo "🔍 Verificando conexión a base de datos..."
python -c "
from database import get_db
try:
    db = next(get_db())
    print('✅ Conexión a PostgreSQL exitosa')
    db.close()
except Exception as e:
    print(f'❌ Error de conexión: {e}')
    exit(1)
"

echo "✅ Inicialización completada"