import sqlite3

conn = sqlite3.connect('equipo_futbol.db')
cursor = conn.cursor()

# Verificar tablas de egresos
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%egreso%'")
tables = cursor.fetchall()
print('Tablas relacionadas con egresos:', tables)

if tables:
    # Contar egresos
    cursor.execute('SELECT COUNT(*) FROM egresos')
    count = cursor.fetchone()[0]
    print(f'Número de egresos en la base de datos: {count}')
    
    # Contar categorías
    cursor.execute('SELECT COUNT(*) FROM categorias_egreso')
    cat_count = cursor.fetchone()[0]
    print(f'Número de categorías de egreso: {cat_count}')
    
    # Mostrar estructura de egresos
    cursor.execute("PRAGMA table_info(egresos)")
    columns = cursor.fetchall()
    print('Estructura tabla egresos:', columns)
    
    # Mostrar estructura de categorías
    cursor.execute("PRAGMA table_info(categorias_egreso)")
    cat_columns = cursor.fetchall()
    print('Estructura tabla categorias_egreso:', cat_columns)
    
    if count > 0:
        cursor.execute('SELECT * FROM egresos LIMIT 3')
        egresos = cursor.fetchall()
        print('Primeros 3 egresos:', egresos)

conn.close()