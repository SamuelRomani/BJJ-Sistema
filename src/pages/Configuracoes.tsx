import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  Save, Building2, Clock, Phone, Mail, MapPin, CreditCard, Share2, Globe,
  Plus, Edit2, Trash2, X, Check, Users, Dumbbell, Moon, Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Academia, HorarioFuncionamento, User, Modalidade, Graduacao } from '@/types'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

type Tab = 'geral' | 'horarios' | 'tema' | 'professores' | 'modalidades' | 'faixas'

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function FieldInput({
  label, value, onChange, icon: Icon, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void
  icon?: React.ElementType; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          className={cn(
            'w-full border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            Icon ? 'pl-9 pr-3' : 'px-3'
          )}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────
export function Configuracoes() {
  const {
    academiaAtualId, academias, updateAcademia,
    professores: todosProfessores, addProfessor, updateProfessor,
    modalidades: todasModalidades, addModalidade, updateModalidade,
    graduacoes: todasGraduacoes, addGraduacao, updateGraduacao, removeGraduacao,
    darkMode, toggleDarkMode,
  } = useStore()
  const academia = academias.find(a => a.id === academiaAtualId)

  const professores = todosProfessores.filter(p => p.academia_id === academiaAtualId)
  const modalidades = todasModalidades.filter(m => m.academia_id === academiaAtualId)
  const graduacoes = todasGraduacoes.filter(g => modalidades.some(m => m.id === g.modalidade_id))

  const [form, setForm] = useState<Partial<Academia>>({})
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('geral')

  useEffect(() => {
    if (academia) {
      setForm({ ...academia })
      setHorarios([...academia.horarios_funcionamento])
    }
  }, [academia])

  if (!academia) return <p className="text-gray-500 p-6">Academia não encontrada.</p>

  function setField(field: keyof Academia, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }
  function setHorario(dia: number, field: keyof HorarioFuncionamento, value: string | boolean) {
    setHorarios(h => h.map(d => d.dia_semana === dia ? { ...d, [field]: value } : d))
  }
  async function salvar() {
    setSaving(true)
    try {
      await updateAcademia(academiaAtualId, { ...form, horarios_funcionamento: horarios })
      toast.success('Configurações salvas com sucesso!')
    } catch {
      // errToast already shown by store
    } finally {
      setSaving(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'geral',        label: 'Dados Gerais' },
    { key: 'horarios',     label: 'Horários' },
    { key: 'professores',  label: 'Professores' },
    { key: 'modalidades',  label: 'Modalidades' },
    { key: 'faixas',       label: 'Faixas' },
    { key: 'tema',         label: 'Aparência' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-500" />
            {academia.nome}
          </p>
        </div>
        {(tab === 'geral' || tab === 'horarios') && (
          <button
            onClick={salvar}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {TABS.map(({ key, label }) => (
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

      {/* === GERAL === */}
      {tab === 'geral' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" /> Identidade
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldInput label="Nome da Academia *" value={form.nome ?? ''} onChange={v => setField('nome', v)} placeholder="Ex: TatameHoje SP" />
              </div>
              <FieldInput label="Instagram" value={form.instagram ?? ''} onChange={v => setField('instagram', v)} icon={Share2} placeholder="@academia" />
              <FieldInput label="Website" value={form.website ?? ''} onChange={v => setField('website', v)} icon={Globe} placeholder="www.academia.com.br" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone size={16} className="text-green-500" /> Contato
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Telefone *" value={form.telefone ?? ''} onChange={v => setField('telefone', v)} icon={Phone} placeholder="(11) 99999-9999" />
              <FieldInput label="E-mail *" value={form.email ?? ''} onChange={v => setField('email', v)} icon={Mail} placeholder="contato@academia.com.br" type="email" />
              <div className="sm:col-span-2">
                <FieldInput label="Chave PIX" value={form.pix ?? ''} onChange={v => setField('pix', v)} icon={CreditCard} placeholder="CNPJ, CPF, email ou telefone" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-red-500" /> Endereço
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FieldInput label="Logradouro *" value={form.endereco ?? ''} onChange={v => setField('endereco', v)} icon={MapPin} placeholder="Rua das Lutas, 123" />
              </div>
              <FieldInput label="CEP" value={form.cep ?? ''} onChange={v => setField('cep', v)} placeholder="00000-000" />
              <FieldInput label="Bairro" value={form.bairro ?? ''} onChange={v => setField('bairro', v)} placeholder="Vila Mariana" />
              <FieldInput label="Cidade *" value={form.cidade ?? ''} onChange={v => setField('cidade', v)} placeholder="São Paulo" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.estado ?? ''}
                  onChange={e => setField('estado', e.target.value)}
                >
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === HORÁRIOS === */}
      {tab === 'horarios' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900">Horários de Funcionamento</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {horarios.map(h => (
              <div key={h.dia_semana} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{DIAS[h.dia_semana]}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setHorario(h.dia_semana, 'fechado', !h.fechado)}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative',
                      !h.fechado ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      !h.fechado ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className={cn('text-xs font-medium', !h.fechado ? 'text-green-600' : 'text-gray-400')}>
                    {!h.fechado ? 'Aberto' : 'Fechado'}
                  </span>
                </label>
                {!h.fechado && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input type="time" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={h.abertura} onChange={e => setHorario(h.dia_semana, 'abertura', e.target.value)} />
                    <span className="text-gray-400 text-sm">até</span>
                    <input type="time" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={h.fechamento} onChange={e => setHorario(h.dia_semana, 'fechamento', e.target.value)} />
                  </div>
                )}
                {h.fechado && <span className="ml-auto text-xs text-gray-400 italic">Sem funcionamento</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === PROFESSORES === */}
      {tab === 'professores' && (
        <ProfessoresTab
          professores={professores}
          academiaId={academiaAtualId}
          onAdd={addProfessor}
          onUpdate={updateProfessor}
        />
      )}

      {/* === MODALIDADES === */}
      {tab === 'modalidades' && (
        <ModalidadesTab
          modalidades={modalidades}
          academiaId={academiaAtualId}
          onAdd={addModalidade}
          onUpdate={updateModalidade}
        />
      )}

      {/* === FAIXAS === */}
      {tab === 'faixas' && (
        <FaixasTab
          graduacoes={graduacoes}
          modalidades={modalidades}
          onAdd={addGraduacao}
          onUpdate={updateGraduacao}
          onRemove={removeGraduacao}
        />
      )}

      {/* === APARÊNCIA === */}
      {tab === 'tema' && (
        <div className="space-y-5">
          {/* Dark mode toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  {darkMode ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-amber-500" />}
                  Modo {darkMode ? 'Escuro' : 'Claro'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {darkMode ? 'Interface com fundo escuro, ideal para uso noturno.' : 'Interface padrão com fundo claro.'}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative shrink-0',
                  darkMode ? 'bg-indigo-500' : 'bg-gray-300'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  darkMode ? 'translate-x-6' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          </div>

          {/* Cores */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h2 className="font-semibold text-gray-900">Cores do Sistema</h2>
            <p className="text-sm text-gray-500">Usadas em certificados e comunicações da academia.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {([
                ['cor_primaria', 'Cor Primária', 'Cabeçalhos e botões'],
                ['cor_secundaria', 'Cor Secundária', 'Elementos de apoio'],
                ['cor_destaque', 'Cor de Destaque', 'Badges e alertas'],
              ] as const).map(([key, label, desc]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      value={form.tema?.[key] ?? '#000000'}
                      onChange={e => setForm(f => ({ ...f, tema: { ...f.tema!, [key]: e.target.value } }))}
                    />
                    <div>
                      <p className="text-sm font-mono text-gray-700">{form.tema?.[key]}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: form.tema?.[key] ?? '#000' }}
                  >Exemplo</div>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
              <div className="h-10 flex items-center px-4" style={{ backgroundColor: form.tema?.cor_primaria ?? '#1e40af' }}>
                <span className="text-white text-sm font-bold">{form.nome ?? academia.nome}</span>
              </div>
              <div className="p-4 flex items-center gap-3">
                <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: form.tema?.cor_primaria ?? '#1e40af' }}>Primário</button>
                <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: form.tema?.cor_secundaria ?? '#3b82f6' }}>Secundário</button>
                <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: form.tema?.cor_destaque ?? '#f59e0b' }}>Badge</span>
              </div>
            </div>
            <button
              onClick={salvar}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Save size={16} />{saving ? 'Salvando...' : 'Salvar Cores'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Professores Tab
// ──────────────────────────────────────────────────────────
function ProfessoresTab({
  professores, academiaId, onAdd, onUpdate
}: {
  professores: User[]
  academiaId: string
  onAdd: (p: User) => void
  onUpdate: (id: string, data: Partial<User>) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', email: '', foto_url: '' })

  function resetForm() { setForm({ nome: '', email: '', foto_url: '' }); setEditId(null); setShowForm(false) }

  function startEdit(p: User) {
    setForm({ nome: p.nome, email: p.email, foto_url: p.foto_url ?? '' })
    setEditId(p.id)
    setShowForm(true)
  }

  function salvar() {
    if (!form.nome.trim() || !form.email.trim()) { toast.error('Nome e email são obrigatórios'); return }
    if (editId) {
      onUpdate(editId, { nome: form.nome, email: form.email, foto_url: form.foto_url || undefined })
      toast.success('Professor atualizado!')
    } else {
      onAdd({
        id: crypto.randomUUID(),
        nome: form.nome,
        email: form.email,
        foto_url: form.foto_url || undefined,
        role: 'professor',
        academia_id: academiaId,
      })
      toast.success('Professor cadastrado!')
    }
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">Professores</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{professores.length}</span>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Novo Professor
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-fade-in">
          <h3 className="font-semibold text-blue-800 text-sm">{editId ? 'Editar professor' : 'Novo professor'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="professor@academia.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={salvar} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Check size={14} /> {editId ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button onClick={resetForm} className="flex items-center gap-1.5 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {professores.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Nenhum professor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {professores.map((p, i) => (
            <div key={p.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-gray-50')}>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                {p.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{p.nome}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium shrink-0">Professor</span>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => { onUpdate(p.id, { role: 'inativo' as any }); toast.success('Professor desativado') }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Desativar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Modalidades Tab
// ──────────────────────────────────────────────────────────
function ModalidadesTab({
  modalidades, academiaId, onAdd, onUpdate
}: {
  modalidades: Modalidade[]
  academiaId: string
  onAdd: (m: Modalidade) => void
  onUpdate: (id: string, data: Partial<Modalidade>) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '', tem_graus: false, max_graus: 4 })

  function resetForm() { setForm({ nome: '', descricao: '', tem_graus: false, max_graus: 4 }); setEditId(null); setShowForm(false) }

  function startEdit(m: Modalidade) {
    setForm({ nome: m.nome, descricao: m.descricao ?? '', tem_graus: m.tem_graus ?? false, max_graus: m.max_graus ?? 4 })
    setEditId(m.id)
    setShowForm(true)
  }

  function salvar() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (editId) {
      onUpdate(editId, { nome: form.nome, descricao: form.descricao || undefined, tem_graus: form.tem_graus, max_graus: form.max_graus })
      toast.success('Modalidade atualizada!')
    } else {
      onAdd({
        id: crypto.randomUUID(),
        nome: form.nome,
        descricao: form.descricao || undefined,
        academia_id: academiaId,
        tem_graus: form.tem_graus,
        max_graus: form.max_graus,
      })
      toast.success('Modalidade cadastrada!')
    }
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900">Modalidades</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{modalidades.length}</span>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Nova Modalidade
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-fade-in">
          <h3 className="font-semibold text-amber-800 text-sm">{editId ? 'Editar modalidade' : 'Nova modalidade'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Jiu-Jitsu, Muay Thai..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, tem_graus: !f.tem_graus }))}
                className={cn('w-9 h-5 rounded-full transition-colors relative', form.tem_graus ? 'bg-blue-500' : 'bg-gray-300')}
              >
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.tem_graus ? 'translate-x-4' : 'translate-x-0.5')} />
              </div>
              <span className="text-sm text-gray-700">Sistema de graus/stripes</span>
            </label>
            {form.tem_graus && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-semibold">Máx. graus:</label>
                <select
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.max_graus}
                  onChange={e => setForm(f => ({ ...f, max_graus: Number(e.target.value) }))}
                >
                  {[2,3,4,5].map(n => <option key={n} value={n}>{n} graus</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={salvar} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Check size={14} /> {editId ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button onClick={resetForm} className="flex items-center gap-1.5 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {modalidades.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Dumbbell size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma modalidade cadastrada ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {modalidades.map((m, i) => (
            <div key={m.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-gray-50')}>
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Dumbbell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.nome}</p>
                <p className="text-xs text-gray-400">{m.descricao || (m.tem_graus ? `Sistema de graus (máx. ${m.max_graus ?? 4})` : 'Sem sistema de graus')}</p>
              </div>
              {m.tem_graus && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Com graus</span>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Faixas Tab
// ──────────────────────────────────────────────────────────
function FaixasTab({
  graduacoes, modalidades, onAdd, onUpdate, onRemove,
}: {
  graduacoes: Graduacao[]
  modalidades: Modalidade[]
  onAdd: (g: Graduacao) => void
  onUpdate: (id: string, data: Partial<Graduacao>) => void
  onRemove: (id: string) => void
}) {
  const [filtroModalidadeId, setFiltroModalidadeId] = useState(modalidades[0]?.id ?? '')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', cor_hex: '#ffffff', sequencia: 1, tempo_minimo_dias: '' })

  const faixasDaModalidade = graduacoes
    .filter(g => g.modalidade_id === filtroModalidadeId)
    .sort((a, b) => a.sequencia - b.sequencia)

  function resetForm() {
    setShowForm(false)
    setEditId(null)
    const proxSeq = (faixasDaModalidade[faixasDaModalidade.length - 1]?.sequencia ?? 0) + 1
    setForm({ nome: '', cor_hex: '#ffffff', sequencia: proxSeq, tempo_minimo_dias: '' })
  }

  function startEdit(g: Graduacao) {
    setEditId(g.id)
    setForm({ nome: g.nome, cor_hex: g.cor_hex, sequencia: g.sequencia, tempo_minimo_dias: g.tempo_minimo_dias ? String(g.tempo_minimo_dias) : '' })
    setShowForm(true)
  }

  function salvar() {
    if (!form.nome.trim()) return toast.error('Nome da faixa é obrigatório')
    if (!filtroModalidadeId) return toast.error('Selecione uma modalidade')
    const payload: Graduacao = {
      id: editId ?? crypto.randomUUID(),
      modalidade_id: filtroModalidadeId,
      nome: form.nome.trim(),
      cor_hex: form.cor_hex,
      sequencia: Number(form.sequencia),
      tempo_minimo_dias: form.tempo_minimo_dias ? Number(form.tempo_minimo_dias) : undefined,
    }
    if (editId) {
      onUpdate(editId, payload)
      toast.success('Faixa atualizada!')
    } else {
      onAdd(payload)
      toast.success('Faixa cadastrada!')
    }
    resetForm()
  }

  const modalidadeAtual = modalidades.find(m => m.id === filtroModalidadeId)

  return (
    <div className="space-y-4">
      {/* Seletor de modalidade */}
      {modalidades.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {modalidades.map(m => (
            <button
              key={m.id}
              onClick={() => { setFiltroModalidadeId(m.id); resetForm() }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filtroModalidadeId === m.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
              )}
            >{m.nome}</button>
          ))}
        </div>
      )}

      {modalidades.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Cadastre uma modalidade primeiro na aba <strong>Modalidades</strong>.</p>
        </div>
      ) : (
        <>
          {/* Lista de faixas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">
                Faixas — {modalidadeAtual?.nome}
                <span className="ml-2 text-xs text-gray-400 font-normal">({faixasDaModalidade.length} cadastradas)</span>
              </h3>
              {!showForm && (
                <button
                  onClick={() => { resetForm(); setShowForm(true) }}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Nova Faixa
                </button>
              )}
            </div>

            {faixasDaModalidade.length === 0 && !showForm ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">🥋</span>
                </div>
                <p className="text-gray-500 text-sm">Nenhuma faixa cadastrada para esta modalidade.</p>
                <button
                  onClick={() => { resetForm(); setShowForm(true) }}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >+ Adicionar primeira faixa</button>
              </div>
            ) : (
              <div>
                {faixasDaModalidade.map((g, i) => (
                  <div key={g.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-gray-50')}>
                    <span className="text-xs text-gray-400 w-5 shrink-0 text-right">{g.sequencia}</span>
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: g.cor_hex }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{g.nome}</p>
                      {g.tempo_minimo_dias && (
                        <p className="text-xs text-gray-400">Mín. {Math.round(g.tempo_minimo_dias / 30)} meses</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(g)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Excluir faixa "${g.nome}"?`)) { onRemove(g.id); toast.success('Faixa removida!') } }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form inline */}
            {showForm && (
              <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {editId ? 'Editar Faixa' : 'Nova Faixa'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Branca, Azul..."
                      value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sequência</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.sequencia}
                      onChange={e => setForm(f => ({ ...f, sequencia: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
                        value={form.cor_hex}
                        onChange={e => setForm(f => ({ ...f, cor_hex: e.target.value }))}
                      />
                      <div
                        className="flex-1 h-8 rounded-lg border border-gray-200 flex items-center px-2"
                        style={{ backgroundColor: form.cor_hex }}
                      >
                        <span className="text-xs font-mono" style={{ color: isEscuro(form.cor_hex) ? '#fff' : '#374151' }}>{form.cor_hex}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tempo mínimo (dias)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 365"
                      value={form.tempo_minimo_dias}
                      onChange={e => setForm(f => ({ ...f, tempo_minimo_dias: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={salvar} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Check size={14} /> {editId ? 'Atualizar' : 'Cadastrar'}
                  </button>
                  <button onClick={resetForm} className="flex items-center gap-1.5 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function isEscuro(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}
