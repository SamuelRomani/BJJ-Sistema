import { Navigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { UserRole } from '@/types'

// Quais roles podem acessar cada rota
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':    ['dev', 'proprietario', 'administrativo', 'professor'],
  '/alunos':       ['dev', 'proprietario', 'administrativo', 'professor'],
  '/turmas':       ['dev', 'proprietario', 'administrativo', 'professor'],
  '/checkin':      ['dev', 'proprietario', 'administrativo', 'professor'],
  '/graduacoes':   ['dev', 'proprietario', 'professor'],
  '/pacotes':      ['dev', 'proprietario', 'administrativo'],
  '/pagamentos':   ['dev', 'proprietario', 'administrativo'],
  '/relatorios':   ['dev', 'proprietario', 'administrativo'],
  '/comunicados':   ['dev', 'proprietario', 'administrativo'],
  '/configuracoes': ['dev', 'proprietario'],
}

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const user = useStore(s => s.user)

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
