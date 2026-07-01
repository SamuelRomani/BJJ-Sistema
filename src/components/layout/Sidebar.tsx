import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import {
  LayoutDashboard, Users, Award,
  CreditCard, BarChart2, X, ChevronRight, Dumbbell, QrCode, Settings, Package, Megaphone
} from 'lucide-react'
import type { UserRole } from '@/types'
import { ROUTE_ROLES } from '@/components/auth/ProtectedRoute'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alunos',       icon: Users,            label: 'Alunos' },
  { to: '/turmas',       icon: Dumbbell,         label: 'Turmas' },
  { to: '/checkin',      icon: QrCode,           label: 'Check-in' },
  { to: '/graduacoes',   icon: Award,            label: 'Graduações' },
  { to: '/pacotes',      icon: Package,          label: 'Pacotes' },
  { to: '/pagamentos',   icon: CreditCard,       label: 'Pagamentos' },
  { to: '/comunicados',  icon: Megaphone,        label: 'Comunicados' },
  { to: '/relatorios',   icon: BarChart2,        label: 'Relatórios' },
  { to: '/configuracoes',icon: Settings,         label: 'Configurações' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user } = useStore()
  const role = user?.role as UserRole | undefined

  const itemsVisiveis = navItems.filter(item => {
    const roles = ROUTE_ROLES[item.to]
    return !roles || !role || roles.includes(role)
  })

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-30 bg-slate-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700 shrink-0">
          {sidebarOpen && (
            <span className="font-bold text-lg text-amber-400 truncate">TatameHoje</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {itemsVisiveis.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors mb-1',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700 shrink-0">
            <p className="text-xs text-slate-500">v1.0.0 — TatameHoje</p>
          </div>
        )}
      </aside>
    </>
  )
}
