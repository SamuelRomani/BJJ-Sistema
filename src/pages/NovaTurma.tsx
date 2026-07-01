import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { cn, DIAS_SEMANA_FULL } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import type { Turma, Horario } from '@/types'

type HorarioForm = {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  ativo: boolean
}

const NIVEIS: { value: Turma['nivel']; label: string }[] = [
  { value: 'iniciante',    label: 'Iniciante' },
  { value: 'intermediario',label: 'Intermediário' },
  { value: 'avancado',     label: 'Avançado' },
  { value: 'todos',        label: 'Todos os níveis' },
]

export function NovaTurma() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addTurma, updateTurma, turmas, professores, modalidades, academiaAtualId } = useStore()

  const isEdicao = !!id
  const turmaExistente = isEdicao ? turmas.find(t => t.id === id) : undefined

  const professoresAcademia = professores.filter(p => p.academia_id === academiaAtualId)
  const modalidadesAcademia = modalidades.filter(m => m.academia_id === academiaAtualId)

  const [form, setForm] = useState({
    nome: '',
    modalidade_id: '',
    professor_id: '',
    nivel: 'todos' as Turma['nivel'],
    capacidade_maxima: '20',
    ativa: true,
  })

  const [horarios, setHorarios] = useState<HorarioForm[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dia_semana: i,
      hora_inicio: '07:00',
      hora_fim: '08:30',
      ativo: false,
    }))
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (turmaExistente) {
      setForm({
        nome: turmaExistente.nome,
        modalidade_id: turmaExistente.modalidade_id,
        professor_id: turmaExistente.professor_id,
        nivel: turmaExistente.nivel,
        capacidade_maxima: String(turmaExistente.capacidade_maxima),
        ativa: turmaExistente.ativa,
      })
      setHorarios(
        Array.from({ length: 7 }, (_, i) => {
          const h = turmaExistente.horarios.find(h => h.dia_semana === i)
          return {
            dia_semana: i,
            hora_inicio: h?.hora_inicio ?? '07:00',
            hora_fim: h?.hora_fim ?? '08:30',
            ativo: !!h,
          }
        })
      )
    }
  }, [turmaExistente?.id])

  function setField(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function toggleDia(dia: number) {
    setHorarios(h => h.map(d => d.dia_semana === dia ? { ...d, ativo: !d.ativo } : d))
    setErrors(e => ({ ...e, horarios: '' }))
  }

  function setHorario(dia: number, field: 'hora_inicio' | 'hora_fim', value: string) {
    setHorarios(h => h.map(d => d.dia_semana === dia ? { ...d, [field]: value } : d))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.modalidade_id) errs.modalidade_id = 'Modalidade é obrigatória'
    if (!form.professor_id) errs.professor_id = 'Professor é obrigatório'
    const cap = parseInt(form.capacidade_maxima)
    if (!form.capacidade_maxima || isNaN(cap) || cap < 1) errs.capacidade_maxima = 'Capacidade inválida'
    if (!horarios.some(h => h.ativo)) errs.horarios = 'Selecione ao menos um dia de aula'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    await new Promise(r => setTimeout(r, 500))

    const modalidade = modalidadesAcademia.find(m => m.id === form.modalidade_id)!
    const professor = professoresAcademia.find(p => p.id === form.professor_id)!
    const novoId = crypto.randomUUID()

    const horariosAtivos: Horario[] = horarios
      .filter(h => h.ativo)
      .map((h, i) => ({
        id: crypto.randomUUID(),
        turma_id: isEdicao ? id! : novoId,
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
      }))

    if (isEdicao && turmaExistente) {
      updateTurma(id!, {
        nome: form.nome.trim(),
        modalidade_id: form.modalidade_id,
        modalidade,
        professor_id: form.professor_id,
        professor,
        nivel: form.nivel,
        capacidade_maxima: parseInt(form.capacidade_maxima),
        horarios: horariosAtivos,
        ativa: form.ativa,
      })
      toast.success('Turma atualizada!')
      navigate('/turmas')
    } else {
      const novaTurma: Turma = {
        id: novoId,
        academia_id: academiaAtualId,
        nome: form.nome.trim(),
        modalidade_id: form.modalidade_id,
        modalidade,
        professor_id: form.professor_id,
        professor,
        nivel: form.nivel,
        capacidade_maxima: parseInt(form.capacidade_maxima),
        horarios: horariosAtivos.map(h => ({ ...h, turma_id: novoId })),
        ativa: true,
      }
      addTurma(novaTurma)
      toast.success('Turma criada com sucesso!')
      navigate('/turmas')
    }
    setSaving(false)
  }

  const inputClass = (err?: string) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`

  if (isEdicao && !turmaExistente) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Turma não encontrada.</p>
      <button onClick={() => navigate('/turmas')} className="text-blue-600 text-sm mt-2 block mx-auto">← Voltar</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdicao ? 'Editar Turma' : 'Nova Turma'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEdicao ? `Editando ${turmaExistente?.nome}` : 'Configure a turma e os horários de aula'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados da Turma */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados da Turma</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma *</label>
              <input
                className={inputClass(errors.nome)}
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                placeholder="Ex: BJJ Iniciante Manhã"
              />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade *</label>
              <select
                className={inputClass(errors.modalidade_id)}
                value={form.modalidade_id}
                onChange={e => setField('modalidade_id', e.target.value)}
              >
                <option value="">Selecionar...</option>
                {modalidadesAcademia.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
              {errors.modalidade_id && <p className="text-xs text-red-500 mt-1">{errors.modalidade_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professor *</label>
              <select
                className={inputClass(errors.professor_id)}
                value={form.professor_id}
                onChange={e => setField('professor_id', e.target.value)}
              >
                <option value="">Selecionar...</option>
                {professoresAcademia.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {errors.professor_id && <p className="text-xs text-red-500 mt-1">{errors.professor_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select
                className={inputClass()}
                value={form.nivel}
                onChange={e => setField('nivel', e.target.value)}
              >
                {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade Máxima *</label>
              <input
                type="number"
                min="1"
                max="200"
                className={inputClass(errors.capacidade_maxima)}
                value={form.capacidade_maxima}
                onChange={e => setField('capacidade_maxima', e.target.value)}
                placeholder="20"
              />
              {errors.capacidade_maxima && <p className="text-xs text-red-500 mt-1">{errors.capacidade_maxima}</p>}
            </div>

            {isEdicao && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setField('ativa', !form.ativa)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors relative shrink-0',
                    form.ativa ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-transform',
                    form.ativa ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </button>
                <span className="text-sm text-gray-700">
                  Turma {form.ativa ? 'ativa' : 'inativa'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Horários */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900">Horários de Aula</h2>
            <p className="text-xs text-gray-500 mt-0.5">Selecione os dias e defina os horários</p>
          </div>
          {errors.horarios && (
            <p className="text-xs text-red-500">{errors.horarios}</p>
          )}

          <div className="space-y-2">
            {horarios.map(h => (
              <div
                key={h.dia_semana}
                className={cn(
                  'rounded-lg border transition-all',
                  h.ativo ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {/* Toggle do dia */}
                  <button
                    type="button"
                    onClick={() => toggleDia(h.dia_semana)}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative shrink-0',
                      h.ativo ? 'bg-blue-600' : 'bg-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full bg-white shadow absolute top-0.5 transition-transform',
                      h.ativo ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>

                  <span className={cn(
                    'text-sm font-medium w-20 shrink-0',
                    h.ativo ? 'text-blue-800' : 'text-gray-500'
                  )}>
                    {DIAS_SEMANA_FULL[h.dia_semana]}
                  </span>

                  {h.ativo && (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-500 shrink-0">Início</label>
                        <input
                          type="time"
                          className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          value={h.hora_inicio}
                          onChange={e => setHorario(h.dia_semana, 'hora_inicio', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-500 shrink-0">Fim</label>
                        <input
                          type="time"
                          className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          value={h.hora_fim}
                          onChange={e => setHorario(h.dia_semana, 'hora_fim', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar Turma'}
          </button>
        </div>
      </form>
    </div>
  )
}
