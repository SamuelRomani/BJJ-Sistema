import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Megaphone, Plus, X, Send, Users, AlertTriangle, Calendar,
  DollarSign, Trash2, MessageCircle, Copy, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ComunicadoTipo, ComunicadoDestinatarios } from '@/types'

const TIPO_CONFIG: Record<ComunicadoTipo, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  geral:      { label: 'Geral',      color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Megaphone },
  financeiro: { label: 'Financeiro', color: 'text-green-700',  bg: 'bg-green-100',  icon: DollarSign },
  evento:     { label: 'Evento',     color: 'text-purple-700', bg: 'bg-purple-100', icon: Calendar },
  urgente:    { label: 'Urgente',    color: 'text-red-700',    bg: 'bg-red-100',    icon: AlertTriangle },
}

const DEST_CONFIG: Record<ComunicadoDestinatarios, { label: string; desc: string }> = {
  todos:         { label: 'Todos os Alunos',    desc: 'Ativos, inativos e suspensos' },
  ativos:        { label: 'Alunos Ativos',      desc: 'Apenas alunos com status ativo' },
  inadimplentes: { label: 'Inadimplentes',      desc: 'Alunos com mensalidade atrasada' },
}

const MSG_PADRAO: Partial<Record<ComunicadoTipo, string>> = {
  financeiro: 'Prezado(a) aluno(a), informamos que sua mensalidade está disponível para pagamento. Em caso de dúvidas, entre em contato com a secretaria.',
  urgente: 'ATENÇÃO: Comunicado urgente da academia. Por favor, verifique as informações abaixo.',
}

export function Comunicados() {
  const { comunicados, addComunicado, removeComunicado, alunos, mensalidades, turmas, user, academiaAtualId } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<ComunicadoTipo | 'todos'>('todos')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'geral' as ComunicadoTipo,
    destinatarios: 'ativos' as ComunicadoDestinatarios,
  })

  const turmaIds = new Set(turmas.filter(t => t.academia_id === academiaAtualId).map(t => t.id))
  const alunosAcademia = alunos.filter(a => a.academia_id === academiaAtualId)
  const mensalidadesAcademia = mensalidades.filter(m => turmaIds.has(m.turma_id))
  const comunicadosAcademia = comunicados.filter(c => c.academia_id === academiaAtualId)

  // Calcula destinatários para preview
  const destinatariosPreview = useMemo(() => {
    if (form.destinatarios === 'todos') return alunosAcademia
    if (form.destinatarios === 'ativos') return alunosAcademia.filter(a => a.status === 'ativo')
    if (form.destinatarios === 'inadimplentes') {
      const inadIds = new Set(
        mensalidadesAcademia.filter(m => m.status === 'atrasado').map(m => m.aluno_id)
      )
      return alunosAcademia.filter(a => inadIds.has(a.id))
    }
    return []
  }, [form.destinatarios, alunosAcademia, mensalidadesAcademia])

  // Gera links WhatsApp individuais para todos os destinatários
  function gerarLinksWA(comunicadoId?: string) {
    const c = comunicadoId ? comunicadosAcademia.find(x => x.id === comunicadoId) : null
    const titulo = c?.titulo ?? form.titulo
    const mensagem = c?.mensagem ?? form.mensagem
    const texto = `*${titulo}*\n\n${mensagem}`
    return destinatariosPreview
      .filter(a => a.telefone)
      .map(a => `https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`)
  }

  function copiarTexto(id: string) {
    const c = comunicadosAcademia.find(x => x.id === id)
    if (!c) return
    navigator.clipboard.writeText(`*${c.titulo}*\n\n${c.mensagem}`)
    setCopiedId(id)
    toast.success('Texto copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function enviar() {
    if (!form.titulo.trim() || !form.mensagem.trim()) {
      toast.error('Preencha título e mensagem')
      return
    }
    addComunicado({
      id: crypto.randomUUID(),
      academia_id: academiaAtualId,
      titulo: form.titulo.trim(),
      mensagem: form.mensagem.trim(),
      tipo: form.tipo,
      destinatarios: form.destinatarios,
      criado_em: new Date().toISOString(),
      criado_por: user?.nome ?? 'Sistema',
    })
    toast.success(`Comunicado criado para ${destinatariosPreview.length} aluno(s)!`)
    setForm({ titulo: '', mensagem: '', tipo: 'geral', destinatarios: 'ativos' })
    setShowForm(false)
  }

  const filtrados = comunicadosAcademia.filter(
    c => filtroTipo === 'todos' || c.tipo === filtroTipo
  )

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
          <p className="text-gray-500 text-sm">Envie avisos para os alunos via WhatsApp ou copie o texto</p>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Comunicado
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(TIPO_CONFIG) as [ComunicadoTipo, typeof TIPO_CONFIG[ComunicadoTipo]][]).map(([tipo, cfg]) => {
          const Icon = cfg.icon
          const count = comunicadosAcademia.filter(c => c.tipo === tipo).length
          return (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(f => f === tipo ? 'todos' : tipo)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                filtroTipo === tipo
                  ? `${cfg.bg} border-transparent`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <Icon size={16} className={cn('mb-2', cfg.color)} />
              <p className={cn('text-lg font-bold', cfg.color)}>{count}</p>
              <p className="text-xs text-gray-500">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone size={16} className="text-blue-500" /> Novo Comunicado
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TIPO_CONFIG) as [ComunicadoTipo, typeof TIPO_CONFIG[ComunicadoTipo]][]).map(([tipo, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={tipo}
                      onClick={() => setForm(f => ({
                        ...f,
                        tipo,
                        mensagem: f.mensagem || MSG_PADRAO[tipo] || f.mensagem,
                      }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                        form.tipo === tipo
                          ? `${cfg.bg} ${cfg.color} border-transparent font-medium`
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon size={13} /> {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Destinatários */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Destinatários</label>
              <div className="space-y-2">
                {(Object.entries(DEST_CONFIG) as [ComunicadoDestinatarios, typeof DEST_CONFIG[ComunicadoDestinatarios]][]).map(([dest, cfg]) => (
                  <button
                    key={dest}
                    onClick={() => setForm(f => ({ ...f, destinatarios: dest }))}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                      form.destinatarios === dest
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span className="font-medium">{cfg.label}</span>
                    <span className="text-xs opacity-60">{cfg.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Treino cancelado amanhã"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mensagem *</label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Escreva a mensagem que será enviada aos alunos..."
              value={form.mensagem}
              onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">{form.mensagem.length} caracteres</p>
          </div>

          {/* Preview destinatários */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users size={14} />
                {destinatariosPreview.length} aluno{destinatariosPreview.length !== 1 ? 's' : ''} receberão este comunicado
              </p>
              <span className="text-xs text-gray-400">
                {destinatariosPreview.filter(a => a.telefone).length} com WhatsApp
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {destinatariosPreview.slice(0, 20).map(a => (
                <span key={a.id} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                  {a.nome.split(' ')[0]}
                </span>
              ))}
              {destinatariosPreview.length > 20 && (
                <span className="text-xs text-gray-400 px-2 py-0.5">+{destinatariosPreview.length - 20} mais</span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              {destinatariosPreview.filter(a => a.telefone).slice(0, 3).map(a => {
                const texto = encodeURIComponent(`*${form.titulo}*\n\n${form.mensagem}`)
                return (
                  <a
                    key={a.id}
                    href={`https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${texto}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle size={12} /> {a.nome.split(' ')[0]}
                  </a>
                )
              })}
              {destinatariosPreview.filter(a => a.telefone).length > 3 && (
                <span className="text-xs text-gray-400 flex items-center">
                  +{destinatariosPreview.filter(a => a.telefone).length - 3} mais no histórico
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={!form.titulo.trim() || !form.mensagem.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <Send size={14} /> Salvar Comunicado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Megaphone size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum comunicado encontrado</p>
          <p className="text-gray-300 text-sm mt-1">Crie seu primeiro comunicado para os alunos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(c => {
            const cfg = TIPO_CONFIG[c.tipo]
            const Icon = cfg.icon
            const destCfg = DEST_CONFIG[c.destinatarios]

            // Calcula destinatários para este comunicado (para gerar links WA)
            const destAlunos = (() => {
              if (c.destinatarios === 'todos') return alunosAcademia
              if (c.destinatarios === 'ativos') return alunosAcademia.filter(a => a.status === 'ativo')
              const inadIds = new Set(mensalidadesAcademia.filter(m => m.status === 'atrasado').map(m => m.aluno_id))
              return alunosAcademia.filter(a => inadIds.has(a.id))
            })()

            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{c.titulo}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color, cfg.bg)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-line leading-relaxed">{c.mensagem}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {destCfg.label}
                          <span className="text-gray-300">·</span>
                          {destAlunos.length} alunos
                        </span>
                        <span>
                          {format(parseISO(c.criado_em), "dd 'de' MMM 'de' yyyy', às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>por {c.criado_por}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copiarTexto(c.id)}
                      title="Copiar texto"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {copiedId === c.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir este comunicado?')) {
                          removeComunicado(c.id)
                          toast.success('Comunicado excluído')
                        }
                      }}
                      title="Excluir"
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Links WhatsApp por aluno */}
                {destAlunos.filter(a => a.telefone).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <MessageCircle size={11} className="text-green-500" />
                      Enviar via WhatsApp ({destAlunos.filter(a => a.telefone).length} contatos)
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {destAlunos.filter(a => a.telefone).map(a => {
                        const texto = encodeURIComponent(`*${c.titulo}*\n\n${c.mensagem}`)
                        return (
                          <a
                            key={a.id}
                            href={`https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${texto}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors"
                          >
                            <MessageCircle size={10} /> {a.nome.split(' ')[0]}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
