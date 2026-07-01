import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { formatCurrency, cn } from '@/lib/utils'
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Phone, Mail, Download, MessageCircle, TrendingUp, Users, DollarSign, BarChart2, Activity, FileDown, UserX, Flame } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import jsPDF from 'jspdf'

type Tab = 'inadimplencia' | 'receita' | 'frequencia' | 'progressao' | 'churn'

const CORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export function Relatorios() {
  const [tab, setTab] = useState<Tab>('receita')
  const { alunos: todosAlunos, mensalidades: todasMensalidades, turmas: todasTurmas, checkIns, academiaAtualId, academias } = useStore()
  const [alunoProgressao, setAlunoProgressao] = useState('')

  const academia = academias.find(a => a.id === academiaAtualId)
  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const turmaIds = new Set(turmas.map(t => t.id))
  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const mensalidades = todasMensalidades.filter(m => turmaIds.has(m.turma_id))

  // ── INADIMPLÊNCIA ─────────────────────────────────────────
  const inadimplentes = useMemo(() => alunos
    .map(aluno => {
      const atrasadas = mensalidades.filter(m => m.aluno_id === aluno.id && m.status === 'atrasado')
      if (!atrasadas.length) return null
      const total = atrasadas.reduce((s, m) => s + m.valor, 0)
      const diasAtraso = Math.max(...atrasadas.map(m => differenceInDays(new Date(), new Date(m.vencimento))))
      return { aluno, total, diasAtraso, qtd: atrasadas.length }
    })
    .filter(Boolean)
    .sort((a, b) => b!.diasAtraso - a!.diasAtraso) as Array<{ aluno: typeof alunos[0]; total: number; diasAtraso: number; qtd: number }>
  , [alunos, mensalidades])

  // ── RECEITA ───────────────────────────────────────────────
  const receitaData = useMemo(() => {
    const now = new Date()
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const key = format(d, 'yyyy-MM')
      const label = format(d, 'MMM/yy', { locale: ptBR })
      const inicio = startOfMonth(d)
      const fim = endOfMonth(d)
      const pagas = mensalidades
        .filter(m => m.status === 'pago' && m.data_pagamento && isWithinInterval(parseISO(m.data_pagamento), { start: inicio, end: fim }))
      const pendentes = mensalidades
        .filter(m => m.status === 'pendente' && isWithinInterval(parseISO(m.vencimento), { start: inicio, end: fim }))
      const atrasadas = mensalidades
        .filter(m => m.status === 'atrasado' && isWithinInterval(parseISO(m.vencimento), { start: inicio, end: fim }))
      return {
        key, label,
        recebido: pagas.reduce((s, m) => s + m.valor, 0),
        pendente: pendentes.reduce((s, m) => s + m.valor, 0),
        atrasado: atrasadas.reduce((s, m) => s + m.valor, 0),
      }
    })
    return meses
  }, [mensalidades])

  const mesAtual = receitaData[receitaData.length - 1]
  const mesAnterior = receitaData[receitaData.length - 2]
  const crescimentoReceita = mesAnterior?.recebido
    ? ((mesAtual.recebido - mesAnterior.recebido) / mesAnterior.recebido * 100).toFixed(1)
    : null

  // Receita por modalidade
  const receitaPorModalidade = useMemo(() => {
    const map: Record<string, number> = {}
    alunos.forEach(a => {
      const nome = a.modalidade_principal.nome
      const totalAluno = mensalidades
        .filter(m => m.aluno_id === a.id && m.status === 'pago')
        .reduce((s, m) => s + m.valor, 0)
      map[nome] = (map[nome] || 0) + totalAluno
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [alunos, mensalidades])

  // ── FREQUÊNCIA ────────────────────────────────────────────
  const frequenciaTurmas = useMemo(() => turmas.map(turma => {
    const cis = checkIns.filter(c => c.turma_id === turma.id)
    const diasUnicos = new Set(cis.map(c => c.data)).size
    const alunosUnicos = new Set(cis.map(c => c.aluno_id)).size
    return {
      nome: turma.nome,
      modalidade: turma.modalidade.nome,
      totalCheckIns: cis.length,
      diasAtivos: diasUnicos,
      alunosUnicos,
      mediaAlunos: diasUnicos > 0 ? (cis.length / diasUnicos).toFixed(1) : '0',
      capacidade: turma.capacidade_maxima,
      taxaOcupacao: diasUnicos > 0 ? Math.round((cis.length / diasUnicos / turma.capacidade_maxima) * 100) : 0,
    }
  }).sort((a, b) => b.totalCheckIns - a.totalCheckIns), [turmas, checkIns])

  // Frequência por aluno (top 10)
  const frequenciaAlunos = useMemo(() => {
    const map: Record<string, number> = {}
    checkIns.filter(c => turmaIds.has(c.turma_id)).forEach(c => {
      map[c.aluno_id] = (map[c.aluno_id] || 0) + 1
    })
    return Object.entries(map)
      .map(([id, total]) => ({ aluno: alunos.find(a => a.id === id), total }))
      .filter(e => e.aluno)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [checkIns, alunos, turmaIds])

  // ── PROGRESSÃO ────────────────────────────────────────────
  const alunoSel = alunos.find(a => a.id === alunoProgressao)
  const historicoOrdenado = alunoSel
    ? [...alunoSel.historico_faixas].sort((a, b) => new Date(a.data_promocao).getTime() - new Date(b.data_promocao).getTime())
    : []
  const tempoEmCadaFaixa = historicoOrdenado.map((h, i) => {
    const proxima = historicoOrdenado[i + 1]
    const fim = proxima ? new Date(proxima.data_promocao) : new Date()
    return { faixa: h.graduacao.nome, dias: differenceInDays(fim, new Date(h.data_promocao)), cor: h.graduacao.cor_hex }
  })
  const tempoMedio = tempoEmCadaFaixa.length
    ? Math.round(tempoEmCadaFaixa.reduce((s, t) => s + t.dias, 0) / tempoEmCadaFaixa.length)
    : 0
  const velocidade = tempoMedio < 120 ? 'Rápida' : tempoMedio > 240 ? 'Lenta' : 'Normal'

  // ── EXPORTS ───────────────────────────────────────────────
  function exportarInadimplenciaCSV() {
    const csv = [
      ['Nome', 'Telefone', 'Email', 'Parcelas Atrasadas', 'Total em Atraso', 'Dias em Atraso'],
      ...inadimplentes.map(i => [i.aluno.nome, i.aluno.telefone, i.aluno.email, i.qtd, i.total.toFixed(2), i.diasAtraso])
    ].map(r => r.join(',')).join('\n')
    download(csv, `inadimplencia-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  }

  function exportarReceita() {
    const csv = [
      ['Mês', 'Recebido', 'Pendente', 'Atrasado'],
      ...receitaData.map(r => [r.label, r.recebido.toFixed(2), r.pendente.toFixed(2), r.atrasado.toFixed(2)])
    ].map(r => r.join(',')).join('\n')
    download(csv, `receita-${format(new Date(), 'yyyy-MM')}.csv`, 'text/csv')
  }

  function exportarReceitaPDF() {
    if (!academia) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, W, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('RELATÓRIO DE RECEITA', W / 2, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${academia.nome} · ${format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}`, W / 2, 30, { align: 'center' })

    let y = 52

    // KPIs
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Resumo do Período (6 meses)', 14, y); y += 8

    const totalRecebido = receitaData.reduce((s, r) => s + r.recebido, 0)
    const totalPendente = receitaData.reduce((s, r) => s + r.pendente, 0)
    const totalAtrasado = receitaData.reduce((s, r) => s + r.atrasado, 0)

    const kpis = [
      ['Total Recebido', formatCurrency(totalRecebido)],
      ['Pendente', formatCurrency(totalPendente)],
      ['Em Atraso', formatCurrency(totalAtrasado)],
    ]
    kpis.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text(label + ':', 14, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(value, 80, y)
      y += 7
    })
    y += 6

    // Tabela por mês
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 30)
    doc.text('Receita por Mês', 14, y); y += 6

    doc.setFillColor(240, 244, 255)
    doc.rect(14, y, W - 28, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 80, 120)
    doc.text('Mês', 16, y + 5.5)
    doc.text('Recebido', 70, y + 5.5)
    doc.text('Pendente', 110, y + 5.5)
    doc.text('Atrasado', 150, y + 5.5)
    y += 9

    receitaData.forEach((r, i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 251, 255); doc.rect(14, y, W - 28, 7, 'F') }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      doc.text(r.label, 16, y + 4.8)
      doc.text(formatCurrency(r.recebido), 70, y + 4.8)
      doc.text(formatCurrency(r.pendente), 110, y + 4.8)
      doc.text(formatCurrency(r.atrasado), 150, y + 4.8)
      y += 7
    })
    y += 10

    // Por modalidade
    if (receitaPorModalidade.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(30, 30, 30)
      doc.text('Receita por Modalidade', 14, y); y += 6
      receitaPorModalidade.forEach(({ name, value }) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        doc.text(name, 16, y)
        doc.text(formatCurrency(value), 80, y)
        y += 6
      })
    }

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} · TatameHoje`, W / 2, 285, { align: 'center' })
    doc.save(`relatorio-receita-${format(new Date(), 'yyyy-MM')}.pdf`)
  }

  function exportarFrequenciaCSV() {
    const csv = [
      ['Turma', 'Modalidade', 'Total Check-ins', 'Dias com Aula', 'Alunos Únicos', 'Média/Dia', 'Capacidade', 'Taxa Ocupação'],
      ...frequenciaTurmas.map(f => [f.nome, f.modalidade, f.totalCheckIns, f.diasAtivos, f.alunosUnicos, f.mediaAlunos, f.capacidade, `${f.taxaOcupacao}%`])
    ].map(r => r.join(',')).join('\n')
    download(csv, `frequencia-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  }

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // ── CHURN RISK ─────────────────────────────────────────────
  const churnRisk = useMemo(() => {
    const hoje = new Date()
    return alunos
      .filter(a => a.status === 'ativo')
      .map(aluno => {
        // Último check-in
        const cisAluno = checkIns
          .filter(c => turmaIds.has(c.turma_id) && c.aluno_id === aluno.id)
          .sort((a, b) => b.data.localeCompare(a.data))
        const ultimoCI = cisAluno[0]
        const diasSemTreinar = ultimoCI
          ? differenceInDays(hoje, parseISO(ultimoCI.data))
          : differenceInDays(hoje, parseISO(aluno.data_matricula))

        // Mensalidades em atraso
        const atrasadas = mensalidades.filter(m => m.aluno_id === aluno.id && m.status === 'atrasado')
        const valorAtrasado = atrasadas.reduce((s, m) => s + m.valor, 0)

        // Score de risco: 0-100
        // Dias sem treinar pesa 50%, inadimplência pesa 50%
        const scoreDias = Math.min(50, (diasSemTreinar / 60) * 50)
        const scoreFinanceiro = atrasadas.length > 0 ? Math.min(50, 25 + atrasadas.length * 10) : 0
        const score = Math.round(scoreDias + scoreFinanceiro)

        const risco: 'alto' | 'medio' | 'baixo' = score >= 60 ? 'alto' : score >= 30 ? 'medio' : 'baixo'

        return { aluno, diasSemTreinar, ultimoCI: ultimoCI?.data ?? null, atrasadas: atrasadas.length, valorAtrasado, score, risco }
      })
      .filter(e => e.score >= 20)
      .sort((a, b) => b.score - a.score)
  }, [alunos, checkIns, mensalidades, turmaIds])

  const RISCO_CFG = {
    alto:  { label: 'Alto Risco',  color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-200' },
    medio: { label: 'Risco Médio', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    baixo: { label: 'Baixo Risco', color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-200' },
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'receita',       label: 'Receita',       icon: DollarSign },
    { key: 'frequencia',    label: 'Frequência',    icon: Activity },
    { key: 'inadimplencia', label: 'Inadimplência', icon: AlertTriangle },
    { key: 'progressao',    label: 'Progressão',    icon: TrendingUp },
    { key: 'churn',         label: 'Risco Churn',   icon: UserX },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══ RECEITA ══════════════════════════════════════════ */}
      {tab === 'receita' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Recebido (mês)', value: formatCurrency(mesAtual.recebido), trend: crescimentoReceita, icon: DollarSign, color: 'green' },
              { label: 'Pendente', value: formatCurrency(mesAtual.pendente), icon: BarChart2, color: 'yellow' },
              { label: 'Em Atraso', value: formatCurrency(mesAtual.atrasado), icon: AlertTriangle, color: 'red' },
              { label: 'Alunos Ativos', value: alunos.filter(a => a.status === 'ativo').length, icon: Users, color: 'blue' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon size={14} className={`text-${kpi.color}-500`} />
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.trend && (
                  <p className={cn('text-xs mt-1', Number(kpi.trend) >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {Number(kpi.trend) >= 0 ? '▲' : '▼'} {Math.abs(Number(kpi.trend))}% vs mês anterior
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Gráfico receita mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Receita dos Últimos 6 Meses</h2>
              <div className="flex gap-2">
                <button onClick={exportarReceita} className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">
                  <Download size={12} /> CSV
                </button>
                <button onClick={exportarReceitaPDF} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  <FileDown size={12} /> PDF
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={receitaData}>
                <defs>
                  <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAtrasado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="recebido" name="Recebido" stroke="#10b981" fill="url(#gradRecebido)" strokeWidth={2} />
                <Area type="monotone" dataKey="pendente" name="Pendente" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="atrasado" name="Atrasado" stroke="#ef4444" fill="url(#gradAtrasado)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Por modalidade */}
          {receitaPorModalidade.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Receita por Modalidade</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={receitaPorModalidade} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {receitaPorModalidade.map((_, i) => <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Detalhamento</h2>
                <div className="space-y-3">
                  {receitaPorModalidade.map(({ name, value }, i) => {
                    const total = receitaPorModalidade.reduce((s, r) => s + r.value, 0)
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{name}</span>
                          <span className="text-gray-500">{formatCurrency(value)} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ FREQUÊNCIA ═══════════════════════════════════════ */}
      {tab === 'frequencia' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={exportarFrequenciaCSV} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-600">
              <Download size={15} /> Exportar CSV
            </button>
          </div>

          {/* Por turma */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={16} className="text-blue-500" /> Frequência por Turma
              </h2>
            </div>
            {frequenciaTurmas.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado de frequência disponível.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Turma</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Modalidade</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Check-ins</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Alunos únicos</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Média/dia</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frequenciaTurmas.map((f, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                          <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.modalidade}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{f.totalCheckIns}</td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{f.alunosUnicos}</td>
                          <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{f.mediaAlunos} alunos</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[80px]">
                                <div
                                  className={cn('h-2 rounded-full', f.taxaOcupacao > 80 ? 'bg-green-500' : f.taxaOcupacao > 50 ? 'bg-blue-500' : 'bg-amber-500')}
                                  style={{ width: `${Math.min(f.taxaOcupacao, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{f.taxaOcupacao}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gráfico frequência */}
                <div className="p-5 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Check-ins por Turma</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={frequenciaTurmas} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="totalCheckIns" name="Check-ins" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Top alunos por frequência */}
          {frequenciaAlunos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-500" /> Top 10 — Alunos mais frequentes
              </h2>
              <div className="space-y-2.5">
                {frequenciaAlunos.map(({ aluno, total }, i) => {
                  const max = frequenciaAlunos[0].total
                  return (
                    <div key={aluno!.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold shrink-0">
                        {aluno!.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{aluno!.nome}</span>
                          <span className="text-xs font-bold text-purple-600 shrink-0 ml-2">{total} aulas</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-purple-400 rounded-full" style={{ width: `${(total / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ INADIMPLÊNCIA ════════════════════════════════════ */}
      {tab === 'inadimplencia' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Alunos Inadimplentes</p>
                <p className="text-3xl font-bold text-red-600">{inadimplentes.length}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Total em Atraso</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(inadimplentes.reduce((s, i) => s + i.total, 0))}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Críticos (&gt;30 dias)</p>
                <p className="text-3xl font-bold text-orange-600">
                  {inadimplentes.filter(i => i.diasAtraso > 30).length}
                </p>
              </div>
            </div>
            <button onClick={exportarInadimplenciaCSV} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Download size={16} /> Exportar CSV
            </button>
          </div>

          {inadimplentes.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <p className="text-green-700 font-semibold text-lg">Nenhum aluno inadimplente!</p>
              <p className="text-green-600 text-sm mt-1">Todos os pagamentos estão em dia.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Aluno</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Atraso</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Parcelas</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {inadimplentes.map(({ aluno, total, diasAtraso, qtd }) => (
                    <tr key={aluno.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{aluno.nome}</p>
                        <p className="text-xs text-gray-400">{aluno.modalidade_principal.nome}</p>
                        {aluno.status === 'suspenso' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full mt-1">
                            Suspenso automaticamente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('font-bold text-sm', diasAtraso > 60 ? 'text-red-600' : diasAtraso > 30 ? 'text-orange-500' : 'text-yellow-600')}>
                          {diasAtraso}d
                        </span>
                        {diasAtraso > 15 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Suspenso</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{qtd}x</td>
                      <td className="px-4 py-3 font-bold text-red-700">{formatCurrency(total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a href={`https://wa.me/55${aluno.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-green-50 text-green-600" title="WhatsApp">
                            <MessageCircle size={14} />
                          </a>
                          <a href={`tel:${aluno.telefone}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Ligar">
                            <Phone size={14} />
                          </a>
                          <a href={`mailto:${aluno.email}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Email">
                            <Mail size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ PROGRESSÃO ═══════════════════════════════════════ */}
      {tab === 'progressao' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Aluno</label>
            <select
              className="w-full sm:w-80 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={alunoProgressao}
              onChange={e => setAlunoProgressao(e.target.value)}
            >
              <option value="">Selecione um aluno...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} — {a.modalidade_principal.nome}</option>)}
            </select>
          </div>

          {alunoSel && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Faixas', value: historicoOrdenado.length },
                  { label: 'Tempo Total', value: `${tempoEmCadaFaixa.reduce((s, t) => s + t.dias, 0)} dias` },
                  { label: 'Média por Faixa', value: `${tempoMedio} dias` },
                  { label: 'Velocidade', value: velocidade },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Tempo em Cada Faixa (dias)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tempoEmCadaFaixa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="faixa" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="dias" name="Dias" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Histórico Detalhado</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">#</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Faixa</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Data da Promoção</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Dias na Faixa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempoEmCadaFaixa.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: item.cor }} />
                              <span className="font-medium text-gray-800">{item.faixa}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {format(new Date(historicoOrdenado[idx].data_promocao), "dd/MM/yyyy")}
                          </td>
                          <td className="py-2 px-3">
                            <span className={cn('font-semibold', item.dias < tempoMedio ? 'text-green-600' : item.dias > tempoMedio * 1.5 ? 'text-red-500' : 'text-gray-700')}>
                              {item.dias} dias
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="font-medium text-gray-700 text-sm">Recomendação:</p>
                  {velocidade === 'Rápida' && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2.5">⚡ Excelente ritmo! {alunoSel.nome} progride de forma acelerada.</p>}
                  {velocidade === 'Lenta' && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2.5">💪 Considere aumentar a frequência de treinos para acelerar o progresso.</p>}
                  {velocidade === 'Normal' && <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-2.5">📈 Progressão dentro do ritmo esperado. Continue assim!</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ CHURN RISK ════════════════════════════════════════ */}
      {tab === 'churn' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {(['alto', 'medio', 'baixo'] as const).map(r => {
              const cfg = RISCO_CFG[r]
              const count = churnRisk.filter(e => e.risco === r).length
              return (
                <div key={r} className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}>
                  <p className={cn('text-xs font-semibold', cfg.color)}>{cfg.label}</p>
                  <p className={cn('text-3xl font-bold mt-1', cfg.color)}>{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">aluno{count !== 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>

          {/* Explicação do score */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-2"><Flame size={14} className="text-orange-500" /> Como o Score de Risco é calculado</p>
            <p>• <strong>Dias sem treinar</strong> — até 50 pontos (30 dias sem treino = 25 pts, 60+ dias = 50 pts)</p>
            <p>• <strong>Inadimplência</strong> — até 50 pontos (1 mensalidade atrasada = 35 pts, 2+ = 50 pts)</p>
            <p>• <strong>Alto risco</strong> ≥ 60 pts · <strong>Médio</strong> 30–59 pts · <strong>Baixo</strong> 20–29 pts</p>
          </div>

          {churnRisk.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
              <UserX size={32} className="mx-auto text-green-300 mb-3" />
              <p className="text-green-700 font-semibold">Nenhum aluno em risco detectado!</p>
              <p className="text-green-600 text-sm mt-1">Todos os alunos ativos estão com boa frequência e pagamentos em dia.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="font-semibold text-gray-700 text-sm">{churnRisk.length} aluno{churnRisk.length !== 1 ? 's' : ''} em risco de churn</span>
              </div>
              <div className="divide-y divide-gray-50">
                {churnRisk.map(({ aluno, diasSemTreinar, ultimoCI, atrasadas, valorAtrasado, score, risco }) => {
                  const cfg = RISCO_CFG[risco]
                  const waMsg = encodeURIComponent(`Olá ${aluno.nome.split(' ')[0]}! Sentimos sua falta nos treinos! Quando você vai voltar? 🥋`)
                  return (
                    <div key={aluno.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Score ring */}
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border',
                            cfg.bg, cfg.border
                          )}>
                            <span className={cn('text-base font-bold leading-none', cfg.color)}>{score}</span>
                            <span className={cn('text-[9px] font-medium mt-0.5', cfg.color)}>pts</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">{aluno.nome}</p>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color, cfg.bg)}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{aluno.modalidade_principal.nome} · {aluno.graduacao_atual?.nome ?? '—'}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                              <span className={cn('flex items-center gap-1', diasSemTreinar > 30 ? 'text-red-600 font-semibold' : 'text-gray-500')}>
                                <Activity size={11} />
                                {diasSemTreinar === 0
                                  ? 'Treinou hoje'
                                  : `${diasSemTreinar} dia${diasSemTreinar !== 1 ? 's' : ''} sem treinar`}
                                {ultimoCI && ` (último: ${format(parseISO(ultimoCI), 'dd/MM')})`}
                              </span>
                              {atrasadas > 0 && (
                                <span className="flex items-center gap-1 text-red-600 font-semibold">
                                  <AlertTriangle size={11} />
                                  {atrasadas} mensalididade{atrasadas !== 1 ? 's' : ''} atrasada{atrasadas !== 1 ? 's' : ''} ({formatCurrency(valorAtrasado)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 shrink-0">
                          {aluno.telefone && (
                            <a
                              href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}?text=${waMsg}`}
                              target="_blank" rel="noreferrer"
                              title="Enviar WhatsApp"
                              className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                          <a
                            href={`/alunos/${aluno.id}`}
                            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Ver Perfil
                          </a>
                        </div>
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
