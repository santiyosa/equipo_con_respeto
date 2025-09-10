import sqlite3

conn = sqlite3.connect('equipo_futbol.db')
cursor = conn.cursor()

# Obtener todas las tablas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print('Tablas en la base de datos:')
for table in tables:
    table_name = table[0]
    print(f'\n--- Tabla: {table_name} ---')
    
    try:
        # Contar registros
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        count = cursor.fetchone()[0]
        print(f'Registros: {count}')
        
        # Si hay registros, mostrar algunos ejemplos
        if count > 0 and table_name == 'jugadores':
            cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 3')
            records = cursor.fetchall()
            for record in records:
                print(f'  {record}')
                
    except Exception as e:
        print(f'Error: {e}')

conn.close()
