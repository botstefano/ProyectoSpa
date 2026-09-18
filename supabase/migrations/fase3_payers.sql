-- =====================================================================
-- FASE 3 — PAYERS · MIGRACIÓN PARA UN PROYECTO SUPABASE YA CREADO
-- Ejecutar UNA VEZ en Supabase > SQL Editor antes de usar /staff/payers
-- =====================================================================

-- Actualizar tabla pago_detalle con campos adicionales para la API real
ALTER TABLE pago_detalle 
ADD COLUMN IF NOT EXISTS servicio_contratado varchar(100),
ADD COLUMN IF NOT EXISTS monto_total numeric(10,2),
ADD COLUMN IF NOT EXISTS metodo_pago varchar(30);

-- Crear tabla para cronograma de pagos
CREATE TABLE IF NOT EXISTS cronograma_pagos (
  id_cronograma   bigserial PRIMARY KEY,
  id_contacto     int NOT NULL REFERENCES contacto(id_contacto) ON DELETE RESTRICT,
  concepto        varchar(100) NOT NULL,
  monto           numeric(10,2) NOT NULL,
  fecha_vencimiento timestamptz NOT NULL,
  estado          varchar(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida','cancelada')),
  fecha_pago      timestamptz,
  metodo_pago     varchar(30)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cronograma_contacto ON cronograma_pagos(id_contacto);
CREATE INDEX IF NOT EXISTS idx_cronograma_estado ON cronograma_pagos(estado);
CREATE INDEX IF NOT EXISTS idx_cronograma_vencimiento ON cronograma_pagos(fecha_vencimiento);

-- Habilitar RLS para nuevas tablas
ALTER TABLE pago_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para Fase 3 (PAYERS) - uso interno staff
DROP POLICY IF EXISTS "payers_all_operations_pago_detalle" ON pago_detalle;
CREATE POLICY "payers_all_operations_pago_detalle" 
ON pago_detalle FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payers_all_operations_cronograma" ON cronograma_pagos;
CREATE POLICY "payers_all_operations_cronograma" 
ON cronograma_pagos FOR ALL TO anon USING (true) WITH CHECK (true);

-- IMPORTANTE: Para producción, cambiar 'anon' por 'authenticated' cuando se implemente Auth
