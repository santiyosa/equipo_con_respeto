-- ========================================
-- ESQUEMA FINAL DE BASE DE DATOS 
-- Sistema de Gestión de Equipo de Fútbol
-- ========================================

-- Tabla de administradores
CREATE TABLE administradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(255) NOT NULL  -- 'admin_pagos', 'admin_convocatorias', etc.
);

-- Tabla de jugadores
CREATE TABLE jugadores (
    cedula VARCHAR(255) PRIMARY KEY,  -- Cédula de ciudadanía como identificador único
    nombre VARCHAR(255) NOT NULL,
    nombre_inscripcion VARCHAR(255) UNIQUE NOT NULL,  -- Nombre o alias para inscripciones
    telefono VARCHAR(255) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    talla_uniforme VARCHAR(255) NOT NULL,  -- S, M, L, XL, etc.
    numero_camiseta INTEGER UNIQUE,  -- Puede ser NULL
    contacto_emergencia_nombre VARCHAR(255) NOT NULL,
    contacto_emergencia_telefono VARCHAR(255) NOT NULL,
    recomendado_por_cedula VARCHAR(255) REFERENCES jugadores(cedula),  -- Auto-referencia opcional
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_cuenta BOOLEAN DEFAULT TRUE,  -- Si está al día con pagos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensualidades (pagos de cuotas)
CREATE TABLE mensualidades (
    id SERIAL PRIMARY KEY,
    jugador_cedula VARCHAR(255) NOT NULL REFERENCES jugadores(cedula) ON DELETE CASCADE,
    mes INTEGER NOT NULL,  -- 1-12
    ano INTEGER NOT NULL,  -- Año del pago
    valor DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES administradores(id),
    
    -- Evitar pagos duplicados del mismo mes/año
    UNIQUE(jugador_cedula, mes, ano)
);

-- Tabla de causales de multa (tipos de multas)
CREATE TABLE causales_multa (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL
);

-- Tabla de multas
CREATE TABLE multas (
    id SERIAL PRIMARY KEY,
    jugador_cedula VARCHAR(255) NOT NULL REFERENCES jugadores(cedula) ON DELETE CASCADE,
    causal_id INTEGER NOT NULL REFERENCES causales_multa(id),
    fecha_multa DATE NOT NULL DEFAULT CURRENT_DATE,
    pagada BOOLEAN DEFAULT FALSE,
    fecha_pago TIMESTAMP,  -- Solo se llena cuando se paga
    registrado_por INTEGER REFERENCES administradores(id)
);

-- Tabla de categorías de egresos
CREATE TABLE categorias_egreso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,  -- "Equipamiento", "Implementos", etc.
    descripcion TEXT
);

-- Tabla de egresos (gastos del equipo)
CREATE TABLE egresos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias_egreso(id),
    concepto VARCHAR(255) NOT NULL,  -- Descripción específica del gasto
    valor DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comprobante VARCHAR(255),  -- Número de factura o recibo
    notas TEXT,
    registrado_por INTEGER REFERENCES administradores(id)
);

-- Tabla de otros aportes (contribuciones adicionales)
CREATE TABLE otros_aportes (
    id SERIAL PRIMARY KEY,
    jugador_cedula VARCHAR(255) NOT NULL REFERENCES jugadores(cedula) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL,  -- Descripción del aporte
    valor DECIMAL(10,2) NOT NULL,
    fecha_aporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES administradores(id)
);

-- Tabla de inscripciones para partidos
CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    fecha_partido DATE NOT NULL,  -- Fecha del partido
    jugador_cedula VARCHAR(255) REFERENCES jugadores(cedula),  -- Puede ser NULL si no está registrado
    nombre_inscrito VARCHAR(255) NOT NULL,  -- Nombre usado en la inscripción
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    orden_inscripcion INTEGER NOT NULL,  -- Orden de llegada de la inscripción
    mensaje_whatsapp TEXT  -- Mensaje original de WhatsApp
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para mejorar consultas frecuentes
CREATE INDEX idx_mensualidades_jugador ON mensualidades(jugador_cedula);
CREATE INDEX idx_mensualidades_fecha ON mensualidades(fecha_pago);
CREATE INDEX idx_mensualidades_periodo ON mensualidades(ano, mes);

CREATE INDEX idx_multas_jugador ON multas(jugador_cedula);
CREATE INDEX idx_multas_fecha ON multas(fecha_multa);
CREATE INDEX idx_multas_pagada ON multas(pagada);

CREATE INDEX idx_egresos_categoria ON egresos(categoria_id);
CREATE INDEX idx_egresos_fecha ON egresos(fecha);

CREATE INDEX idx_otros_aportes_jugador ON otros_aportes(jugador_cedula);
CREATE INDEX idx_otros_aportes_fecha ON otros_aportes(fecha_aporte);

CREATE INDEX idx_inscripciones_fecha_partido ON inscripciones(fecha_partido);
CREATE INDEX idx_inscripciones_jugador ON inscripciones(jugador_cedula);

-- ========================================
-- DATOS INICIALES SUGERIDOS
-- ========================================

-- Categorías de egresos básicas
INSERT INTO categorias_egreso (nombre, descripcion) VALUES
('Equipamiento', 'Uniformes, camisetas, pantalones, medias'),
('Implementos', 'Balones, conos, petos, botiquín'),
('Aportes Sociales', 'Gastos de reuniones, celebraciones, regalos'),
('Transporte', 'Gastos de transporte para partidos'),
('Arbitraje', 'Pagos a árbitros'),
('Inscripciones', 'Pagos de inscripciones a campeonatos'),
('Mantenimiento', 'Reparaciones de implementos'),
('Otros', 'Gastos diversos no categorizados');

-- Causales de multa comunes
INSERT INTO causales_multa (descripcion, valor) VALUES
('Falta injustificada al entrenamiento', 5000.00),
('Falta injustificada al partido', 10000.00),
('Llegar tarde al entrenamiento', 3000.00),
('Llegar tarde al partido', 8000.00),
('Tarjeta roja en partido', 15000.00),
('Tarjeta amarilla en partido', 5000.00),
('Falta de respeto al cuerpo técnico', 20000.00),
('No usar el uniforme completo', 3000.00),
('Consumo de alcohol antes del partido', 25000.00),
('Otros comportamientos inadecuados', 10000.00);

-- ========================================
-- COMENTARIOS ADICIONALES
-- ========================================

-- Este esquema está diseñado para:
-- 1. Gestión completa de jugadores con información de contacto
-- 2. Control de pagos mensuales y otros aportes
-- 3. Sistema de multas con causales predefinidas
-- 4. Control de gastos del equipo por categorías
-- 5. Gestión de inscripciones para partidos
-- 6. Trazabilidad de quién registra cada operación
-- 7. Cálculo automático del estado financiero del equipo

-- El sistema calcula automáticamente:
-- - Saldo del equipo = (Mensualidades + Multas pagadas + Otros aportes) - Egresos
-- - Estado de cuenta por jugador
-- - Reportes financieros por períodos

-- Tabla de configuraciones del sistema
CREATE TABLE configuraciones (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER REFERENCES administradores(id)
);

-- Insertar configuración inicial de mensualidad
INSERT INTO configuraciones (clave, valor, descripcion) 
VALUES ('mensualidad', 50000.00, 'Valor de la mensualidad del equipo');
