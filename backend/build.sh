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


# Probar conexión a la base de datos PostgreSQL
echo "🗄️  Probando conexión a la base de datos..."
python -c "
from database import engine
try:
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('✅ Conexión exitosa a la base de datos. Resultado:', list(result)[0][0])
except Exception as e:
    print(f'❌ Error de conexión a la base de datos: {e}')
    exit(1)
"

echo "✅ Build completado exitosamente"