-- =====================================================================
-- LIMPIEZA COMPLETA DE DATOS DE PRUEBA — ORIGEN SPA & BIENESTAR
-- Ejecutar en Supabase > SQL Editor
-- Este script borra todos los leads, propuestas, pagos simulados y 
-- atenciones de prueba, dejando la base de datos limpia desde cero.
-- MANTIENE intactos los catálogos (estado_contacto, fuente_contacto).
-- =====================================================================

-- Opción 1: Truncado en cascada y reinicio de IDs autoincrementales
TRUNCATE TABLE 
  atencion_detalle,
  pago_simulado,
  pago_detalle,
  propuesta_chatbot,
  enriquecimiento_contacto,
  notificacion_fase,
  lead_detalle,
  contacto
RESTART IDENTITY CASCADE;

-- En caso de tener la tabla de alertas creada:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerta_impulsamiento_customer') THEN
    TRUNCATE TABLE alerta_impulsamiento_customer RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pago_cronograma') THEN
    TRUNCATE TABLE pago_cronograma RESTART IDENTITY CASCADE;
  END IF;
END $$;

-- Verificación de catálogos intactos
SELECT 'estado_contacto' AS tabla, count(*) FROM estado_contacto
UNION ALL
SELECT 'fuente_contacto' AS tabla, count(*) FROM fuente_contacto
UNION ALL
SELECT 'contacto (debe ser 0)' AS tabla, count(*) FROM contacto;
