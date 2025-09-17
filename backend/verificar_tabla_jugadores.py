import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

conn = psycopg2.connect(database_url)
cursor = conn.cursor()

print('Estructura de la tabla jugadores:')
cursor.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'jugadores'
    ORDER BY ordinal_position
""")

for col in cursor.fetchall():
    print(f'  {col[0]} - {col[1]} - nullable: {col[2]}')

conn.close()