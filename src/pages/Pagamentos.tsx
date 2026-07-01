import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { formatCurrency, cn } from '@/lib/utils'
import { format, differenceInDays, isAfter, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle2, Clock, AlertCircle, DollarSign, Plus, X,
  TrendingUp, TrendingDown, Zap, ChevronDown, MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PagamentoMetodo, PagamentoStatus, Mensalidade } from '@/types'

const STATUS_CONFIG: Record<PagamentoStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pago:      { label: 'Pago',      icon: CheckCircle2, color: 'text-green-700',  bg: 'bg-green-100' },
  pendente:  { label: 'Pendente',  icon: Clock,        color: 'text-yellow-700', bg: 'bg-yellow-100' },
  atrasado:  { label: 'Atrasado',  icon: AlertCircle,  color: 'text-red-700',    bg: 'bg-red-100' },
  cancelado: { label: 'Cancelado', icon: AlertCircle,  color: 'text-gray-500',   bg: 'bg-gray-100' },
}

const METODOS: { value: PagamentoMetodo; label: string }[] = [
  { value: 'pix',      label: 'PIX' },
  { value: 'cartao',   label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'boleto',   label: 'Boleto' },
]

export function Pagamentos() {
  const {
    mensalidades: todasMensalidades, alunos: todosAlunos,
    turmas: todasTurmas, updateMensalidade, addMensalidade, academiaAtualId, pacotes,
  } = useStore()

  const turmas  = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const alunos  = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const turmaIds = new Set(turmas.map(t => t.id))
  const mensalidades = todasMensalidades.filter(m => turmaIds.has(m.turma_id))

  const [filtroStatus, setFiltroStatus] = useState<PagamentoStatus | 'todos'>('todos')
  const [buscaNome, setBuscaNome] = useState('')
  const [registrandoId, setRegistrandoId] = useState<string | null>(null)
  const [metodo, setMetodo] = useState<PagamentoMetodo>('pix')
  const [showNovo, setShowNovo] = useState(false)
  const [showLote, setShowLote] = useState(false)
  const [novoForm, setNovoForm] = useState({ aluno_id: '', turma_id: '', valor: '', vencimento: '' })

  // Mes da cobrança em lote
  const [mesLote, setMesLote] = useState(() => {
    const d = addMonths(new Date(), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [diaVencimento, setDiaVencimento] = useState('10')
  const [metodoPadrao, setMetodoPadrao] = useState<PagamentoMetodo>('pix')

  // Auto-mark atrasado
  const hoje = new Date()
  mensalidades.forEach(m => {
    if (m.status === 'pendente' && isAfter(hoje, parseISO(m.vencimento))) {
      updateMensalidade(m.id, { status: 'atrasado' })
    }
  })

  const filtradas = useMemo(() => mensalidades
    .filter(m => {
      const aluno = alunos.find(a => a.id === m.aluno_id)
      const matchStatus = filtroStatus === 'todos' || m.status === filtroStatus
      const matchNome = !buscaNome || aluno?.nome.toLowerCase().includes(buscaNome.toLowerCase())
      return matchStatus && matchNome
    })
    .sort((a, b) => {
      if (a.status === 'atrasado' && b.status !== 'atrasado') return -1
      if (b.status === 'atrasado' && a.status !== 'atrasado') return 1
      return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
    }), [mensalidades, filtroStatus, buscaNome, alunos])

  const totais = {
    pago:     mensalidades.filter(m => m.status === 'pago').reduce((s, m) => s + m.valor, 0),
    pendente: mensalidades.filter(m => m.status === 'pendente').reduce((s, m) => s + m.valor, 0),
    atrasado: mensalidades.filter(m => m.status === 'atrasado').reduce((s, m) => s + m.valor, 0),
  }

  const countPorStatus = (s: PagamentoStatus | 'todos') =>
    s === 'todos' ? mensalidades.length : mensalidades.filter(m => m.status === s).length

  // Preview cobrança em lote
  const previewLote = useMemo(() => {
    if (!mesLote) return []
    const [ano, mes] = mesLote.split('-').map(Number)
    const dia = parseInt(diaVencimento) || 10
    const vencimento = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

    return alunos
      .filter(a => a.status === 'ativo' && a.pacote_id)
      .map(a => {
        const pacote = pacotes.find(p => p.id === a.pacote_id)
        // Verifica se já existe mensalidade para esse aluno no mês
        const jaExiste = mensalidades.some(m =>
          m.aluno_id === a.id &&
          m.vencimento.startsWith(`${ano}-${String(mes).padStart(2, '0')}`) &&
          m.status !== 'cancelado'
        )
        // Encontra turma principal do aluno
        const turmaAluno = turmas.find(t => t.ativa)
        return { aluno: a, pacote, vencimento, jaExiste, turma: turmaAluno }
      })
      .filter(e => e.pacote && !e.jaExiste)
  }, [alunos, mensalidades, mesLote, diaVencimento, pacotes, turmas])

  function gerarCobrancasLote() {
    if (previewLote.length === 0) {
      toast.info('Nenhuma cobrança a gerar para este mês.')
      return
    }
    const turmaFallback = turmas[0]
    previewLote.forEach(({ aluno, pacote, vencimento, turma }) => {
      if (!pacote) return
      addMensalidade({
        id: crypto.randomUUID(),
        turma_id: (turma ?? turmaFallback)?.id ?? '',
        aluno_id: aluno.id,
        valor: pacote.valor,
        vencimento,
        status: 'pendente',
      })
    })
    toast.success(`${previewLote.length} cobranças geradas para ${format(new Date(mesLote + '-01'), 'MMMM yyyy', { locale: ptBR })}!`)
    setShowLote(false)
  }

  function registrarPagamento(id: string) {
    updateMensalidade(id, {
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
      metodo,
    })
    setRegistrandoId(null)
    toast.success('Pagamento registrado com sucesso!')
  }

  function criarMensalidade() {
    if (!novoForm.aluno_id || !novoForm.turma_id || !novoForm.valor || !novoForm.vencimento) {
      toast.error('Preencha todos os campos')
      return
    }
    addMensalidade({
      id: crypto.randomUUID(),
      turma_id: novoForm.turma_id,
      aluno_id: novoForm.aluno_id,
      valor: parseFloat(novoForm.valor),
      vencimento: novoForm.vencimento,
      status: 'pendente',
    })
    setShowNovo(false)
    setNovoForm({ aluno_id: '', turma_id: '', valor: '', vencimento: '' })
    toast.success('Mensalidade criada!')
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-500 text-sm">Controle de mensalidades da academia</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowLote(o => !o); setShowNovo(false) }}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors"
          >
            <Zap size={15} /> Cobranças em Lote
          </button>
          <button
            onClick={() => { setShowNovo(o => !o); setShowLote(false) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nova Mensalidade
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <TrendingUp size={20} className="text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Recebido</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(totais.pago)}</p>
            <p className="text-xs text-gray-400">{countPorStatus('pago')} pagamentos</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Clock size={20} className="text-yellow-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">A Vencer</p>
            <p className="text-xl font-bold text-yellow-700">{formatCurrency(totais.pendente)}</p>
            <p className="text-xs text-gray-400">{countPorStatus('pendente')} mensalidades</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <TrendingDown size={20} className="text-red-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Em Atraso</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totais.atrasado)}</p>
            <p className="text-xs text-gray-400">{countPorStatus('atrasado')} mensalidades</p>
          </div>
        </div>
      </div>

      {/* ── COBRANÇAS EM LOTE ── */}
      {showLote && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> Gerar Cobranças em Lote
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cria mensalidades para todos os alunos ativos com plano, que ainda não têm cobrança no mês selecionado.
              </p>
            </div>
            <button onClick={() => setShowLote(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mês de referência</label>
              <input
                type="month"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={mesLote}
                onChange={e => setMesLote(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dia de vencimento</label>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={diaVencimento}
                onChange={e => setDiaVencimento(e.target.value)}
              >
                {[5, 10, 15, 20, 25].map(d => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                Preview — {previewLote.length} cobrança{previewLote.length !== 1 ? 's' : ''} a gerar
              </span>
              <span className="text-sm font-bold text-blue-600">
                Total: {formatCurrency(previewLote.reduce((s, e) => s + (e.pacote?.valor ?? 0), 0))}
              </span>
            </div>
            {previewLote.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                Todos os alunos já têm cobrança para este mês, ou não há alunos com plano ativo.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                {previewLote.map(({ aluno, pacote, vencimento }) => (
                  <div key={aluno.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {aluno.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                        <p className="text-xs text-gray-400">{pacote?.nome}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(pacote?.valor ?? 0)}</p>
                      <p className="text-xs text-gray-400">Venc. {vencimento.split('-').reverse().join('/')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowLote(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={gerarCobrancasLote}
              disabled={previewLote.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              <Zap size={15} /> Gerar {previewLote.length} cobrança{previewLote.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Formulário nova mensalidade */}
      {showNovo && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Nova Mensalidade</h2>
            <button onClick={() => setShowNovo(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Aluno *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={novoForm.aluno_id}
                onChange={e => {
                  const alunoId = e.target.value
                  const a = alunos.find(x => x.id === alunoId)
                  setNovoForm(f => ({ ...f, aluno_id: alunoId, valor: a?.pacote?.valor ? String(a.pacote.valor) : f.valor }))
                }}
              >
                <option value="">Selecionar...</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              {novoForm.aluno_id && (() => {
                const a = alunos.find(x => x.id === novoForm.aluno_id)
                return a?.pacote ? <p className="text-xs text-blue-500 mt-0.5">{a.pacote.nome}</p> : null
              })()}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Turma *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={novoForm.turma_id}
                onChange={e => setNovoForm(f => ({ ...f, turma_id: e.target.value }))}
              >
                <option value="">Selecionar...</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Valor (R$) *</label>
              <input
                type="number" min="0" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={novoForm.valor}
                onChange={e => setNovoForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="180,00"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Vencimento *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={novoForm.vencimento}
                onChange={e => setNovoForm(f => ({ ...f, vencimento: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNovo(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={criarMensalidade} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">Criar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {(['todos', 'pendente', 'atrasado', 'pago', 'cancelado'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filtroStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label}
              <span className="ml-1 opacity-50">({countPorStatus(s)})</span>
            </button>
          ))}
        </div>
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          placeholder="Buscar por aluno..."
          value={buscaNome}
          onChange={e => setBuscaNome(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Aluno</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Turma</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vencimento</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhuma mensalidade encontrada</td></tr>
              ) : filtradas.map(m => {
                const aluno = alunos.find(a => a.id === m.aluno_id)
                const turma = turmas.find(t => t.id === m.turma_id)
                const cfg = STATUS_CONFIG[m.status]
                const StatusIcon = cfg.icon
                const diasAtraso = m.status === 'atrasado' ? differenceInDays(new Date(), parseISO(m.vencimento)) : 0

                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {aluno?.nome.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{aluno?.nome ?? '—'}</p>
                          <p className="text-xs text-gray-400 hidden sm:block">{aluno?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm hidden sm:table-cell">{turma?.nome ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(m.valor)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(parseISO(m.vencimento), 'dd/MM/yy')}
                      {diasAtraso > 0 && <p className="text-xs text-red-500 font-medium">{diasAtraso}d atraso</p>}
                      {m.data_pagamento && <p className="text-xs text-green-600">Pago {format(parseISO(m.data_pagamento), 'dd/MM/yy')}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color, cfg.bg)}>
                        <StatusIcon size={11} />
                        {cfg.label}
                        {m.metodo && m.status === 'pago' && <span className="opacity-60">· {m.metodo.toUpperCase()}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(m.status === 'pendente' || m.status === 'atrasado') && (
                          registrandoId === m.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
                                value={metodo}
                                onChange={e => setMetodo(e.target.value as PagamentoMetodo)}
                              >
                                {METODOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                              </select>
                              <button onClick={() => registrarPagamento(m.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 font-medium">✓</button>
                              <button onClick={() => setRegistrandoId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRegistrandoId(m.id)}
                              className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 font-medium"
                            >
                              <DollarSign size={11} className="inline" /> Pagar
                            </button>
                          )
                        )}
                        {(m.status === 'pendente' || m.status === 'atrasado') && aluno?.telefone && (
                          <a
                            href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${aluno.nome}! Sua mensalidade de ${formatCurrency(m.valor)} vence em ${format(parseISO(m.vencimento), 'dd/MM/yyyy')}. Por favor, regularize seu pagamento.`)}`}
                            target="_blank" rel="noreferrer"
                            title="Cobrar via WhatsApp"
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtradas.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>Exibindo {filtradas.length} de {mensalidades.length} mensalidades</span>
            {filtroStatus !== 'todos' && (
              <button onClick={() => setFiltroStatus('todos')} className="text-blue-500 hover:underline">Ver todos</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
