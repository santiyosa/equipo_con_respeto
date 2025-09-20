from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os


# Forzar la URL de la base de datos directamente (descartar problemas de entorno)
SQLALCHEMY_DATABASE_URL = "postgresql://equipo_admin:V38jRCRJYZ8B4LKjamYoFaBhQSVoe83V@dpg-d34d4n56ubrc73a6kdag-a.oregon-postgres.render.com/equipo_futbol"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()