import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { formatCurrency, cn } from '@/lib/utils'
import { Package, Plus, Edit2, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Pacote, Periodicidade } from '@/types'

const PERIODICIDADE_CONFIG: Record<Periodicidade, { label: string; meses: number; badge: string }> = {
  mensal:      { label: 'Mensal',      meses: 1,  badge: 'bg-blue-100 text-blue-700' },
  trimestral:  { label: 'Trimestral',  meses: 3,  badge: 'bg-purple-100 text-purple-700' },
  semestral:   { label: 'Semestral',   meses: 6,  badge: 'bg-amber-100 text-amber-700' },
  anual:       { label: 'Anual',       meses: 12, badge: 'bg-green-100 text-green-700' },
}

function valorMensal(valor: number, periodicidade: Periodicidade) {
  const meses = PERIODICIDADE_CONFIG[periodicidade].meses
  return meses === 1 ? null : valor / meses
}

const FORM_VAZIO = {
  nome: '',
  descricao: '',
  modalidade_id: '',
  valor: '',
  periodicidade: 'mensal' as Periodicidade,
  numero_aulas_semana: '',
}

type FormState = typeof FORM_VAZIO

export function Pacotes() {
  const { pacotes, addPacote, updatePacote, modalidades, alunos, academiaAtualId } = useStore()

  const pacotesAcademia = pacotes.filter(p => p.academia_id === academiaAtualId)
  const modalidadesAcademia = modalidades.filter(m => m.academia_id === academiaAtualId)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function alunosNoPacote(pacoteId: string) {
    return alunos.filter(a => a.academia_id === academiaAtualId && a.pacote_id === pacoteId).length
  }

  function setField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    const v = parseFloat(form.valor)
    if (!form.valor || isNaN(v) || v <= 0) errs.valor = 'Valor inválido'
    return errs
  }

  function abrirEdicao(p: Pacote) {
    setEditandoId(p.id)
    setShowNovo(false)
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      modalidade_id: p.modalidade_id ?? '',
      valor: String(p.valor),
      periodicidade: p.periodicidade,
      numero_aulas_semana: p.numero_aulas_semana ? String(p.numero_aulas_semana) : '',
    })
    setErrors({})
  }

  function salvarEdicao() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    updatePacote(editandoId!, {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      modalidade_id: form.modalidade_id || undefined,
      valor: parseFloat(form.valor),
      periodicidade: form.periodicidade,
      numero_aulas_semana: form.numero_aulas_semana ? parseInt(form.numero_aulas_semana) : undefined,
    })
    toast.success('Pacote atualizado!')
    setEditandoId(null)
  }

  function criarPacote() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    addPacote({
      id: crypto.randomUUID(),
      academia_id: academiaAtualId,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      modalidade_id: form.modalidade_id || undefined,
      valor: parseFloat(form.valor),
      periodicidade: form.periodicidade,
      numero_aulas_semana: form.numero_aulas_semana ? parseInt(form.numero_aulas_semana) : undefined,
      ativo: true,
    })
    toast.success('Pacote criado!')
    setShowNovo(false)
    setForm(FORM_VAZIO)
  }

  function toggleAtivo(p: Pacote) {
    updatePacote(p.id, { ativo: !p.ativo })
    toast.success(p.ativo ? 'Pacote desativado' : 'Pacote reativado')
  }

  function cancelar() {
    setEditandoId(null)
    setShowNovo(false)
    setForm(FORM_VAZIO)
    setErrors({})
  }

  const inputCls = (err?: string) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`

  function FormPacote({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
    const mensal = valorMensal(parseFloat(form.valor) || 0, form.periodicidade)
    return (
      <div className="border border-blue-200 rounded-xl p-5 bg-blue-50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Pacote *</label>
            <input
              className={inputCls(errors.nome)}
              value={form.nome}
              onChange={e => setField('nome', e.target.value)}
              placeholder="Ex: BJJ Mensal Ilimitado"
            />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modalidade (opcional)</label>
            <select className={inputCls()} value={form.modalidade_id} onChange={e => setField('modalidade_id', e.target.value)}>
              <option value="">Todas as modalidades</option>
              {modalidadesAcademia.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Periodicidade</label>
            <select className={inputCls()} value={form.periodicidade} onChange={e => setField('periodicidade', e.target.value)}>
              {Object.entries(PERIODICIDADE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valor ({PERIODICIDADE_CONFIG[form.periodicidade].label}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={cn(inputCls(errors.valor), 'pl-9')}
                value={form.valor}
                onChange={e => setField('valor', e.target.value)}
                placeholder="200,00"
              />
            </div>
            {errors.valor && <p className="text-xs text-red-500 mt-1">{errors.valor}</p>}
            {mensal && form.periodicidade !== 'mensal' && (
              <p className="text-xs text-gray-500 mt-1">≈ {formatCurrency(mensal)}/mês</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aulas/semana (opcional)</label>
            <input
              type="number"
              min="1"
              max="7"
              className={inputCls()}
              value={form.numero_aulas_semana}
              onChange={e => setField('numero_aulas_semana', e.target.value)}
              placeholder="Ilimitado"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (opcional)</label>
            <input
              className={inputCls()}
              value={form.descricao}
              onChange={e => setField('descricao', e.target.value)}
              placeholder="Benefícios incluídos, condições especiais..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-white text-gray-600">
            Cancelar
          </button>
          <button onClick={onSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Save size={14} /> Salvar
          </button>
        </div>
      </div>
    )
  }

  // Resumo de receita potencial
  const receitaMensalEstimada = pacotesAcademia
    .filter(p => p.ativo)
    .reduce((total, p) => {
      const qtd = alunosNoPacote(p.id)
      const mensal = p.valor / PERIODICIDADE_CONFIG[p.periodicidade].meses
      return total + qtd * mensal
    }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
          <p className="text-gray-500 text-sm">Planos e valores de mensalidade da academia</p>
        </div>
        {!showNovo && editandoId === null && (
          <button
            onClick={() => { setShowNovo(true); setForm(FORM_VAZIO) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} /> Novo Pacote
          </button>
        )}
      </div>

      {/* Card de receita estimada */}
      {receitaMensalEstimada > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-blue-200 text-sm">Receita mensal estimada (alunos com pacote)</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(receitaMensalEstimada)}</p>
          <p className="text-blue-200 text-xs mt-1">
            Baseado em {alunos.filter(a => a.academia_id === academiaAtualId && a.pacote_id).length} alunos com pacote ativo
          </p>
        </div>
      )}

      {/* Formulário novo */}
      {showNovo && (
        <FormPacote onSave={criarPacote} onCancel={cancelar} />
      )}

      {/* Lista de pacotes */}
      <div className="space-y-3">
        {pacotesAcademia.length === 0 && !showNovo && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum pacote cadastrado ainda.</p>
            <button
              onClick={() => setShowNovo(true)}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Criar primeiro pacote →
            </button>
          </div>
        )}

        {pacotesAcademia.map(p => {
          const cfg = PERIODICIDADE_CONFIG[p.periodicidade]
          const mensal = valorMensal(p.valor, p.periodicidade)
          const qtdAlunos = alunosNoPacote(p.id)
          const isEditando = editandoId === p.id

          return (
            <div key={p.id} className={cn(
              'bg-white rounded-xl border transition-all',
              !p.ativo ? 'border-gray-100 opacity-60' : 'border-gray-200',
              isEditando && 'border-blue-300 shadow-md'
            )}>
              {isEditando ? (
                <div className="p-5">
                  <FormPacote onSave={salvarEdicao} onCancel={cancelar} />
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{p.nome}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.badge)}>
                          {cfg.label}
                        </span>
                        {p.modalidade_id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {modalidadesAcademia.find(m => m.id === p.modalidade_id)?.nome}
                          </span>
                        )}
                        {p.numero_aulas_semana && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            {p.numero_aulas_semana}x/semana
                          </span>
                        )}
                        {!p.ativo && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Inativo
                          </span>
                        )}
                      </div>
                      {p.descricao && (
                        <p className="text-sm text-gray-500 mt-1">{p.descricao}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(p.valor)}</p>
                      <p className="text-xs text-gray-400">/{cfg.label.toLowerCase()}</p>
                      {mensal && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          ≈ {formatCurrency(mensal)}/mês
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {qtdAlunos} aluno{qtdAlunos !== 1 ? 's' : ''} neste plano
                      </span>
                      {qtdAlunos > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {formatCurrency(p.valor / cfg.meses * qtdAlunos)}/mês gerado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAtivo(p)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                          p.ativo
                            ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        )}
                      >
                        {p.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                      <button
                        onClick={() => abrirEdicao(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
