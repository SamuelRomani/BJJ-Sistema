import { supabase } from '@/lib/supabase'

export const authService = {
  // Login admin/professor
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, erro: error.message }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return { ok: true, perfil }
  },

  // Signup inicial (usado no onboarding da academia)
  async signUp(email: string, password: string, nome: string, academiaId?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) return { ok: false, erro: error.message }

    if (data.user && academiaId) {
      await supabase.from('perfis').update({ academia_id: academiaId, nome }).eq('id', data.user.id)
    }

    return { ok: true, user: data.user }
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  // Escuta mudanças de sessão
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },

  async getPerfil(userId: string) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()
    return data
  },
}
