import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { differenceInDays, parseISO } from 'date-fns'
import { toast } from 'sonner'

// Roda uma vez por sessão ao montar o Layout.
// Suspende automaticamente alunos com mensalidade vencida há > 15 dias.
export function useAutoSuspend() {
  const { alunos, mensalidades, updateAluno } = useStore()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const hoje = new Date()
    let suspensos = 0

    alunos.forEach(aluno => {
      if (aluno.status !== 'ativo') return
      const atrasadas = mensalidades.filter(
        m => m.aluno_id === aluno.id && m.status === 'atrasado'
      )
      const maxDias = atrasadas.length
        ? Math.max(...atrasadas.map(m => differenceInDays(hoje, parseISO(m.vencimento))))
        : 0

      if (maxDias > 15) {
        updateAluno(aluno.id, { status: 'suspenso' })
        suspensos++
      }
    })

    if (suspensos > 0) {
      toast.warning(
        `${suspensos} aluno${suspensos > 1 ? 's suspensos' : ' suspenso'} automaticamente por inadimplência > 15 dias`,
        { duration: 6000 }
      )
    }
  }, [])
}
