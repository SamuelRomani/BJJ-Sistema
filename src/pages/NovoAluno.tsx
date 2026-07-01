import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { mockModalidades, mockGraduacoes } from '@/data/mockData'
import { validateCPF, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Save, FileText, Eye } from 'lucide-react'
import type { Aluno, HistoricoFaixa, Academia, Pacote } from '@/types'
import jsPDF from 'jspdf'

function gerarContrato(aluno: Aluno, academia: Academia, pacote?: Pacote) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 45, 'F')
  doc.setTextColor(251, 191, 36)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('CONTRATO DE MATRÍCULA', W / 2, 18, { align: 'center' })
  doc.setTextColor(200, 210, 230)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(academia.nome, W / 2, 28, { align: 'center' })
  doc.text(`${academia.endereco}, ${academia.bairro} — ${academia.cidade}/${academia.estado}`, W / 2, 35, { align: 'center' })

  let y = 57

  // Seção: Dados da Academia
  function secao(titulo: string) {
    doc.setFillColor(240, 245, 255)
    doc.rect(14, y - 4, W - 28, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 60, 120)
    doc.text(titulo.toUpperCase(), 16, y + 1)
    y += 9
  }

  function linha(label: string, valor: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(label + ':', 16, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(valor, 60, y)
    y += 6.5
  }

  secao('Dados do Contratante (Academia)')
  linha('Razão Social', academia.nome)
  linha('Telefone', academia.telefone)
  linha('Email', academia.email)
  if (academia.pix) linha('PIX', academia.pix)
  y += 4

  secao('Dados do Aluno (Contratado)')
  linha('Nome Completo', aluno.nome)
  linha('CPF', aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'))
  linha('Email', aluno.email)
  linha('Telefone', aluno.telefone)
  linha('Modalidade', aluno.modalidade_principal.nome)
  linha('Graduação Inicial', aluno.graduacao_atual?.nome ?? '—')
  linha('Data de Matrícula', new Date(aluno.data_matricula + 'T00:00:00').toLocaleDateString('pt-BR'))
  y += 4

  if (pacote) {
    secao('Plano Contratado')
    linha('Plano', pacote.nome)
    linha('Valor', formatCurrency(pacote.valor))
    linha('Periodicidade', pacote.periodicidade.charAt(0).toUpperCase() + pacote.periodicidade.slice(1))
    if (pacote.descricao) linha('Descrição', pacote.descricao)
    y += 4
  }

  secao('Cláusulas e Condições')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  const clausulas = [
    '1. O aluno compromete-se a seguir as normas de conduta e regulamento interno da academia.',
    '2. O pagamento das mensalidades deve ser efetuado até o vencimento acordado. Atrasos superiores a 15 dias',
    '   implicarão na suspensão temporária do acesso às aulas.',
    '3. A academia reserva o direito de cancelar a matrícula em caso de comportamento inadequado.',
    '4. O aluno autoriza a academia a utilizar sua imagem em materiais de divulgação relacionados ao esporte,',
    '   salvo manifestação expressa em contrário.',
    '5. O cancelamento da matrícula deve ser solicitado com 30 dias de antecedência.',
    '6. A academia não se responsabiliza por objetos esquecidos nas dependências.',
  ]
  clausulas.forEach(c => { doc.text(c, 16, y); y += 5.5 })
  y += 6

  // Assinaturas
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(14, y, 90, y)
  doc.line(120, y, W - 14, y)
  y += 5
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Academia — Responsável', 52, y, { align: 'center' })
  doc.text('Aluno / Responsável', (120 + W - 14) / 2, y, { align: 'center' })
  y += 10
  doc.text(`Local e data: _________________, _____/_____/________`, 14, y)

  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text(`Gerado automaticamente pelo TatameHoje em ${new Date().toLocaleDateString('pt-BR')}`, W / 2, 290, { align: 'center' })

  doc.save(`contrato-${aluno.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  toast.success('Contrato gerado!')
}

export function NovoAluno() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addAluno, updateAluno, alunos, academiaAtualId, pacotes, academias } = useStore()
  const academia = academias.find(a => a.id === academiaAtualId)
  const pacotesAcademia = pacotes.filter(p => p.academia_id === academiaAtualId && p.ativo)

  const isEdicao = !!id
  const alunoExistente = isEdicao ? alunos.find(a => a.id === id) : undefined

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    modalidade_id: '',
    graduacao_inicial_id: '',
    data_faixa_inicial: '',
    status: 'ativo' as Aluno['status'],
    pacote_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [alunoRecenteCriado, setAlunoRecenteCriado] = useState<Aluno | null>(null)

  // Pré-popula o formulário no modo edição
  useEffect(() => {
    if (alunoExistente) {
      const ultimaFaixa = [...alunoExistente.historico_faixas].sort(
        (a, b) => new Date(a.data_promocao).getTime() - new Date(b.data_promocao).getTime()
      ).slice(-1)[0]

      setForm({
        nome: alunoExistente.nome,
        cpf: alunoExistente.cpf,
        email: alunoExistente.email,
        telefone: alunoExistente.telefone,
        data_nascimento: alunoExistente.data_nascimento,
        modalidade_id: alunoExistente.modalidade_principal_id,
        graduacao_inicial_id: ultimaFaixa?.graduacao_id ?? '',
        data_faixa_inicial: ultimaFaixa?.data_promocao ?? '',
        status: alunoExistente.status,
        pacote_id: alunoExistente.pacote_id ?? '',
      })
    }
  }, [alunoExistente?.id])

  const graduacoesFiltradas = form.modalidade_id
    ? mockGraduacoes.filter(g => g.modalidade_id === form.modalidade_id).sort((a, b) => a.sequencia - b.sequencia)
    : []

  const modalidadeSelecionada = mockModalidades.find(m => m.id === form.modalidade_id)
  const graduacaoSelecionada = mockGraduacoes.find(g => g.id === form.graduacao_inicial_id)

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
    if (field === 'modalidade_id') {
      setForm(f => ({ ...f, modalidade_id: value, graduacao_inicial_id: '' }))
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.cpf.trim()) errs.cpf = 'CPF é obrigatório'
    else if (!validateCPF(form.cpf)) errs.cpf = 'CPF inválido'
    else {
      const cpfLimpo = form.cpf.replace(/\D/g, '')
      const duplicado = alunos.find(a => a.cpf.replace(/\D/g, '') === cpfLimpo && a.id !== id)
      if (duplicado) errs.cpf = 'CPF já cadastrado'
    }
    if (!form.email.trim()) errs.email = 'Email é obrigatório'
    if (!form.telefone.trim()) errs.telefone = 'Telefone é obrigatório'
    if (!form.data_nascimento) errs.data_nascimento = 'Data de nascimento é obrigatória'
    if (!form.modalidade_id) errs.modalidade_id = 'Modalidade é obrigatória'
    if (!form.graduacao_inicial_id) errs.graduacao_inicial_id = 'Graduação é obrigatória'
    if (!form.data_faixa_inicial) errs.data_faixa_inicial = 'Data da faixa é obrigatória'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    await new Promise(r => setTimeout(r, 500))

    if (isEdicao && alunoExistente) {
      // Modo edição: atualiza apenas os campos editáveis
      const pacoteSelecionado = pacotesAcademia.find(p => p.id === form.pacote_id)
      updateAluno(id, {
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        email: form.email.trim(),
        telefone: form.telefone.replace(/\D/g, ''),
        data_nascimento: form.data_nascimento,
        status: form.status,
        modalidade_principal_id: form.modalidade_id,
        modalidade_principal: modalidadeSelecionada ?? alunoExistente.modalidade_principal,
        pacote_id: form.pacote_id || undefined,
        pacote: pacoteSelecionado,
      })
      toast.success('Dados do aluno atualizados!')
      navigate(`/alunos/${id}`)
    } else {
      // Modo criação
      const novoId = crypto.randomUUID()
      const historicoFaixa: HistoricoFaixa = {
        id: crypto.randomUUID(),
        aluno_id: novoId,
        graduacao_id: form.graduacao_inicial_id,
        graduacao: graduacaoSelecionada!,
        data_promocao: form.data_faixa_inicial,
      }

      const pacoteSelecionado = pacotesAcademia.find(p => p.id === form.pacote_id)
      const novoAluno: Aluno = {
        id: novoId,
        academia_id: academiaAtualId,
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        email: form.email.trim(),
        telefone: form.telefone.replace(/\D/g, ''),
        data_nascimento: form.data_nascimento,
        status: form.status,
        modalidade_principal_id: form.modalidade_id,
        modalidade_principal: modalidadeSelecionada!,
        graduacao_atual_id: form.graduacao_inicial_id,
        graduacao_atual: graduacaoSelecionada,
        historico_faixas: [historicoFaixa],
        data_matricula: new Date().toISOString().split('T')[0],
        pacote_id: form.pacote_id || undefined,
        pacote: pacoteSelecionado,
      }

      addAluno(novoAluno)
      toast.success('Aluno cadastrado com sucesso!')
      setAlunoRecenteCriado(novoAluno)
    }
    setSaving(false)
  }

  function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  const inputClass = (err?: string) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`

  if (isEdicao && !alunoExistente) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Aluno não encontrado.</p>
      <button onClick={() => navigate('/alunos')} className="text-blue-600 text-sm mt-2 block mx-auto">← Voltar</button>
    </div>
  )

  // Tela de sucesso após criação
  if (alunoRecenteCriado && !isEdicao) {
    const pacoteCriado = pacotesAcademia.find(p => p.id === alunoRecenteCriado.pacote_id)
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Save size={28} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aluno cadastrado!</h2>
            <p className="text-gray-500 mt-1">{alunoRecenteCriado.nome} foi adicionado com sucesso.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                if (academia) gerarContrato(alunoRecenteCriado, academia, pacoteCriado)
              }}
              className="flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors font-medium"
            >
              <FileText size={18} /> Gerar Contrato PDF
            </button>
            <button
              onClick={() => navigate(`/alunos/${alunoRecenteCriado.id}`)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye size={18} /> Ver Perfil
            </button>
          </div>
          <button onClick={() => navigate('/alunos')} className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
            ← Voltar para lista de alunos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdicao ? 'Editar Aluno' : 'Novo Aluno'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEdicao ? `Editando dados de ${alunoExistente?.nome}` : 'Preencha os dados e selecione a graduação inicial'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome Completo *" error={errors.nome}>
              <input
                className={inputClass(errors.nome)}
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                placeholder="João da Silva"
              />
            </Field>
            <Field label="CPF *" error={errors.cpf}>
              <input
                className={inputClass(errors.cpf)}
                value={form.cpf}
                onChange={e => setField('cpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </Field>
            <Field label="Email *" error={errors.email}>
              <input
                type="email"
                className={inputClass(errors.email)}
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="joao@email.com"
              />
            </Field>
            <Field label="Telefone *" error={errors.telefone}>
              <input
                className={inputClass(errors.telefone)}
                value={form.telefone}
                onChange={e => setField('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </Field>
            <Field label="Data de Nascimento *" error={errors.data_nascimento}>
              <input
                type="date"
                className={inputClass(errors.data_nascimento)}
                value={form.data_nascimento}
                onChange={e => setField('data_nascimento', e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass()}
                value={form.status}
                onChange={e => setField('status', e.target.value)}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Graduação */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Modalidade & Graduação</h2>
            {isEdicao && (
              <p className="text-xs text-gray-400">Para promover faixa, use a página Graduações</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Modalidade Principal *" error={errors.modalidade_id}>
              <select
                className={inputClass(errors.modalidade_id)}
                value={form.modalidade_id}
                onChange={e => {
                  setErrors(er => ({ ...er, modalidade_id: '' }))
                  setForm(f => ({ ...f, modalidade_id: e.target.value, graduacao_inicial_id: '' }))
                }}
              >
                <option value="">Selecionar modalidade...</option>
                {mockModalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
            <Field label={isEdicao ? 'Data da Faixa Atual *' : 'Data da Faixa Inicial *'} error={errors.data_faixa_inicial}>
              <input
                type="date"
                className={inputClass(errors.data_faixa_inicial)}
                value={form.data_faixa_inicial}
                onChange={e => setField('data_faixa_inicial', e.target.value)}
              />
            </Field>
          </div>

          {form.modalidade_id && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {isEdicao ? 'Faixa Atual *' : 'Graduação Inicial *'}
              </p>
              {errors.graduacao_inicial_id && (
                <p className="text-xs text-red-500 mb-2">{errors.graduacao_inicial_id}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {graduacoesFiltradas.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setField('graduacao_inicial_id', g.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left ${
                      form.graduacao_inicial_id === g.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 border border-gray-300"
                      style={{ backgroundColor: g.cor_hex }}
                    />
                    <span className="text-xs font-medium text-gray-700 leading-tight">{g.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pacote */}
        {pacotesAcademia.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Plano / Pacote</h2>
            <Field label="Pacote de Mensalidade">
              <select
                className={inputClass()}
                value={form.pacote_id}
                onChange={e => setField('pacote_id', e.target.value)}
              >
                <option value="">Sem pacote definido</option>
                {pacotesAcademia.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {p.valor.toFixed(2)}/{p.periodicidade}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

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
            {saving ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  )
}
