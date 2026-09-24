-- =====================================================================
-- ACTUALIZACIÓN DE SEGURIDAD CRÍTICA: Cambiar políticas RLS de anon a authenticated
-- Esta migración actualiza las políticas de seguridad para requerir autenticación
-- en los paneles internos del staff (Fases 2-4)
-- =====================================================================

-- IMPORTANTE: Esta migración debe ejecutarse DESPUÉS de implementar Supabase Auth
-- en la aplicación. De lo contrario, los paneles internos dejarán de funcionar.

-- Habilitar RLS en todas las tablas (si no está habilitado)
ALTER TABLE contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitalanding ENABLE ROW LEVEL SECURITY;
ALTER TABLE descarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacto_campana ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajeenviado ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuente_captacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadmagnet ENABLE ROW LEVEL SECURITY;
ALTER TABLE estado_contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuesta_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE pago_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atencion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta_impulsamiento_customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion_fase ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLÍTICAS PARA FASE 1 (BUYERS) - Landing pública
-- Estas mantienen acceso para 'anon' (público)
-- =====================================================================

-- Catálogos: lectura pública (el formulario necesita resolver ids por nombre)
DROP POLICY IF EXISTS "catalogo_lectura_publica_estado" ON estado_contacto;
CREATE POLICY "catalogo_lectura_publica_estado"  
ON estado_contacto FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "catalogo_lectura_publica_fuente" ON fuente_captacion;
CREATE POLICY "catalogo_lectura_publica_fuente"  
ON fuente_captacion FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "catalogo_lectura_publica_magnet" ON leadmagnet;
CREATE POLICY "catalogo_lectura_publica_magnet"  
ON leadmagnet FOR SELECT TO anon USING (true);

-- Landing page: el visitante anónimo (anon) puede realizar operaciones en tablas públicas
DROP POLICY IF EXISTS "landing_all_operations_contacto" ON contacto;
CREATE POLICY "landing_all_operations_contacto" 
ON contacto FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "landing_all_operations_visita" ON visitalanding;
CREATE POLICY "landing_all_operations_visita"   
ON visitalanding FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "landing_all_operations_descarga" ON descarga;
CREATE POLICY "landing_all_operations_descarga" 
ON descarga FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================================
-- POLÍTICAS PARA FASE 2 (LEADS) - Panel interno staff
-- Ahora requieren autenticación (authenticated)
-- =====================================================================

DROP POLICY IF EXISTS "leads_all_operations_lead_detalle" ON lead_detalle;
CREATE POLICY "leads_authenticated_operations_lead_detalle" 
ON lead_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leads_all_operations_propuesta_detalle" ON propuesta_detalle;
CREATE POLICY "leads_authenticated_operations_propuesta_detalle" 
ON propuesta_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- POLÍTICAS PARA FASE 3 (PAYERS) - Panel interno staff
-- Ahora requieren autenticación (authenticated)
-- =====================================================================

DROP POLICY IF EXISTS "payers_all_operations_pago_detalle" ON pago_detalle;
CREATE POLICY "payers_authenticated_operations_pago_detalle" 
ON pago_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payers_all_operations_cronograma" ON cronograma_pagos;
CREATE POLICY "payers_authenticated_operations_cronograma" 
ON cronograma_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- POLÍTICAS PARA FASE 4 (CUSTOMERS) - Panel interno staff
-- Ahora requieren autenticación (authenticated)
-- =====================================================================

DROP POLICY IF EXISTS "customers_all_operations_atencion_detalle" ON atencion_detalle;
CREATE POLICY "customers_authenticated_operations_atencion_detalle" 
ON atencion_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customers_all_operations_alerta_impulsamiento" ON alerta_impulsamiento_customer;
CREATE POLICY "customers_authenticated_operations_alerta_impulsamiento" 
ON alerta_impulsamiento_customer FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- POLÍTICAS PARA SISTEMA DE NOTIFICACIONES - Panel interno staff
-- Ahora requieren autenticación (authenticated)
-- =====================================================================

DROP POLICY IF EXISTS "notificaciones_all_operations" ON notificacion_fase;
CREATE POLICY "notificaciones_authenticated_operations" 
ON notificacion_fase FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- POLÍTICAS ADICIONALES DE SEGURIDAD
-- =====================================================================

-- Lectura de catálogos también para usuarios autenticados
CREATE POLICY "catalogo_lectura_authenticated_estado"  
ON estado_contacto FOR SELECT TO authenticated USING (true);

CREATE POLICY "catalogo_lectura_authenticated_fuente"  
ON fuente_captacion FOR SELECT TO authenticated USING (true);

CREATE POLICY "catalogo_lectura_authenticated_magnet"  
ON leadmagnet FOR SELECT TO authenticated USING (true);

-- Los usuarios autenticados pueden leer contactos (para todas las fases)
CREATE POLICY "authenticated_read_contacto" 
ON contacto FOR SELECT TO authenticated USING (true);

-- Los usuarios autenticados pueden actualizar contactos (para transiciones de fase)
CREATE POLICY "authenticated_update_contacto" 
ON contacto FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- NOTA IMPORTANTE
-- =====================================================================
-- Después de ejecutar esta migración, DEBE implementar Supabase Auth en la aplicación:
-- 1. Crear sistema de login/logout en los paneles staff
-- 2. Usar supabase.auth.signInWithPassword() para autenticar usuarios
-- 3. Proteger las rutas /staff/* con verificación de autenticación
-- 4. Crear usuarios en Supabase Dashboard > Authentication > Users
-- 
-- Mientras no se implemente autenticación, puede usar esta migración
-- para revertir a 'anon' temporalmente si es necesario para desarrollo.