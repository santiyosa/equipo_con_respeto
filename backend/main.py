from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers.pagos import router as pagos_router
from routers.jugadores import router as jugadores_router
from routers.multas import router as multas_router
from routers.egresos import router as egresos_router
from routers.admin import router as admin_router
from routers.estado_cuenta import router as estado_cuenta_router
from routers.dashboard import router as dashboard_router
from routers.configuraciones import router as configuraciones_router

# Crear todas las tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Equipo de Fútbol")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir todos los routers
app.include_router(admin_router, prefix="/api", tags=["administradores"])
app.include_router(jugadores_router, prefix="/api", tags=["jugadores"])
app.include_router(pagos_router, prefix="/api", tags=["pagos"])
app.include_router(multas_router, prefix="/api", tags=["multas"])
app.include_router(egresos_router, prefix="/api", tags=["egresos"])
app.include_router(estado_cuenta_router, prefix="/api", tags=["estado-cuenta"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(configuraciones_router, prefix="/api/configuraciones", tags=["configuraciones"])

@app.get("/")
def root():
    return {"message": "API del Equipo de Fútbol funcionando correctamente"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
