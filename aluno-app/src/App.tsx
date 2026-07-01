import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'sonner'
import { supabase, supabaseConfigurado } from './lib/supabase'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { CheckIn } from './pages/CheckIn'
import { Mensalidades } from './pages/Mensalidades'
import { Comunicados } from './pages/Comunicados'
import { Perfil } from './pages/Perfil'
import { Home as HomeIcon, QrCode, CreditCard, Bell, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

function Nav() {
  const tabs = [
    { to: '/',             icon: HomeIcon,   label: 'Início' },
    { to: '/checkin',      icon: QrCode,     label: 'Check-in' },
    { to: '/mensalidades', icon: CreditCard, label: 'Plano' },
    { to: '/comunicados',  icon: Bell,       label: 'Avisos' },
    { to: '/perfil',       icon: User,       label: 'Perfil' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-bottom">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 text-xs gap-1 transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!supabaseConfigurado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-black">T</span>
        </div>
        <h1 className="text-white text-xl font-bold mb-2">TatameHoje — Aluno</h1>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          Para ativar o app, crie um arquivo <code className="text-amber-400">.env</code> na pasta <code className="text-amber-400">aluno-app/</code> com as credenciais do Supabase.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 text-left text-xs text-slate-300 font-mono w-full max-w-sm">
          <p className="text-slate-500 mb-1"># aluno-app/.env</p>
          <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
        </div>
        <p className="text-slate-500 text-xs mt-4">Copie de <strong className="text-slate-400">aluno-app/.env.example</strong></p>
      </div>
    )
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        {!user ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50 pb-20">
              <Nav />
              <div className="max-w-md mx-auto">
                <Routes>
                  <Route index element={<Home userId={user.id} />} />
                  <Route path="checkin" element={<CheckIn userId={user.id} />} />
                  <Route path="mensalidades" element={<Mensalidades userId={user.id} />} />
                  <Route path="comunicados" element={<Comunicados userId={user.id} />} />
                  <Route path="perfil" element={<Perfil userId={user.id} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          } />
        )}
      </Routes>
    </BrowserRouter>
  )
}
