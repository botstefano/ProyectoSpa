-- =====================================================================
-- FASE 2 — LEADS · MIGRACIÓN PARA UN PROYECTO SUPABASE YA CREADO
-- Ejecutar UNA VEZ en Supabase > SQL Editor antes de usar /staff/leads
-- =====================================================================

-- Agregar columnas para seguimiento de propuestas en lead_detalle
ALTER TABLE lead_detalle 
ADD COLUMN IF NOT EXISTS propuesta_aceptada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_aceptacion timestamptz,
ADD COLUMN IF NOT EXISTS datos_propuesta jsonb;

-- Crear tabla para tracking de propuestas
CREATE TABLE IF NOT EXISTS propuesta_detalle (
  id_propuesta    bigserial PRIMARY KEY,
  id_contacto     int NOT NULL REFERENCES contacto(id_contacto) ON DELETE RESTRICT,
  nombre_propuesta varchar(100),
  descripcion     text,
  precio_regular  numeric(10,2),
  precio_especial numeric(10,2),
  descuento       numeric(5,2),
  duracion        varchar(50),
  incluye         text,
  fecha_generada  timestamptz NOT NULL DEFAULT now(),
  fecha_aceptada  timestamptz,
  estado          varchar(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptada','rechazada','expirada'))
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_propuesta_contacto ON propuesta_detalle(id_contacto);
CREATE INDEX IF NOT EXISTS idx_propuesta_estado ON propuesta_detalle(estado);

-- Habilitar RLS para nuevas tablas
ALTER TABLE lead_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuesta_detalle ENABLE ROW LEVEL SECURITY;

-- Políticas para Fase 2 (LEADS) - uso interno staff
DROP POLICY IF EXISTS "leads_all_operations_lead_detalle" ON lead_detalle;
CREATE POLICY "leads_all_operations_lead_detalle" 
ON lead_detalle FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leads_all_operations_propuesta_detalle" ON propuesta_detalle;
CREATE POLICY "leads_all_operations_propuesta_detalle" 
ON propuesta_detalle FOR ALL TO anon USING (true) WITH CHECK (true);

-- IMPORTANTE: Para producción, cambiar 'anon' por 'authenticated' cuando se implemente Auth
