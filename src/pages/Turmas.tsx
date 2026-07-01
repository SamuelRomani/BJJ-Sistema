import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { DIAS_SEMANA, cn } from '@/lib/utils'
import { Clock, QrCode, Plus, Edit2 } from 'lucide-react'

export function Turmas() {
  const { turmas: todasTurmas, checkIns, academiaAtualId } = useStore()
  const turmas = todasTurmas.filter(t => t.academia_id === academiaAtualId)
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500 text-sm">{turmas.filter(t => t.ativa).length} turmas ativas</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/checkin"
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <QrCode size={16} />
            Check-in
          </Link>
          <Link
            to="/turmas/nova"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            Nova Turma
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {turmas.map(turma => {
          const checkInsHoje = checkIns.filter(c => c.turma_id === turma.id && c.data === hoje).length
          const ocupacaoHoje = Math.round((checkInsHoje / turma.capacidade_maxima) * 100)
          const checkInsTotal = checkIns.filter(c => c.turma_id === turma.id).length

          return (
            <div key={turma.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{turma.nome}</h3>
                  <p className="text-sm text-gray-500">{turma.modalidade.nome} · {turma.professor?.nome}</p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  turma.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {turma.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {turma.horarios.map(h => (
                    <span key={h.id} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                      {DIAS_SEMANA[h.dia_semana]} {h.hora_inicio}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ocupação de hoje */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Check-ins hoje</span>
                  <span className={cn(
                    'font-bold',
                    checkInsHoje >= turma.capacidade_maxima ? 'text-red-600' : 'text-gray-700'
                  )}>
                    {checkInsHoje}/{turma.capacidade_maxima}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={cn('h-1.5 rounded-full transition-all', {
                      'bg-green-500': ocupacaoHoje < 70,
                      'bg-amber-500': ocupacaoHoje >= 70 && ocupacaoHoje < 100,
                      'bg-red-500': ocupacaoHoje >= 100,
                    })}
                    style={{ width: `${Math.min(ocupacaoHoje, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  turma.nivel === 'iniciante' ? 'bg-blue-100 text-blue-700' :
                  turma.nivel === 'intermediario' ? 'bg-amber-100 text-amber-700' :
                  turma.nivel === 'avancado' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {turma.nivel.charAt(0).toUpperCase() + turma.nivel.slice(1)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{checkInsTotal} check-ins</span>
                  <Link
                    to={`/checkin?turma=${turma.id}`}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Check-in"
                  >
                    <QrCode size={14} />
                  </Link>
                  <Link
                    to={`/turmas/${turma.id}/editar`}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Editar turma"
                  >
                    <Edit2 size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
