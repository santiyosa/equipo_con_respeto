#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT * FROM configuraciones'))
        rows = list(result)
        print(f"Configuraciones encontradas: {len(rows)}")
        for row in rows:
            print(f"  - {row[1]}: {row[2]}")
except Exception as e:
    print(f"Error: {e}")
