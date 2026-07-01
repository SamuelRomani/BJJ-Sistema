// Tipos gerados manualmente com base no schema SQL
// Quando tiver o projeto Supabase criado, rode:
//   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      academias: {
        Row: {
          id: string
          nome: string
          logo_url: string | null
          endereco: string
          bairro: string
          cidade: string
          estado: string
          cep: string
          telefone: string
          email: string
          pix: string | null
          instagram: string | null
          website: string | null
          tema: Json
          horarios_funcionamento: Json
          criada_em: string
        }
        Insert: Partial<Database['public']['Tables']['academias']['Row']> & { nome: string }
        Update: Partial<Database['public']['Tables']['academias']['Row']>
      }
      perfis: {
        Row: {
          id: string
          academia_id: string | null
          nome: string
          role: 'dev' | 'proprietario' | 'professor' | 'administrativo' | 'aluno'
          foto_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['perfis']['Row']> & { id: string; nome: string }
        Update: Partial<Database['public']['Tables']['perfis']['Row']>
      }
      modalidades: {
        Row: {
          id: string
          academia_id: string
          nome: string
          descricao: string | null
          tem_graus: boolean
          max_graus: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['modalidades']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['modalidades']['Row']>
      }
      graduacoes: {
        Row: {
          id: string
          modalidade_id: string
          nome: string
          cor_hex: string
          sequencia: number
          tempo_minimo_dias: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['graduacoes']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['graduacoes']['Row']>
      }
      pacotes: {
        Row: {
          id: string
          academia_id: string
          nome: string
          descricao: string | null
          modalidade_id: string | null
          valor: number
          periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual'
          numero_aulas_semana: number | null
          ativo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pacotes']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['pacotes']['Row']>
      }
      alunos: {
        Row: {
          id: string
          user_id: string | null
          academia_id: string
          nome: string
          cpf: string
          email: string
          telefone: string
          data_nascimento: string
          foto_url: string | null
          status: 'ativo' | 'inativo' | 'suspenso'
          modalidade_id: string
          graduacao_id: string | null
          grau_atual: number
          pacote_id: string | null
          data_matricula: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alunos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['alunos']['Row']>
      }
      historico_faixas: {
        Row: {
          id: string
          aluno_id: string
          graduacao_id: string
          grau: number
          data_promocao: string
          professor_id: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['historico_faixas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['historico_faixas']['Row']>
      }
      turmas: {
        Row: {
          id: string
          academia_id: string
          nome: string
          modalidade_id: string
          professor_id: string | null
          nivel: 'iniciante' | 'intermediario' | 'avancado' | 'todos'
          capacidade_maxima: number
          ativa: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['turmas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['turmas']['Row']>
      }
      horarios: {
        Row: {
          id: string
          turma_id: string
          dia_semana: number
          hora_inicio: string
          hora_fim: string
        }
        Insert: Omit<Database['public']['Tables']['horarios']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['horarios']['Row']>
      }
      checkins: {
        Row: {
          id: string
          turma_id: string
          aluno_id: string
          data: string
          hora_checkin: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['checkins']['Row']>
      }
      mensalidades: {
        Row: {
          id: string
          turma_id: string
          aluno_id: string
          valor: number
          vencimento: string
          status: 'pago' | 'pendente' | 'atrasado' | 'cancelado'
          data_pagamento: string | null
          metodo: 'dinheiro' | 'pix' | 'cartao' | 'boleto' | null
          desconto: number | null
          multa: number | null
          observacoes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mensalidades']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['mensalidades']['Row']>
      }
      comunicados: {
        Row: {
          id: string
          academia_id: string
          titulo: string
          mensagem: string
          tipo: 'geral' | 'financeiro' | 'evento' | 'urgente'
          destinatarios: 'todos' | 'ativos' | 'inadimplentes'
          criado_por: string | null
          enviado_push: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comunicados']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['comunicados']['Row']>
      }
      push_subscriptions: {
        Row: {
          id: string
          aluno_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['push_subscriptions']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Row']>
      }
    }
    Functions: {
      minha_academia_id: { Args: Record<never, never>; Returns: string }
      meu_role: { Args: Record<never, never>; Returns: string }
    }
  }
}
