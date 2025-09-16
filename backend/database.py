from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configuración de base de datos
# Desarrollo: SQLite local
# Producción: PostgreSQL en Render
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Producción - PostgreSQL (Render)
    # Render proporciona DATABASE_URL automáticamente
    if DATABASE_URL.startswith("postgres://"):
        # Render usa postgres://, pero SQLAlchemy 1.4+ requiere postgresql://
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # Desarrollo - SQLite local
    SQLALCHEMY_DATABASE_URL = "sqlite:///./equipo_futbol.db"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
