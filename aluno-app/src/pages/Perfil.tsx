import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LogOut, Save, Phone, Mail, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'

export function Perfil({ userId }: { userId: string }) {
  const [aluno, setAluno] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ telefone: '', email: '' })

  useEffect(() => {
    async function carregar() {
      const { data: a } = await supabase
        .from('alunos')
        .select('*, modalidade:modalidades(nome), graduacao:graduacoes(nome, cor_hex), pacote:pacotes(nome), historico_faixas(*, graduacao:graduacoes(nome, cor_hex))')
        .eq('user_id', userId)
        .single()
      setAluno(a)
      if (a) setForm({ telefone: a.telefone ?? '', email: a.email ?? '' })

      const { data: cis } = await supabase
        .from('checkins')
        .select('data')
        .eq('aluno_id', a?.id)
        .gte('data', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
      setCheckins(cis ?? [])
      setLoading(false)
    }
    carregar()
  }, [userId])

  async function salvar() {
    if (!aluno) return
    setSalvando(true)
    const { error } = await supabase.from('alunos').update({ telefone: form.telefone, email: form.email }).eq('id', aluno.id)
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Dados atualizados!'); setAluno((a: any) => ({ ...a, ...form })) }
    setSalvando(false)
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  )

  if (!aluno) return <div className="p-6 text-center text-gray-400">Perfil não encontrado</div>

  const ciDates = new Set(checkins.map((c: any) => c.data))
  const dias90 = Array.from({ length: 90 }, (_, i) => format(subDays(new Date(), 89 - i), 'yyyy-MM-dd'))

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Avatar + nome */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-black shrink-0">
          {aluno.nome.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg leading-tight">{aluno.nome}</p>
          <p className="text-gray-500 text-sm">{aluno.modalidade?.nome}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {aluno.graduacao && (
              <>
                <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: aluno.graduacao.cor_hex }} />
                <span className="text-xs text-gray-500">{aluno.graduacao.nome}</span>
              </>
            )}
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              desde {format(parseISO(aluno.data_matricula), 'MMM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap simplificado */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <Activity size={14} className="text-blue-500" /> Treinos — 90 dias
        </p>
        <div className="flex flex-wrap gap-0.5">
          {dias90.map(d => (
            <div
              key={d}
              title={d}
              className={`w-2.5 h-2.5 rounded-sm ${ciDates.has(d) ? 'bg-blue-500' : 'bg-gray-100'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {checkins.length} treino{checkins.length !== 1 ? 's' : ''} nos últimos 90 dias
        </p>
      </div>

      {/* Editar dados */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="font-semibold text-gray-900 text-sm">Meus Dados</p>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            <Mail size={11} className="inline mr-1" />Email
          </label>
          <input
            type="email"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            <Phone size={11} className="inline mr-1" />Telefone / WhatsApp
          </label>
          <input
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.telefone}
            onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* Sair */}
      <button
        onClick={sair}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-red-500 text-sm font-medium hover:bg-red-50"
      >
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  )
}
