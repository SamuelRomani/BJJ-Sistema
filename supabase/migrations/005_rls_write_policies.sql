-- ============================================================
-- TatameHoje — Políticas de escrita para graduacoes e horarios
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Graduações: escrita para proprietario/dev
create policy "graduacoes_write" on graduacoes
  for all using (
    meu_role() in ('dev','proprietario')
    and exists (
      select 1 from modalidades m
      where m.id = modalidade_id
        and m.academia_id = minha_academia_id()
    )
  );

-- Horários: escrita para quem pode escrever turmas
create policy "horarios_write" on horarios
  for all using (
    meu_role() in ('dev','proprietario','administrativo')
    and exists (
      select 1 from turmas t
      where t.id = turma_id
        and t.academia_id = minha_academia_id()
    )
  );
