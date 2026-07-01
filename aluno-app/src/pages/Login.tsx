import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'magic'>('login')

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (modo === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) throw error
        toast.success('Link enviado! Verifique seu email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw new Error('Email ou senha incorretos')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl font-black">T</span>
        </div>
        <h1 className="text-white text-2xl font-bold">TatameHoje</h1>
        <p className="text-slate-400 text-sm mt-1">Portal do Aluno</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
        <h2 className="text-gray-900 font-bold text-xl mb-5">Entrar</h2>

        {/* Toggle modo */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setModo('login')}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${modo === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Senha
          </button>
          <button
            onClick={() => setModo('magic')}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${modo === 'magic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Link mágico
          </button>
        </div>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email" required autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          {modo === 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Senha</label>
              <input
                type="password" required autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Aguarde...' : modo === 'magic' ? 'Enviar link' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Não tem acesso? Fale com a secretaria da academia.
        </p>
      </div>
    </div>
  )
}
