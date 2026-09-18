-- Ampliación de la tabla lead_detalle para soportar el perfil de negociación
ALTER TABLE lead_detalle
ADD COLUMN edad INT,
ADD COLUMN distrito VARCHAR(100),
ADD COLUMN aroma_preferido VARCHAR(50),
ADD COLUMN musica_preferida VARCHAR(50),
ADD COLUMN temperatura_agua VARCHAR(30),
ADD COLUMN especialidad_estudio VARCHAR(100),
ADD COLUMN universidad VARCHAR(100),
ADD COLUMN situacion_laboral VARCHAR(100),
ADD COLUMN observaciones TEXT;

ALTER TABLE lead_detalle
ADD COLUMN empresa VARCHAR(100),
ADD COLUMN cargo VARCHAR(100);

ALTER TABLE lead_detalle
ADD COLUMN propuesta_aceptada BOOLEAN DEFAULT false,
ADD COLUMN fecha_aceptacion TIMESTAMPTZ,
ADD COLUMN datos_propuesta JSONB;