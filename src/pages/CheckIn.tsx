import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { DIAS_SEMANA, cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Users, Clock, AlertCircle, QrCode, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { CheckIn as CheckInType } from '@/types'
import QRCodeSVG from 'react-qr-code'

// ── QR Code Modal ──────────────────────────────────────────
function QRModal({ alunos, onClose }: { alunos: { id: string; nome: string; foto_url?: string }[]; onClose: () => void }) {
  const [busca, setBusca] = useState('')
  const [alunoQR, setAlunoQR] = useState<typeof alunos[0] | null>(null)

  const filtrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><QrCode size={18} className="text-blue-500" /> QR Codes dos Alunos</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        {alunoQR ? (
          <div className="p-6 flex flex-col items-center gap-4">
            <p className="font-semibold text-gray-900">{alunoQR.nome}</p>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
              <QRCodeSVG value={`bjj-checkin:${alunoQR.id}`} size={200} />
            </div>
            <p className="text-xs text-gray-400 text-center">Escaneie para registrar presença</p>
            <button onClick={() => setAlunoQR(null)} className="text-sm text-blue-600 hover:underline">← Voltar para lista</button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar aluno..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <div className="overflow-y-auto max-h-80 divide-y divide-gray-50">
              {filtrados.map(a => (
                <button key={a.id} onClick={() => setAlunoQR(a)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">{a.nome.charAt(0)}</div>
                  <span className="text-sm text-gray-900 font-medium">{a.nome}</span>
                  <QrCode size={16} className="ml-auto text-gray-300" />
                </button>
              ))}
              {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum aluno encontrado</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function CheckIn() {
  const [searchParams] = useSearchParams()
  const { turmas: todasTurmas, alunos: todosAlunos, checkIns, addCheckIn, removeCheckIn, academiaAtualId } = useStore()
  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)

  // Estado
  const [turmaSelecionada, setTurmaSelecionada] = useState(searchParams.get('turma') || '')
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [tab, setTab] = useState<'checkin' | 'historico'>('checkin')
  const [showQR, setShowQR] = useState(false)

  const turma = turmas.find(t => t.id === turmaSelecionada)
  const dataStr = dataSelecionada.toISOString().split('T')[0]

  // Check-ins da data + turma selecionadas
  const checkInsDia = useMemo(
    () => checkIns.filter(c => c.turma_id === turmaSelecionada && c.data === dataStr),
    [checkIns, turmaSelecionada, dataStr]
  )

  const idsPresentes = new Set(checkInsDia.map(c => c.aluno_id))
  const vagasRestantes = turma ? turma.capacidade_maxima - checkInsDia.length : 0
  const lotada = vagasRestantes <= 0

  // Calendário
  const diasDoMes = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesCalendario), { weekStartsOn: 0 })
    const fim = endOfWeek(endOfMonth(mesCalendario), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: inicio, end: fim })
  }, [mesCalendario])

  // Dias com check-ins (para marcar no calendário)
  const diasComCheckIn = useMemo(() => {
    if (!turmaSelecionada) return new Set<string>()
    return new Set(checkIns.filter(c => c.turma_id === turmaSelecionada).map(c => c.data))
  }, [checkIns, turmaSelecionada])

  // Dias em que a turma tem aula (dia da semana)
  const diasDeAula = useMemo(() => {
    if (!turma) return new Set<number>()
    return new Set(turma.horarios.map(h => h.dia_semana))
  }, [turma])

  function toggleCheckIn(alunoId: string) {
    if (!turmaSelecionada) return
    if (!diaTemAula) {
      toast.error('Esta turma não tem aula neste dia.')
      return
    }

    const jaFez = idsPresentes.has(alunoId)

    if (jaFez) {
      const ci = checkInsDia.find(c => c.aluno_id === alunoId)
      if (ci) {
        removeCheckIn(ci.id)
        const aluno = alunos.find(a => a.id === alunoId)
        toast.success(`Check-in de ${aluno?.nome} removido`)
      }
    } else {
      if (lotada) {
        toast.error(`Turma lotada! Capacidade máxima: ${turma?.capacidade_maxima}`)
        return
      }
      const novoCheckIn: CheckInType = {
        id: crypto.randomUUID(),
        turma_id: turmaSelecionada,
        aluno_id: alunoId,
        data: dataStr,
        hora_checkin: format(new Date(), 'HH:mm'),
      }
      addCheckIn(novoCheckIn)
      const aluno = alunos.find(a => a.id === alunoId)
      toast.success(`Check-in de ${aluno?.nome} registrado!`)
    }
  }

  // Histórico por aluno (todos check-ins da turma)
  const historicoTurma = useMemo(() => {
    if (!turmaSelecionada) return []
    return [...checkIns]
      .filter(c => c.turma_id === turmaSelecionada)
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [checkIns, turmaSelecionada])

  // Agrupado por data para o histórico
  const historicoPorData = useMemo(() => {
    const grupos: Record<string, typeof historicoTurma> = {}
    historicoTurma.forEach(c => {
      if (!grupos[c.data]) grupos[c.data] = []
      grupos[c.data].push(c)
    })
    return Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a))
  }, [historicoTurma])

  // Estatísticas por aluno
  const statsPorAluno = useMemo(() => {
    const map: Record<string, number> = {}
    historicoTurma.forEach(c => {
      map[c.aluno_id] = (map[c.aluno_id] || 0) + 1
    })
    return Object.entries(map)
      .map(([id, total]) => ({ aluno: alunos.find(a => a.id === id), total }))
      .filter(e => e.aluno)
      .sort((a, b) => b.total - a.total)
  }, [historicoTurma, alunos])

  const horarioTurma = turma?.horarios.find(h => h.dia_semana === getDay(dataSelecionada))
  const diaTemAula = !!horarioTurma

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in de Aulas</h1>
          <p className="text-gray-500 text-sm">Registre a presença por aula — sem inscrição fixa</p>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium"
        >
          <QrCode size={16} /> QR Codes
        </button>
      </div>

      {showQR && <QRModal alunos={alunos} onClose={() => setShowQR(false)} />}

      {/* Seletor de turma */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Turma</label>
        <select
          className="w-full sm:w-96 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={turmaSelecionada}
          onChange={e => setTurmaSelecionada(e.target.value)}
        >
          <option value="">Selecione uma turma...</option>
          {turmas.filter(t => t.ativa).map(t => (
            <option key={t.id} value={t.id}>{t.nome} — {t.modalidade.nome}</option>
          ))}
        </select>
      </div>

      {turmaSelecionada && turma && (
        <>
          {/* Info da turma */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-xs text-blue-600 font-medium">Turma</p>
              <p className="font-bold text-blue-900">{turma.nome}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Professor</p>
              <p className="font-semibold text-blue-900">{turma.professor?.nome}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Horários</p>
              <div className="flex gap-1 mt-0.5">
                {turma.horarios.map(h => (
                  <span key={h.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {DIAS_SEMANA[h.dia_semana]} {h.hora_inicio}–{h.hora_fim}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Capacidade</p>
              <p className="font-bold text-blue-900">{turma.capacidade_maxima} vagas</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {([['checkin', 'Check-in'], ['historico', 'Histórico']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* === TAB CHECK-IN === */}
          {tab === 'checkin' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Calendário */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
                {/* Cabeçalho do mês */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setMesCalendario(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="font-semibold text-gray-800 text-sm capitalize">
                    {format(mesCalendario, 'MMMM yyyy', { locale: ptBR })}
                  </p>
                  <button
                    onClick={() => setMesCalendario(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 mb-1">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Dias */}
                <div className="grid grid-cols-7 gap-0.5">
                  {diasDoMes.map(dia => {
                    const dStr = dia.toISOString().split('T')[0]
                    const temAula = diasDeAula.has(getDay(dia))
                    const temCheckIn = diasComCheckIn.has(dStr)
                    const selecionado = isSameDay(dia, dataSelecionada)
                    const ehHoje = isToday(dia)
                    const doMes = isSameMonth(dia, mesCalendario)

                    return (
                      <button
                        key={dStr}
                        onClick={() => { setDataSelecionada(dia); setMesCalendario(dia) }}
                        disabled={!doMes}
                        className={cn(
                          'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all',
                          !doMes && 'opacity-20 cursor-default',
                          doMes && temAula && !selecionado && 'hover:bg-blue-50',
                          doMes && !temAula && !selecionado && 'hover:bg-gray-50',
                          selecionado && 'bg-blue-600 text-white font-bold',
                          !selecionado && ehHoje && 'ring-2 ring-blue-400',
                          !selecionado && temAula && doMes && 'font-medium text-blue-700 bg-blue-50',
                        )}
                      >
                        <span>{format(dia, 'd')}</span>
                        {temCheckIn && !selecionado && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-green-500" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> Dia de aula
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded-full bg-green-500" /> Com check-ins
                  </div>
                </div>
              </div>

              {/* Lista de alunos para check-in */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header do dia */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    {horarioTurma ? (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {horarioTurma.hora_inicio}–{horarioTurma.hora_fim}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle size={11} /> Sem aula programada neste dia
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                    lotada ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  )}>
                    <Users size={14} />
                    {checkInsDia.length}/{turma.capacidade_maxima}
                    {lotada && ' — LOTADA'}
                  </div>
                </div>

                {/* Bloqueio quando não há aula */}
                {!diaTemAula && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-amber-600 font-medium text-sm">Sem aula neste dia</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Esta turma só tem aulas em:{' '}
                      {turma?.horarios.map(h => DIAS_SEMANA[h.dia_semana]).join(', ')}
                    </p>
                  </div>
                )}

                {/* Alunos */}
                {diaTemAula && <div className="divide-y divide-gray-50">
                  {alunos
                    .filter(a => a.status === 'ativo')
                    .sort((a, b) => {
                      // presentes primeiro
                      const aP = idsPresentes.has(a.id) ? 0 : 1
                      const bP = idsPresentes.has(b.id) ? 0 : 1
                      return aP - bP || a.nome.localeCompare(b.nome)
                    })
                    .map(aluno => {
                      const presente = idsPresentes.has(aluno.id)
                      const ci = checkInsDia.find(c => c.aluno_id === aluno.id)

                      return (
                        <div
                          key={aluno.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 transition-colors',
                            presente && 'bg-green-50'
                          )}
                        >
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0',
                            presente ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'
                          )}>
                            {aluno.nome.charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', presente ? 'text-green-800' : 'text-gray-900')}>
                              {aluno.nome}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-400">{aluno.modalidade_principal.nome}</p>
                              {aluno.graduacao_atual && (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                    style={{ backgroundColor: aluno.graduacao_atual.cor_hex }}
                                  />
                                  <span className="text-xs text-gray-400">{aluno.graduacao_atual.nome}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {presente && ci && (
                            <span className="text-xs text-green-600 font-medium shrink-0">{ci.hora_checkin}</span>
                          )}

                          <button
                            onClick={() => toggleCheckIn(aluno.id)}
                            disabled={!presente && lotada}
                            title={!presente && lotada ? 'Turma lotada' : presente ? 'Remover check-in' : 'Fazer check-in'}
                            className={cn(
                              'shrink-0 p-1.5 rounded-lg transition-colors',
                              presente
                                ? 'text-green-600 hover:bg-red-50 hover:text-red-500'
                                : lotada
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                            )}
                          >
                            {presente
                              ? <CheckCircle2 size={22} className="fill-green-100" />
                              : <XCircle size={22} />
                            }
                          </button>
                        </div>
                      )
                    })}
                </div>}
              </div>
            </div>
          )}

          {/* === TAB HISTÓRICO === */}
          {tab === 'historico' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Ranking de frequência */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Frequência por Aluno
                </h3>
                {statsPorAluno.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Nenhum check-in ainda</p>
                ) : (
                  <div className="space-y-2">
                    {statsPorAluno.map(({ aluno, total }, idx) => (
                      <div key={aluno!.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 text-right font-medium">{idx + 1}.</span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: aluno!.graduacao_atual?.cor_hex ?? '#e5e7eb',
                            color: '#fff',
                            textShadow: '0 0 3px rgba(0,0,0,0.5)',
                          }}
                        >
                          {aluno!.nome.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{aluno!.nome}</p>
                          <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                            <div
                              className="h-1 bg-blue-500 rounded-full"
                              style={{ width: `${(total / (statsPorAluno[0]?.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 shrink-0">{total}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico cronológico */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Histórico de Aulas</h3>
                  <p className="text-xs text-gray-400">{historicoTurma.length} check-ins registrados</p>
                </div>

                {historicoPorData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-12">Nenhum check-in registrado</p>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                    {historicoPorData.map(([data, cis]) => {
                      const d = new Date(data + 'T12:00:00')
                      return (
                        <div key={data} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700 capitalize">
                              {format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {cis.length} aluno{cis.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cis.map(ci => {
                              const aluno = alunos.find(a => a.id === ci.aluno_id)
                              return (
                                <div
                                  key={ci.id}
                                  className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs px-2 py-1 rounded-full"
                                >
                                  <CheckCircle2 size={11} className="text-green-500" />
                                  <span className="font-medium">{aluno?.nome ?? '—'}</span>
                                  <span className="text-green-500">{ci.hora_checkin}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!turmaSelecionada && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">Selecione uma turma para gerenciar o check-in</p>
          <p className="text-sm text-gray-400 mt-1">Os alunos fazem check-in individualmente por aula</p>
        </div>
      )}
    </div>
  )
}
