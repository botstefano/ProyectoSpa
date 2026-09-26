-- =====================================================================
-- HABILITAR POLÍTICAS RLS PARA FASE 4 (CUSTOMERS / ATENCIÓN DETALLE)
-- Ejecutar en Supabase > SQL Editor
-- =====================================================================

-- 1. Habilitar RLS en atencion_detalle y otorgar permisos
ALTER TABLE atencion_detalle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atencion_detalle_select_all" ON atencion_detalle;
DROP POLICY IF EXISTS "atencion_detalle_insert_all" ON atencion_detalle;
DROP POLICY IF EXISTS "atencion_detalle_update_all" ON atencion_detalle;
DROP POLICY IF EXISTS "atencion_detalle_delete_all" ON atencion_detalle;

-- Permitir lectura (anon y authenticated)
CREATE POLICY "atencion_detalle_select_all" 
ON atencion_detalle FOR SELECT 
TO public 
USING (true);

-- Permitir registro de atenciones
CREATE POLICY "atencion_detalle_insert_all" 
ON atencion_detalle FOR INSERT 
TO public 
WITH CHECK (true);

-- Permitir actualización de seguimientos y estados
CREATE POLICY "atencion_detalle_update_all" 
ON atencion_detalle FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

-- Permitir eliminación
CREATE POLICY "atencion_detalle_delete_all" 
ON atencion_detalle FOR DELETE 
TO public 
USING (true);

-- 2. Habilitar RLS en alerta_impulsamiento_customer si existe la tabla
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerta_impulsamiento_customer') THEN
    EXECUTE 'ALTER TABLE alerta_impulsamiento_customer ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "alerta_customer_select_all" ON alerta_impulsamiento_customer';
    EXECUTE 'DROP POLICY IF EXISTS "alerta_customer_insert_all" ON alerta_impulsamiento_customer';
    EXECUTE 'DROP POLICY IF EXISTS "alerta_customer_update_all" ON alerta_impulsamiento_customer';
    
    EXECUTE 'CREATE POLICY "alerta_customer_select_all" ON alerta_impulsamiento_customer FOR SELECT TO public USING (true)';
    EXECUTE 'CREATE POLICY "alerta_customer_insert_all" ON alerta_impulsamiento_customer FOR INSERT TO public WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "alerta_customer_update_all" ON alerta_impulsamiento_customer FOR UPDATE TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;
