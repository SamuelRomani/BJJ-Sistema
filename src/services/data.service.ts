/**
 * Carrega todos os dados da academia do Supabase e os mapeia
 * para os tipos que o Zustand store já usa.
 */
import { supabase } from '@/lib/supabase'
import type { Academia, Aluno, Turma, Mensalidade, CheckIn, Modalidade, Pacote, Comunicado, User } from '@/types'

export const dataService = {
  async carregarTudo(academiaId: string) {
    // Cast para any para contornar inferência estrita do supabase-js com tipos manuais
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    // Busca tudo em paralelo
    const [
      acResult,
      alunosResult,
      turmasResult,
      modalidadesResult,
      pacotesResult,
      comunicadosResult,
      professoresResult,
    ] = await Promise.all([
      db.from('academias').select('*').eq('id', academiaId).single(),

      db.from('alunos').select(`
        *,
        modalidade:modalidades(*),
        graduacao:graduacoes(*),
        pacote:pacotes(*),
        historico_faixas(*, graduacao:graduacoes(*))
      `).eq('academia_id', academiaId).order('nome'),

      db.from('turmas').select(`
        *,
        modalidade:modalidades(*),
        professor:perfis(*),
        horarios(*)
      `).eq('academia_id', academiaId),

      db.from('modalidades').select('*').eq('academia_id', academiaId),
      db.from('pacotes').select('*').eq('academia_id', academiaId),
      db.from('comunicados').select('*').eq('academia_id', academiaId).order('created_at', { ascending: false }),
      db.from('perfis').select('*').eq('academia_id', academiaId).eq('role', 'professor'),
    ])

    const turmas = mapTurmas(turmasResult.data ?? [])
    const turmaIds = turmas.map((t: Turma) => t.id)

    // Busca mensalidades e check-ins só das turmas desta academia
    const [mensalidadesResult, checkInsResult] = await Promise.all([
      turmaIds.length
        ? db.from('mensalidades').select('*').in('turma_id', turmaIds)
        : Promise.resolve({ data: [] as any[] }),
      turmaIds.length
        ? db.from('checkins').select('*').in('turma_id', turmaIds).order('data', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ])

    return {
      academia:    acResult.data    ? mapAcademia(acResult.data)         : null,
      alunos:      mapAlunos(alunosResult.data ?? []),
      turmas,
      modalidades: mapModalidades(modalidadesResult.data ?? []),
      pacotes:     mapPacotes(pacotesResult.data ?? []),
      comunicados: mapComunicados(comunicadosResult.data ?? [], academiaId),
      professores: mapProfessores(professoresResult.data ?? [], academiaId),
      mensalidades: mapMensalidades(mensalidadesResult.data ?? []),
      checkIns:    mapCheckIns(checkInsResult.data ?? []),
    }
  },
}

// ── Mappers ──────────────────────────────────────────────────────────────

function mapAcademia(r: any): Academia {
  return {
    id: r.id,
    nome: r.nome,
    logo_url: r.logo_url,
    endereco: r.endereco ?? '',
    bairro: r.bairro ?? '',
    cidade: r.cidade ?? '',
    estado: r.estado ?? '',
    cep: r.cep ?? '',
    telefone: r.telefone ?? '',
    email: r.email ?? '',
    pix: r.pix,
    instagram: r.instagram,
    website: r.website,
    horarios_funcionamento: r.horarios_funcionamento ?? [],
    tema: r.tema ?? { cor_primaria: '#1e40af', cor_secundaria: '#3b82f6', cor_destaque: '#f59e0b' },
    criada_em: r.criada_em,
  }
}

function mapAlunos(rows: any[]): Aluno[] {
  return rows.map(r => ({
    id: r.id,
    academia_id: r.academia_id,
    nome: r.nome,
    cpf: r.cpf ?? '',
    email: r.email ?? '',
    telefone: r.telefone ?? '',
    data_nascimento: r.data_nascimento ?? '',
    foto_url: r.foto_url,
    status: r.status,
    modalidade_principal_id: r.modalidade_id,
    modalidade_principal: r.modalidade ?? { id: r.modalidade_id, nome: '—', academia_id: r.academia_id },
    graduacao_atual_id: r.graduacao_id,
    graduacao_atual: r.graduacao ?? undefined,
    grau_atual: r.grau_atual ?? 0,
    pacote_id: r.pacote_id,
    pacote: r.pacote ?? undefined,
    historico_faixas: (r.historico_faixas ?? []).map((h: any) => ({
      id: h.id,
      aluno_id: h.aluno_id,
      graduacao_id: h.graduacao_id,
      graduacao: h.graduacao ?? { id: h.graduacao_id, nome: '—', cor_hex: '#ccc', sequencia: 0, modalidade_id: '' },
      grau: h.grau ?? 0,
      data_promocao: h.data_promocao,
      professor_id: h.professor_id,
      observacoes: h.observacoes,
    })),
    data_matricula: r.data_matricula ?? r.created_at?.split('T')[0],
  }))
}

function mapTurmas(rows: any[]): Turma[] {
  return rows.map(r => ({
    id: r.id,
    academia_id: r.academia_id,
    nome: r.nome,
    modalidade_id: r.modalidade_id,
    modalidade: r.modalidade ?? { id: r.modalidade_id, nome: '—', academia_id: r.academia_id },
    professor_id: r.professor_id ?? '',
    professor: r.professor ? {
      id: r.professor.id,
      nome: r.professor.nome,
      email: '',
      role: 'professor' as const,
      academia_id: r.academia_id,
    } : undefined,
    nivel: r.nivel ?? 'todos',
    capacidade_maxima: r.capacidade_maxima ?? 30,
    horarios: (r.horarios ?? []).map((h: any) => ({
      id: h.id,
      turma_id: h.turma_id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio?.slice(0, 5) ?? '00:00',
      hora_fim: h.hora_fim?.slice(0, 5) ?? '00:00',
    })),
    ativa: r.ativa ?? true,
  }))
}

function mapModalidades(rows: any[]): Modalidade[] {
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    academia_id: r.academia_id,
    tem_graus: r.tem_graus ?? false,
    max_graus: r.max_graus ?? 4,
  }))
}

function mapPacotes(rows: any[]): Pacote[] {
  return rows.map(r => ({
    id: r.id,
    academia_id: r.academia_id,
    nome: r.nome,
    descricao: r.descricao,
    modalidade_id: r.modalidade_id,
    valor: r.valor,
    periodicidade: r.periodicidade,
    numero_aulas_semana: r.numero_aulas_semana,
    ativo: r.ativo,
  }))
}

function mapMensalidades(rows: any[]): Mensalidade[] {
  return rows.map(r => ({
    id: r.id,
    turma_id: r.turma_id,
    aluno_id: r.aluno_id,
    valor: r.valor,
    vencimento: r.vencimento,
    status: r.status,
    data_pagamento: r.data_pagamento,
    metodo: r.metodo,
    desconto: r.desconto,
    multa: r.multa,
    observacoes: r.observacoes,
  }))
}

function mapCheckIns(rows: any[]): CheckIn[] {
  return rows.map(r => ({
    id: r.id,
    turma_id: r.turma_id,
    aluno_id: r.aluno_id,
    data: r.data,
    hora_checkin: r.hora_checkin?.slice(0, 5) ?? '00:00',
  }))
}

function mapComunicados(rows: any[], academiaId: string): Comunicado[] {
  return rows.map(r => ({
    id: r.id,
    academia_id: r.academia_id ?? academiaId,
    titulo: r.titulo,
    mensagem: r.mensagem,
    tipo: r.tipo,
    destinatarios: r.destinatarios,
    criado_em: r.created_at,
    criado_por: r.criado_por ?? 'Sistema',
  }))
}

function mapProfessores(rows: any[], academiaId: string): User[] {
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    email: '',
    role: 'professor' as const,
    academia_id: academiaId,
  }))
}
