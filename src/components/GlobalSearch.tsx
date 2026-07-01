import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Search, Users, Dumbbell, LayoutDashboard, Award, CreditCard, BarChart2, Settings, Package, QrCode, X } from 'lucide-react'

type Result = {
  id: string
  label: string
  sublabel?: string
  icon: React.ElementType
  href: string
  category: string
}

const PAGES: Result[] = [
  { id: 'p-dashboard',    label: 'Dashboard',    icon: LayoutDashboard, href: '/dashboard',    category: 'Página', sublabel: 'Visão geral' },
  { id: 'p-alunos',       label: 'Alunos',       icon: Users,            href: '/alunos',       category: 'Página', sublabel: 'Gerenciar alunos' },
  { id: 'p-turmas',       label: 'Turmas',       icon: Dumbbell,         href: '/turmas',       category: 'Página', sublabel: 'Horários e turmas' },
  { id: 'p-checkin',      label: 'Check-in',     icon: QrCode,           href: '/checkin',      category: 'Página', sublabel: 'Controle de presença' },
  { id: 'p-graduacoes',   label: 'Graduações',   icon: Award,            href: '/graduacoes',   category: 'Página', sublabel: 'Faixas e graus' },
  { id: 'p-pacotes',      label: 'Pacotes',      icon: Package,          href: '/pacotes',      category: 'Página', sublabel: 'Planos e mensalidades' },
  { id: 'p-pagamentos',   label: 'Pagamentos',   icon: CreditCard,       href: '/pagamentos',   category: 'Página', sublabel: 'Financeiro' },
  { id: 'p-relatorios',   label: 'Relatórios',   icon: BarChart2,        href: '/relatorios',   category: 'Página', sublabel: 'Análises e exportações' },
  { id: 'p-config',       label: 'Configurações',icon: Settings,         href: '/configuracoes',category: 'Página', sublabel: 'Dados da academia' },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { alunos: todosAlunos, turmas: todasTurmas, academiaAtualId } = useStore()

  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onEvent() { setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-global-search', onEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-global-search', onEvent)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim()
    if (!q) return PAGES.slice(0, 6)

    const out: Result[] = []

    // Alunos
    alunos.filter(a => a.nome.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(a => out.push({
        id: `a-${a.id}`,
        label: a.nome,
        sublabel: a.email,
        icon: Users,
        href: `/alunos/${a.id}`,
        category: 'Aluno',
      }))

    // Turmas
    turmas.filter(t => t.nome.toLowerCase().includes(q) || t.modalidade.nome.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(t => out.push({
        id: `t-${t.id}`,
        label: t.nome,
        sublabel: t.modalidade.nome,
        icon: Dumbbell,
        href: `/turmas`,
        category: 'Turma',
      }))

    // Páginas
    PAGES.filter(p => p.label.toLowerCase().includes(q) || (p.sublabel ?? '').toLowerCase().includes(q))
      .forEach(p => out.push(p))

    return out
  }, [query, alunos, turmas])

  useEffect(() => { setSelected(0) }, [results])

  function go(result: Result) {
    navigate(result.href)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected])
  }

  if (!open) return null

  const byCategory = results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar alunos, turmas, páginas..."
            className="flex-1 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-400 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] bg-gray-100 dark:bg-slate-700 dark:text-slate-400 border border-gray-200 dark:border-slate-600 px-1.5 py-0.5 rounded font-mono text-gray-500">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-8">Nenhum resultado encontrado</p>
          ) : (
            Object.entries(byCategory).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 px-4 pt-3 pb-1">{category}</p>
                {items.map(result => {
                  const idx = globalIdx++
                  const Icon = result.icon
                  return (
                    <button
                      key={result.id}
                      onClick={() => go(result)}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        selected === idx ? 'bg-blue-50 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-750'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        selected === idx ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                      )}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{result.label}</p>
                        {result.sublabel && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{result.sublabel}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 rounded font-mono">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 rounded font-mono">↵</kbd> abrir</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 rounded font-mono">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}
