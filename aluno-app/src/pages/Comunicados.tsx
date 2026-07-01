import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Megaphone, AlertTriangle, Calendar, DollarSign, Bell, Loader2 } from 'lucide-react'
import { registrarPush } from '../lib/push'
import { toast } from 'sonner'

const TIPO_ICON: Record<string, React.ElementType> = {
  geral: Megaphone, financeiro: DollarSign, evento: Calendar, urgente: AlertTriangle,
}
const TIPO_COLOR: Record<string, string> = {
  geral: 'text-blue-600 bg-blue-50 border-blue-100',
  financeiro: 'text-green-600 bg-green-50 border-green-100',
  evento: 'text-purple-600 bg-purple-50 border-purple-100',
  urgente: 'text-red-600 bg-red-50 border-red-100',
}

export function Comunicados({ userId }: { userId: string }) {
  const [comunicados, setComunicados] = useState<any[]>([])
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [pushAtivo, setPushAtivo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: a } = await supabase
        .from('alunos')
        .select('id, academia_id, status')
        .eq('user_id', userId)
        .single()
      if (!a) { setLoading(false); return }
      setAlunoId(a.id)

      const { data: coms } = await supabase
        .from('comunicados')
        .select('*')
        .eq('academia_id', a.academia_id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Filtra por destinatários
      const filtrados = (coms ?? []).filter(c => {
        if (c.destinatarios === 'todos') return true
        if (c.destinatarios === 'ativos') return a.status === 'ativo'
        return true
      })
      setComunicados(filtrados)

      // Escuta novos comunicados em tempo real
      const sub = supabase
        .channel(`comunicados-${a.academia_id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comunicados',
          filter: `academia_id=eq.${a.academia_id}` },
          payload => setComunicados(prev => [payload.new, ...prev])
        )
        .subscribe()

      setLoading(false)
      return () => { sub.unsubscribe() }
    }
    carregar()
  }, [userId])

  async function ativarPush() {
    if (!alunoId) return
    const ok = await registrarPush(alunoId)
    if (ok) { setPushAtivo(true); toast.success('Notificações ativadas!') }
    else toast.error('Não foi possível ativar notificações. Verifique as permissões.')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
        {!pushAtivo && (
          <button
            onClick={ativarPush}
            className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700"
          >
            <Bell size={13} /> Ativar notificações
          </button>
        )}
      </div>

      {comunicados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Megaphone size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhum comunicado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comunicados.map(c => {
            const Icon = TIPO_ICON[c.tipo] ?? Megaphone
            const colors = TIPO_COLOR[c.tipo] ?? TIPO_COLOR.geral
            return (
              <div key={c.id} className={`rounded-2xl border p-4 ${colors}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug">{c.titulo}</p>
                    <p className="text-sm mt-1.5 opacity-80 whitespace-pre-line leading-relaxed">{c.mensagem}</p>
                    <p className="text-xs opacity-50 mt-2">
                      {format(parseISO(c.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
