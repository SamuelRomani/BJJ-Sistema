import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle, CreditCard, Loader2 } from 'lucide-react'

export function Mensalidades({ userId }: { userId: string }) {
  const [aluno, setAluno] = useState<any>(null)
  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: a } = await supabase
        .from('alunos')
        .select('*, pacote:pacotes(*), modalidade:modalidades(nome)')
        .eq('user_id', userId)
        .single()
      setAluno(a)
      if (!a) { setLoading(false); return }

      const { data: m } = await supabase
        .from('mensalidades')
        .select('*')
        .eq('aluno_id', a.id)
        .order('vencimento', { ascending: false })
        .limit(24)
      setMensalidades(m ?? [])
      setLoading(false)
    }
    carregar()
  }, [userId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  )

  const STATUS = {
    pago:      { icon: CheckCircle2, label: 'Pago',     color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
    pendente:  { icon: Clock,        label: 'Pendente', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
    atrasado:  { icon: AlertCircle,  label: 'Atrasado', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    cancelado: { icon: AlertCircle,  label: 'Cancelado', color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' },
  }

  const pendente = mensalidades.find(m => m.status === 'pendente' || m.status === 'atrasado')

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Meu Plano</h1>

      {/* Card do plano */}
      {aluno?.pacote && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <p className="text-slate-400 text-xs">Plano atual</p>
          <p className="text-xl font-bold mt-1">{aluno.pacote.nome}</p>
          <p className="text-slate-300 text-sm mt-0.5">{aluno.modalidade?.nome}</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-3xl font-bold">
                R$ {aluno.pacote.valor.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">{aluno.pacote.periodicidade}</p>
            </div>
            <CreditCard size={28} className="text-slate-500" />
          </div>
        </div>
      )}

      {/* Próximo vencimento */}
      {pendente && (
        <div className={`rounded-2xl border p-4 ${STATUS[pendente.status as keyof typeof STATUS].bg}`}>
          <p className={`font-semibold text-sm ${STATUS[pendente.status as keyof typeof STATUS].color}`}>
            {pendente.status === 'atrasado' ? '⚠️ Mensalidade em atraso' : '📅 Próximo vencimento'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {pendente.valor.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {format(parseISO(pendente.vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {pendente.status === 'atrasado' && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {differenceInDays(new Date(), parseISO(pendente.vencimento))} dias em atraso
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Entre em contato com a secretaria para regularizar.</p>
        </div>
      )}

      {/* Histórico */}
      {mensalidades.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 font-semibold text-gray-900 text-sm border-b border-gray-50">Histórico</p>
          <div className="divide-y divide-gray-50">
            {mensalidades.map(m => {
              const cfg = STATUS[m.status as keyof typeof STATUS]
              const Icon = cfg.icon
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={cfg.color} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        R$ {m.valor.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-400">
                        Venc. {format(parseISO(m.vencimento), 'dd/MM/yyyy')}
                        {m.data_pagamento && ` · Pago ${format(parseISO(m.data_pagamento), 'dd/MM/yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
