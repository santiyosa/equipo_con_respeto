#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from crud import dashboard as dashboard_crud

try:
    db = SessionLocal()
    result = dashboard_crud.obtener_resumen_dashboard(db)
    print(f"Dashboard Test - Resumen obtenido exitosamente")
    print(f"  - Total jugadores: {result.total_jugadores}")
    print(f"  - Saldo actual: ${result.saldo_actual:,.2f}")
    db.close()
except Exception as e:
    print(f"Error en Dashboard CRUD: {e}")
    import traceback
    traceback.print_exc()
