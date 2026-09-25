-- =====================================================================
-- SCRIPT PARA CORREGIR POLÍTICAS RLS DE notificacion_fase
-- Esto soluciona el timeout al consultar notificaciones
-- =====================================================================

-- Verificar si la tabla existe y tiene RLS habilitado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacion_fase') THEN
    RAISE NOTICE 'Tabla notificacion_fase existe';
    
    -- Habilitar RLS si no está habilitado
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'notificacion_fase' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE notificacion_fase ENABLE ROW LEVEL SECURITY;
      RAISE NOTICE 'RLS habilitado en notificacion_fase';
    END IF;
  ELSE
    RAISE NOTICE 'Tabla notificacion_fase no existe, creándola...';
  END IF;
END $$;

-- Eliminar todas las políticas existentes de notificacion_fase
DROP POLICY IF EXISTS "notificaciones_insert_anon" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_select_anon" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_update_anon" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_delete_anon" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_insert_authenticated" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_select_authenticated" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_update_authenticated" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_delete_authenticated" ON notificacion_fase;
DROP POLICY IF EXISTS "notificaciones_all_operations" ON notificacion_fase;

-- Crear políticas para usuarios anónimos (acceso público limitado)
CREATE POLICY "notificaciones_select_anon" 
ON notificacion_fase FOR SELECT TO anon 
USING (false); -- Anónimos no pueden leer notificaciones (solo interno)

-- Crear políticas para usuarios autenticados (staff)
CREATE POLICY "notificaciones_insert_authenticated" 
ON notificacion_fase FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "notificaciones_select_authenticated" 
ON notificacion_fase FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "notificaciones_update_authenticated" 
ON notificacion_fase FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

CREATE POLICY "notificaciones_delete_authenticated" 
ON notificacion_fase FOR DELETE TO authenticated 
USING (true);

-- Verificar políticas creadas
SELECT 
  'notificacion_fase' as tabla,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notificacion_fase'
ORDER BY policyname;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de notificacion_fase corregidas';
  RAISE NOTICE '📋 Solo usuarios autenticados (staff) pueden acceder a notificaciones';
  RAISE NOTICE '🚀 El timeout debería resolverse';
END $$;