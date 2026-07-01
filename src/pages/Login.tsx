import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { useNavigate, Navigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, LogIn, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { dataService } from '@/services/data.service'

const HINTS = [
  { label: 'Roberto Almeida',  email: 'roberto@tatamesp.com',    senha: '123456',  badge: 'Proprietário', cor: 'bg-blue-100 text-blue-700' },
  { label: 'Carlos Gracie Jr.',email: 'carlos@academia.com',      senha: 'prof123', badge: 'Professor',    cor: 'bg-amber-100 text-amber-700' },
  { label: 'Juliana Campos',   email: 'juliana@tatamesp.com',    senha: 'adm123',  badge: 'Adm',          cor: 'bg-pink-100 text-pink-700' },
]

const GOOGLE_ACCOUNTS = [
  { nome: 'Roberto Almeida',   email: 'roberto@tatamesp.com',   foto: 'RA', cor: '#1e40af' },
  { nome: 'Carlos Gracie Jr.', email: 'carlos@academia.com',    foto: 'CG', cor: '#92400e' },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

interface GoogleModalProps {
  onSelect: (email: string) => void
  onClose: () => void
}

function GoogleModal({ onSelect, onClose }: GoogleModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function escolher(email: string) {
    setLoading(email)
    await new Promise(r => setTimeout(r, 800))
    onSelect(email)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
        {/* Header estilo Google */}
        <div className="px-6 pt-8 pb-4 text-center border-b border-gray-100">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GoogleIcon />
            <span className="text-lg font-medium text-gray-700">Google</span>
          </div>
          <p className="text-base font-medium text-gray-800">Escolher uma conta</p>
          <p className="text-xs text-gray-500 mt-1">para continuar em <strong>TatameHoje</strong></p>
        </div>

        {/* Contas */}
        <div className="py-2">
          {GOOGLE_ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              onClick={() => escolher(acc.email)}
              disabled={!!loading}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: acc.cor }}
              >
                {loading === acc.email
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : acc.foto}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{acc.nome}</p>
                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
              </div>
              {loading === acc.email && <Check size={16} className="text-blue-600 ml-auto shrink-0" />}
            </button>
          ))}

          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
              <X size={16} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Cancelar</p>
          </button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Atalho de demonstração · usa Supabase Auth</p>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { setUser, setAcademiaAtual, setDados, user } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function entrarComSupabase(emailLogin: string, senhaLogin: string) {
    setErro('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailLogin.trim(),
        password: senhaLogin,
      })
      if (error || !data.user) {
        setErro(error?.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : (error?.message ?? 'Erro ao entrar'))
        setLoading(false)
        return
      }

      // Busca perfil para obter academia_id e role
      const { data: perfilRaw, error: errPerfil } = await (supabase as any)
        .from('perfis')
        .select('*')
        .eq('id', data.user.id)
        .single()
      const perfil = perfilRaw as {
        id: string; nome: string; role: string; academia_id: string; foto_url: string | null
      } | null

      if (errPerfil || !perfil) {
        setErro('Perfil não encontrado. Contate o administrador.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      setUser({
        id: perfil.id,
        nome: perfil.nome,
        email: data.user.email ?? '',
        role: perfil.role as any,
        academia_id: perfil.academia_id,
        foto_url: perfil.foto_url ?? undefined,
      })
      setAcademiaAtual(perfil.academia_id)

      // Carrega todos os dados da academia
      const dados = await dataService.carregarTudo(perfil.academia_id)
      setDados(dados)

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await entrarComSupabase(email, senha)
  }

  async function handleGoogle(emailGoogle: string) {
    const senhaGoogle = emailGoogle === 'carlos@academia.com' ? 'prof123' : '123456'
    setShowGoogle(false)
    await entrarComSupabase(emailGoogle, senhaGoogle)
  }

  function preencherHint(h: typeof HINTS[0]) {
    setEmail(h.email)
    setSenha(h.senha)
    setErro('')
  }

  return (
    <>
      {showGoogle && (
        <GoogleModal
          onSelect={handleGoogle}
          onClose={() => setShowGoogle(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TatameHoje</h1>
            <p className="text-blue-300 text-sm mt-1">Gestão de Academias de Artes Marciais</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Entrar na sua conta</h2>

            {/* Login com Google */}
            <button
              type="button"
              onClick={() => setShowGoogle(true)}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">ou entre com email</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErro('') }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="••••••"
                    value={senha}
                    onChange={e => { setSenha(e.target.value); setErro('') }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !senha}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <LogIn size={16} />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Atalhos de demonstração */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Acessos de demonstração</p>
              <div className="space-y-1">
                {HINTS.map(h => (
                  <button
                    key={h.email}
                    type="button"
                    onClick={() => preencherHint(h)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{h.label}</span>
                      <p className="text-xs text-gray-400">{h.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.cor}`}>{h.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-blue-400 text-xs">
            © 2026 TatameHoje · Todos os direitos reservados
          </p>
        </div>
      </div>
    </>
  )
}
