import { useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { differenceInDays, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Clock, UserX, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface Props {
  onClose: () => void
}

export function NotificacoesPanel({ onClose }: Props) {
  const { alunos: todosAlunos, mensalidades: todasMensalidades, turmas: todasTurmas, academiaAtualId } = useStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const turmaIds = new Set(turmas.map(t => t.id))
  const alunos = todosAlunos.filter(a => a.academia_id === academiaAtualId)
  const mensalidades = todasMensalidades.filter(m => turmaIds.has(m.turma_id))
  const hoje = new Date()

  // Vencendo em até 7 dias
  const vencendoBreve = mensalidades.filter(m => {
    if (m.status !== 'pendente') return false
    const dias = differenceInDays(parseISO(m.vencimento), hoje)
    return dias >= 0 && dias <= 7
  })

  // Inadimplentes > 15 dias
  const inadimplentesGraves = alunos.filter(a => {
    const atrasadas = mensalidades.filter(m => m.aluno_id === a.id && m.status === 'atrasado')
    const maxDias = atrasadas.length
      ? Math.max(...atrasadas.map(m => differenceInDays(hoje, parseISO(m.vencimento))))
      : 0
    return maxDias > 15
  })

  // Suspensos
  const suspensos = alunos.filter(a => a.status === 'suspenso')

  const total = vencendoBreve.length + inadimplentesGraves.length + suspensos.length

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{total}</span>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-400 text-sm">Tudo em dia</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {/* Vencendo em breve */}
          {vencendoBreve.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Clock size={11} /> Vencendo nos próximos 7 dias
              </p>
              <div className="space-y-2">
                {vencendoBreve.slice(0, 5).map(m => {
                  const aluno = alunos.find(a => a.id === m.aluno_id)
                  const dias = differenceInDays(parseISO(m.vencimento), hoje)
                  return (
                    <Link
                      key={m.id}
                      to="/pagamentos"
                      onClick={onClose}
                      className="flex items-center justify-between text-xs hover:bg-amber-50 rounded-lg px-2 py-1.5 transition-colors"
                    >
                      <span className="text-gray-700 truncate">{aluno?.nome ?? '—'}</span>
                      <span className={cn(
                        'font-medium shrink-0 ml-2',
                        dias === 0 ? 'text-red-600' : 'text-amber-600'
                      )}>
                        {dias === 0 ? 'Hoje' : `${dias}d`} · {formatCurrency(m.valor)}
                      </span>
                    </Link>
                  )
                })}
                {vencendoBreve.length > 5 && (
                  <p className="text-xs text-gray-400 px-2">+{vencendoBreve.length - 5} mais</p>
                )}
              </div>
            </div>
          )}

          {/* Inadimplentes graves */}
          {inadimplentesGraves.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle size={11} /> Inadimplência grave (&gt;15 dias)
              </p>
              <div className="space-y-2">
                {inadimplentesGraves.slice(0, 5).map(a => (
                  <Link
                    key={a.id}
                    to="/relatorios"
                    onClick={onClose}
                    className="flex items-center justify-between text-xs hover:bg-red-50 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <span className="text-gray-700 truncate">{a.nome}</span>
                    <span className="text-red-600 font-medium shrink-0 ml-2">{a.status === 'suspenso' ? '⚠ Suspenso' : 'Em atraso'}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suspensos */}
          {suspensos.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <UserX size={11} /> Alunos Suspensos
              </p>
              <div className="space-y-2">
                {suspensos.slice(0, 5).map(a => (
                  <Link
                    key={a.id}
                    to={`/alunos/${a.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between text-xs hover:bg-orange-50 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <span className="text-gray-700 truncate">{a.nome}</span>
                    <span className="text-orange-600 font-medium">Suspenso</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
