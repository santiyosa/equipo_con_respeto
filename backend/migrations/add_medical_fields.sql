-- Migración: Agregar campos médicos a la tabla jugadores
-- Fecha: 2025-09-12
-- Descripción: Agregar campos EPS, lugar de atención y RH (tipo de sangre)

-- Agregar las nuevas columnas
ALTER TABLE jugadores ADD COLUMN eps VARCHAR(255);
ALTER TABLE jugadores ADD COLUMN lugar_atencion VARCHAR(255);
ALTER TABLE jugadores ADD COLUMN rh VARCHAR(10);

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN jugadores.eps IS 'Entidad Promotora de Salud del jugador';
COMMENT ON COLUMN jugadores.lugar_atencion IS 'Lugar donde el jugador recibe atención médica';
COMMENT ON COLUMN jugadores.rh IS 'Tipo de sangre del jugador (ej: O+, A-, B+, etc.)';

-- Verificar la migración
SELECT COUNT(*) as total_jugadores FROM jugadores;

-- Mostrar la estructura actualizada de la tabla
