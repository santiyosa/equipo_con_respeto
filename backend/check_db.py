# Cargar variables de entorno desde .env.development si existe
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env.development")

# Script para verificar la conexión a la base de datos remota (PostgreSQL)
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

def check_postgres_db():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL no está definido en el entorno.")
        return False
    try:
        engine = create_engine(db_url)
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))


            print("Conexión exitosa a PostgreSQL. Resultado test:", list(result)[0][0])
        return True
    except SQLAlchemyError as e:
        print(f"Error al conectar a PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    check_postgres_db()

