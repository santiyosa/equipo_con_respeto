-- Script de migración: Crear artículos por defecto para causales existentes
-- Fecha: 2025-09-11
-- Descripción: Crea artículos de normativa por defecto y vincula las causales existentes

-- Verificar causales existentes
SELECT 'Causales existentes antes de la migración:' as mensaje;
SELECT c.id, c.descripcion, c.valor, c.articulo_id 
FROM causales_multa c 
ORDER BY c.id;

-- Crear artículos por defecto para cada causal existente que no tenga artículo
INSERT INTO articulos_normativa (numero_articulo, titulo, contenido, tipo, orden_display, activo)
SELECT DISTINCT
    CAST(ROW_NUMBER() OVER (ORDER BY c.id) as TEXT) || '.1' as numero_articulo,
    'Normativa para ' || c.descripcion as titulo,
    'Artículo generado automáticamente para la causal de multa: ' || c.descripcion || '

Este artículo establece las bases normativas para la aplicación de esta sanción. El valor de la multa se establece en $' || CAST(c.valor as TEXT) || '.

Este artículo fue creado automáticamente durante la migración del sistema. Se recomienda actualizar el contenido con la normativa específica correspondiente.' as contenido,
    'sancionable' as tipo,
    ROW_NUMBER() OVER (ORDER BY c.id) as orden_display,
    TRUE as activo
FROM causales_multa c 
WHERE c.articulo_id IS NULL;

-- Actualizar las causales para vincularlas con los artículos creados
UPDATE causales_multa 
SET articulo_id = (
    SELECT a.id 
    FROM articulos_normativa a 
    WHERE a.titulo = 'Normativa para ' || causales_multa.descripcion
    LIMIT 1
)
WHERE articulo_id IS NULL;

-- Verificar el resultado de la migración
SELECT 'Artículos creados:' as mensaje;
SELECT a.id, a.numero_articulo, a.titulo, a.tipo, a.activo
FROM articulos_normativa a 
ORDER BY a.orden_display;

SELECT 'Causales después de la migración:' as mensaje;
SELECT c.id, c.descripcion, c.valor, c.articulo_id, a.numero_articulo, a.titulo
FROM causales_multa c 
LEFT JOIN articulos_normativa a ON c.articulo_id = a.id
ORDER BY c.id;
