-- Migración: Crear tabla articulos_normativa
-- Fecha: 2025-09-11
-- Descripción: Nueva tabla para gestión de normativa del equipo

CREATE TABLE IF NOT EXISTS articulos_normativa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_articulo VARCHAR(20) NOT NULL UNIQUE,  -- ej: "5.2", "12.1"
    titulo VARCHAR(200) NOT NULL,                 -- ej: "Puntualidad en entrenamientos"
    contenido TEXT NOT NULL,                      -- Texto completo del artículo
    tipo VARCHAR(20) NOT NULL DEFAULT 'informativo',  -- 'informativo' | 'sancionable'
    vigencia_desde DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Fecha de creación automática
    orden_display INTEGER NOT NULL DEFAULT 0,    -- Para ordenar artículos en la normativa
    activo BOOLEAN NOT NULL DEFAULT TRUE,         -- Para desactivar artículos obsoletos
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_articulos_normativa_numero ON articulos_normativa(numero_articulo);
CREATE INDEX IF NOT EXISTS idx_articulos_normativa_tipo ON articulos_normativa(tipo);
CREATE INDEX IF NOT EXISTS idx_articulos_normativa_activo ON articulos_normativa(activo);
CREATE INDEX IF NOT EXISTS idx_articulos_normativa_orden ON articulos_normativa(orden_display);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS update_articulos_normativa_updated_at 
AFTER UPDATE ON articulos_normativa
BEGIN
    UPDATE articulos_normativa 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
