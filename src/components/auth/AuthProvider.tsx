import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { dataService } from '@/services/data.service'

interface Perfil {
  id: string; academia_id: string; nome: string
  role: 'dev' | 'proprietario' | 'professor' | 'administrativo' | 'aluno'
  foto_url: string | null
}

async function carregarPerfil(userId: string): Promise<Perfil | null> {
  const { data } = await (supabase as any)
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .single()
  return data as Perfil | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAcademiaAtual, setDados, user } = useStore()
  const carregando = useRef(false)

  async function inicializarSessao(supabaseUser: { id: string; email?: string } | null) {
    if (!supabaseUser) {
      setUser(null)
      return
    }
    if (carregando.current) return
    carregando.current = true

    try {
      const perfil = await carregarPerfil(supabaseUser.id)
      if (!perfil) { setUser(null); return }

      setUser({
        id: perfil.id,
        nome: perfil.nome,
        email: supabaseUser.email ?? '',
        role: perfil.role,
        academia_id: perfil.academia_id,
        foto_url: perfil.foto_url ?? undefined,
      })
      setAcademiaAtual(perfil.academia_id ?? '')

      const dados = await dataService.carregarTudo(perfil.academia_id ?? '')
      setDados(dados)
    } catch (err) {
      console.error('Erro ao inicializar sessão:', err)
      setUser(null)
    } finally {
      carregando.current = false
    }
  }

  useEffect(() => {
    // Verifica sessão existente no boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        inicializarSessao(session.user)
      }
    })

    // Escuta mudanças de auth (login/logout em outras abas, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !user) {
        inicializarSessao(session.user)
      } else if (!session) {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
