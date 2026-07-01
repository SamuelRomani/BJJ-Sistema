import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { mockGraduacoes } from '@/data/mockData'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Award, ChevronRight, CheckCircle2, Star, ArrowRight, Circle, FileDown } from 'lucide-react'
import { cn, formatGraduacao } from '@/lib/utils'
import { toast } from 'sonner'
import type { HistoricoFaixa, Graduacao, Aluno, Academia } from '@/types'
import jsPDF from 'jspdf'

function emitirCertificado(aluno: Aluno, graduacao: Graduacao, grau: number, data: string, academia: Academia) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297, H = 210

  // Fundo escuro
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, H, 'F')

  // Borda dourada dupla
  doc.setDrawColor(251, 191, 36)
  doc.setLineWidth(3)
  doc.rect(8, 8, W - 16, H - 16)
  doc.setLineWidth(1)
  doc.rect(12, 12, W - 24, H - 24)

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(251, 191, 36)
  doc.text('— TATAMEHOJE —', W / 2, 30, { align: 'center' })

  doc.setFontSize(30)
  doc.text('CERTIFICADO DE GRADUAÇÃO', W / 2, 50, { align: 'center' })

  // Corpo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(200, 210, 230)
  doc.text('Certificamos que o(a) aluno(a)', W / 2, 72, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(255, 255, 255)
  doc.text(aluno.nome.toUpperCase(), W / 2, 92, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(200, 210, 230)
  const labelGrau = grau > 0 ? `recebeu o ${grau}° Grau na` : 'foi promovido(a) à'
  doc.text(labelGrau, W / 2, 108, { align: 'center' })

  // Caixa da faixa com cor
  const hexColor = graduacao.cor_hex.replace('#', '')
  const r = parseInt(hexColor.slice(0, 2), 16)
  const g2 = parseInt(hexColor.slice(2, 4), 16)
  const b = parseInt(hexColor.slice(4, 6), 16)
  doc.setFillColor(r, g2, b)
  doc.roundedRect(W / 2 - 45, 114, 90, 20, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text(`FAIXA ${graduacao.nome.toUpperCase()}`, W / 2, 127, { align: 'center' })

  // Academia e data
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(160, 175, 200)
  doc.text(`na academia ${academia.nome}`, W / 2, 147, { align: 'center' })

  const dateFormatted = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(dateFormatted, W / 2, 158, { align: 'center' })

  // Linha de assinatura
  doc.setDrawColor(100, 120, 150)
  doc.setLineWidth(0.5)
  doc.line(80, 178, W / 2 - 10, 178)
  doc.line(W / 2 + 10, 178, W - 80, 178)
  doc.setFontSize(9)
  doc.setTextColor(120, 140, 170)
  doc.text('Responsável', 148, 184, { align: 'center' })
  doc.text(academia.nome, W - 80, 184, { align: 'right' })

  doc.save(`certificado-${aluno.nome.toLowerCase().replace(/\s+/g, '-')}-${graduacao.nome.toLowerCase()}.pdf`)
  toast.success('Certificado gerado!')
}

/** Bolinhas de grau visual (como stripes na faixa) */
function GrauDots({ grau, total = 4, cor }: { grau: number; total?: number; cor: string }) {
  const isEscuro = cor === '#111827' || cor === '#92400e' || cor === '#8b5cf6' || cor === '#3b82f6'
  const dotColor = isEscuro ? '#ffffff' : '#374151'
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full border"
          style={{
            backgroundColor: i < grau ? dotColor : 'transparent',
            borderColor: i < grau ? dotColor : (isEscuro ? 'rgba(255,255,255,0.4)' : '#d1d5db'),
          }}
        />
      ))}
    </div>
  )
}

type TipoPromocao = 'grau' | 'faixa'

export function Graduacoes() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { alunos, updateAluno, academiaAtualId, academias } = useStore()
  const academia = academias.find(a => a.id === academiaAtualId)

  const [alunoId, setAlunoId] = useState(searchParams.get('aluno') || '')
  const [tipoPromocao, setTipoPromocao] = useState<TipoPromocao>('grau')
  const [faixaSelecionada, setFaixaSelecionada] = useState<Graduacao | null>(null)
  const [grauSelecionado, setGrauSelecionado] = useState<number>(1)
  const [dataPromocao, setDataPromocao] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [ultimaPromocao, setUltimaPromocao] = useState<{ graduacao: Graduacao; grau: number; data: string } | null>(null)

  const alunosAcademia = alunos.filter(a => a.academia_id === academiaAtualId && a.status === 'ativo')
  const aluno = alunos.find(a => a.id === alunoId)

  const temGraus = aluno?.modalidade_principal.tem_graus ?? false
  const maxGraus = aluno?.modalidade_principal.max_graus ?? 4
  const grauAtual = aluno?.grau_atual ?? 0
  const podeDarGrau = temGraus && grauAtual < maxGraus
  const precisaTrocarFaixa = temGraus && grauAtual >= maxGraus

  // Faixas já na faixa atual — para dar grau, usa a mesma faixa
  const faixasModalidade = aluno
    ? mockGraduacoes
        .filter(g => g.modalidade_id === aluno.modalidade_principal_id)
        .sort((a, b) => a.sequencia - b.sequencia)
    : []

  // Para promoção de faixa: faixas além da atual
  const faixasJaAuferidas = aluno
    ? new Set(aluno.historico_faixas.map(h => h.graduacao_id))
    : new Set<string>()

  // Faixas ainda não conquistadas (exceto a atual se tem graus ativos)
  const faixasDisponiveisParaPromocao = faixasModalidade.filter(g => {
    if (!temGraus) return !faixasJaAuferidas.has(g.id)
    // com graus: próxima faixa é a que vem depois da atual
    return g.sequencia > (aluno?.graduacao_atual?.sequencia ?? 0)
  })

  const proximaFaixaSugerida = faixasDisponiveisParaPromocao[0] ?? null

  // Tipo padrão ao trocar aluno
  function onAlunoChange(id: string) {
    setAlunoId(id)
    setFaixaSelecionada(null)
    const a = alunos.find(x => x.id === id)
    const podeGrau = a?.modalidade_principal.tem_graus && (a?.grau_atual ?? 0) < (a?.modalidade_principal.max_graus ?? 4)
    setTipoPromocao(podeGrau ? 'grau' : 'faixa')
    setGrauSelecionado((a?.grau_atual ?? 0) + 1)
  }

  async function handlePromover() {
    if (!aluno) return
    if (tipoPromocao === 'faixa' && !faixaSelecionada) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))

    if (tipoPromocao === 'grau' && temGraus) {
      // Dar grau na faixa atual
      const novoHistorico: HistoricoFaixa = {
        id: crypto.randomUUID(),
        aluno_id: aluno.id,
        graduacao_id: aluno.graduacao_atual_id!,
        graduacao: aluno.graduacao_atual!,
        grau: grauSelecionado,
        data_promocao: dataPromocao,
        observacoes: observacoes || undefined,
      }
      updateAluno(aluno.id, {
        historico_faixas: [...aluno.historico_faixas, novoHistorico],
        grau_atual: grauSelecionado,
      })
      toast.success(`${aluno.nome} recebeu ${grauSelecionado}° Grau na ${aluno.graduacao_atual?.nome}!`)
      setUltimaPromocao({ graduacao: aluno.graduacao_atual!, grau: grauSelecionado, data: dataPromocao })
    } else if (faixaSelecionada) {
      // Promover para nova faixa
      const novoHistorico: HistoricoFaixa = {
        id: crypto.randomUUID(),
        aluno_id: aluno.id,
        graduacao_id: faixaSelecionada.id,
        graduacao: faixaSelecionada,
        grau: 0,
        data_promocao: dataPromocao,
        observacoes: observacoes || undefined,
      }
      updateAluno(aluno.id, {
        historico_faixas: [...aluno.historico_faixas, novoHistorico],
        graduacao_atual_id: faixaSelecionada.id,
        graduacao_atual: faixaSelecionada,
        grau_atual: 0,
      })
      toast.success(`${aluno.nome} promovido(a) para ${faixaSelecionada.nome}!`)
      setUltimaPromocao({ graduacao: faixaSelecionada, grau: 0, data: dataPromocao })
    }

    setSaving(false)
    setFaixaSelecionada(null)
    setObservacoes('')
  }

  const podeConfirmar = tipoPromocao === 'grau' ? temGraus : !!faixaSelecionada

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Graduações</h1>
        <p className="text-gray-500 text-sm">Registrar graus e promoções de faixa</p>
      </div>

      {/* Banner de última promoção com botão de certificado */}
      {ultimaPromocao && aluno && academia && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full shrink-0 border-2 border-amber-300" style={{ backgroundColor: ultimaPromocao.graduacao.cor_hex }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">Graduação registrada!</p>
            <p className="text-sm text-amber-700">
              {aluno.nome} — {ultimaPromocao.grau > 0 ? `${ultimaPromocao.grau}° Grau na ` : ''}{ultimaPromocao.graduacao.nome}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => emitirCertificado(aluno, ultimaPromocao.graduacao, ultimaPromocao.grau, ultimaPromocao.data, academia)}
              className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <FileDown size={15} /> Emitir Certificado
            </button>
            <button onClick={() => { setUltimaPromocao(null); navigate(`/alunos/${aluno.id}`) }} className="text-amber-600 hover:underline text-sm">Ver perfil →</button>
          </div>
        </div>
      )}

      {/* Seletor de Aluno */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Selecionar Aluno</h2>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={alunoId}
          onChange={e => onAlunoChange(e.target.value)}
        >
          <option value="">Selecione um aluno...</option>
          {alunosAcademia.map(a => (
            <option key={a.id} value={a.id}>
              {a.nome} — {formatGraduacao(a.graduacao_atual?.nome ?? '—', a.grau_atual)}
            </option>
          ))}
        </select>
      </div>

      {aluno && (
        <>
          {/* Card do aluno */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                {aluno.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{aluno.nome}</p>
                <p className="text-sm text-gray-500">{aluno.modalidade_principal.nome}</p>
              </div>
              {aluno.graduacao_atual && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm shrink-0"
                    style={{ backgroundColor: aluno.graduacao_atual.cor_hex }}
                  />
                  <div>
                    <p className="text-xs text-gray-500">Faixa atual</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatGraduacao(aluno.graduacao_atual.nome, aluno.grau_atual)}
                    </p>
                  </div>
                  {temGraus && (
                    <GrauDots grau={grauAtual} total={maxGraus} cor={aluno.graduacao_atual.cor_hex} />
                  )}
                </div>
              )}
            </div>

            {/* Timeline resumida */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Histórico</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  // Mostra apenas mudanças de faixa (grau 0 ou sem graus)
                  const entries = aluno.historico_faixas
                    .filter(h => !temGraus || h.grau === 0)
                    .sort((a, b) => new Date(a.data_promocao).getTime() - new Date(b.data_promocao).getTime())
                  return entries.map((h, idx) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: h.graduacao.cor_hex }} />
                        <span className="text-xs text-gray-600">{h.graduacao.nome}</span>
                        <CheckCircle2 size={12} className="text-green-500" />
                      </div>
                      {idx < entries.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          {/* Tipo de promoção */}
          {temGraus && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Tipo de Promoção</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setTipoPromocao('grau'); setFaixaSelecionada(null) }}
                  disabled={!podeDarGrau}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    tipoPromocao === 'grau'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                    !podeDarGrau && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className={cn('w-2.5 h-2.5 rounded-full border border-gray-400', i < (grauAtual + 1) ? 'bg-gray-700' : '')} />
                      ))}
                    </div>
                    {tipoPromocao === 'grau' && <CheckCircle2 size={14} className="text-blue-500 ml-auto" />}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">Dar Grau</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {podeDarGrau
                      ? `${grauAtual}° → ${grauAtual + 1}° grau na faixa atual`
                      : `Grau máximo (${maxGraus}°) atingido`}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => { setTipoPromocao('faixa'); setGrauSelecionado(0) }}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    tipoPromocao === 'faixa'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {aluno.graduacao_atual && (
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: aluno.graduacao_atual.cor_hex }} />
                      )}
                      <ArrowRight size={12} className="text-gray-400" />
                      {proximaFaixaSugerida && (
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: proximaFaixaSugerida.cor_hex }} />
                      )}
                    </div>
                    {tipoPromocao === 'faixa' && <CheckCircle2 size={14} className="text-blue-500 ml-auto" />}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">Promover Faixa</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {precisaTrocarFaixa ? 'Grau máximo atingido — hora de promover!' : 'Subir para a próxima faixa'}
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Seletor de Grau */}
          {tipoPromocao === 'grau' && temGraus && podeDarGrau && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Selecionar Grau</h2>
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: maxGraus }, (_, i) => i + 1).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrauSelecionado(g)}
                    disabled={g <= grauAtual}
                    className={cn(
                      'flex flex-col items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all',
                      grauSelecionado === g
                        ? 'border-blue-500 bg-blue-50'
                        : g <= grauAtual
                        ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex gap-1">
                      {Array.from({ length: maxGraus }, (_, i) => (
                        <div
                          key={i}
                          className={cn('w-3 h-3 rounded-full border', i < g ? 'bg-gray-700 border-gray-700' : 'border-gray-300')}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-800">{g}° Grau</span>
                    {g === grauAtual + 1 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={10} /> Próximo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seletor de Faixa */}
          {tipoPromocao === 'faixa' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Selecionar Nova Faixa</h2>

              {faixasDisponiveisParaPromocao.length === 0 ? (
                <div className="text-center py-10">
                  <Award size={40} className="text-amber-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700">Graduação Máxima Atingida!</p>
                  <p className="text-sm text-gray-500 mt-1">Este aluno completou todas as faixas da modalidade.</p>
                </div>
              ) : (
                <>
                  {proximaFaixaSugerida && (
                    <div
                      onClick={() => setFaixaSelecionada(proximaFaixaSugerida)}
                      className={cn(
                        'border-2 rounded-xl p-4 cursor-pointer transition-all mb-4',
                        faixaSelecionada?.id === proximaFaixaSugerida.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-amber-300 bg-amber-50 hover:border-amber-400'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: proximaFaixaSugerida.cor_hex }} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-lg">{proximaFaixaSugerida.nome}</p>
                              <span className="flex items-center gap-1 text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-medium">
                                <Star size={10} /> Sugerida
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">Sequência {proximaFaixaSugerida.sequencia}</p>
                          </div>
                        </div>
                        {faixaSelecionada?.id === proximaFaixaSugerida.id && (
                          <CheckCircle2 size={24} className="text-blue-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {faixasDisponiveisParaPromocao.length > 1 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Outras opções:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {faixasDisponiveisParaPromocao.slice(1).map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setFaixaSelecionada(g)}
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left',
                              faixaSelecionada?.id === g.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: g.cor_hex }} />
                            <span className="text-xs font-medium text-gray-700">{g.nome}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Detalhes */}
          {podeConfirmar && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Detalhes da Promoção</h2>

              {/* Preview */}
              <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500">Estado Atual</p>
                  <div className="flex items-center gap-2 mt-1">
                    {aluno.graduacao_atual && (
                      <div className="w-5 h-5 rounded-full border shrink-0" style={{ backgroundColor: aluno.graduacao_atual.cor_hex }} />
                    )}
                    <span className="text-sm font-medium">{formatGraduacao(aluno.graduacao_atual?.nome ?? '—', grauAtual)}</span>
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Após Promoção</p>
                  <div className="flex items-center gap-2 mt-1">
                    {tipoPromocao === 'grau' ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-blue-300 shrink-0" style={{ backgroundColor: aluno.graduacao_atual?.cor_hex }} />
                        <span className="text-sm font-bold text-blue-700">
                          {formatGraduacao(aluno.graduacao_atual?.nome ?? '—', grauSelecionado)}
                        </span>
                      </>
                    ) : faixaSelecionada ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-blue-300 shrink-0" style={{ backgroundColor: faixaSelecionada.cor_hex }} />
                        <span className="text-sm font-bold text-blue-700">{faixaSelecionada.nome}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Promoção *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dataPromocao}
                    onChange={e => setDataPromocao(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Conquistas, torneios, etc..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setFaixaSelecionada(null); setObservacoes('') }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePromover}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <Award size={16} />
                  {saving ? 'Registrando...' : tipoPromocao === 'grau' ? 'Confirmar Grau' : 'Confirmar Promoção'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
