export type UserRole = 'dev' | 'proprietario' | 'professor' | 'aluno' | 'administrativo'
export type AlunoStatus = 'ativo' | 'inativo' | 'suspenso'
export type PagamentoMetodo = 'dinheiro' | 'pix' | 'cartao' | 'boleto'
export type PagamentoStatus = 'pago' | 'pendente' | 'atrasado' | 'cancelado'
export type Periodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual'

export interface Pacote {
  id: string
  academia_id: string
  nome: string
  descricao?: string
  modalidade_id?: string   // null = vale para qualquer modalidade
  valor: number            // valor total do período
  periodicidade: Periodicidade
  numero_aulas_semana?: number  // limite de aulas/semana (opcional)
  ativo: boolean
}

export interface User {
  id: string
  nome: string
  email: string
  foto_url?: string
  role: UserRole
  academia_id: string | null  // null para dev (acessa todas)
}

export interface HorarioFuncionamento {
  dia_semana: number  // 0=Dom … 6=Sab
  abertura: string    // HH:mm
  fechamento: string
  fechado: boolean
}

export interface Academia {
  id: string
  nome: string
  logo_url?: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  telefone: string
  email: string
  pix?: string
  instagram?: string
  website?: string
  horarios_funcionamento: HorarioFuncionamento[]
  tema: {
    cor_primaria: string
    cor_secundaria: string
    cor_destaque: string
  }
  criada_em: string
}

export interface Modalidade {
  id: string
  nome: string
  descricao?: string
  academia_id: string
  tem_graus?: boolean   // true para modalidades com graus/stripes (BJJ)
  max_graus?: number    // padrão 4
}

export interface Graduacao {
  id: string
  modalidade_id: string
  nome: string
  cor_hex: string
  sequencia: number
  tempo_minimo_dias?: number
}

export interface HistoricoFaixa {
  id: string
  aluno_id: string
  graduacao_id: string
  graduacao: Graduacao
  grau?: number         // 0 = recebeu faixa sem grau, 1-4 = graus/stripes
  data_promocao: string
  professor_id?: string
  observacoes?: string
  certificado_url?: string
}

export interface Aluno {
  id: string
  academia_id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string
  foto_url?: string
  status: AlunoStatus
  modalidade_principal_id: string
  modalidade_principal: Modalidade
  graduacao_atual_id?: string
  graduacao_atual?: Graduacao
  grau_atual?: number   // grau/stripe atual na faixa corrente (0-4)
  pacote_id?: string
  pacote?: Pacote
  historico_faixas: HistoricoFaixa[]
  data_matricula: string
}

export interface Turma {
  id: string
  academia_id: string
  nome: string
  modalidade_id: string
  modalidade: Modalidade
  professor_id: string
  professor?: User
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'todos'
  capacidade_maxima: number
  horarios: Horario[]
  ativa: boolean
}

export interface CheckIn {
  id: string
  turma_id: string
  aluno_id: string
  data: string
  hora_checkin: string
  turma?: Turma
  aluno?: Aluno
}

export interface Horario {
  id: string
  turma_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

export interface Mensalidade {
  id: string
  turma_id: string
  aluno_id: string
  aluno?: Aluno
  valor: number
  vencimento: string
  status: PagamentoStatus
  data_pagamento?: string
  metodo?: PagamentoMetodo
  desconto?: number
  multa?: number
  comprovante_url?: string
  observacoes?: string
}

export type ComunicadoTipo = 'geral' | 'financeiro' | 'evento' | 'urgente'
export type ComunicadoDestinatarios = 'todos' | 'ativos' | 'inadimplentes'

export interface Comunicado {
  id: string
  academia_id: string
  titulo: string
  mensagem: string
  tipo: ComunicadoTipo
  destinatarios: ComunicadoDestinatarios
  criado_em: string
  criado_por: string
}

export interface Certificado {
  id: string
  aluno_id: string
  historico_faixa_id: string
  numero_sequencial: string
  pdf_url: string
  data_emissao: string
  faixa_nome: string
}
