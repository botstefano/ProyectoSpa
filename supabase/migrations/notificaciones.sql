-- =====================================================================
-- SISTEMA DE NOTIFICACIONES ENTRE FASES
-- Ejecutar UNA VEZ en Supabase > SQL Editor para habilitar el flujo conectado
-- =====================================================================

-- Crear tabla de notificaciones entre fases
CREATE TABLE IF NOT EXISTS notificacion_fase (
  id_notificacion   bigserial PRIMARY KEY,
  id_contacto       int NOT NULL REFERENCES contacto(id_contacto) ON DELETE RESTRICT,
  fase_origen       varchar(20) NOT NULL CHECK (fase_origen IN ('buyers','leads','payers','customers')),
  fase_destino      varchar(20) NOT NULL CHECK (fase_destino IN ('buyers','leads','payers','customers')),
  tipo_evento       varchar(50) NOT NULL,
  mensaje          text NOT NULL,
  data_adicional    jsonb,
  leida            boolean DEFAULT false,
  fecha_creacion    timestamptz NOT NULL DEFAULT now(),
  fecha_lectura     timestamptz
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notificacion_contacto ON notificacion_fase(id_contacto);
CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON notificacion_fase(leida, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_notificacion_destino ON notificacion_fase(fase_destino);

-- Habilitar RLS para tabla de notificaciones
ALTER TABLE notificacion_fase ENABLE ROW LEVEL SECURITY;

-- Política para sistema de notificaciones - uso interno staff
DROP POLICY IF EXISTS "notificaciones_all_operations" ON notificacion_fase;
CREATE POLICY "notificaciones_all_operations" 
ON notificacion_fase FOR ALL TO anon USING (true) WITH CHECK (true);

-- IMPORTANTE: Para producción, cambiar 'anon' por 'authenticated' cuando se implemente Auth
