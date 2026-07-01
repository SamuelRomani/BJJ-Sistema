import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { formatCPF, formatCurrency, cn } from '@/lib/utils'
import {
  format, differenceInDays, parseISO, subDays, startOfMonth, endOfMonth,
  getDaysInMonth, isWithinInterval, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft, Edit2, Award, CreditCard, CheckSquare, Phone, Mail,
  Calendar, Flame, TrendingUp, Activity,
} from 'lucide-react'
import type { AlunoStatus } from '@/types'

const STATUS_COLOR: Record<AlunoStatus, string> = {
  ativo:    'bg-green-100 text-green-700',
  inativo:  'bg-gray-100 text-gray-600',
  suspenso: 'bg-red-100 text-red-700',
}

type Tab = 'resumo' | 'checkins' | 'pagamentos' | 'graduacoes'

// Gera array de datas dos últimos N dias (strings YYYY-MM-DD)
function lastNDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = subDays(today, n - 1 - i)
    return format(d, 'yyyy-MM-dd')
  })
}

// Organiza dias em semanas (colunas) para o heatmap
function buildHeatmapWeeks(days: string[], ciSet: Set<string>): { date: string; active: boolean }[][] {
  const weeks: { date: string; active: boolean }[][] = []
  let week: { date: string; active: boolean }[] = []
  days.forEach((d, i) => {
    week.push({ date: d, active: ciSet.has(d) })
    if ((i + 1) % 7 === 0) { weeks.push(week); week = [] }
  })
  if (week.length) {
    // Pad início da última semana incompleta
    weeks.push(week)
  }
  return weeks
}

export function PerfilAluno() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { alunos, mensalidades, checkIns, turmas, user } = useStore()
  const isProfessor = user?.role === 'professor'
  const [tab, setTab] = useState<Tab>('resumo')

  const aluno = alunos.find(a => a.id === id)
  if (!aluno) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Aluno não encontrado.</p>
      <Link to="/alunos" className="text-blue-600 text-sm mt-2 inline-block">← Voltar para alunos</Link>
    </div>
  )

  const mensalidadesAluno = mensalidades
    .filter(m => m.aluno_id === id)
    .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime())
  const totalPago     = mensalidadesAluno.filter(m => m.status === 'pago').reduce((s, m) => s + m.valor, 0)
  const totalAtrasado = mensalidadesAluno.filter(m => m.status === 'atrasado').reduce((s, m) => s + m.valor, 0)

  const checkInsAluno = checkIns
    .filter(c => c.aluno_id === id)
    .sort((a, b) => b.data.localeCompare(a.data))

  // Set de datas com check-in (para busca O(1))
  const ciDateSet = useMemo(() => new Set(checkInsAluno.map(c => c.data)), [checkInsAluno])

  // Estatísticas de frequência
  const hoje = new Date()
  const mesAtualStr = format(hoje, 'yyyy-MM')
  const ciMesAtual  = checkInsAluno.filter(c => c.data.startsWith(mesAtualStr))
  const diasNoMes   = getDaysInMonth(hoje)
  // Estima "aulas esperadas no mês" como ~4/semana (20 dias úteis aprox.)
  const aulasEsperadas = 20
  const presencaPercent = Math.min(100, Math.round((ciMesAtual.length / aulasEsperadas) * 100))

  // Streak atual (dias consecutivos com check-in, contando de hoje para trás)
  const streak = useMemo(() => {
    let s = 0
    const d = new Date()
    while (true) {
      if (ciDateSet.has(format(d, 'yyyy-MM-dd'))) { s++; d.setDate(d.getDate() - 1) }
      else break
    }
    return s
  }, [ciDateSet])

  // Maior streak histórico
  const melhorStreak = useMemo(() => {
    if (checkInsAluno.length === 0) return 0
    const sortedDates = [...ciDateSet].sort()
    let max = 1, cur = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = parseISO(sortedDates[i - 1])
      const curr = parseISO(sortedDates[i])
      if (differenceInDays(curr, prev) === 1) { cur++; if (cur > max) max = cur }
      else cur = 1
    }
    return max
  }, [checkInsAluno, ciDateSet])

  // Média de treinos/semana nos últimos 90 dias
  const mediaSemanal = useMemo(() => {
    const noventa = subDays(hoje, 90)
    const ciRecentes = checkInsAluno.filter(c => parseISO(c.data) >= noventa)
    return (ciRecentes.length / 13).toFixed(1) // 90 dias ≈ 13 semanas
  }, [checkInsAluno])

  // Heatmap dos últimos 84 dias (12 semanas)
  const heatmapDays = lastNDays(84)
  const heatmapWeeks = buildHeatmapWeeks(heatmapDays, ciDateSet)
  // Mês labels para o heatmap
  const heatmapMonths = useMemo(() => {
    const months: { label: string; col: number }[] = []
    heatmapDays.forEach((d, i) => {
      const day = parseInt(d.split('-')[2])
      if (day <= 7) {
        const col = Math.floor(i / 7)
        const label = format(parseISO(d), 'MMM', { locale: ptBR })
        if (!months.length || months[months.length - 1].label !== label) {
          months.push({ label, col })
        }
      }
    })
    return months
  }, [heatmapDays])

  // Check-ins agrupados por mês
  const checkInsPorMes: Record<string, typeof checkInsAluno> = {}
  checkInsAluno.forEach(c => {
    const mes = format(parseISO(c.data), 'MMMM yyyy', { locale: ptBR })
    if (!checkInsPorMes[mes]) checkInsPorMes[mes] = []
    checkInsPorMes[mes].push(c)
  })

  // Graduações
  const historicoOrdenado = [...aluno.historico_faixas].sort(
    (a, b) => new Date(a.data_promocao).getTime() - new Date(b.data_promocao).getTime()
  )
  const diasNaFaixaAtual = historicoOrdenado.length
    ? differenceInDays(new Date(), parseISO(historicoOrdenado[historicoOrdenado.length - 1].data_promocao))
    : differenceInDays(new Date(), parseISO(aluno.data_matricula))

  // Turma mais frequente
  const turmaMaisFrequente = useMemo(() => {
    const contagem: Record<string, number> = {}
    checkInsAluno.forEach(c => { contagem[c.turma_id] = (contagem[c.turma_id] ?? 0) + 1 })
    const top = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]
    return top ? turmas.find(t => t.id === top[0])?.nome ?? '—' : '—'
  }, [checkInsAluno, turmas])

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'resumo',     label: 'Resumo' },
    { key: 'checkins',   label: 'Frequência', count: checkInsAluno.length },
    ...(!isProfessor ? [{ key: 'pagamentos' as Tab, label: 'Pagamentos', count: mensalidadesAluno.length }] : []),
    { key: 'graduacoes', label: 'Graduações',  count: historicoOrdenado.length },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Perfil do Aluno</h1>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
              {aluno.nome.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{aluno.nome}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <a href={`mailto:${aluno.email}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                  <Mail size={13} /> {aluno.email}
                </a>
                <a href={`tel:${aluno.telefone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                  <Phone size={13} /> {aluno.telefone}
                </a>
                {aluno.telefone && (
                  <a
                    href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 px-2 py-0.5 rounded-full"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1">CPF: {formatCPF(aluno.cpf)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', STATUS_COLOR[aluno.status])}>
              {aluno.status.charAt(0).toUpperCase() + aluno.status.slice(1)}
            </span>
            <Link
              to={`/alunos/${aluno.id}/editar`}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-gray-700"
            >
              <Edit2 size={14} /> Editar
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Modalidade</p>
            <p className="font-semibold text-gray-900 mt-0.5">{aluno.modalidade_principal.nome}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Faixa Atual</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {aluno.graduacao_atual && (
                <div className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: aluno.graduacao_atual.cor_hex }} />
              )}
              <p className="font-semibold text-gray-900">{aluno.graduacao_atual?.nome ?? '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Dias na Faixa</p>
            <p className="font-semibold text-gray-900 mt-0.5">{diasNaFaixaAtual} dias</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Matrícula</p>
            <p className="font-semibold text-gray-900 mt-0.5">{format(parseISO(aluno.data_matricula), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── RESUMO ── */}
      {tab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-500" /> Últimos Check-ins
              </h3>
              <button onClick={() => setTab('checkins')} className="text-xs text-blue-600 hover:underline">
                Ver frequência →
              </button>
            </div>
            {checkInsAluno.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Nenhum check-in registrado</p>
            ) : (
              <div className="space-y-2">
                {checkInsAluno.slice(0, 5).map(c => {
                  const turma = turmas.find(t => t.id === c.turma_id)
                  return (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-sm text-gray-700">{turma?.nome ?? '—'}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(parseISO(c.data), "dd 'de' MMM", { locale: ptBR })} · {c.hora_checkin}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {!isProfessor && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-green-500" /> Financeiro
                </h3>
                <button onClick={() => setTab('pagamentos')} className="text-xs text-blue-600 hover:underline">
                  Ver todos →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600">Total Pago</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(totalPago)}</p>
                </div>
                <div className={cn('rounded-lg p-3', totalAtrasado > 0 ? 'bg-red-50' : 'bg-gray-50')}>
                  <p className={cn('text-xs', totalAtrasado > 0 ? 'text-red-600' : 'text-gray-500')}>Em Atraso</p>
                  <p className={cn('text-lg font-bold', totalAtrasado > 0 ? 'text-red-700' : 'text-gray-400')}>
                    {formatCurrency(totalAtrasado)}
                  </p>
                </div>
              </div>
              {mensalidadesAluno.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{formatCurrency(m.valor)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Venc. {format(parseISO(m.vencimento), 'dd/MM/yy')}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                      'bg-green-100 text-green-700': m.status === 'pago',
                      'bg-red-100 text-red-700': m.status === 'atrasado',
                      'bg-yellow-100 text-yellow-700': m.status === 'pendente',
                      'bg-gray-100 text-gray-500': m.status === 'cancelado',
                    })}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FREQUÊNCIA ── */}
      {tab === 'checkins' && (
        <div className="space-y-5">
          {/* KPIs de frequência */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-blue-500" />
                <p className="text-xs text-gray-500">Total de Treinos</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{checkInsAluno.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-green-500" />
                <p className="text-xs text-gray-500">Presença Mensal</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{ciMesAtual.length}<span className="text-sm font-normal text-gray-400"> aulas</span></p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${presencaPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{presencaPercent}% da meta mensal</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={14} className={streak > 0 ? 'text-orange-500' : 'text-gray-300'} />
                <p className="text-xs text-gray-500">Sequência Atual</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {streak}<span className="text-sm font-normal text-gray-400"> dias</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Melhor: {melhorStreak} dias</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-purple-500" />
                <p className="text-xs text-gray-500">Turma Preferida</p>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{turmaMaisFrequente}</p>
              <p className="text-xs text-gray-400 mt-1">{mediaSemanal}/semana (90d)</p>
            </div>
          </div>

          {/* Heatmap — últimas 12 semanas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Calendário de Treinos — Últimas 12 Semanas</h3>
            <div className="overflow-x-auto">
              <div className="inline-block">
                {/* Labels de mês */}
                <div className="flex gap-1 mb-1 pl-6">
                  {(() => {
                    const cols = heatmapWeeks.length
                    return heatmapMonths.map((m, i) => (
                      <div
                        key={i}
                        className="text-xs text-gray-400 capitalize"
                        style={{
                          width: `${(i < heatmapMonths.length - 1
                            ? heatmapMonths[i + 1].col - m.col
                            : cols - m.col) * 16}px`,
                        }}
                      >
                        {m.label}
                      </div>
                    ))
                  })()}
                </div>
                <div className="flex gap-1">
                  {/* Labels de dia da semana */}
                  <div className="flex flex-col gap-1 mr-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                      <div key={i} className="h-3 text-xs text-gray-300 leading-3 w-5 text-right pr-1">
                        {i % 2 === 1 ? d.slice(0, 1) : ''}
                      </div>
                    ))}
                  </div>
                  {heatmapWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          title={`${day.date}${day.active ? ' ✓ treino' : ''}`}
                          className={cn(
                            'w-3 h-3 rounded-sm transition-colors',
                            day.active
                              ? 'bg-blue-500'
                              : 'bg-gray-100 hover:bg-gray-200'
                          )}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-xs text-gray-400">Menos</span>
                  <div className="w-3 h-3 rounded-sm bg-gray-100" />
                  <div className="w-3 h-3 rounded-sm bg-blue-200" />
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-xs text-gray-400">Mais</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico mensal */}
          {checkInsAluno.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Nenhum check-in registrado ainda.</p>
            </div>
          ) : (
            Object.entries(checkInsPorMes).map(([mes, cis]) => (
              <div key={mes} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 capitalize">{mes}</span>
                  <span className="text-xs text-gray-400">{cis.length} treino{cis.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cis.map(c => {
                    const turma = turmas.find(t => t.id === c.turma_id)
                    return (
                      <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <CheckSquare size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{turma?.nome ?? '—'}</p>
                            <p className="text-xs text-gray-400">{turma?.modalidade.nome}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-700">
                            {format(parseISO(c.data), "EEEE, dd 'de' MMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-400">{c.hora_checkin}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PAGAMENTOS ── */}
      {tab === 'pagamentos' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Histórico de Pagamentos</h3>
            <Link to="/pagamentos" className="text-xs text-blue-600 hover:underline">Ir para Pagamentos →</Link>
          </div>
          {mensalidadesAluno.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">Nenhum pagamento registrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Vencimento</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Pagamento</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Método</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {mensalidadesAluno.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(m.valor)}</td>
                    <td className="px-5 py-3 text-gray-600">{format(parseISO(m.vencimento), 'dd/MM/yyyy')}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {m.data_pagamento ? format(parseISO(m.data_pagamento), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 uppercase text-xs">{m.metodo ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', {
                        'bg-green-100 text-green-700': m.status === 'pago',
                        'bg-red-100 text-red-700': m.status === 'atrasado',
                        'bg-yellow-100 text-yellow-700': m.status === 'pendente',
                        'bg-gray-100 text-gray-500': m.status === 'cancelado',
                      })}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── GRADUAÇÕES ── */}
      {tab === 'graduacoes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Histórico de Graduações
            </h3>
            <Link to={`/graduacoes?aluno=${aluno.id}`} className="text-xs text-blue-600 hover:underline">
              + Promover
            </Link>
          </div>

          {historicoOrdenado.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhuma graduação registrada</p>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-5">
                {[...historicoOrdenado].reverse().map((hist, idx) => {
                  const proxima = historicoOrdenado[historicoOrdenado.length - 1 - idx + 1]
                  const fim = proxima ? parseISO(proxima.data_promocao) : new Date()
                  const dias = differenceInDays(fim, parseISO(hist.data_promocao))
                  const isAtual = idx === 0

                  return (
                    <div key={hist.id} className="flex items-start gap-4 relative">
                      <div
                        className="w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 z-10"
                        style={{ backgroundColor: hist.graduacao.cor_hex }}
                      />
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{hist.graduacao.nome}</p>
                          {isAtual && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Atual</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(parseISO(hist.data_promocao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{dias} dias nesta faixa</p>
                        {hist.observacoes && (
                          <p className="text-xs text-gray-500 italic mt-1">"{hist.observacoes}"</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
