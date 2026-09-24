-- =====================================================================
-- SISTEMA DE PROPUESTAS CON CHATBOT MISTRAL
-- Tabla para gestionar propuestas interactivas con IA
-- =====================================================================

-- Crear tabla de propuestas con chatbot
CREATE TABLE IF NOT EXISTS propuesta_chatbot (
  id_propuesta bigserial PRIMARY KEY,
  id_contacto int NOT NULL REFERENCES contacto(id_contacto) ON DELETE CASCADE,
  token_propuesta varchar(100) UNIQUE NOT NULL,
  
  -- Datos originales de la propuesta
  propuesta_original jsonb NOT NULL,
  
  -- Datos negociados en tiempo real
  propuesta_actual jsonb NOT NULL,
  
  -- Estado del proceso
  estado_propuesta varchar(20) DEFAULT 'enviada' CHECK (estado_propuesta IN ('enviada', 'negociando', 'aceptada', 'rechazada', 'expirada')),
  
  -- Historial de conversación con el chatbot
  historial_conversacion jsonb DEFAULT '[]',
  
  -- Metadatos
  fecha_envio timestamptz NOT NULL DEFAULT now(),
  fecha_ultima_interaccion timestamptz DEFAULT now(),
  fecha_aceptacion timestamptz,
  expira_en timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  
  -- Datos del proceso
  numero_interacciones int DEFAULT 0,
  canal_negociacion varchar(20) DEFAULT 'chatbot' CHECK (canal_negociacion IN ('chatbot', 'manual', 'whatsapp'))
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_propuesta_chatbot_contacto ON propuesta_chatbot(id_contacto);
CREATE INDEX IF NOT EXISTS idx_propuesta_chatbot_token ON propuesta_chatbot(token_propuesta);
CREATE INDEX IF NOT EXISTS idx_propuesta_chatbot_estado ON propuesta_chatbot(estado_propuesta, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_propuesta_chatbot_expira ON propuesta_chatbot(expira_en);

-- Habilitar RLS
ALTER TABLE propuesta_chatbot ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para propuestas
-- Usuarios autenticados pueden insertar (staff)
CREATE POLICY "propuesta_insert_authenticated" 
ON propuesta_chatbot FOR INSERT TO authenticated 
WITH CHECK (true);

-- Usuarios autenticados pueden leer (staff)
CREATE POLICY "propuesta_select_authenticated" 
ON propuesta_chatbot FOR SELECT TO authenticated 
USING (true);

-- Usuarios autenticados pueden actualizar (staff)
CREATE POLICY "propuesta_update_authenticated" 
ON propuesta_chatbot FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

-- Función para generar token único para propuesta
CREATE OR REPLACE FUNCTION generar_token_propuesta()
RETURNS varchar(100) AS $$
BEGIN
  RETURN encode(sha256(random()::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un token de propuesta es válido
CREATE OR REPLACE FUNCTION verificar_token_propuesta(p_token varchar)
RETURNS TABLE(id_contacto int, valido boolean, propuesta_actual jsonb) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id_contacto,
    (pc.token_propuesta = p_token AND 
     pc.estado_propuesta IN ('enviada', 'negociando') AND
     pc.expira_en > now())::boolean as valido,
    pc.propuesta_actual
  FROM propuesta_chatbot pc
  WHERE pc.token_propuesta = p_token;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar propuesta en tiempo real
CREATE OR REPLACE FUNCTION actualizar_propuesta_chatbot(p_id_propuesta int, p_nueva_propuesta jsonb)
RETURNS void AS $$
BEGIN
  UPDATE propuesta_chatbot
  SET 
    propuesta_actual = p_nueva_propuesta,
    fecha_ultima_interaccion = now(),
    numero_interacciones = numero_interacciones + 1
  WHERE id_propuesta = p_id_propuesta;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar mensaje en historial
CREATE OR REPLACE FUNCTION agregar_mensaje_historial(p_id_propuesta int, p_rol varchar, p_mensaje text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void AS $$
BEGIN
  UPDATE propuesta_chatbot
  SET 
    historial_conversacion = historial_conversacion || jsonb_build_object(
      'rol', p_rol,
      'mensaje', p_mensaje,
      'timestamp', now(),
      'metadata', p_metadata
    ),
    fecha_ultima_interaccion = now(),
    numero_interacciones = numero_interacciones + 1
  WHERE id_propuesta = p_id_propuesta;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_ultima_interaccion
CREATE OR REPLACE FUNCTION actualizar_timestamp_propuesta()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_ultima_interaccion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_propuesta
BEFORE UPDATE ON propuesta_chatbot
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_propuesta();

-- Comentarios para documentación
COMMENT ON TABLE propuesta_chatbot IS 'Propuestas interactivas con chatbot Mistral para negociación en tiempo real';
COMMENT ON COLUMN propuesta_chatbot.token_propuesta IS 'Token único para acceder a la propuesta pública';
COMMENT ON COLUMN propuesta_chatbot.propuesta_original IS 'Datos originales de la propuesta antes de negociación';
COMMENT ON COLUMN propuesta_chatbot.propuesta_actual IS 'Datos negociados actuales (se actualiza en tiempo real)';
COMMENT ON COLUMN propuesta_chatbot.estado_propuesta IS 'Estado: enviada, negociando, aceptada, rechazada, expirada';
COMMENT ON COLUMN propuesta_chatbot.historial_conversacion IS 'Array de mensajes del chatbot con timestamp y metadatos';
COMMENT ON COLUMN propuesta_chatbot.expira_en IS 'Fecha de expiración del enlace (7 días por defecto)';