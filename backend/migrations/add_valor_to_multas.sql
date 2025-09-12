-- Migración: Agregar campo valor a tabla multas
-- Fecha: 2025-09-11
-- Propósito: Las multas deben mantener su valor original al momento de creación

-- 1. Agregar la columna valor a la tabla multas
ALTER TABLE multas ADD COLUMN valor FLOAT NOT NULL DEFAULT 0;

-- 2. Actualizar las multas existentes con el valor de su causal correspondiente
UPDATE multas 
SET valor = (
    SELECT c.valor 
    FROM causales_multa c 
    WHERE c.id = multas.causal_id
);

-- 3. Verificar que todos los valores se actualizaron correctamente
-- SELECT m.id, m.jugador_cedula, c.descripcion as causal, m.valor as valor_multa, c.valor as valor_causal
-- FROM multas m
-- JOIN causales_multa c ON m.causal_id = c.id;
