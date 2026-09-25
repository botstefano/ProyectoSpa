-- Habilitar RLS en la tabla propuesta_chatbot (si no está habilitado)
alter table propuesta_chatbot enable row level security;

-- Crear política para permitir todas las operaciones al rol anon (uso interno staff)
-- Si la política ya existe, este comando fallará pero podemos ignorarlo
create policy "propuestas_all_operations" on propuesta_chatbot for all to anon using (true) with check (true);

-- Verificar que los índices necesarios existan
create index if not exists idx_propuesta_chatbot_contacto on propuesta_chatbot(id_contacto);
create index if not exists idx_propuesta_chatbot_token on propuesta_chatbot(token_propuesta);
create index if not exists idx_propuesta_chatbot_estado on propuesta_chatbot(estado_propuesta);
create index if not exists idx_propuesta_chatbot_expira on propuesta_chatbot(expira_en);