"""
Script para migrar datos de SQLite a PostgreSQL
Útil para transferir datos locales a producción en Render
"""
import sqlite3
import psycopg2
import os
from datetime import datetime
import sys

def migrate_data_sqlite_to_postgresql():
    """
    Migra datos de SQLite local a PostgreSQL en Render
    """
    
    # URL de PostgreSQL (debe proporcionarse como variable de entorno)
    postgresql_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRESQL_URL")
    
    if not postgresql_url:
        print("❌ Error: No se encontró DATABASE_URL o POSTGRESQL_URL")
        print("💡 Configura la variable de entorno con la URL de PostgreSQL de Render")
        return False
    
    # Ajustar URL si es necesario
    if postgresql_url.startswith("postgres://"):
        postgresql_url = postgresql_url.replace("postgres://", "postgresql://", 1)
    
    try:
        # Conectar a SQLite local
        print("🔄 Conectando a SQLite local...")
        sqlite_conn = sqlite3.connect('equipo_futbol.db')
        sqlite_cursor = sqlite_conn.cursor()
        
        # Conectar a PostgreSQL
        print("🔄 Conectando a PostgreSQL en Render...")
        pg_conn = psycopg2.connect(postgresql_url)
        pg_cursor = pg_conn.cursor()
        
        # Obtener lista de tablas (excluyendo sqlite_sequence)
        sqlite_cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        """)
        tables = [row[0] for row in sqlite_cursor.fetchall()]
        
        print(f"📋 Tablas encontradas: {tables}")
        
        # Migrar cada tabla
        for table in tables:
            print(f"\n🔄 Migrando tabla: {table}")
            
            # Obtener datos de SQLite
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print(f"   ⚠️  Tabla {table} está vacía")
                continue
            
            # Obtener nombres de columnas
            sqlite_cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in sqlite_cursor.fetchall()]
            
            # Preparar INSERT para PostgreSQL
            placeholders = ', '.join(['%s'] * len(columns))
            columns_str = ', '.join(columns)
            insert_sql = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
            
            # Limpiar tabla en PostgreSQL (opcional)
            pg_cursor.execute(f"DELETE FROM {table}")
            
            # Insertar datos
            pg_cursor.executemany(insert_sql, rows)
            pg_conn.commit()
            
            print(f"   ✅ {len(rows)} registros migrados a {table}")
        
        print(f"\n🎉 Migración completada exitosamente!")
        print(f"📊 Total de tablas migradas: {len(tables)}")
        
        # Cerrar conexiones
        sqlite_conn.close()
        pg_conn.close()
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error SQLite: {e}")
        return False
    except psycopg2.Error as e:
        print(f"❌ Error PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

def export_sqlite_data():
    """
    Exporta datos de SQLite a archivos SQL para backup
    """
    try:
        print("📤 Exportando datos de SQLite...")
        
        conn = sqlite3.connect('equipo_futbol.db')
        
        # Crear archivo de backup
        backup_filename = f"backup_sqlite_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        
        with open(backup_filename, 'w', encoding='utf-8') as f:
            for line in conn.iterdump():
                f.write('%s\n' % line)
        
        conn.close()
        
        print(f"✅ Backup creado: {backup_filename}")
        return backup_filename
        
    except Exception as e:
        print(f"❌ Error al crear backup: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Script de Migración SQLite → PostgreSQL")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "backup":
        # Solo crear backup
        export_sqlite_data()
    else:
        # Migración completa
        print("⚠️  Este script migrará datos de SQLite local a PostgreSQL en Render")
        print("🔑 Asegúrate de tener configurada DATABASE_URL")
        
        # Crear backup primero
        backup_file = export_sqlite_data()
        if backup_file:
            print(f"✅ Backup creado: {backup_file}")
        
        # Confirmar migración
        confirm = input("\n¿Continuar con la migración? (y/N): ")
        if confirm.lower() == 'y':
            migrate_data_sqlite_to_postgresql()
        else:
            print("❌ Migración cancelada")