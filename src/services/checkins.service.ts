import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const checkinsService = {
  async listar(academiaId: string) {
    const { data, error } = await db
      .from('checkins')
      .select('*, aluno:alunos(nome, foto_url), turma:turmas(nome, modalidade_id)')
      .eq('alunos.academia_id', academiaId)
      .order('data', { ascending: false })
      .order('hora_checkin', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async listarPorAluno(alunoId: string) {
    const { data, error } = await db
      .from('checkins')
      .select('*, turma:turmas(nome, modalidade:modalidades(nome))')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async registrar(turmaId: string, alunoId: string, data?: string) {
    const hoje = data ?? new Date().toISOString().split('T')[0]
    const hora = new Date().toTimeString().slice(0, 8)

    const { data: ci, error } = await db
      .from('checkins')
      .insert({ turma_id: turmaId, aluno_id: alunoId, data: hoje, hora_checkin: hora })
      .select()
      .single()

    if (error) {
      // Código 23505 = unique violation (já fez check-in hoje)
      if (error.code === '23505') throw new Error('Aluno já fez check-in hoje nesta turma')
      throw error
    }
    return ci
  },

  async remover(id: string) {
    const { error } = await db.from('checkins').delete().eq('id', id)
    if (error) throw error
  },

  // Realtime — escuta novos check-ins da academia
  escutarNovos(academiaId: string, callback: (ci: any) => void) {
    return supabase
      .channel(`checkins-${academiaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'checkins',
      }, payload => callback(payload.new))
      .subscribe()
  },
}
