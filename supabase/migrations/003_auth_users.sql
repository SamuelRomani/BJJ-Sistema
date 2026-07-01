-- ============================================================
-- TatameHoje — Usuários de acesso (admin/professor)
-- Execute APÓS o 002_seed_data.sql
-- ============================================================

-- Proprietário SP
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role)
values (
  '10000000-0000-0000-0000-000000000001',
  'roberto@tatamesp.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"nome":"Roberto Almeida"}'::jsonb,
  'authenticated'
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'roberto@tatamesp.com',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"roberto@tatamesp.com"}'::jsonb,
  'email', now(), now(), now()
) on conflict do nothing;

insert into perfis (id, academia_id, nome, role)
values ('10000000-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'Roberto Almeida', 'proprietario')
on conflict (id) do update set academia_id = excluded.academia_id, nome = excluded.nome, role = excluded.role;

-- Professor Carlos
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role)
values (
  '10000000-0000-0000-0000-000000000002',
  'carlos@academia.com',
  crypt('prof123', gen_salt('bf')),
  now(),
  '{"nome":"Carlos Gracie Jr."}'::jsonb,
  'authenticated'
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'carlos@academia.com',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"carlos@academia.com"}'::jsonb,
  'email', now(), now(), now()
) on conflict do nothing;

insert into perfis (id, academia_id, nome, role)
values ('10000000-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', 'Carlos Gracie Jr.', 'professor')
on conflict (id) do update set academia_id = excluded.academia_id, nome = excluded.nome, role = excluded.role;

-- Administrativo Juliana
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role)
values (
  '10000000-0000-0000-0000-000000000003',
  'juliana@tatamesp.com',
  crypt('adm123', gen_salt('bf')),
  now(),
  '{"nome":"Juliana Campos"}'::jsonb,
  'authenticated'
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000003',
  'juliana@tatamesp.com',
  '{"sub":"10000000-0000-0000-0000-000000000003","email":"juliana@tatamesp.com"}'::jsonb,
  'email', now(), now(), now()
) on conflict do nothing;

insert into perfis (id, academia_id, nome, role)
values ('10000000-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', 'Juliana Campos', 'administrativo')
on conflict (id) do update set academia_id = excluded.academia_id, nome = excluded.nome, role = excluded.role;

-- Atualiza professor_id nas turmas
update turmas set professor_id = '10000000-0000-0000-0000-000000000002'
where academia_id = '00000001-0000-0000-0000-000000000001';
