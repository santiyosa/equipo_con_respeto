#!/bin/bash
# Script de inicio para Render
# Define cómo ejecutar la aplicación en producción

echo "🚀 Iniciando aplicación en Render..."

# Configurar variables de entorno para producción
export PYTHONPATH="${PYTHONPATH}:/opt/render/project/src"

# Iniciar el servidor con Uvicorn optimizado para producción
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 1 \
    --log-level info \
    --access-log \
    --no-use-colors