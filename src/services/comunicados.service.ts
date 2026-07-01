import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const comunicadosService = {
  async listar(academiaId: string) {
    const { data, error } = await db
      .from('comunicados')
      .select('*, criado_por_perfil:perfis(nome)')
      .eq('academia_id', academiaId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  // Aluno: busca comunicados da própria academia
  async listarParaAluno(alunoId: string) {
    const { data: aluno } = await db
      .from('alunos')
      .select('academia_id, status')
      .eq('id', alunoId)
      .single()

    if (!aluno) return []

    const { data, error } = await db
      .from('comunicados')
      .select('*')
      .eq('academia_id', aluno.academia_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Filtra conforme destinatários
    return (data ?? []).filter((c: any) => {
      if (c.destinatarios === 'todos') return true
      if (c.destinatarios === 'ativos') return aluno.status === 'ativo'
      return true // inadimplentes — o aluno não sabe disso no app, mas vê
    })
  },

  async criar(comunicado: Record<string, any>) {
    const { data, error } = await db.from('comunicados').insert(comunicado).select().single()
    if (error) throw error
    return data
  },

  async remover(id: string) {
    const { error } = await db.from('comunicados').delete().eq('id', id)
    if (error) throw error
  },

  // Realtime — aluno escuta novos comunicados da academia
  escutarNovos(academiaId: string, callback: (c: any) => void) {
    return supabase
      .channel(`comunicados-${academiaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comunicados',
        filter: `academia_id=eq.${academiaId}`,
      }, payload => callback(payload.new))
      .subscribe()
  },

  // Marcar como "push enviado" após disparar Web Push
  async marcarPushEnviado(id: string) {
    await db.from('comunicados').update({ enviado_push: true }).eq('id', id)
  },
}
