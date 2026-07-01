import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { QrCode, CreditCard, Flame, Award, ChevronRight, Calendar } from 'lucide-react'

export function Home({ userId }: { userId: string }) {
  const [aluno, setAluno] = useState<any>(null)
  const [checkinsRecentes, setCheckinsRecentes] = useState<any[]>([])
  const [mensalidadePendente, setMensalidadePendente] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      // Busca aluno vinculado ao user
      const { data: a } = await supabase
        .from('alunos')
        .select('*, modalidade:modalidades(nome), graduacao:graduacoes(nome, cor_hex), pacote:pacotes(nome, valor)')
        .eq('user_id', userId)
        .single()
      setAluno(a)

      if (!a) { setLoading(false); return }

      // Últimos check-ins
      const { data: cis } = await supabase
        .from('checkins')
        .select('*, turma:turmas(nome)')
        .eq('aluno_id', a.id)
        .order('data', { ascending: false })
        .limit(30)
      setCheckinsRecentes(cis ?? [])

      // Calcula streak
      const ciDates = new Set((cis ?? []).map((c: any) => c.data))
      let s = 0
      const d = new Date()
      while (ciDates.has(format(d, 'yyyy-MM-dd'))) { s++; d.setDate(d.getDate() - 1) }
      setStreak(s)

      // Mensalidade mais próxima pendente/atrasada
      const { data: m } = await supabase
        .from('mensalidades')
        .select('*')
        .eq('aluno_id', a.id)
        .in('status', ['pendente', 'atrasado'])
        .order('vencimento')
        .limit(1)
        .single()
      setMensalidadePendente(m)
      setLoading(false)
    }
    carregar()
  }, [userId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!aluno) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Perfil não encontrado. Fale com a secretaria.</p>
    </div>
  )

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const treinouHoje = checkinsRecentes.some(c => c.data === hoje)
  const treinos30d = checkinsRecentes.filter(c => parseISO(c.data) >= subDays(new Date(), 30)).length

  return (
    <div className="p-4 space-y-4">
      {/* Saudação */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-sm">Bom treino,</p>
        <h1 className="text-2xl font-bold mt-0.5">{aluno.nome.split(' ')[0]} 👋</h1>
        <div className="flex items-center gap-3 mt-3">
          {aluno.graduacao && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: aluno.graduacao.cor_hex }} />
              <span className="text-xs font-medium">{aluno.graduacao.nome}</span>
            </div>
          )}
          {aluno.modalidade && (
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-medium">{aluno.modalidade.nome}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 text-center border border-gray-100">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={14} className={streak > 0 ? 'text-orange-500' : 'text-gray-300'} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{streak}</p>
          <p className="text-xs text-gray-400">dias seguidos</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center border border-gray-100">
          <div className="flex items-center justify-center mb-1">
            <Calendar size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{treinos30d}</p>
          <p className="text-xs text-gray-400">treinos (30d)</p>
        </div>
        <div className={`rounded-2xl p-3.5 text-center border ${treinouHoje ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-center mb-1">
            <Award size={14} className={treinouHoje ? 'text-green-500' : 'text-gray-300'} />
          </div>
          <p className="text-sm font-bold text-gray-900">{treinouHoje ? '✓ Sim' : 'Não'}</p>
          <p className="text-xs text-gray-400">hoje</p>
        </div>
      </div>

      {/* Alerta mensalidade */}
      {mensalidadePendente && (
        <Link to="/mensalidades" className={`flex items-center justify-between p-4 rounded-2xl ${mensalidadePendente.status === 'atrasado' ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
          <div>
            <p className={`font-semibold text-sm ${mensalidadePendente.status === 'atrasado' ? 'text-red-700' : 'text-yellow-700'}`}>
              {mensalidadePendente.status === 'atrasado' ? 'Mensalidade em atraso' : 'Mensalidade a vencer'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Vence em {format(parseISO(mensalidadePendente.vencimento), "dd 'de' MMM", { locale: ptBR })}
              {' · '}R$ {mensalidadePendente.valor.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <CreditCard size={20} className={mensalidadePendente.status === 'atrasado' ? 'text-red-400' : 'text-yellow-400'} />
        </Link>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/checkin" className="bg-blue-600 text-white rounded-2xl p-4 flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all">
          <QrCode size={22} />
          <div>
            <p className="font-semibold text-sm">Check-in</p>
            <p className="text-xs text-blue-200">Marcar presença</p>
          </div>
        </Link>
        <Link to="/mensalidades" className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-95 transition-all">
          <CreditCard size={22} className="text-gray-600" />
          <div>
            <p className="font-semibold text-sm text-gray-900">Plano</p>
            <p className="text-xs text-gray-400">{aluno.pacote?.nome ?? 'Ver detalhes'}</p>
          </div>
        </Link>
      </div>

      {/* Últimos check-ins */}
      {checkinsRecentes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Treinos recentes</p>
            <Link to="/perfil" className="text-xs text-blue-500">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {checkinsRecentes.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Award size={14} className="text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-800">{c.turma?.nome ?? 'Treino'}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {format(parseISO(c.data), "dd/MM", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
