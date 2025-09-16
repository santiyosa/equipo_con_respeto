# 🚀 **GUÍA DE INSTALACIÓN Y REPLICACIÓN DEL PROYECTO**

Sistema de Gestión de Equipo de Fútbol - Guía completa para instalar en otro equipo.

## 📋 **PRERREQUISITOS**

### **Backend (Python):**
- **Python 3.9+** - [Descargar aquí](https://www.python.org/downloads/)
- **pip** (incluido con Python)

### **Frontend (Node.js):**
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js)

### **Base de Datos:**
- **SQLite** (incluido, no requiere instalación adicional)

## 🔧 **INSTALACIÓN PASO A PASO**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/santiyosa/equipo_con_respeto.git
cd equipo_con_respeto
git checkout feature/autenticacion
```

### **2. Configurar Backend**
```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv equipo_env

# Activar entorno virtual
# Windows:
equipo_env\Scripts\activate
# Linux/Mac:
source equipo_env/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Gmail (ver instrucciones abajo)
```

### **3. Configurar Frontend**
```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env si es necesario (normalmente no requiere cambios)
```

### **4. Configurar Email (Opcional pero Recomendado)**

Para habilitar recuperación de contraseñas por email:

1. **Ir a [Google Account Security](https://myaccount.google.com/security)**
2. **Activar verificación en 2 pasos**
3. **Generar contraseña de aplicación:**
   - Buscar "Contraseñas de aplicación"
   - Crear nueva para "Aplicación personalizada"
   - Copiar la contraseña generada

4. **Editar `backend/.env`:**
```env
SENDER_EMAIL=tu-email@gmail.com
SENDER_PASSWORD=contraseña-de-aplicacion-sin-espacios
SENDER_NAME=Tu Nombre o Equipo
```

### **5. Inicializar Base de Datos**
```bash
cd backend

# La base de datos se crea automáticamente al iniciar
# Si quieres resetearla, elimina el archivo:
# rm equipo_futbol.db
```

## 🚀 **EJECUTAR EL PROYECTO**

### **Opción A: Script Automatizado (Recomendado)**
```bash
# Desde la raíz del proyecto
.\start-services.ps1    # Windows PowerShell
# o
./start-services.sh     # Linux/Mac (si existe)
```

### **Opción B: Manual**
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📍 **URLs DE ACCESO**

Una vez iniciado:
- **🌐 Frontend:** http://localhost:5173
- **⚙️ Backend:** http://localhost:8005
- **📚 API Docs:** http://localhost:8005/docs

## 👤 **CREDENCIALES INICIALES**

El sistema incluye un administrador por defecto:
- **Email:** admin@miequipo.com
- **Contraseña:** admin123

## 🧪 **EJECUTAR TESTS**

### **Backend:**
```bash
cd backend
python tests/run_all_tests.py
```

### **Frontend:**
```bash
cd frontend
npm run test
npm run test:ui        # Interfaz visual
npm run test:coverage  # Con cobertura
```

### **Ambos:**
```bash
# Desde la raíz
python run_all_tests.py
```

## 📁 **ESTRUCTURA DEL PROYECTO**

```
equipo_con_respeto/
├── backend/              # API REST (FastAPI + SQLAlchemy)
│   ├── requirements.txt  # Dependencias Python
│   ├── .env.example      # Template de configuración
│   ├── main.py          # Punto de entrada
│   └── ...
├── frontend/            # Interfaz web (React + TypeScript)
│   ├── package.json     # Dependencias Node.js
│   ├── .env.example     # Template de configuración
│   └── ...
└── start-services.ps1   # Script de inicio automático
```

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error: Puerto ocupado**
```bash
# Cambiar puertos en:
# backend/main.py (línea con uvicorn.run)
# frontend/.env (VITE_API_BASE_URL)
```

### **Error: Dependencias**
```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Frontend
npm ci
```

### **Error: Base de datos**
```bash
# Resetear base de datos
cd backend
rm equipo_futbol.db
python main.py  # Se recrea automáticamente
```

### **Error: Email**
- Verificar credenciales en `backend/.env`
- Confirmar que la verificación en 2 pasos está activa
- Regenerar contraseña de aplicación si es necesaria

## 📞 **SOPORTE**

Si tienes problemas:
1. Revisar logs en la consola
2. Verificar que todos los puertos estén libres
3. Confirmar versiones de Python y Node.js
4. Revisar configuración de `.env`

---

🎉 **¡El proyecto debería estar funcionando completamente!**