import { useStore } from '@/store/useStore'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Users, DollarSign, AlertTriangle,
  BookOpen, Cake, Clock, ChevronRight, Plus, QrCode, Award, CreditCard, TrendingUp, TrendingDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, parseISO, differenceInDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CORES = ['#3b82f6', '#f97316', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({
  icon: Icon, label, value, sub, color, trend
}: { icon: React.ElementType; label: string; value: string; sub?: string; color: string; trend?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <p className={cn('text-xs mt-0.5 flex items-center gap-0.5', trend > 0 ? 'text-green-600' : 'text-red-500')}>
            {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(0)}% vs mês anterior
          </p>
        )}
        {sub && !trend && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { alunos: todosAlunos, turmas: todasTurmas, mensalidades: todasMensalidades, checkIns: todosCheckIns, academiaAtualId, user } = useStore()
  const isProfessor = user?.role === 'professor'
  const hojeDate = new Date()
  const hoje = hojeDate.toISOString().split('T')[0]
  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const mensalidades = todasMensalidades.filter(m => turmas.some(t => t.id === m.turma_id))
  const checkIns = todosCheckIns.filter(c => turmas.some(t => t.id === c.turma_id))

  const ativos = alunos.filter(a => a.status === 'ativo').length
  const inadimplentes = [...new Set(mensalidades.filter(m => m.status === 'atrasado').map(m => m.aluno_id))].length
  const taxaInad = ativos > 0 ? ((inadimplentes / ativos) * 100).toFixed(1) : '0'

  // Receita real — últimos 6 meses
  const receitaPorMes = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(hojeDate, 5 - i)
    const inicio = startOfMonth(d)
    const fim = endOfMonth(d)
    const valor = mensalidades
      .filter(m => m.status === 'pago' && m.data_pagamento && isWithinInterval(parseISO(m.data_pagamento), { start: inicio, end: fim }))
      .reduce((s, m) => s + m.valor, 0)
    return { mes: format(d, 'MMM', { locale: ptBR }), valor }
  })
  const receitaMes = receitaPorMes[receitaPorMes.length - 1].valor
  const receitaMesAnterior = receitaPorMes[receitaPorMes.length - 2].valor
  const trendReceita = receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior * 100) : 0

  // Distribuição por modalidade
  const porModalidade = Object.entries(
    alunos.reduce<Record<string, number>>((acc, a) => {
      const nome = a.modalidade_principal.nome
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {})
  ).map(([name, value], i) => ({ name, value, color: CORES[i % CORES.length] }))

  // Check-ins da semana (últimos 7 dias)
  const checkInsSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hojeDate)
    d.setDate(d.getDate() - (6 - i))
    const dataStr = d.toISOString().split('T')[0]
    return {
      dia: format(d, 'EEE', { locale: ptBR }),
      total: checkIns.filter(c => c.data === dataStr).length,
    }
  })

  // Aniversariantes do mês
  const mesAtual = hojeDate.getMonth() + 1
  const aniversariantes = alunos
    .filter(a => {
      const mes = parseInt(a.data_nascimento.split('-')[1])
      return mes === mesAtual
    })
    .sort((a, b) => {
      const diaA = parseInt(a.data_nascimento.split('-')[2])
      const diaB = parseInt(b.data_nascimento.split('-')[2])
      return diaA - diaB
    })

  // Próximas turmas do dia (dia da semana atual)
  const diaSemana = hojeDate.getDay()
  const turmasHoje = turmas.filter(t => t.ativa && t.horarios.some(h => h.dia_semana === diaSemana))
    .sort((a, b) => {
      const ha = a.horarios.find(h => h.dia_semana === diaSemana)?.hora_inicio ?? ''
      const hb = b.horarios.find(h => h.dia_semana === diaSemana)?.hora_inicio ?? ''
      return ha.localeCompare(hb)
    })

  // Mensalidades vencendo nos próximos 7 dias
  const vencendo7dias = mensalidades.filter(m => {
    if (m.status !== 'pendente') return false
    const dias = differenceInDays(parseISO(m.vencimento), hoje)
    return dias >= 0 && dias <= 7
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da academia</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Alunos Ativos" value={String(ativos)} sub={`${alunos.filter(a=>a.status==='suspenso').length} suspenso(s)`} color="bg-blue-500" />
        {!isProfessor && <StatCard icon={DollarSign} label="Receita do Mês" value={formatCurrency(receitaMes)} trend={trendReceita} color="bg-green-500" />}
        {!isProfessor && <StatCard icon={AlertTriangle} label="Inadimplentes" value={String(inadimplentes)} sub={`${taxaInad}% da base`} color="bg-red-500" />}
        <StatCard icon={BookOpen} label="Turmas Ativas" value={String(turmas.filter(t => t.ativa).length)} sub={`${checkIns.filter(c=>c.data===hoje).length} check-ins hoje`} color="bg-purple-500" />
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ações Rápidas</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/alunos/novo" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Novo Aluno
          </Link>
          <Link to="/checkin" className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
            <QrCode size={14} /> Check-in
          </Link>
          <Link to="/graduacoes" className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
            <Award size={14} /> Graduar Aluno
          </Link>
          {!isProfessor && (
            <Link to="/pagamentos" className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <CreditCard size={14} /> Registrar Pagamento
            </Link>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receita — oculto para professor */}
        {!isProfessor && <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Receita — Últimos 6 Meses</h2>
            <Link to="/relatorios" className="text-xs text-blue-600 hover:underline">Ver relatório →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={receitaPorMes}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v > 0 ? `R$${(v/1000).toFixed(0)}k` : '0'} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Area type="monotone" dataKey="valor" name="Receita" stroke="#10b981" fill="url(#colorReceita)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>}

        {/* Por Modalidade */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Alunos por Modalidade</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={porModalidade} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {porModalidade.map((entry, i) => <Cell key={entry.name} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {porModalidade.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                  <span className="text-gray-600">{m.name}</span>
                </div>
                <span className="font-medium text-gray-800">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-ins da semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Check-ins — Últimos 7 Dias</h2>
          <Link to="/checkin" className="text-xs text-blue-600 hover:underline">Abrir check-in →</Link>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={checkInsSemana}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" name="Presenças" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Linha: turmas de hoje + aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turmas hoje */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Turmas de Hoje
            </h2>
            <Link to="/turmas" className="text-xs text-blue-600 hover:underline">Ver todas →</Link>
          </div>
          {turmasHoje.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma turma agendada para hoje.</p>
          ) : (
            <div className="space-y-2">
              {turmasHoje.map(t => {
                const horario = t.horarios.find(h => h.dia_semana === diaSemana)
                const checkInsHoje = checkIns.filter(c => c.turma_id === t.id && c.data === hoje).length
                return (
                  <Link key={t.id} to={`/turmas`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.nome}</p>
                      <p className="text-xs text-gray-400">{horario?.hora_inicio} – {horario?.hora_fim}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{checkInsHoje}/{t.capacidade_maxima}</p>
                      <p className="text-xs text-gray-400">presentes</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Cake size={16} className="text-pink-500" />
              Aniversariantes do Mês
            </h2>
            <span className="text-xs text-gray-400">{format(hojeDate, 'MMMM yyyy', { locale: ptBR })}</span>
          </div>
          {aniversariantes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum aniversariante este mês.</p>
          ) : (
            <div className="space-y-2">
              {aniversariantes.slice(0, 6).map(a => {
                const dia = parseInt(a.data_nascimento.split('-')[2])
                const diaAtual = hojeDate.getDate()
                const isHoje = dia === diaAtual
                const waMsg = encodeURIComponent(`Feliz aniversário, ${a.nome.split(' ')[0]}! 🎂 A equipe da academia deseja um ótimo dia!`)
                const waLink = a.telefone ? `https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${waMsg}` : null
                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-pink-50 transition-colors">
                    <Link to={`/alunos/${a.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xs font-bold shrink-0">
                        {a.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.nome}</p>
                        <p className="text-xs text-gray-400">{a.modalidade_principal.nome}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className={`text-sm font-bold ${isHoje ? 'text-pink-600' : 'text-gray-600'}`}>
                        {isHoje ? '🎂 Hoje!' : `Dia ${dia}`}
                      </p>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank" rel="noreferrer"
                          title="Parabenizar via WhatsApp"
                          onClick={e => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
              {aniversariantes.length > 6 && (
                <p className="text-xs text-gray-400 text-center pt-1">+{aniversariantes.length - 6} mais</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-3">
        {vencendo7dias > 0 && !isProfessor && (
          <Link to="/pagamentos" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
            <Clock size={20} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Vencimentos próximos</p>
              <p className="text-sm text-amber-600">{vencendo7dias} mensalidade{vencendo7dias > 1 ? 's' : ''} vence{vencendo7dias > 1 ? 'm' : ''} nos próximos 7 dias.</p>
            </div>
            <ChevronRight size={16} className="text-amber-500" />
          </Link>
        )}
        {inadimplentes > 0 && !isProfessor && (
          <Link to="/relatorios" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Inadimplência</p>
              <p className="text-sm text-red-600">
                {inadimplentes} aluno{inadimplentes > 1 ? 's' : ''} com pagamentos em atraso. Clique para ver o relatório.
              </p>
            </div>
            <ChevronRight size={16} className="text-red-500" />
          </Link>
        )}
      </div>
    </div>
  )
}
