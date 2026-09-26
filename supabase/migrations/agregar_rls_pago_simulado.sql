-- =====================================================================
-- CORRECCIÓN RLS PARA PAGO_SIMULADO, PAGO_DETALLE Y NOTIFICACIONES
-- Permite que el staff y clientes (que operan con la anon key en frontend)
-- puedan gestionar y registrar pagos sin bloqueos de seguridad
-- =====================================================================

-- 1. pago_simulado
ALTER TABLE pago_simulado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pago_simulado_all_operations_anon" ON pago_simulado;
CREATE POLICY "pago_simulado_all_operations_anon" 
ON pago_simulado FOR ALL TO anon 
USING (true) WITH CHECK (true);

-- 2. pago_detalle (para sincronizar pagos confirmados)
ALTER TABLE pago_detalle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payers_all_operations_pago_detalle" ON pago_detalle;
CREATE POLICY "payers_all_operations_pago_detalle" 
ON pago_detalle FOR ALL TO anon 
USING (true) WITH CHECK (true);

-- 3. notificacion_fase (para alertas entre fases)
ALTER TABLE notificacion_fase ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notificaciones_all_operations" ON notificacion_fase;
CREATE POLICY "notificaciones_all_operations" 
ON notificacion_fase FOR ALL TO anon 
USING (true) WITH CHECK (true);
