import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import type { User, Aluno, Turma, Mensalidade, CheckIn, Academia, Modalidade, Pacote, Comunicado, Graduacao, HistoricoFaixa } from '@/types'
import { writesService } from '@/services/writes.service'

interface AppState {
  user: User | null
  academiaAtualId: string
  academias: Academia[]
  alunos: Aluno[]
  turmas: Turma[]
  professores: User[]
  modalidades: Modalidade[]
  pacotes: Pacote[]
  mensalidades: Mensalidade[]
  checkIns: CheckIn[]
  comunicados: Comunicado[]
  graduacoes: Graduacao[]
  sidebarOpen: boolean
  darkMode: boolean

  academiaAtual: () => Academia | undefined

  logout: () => void
  setUser: (user: User | null) => void
  setAcademiaAtual: (id: string) => void
  setDados: (data: {
    academia?: Academia | null
    alunos?: Aluno[]
    turmas?: Turma[]
    modalidades?: Modalidade[]
    pacotes?: Pacote[]
    mensalidades?: Mensalidade[]
    checkIns?: CheckIn[]
    comunicados?: Comunicado[]
    professores?: User[]
    graduacoes?: Graduacao[]
  }) => void
  setSidebarOpen: (open: boolean) => void
  toggleDarkMode: () => void
  updateAcademia: (id: string, data: Partial<Academia>) => Promise<void>

  addAluno: (aluno: Aluno) => void
  updateAluno: (id: string, data: Partial<Aluno>) => void
  removeAluno: (id: string) => void

  addTurma: (turma: Turma) => void
  updateTurma: (id: string, data: Partial<Turma>) => void

  addProfessor: (p: User) => void
  updateProfessor: (id: string, data: Partial<User>) => void

  addModalidade: (m: Modalidade) => void
  updateModalidade: (id: string, data: Partial<Modalidade>) => void

  addPacote: (p: Pacote) => void
  updatePacote: (id: string, data: Partial<Pacote>) => void

  addMensalidade: (m: Mensalidade) => void
  updateMensalidade: (id: string, data: Partial<Mensalidade>) => void

  addCheckIn: (c: CheckIn) => void
  removeCheckIn: (id: string) => void

  addComunicado: (c: Comunicado) => void
  removeComunicado: (id: string) => void

  addGraduacao: (g: Graduacao) => void
  updateGraduacao: (id: string, data: Partial<Graduacao>) => void
  removeGraduacao: (id: string) => void

  resetDados: () => void
}

const INITIAL_STATE = {
  user: null as User | null,
  academiaAtualId: '',
  academias: [] as Academia[],
  alunos: [] as Aluno[],
  turmas: [] as Turma[],
  professores: [] as User[],
  modalidades: [] as Modalidade[],
  pacotes: [] as Pacote[],
  mensalidades: [] as Mensalidade[],
  checkIns: [] as CheckIn[],
  comunicados: [] as Comunicado[],
  graduacoes: [] as Graduacao[],
  sidebarOpen: true,
  darkMode: false,
}

function errToast(action: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)
  console.error(`${action}:`, e)
  toast.error(`Erro ao salvar (${action}): ${msg.slice(0, 80)}`)
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      academiaAtual: () => get().academias.find(a => a.id === get().academiaAtualId),

      logout: () => set({ user: null }),
      setUser: (user) => set({ user }),
      setAcademiaAtual: (id) => set({ academiaAtualId: id }),

      setDados: (data) => set(s => ({
        academias: data.academia
          ? [data.academia, ...s.academias.filter(a => a.id !== data.academia!.id)]
          : s.academias,
        alunos:       data.alunos       ?? s.alunos,
        turmas:       data.turmas       ?? s.turmas,
        modalidades:  data.modalidades  ?? s.modalidades,
        pacotes:      data.pacotes      ?? s.pacotes,
        mensalidades: data.mensalidades ?? s.mensalidades,
        checkIns:     data.checkIns     ?? s.checkIns,
        comunicados:  data.comunicados  ?? s.comunicados,
        professores:  data.professores  ?? s.professores,
        graduacoes:   data.graduacoes   ?? s.graduacoes,
      })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      // ── Academia ───────────────────────────────────────────────
      updateAcademia: async (id, data) => {
        set(s => ({ academias: s.academias.map(a => a.id === id ? { ...a, ...data } : a) }))
        try {
          await writesService.atualizarAcademia(id, data)
        } catch (e) {
          // Revert local state on failure
          set(s => ({ academias: s.academias }))
          errToast('academia', e)
          throw e
        }
      },

      // ── Alunos ────────────────────────────────────────────────
      addAluno: (aluno) => {
        set(s => ({ alunos: [...s.alunos, aluno] }))
        writesService.inserirAluno(aluno).catch(e => errToast('addAluno', e))
      },
      updateAluno: (id, data) => {
        // Find new historico_faixas entries that don't exist in DB yet
        const current = get().alunos.find(a => a.id === id)
        const novosHistorico: HistoricoFaixa[] = data.historico_faixas
          ? data.historico_faixas.filter(h => !current?.historico_faixas.some(old => old.id === h.id))
          : []
        set(s => ({ alunos: s.alunos.map(a => a.id === id ? { ...a, ...data } : a) }))
        writesService.atualizarAluno(id, data, novosHistorico).catch(e => errToast('updateAluno', e))
      },
      removeAluno: (id) => {
        set(s => ({ alunos: s.alunos.filter(a => a.id !== id) }))
        writesService.removerAluno(id).catch(e => errToast('removeAluno', e))
      },

      // ── Turmas ────────────────────────────────────────────────
      addTurma: (turma) => {
        set(s => ({ turmas: [...s.turmas, turma] }))
        writesService.inserirTurma(turma).catch(e => errToast('addTurma', e))
      },
      updateTurma: (id, data) => {
        set(s => ({ turmas: s.turmas.map(t => t.id === id ? { ...t, ...data } : t) }))
        writesService.atualizarTurma(id, data).catch(e => errToast('updateTurma', e))
      },

      // ── Professores ────────────────────────────────────────────
      addProfessor: (p) => {
        set(s => ({ professores: [...s.professores, p] }))
        writesService.inserirProfessor({ id: p.id, nome: p.nome, email: p.email ?? '', foto_url: p.foto_url, academia_id: p.academia_id ?? '' })
          .catch(e => errToast('addProfessor', e))
      },
      updateProfessor: (id, data) => {
        set(s => ({ professores: s.professores.map(p => p.id === id ? { ...p, ...data } : p) }))
        writesService.atualizarProfessor(id, data).catch(e => errToast('updateProfessor', e))
      },

      // ── Modalidades ────────────────────────────────────────────
      addModalidade: (m) => {
        set(s => ({ modalidades: [...s.modalidades, m] }))
        writesService.inserirModalidade({ id: m.id, nome: m.nome, descricao: m.descricao, academia_id: m.academia_id, tem_graus: m.tem_graus ?? false, max_graus: m.max_graus ?? 4 })
          .catch(e => errToast('addModalidade', e))
      },
      updateModalidade: (id, data) => {
        set(s => ({ modalidades: s.modalidades.map(m => m.id === id ? { ...m, ...data } : m) }))
        writesService.atualizarModalidade(id, data).catch(e => errToast('updateModalidade', e))
      },

      // ── Pacotes ────────────────────────────────────────────────
      addPacote: (p) => {
        set(s => ({ pacotes: [...s.pacotes, p] }))
        writesService.inserirPacote(p).catch(e => errToast('addPacote', e))
      },
      updatePacote: (id, data) => {
        set(s => ({ pacotes: s.pacotes.map(p => p.id === id ? { ...p, ...data } : p) }))
        writesService.atualizarPacote(id, data).catch(e => errToast('updatePacote', e))
      },

      // ── Mensalidades ───────────────────────────────────────────
      addMensalidade: (m) => {
        set(s => ({ mensalidades: [...s.mensalidades, m] }))
        writesService.inserirMensalidade(m).catch(e => errToast('addMensalidade', e))
      },
      updateMensalidade: (id, data) => {
        set(s => ({ mensalidades: s.mensalidades.map(m => m.id === id ? { ...m, ...data } : m) }))
        writesService.atualizarMensalidade(id, data).catch(e => errToast('updateMensalidade', e))
      },

      // ── Check-ins ──────────────────────────────────────────────
      addCheckIn: (c) => {
        set(s => ({ checkIns: [...s.checkIns, c] }))
        writesService.inserirCheckIn(c).catch(e => errToast('addCheckIn', e))
      },
      removeCheckIn: (id) => {
        set(s => ({ checkIns: s.checkIns.filter(c => c.id !== id) }))
        writesService.removerCheckIn(id).catch(e => errToast('removeCheckIn', e))
      },

      // ── Comunicados ────────────────────────────────────────────
      addComunicado: (c) => {
        set(s => ({ comunicados: [c, ...s.comunicados] }))
        writesService.inserirComunicado(c).catch(e => errToast('addComunicado', e))
      },
      removeComunicado: (id) => {
        set(s => ({ comunicados: s.comunicados.filter(c => c.id !== id) }))
        writesService.removerComunicado(id).catch(e => errToast('removeComunicado', e))
      },

      // ── Graduações ─────────────────────────────────────────────
      addGraduacao: (g) => {
        set(s => ({ graduacoes: [...s.graduacoes, g].sort((a, b) => a.sequencia - b.sequencia) }))
        writesService.inserirGraduacao(g).catch(e => errToast('addGraduacao', e))
      },
      updateGraduacao: (id, data) => {
        set(s => ({ graduacoes: s.graduacoes.map(g => g.id === id ? { ...g, ...data } : g) }))
        writesService.atualizarGraduacao(id, data).catch(e => errToast('updateGraduacao', e))
      },
      removeGraduacao: (id) => {
        set(s => ({ graduacoes: s.graduacoes.filter(g => g.id !== id) }))
        writesService.removerGraduacao(id).catch(e => errToast('removeGraduacao', e))
      },

      resetDados: () => set(INITIAL_STATE),
    }),
    {
      name: 'bjj-sistema-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        academiaAtualId: s.academiaAtualId,
        academias: s.academias,
        alunos: s.alunos,
        turmas: s.turmas,
        professores: s.professores,
        modalidades: s.modalidades,
        pacotes: s.pacotes,
        mensalidades: s.mensalidades,
        checkIns: s.checkIns,
        comunicados: s.comunicados,
        graduacoes: s.graduacoes,
        sidebarOpen: s.sidebarOpen,
        darkMode: s.darkMode,
      }),
    }
  )
)
