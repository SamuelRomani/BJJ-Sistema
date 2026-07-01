import { Menu, Bell, Building2, ChevronDown, LogOut, Moon, Sun, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useStore } from '@/store/useStore'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'
import { NotificacoesPanel } from './NotificacoesPanel'
import { supabase } from '@/lib/supabase'

export function Header() {
  const { user, logout, sidebarOpen, setSidebarOpen, academias, academiaAtualId, setAcademiaAtual,
          alunos: todosAlunos, mensalidades: todasMensalidades, turmas: todasTurmas,
          darkMode, toggleDarkMode } = useStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Contagem de alertas para o sino
  const hoje = new Date()
  const turmaIds = new Set(todasTurmas.filter(t => t.academia_id === academiaAtualId).map(t => t.id))
  const alunosAcademia = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const mensalidadesAcademia = todasMensalidades.filter(m => turmaIds.has(m.turma_id))
  const alertCount = (() => {
    const vencendo = mensalidadesAcademia.filter(m => {
      if (m.status !== 'pendente') return false
      const d = differenceInDays(parseISO(m.vencimento), hoje)
      return d >= 0 && d <= 7
    }).length
    const graves = alunosAcademia.filter(a => {
      const maxDias = Math.max(0, ...mensalidadesAcademia
        .filter(m => m.aluno_id === a.id && m.status === 'atrasado')
        .map(m => differenceInDays(hoje, parseISO(m.vencimento))))
      return maxDias > 15
    }).length
    const suspensos = alunosAcademia.filter(a => a.status === 'suspenso').length
    return vencendo + graves + suspensos
  })()

  const isDev = user?.role === 'dev'
  const academiaAtual = academias.find(a => a.id === academiaAtualId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 gap-4 shrink-0 z-10">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Menu size={20} />
      </button>

      {/* Seletor de academia — só visível para dev */}
      {isDev && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Building2 size={15} className="text-blue-500" />
            <span>{academiaAtual?.nome ?? 'Selecionar academia'}</span>
            <ChevronDown size={14} className={cn('transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">
                Academias cadastradas
              </p>
              {academias.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAcademiaAtual(a.id); setDropdownOpen(false) }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors',
                    a.id === academiaAtualId && 'bg-blue-50'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: a.tema.cor_primaria }}
                  >
                    {a.nome.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', a.id === academiaAtualId ? 'text-blue-700' : 'text-gray-900')}>
                      {a.nome}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{a.cidade}, {a.estado}</p>
                  </div>
                  {a.id === academiaAtualId && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Busca global */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 dark:bg-slate-700 dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      >
        <Search size={14} />
        <span>Buscar...</span>
        <kbd className="text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* Badge dev */}
      {isDev && (
        <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          🛠 Dev
        </span>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        title={darkMode ? 'Modo claro' : 'Modo escuro'}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-slate-400"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>
        {notifOpen && <NotificacoesPanel onClose={() => setNotifOpen(false)} />}
      </div>

      <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        {user && <Avatar nome={user.nome} size="md" />}
        <button
          onClick={async () => { await supabase.auth.signOut(); logout() }}
          title="Sair"
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
