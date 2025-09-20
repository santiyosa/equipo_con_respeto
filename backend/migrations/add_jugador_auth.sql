-- Agregar campos de autenticación a la tabla jugadores

-- Paso 1: Agregar columnas sin restricción UNIQUE
ALTER TABLE jugadores ADD COLUMN email TEXT;
ALTER TABLE jugadores ADD COLUMN password TEXT;

-- Paso 2: Crear índice único para email (después de migración)
-- CREATE UNIQUE INDEX idx_jugadores_email ON jugadores (email) WHERE email IS NOT NULL;

-- Los jugadores existentes tendrán email/password nulos inicialmente
-- El administrador deberá configurarlos manualmente
