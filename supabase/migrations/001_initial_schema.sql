-- ============================================================
-- TatameHoje — Schema inicial
-- Execute no SQL Editor do Supabase (Settings > SQL Editor)
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ── ACADEMIAS ─────────────────────────────────────────────
create table academias (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  logo_url    text,
  endereco    text not null default '',
  bairro      text not null default '',
  cidade      text not null default '',
  estado      text not null default '',
  cep         text not null default '',
  telefone    text not null default '',
  email       text not null default '',
  pix         text,
  instagram   text,
  website     text,
  tema        jsonb not null default '{"cor_primaria":"#3b82f6","cor_secundaria":"#1e40af","cor_destaque":"#f59e0b"}',
  horarios_funcionamento jsonb not null default '[]',
  criada_em   timestamptz not null default now()
);

-- ── PERFIS (extensão do auth.users) ───────────────────────
-- Criado automaticamente via trigger quando usuário faz signup
create table perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  academia_id uuid references academias(id) on delete set null,
  nome        text not null,
  role        text not null default 'aluno'
              check (role in ('dev','proprietario','professor','administrativo','aluno')),
  foto_url    text,
  created_at  timestamptz not null default now()
);

-- Trigger: cria perfil ao criar usuário no auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into perfis (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'aluno');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── MODALIDADES ───────────────────────────────────────────
create table modalidades (
  id          uuid primary key default uuid_generate_v4(),
  academia_id uuid not null references academias(id) on delete cascade,
  nome        text not null,
  descricao   text,
  tem_graus   boolean not null default true,
  max_graus   int not null default 4,
  created_at  timestamptz not null default now()
);

-- ── GRADUAÇÕES (faixas) ───────────────────────────────────
create table graduacoes (
  id                 uuid primary key default uuid_generate_v4(),
  modalidade_id      uuid not null references modalidades(id) on delete cascade,
  nome               text not null,
  cor_hex            text not null default '#ffffff',
  sequencia          int  not null default 0,
  tempo_minimo_dias  int,
  created_at         timestamptz not null default now()
);

-- ── PACOTES (planos) ──────────────────────────────────────
create table pacotes (
  id                  uuid primary key default uuid_generate_v4(),
  academia_id         uuid not null references academias(id) on delete cascade,
  nome                text not null,
  descricao           text,
  modalidade_id       uuid references modalidades(id) on delete set null,
  valor               numeric(10,2) not null,
  periodicidade       text not null default 'mensal'
                      check (periodicidade in ('mensal','trimestral','semestral','anual')),
  numero_aulas_semana int,
  ativo               boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ── ALUNOS ────────────────────────────────────────────────
create table alunos (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete set null, -- null se não tem app
  academia_id           uuid not null references academias(id) on delete cascade,
  nome                  text not null,
  cpf                   text not null,
  email                 text not null,
  telefone              text not null default '',
  data_nascimento       date not null,
  foto_url              text,
  status                text not null default 'ativo'
                        check (status in ('ativo','inativo','suspenso')),
  modalidade_id         uuid not null references modalidades(id),
  graduacao_id          uuid references graduacoes(id) on delete set null,
  grau_atual            int not null default 0,
  pacote_id             uuid references pacotes(id) on delete set null,
  data_matricula        date not null default current_date,
  created_at            timestamptz not null default now()
);

-- ── HISTÓRICO DE FAIXAS ───────────────────────────────────
create table historico_faixas (
  id              uuid primary key default uuid_generate_v4(),
  aluno_id        uuid not null references alunos(id) on delete cascade,
  graduacao_id    uuid not null references graduacoes(id),
  grau            int  not null default 0,
  data_promocao   date not null,
  professor_id    uuid references perfis(id) on delete set null,
  observacoes     text,
  created_at      timestamptz not null default now()
);

-- ── TURMAS ────────────────────────────────────────────────
create table turmas (
  id               uuid primary key default uuid_generate_v4(),
  academia_id      uuid not null references academias(id) on delete cascade,
  nome             text not null,
  modalidade_id    uuid not null references modalidades(id),
  professor_id     uuid references perfis(id) on delete set null,
  nivel            text not null default 'todos'
                   check (nivel in ('iniciante','intermediario','avancado','todos')),
  capacidade_maxima int not null default 30,
  ativa            boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── HORÁRIOS DAS TURMAS ───────────────────────────────────
create table horarios (
  id           uuid primary key default uuid_generate_v4(),
  turma_id     uuid not null references turmas(id) on delete cascade,
  dia_semana   int  not null check (dia_semana between 0 and 6),
  hora_inicio  time not null,
  hora_fim     time not null
);

-- ── CHECK-INS ─────────────────────────────────────────────
create table checkins (
  id           uuid primary key default uuid_generate_v4(),
  turma_id     uuid not null references turmas(id) on delete cascade,
  aluno_id     uuid not null references alunos(id) on delete cascade,
  data         date not null default current_date,
  hora_checkin time not null default current_time,
  created_at   timestamptz not null default now(),
  unique (turma_id, aluno_id, data)  -- evita check-in duplo no mesmo dia/turma
);

-- ── MENSALIDADES ──────────────────────────────────────────
create table mensalidades (
  id               uuid primary key default uuid_generate_v4(),
  turma_id         uuid not null references turmas(id) on delete cascade,
  aluno_id         uuid not null references alunos(id) on delete cascade,
  valor            numeric(10,2) not null,
  vencimento       date not null,
  status           text not null default 'pendente'
                   check (status in ('pago','pendente','atrasado','cancelado')),
  data_pagamento   date,
  metodo           text check (metodo in ('dinheiro','pix','cartao','boleto')),
  desconto         numeric(10,2),
  multa            numeric(10,2),
  observacoes      text,
  created_at       timestamptz not null default now()
);

-- ── COMUNICADOS ───────────────────────────────────────────
create table comunicados (
  id            uuid primary key default uuid_generate_v4(),
  academia_id   uuid not null references academias(id) on delete cascade,
  titulo        text not null,
  mensagem      text not null,
  tipo          text not null default 'geral'
                check (tipo in ('geral','financeiro','evento','urgente')),
  destinatarios text not null default 'ativos'
                check (destinatarios in ('todos','ativos','inadimplentes')),
  criado_por    uuid references perfis(id) on delete set null,
  enviado_push  boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── PUSH SUBSCRIPTIONS (Web Push do aluno) ────────────────
create table push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  aluno_id    uuid not null references alunos(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique (aluno_id, endpoint)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table academias          enable row level security;
alter table perfis             enable row level security;
alter table modalidades        enable row level security;
alter table graduacoes         enable row level security;
alter table pacotes            enable row level security;
alter table alunos             enable row level security;
alter table historico_faixas   enable row level security;
alter table turmas             enable row level security;
alter table horarios           enable row level security;
alter table checkins           enable row level security;
alter table mensalidades       enable row level security;
alter table comunicados        enable row level security;
alter table push_subscriptions enable row level security;

-- Helper: retorna academia_id do perfil logado
create or replace function minha_academia_id()
returns uuid language sql stable security definer as $$
  select academia_id from perfis where id = auth.uid()
$$;

-- Helper: retorna role do perfil logado
create or replace function meu_role()
returns text language sql stable security definer as $$
  select role from perfis where id = auth.uid()
$$;

-- ── Academias: admin vê a própria ────────────────────────
create policy "academia_select" on academias
  for select using (id = minha_academia_id() or meu_role() = 'dev');

create policy "academia_update" on academias
  for update using (id = minha_academia_id() and meu_role() in ('dev','proprietario'));

-- ── Perfis: cada um vê o próprio, admin vê todos da academia ──
create policy "perfis_self" on perfis
  for select using (
    id = auth.uid()
    or meu_role() in ('dev','proprietario','administrativo')
  );

create policy "perfis_update_self" on perfis
  for update using (id = auth.uid());

-- ── Modalidades ──────────────────────────────────────────
create policy "modalidades_read" on modalidades
  for select using (academia_id = minha_academia_id() or meu_role() = 'dev');

create policy "modalidades_write" on modalidades
  for all using (academia_id = minha_academia_id() and meu_role() in ('dev','proprietario'));

-- ── Graduações ───────────────────────────────────────────
create policy "graduacoes_read" on graduacoes
  for select using (
    exists (select 1 from modalidades m where m.id = modalidade_id and (m.academia_id = minha_academia_id() or meu_role() = 'dev'))
  );

-- ── Pacotes ──────────────────────────────────────────────
create policy "pacotes_read" on pacotes
  for select using (academia_id = minha_academia_id() or meu_role() = 'dev');

create policy "pacotes_write" on pacotes
  for all using (academia_id = minha_academia_id() and meu_role() in ('dev','proprietario','administrativo'));

-- ── Alunos ───────────────────────────────────────────────
-- Admin/prof: todos da academia. Aluno: só o próprio.
create policy "alunos_staff" on alunos
  for select using (
    (academia_id = minha_academia_id() and meu_role() in ('dev','proprietario','professor','administrativo'))
    or user_id = auth.uid()
  );

create policy "alunos_write_staff" on alunos
  for all using (
    academia_id = minha_academia_id() and meu_role() in ('dev','proprietario','administrativo')
  );

create policy "alunos_update_self" on alunos
  for update using (user_id = auth.uid());

-- ── Histórico faixas ─────────────────────────────────────
create policy "historico_read" on historico_faixas
  for select using (
    exists (select 1 from alunos a where a.id = aluno_id and (a.academia_id = minha_academia_id() or a.user_id = auth.uid()))
  );

create policy "historico_write" on historico_faixas
  for all using (
    meu_role() in ('dev','proprietario','professor')
  );

-- ── Turmas ───────────────────────────────────────────────
create policy "turmas_read" on turmas
  for select using (academia_id = minha_academia_id() or meu_role() = 'dev');

create policy "turmas_write" on turmas
  for all using (academia_id = minha_academia_id() and meu_role() in ('dev','proprietario','administrativo'));

-- ── Horários ─────────────────────────────────────────────
create policy "horarios_read" on horarios
  for select using (
    exists (select 1 from turmas t where t.id = turma_id and (t.academia_id = minha_academia_id() or meu_role() = 'dev'))
  );

-- ── Check-ins ────────────────────────────────────────────
-- Staff vê todos da academia. Aluno vê os próprios.
create policy "checkins_staff" on checkins
  for select using (
    (meu_role() in ('dev','proprietario','professor','administrativo')
      and exists (select 1 from turmas t where t.id = turma_id and t.academia_id = minha_academia_id()))
    or exists (select 1 from alunos a where a.id = aluno_id and a.user_id = auth.uid())
  );

create policy "checkins_insert_staff" on checkins
  for insert with check (
    meu_role() in ('dev','proprietario','professor','administrativo')
    or exists (select 1 from alunos a where a.id = aluno_id and a.user_id = auth.uid())
  );

create policy "checkins_delete_staff" on checkins
  for delete using (meu_role() in ('dev','proprietario','administrativo'));

-- ── Mensalidades ─────────────────────────────────────────
-- Staff vê todas. Aluno vê as próprias.
create policy "mensalidades_staff" on mensalidades
  for select using (
    (meu_role() in ('dev','proprietario','administrativo')
      and exists (select 1 from turmas t where t.id = turma_id and t.academia_id = minha_academia_id()))
    or exists (select 1 from alunos a where a.id = aluno_id and a.user_id = auth.uid())
  );

create policy "mensalidades_write" on mensalidades
  for all using (meu_role() in ('dev','proprietario','administrativo'));

-- ── Comunicados ──────────────────────────────────────────
create policy "comunicados_read" on comunicados
  for select using (
    academia_id = minha_academia_id() or meu_role() = 'dev'
    or exists (select 1 from alunos a where a.user_id = auth.uid() and a.academia_id = comunicados.academia_id)
  );

create policy "comunicados_write" on comunicados
  for all using (academia_id = minha_academia_id() and meu_role() in ('dev','proprietario','administrativo'));

-- ── Push subscriptions ───────────────────────────────────
create policy "push_self" on push_subscriptions
  for all using (
    exists (select 1 from alunos a where a.id = aluno_id and a.user_id = auth.uid())
  );

-- ============================================================
-- ÍNDICES
-- ============================================================
create index on alunos(academia_id);
create index on alunos(user_id);
create index on turmas(academia_id);
create index on checkins(aluno_id, data);
create index on checkins(turma_id, data);
create index on mensalidades(aluno_id);
create index on mensalidades(status);
create index on comunicados(academia_id, created_at desc);
create index on historico_faixas(aluno_id);
