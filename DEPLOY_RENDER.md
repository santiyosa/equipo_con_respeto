# 🚀 Guía de Despliegue en Render

## 📋 Preparación

### 1. Backend (Python/FastAPI + PostgreSQL)

#### Configuración en Render:
- **Tipo**: Web Service
- **Runtime**: Python 3
- **Build Command**: `./build.sh`
- **Start Command**: `./start.sh`
- **Root Directory**: `backend`

#### Variables de entorno requeridas:
```
DATABASE_URL=<postgresql_url_automatica>
RENDER=true
SECRET_KEY=<tu_clave_secreta_segura>
```

### 2. Base de datos PostgreSQL

#### En Render Dashboard:
1. Crear "PostgreSQL Database"
2. Copiar la URL de conexión
3. Se configurará automáticamente como `DATABASE_URL`

### 3. Frontend (React/Vite)

#### Configuración en Render:
- **Tipo**: Static Site
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Root Directory**: `frontend`

#### Variables de entorno:
```
VITE_API_BASE_URL=https://tu-backend.onrender.com
```

## 🔄 Proceso de Despliegue

### Paso 1: Preparar Backend
```bash
cd backend
chmod +x build.sh start.sh
```

### Paso 2: Configurar PostgreSQL
1. En Render: Crear PostgreSQL Database
2. Copiar URL de conexión
3. Configurar en variables de entorno del backend

### Paso 3: Migrar Datos (si tienes datos locales)
```bash
# En local, con DATABASE_URL configurada
cd backend
export DATABASE_URL="postgresql://..."
python migrate_to_postgresql.py
```

### Paso 4: Desplegar Backend
1. Conectar repositorio en Render
2. Configurar variables de entorno
3. Desplegar

### Paso 5: Desplegar Frontend
1. Configurar VITE_API_BASE_URL
2. Desplegar Static Site

## ✅ Verificación

### Backend funcionando:
- `https://tu-backend.onrender.com/docs` - Documentación API
- `https://tu-backend.onrender.com/api/dashboard/ultimos-egresos` - Endpoint test

### Frontend funcionando:
- `https://tu-frontend.onrender.com` - Aplicación web

## 🐛 Troubleshooting

### Error de conexión BD:
- Verificar DATABASE_URL en variables de entorno
- Comprobar que PostgreSQL esté activo

### Error de CORS:
- Verificar FRONTEND_URL en backend
- Comprobar configuración de orígenes

### Error de build:
- Revisar logs en Render Dashboard
- Verificar dependencias en requirements.txt

## 💡 Tips

1. **Render tarda ~2-3 minutos** en el primer despliegue
2. **PostgreSQL gratuito**: 1GB, suficiente para el proyecto
3. **Logs en tiempo real** disponibles en Render Dashboard
4. **Auto-deploy** desde Git push (configurable)

## 🔐 Seguridad

- ✅ Variables de entorno para credenciales
- ✅ PostgreSQL con SSL automático
- ✅ HTTPS automático en Render
- ✅ CORS configurado correctamente