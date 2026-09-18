-- =====================================================================
-- ORIGEN SPA & BIENESTAR — Esquema de base de datos (Supabase / Postgres)
-- Proyecto: Inteligencia de Negocios — Metodología IMPULSE
-- Alcance: entidad compartida "contacto" (Paso 0) + modelo completo
--          de Fase 1 (BUYERS), y tablas reservadas para Fases 2-4.
-- Cómo usar: pega este archivo completo en Supabase → SQL Editor → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. CATÁLOGO DE ESTADOS DEL CONTACTO (compartido por las 4 fases)
-- ---------------------------------------------------------------------
create table estado_contacto (
  id_estado     serial primary key,
  nombre_estado varchar(20) not null unique check (nombre_estado in ('buyer','lead','payer','customer'))
);

insert into estado_contacto (nombre_estado) values
  ('buyer'), ('lead'), ('payer'), ('customer');

-- ---------------------------------------------------------------------
-- 1. ENTIDAD COMÚN "CONTACTO" (Paso 0 — atraviesa las 4 fases)
-- ---------------------------------------------------------------------
create table fuente_captacion (
  id_fuente          serial primary key,
  nombre             varchar(50) not null,   -- Instagram Ads, TikTok Ads, Convenio, Orgánico
  segmento_objetivo  varchar(150)
);

insert into fuente_captacion (nombre, segmento_objetivo) values
  ('Instagram Ads', 'Mujeres 25-45, NSE B/C+, intereses en belleza y wellness'),
  ('TikTok Ads',     'Mujeres 25-45, NSE B/C+, intereses en skincare y relajación'),
  ('Convenio',       'Estudiantes UPN/UCV/UCSS, empleados de empresas aliadas'),
  ('Orgánico',       'Tráfico directo o búsqueda, sin campaña asociada');

create table contacto (
  id_contacto     serial primary key,
  nombre          varchar(100) not null,
  telefono        varchar(15) unique,   -- NULL permitido: un buyer aún no lo entrega
  email           varchar(100) unique,  -- NULL permitido: mismo motivo
  fecha_registro  date not null default current_date,
  id_fuente       int not null references fuente_captacion(id_fuente),
  id_estado       int not null references estado_contacto(id_estado)
);

-- Regla de negocio: a partir de "lead", telefono y email ya no pueden ser NULL.
create or replace function trg_validar_datos_contacto() returns trigger as $$
declare
  v_estado_nombre varchar;
begin
  select nombre_estado into v_estado_nombre from estado_contacto where id_estado = new.id_estado;
  if v_estado_nombre is distinct from 'buyer' then
    if new.telefono is null or new.email is null then
      raise exception 'telefono y email son obligatorios para contactos en estado %', v_estado_nombre;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_contacto_validar
before insert or update on contacto
for each row execute function trg_validar_datos_contacto();

-- Tablas de detalle, de propiedad EXCLUSIVA de cada fase (solo ese módulo escribe en ellas).
create table lead_detalle (        -- propiedad de Fase 2
  id_contacto        int primary key references contacto(id_contacto) on delete restrict,
  lead_score         int check (lead_score between 0 and 100),
  fecha_calificacion date
);

create table pago_detalle (        -- propiedad de Fase 3
  id_contacto  int primary key references contacto(id_contacto) on delete restrict,
  estado_pago  varchar(30),
  fecha_pago   date
);

create table atencion_detalle (    -- propiedad de Fase 4
  id_contacto            int primary key references contacto(id_contacto) on delete restrict,
  preferencias_servicio  text
);

-- ---------------------------------------------------------------------
-- 2. ENTIDADES PROPIAS DE FASE 1 (BUYERS)
-- ---------------------------------------------------------------------
create table campana (
  id_campana    serial primary key,
  nombre        varchar(100) not null,
  plataforma    varchar(30),              -- Meta, TikTok
  presupuesto   numeric(10,2),
  fecha_inicio  date,
  fecha_fin     date,
  check (fecha_inicio <= fecha_fin)
);

create table contacto_campana (
  id_evento     serial primary key,
  id_contacto   int not null references contacto(id_contacto) on delete restrict,
  id_campana    int not null references campana(id_campana) on delete restrict,
  fecha_impacto timestamptz not null default now(),
  tipo_evento   varchar(15) not null check (tipo_evento in ('impresion','clic','remarketing')),
  unique (id_contacto, id_campana, fecha_impacto, tipo_evento)
);

create table impresion (
  id_impresion  serial primary key,
  id_campana    int not null references campana(id_campana) on delete restrict,
  fecha         date not null,
  cantidad      int not null,
  costo         numeric(10,2) not null,
  unique (id_campana, fecha)
);

create table contenido (
  id_contenido        serial primary key,
  tipo                varchar(30),   -- tip skincare, testimonio, tour, antes-después
  fecha_publicacion   date,
  plataforma          varchar(30)
);

create table convenio (
  id_convenio     serial primary key,
  institucion     varchar(100),  -- UPN, UCV, UCSS, gimnasios, empresas
  tipo_descuento  varchar(100)
);

create table contacto_convenio (
  id_contacto      int not null references contacto(id_contacto) on delete restrict,
  id_convenio      int not null references convenio(id_convenio) on delete restrict,
  fecha_vinculacion date not null default current_date,
  primary key (id_contacto, id_convenio)
);

create table leadmagnet (
  id_lead_magnet  serial primary key,
  nombre          varchar(100) not null,  -- Guía cuidado facial, Diagnóstico gratis
  tipo            varchar(30)
);

insert into leadmagnet (nombre, tipo) values
  ('Rutina de cuidado facial según tu tipo de piel', 'guia_pdf'),
  ('Diagnóstico de piel gratuito', 'diagnostico');

create table descarga (
  id_descarga     serial primary key,
  id_contacto     int not null references contacto(id_contacto) on delete restrict,
  id_lead_magnet  int not null references leadmagnet(id_lead_magnet) on delete restrict,
  tipo_piel       varchar(30),   -- capturado en el mismo formulario de descarga
  interes         varchar(30),   -- facial / corporal / relajación
  fecha           timestamptz not null default now()
);

create table visitalanding (
  id_visita    serial primary key,
  id_contacto  int references contacto(id_contacto) on delete restrict,  -- NULL: visitante aún anónimo
  fecha        timestamptz not null default now(),
  convirtio    boolean not null default false
);

create table seguidor_mensual (
  id_registro         serial primary key,
  plataforma          varchar(30) not null,
  mes                 date not null,
  cantidad_seguidores int not null,
  unique (plataforma, mes)
);

create table mensajeenviado (
  id_mensaje    serial primary key,
  id_contacto   int not null references contacto(id_contacto) on delete restrict,
  canal         varchar(20),  -- email, WhatsApp
  fecha_envio   timestamptz not null default now(),
  abierto       boolean not null default false
);

-- ---------------------------------------------------------------------
-- 3. SEGURIDAD (RLS) — el formulario público solo puede ESCRIBIR
--    lo mínimo necesario, nunca leer datos de otros contactos.
-- ---------------------------------------------------------------------
alter table contacto        enable row level security;
alter table visitalanding   enable row level security;
alter table descarga        enable row level security;
alter table contacto_campana enable row level security;
alter table mensajeenviado  enable row level security;
alter table fuente_captacion enable row level security;
alter table leadmagnet      enable row level security;
alter table estado_contacto enable row level security;

-- Catálogos: lectura pública (el formulario necesita resolver ids por nombre)
create policy "catalogo_lectura_publica_estado"  on estado_contacto  for select to anon using (true);
create policy "catalogo_lectura_publica_fuente"  on fuente_captacion for select to anon using (true);
create policy "catalogo_lectura_publica_magnet"  on leadmagnet       for select to anon using (true);

-- Landing page: el visitante anónimo (anon) puede realizar operaciones en tablas públicas
-- Usamos FOR ALL con USING y WITH CHECK para compatibilidad completa
create policy "landing_all_operations_contacto" on contacto for all to anon using (true) with check (true);
create policy "landing_all_operations_visita"   on visitalanding for all to anon using (true) with check (true);
create policy "landing_all_operations_descarga" on descarga for all to anon using (true) with check (true);

-- Nota para Fases 2-4: sus paneles son de USO INTERNO (staff), no público.
-- Cuando implementen sus pantallas, usen Supabase Auth y políticas para el
-- rol "authenticated" en vez de "anon" — no expongan lead_detalle,
-- pago_detalle ni atencion_detalle al rol anónimo.
