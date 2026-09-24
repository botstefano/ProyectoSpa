-- =====================================================================
-- SISTEMA DE AUDITORÍA DE CAMBIOS
-- Crea tabla para registrar quién hizo qué cambio y cuándo
-- =====================================================================

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS auditoria_cambios (
  id_auditoria bigserial PRIMARY KEY,
  tipo_evento varchar(50) NOT NULL,
  id_contacto int REFERENCES contacto(id_contacto) ON DELETE SET NULL,
  id_usuario uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email_usuario varchar(255),
  tabla_afectada varchar(100),
  registro_id bigint,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  fecha_creacion timestamptz NOT NULL DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_auditoria_contacto ON auditoria_cambios(id_contacto);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_cambios(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON auditoria_cambios(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_cambios(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria_cambios(tabla_afectada);

-- Habilitar RLS
ALTER TABLE auditoria_cambios ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para auditoría
-- Solo usuarios autenticados pueden insertar auditoría
CREATE POLICY "auditoria_insert_authenticated" 
ON auditoria_cambios FOR INSERT TO authenticated 
WITH CHECK (true);

-- Solo usuarios admin pueden leer auditoría completa
CREATE POLICY "auditoria_select_admin" 
ON auditoria_cambios FOR SELECT TO authenticated 
USING (
  -- Permitir si es admin (se puede implementar con roles personalizados)
  true -- Por ahora permitir a todos los autenticados para desarrollo
);

-- Función para crear tabla de auditoría si no existe (para desarrollo)
CREATE OR REPLACE FUNCTION crear_tabla_auditoria_si_no_existe()
RETURNS void AS $$
BEGIN
  -- La tabla ya está creada por este script
  -- Esta función es para ser llamada desde el cliente si es necesario
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE auditoria_cambios IS 'Tabla de auditoría para registrar cambios en el sistema';
COMMENT ON COLUMN auditoria_cambios.tipo_evento IS 'Tipo de evento (contacto_created, lead_calificado, etc.)';
COMMENT ON COLUMN auditoria_cambios.id_contacto IS 'ID del contacto afectado (si aplica)';
COMMENT ON COLUMN auditoria_cambios.id_usuario IS 'ID del usuario que realizó el cambio';
COMMENT ON COLUMN auditoria_cambios.datos_anteriores IS 'Estado anterior de los datos (JSON)';
COMMENT ON COLUMN auditoria_cambios.datos_nuevos IS 'Estado nuevo de los datos (JSON)';
COMMENT ON COLUMN auditoria_cambios.metadata IS 'Información adicional del evento (JSON)';