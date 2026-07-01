import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const alunosService = {
  async listar(academiaId: string) {
    const { data, error } = await db
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
    const { data, error } = await db
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

  async criar(aluno: Record<string, any>) {
    const { data, error } = await db.from('alunos').insert(aluno).select().single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, dados: Record<string, any>) {
    const { data, error } = await db.from('alunos').update(dados).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remover(id: string) {
    const { error } = await db.from('alunos').delete().eq('id', id)
    if (error) throw error
  },

  // Vincula conta de usuário auth ao aluno (para o app)
  async vincularUsuario(alunoId: string, userId: string) {
    return alunosService.atualizar(alunoId, { user_id: userId })
  },
}
