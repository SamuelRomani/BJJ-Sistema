import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Aluno, Turma, Mensalidade, CheckIn, Academia, Modalidade, Pacote, Comunicado } from '@/types'
import { mockAlunos, mockTurmas, mockMensalidades, mockCheckIns, mockAcademias, mockProfessores, mockModalidades, mockPacotes, mockUsuarios } from '@/data/mockData'
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
  sidebarOpen: boolean
  darkMode: boolean

  academiaAtual: () => Academia | undefined

  login: (email: string, senha: string) => { ok: boolean; erro?: string }
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
  }) => void
  setSidebarOpen: (open: boolean) => void
  toggleDarkMode: () => void
  updateAcademia: (id: string, data: Partial<Academia>) => void

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

  resetDados: () => void
}

const INITIAL_STATE = {
  user: null as User | null,
  academiaAtualId: '1',
  academias: mockAcademias,
  alunos: mockAlunos,
  turmas: mockTurmas,
  professores: mockProfessores,
  modalidades: mockModalidades,
  pacotes: mockPacotes,
  mensalidades: mockMensalidades,
  checkIns: mockCheckIns,
  comunicados: [] as Comunicado[],
  sidebarOpen: true,
  darkMode: false,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      academiaAtual: () => get().academias.find(a => a.id === get().academiaAtualId),

      login: (email, senha) => {
        const cred = mockUsuarios.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        )
        if (!cred) return { ok: false, erro: 'Email ou senha incorretos' }
        const { senha: _, ...user } = cred
        const academiaId = user.academia_id ?? get().academias[0]?.id ?? '1'
        set({ user, academiaAtualId: academiaId })
        return { ok: true }
      },
      logout: () => set({ user: null }),
      setUser: (user) => set({ user }),
      setAcademiaAtual: (id) => set({ academiaAtualId: id }),
      setDados: (data) => set(s => ({
        academias: data.academia ? [data.academia, ...s.academias.filter(a => a.id !== data.academia!.id)] : s.academias,
        alunos:       data.alunos       ?? s.alunos,
        turmas:       data.turmas       ?? s.turmas,
        modalidades:  data.modalidades  ?? s.modalidades,
        pacotes:      data.pacotes      ?? s.pacotes,
        mensalidades: data.mensalidades ?? s.mensalidades,
        checkIns:     data.checkIns     ?? s.checkIns,
        comunicados:  data.comunicados  ?? s.comunicados,
        professores:  data.professores  ?? s.professores,
      })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      addAluno: (aluno) => {
        set(s => ({ alunos: [...s.alunos, aluno] }))
        writesService.inserirAluno(aluno).catch(e => console.error('addAluno:', e))
      },
      updateAluno: (id, data) => {
        set(s => ({ alunos: s.alunos.map(a => a.id === id ? { ...a, ...data } : a) }))
        writesService.atualizarAluno(id, data).catch(e => console.error('updateAluno:', e))
      },
      removeAluno: (id) => {
        set(s => ({ alunos: s.alunos.filter(a => a.id !== id) }))
        writesService.removerAluno(id).catch(e => console.error('removeAluno:', e))
      },

      addTurma: (turma) => {
        set(s => ({ turmas: [...s.turmas, turma] }))
        writesService.inserirTurma(turma).catch(e => console.error('addTurma:', e))
      },
      updateTurma: (id, data) => {
        set(s => ({ turmas: s.turmas.map(t => t.id === id ? { ...t, ...data } : t) }))
        writesService.atualizarTurma(id, data).catch(e => console.error('updateTurma:', e))
      },

      addProfessor: (p) => {
        set(s => ({ professores: [...s.professores, p] }))
        writesService.inserirProfessor({ id: p.id, nome: p.nome, email: p.email ?? '', foto_url: p.foto_url, academia_id: p.academia_id ?? '' }).catch(e => console.error('addProfessor:', e))
      },
      updateProfessor: (id, data) => {
        set(s => ({ professores: s.professores.map(p => p.id === id ? { ...p, ...data } : p) }))
        writesService.atualizarProfessor(id, data).catch(e => console.error('updateProfessor:', e))
      },

      addModalidade: (m) => {
        set(s => ({ modalidades: [...s.modalidades, m] }))
        writesService.inserirModalidade({ id: m.id, nome: m.nome, descricao: m.descricao, academia_id: m.academia_id, tem_graus: m.tem_graus ?? false, max_graus: m.max_graus ?? 4 }).catch(e => console.error('addModalidade:', e))
      },
      updateModalidade: (id, data) => {
        set(s => ({ modalidades: s.modalidades.map(m => m.id === id ? { ...m, ...data } : m) }))
        writesService.atualizarModalidade(id, data).catch(e => console.error('updateModalidade:', e))
      },

      addPacote: (p) => {
        set(s => ({ pacotes: [...s.pacotes, p] }))
        writesService.inserirPacote(p).catch(e => console.error('addPacote:', e))
      },
      updatePacote: (id, data) => {
        set(s => ({ pacotes: s.pacotes.map(p => p.id === id ? { ...p, ...data } : p) }))
        writesService.atualizarPacote(id, data).catch(e => console.error('updatePacote:', e))
      },

      addMensalidade: (m) => {
        set(s => ({ mensalidades: [...s.mensalidades, m] }))
        writesService.inserirMensalidade(m).catch(e => console.error('addMensalidade:', e))
      },
      updateMensalidade: (id, data) => {
        set(s => ({ mensalidades: s.mensalidades.map(m => m.id === id ? { ...m, ...data } : m) }))
        writesService.atualizarMensalidade(id, data).catch(e => console.error('updateMensalidade:', e))
      },

      addCheckIn: (c) => {
        set(s => ({ checkIns: [...s.checkIns, c] }))
        writesService.inserirCheckIn(c).catch(e => console.error('addCheckIn:', e))
      },
      removeCheckIn: (id) => {
        set(s => ({ checkIns: s.checkIns.filter(c => c.id !== id) }))
        writesService.removerCheckIn(id).catch(e => console.error('removeCheckIn:', e))
      },

      addComunicado: (c) => {
        set(s => ({ comunicados: [c, ...s.comunicados] }))
        writesService.inserirComunicado(c).catch(e => console.error('addComunicado:', e))
      },
      removeComunicado: (id) => {
        set(s => ({ comunicados: s.comunicados.filter(c => c.id !== id) }))
        writesService.removerComunicado(id).catch(e => console.error('removeComunicado:', e))
      },

      updateAcademia: (id, data) => {
        set(s => ({ academias: s.academias.map(a => a.id === id ? { ...a, ...data } : a) }))
        writesService.atualizarAcademia(id, data).catch(e => console.error('updateAcademia:', e))
      },

      resetDados: () => set(INITIAL_STATE),
    }),
    {
      name: 'bjj-sistema-store',
      storage: createJSONStorage(() => localStorage),
      // Não persistir funções derivadas, só estado
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
        sidebarOpen: s.sidebarOpen,
        darkMode: s.darkMode,
      }),
    }
  )
)
