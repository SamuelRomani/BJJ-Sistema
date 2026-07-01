import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { QrCode, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CheckIn({ userId }: { userId: string }) {
  const [aluno, setAluno] = useState<any>(null)
  const [turmas, setTurmas] = useState<any[]>([])
  const [checkinsHoje, setCheckinsHoje] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState<string | null>(null)

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const diaSemana = new Date().getDay()

  useEffect(() => {
    async function carregar() {
      const { data: a } = await supabase
        .from('alunos')
        .select('id, nome, academia_id')
        .eq('user_id', userId)
        .single()
      setAluno(a)
      if (!a) { setLoading(false); return }

      // Turmas de hoje que o aluno pode fazer check-in
      const { data: ts } = await supabase
        .from('turmas')
        .select('*, horarios(*), modalidade:modalidades(nome), professor:perfis(nome)')
        .eq('academia_id', a.academia_id)
        .eq('ativa', true)

      const turmasHoje = (ts ?? []).filter(t =>
        t.horarios.some((h: any) => h.dia_semana === diaSemana)
      )
      setTurmas(turmasHoje)

      // Check-ins de hoje
      const { data: cis } = await supabase
        .from('checkins')
        .select('turma_id')
        .eq('aluno_id', a.id)
        .eq('data', hoje)
      setCheckinsHoje(new Set((cis ?? []).map((c: any) => c.turma_id)))
      setLoading(false)
    }
    carregar()
  }, [userId])

  async function fazerCheckIn(turmaId: string) {
    if (!aluno) return
    setRegistrando(turmaId)
    try {
      const hora = new Date().toTimeString().slice(0, 8)
      const { error } = await supabase.from('checkins').insert({
        turma_id: turmaId,
        aluno_id: aluno.id,
        data: hoje,
        hora_checkin: hora,
      })
      if (error) {
        if (error.code === '23505') throw new Error('Você já fez check-in nesta turma hoje!')
        throw error
      }
      setCheckinsHoje(prev => new Set([...prev, turmaId]))
      toast.success('Check-in registrado! Bom treino! 🥋')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRegistrando(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  )

  const hojeFormatado = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
        <p className="text-gray-500 text-sm capitalize">{hojeFormatado}</p>
      </div>

      {turmas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Clock size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Nenhuma turma hoje</p>
          <p className="text-gray-300 text-sm mt-1">Aproveite para descansar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map(turma => {
            const jaFeito = checkinsHoje.has(turma.id)
            const carregando = registrando === turma.id
            const horarioHoje = turma.horarios.filter((h: any) => h.dia_semana === diaSemana)

            return (
              <div key={turma.id} className={`bg-white rounded-2xl border p-4 transition-all ${jaFeito ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{turma.nome}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{turma.modalidade?.nome}</p>
                    {turma.professor && (
                      <p className="text-xs text-gray-400 mt-1">Prof. {turma.professor.nome}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {horarioHoje.map((h: any) => (
                        <span key={h.id} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          {h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => !jaFeito && fazerCheckIn(turma.id)}
                    disabled={jaFeito || carregando}
                    className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      jaFeito
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : carregando
                          ? 'bg-blue-50 text-blue-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    {carregando
                      ? <Loader2 size={22} className="animate-spin" />
                      : jaFeito
                        ? <CheckCircle2 size={24} />
                        : <QrCode size={22} />
                    }
                  </button>
                </div>
                {jaFeito && (
                  <p className="text-xs text-green-600 font-medium mt-3 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Presença registrada hoje
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 text-center">
        Sem telefone? A secretaria também pode registrar sua presença.
      </div>
    </div>
  )
}
