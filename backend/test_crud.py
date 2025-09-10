#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from crud import configuraciones as crud_configuraciones

try:
    db = SessionLocal()
    result = crud_configuraciones.get_configuraciones(db)
    print(f"CRUD Test - Configuraciones encontradas: {len(result)}")
    for config in result:
        print(f"  - {config.clave}: {config.valor}")
    db.close()
except Exception as e:
    print(f"Error en CRUD: {e}")
    import traceback
    traceback.print_exc()
