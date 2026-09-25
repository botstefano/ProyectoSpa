-- Crear tabla propuesta_chatbot para el sistema de chatbot de propuestas
-- Esta tabla permite negociación interactiva de propuestas con IA

create table propuesta_chatbot (
  id_propuesta        bigserial primary key,
  id_contacto         int not null references contacto(id_contacto) on delete restrict,
  token_propuesta     varchar(50) unique not null,
  propuesta_original  jsonb not null,
  propuesta_actual    jsonb not null,
  estado_propuesta    varchar(20) not null default 'enviada' 
                       check (estado_propuesta in ('enviada','negociando','aceptada','rechazada','expirada')),
  historial_conversacion jsonb default '[]'::jsonb,
  fecha_envio         timestamptz not null default now(),
  expira_en           timestamptz not null default (now() + interval '7 days'),
  fecha_aceptacion    timestamptz,
  fecha_ultima_interaccion timestamptz
);

-- Índices para mejorar rendimiento
create index idx_propuesta_chatbot_contacto on propuesta_chatbot(id_contacto);
create index idx_propuesta_chatbot_token on propuesta_chatbot(token_propuesta);
create index idx_propuesta_chatbot_estado on propuesta_chatbot(estado_propuesta);
create index idx_propuesta_chatbot_expira on propuesta_chatbot(expira_en);

-- Habilitar RLS
alter table propuesta_chatbot enable row level security;

-- Políticas para el rol anon (uso interno staff, como las otras tablas)
create policy "propuestas_all_operations" on propuesta_chatbot for all to anon using (true) with check (true);