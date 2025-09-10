from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Para desarrollo/pruebas, usar SQLite
DATABASE_URL = "sqlite:///./equipo_futbol.db"

# Para producción con PostgreSQL, descomentar y configurar:
# DATABASE_URL = "postgresql://usuario:contraseña@localhost/equipo_futbol"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
