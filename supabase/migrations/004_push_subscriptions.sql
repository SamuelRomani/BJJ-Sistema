-- ============================================================
-- TatameHoje — Push Subscriptions (Web Push API)
-- Execute no SQL Editor do Supabase
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  aluno_id    uuid not null references alunos(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique (aluno_id, endpoint)
);

-- RLS
alter table push_subscriptions enable row level security;

-- Aluno só vê/gerencia suas próprias subscriptions
create policy "Aluno gerencia suas subscriptions"
  on push_subscriptions for all
  using (
    aluno_id in (
      select id from alunos where user_id = auth.uid()
    )
  );

-- Admin/professor da academia pode ler (para enviar push)
create policy "Academia lê subscriptions"
  on push_subscriptions for select
  using (
    aluno_id in (
      select a.id from alunos a
      join perfis p on p.academia_id = a.academia_id
      where p.id = auth.uid()
      and p.role in ('dev','proprietario','administrativo','professor')
    )
  );
