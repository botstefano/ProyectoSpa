-- =====================================================================
-- SCRIPT PARA CORREGIR POLÍTICAS RLS DE ENRIQUECIMIENTO Y PAGO_SIMULADO
-- Ejecutar este script en Supabase SQL Editor para corregir los errores
-- =====================================================================

-- =====================================================================
-- PARTE 1: CORREGIR POLÍTICAS DE enriquecimiento_contacto
-- =====================================================================

-- Primero, eliminar TODAS las políticas existentes de enriquecimiento_contacto
DROP POLICY IF EXISTS "enriquecimiento_insert_anon" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_select_anon_by_token" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_update_anon" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_insert_authenticated" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_select_authenticated" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_update_authenticated" ON enriquecimiento_contacto;

-- Eliminar cualquier otra política que pueda existir
DROP POLICY IF EXISTS "enriquecimiento_all_operations" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_select_anon" ON enriquecimiento_contacto;

-- Ahora crear las políticas correctas para usuarios anónimos (formularios públicos)
CREATE POLICY "enriquecimiento_insert_anon" 
ON enriquecimiento_contacto FOR INSERT TO anon 
WITH CHECK (true);

CREATE POLICY "enriquecimiento_select_anon_by_token" 
ON enriquecimiento_contacto FOR SELECT TO anon 
USING (token_enriquecimiento IS NOT NULL);

CREATE POLICY "enriquecimiento_update_anon" 
ON enriquecimiento_contacto FOR UPDATE TO anon 
USING (true) WITH CHECK (true);

-- Políticas para usuarios autenticados (staff)
CREATE POLICY "enriquecimiento_insert_authenticated" 
ON enriquecimiento_contacto FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "enriquecimiento_select_authenticated" 
ON enriquecimiento_contacto FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "enriquecimiento_update_authenticated" 
ON enriquecimiento_contacto FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

-- =====================================================================
-- PARTE 2: CORREGIR POLÍTICAS DE pago_simulado
-- =====================================================================

-- Eliminar TODAS las políticas existentes de pago_simulado
DROP POLICY IF EXISTS "pago_simulado_insert_authenticated" ON pago_simulado;
DROP POLICY IF EXISTS "pago_simulado_select_authenticated" ON pago_simulado;
DROP POLICY IF EXISTS "pago_simulado_update_authenticated" ON pago_simulado;
DROP POLICY IF EXISTS "pago_simulado_update_anon" ON pago_simulado;
DROP POLICY IF EXISTS "pago_simulado_select_anon_by_token" ON pago_simulado;

-- Eliminar cualquier otra política que pueda existir
DROP POLICY IF EXISTS "pago_simulado_all_operations" ON pago_simulado;
DROP POLICY IF EXISTS "pago_simulado_select_anon" ON pago_simulado;

-- Crear las políticas correctas para usuarios autenticados (staff)
CREATE POLICY "pago_simulado_insert_authenticated" 
ON pago_simulado FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "pago_simulado_select_authenticated" 
ON pago_simulado FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "pago_simulado_update_authenticated" 
ON pago_simulado FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

-- Crear las políticas correctas para usuarios anónimos (clientes públicos)
CREATE POLICY "pago_simulado_update_anon" 
ON pago_simulado FOR UPDATE TO anon 
USING (estado_pago = 'pendiente' AND expira_en > now())
WITH CHECK (estado_pago IN ('pendiente', 'completado'));

CREATE POLICY "pago_simulado_select_anon_by_token" 
ON pago_simulado FOR SELECT TO anon 
USING (token_pago IS NOT NULL AND estado_pago = 'pendiente' AND expira_en > now());

-- =====================================================================
-- VERIFICACIÓN DE POLÍTICAS CREADAS
-- =====================================================================

-- Verificar políticas de enriquecimiento_contacto
SELECT 
  'enriquecimiento_contacto' as tabla,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'enriquecimiento_contacto'
ORDER BY policyname;

-- Verificar políticas de pago_simulado
SELECT 
  'pago_simulado' as tabla,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pago_simulado'
ORDER BY policyname;

-- =====================================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS corregidas exitosamente';
  RAISE NOTICE '📋 Tablas actualizadas: enriquecimiento_contacto, pago_simulado';
  RAISE NOTICE '🔒 Roles configurados: anon (público), authenticated (staff)';
  RAISE NOTICE '🚀 Los formularios públicos ahora deberían funcionar correctamente';
END $$;