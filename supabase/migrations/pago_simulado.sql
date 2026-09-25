-- =====================================================================
-- SISTEMA DE PAGOS SIMULADOS PARA CLIENTES
-- Permite que el staff envíe enlaces de pago a clientes
-- Los clientes completan el pago de forma simulada y se generan comprobantes
-- =====================================================================

-- Crear tabla de pagos simulados
CREATE TABLE IF NOT EXISTS pago_simulado (
  id_pago_simulado bigserial PRIMARY KEY,
  id_contacto int NOT NULL REFERENCES contacto(id_contacto) ON DELETE CASCADE,
  token_pago varchar(100) UNIQUE NOT NULL,
  
  -- Datos del pago
  monto_total numeric(10,2) NOT NULL,
  servicio_contratado varchar(100) NOT NULL,
  metodo_pago_elegido varchar(30),
  
  -- Estado del proceso
  estado_pago varchar(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'completado', 'expirado', 'cancelado')),
  
  -- Datos del formulario de pago
  datos_pago jsonb DEFAULT '{}',
  
  -- Datos del comprobante
  numero_comprobante varchar(50),
  tipo_comprobante varchar(20) DEFAULT 'boleta' CHECK (tipo_comprobante IN ('boleta', 'factura')),
  
  -- Fechas importantes
  fecha_envio timestamptz NOT NULL DEFAULT now(),
  fecha_completado timestamptz,
  expira_en timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  
  -- Metadatos
  numero_intentos int DEFAULT 0,
  ip_cliente varchar(45),
  user_agent text
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pago_simulado_contacto ON pago_simulado(id_contacto);
CREATE INDEX IF NOT EXISTS idx_pago_simulado_token ON pago_simulado(token_pago);
CREATE INDEX IF NOT EXISTS idx_pago_simulado_estado ON pago_simulado(estado_pago, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_pago_simulado_expira ON pago_simulado(expira_en);

-- Habilitar RLS
ALTER TABLE pago_simulado ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para pagos simulados
-- Usuarios autenticados pueden insertar (staff)
CREATE POLICY "pago_simulado_insert_authenticated" 
ON pago_simulado FOR INSERT TO authenticated 
WITH CHECK (true);

-- Usuarios autenticados pueden leer (staff)
CREATE POLICY "pago_simulado_select_authenticated" 
ON pago_simulado FOR SELECT TO authenticated 
USING (true);

-- Usuarios autenticados pueden actualizar (staff)
CREATE POLICY "pago_simulado_update_authenticated" 
ON pago_simulado FOR UPDATE TO authenticated 
USING (true) WITH CHECK (true);

-- Usuarios anónimos pueden actualizar (para que el cliente complete el pago)
CREATE POLICY "pago_simulado_update_anon" 
ON pago_simulado FOR UPDATE TO anon 
USING (estado_pago = 'pendiente' AND expira_en > now())
WITH CHECK (estado_pago IN ('pendiente', 'completado'));

-- Usuarios anónimos pueden leer por token (para que el cliente acceda a su pago)
CREATE POLICY "pago_simulado_select_anon_by_token" 
ON pago_simulado FOR SELECT TO anon 
USING (token_pago = current_setting('app.current_token', true) AND estado_pago = 'pendiente' AND expira_en > now());

-- Función para generar token único para pago
CREATE OR REPLACE FUNCTION generar_token_pago()
RETURNS varchar(100) AS $$
BEGIN
  RETURN 'PAGO-' || encode(sha256(random()::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un token de pago es válido
CREATE OR REPLACE FUNCTION verificar_token_pago(p_token varchar)
RETURNS TABLE(id_pago_simulado bigint, id_contacto int, valido boolean, monto_total numeric, servicio_contratado varchar) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id_pago_simulado,
    ps.id_contacto,
    (ps.token_pago = p_token AND 
     ps.estado_pago = 'pendiente' AND
     ps.expira_en > now())::boolean as valido,
    ps.monto_total,
    ps.servicio_contratado
  FROM pago_simulado ps
  WHERE ps.token_pago = p_token;
END;
$$ LANGUAGE plpgsql;

-- Función para completar un pago simulado
CREATE OR REPLACE FUNCTION completar_pago_simulado(p_id_pago_simulado int, p_metodo_pago varchar, p_datos_pago jsonb)
RETURNS void AS $$
BEGIN
  UPDATE pago_simulado
  SET 
    estado_pago = 'completado',
    metodo_pago_elegido = p_metodo_pago,
    datos_pago = p_datos_pago,
    fecha_completado = now(),
    numero_comprobante = 'B-' || LPAD(EXTRACT(YEAR FROM now())::text, 4, '0') || '-' || LPAD(EXTRACT(MONTH FROM now())::text, 2, '0') || '-' || LPAD(nextval('seq_comprobante')::text, 6, '0')
  WHERE id_pago_simulado = p_id_pago_simulado;
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para números de comprobante
CREATE SEQUENCE IF NOT EXISTS seq_comprobante START 1;

-- Trigger para actualizar numero_intentos
CREATE OR REPLACE FUNCTION actualizar_intentos_pago()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado_pago = 'pendiente' AND OLD.estado_pago = 'pendiente' THEN
    NEW.numero_intentos = OLD.numero_intentos + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_intentos_pago
BEFORE UPDATE ON pago_simulado
FOR EACH ROW EXECUTE FUNCTION actualizar_intentos_pago();

-- Comentarios para documentación
COMMENT ON TABLE pago_simulado IS 'Pagos simulados enviados a clientes para completar proceso de pago';
COMMENT ON COLUMN pago_simulado.token_pago IS 'Token único para acceder a la página de pago';
COMMENT ON COLUMN pago_simulado.estado_pago IS 'Estado: pendiente, completado, expirado, cancelado';
COMMENT ON COLUMN pago_simulado.datos_pago IS 'Datos del formulario de pago completado por el cliente';
COMMENT ON COLUMN pago_simulado.numero_comprobante IS 'Número de comprobante generado automáticamente';
COMMENT ON COLUMN pago_simulado.expira_en IS 'Fecha de expiración del enlace de pago (7 días por defecto)';
COMMENT ON COLUMN pago_simulado.numero_intentos IS 'Contador de intentos de pago del cliente';