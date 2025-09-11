-- Crear un jugador de prueba con credenciales para testing
INSERT OR IGNORE INTO jugadores (
    cedula, 
    nombre, 
    nombre_inscripcion, 
    telefono, 
    fecha_nacimiento, 
    talla_uniforme, 
    numero_camiseta,
    contacto_emergencia_nombre,
    contacto_emergencia_telefono,
    fecha_inscripcion,
    posicion,
    estado_cuenta,
    activo,
    email,
    password
) VALUES (
    '12345678',
    'Carlos Jugador Test',
    'Carlos Test',
    '3001234567',
    '1995-01-15',
    'M',
    10,
    'María Jugador',
    '3007654321',
    date('now'),
    NULL,
    1,
    1,
    'carlos@test.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f' -- hash de 'secret123'
);

-- Actualizar un jugador existente (si hay alguno)
-- UPDATE jugadores 
-- SET email = 'jugador@test.com', 
--     password = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
-- WHERE cedula = '1234567890';
