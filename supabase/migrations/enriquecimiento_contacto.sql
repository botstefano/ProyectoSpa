-- =====================================================================
-- SISTEMA DE ENRIQUECIMIENTO DE CONTACTOS
-- Tabla para almacenar datos adicionales de clientes
-- Permite capturar más información sin extender el formulario inicial
-- =====================================================================

-- Crear tabla de enriquecimiento de contactos
CREATE TABLE IF NOT EXISTS enriquecimiento_contacto (
  id_enriquecimiento bigserial PRIMARY KEY,
  id_contacto int NOT NULL REFERENCES contacto(id_contacto) ON DELETE CASCADE,
  token_enriquecimiento varchar(100) UNIQUE NOT NULL,
  
  -- Datos demográficos adicionales
  edad varchar(20),
  distrito varchar(100),
  ocupacion varchar(50),
  
  -- Datos de presupuesto y disponibilidad
  presupuesto varchar(50),
  disponibilidad varchar(50),
  
  -- Preferencias de servicio
  preferencia_aroma varchar(50),
  preferencia_musica varchar(50),
  sensibilidad_piel varchar(50),
  
  -- Motivación y frecuencia
  motivo_principal varchar(100),
  frecuencia_deseada varchar(50),
  
  -- Estado del proceso
  completado boolean DEFAULT false,
  fecha_completado timestamptz,
  creado_at timestamptz NOT NULL DEFAULT now(),
  actualizado_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_enriquecimiento_contacto ON enriquecimiento_contacto(id_contacto);
CREATE INDEX IF NOT EXISTS idx_enriquecimiento_token ON enriquecimiento_contacto(token_enriquecimiento);
CREATE INDEX IF NOT EXISTS idx_enriquecimiento_completado ON enriquecimiento_contacto(completado, creado_at DESC);

-- Habilitar RLS
ALTER TABLE enriquecimiento_contacto ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para enriquecimiento
-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "enriquecimiento_insert_anon" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_select_anon_by_token" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_update_anon" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_insert_authenticated" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_select_authenticated" ON enriquecimiento_contacto;
DROP POLICY IF EXISTS "enriquecimiento_update_authenticated" ON enriquecimiento_contacto;

-- Usuarios anónimos pueden insertar (para formulario público)
CREATE POLICY "enriquecimiento_insert_anon" 
ON enriquecimiento_contacto FOR INSERT TO anon 
WITH CHECK (true);

-- Usuarios anónimos pueden leer por token (para acceso público)
CREATE POLICY "enriquecimiento_select_anon_by_token" 
ON enriquecimiento_contacto FOR SELECT TO anon 
USING (token_enriquecimiento IS NOT NULL);

-- Usuarios anónimos pueden actualizar (para completar formulario)
CREATE POLICY "enriquecimiento_update_anon" 
ON enriquecimiento_contacto FOR UPDATE TO anon 
USING (true) WITH CHECK (true);

-- Usuarios autenticados pueden insertar (staff)
CREATE POLICY "enriquecimiento_insert_authenticated" 
ON enriquecimiento_contacto FOR INSERT TO authenticated 
WITH CHECK (true);

-- Usuarios autenticados pueden leer (staff)
CREATE POLICY "enriquecimiento_select_authenticated" 
ON enriquecimiento_contacto FOR SELECT TO authenticated 
USING (true);

-- Usuarios autenticados pueden actualizar (staff)
CREATE POLICY "enriquecimiento_update_authenticated" 
ON enriquecimiento_contacto FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

-- Función para generar token único
CREATE OR REPLACE FUNCTION generar_token_enriquecimiento()
RETURNS varchar(100) AS $$
BEGIN
  RETURN encode(sha256(random()::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un token es válido y no expirado
CREATE OR REPLACE FUNCTION verificar_token_enriquecimiento(p_token varchar)
RETURNS TABLE(id_contacto int, valido boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id_contacto,
    (ec.token_enriquecimiento = p_token AND 
     (ec.completado = false OR ec.completado IS NULL) AND
     ec.creado_at > now() - interval '7 days')::boolean as valido
  FROM enriquecimiento_contacto ec
  WHERE ec.token_enriquecimiento = p_token;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar actualizado_at
CREATE OR REPLACE FUNCTION actualizar_timestamp_enriquecimiento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_enriquecimiento
BEFORE UPDATE ON enriquecimiento_contacto
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_enriquecimiento();

-- Comentarios para documentación
COMMENT ON TABLE enriquecimiento_contacto IS 'Datos adicionales de clientes para mejor lead scoring';
COMMENT ON COLUMN enriquecimiento_contacto.token_enriquecimiento IS 'Token único para acceder al formulario de enriquecimiento';
COMMENT ON COLUMN enriquecimiento_contacto.completado IS 'Indica si el cliente completó el formulario de enriquecimiento';
COMMENT ON COLUMN enriquecimiento_contacto.presupuesto IS 'Rango de presupuesto del cliente (<100, 100-300, 300-500, 500+)';
COMMENT ON COLUMN enriquecimiento_contacto.disponibilidad IS 'Horarios preferidos del cliente (mañana, tarde, fines de semana, indiferente)';