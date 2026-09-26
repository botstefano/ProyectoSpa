-- =====================================================================
-- CORRECCIÓN RLS PARA PAGO_SIMULADO
-- Permite que el staff (que opera con la anon key en el frontend) pueda
-- generar enlaces de pago simulado y que los clientes puedan completarlos
-- =====================================================================

-- Habilitar RLS en la tabla pago_simulado (si no está habilitado)
ALTER TABLE pago_simulado ENABLE ROW LEVEL SECURITY;

-- Eliminar la política si ya existía para evitar errores de duplicado
DROP POLICY IF EXISTS "pago_simulado_all_operations_anon" ON pago_simulado;

-- Permitir todas las operaciones al rol anon (uso del staff y portal de pago)
CREATE POLICY "pago_simulado_all_operations_anon" 
ON pago_simulado FOR ALL TO anon 
USING (true) WITH CHECK (true);
