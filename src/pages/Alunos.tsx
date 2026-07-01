import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Search, Plus, Eye, Edit2, Users, ChevronUp, ChevronDown, LayoutGrid, List } from 'lucide-react'
import type { AlunoStatus } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatGraduacao } from '@/lib/utils'

const STATUS_CONFIG: Record<AlunoStatus, { label: string; cls: string }> = {
  ativo:    { label: 'Ativo',    cls: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  inativo:  { label: 'Inativo',  cls: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
}

type SortField = 'nome' | 'data_matricula' | 'status'
type ViewMode = 'table' | 'grid'

export function Alunos() {
  const { alunos: todosAlunos, academiaAtualId } = useStore()
  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<AlunoStatus | 'todos'>('todos')
  const [filtroModalidade, setFiltroModalidade] = useState('todos')
  const [sort, setSort] = useState<{ field: SortField; dir: 'asc' | 'desc' }>({ field: 'nome', dir: 'asc' })
  const [view, setView] = useState<ViewMode>('table')

  const modalidades = [...new Set(alunos.map(a => a.modalidade_principal.nome))].sort()

  const filtrados = alunos
    .filter(a => {
      const q = busca.toLowerCase()
      const matchBusca = !busca || a.nome.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) || a.cpf.includes(busca.replace(/\D/g, ''))
      const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus
      const matchMod = filtroModalidade === 'todos' || a.modalidade_principal.nome === filtroModalidade
      return matchBusca && matchStatus && matchMod
    })
    .sort((a, b) => {
      let va = '', vb = ''
      if (sort.field === 'nome') { va = a.nome; vb = b.nome }
      else if (sort.field === 'data_matricula') { va = a.data_matricula; vb = b.data_matricula }
      else if (sort.field === 'status') { va = a.status; vb = b.status }
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function toggleSort(field: SortField) {
    setSort(s => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' })
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <ChevronUp size={12} className="text-gray-300" />
    return sort.dir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  const counts = {
    todos: alunos.length,
    ativo: alunos.filter(a => a.status === 'ativo').length,
    inativo: alunos.filter(a => a.status === 'inativo').length,
    suspenso: alunos.filter(a => a.status === 'suspenso').length,
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 text-sm">{alunos.length} cadastrados · {counts.ativo} ativos</p>
        </div>
        <Link
          to="/alunos/novo"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200"
        >
          <Plus size={16} /> Novo Aluno
        </Link>
      </div>

      {/* Barra de busca + view toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Buscar por nome, email ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >✕</button>
          )}
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <Tooltip content="Tabela">
            <button
              onClick={() => setView('table')}
              className={cn('p-2.5 transition-colors', view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <List size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Cards">
            <button
              onClick={() => setView('grid')}
              className={cn('p-2.5 transition-colors', view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <LayoutGrid size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Chips de filtro */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        {(['todos', 'ativo', 'inativo', 'suspenso'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filtroStatus === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            )}
          >
            {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label}
            <span className={cn('ml-1.5 font-bold', filtroStatus === s ? 'text-blue-200' : 'text-gray-400')}>
              {counts[s]}
            </span>
          </button>
        ))}

        {/* Divisor */}
        {modalidades.length > 0 && <div className="w-px bg-gray-200 self-stretch mx-1" />}

        {/* Modalidades */}
        {modalidades.map(m => (
          <button
            key={m}
            onClick={() => setFiltroModalidade(f => f === m ? 'todos' : m)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filtroModalidade === m
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400'
            )}
          >
            {m}
          </button>
        ))}

        {/* Limpar filtros */}
        {(filtroStatus !== 'todos' || filtroModalidade !== 'todos' || busca) && (
          <button
            onClick={() => { setFiltroStatus('todos'); setFiltroModalidade('todos'); setBusca('') }}
            className="px-3 py-1.5 rounded-full text-xs text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Conteúdo */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200">
          <EmptyState
            icon={Users}
            title={busca || filtroStatus !== 'todos' || filtroModalidade !== 'todos'
              ? 'Nenhum aluno encontrado'
              : 'Nenhum aluno cadastrado ainda'}
            description={busca || filtroStatus !== 'todos' || filtroModalidade !== 'todos'
              ? 'Tente ajustar os filtros ou a busca.'
              : 'Comece cadastrando o primeiro aluno da academia.'}
            action={
              !busca && filtroStatus === 'todos' && filtroModalidade === 'todos' ? (
                <Link to="/alunos/novo" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Plus size={15} /> Cadastrar Aluno
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : view === 'table' ? (
        /* ── TABELA ── */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => toggleSort('nome')}
                      className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
                    >
                      Aluno <SortIcon field="nome" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Modalidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Graduação</th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => toggleSort('status')}
                      className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
                    >
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => toggleSort('data_matricula')}
                      className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 hidden lg:flex"
                    >
                      Matrícula <SortIcon field="data_matricula" />
                    </button>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map(aluno => (
                  <tr key={aluno.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nome={aluno.nome} foto_url={aluno.foto_url} size="md" />
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{aluno.nome}</p>
                          <p className="text-xs text-gray-400">{aluno.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {aluno.modalidade_principal.nome}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {aluno.graduacao_atual ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: aluno.graduacao_atual.cor_hex }} />
                          <span className="text-gray-700 text-xs">{formatGraduacao(aluno.graduacao_atual.nome, aluno.grau_atual)}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[aluno.status].cls)}>
                        {STATUS_CONFIG[aluno.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {aluno.data_matricula.split('-').reverse().join('/')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Tooltip content="Ver perfil">
                          <Link to={`/alunos/${aluno.id}`} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition-colors">
                            <Eye size={15} />
                          </Link>
                        </Tooltip>
                        <Tooltip content="Editar">
                          <Link to={`/alunos/${aluno.id}/editar`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Edit2 size={15} />
                          </Link>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Exibindo {filtrados.length} de {alunos.length} alunos</span>
            {filtrados.length !== alunos.length && (
              <button onClick={() => { setFiltroStatus('todos'); setFiltroModalidade('todos'); setBusca('') }} className="text-blue-500 hover:underline">
                Ver todos
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── GRID DE CARDS ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map(aluno => (
            <Link
              key={aluno.id}
              to={`/alunos/${aluno.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Avatar nome={aluno.nome} foto_url={aluno.foto_url} size="lg" />
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CONFIG[aluno.status].cls)}>
                  {STATUS_CONFIG[aluno.status].label}
                </span>
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{aluno.nome}</p>
              <p className="text-xs text-gray-400 truncate">{aluno.modalidade_principal.nome}</p>
              {aluno.graduacao_atual && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: aluno.graduacao_atual.cor_hex }} />
                  <span className="text-xs text-gray-500">{formatGraduacao(aluno.graduacao_atual.nome, aluno.grau_atual)}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
