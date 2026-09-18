-- =====================================================================
-- FASE 4 — CUSTOMERS · MIGRACIÓN PARA UN PROYECTO SUPABASE YA CREADO
-- Ejecutar UNA VEZ en Supabase > SQL Editor antes de usar /staff/customers
-- =====================================================================

-- La tabla original reservaba solo una fila por contacto. CUSTOMER necesita
-- historial de servicios para medir recompra, tiempos, satisfacción y seguimiento.
alter table atencion_detalle drop constraint if exists atencion_detalle_pkey;

alter table atencion_detalle
  add column if not exists id_atencion bigserial,
  add column if not exists tipo_tratamiento varchar(100),
  add column if not exists especialista varchar(100),
  add column if not exists fecha_hora_inicio timestamptz,
  add column if not exists fecha_hora_fin timestamptz,
  add column if not exists duracion_planificada_min int,
  add column if not exists estado_atencion varchar(20) default 'programada',
  add column if not exists notas text,
  add column if not exists satisfaccion smallint,
  add column if not exists seguimiento_enviado boolean not null default false,
  add column if not exists fecha_seguimiento timestamptz,
  add column if not exists proxima_atencion date,
  add column if not exists created_at timestamptz not null default now();

-- id_atencion pasa a ser la PK y un contacto puede tener múltiples atenciones.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'atencion_detalle'::regclass and contype = 'p'
  ) then
    alter table atencion_detalle add constraint atencion_detalle_pkey primary key (id_atencion);
  end if;
end $$;

alter table atencion_detalle
  drop constraint if exists atencion_detalle_estado_atencion_check,
  add constraint atencion_detalle_estado_atencion_check
    check (estado_atencion in ('programada','en_atencion','completada','no_asistio')),
  drop constraint if exists atencion_detalle_duracion_check,
  add constraint atencion_detalle_duracion_check
    check (duracion_planificada_min is null or duracion_planificada_min between 10 and 240),
  drop constraint if exists atencion_detalle_satisfaccion_check,
  add constraint atencion_detalle_satisfaccion_check
    check (satisfaccion is null or satisfaccion between 1 and 5),
  drop constraint if exists atencion_detalle_horas_check,
  add constraint atencion_detalle_horas_check
    check (fecha_hora_fin is null or fecha_hora_inicio is null or fecha_hora_fin > fecha_hora_inicio);

create index if not exists idx_atencion_contacto on atencion_detalle(id_contacto);
create index if not exists idx_atencion_fecha on atencion_detalle(fecha_hora_inicio desc);
create index if not exists idx_atencion_estado on atencion_detalle(estado_atencion);

-- Alertas de impulsamiento: deja evidencia de la regla y la acción sugerida.
create table if not exists alerta_impulsamiento_customer (
  id_alerta       bigserial primary key,
  id_contacto     int not null references contacto(id_contacto) on delete restrict,
  id_atencion     bigint references atencion_detalle(id_atencion) on delete set null,
  tipo_alerta     varchar(40) not null check (tipo_alerta in ('pago_no_confirmado','no_asistio','satisfaccion_baja','sin_seguimiento','sin_recompra')),
  prioridad       varchar(10) not null default 'media' check (prioridad in ('alta','media','baja')),
  agente          varchar(80) not null,
  mensaje         text not null,
  estado          varchar(15) not null default 'pendiente' check (estado in ('pendiente','atendida','descartada')),
  fecha_generada  timestamptz not null default now(),
  fecha_atendida  timestamptz
);

create index if not exists idx_alerta_customer_contacto on alerta_impulsamiento_customer(id_contacto);
create index if not exists idx_alerta_customer_estado on alerta_impulsamiento_customer(estado, prioridad);

-- IMPORTANTE: el proyecto actual todavía no implementa Supabase Auth para staff.
-- Por eso esta migración NO abre nuevas policies al rol anon. Para una entrega
-- académica, /staff/customers funciona también en modo demo. Cuando el grupo
-- active Auth, habiliten RLS para atencion_detalle y alerta_impulsamiento_customer
-- y creen políticas solo para authenticated.
