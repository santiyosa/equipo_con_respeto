-- Migración para asegurar que el campo apellido esté correctamente configurado
-- en la tabla jugadores de PostgreSQL

-- Verificar si el campo apellido existe, si no existe, agregarlo
DO $$ 
BEGIN
    -- Intentar agregar la columna apellido si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jugadores' 
        AND column_name = 'apellido'
    ) THEN
        ALTER TABLE jugadores ADD COLUMN apellido VARCHAR NOT NULL DEFAULT '';
        RAISE NOTICE 'Campo apellido agregado a la tabla jugadores';
    ELSE
        RAISE NOTICE 'Campo apellido ya existe en la tabla jugadores';
    END IF;
    
    -- Asegurar que apellido no sea nullable
    ALTER TABLE jugadores ALTER COLUMN apellido SET NOT NULL;
    
    -- Si hay registros con apellido vacío, actualizarlos
    UPDATE jugadores 
    SET apellido = 'Sin Apellido' 
    WHERE apellido IS NULL OR apellido = '';
    
END $$;