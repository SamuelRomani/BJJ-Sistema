/**
 * Persiste todas as operações de escrita no Supabase.
 * O store chama estas funções de forma fire-and-forget após atualizar o estado local.
 */
import { supabase } from '@/lib/supabase'
import type { Aluno, CheckIn, Mensalidade, Comunicado, Turma, Pacote, Academia, Graduacao, HistoricoFaixa } from '@/types'

const db = supabase as any

export const writesService = {
  // ── ALUNOS ─────────────────────────────────────────────────
  async inserirAluno(aluno: Aluno) {
    const { error } = await db.from('alunos').insert({
      id:               aluno.id,
      academia_id:      aluno.academia_id,
      nome:             aluno.nome,
      cpf:              aluno.cpf,
      email:            aluno.email,
      telefone:         aluno.telefone,
      data_nascimento:  aluno.data_nascimento,
      foto_url:         aluno.foto_url ?? null,
      status:           aluno.status,
      modalidade_id:    aluno.modalidade_principal_id,
      graduacao_id:     aluno.graduacao_atual_id ?? null,
      grau_atual:       aluno.grau_atual ?? 0,
      pacote_id:        aluno.pacote_id ?? null,
      data_matricula:   aluno.data_matricula,
    })
    if (error) throw error

    // Insere histórico de faixas
    if (aluno.historico_faixas?.length) {
      await db.from('historico_faixas').insert(
        aluno.historico_faixas.map(h => ({
          id:            h.id,
          aluno_id:      aluno.id,
          graduacao_id:  h.graduacao_id,
          grau:          h.grau ?? 0,
          data_promocao: h.data_promocao,
          professor_id:  h.professor_id ?? null,
          observacoes:   h.observacoes ?? null,
        }))
      )
    }
  },

  async atualizarAluno(id: string, data: Partial<Aluno>, novosHistorico: HistoricoFaixa[] = []) {
    const payload: Record<string, any> = {}
    if (data.nome !== undefined)                  payload.nome = data.nome
    if (data.cpf !== undefined)                   payload.cpf = data.cpf
    if (data.email !== undefined)                 payload.email = data.email
    if (data.telefone !== undefined)              payload.telefone = data.telefone
    if (data.data_nascimento !== undefined)       payload.data_nascimento = data.data_nascimento
    if (data.foto_url !== undefined)              payload.foto_url = data.foto_url
    if (data.status !== undefined)                payload.status = data.status
    if (data.modalidade_principal_id !== undefined) payload.modalidade_id = data.modalidade_principal_id
    if (data.graduacao_atual_id !== undefined)    payload.graduacao_id = data.graduacao_atual_id
    if (data.grau_atual !== undefined)            payload.grau_atual = data.grau_atual
    if (data.pacote_id !== undefined)             payload.pacote_id = data.pacote_id ?? null

    if (Object.keys(payload).length > 0) {
      const { error } = await db.from('alunos').update(payload).eq('id', id)
      if (error) throw error
    }

    if (novosHistorico.length > 0) {
      const { error } = await db.from('historico_faixas').insert(
        novosHistorico.map(h => ({
          id:            h.id,
          aluno_id:      h.aluno_id,
          graduacao_id:  h.graduacao_id,
          grau:          h.grau ?? 0,
          data_promocao: h.data_promocao,
          professor_id:  h.professor_id ?? null,
          observacoes:   h.observacoes ?? null,
        }))
      )
      if (error) throw error
    }
  },

  async removerAluno(id: string) {
    const { error } = await db.from('alunos').delete().eq('id', id)
    if (error) throw error
  },

  // ── CHECK-INS ──────────────────────────────────────────────
  async inserirCheckIn(c: CheckIn) {
    const { error } = await db.from('checkins').insert({
      id:           c.id,
      turma_id:     c.turma_id,
      aluno_id:     c.aluno_id,
      data:         c.data,
      hora_checkin: c.hora_checkin + ':00',
    })
    if (error) throw error
  },

  async removerCheckIn(id: string) {
    const { error } = await db.from('checkins').delete().eq('id', id)
    if (error) throw error
  },

  // ── MENSALIDADES ───────────────────────────────────────────
  async inserirMensalidade(m: Mensalidade) {
    const { error } = await db.from('mensalidades').insert({
      id:             m.id,
      turma_id:       m.turma_id,
      aluno_id:       m.aluno_id,
      valor:          m.valor,
      vencimento:     m.vencimento,
      status:         m.status,
      data_pagamento: m.data_pagamento ?? null,
      metodo:         m.metodo ?? null,
      desconto:       m.desconto ?? 0,
      multa:          m.multa ?? 0,
      observacoes:    m.observacoes ?? null,
    })
    if (error) throw error
  },

  async atualizarMensalidade(id: string, data: Partial<Mensalidade>) {
    const payload: Record<string, any> = {}
    if (data.status !== undefined)         payload.status = data.status
    if (data.data_pagamento !== undefined)  payload.data_pagamento = data.data_pagamento
    if (data.metodo !== undefined)          payload.metodo = data.metodo
    if (data.valor !== undefined)           payload.valor = data.valor
    if (data.vencimento !== undefined)      payload.vencimento = data.vencimento
    if (data.desconto !== undefined)        payload.desconto = data.desconto
    if (data.multa !== undefined)           payload.multa = data.multa
    if (data.observacoes !== undefined)     payload.observacoes = data.observacoes

    if (Object.keys(payload).length === 0) return
    const { error } = await db.from('mensalidades').update(payload).eq('id', id)
    if (error) throw error
  },

  // ── COMUNICADOS ────────────────────────────────────────────
  async inserirComunicado(c: Comunicado) {
    const { error } = await db.from('comunicados').insert({
      id:            c.id,
      academia_id:   c.academia_id,
      titulo:        c.titulo,
      mensagem:      c.mensagem,
      tipo:          c.tipo,
      destinatarios: c.destinatarios,
      criado_por:    c.criado_por ?? null,
    })
    if (error) throw error
  },

  async removerComunicado(id: string) {
    const { error } = await db.from('comunicados').delete().eq('id', id)
    if (error) throw error
  },

  // ── TURMAS ─────────────────────────────────────────────────
  async inserirTurma(t: Turma) {
    const { error } = await db.from('turmas').insert({
      id:               t.id,
      academia_id:      t.academia_id,
      nome:             t.nome,
      modalidade_id:    t.modalidade_id,
      professor_id:     t.professor_id || null,
      nivel:            t.nivel,
      capacidade_maxima: t.capacidade_maxima,
      ativa:            t.ativa,
    })
    if (error) throw error

    if (t.horarios?.length) {
      await db.from('horarios').insert(
        t.horarios.map(h => ({
          id:          h.id,
          turma_id:    t.id,
          dia_semana:  h.dia_semana,
          hora_inicio: h.hora_inicio + ':00',
          hora_fim:    h.hora_fim + ':00',
        }))
      )
    }
  },

  async atualizarTurma(id: string, data: Partial<Turma>) {
    const payload: Record<string, any> = {}
    if (data.nome !== undefined)              payload.nome = data.nome
    if (data.modalidade_id !== undefined)     payload.modalidade_id = data.modalidade_id
    if (data.professor_id !== undefined)      payload.professor_id = data.professor_id || null
    if (data.nivel !== undefined)             payload.nivel = data.nivel
    if (data.capacidade_maxima !== undefined) payload.capacidade_maxima = data.capacidade_maxima
    if (data.ativa !== undefined)             payload.ativa = data.ativa

    if (Object.keys(payload).length) {
      const { error } = await db.from('turmas').update(payload).eq('id', id)
      if (error) throw error
    }

    if (data.horarios) {
      await db.from('horarios').delete().eq('turma_id', id)
      if (data.horarios.length) {
        await db.from('horarios').insert(
          data.horarios.map(h => ({
            id:         h.id,
            turma_id:   id,
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio + ':00',
            hora_fim:   h.hora_fim + ':00',
          }))
        )
      }
    }
  },

  // ── PACOTES ────────────────────────────────────────────────
  async inserirPacote(p: Pacote) {
    const { error } = await db.from('pacotes').insert({
      id:                   p.id,
      academia_id:          p.academia_id,
      nome:                 p.nome,
      descricao:            p.descricao ?? null,
      modalidade_id:        p.modalidade_id ?? null,
      valor:                p.valor,
      periodicidade:        p.periodicidade,
      numero_aulas_semana:  p.numero_aulas_semana ?? null,
      ativo:                p.ativo,
    })
    if (error) throw error
  },

  async atualizarPacote(id: string, data: Partial<Pacote>) {
    const { error } = await db.from('pacotes').update(data).eq('id', id)
    if (error) throw error
  },

  // ── PROFESSORES (perfis) ───────────────────────────────────
  async inserirProfessor(p: { id: string; nome: string; email: string; foto_url?: string; academia_id: string }) {
    // Cria usuário auth via Admin API não disponível aqui; insere apenas o perfil
    const { error } = await db.from('perfis').insert({
      id:          p.id,
      academia_id: p.academia_id,
      nome:        p.nome,
      role:        'professor',
      foto_url:    p.foto_url ?? null,
    })
    if (error) throw error
  },

  async atualizarProfessor(id: string, data: { nome?: string; email?: string; foto_url?: string }) {
    const payload: Record<string, any> = {}
    if (data.nome !== undefined)    payload.nome = data.nome
    if (data.foto_url !== undefined) payload.foto_url = data.foto_url ?? null
    if (Object.keys(payload).length === 0) return
    const { error } = await db.from('perfis').update(payload).eq('id', id)
    if (error) throw error
  },

  // ── MODALIDADES ────────────────────────────────────────────
  async inserirModalidade(m: { id: string; nome: string; descricao?: string; academia_id: string; tem_graus: boolean; max_graus: number }) {
    const { error } = await db.from('modalidades').insert({
      id:          m.id,
      academia_id: m.academia_id,
      nome:        m.nome,
      descricao:   m.descricao ?? null,
      tem_graus:   m.tem_graus,
      max_graus:   m.max_graus,
    })
    if (error) throw error
  },

  async atualizarModalidade(id: string, data: { nome?: string; descricao?: string; tem_graus?: boolean; max_graus?: number }) {
    const { error } = await db.from('modalidades').update(data).eq('id', id)
    if (error) throw error
  },

  // ── GRADUAÇÕES ─────────────────────────────────────────────
  async inserirGraduacao(g: Graduacao) {
    const { error } = await db.from('graduacoes').insert({
      id:                g.id,
      modalidade_id:     g.modalidade_id,
      nome:              g.nome,
      cor_hex:           g.cor_hex,
      sequencia:         g.sequencia,
      tempo_minimo_dias: g.tempo_minimo_dias ?? null,
    })
    if (error) throw error
  },

  async atualizarGraduacao(id: string, data: Partial<Graduacao>) {
    const payload: Record<string, any> = {}
    if (data.nome !== undefined)              payload.nome = data.nome
    if (data.cor_hex !== undefined)           payload.cor_hex = data.cor_hex
    if (data.sequencia !== undefined)         payload.sequencia = data.sequencia
    if (data.tempo_minimo_dias !== undefined) payload.tempo_minimo_dias = data.tempo_minimo_dias ?? null
    if (Object.keys(payload).length === 0) return
    const { error } = await db.from('graduacoes').update(payload).eq('id', id)
    if (error) throw error
  },

  async removerGraduacao(id: string) {
    const { error } = await db.from('graduacoes').delete().eq('id', id)
    if (error) throw error
  },

  // ── ACADEMIA ───────────────────────────────────────────────
  async atualizarAcademia(id: string, data: Partial<Academia>) {
    const payload: Record<string, any> = { ...data }
    // Remove campos que não existem na tabela
    delete payload.id
    delete payload.criada_em
    const { error } = await db.from('academias').update(payload).eq('id', id)
    if (error) throw error
  },
}
