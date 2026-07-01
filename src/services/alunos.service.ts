import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AlunoInsert = Database['public']['Tables']['alunos']['Insert']
type AlunoUpdate = Database['public']['Tables']['alunos']['Update']

export const alunosService = {
  async listar(academiaId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        *,
        modalidade:modalidades(*),
        graduacao:graduacoes(*),
        pacote:pacotes(*),
        historico_faixas(*, graduacao:graduacoes(*))
      `)
      .eq('academia_id', academiaId)
      .order('nome')

    if (error) throw error
    return data ?? []
  },

  async buscar(id: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        *,
        modalidade:modalidades(*),
        graduacao:graduacoes(*),
        pacote:pacotes(*),
        historico_faixas(*, graduacao:graduacoes(*))
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async criar(aluno: AlunoInsert) {
    const { data, error } = await supabase.from('alunos').insert(aluno).select().single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, dados: AlunoUpdate) {
    const { data, error } = await supabase.from('alunos').update(dados).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remover(id: string) {
    const { error } = await supabase.from('alunos').delete().eq('id', id)
    if (error) throw error
  },

  // Vincula conta de usuário auth ao aluno (para o app)
  async vincularUsuario(alunoId: string, userId: string) {
    return alunosService.atualizar(alunoId, { user_id: userId })
  },
}
