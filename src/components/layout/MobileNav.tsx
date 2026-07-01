import { NavLink } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { LayoutDashboard, Users, QrCode, Award, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Início',      roles: ['dev','proprietario','administrativo','professor'] as UserRole[] },
  { to: '/alunos',     icon: Users,            label: 'Alunos',     roles: ['dev','proprietario','administrativo','professor'] as UserRole[] },
  { to: '/checkin',    icon: QrCode,           label: 'Check-in',   roles: ['dev','proprietario','administrativo','professor'] as UserRole[] },
  { to: '/graduacoes', icon: Award,            label: 'Graduações', roles: ['dev','proprietario','professor'] as UserRole[] },
  { to: '/pagamentos', icon: CreditCard,       label: 'Pagamentos', roles: ['dev','proprietario','administrativo'] as UserRole[] },
]

export function MobileNav() {
  const { user } = useStore()
  const role = user?.role as UserRole | undefined

  const visivel = NAV_ITEMS.filter(item => !role || item.roles.includes(role))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex lg:hidden safe-area-bottom">
      {visivel.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn('p-1.5 rounded-xl transition-colors', isActive && 'bg-blue-50')}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
