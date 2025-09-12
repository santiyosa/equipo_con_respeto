# Archivo de schemas principal - Importa todos los schemas desde el directorio schemas/
from schemas import admin, configuraciones, dashboard, egresos, estado_cuenta, jugadores, multas, pagos

# Re-exportar para compatibilidad
from schemas.admin import *
from schemas.configuraciones import *
from schemas.dashboard import *
from schemas.egresos import *
from schemas.estado_cuenta import *
from schemas.jugadores import *
from schemas.multas import *
from schemas.pagos import *
