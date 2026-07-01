import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, ROUTE_ROLES } from './components/auth/ProtectedRoute'
import { AuthProvider } from './components/auth/AuthProvider'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Alunos } from './pages/Alunos'
import { NovoAluno } from './pages/NovoAluno'
import { PerfilAluno } from './pages/PerfilAluno'
import { Turmas } from './pages/Turmas'
import { CheckIn } from './pages/CheckIn'
import { Graduacoes } from './pages/Graduacoes'
import { Pagamentos } from './pages/Pagamentos'
import { Pacotes } from './pages/Pacotes'
import { Relatorios } from './pages/Relatorios'
import { Configuracoes } from './pages/Configuracoes'
import { NovaTurma } from './pages/NovaTurma'
import { Comunicados } from './pages/Comunicados'

function PR({ path, children }: { path: string; children: React.ReactNode }) {
  return <ProtectedRoute roles={ROUTE_ROLES[path]}>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<PR path="/dashboard"><Dashboard /></PR>} />
          <Route path="alunos"       element={<PR path="/alunos"><Alunos /></PR>} />
          <Route path="alunos/novo"  element={<PR path="/alunos"><NovoAluno /></PR>} />
          <Route path="alunos/:id"   element={<PR path="/alunos"><PerfilAluno /></PR>} />
          <Route path="alunos/:id/editar" element={<PR path="/alunos"><NovoAluno /></PR>} />
          <Route path="turmas"       element={<PR path="/turmas"><Turmas /></PR>} />
          <Route path="turmas/nova"  element={<PR path="/turmas"><NovaTurma /></PR>} />
          <Route path="turmas/:id/editar" element={<PR path="/turmas"><NovaTurma /></PR>} />
          <Route path="checkin"      element={<PR path="/checkin"><CheckIn /></PR>} />
          <Route path="graduacoes"   element={<PR path="/graduacoes"><Graduacoes /></PR>} />
          <Route path="pacotes"      element={<PR path="/pacotes"><Pacotes /></PR>} />
          <Route path="pagamentos"   element={<PR path="/pagamentos"><Pagamentos /></PR>} />
          <Route path="relatorios"   element={<PR path="/relatorios"><Relatorios /></PR>} />
          <Route path="comunicados"   element={<PR path="/comunicados"><Comunicados /></PR>} />
          <Route path="configuracoes" element={<PR path="/configuracoes"><Configuracoes /></PR>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
