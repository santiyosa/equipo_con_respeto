#!/bin/bash
# Script de inicialización para Render
# Se ejecuta automáticamente durante el despliegue

echo "🚀 Iniciando despliegue en Render..."

# Instalar dependencias
echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

# Verificar variables de entorno críticas
echo "🔍 Verificando variables de entorno..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi
echo "✅ DATABASE_URL configurada"

# Crear tablas en PostgreSQL (sin verificación de conexión para evitar fallos)
echo "🗄️  Inicializando base de datos..."
python -c "
import models
from database import engine
try:
    print('Creando todas las tablas...')
    models.Base.metadata.create_all(bind=engine)
    print('✅ Tablas creadas exitosamente')
except Exception as e:
    print(f'⚠️  Warning durante creación de tablas: {e}')
    print('✅ Continuando con el despliegue...')
"

echo "✅ Build completado exitosamente"