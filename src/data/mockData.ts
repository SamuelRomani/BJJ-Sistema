import type { Academia, Modalidade, Graduacao, Aluno, Turma, Mensalidade, User, CheckIn, Pacote } from '@/types'

const DIAS_SEMANA_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

function horariosPadrao(aberto = [1,2,3,4,5], abertura = '07:00', fechamento = '22:00') {
  return Array.from({ length: 7 }, (_, i) => ({
    dia_semana: i,
    abertura,
    fechamento,
    fechado: !aberto.includes(i),
  }))
}

export const mockAcademias: Academia[] = [
  {
    id: '1',
    nome: 'TatameHoje SP',
    endereco: 'Rua das Lutas, 123',
    bairro: 'Vila Mariana',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04101-000',
    telefone: '(11) 99999-1111',
    email: 'sp@tatamehoje.com.br',
    pix: '11.999.991111/0001-SP',
    instagram: '@tatamehoje_sp',
    website: 'www.tatamehoje.com.br',
    horarios_funcionamento: horariosPadrao([1,2,3,4,5,6], '06:30', '22:00'),
    tema: { cor_primaria: '#1e40af', cor_secundaria: '#3b82f6', cor_destaque: '#f59e0b' },
    criada_em: '2020-01-15',
  },
  {
    id: '2',
    nome: 'TatameHoje RJ',
    endereco: 'Av. Brasil, 500',
    bairro: 'Botafogo',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '22250-040',
    telefone: '(21) 98888-2222',
    email: 'rj@tatamehoje.com.br',
    pix: '21.988.882222/0001-RJ',
    instagram: '@tatamehoje_rj',
    horarios_funcionamento: horariosPadrao([1,2,3,4,5,6], '07:00', '21:00'),
    tema: { cor_primaria: '#065f46', cor_secundaria: '#10b981', cor_destaque: '#f97316' },
    criada_em: '2021-06-10',
  },
  {
    id: '3',
    nome: 'Arena Guerreiros',
    endereco: 'Rua XV de Novembro, 88',
    bairro: 'Centro',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80020-310',
    telefone: '(41) 97777-3333',
    email: 'contato@arenaguerreiros.com.br',
    pix: 'contato@arenaguerreiros.com.br',
    horarios_funcionamento: horariosPadrao([1,2,3,4,5], '08:00', '21:00'),
    tema: { cor_primaria: '#7c3aed', cor_secundaria: '#8b5cf6', cor_destaque: '#ef4444' },
    criada_em: '2022-03-01',
  },
]

// Alias para compatibilidade com código que usa mockAcademia singular
export const mockAcademia = mockAcademias[0]

export const mockModalidades: Modalidade[] = [
  { id: '1', nome: 'BJJ', descricao: 'Brazilian Jiu Jitsu', academia_id: '1', tem_graus: true, max_graus: 4 },
  { id: '2', nome: 'Boxe', descricao: 'Boxe Olímpico', academia_id: '1' },
  { id: '3', nome: 'Muay Thai', descricao: 'Arte Marcial Tailandesa', academia_id: '1' },
  { id: '4', nome: 'Judô', descricao: 'Arte Marcial Japonesa', academia_id: '1' },
  { id: '5', nome: 'Luta Livre', descricao: 'Wrestling Brasileiro', academia_id: '1' },
  // Academia 2
  { id: '6', nome: 'BJJ', descricao: 'Brazilian Jiu Jitsu', academia_id: '2', tem_graus: true, max_graus: 4 },
  { id: '7', nome: 'Muay Thai', descricao: 'Arte Marcial Tailandesa', academia_id: '2' },
]

export const mockGraduacoes: Graduacao[] = [
  // BJJ (academia 1 e 2)
  { id: 'bjj-1', modalidade_id: '1', nome: 'Faixa Branca', cor_hex: '#e5e7eb', sequencia: 1 },
  { id: 'bjj-2', modalidade_id: '1', nome: 'Faixa Cinza',  cor_hex: '#9ca3af', sequencia: 2, tempo_minimo_dias: 180 },
  { id: 'bjj-3', modalidade_id: '1', nome: 'Faixa Amarela',cor_hex: '#fbbf24', sequencia: 3, tempo_minimo_dias: 365 },
  { id: 'bjj-4', modalidade_id: '1', nome: 'Faixa Laranja',cor_hex: '#f97316', sequencia: 4, tempo_minimo_dias: 540 },
  { id: 'bjj-5', modalidade_id: '1', nome: 'Faixa Verde',  cor_hex: '#22c55e', sequencia: 5, tempo_minimo_dias: 720 },
  { id: 'bjj-6', modalidade_id: '1', nome: 'Faixa Azul',   cor_hex: '#3b82f6', sequencia: 6, tempo_minimo_dias: 365 },
  { id: 'bjj-7', modalidade_id: '1', nome: 'Faixa Roxa',   cor_hex: '#8b5cf6', sequencia: 7, tempo_minimo_dias: 730 },
  { id: 'bjj-8', modalidade_id: '1', nome: 'Faixa Marrom', cor_hex: '#92400e', sequencia: 8, tempo_minimo_dias: 730 },
  { id: 'bjj-9', modalidade_id: '1', nome: 'Faixa Preta',  cor_hex: '#111827', sequencia: 9, tempo_minimo_dias: 1095 },
  // Muay Thai
  { id: 'mt-1', modalidade_id: '3', nome: 'Sem Graduação',    cor_hex: '#e5e7eb', sequencia: 1 },
  { id: 'mt-2', modalidade_id: '3', nome: 'Mongkol Amarelo',  cor_hex: '#fbbf24', sequencia: 2, tempo_minimo_dias: 180 },
  { id: 'mt-3', modalidade_id: '3', nome: 'Mongkol Verde',    cor_hex: '#22c55e', sequencia: 3, tempo_minimo_dias: 365 },
  { id: 'mt-4', modalidade_id: '3', nome: 'Mongkol Vermelho', cor_hex: '#ef4444', sequencia: 4, tempo_minimo_dias: 730 },
  // Judô
  { id: 'ju-1', modalidade_id: '4', nome: 'Faixa Branca', cor_hex: '#e5e7eb', sequencia: 1 },
  { id: 'ju-2', modalidade_id: '4', nome: 'Faixa Amarela',cor_hex: '#fbbf24', sequencia: 2, tempo_minimo_dias: 180 },
  { id: 'ju-3', modalidade_id: '4', nome: 'Faixa Laranja',cor_hex: '#f97316', sequencia: 3, tempo_minimo_dias: 365 },
  { id: 'ju-4', modalidade_id: '4', nome: 'Faixa Verde',  cor_hex: '#22c55e', sequencia: 4, tempo_minimo_dias: 540 },
  { id: 'ju-5', modalidade_id: '4', nome: 'Faixa Azul',   cor_hex: '#3b82f6', sequencia: 5, tempo_minimo_dias: 720 },
  { id: 'ju-6', modalidade_id: '4', nome: 'Faixa Marrom', cor_hex: '#92400e', sequencia: 6, tempo_minimo_dias: 900 },
  { id: 'ju-7', modalidade_id: '4', nome: 'Faixa Preta',  cor_hex: '#111827', sequencia: 7, tempo_minimo_dias: 1095 },
]

export const mockPacotes: Pacote[] = [
  // Academia 1 — SP
  {
    id: 'pk1', academia_id: '1', nome: 'BJJ Mensal',
    descricao: 'Acesso ilimitado às turmas de BJJ', modalidade_id: '1',
    valor: 200, periodicidade: 'mensal', numero_aulas_semana: undefined, ativo: true,
  },
  {
    id: 'pk2', academia_id: '1', nome: 'BJJ Trimestral',
    descricao: '3 meses com desconto — economize R$ 60', modalidade_id: '1',
    valor: 540, periodicidade: 'trimestral', ativo: true,
  },
  {
    id: 'pk3', academia_id: '1', nome: 'BJJ Anual',
    descricao: '12 meses com o maior desconto — economize R$ 480', modalidade_id: '1',
    valor: 1920, periodicidade: 'anual', ativo: true,
  },
  {
    id: 'pk4', academia_id: '1', nome: 'Combo BJJ + Muay Thai',
    descricao: 'Acesso ilimitado a BJJ e Muay Thai',
    valor: 300, periodicidade: 'mensal', ativo: true,
  },
  {
    id: 'pk5', academia_id: '1', nome: 'Muay Thai Mensal',
    descricao: 'Acesso ilimitado às turmas de Muay Thai', modalidade_id: '3',
    valor: 170, periodicidade: 'mensal', ativo: true,
  },
  {
    id: 'pk6', academia_id: '1', nome: 'BJJ 2x por semana',
    descricao: 'Plano limitado a 2 aulas por semana', modalidade_id: '1',
    valor: 140, periodicidade: 'mensal', numero_aulas_semana: 2, ativo: false,
  },
  // Academia 2 — RJ
  {
    id: 'pk7', academia_id: '2', nome: 'BJJ Mensal',
    descricao: 'Acesso ilimitado às turmas de BJJ', modalidade_id: '6',
    valor: 220, periodicidade: 'mensal', ativo: true,
  },
  {
    id: 'pk8', academia_id: '2', nome: 'BJJ Trimestral',
    descricao: '3 meses com desconto', modalidade_id: '6',
    valor: 594, periodicidade: 'trimestral', ativo: true,
  },
]

export const mockProfessores: User[] = [
  { id: 'p1', nome: 'Carlos Gracie Jr.', email: 'carlos@academia.com', role: 'professor', academia_id: '1' },
  { id: 'p2', nome: 'Ana Silva',          email: 'ana@academia.com',    role: 'professor', academia_id: '1' },
  { id: 'p3', nome: 'Rafael Costa',       email: 'rafael@academia.com', role: 'professor', academia_id: '2' },
]

// Usuários de login (email + senha para demonstração)
export interface UserCredential extends User {
  senha: string
}

export const mockUsuarios: UserCredential[] = [
  // Dev (acessa todas as academias)
  { id: 'dev1', nome: 'Dev Admin', email: 'dev@tatamehoje.com', role: 'dev', academia_id: null, senha: 'dev123' },
  // Proprietários
  { id: 'owner1', nome: 'Roberto Almeida', email: 'roberto@tatamesp.com', role: 'proprietario', academia_id: '1', senha: '123456' },
  { id: 'owner2', nome: 'Fernanda Lima', email: 'fernanda@tatamerj.com', role: 'proprietario', academia_id: '2', senha: '123456' },
  { id: 'owner3', nome: 'Paulo Guerreiro', email: 'paulo@arenaguerreiros.com', role: 'proprietario', academia_id: '3', senha: '123456' },
  // Professores (reutilizam os mockProfessores + senha)
  { id: 'p1', nome: 'Carlos Gracie Jr.', email: 'carlos@academia.com', role: 'professor', academia_id: '1', senha: 'prof123' },
  { id: 'p2', nome: 'Ana Silva', email: 'ana@academia.com', role: 'professor', academia_id: '1', senha: 'prof123' },
  { id: 'p3', nome: 'Rafael Costa', email: 'rafael@academia.com', role: 'professor', academia_id: '2', senha: 'prof123' },
  // Administrativo
  { id: 'adm1', nome: 'Juliana Campos', email: 'juliana@tatamesp.com', role: 'administrativo', academia_id: '1', senha: 'adm123' },
]

export const mockAlunos: Aluno[] = [
  {
    id: 'a1', academia_id: '1', nome: 'João Pedro Santos', cpf: '12345678901',
    email: 'joao@email.com', telefone: '11991234567', data_nascimento: '1995-03-15',
    status: 'ativo', modalidade_principal_id: '1', modalidade_principal: mockModalidades[0],
    graduacao_atual_id: 'bjj-6', graduacao_atual: mockGraduacoes[5], grau_atual: 2,
    pacote_id: 'pk2', pacote: undefined as unknown as Pacote,
    historico_faixas: [
      { id: 'hf1',  aluno_id: 'a1', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 0, data_promocao: '2020-01-10' },
      { id: 'hf1b', aluno_id: 'a1', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 1, data_promocao: '2020-04-15' },
      { id: 'hf1c', aluno_id: 'a1', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 2, data_promocao: '2020-07-10' },
      { id: 'hf2',  aluno_id: 'a1', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 0, data_promocao: '2021-02-20' },
      { id: 'hf2b', aluno_id: 'a1', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 1, data_promocao: '2022-03-15' },
      { id: 'hf2c', aluno_id: 'a1', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 2, data_promocao: '2023-06-20' },
    ],
    data_matricula: '2020-01-10',
  },
  {
    id: 'a2', academia_id: '1', nome: 'Maria Clara Oliveira', cpf: '98765432100',
    email: 'maria@email.com', telefone: '11987654321', data_nascimento: '2000-07-22',
    status: 'ativo', modalidade_principal_id: '1', modalidade_principal: mockModalidades[0],
    graduacao_atual_id: 'bjj-6', graduacao_atual: mockGraduacoes[5], grau_atual: 1,
    pacote_id: 'pk1', pacote: undefined as unknown as Pacote,
    historico_faixas: [
      { id: 'hf7',  aluno_id: 'a2', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 0, data_promocao: '2022-03-01' },
      { id: 'hf7b', aluno_id: 'a2', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 1, data_promocao: '2022-07-10' },
      { id: 'hf7c', aluno_id: 'a2', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 2, data_promocao: '2022-11-20' },
      { id: 'hf8',  aluno_id: 'a2', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 0, data_promocao: '2023-05-15' },
      { id: 'hf8b', aluno_id: 'a2', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 1, data_promocao: '2024-01-10' },
    ],
    data_matricula: '2022-03-01',
  },
  {
    id: 'a3', academia_id: '1', nome: 'Lucas Ferreira', cpf: '11122233344',
    email: 'lucas@email.com', telefone: '11944445555', data_nascimento: '1998-11-30',
    status: 'ativo', modalidade_principal_id: '3', modalidade_principal: mockModalidades[2],
    graduacao_atual_id: 'mt-2', graduacao_atual: mockGraduacoes[9],
    pacote_id: 'pk5', pacote: undefined as unknown as Pacote,
    historico_faixas: [
      { id: 'hf10', aluno_id: 'a3', graduacao_id: 'mt-1', graduacao: mockGraduacoes[9],  data_promocao: '2023-01-15' },
      { id: 'hf11', aluno_id: 'a3', graduacao_id: 'mt-2', graduacao: mockGraduacoes[10], data_promocao: '2023-09-01' },
    ],
    data_matricula: '2023-01-15',
  },
  {
    id: 'a4', academia_id: '1', nome: 'Ana Beatriz Costa', cpf: '55566677788',
    email: 'ana.b@email.com', telefone: '11955556666', data_nascimento: '2003-05-18',
    status: 'ativo', modalidade_principal_id: '1', modalidade_principal: mockModalidades[0],
    graduacao_atual_id: 'bjj-1', graduacao_atual: mockGraduacoes[0], grau_atual: 0,
    historico_faixas: [
      { id: 'hf12', aluno_id: 'a4', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], grau: 0, data_promocao: '2024-02-01' },
    ],
    data_matricula: '2024-02-01',
  },
  {
    id: 'a5', academia_id: '1', nome: 'Pedro Henrique Lima', cpf: '99988877766',
    email: 'pedro@email.com', telefone: '11966667777', data_nascimento: '1992-09-10',
    status: 'suspenso', modalidade_principal_id: '1', modalidade_principal: mockModalidades[0],
    graduacao_atual_id: 'bjj-7', graduacao_atual: mockGraduacoes[6], grau_atual: 3,
    historico_faixas: [
      { id: 'hf13',  aluno_id: 'a5', graduacao_id: 'bjj-6', graduacao: mockGraduacoes[5], grau: 0, data_promocao: '2019-01-01' },
      { id: 'hf13b', aluno_id: 'a5', graduacao_id: 'bjj-7', graduacao: mockGraduacoes[6], grau: 0, data_promocao: '2021-05-15' },
      { id: 'hf13c', aluno_id: 'a5', graduacao_id: 'bjj-7', graduacao: mockGraduacoes[6], grau: 1, data_promocao: '2022-08-01' },
      { id: 'hf13d', aluno_id: 'a5', graduacao_id: 'bjj-7', graduacao: mockGraduacoes[6], grau: 2, data_promocao: '2023-04-10' },
      { id: 'hf13e', aluno_id: 'a5', graduacao_id: 'bjj-7', graduacao: mockGraduacoes[6], grau: 3, data_promocao: '2024-02-20' },
    ],
    data_matricula: '2018-03-01',
  },
  // Academia 2
  {
    id: 'a6', academia_id: '2', nome: 'Fernanda Rocha', cpf: '33344455566',
    email: 'fernanda@email.com', telefone: '21977778888', data_nascimento: '1997-04-12',
    status: 'ativo', modalidade_principal_id: '6', modalidade_principal: mockModalidades[5],
    graduacao_atual_id: 'bjj-4', graduacao_atual: mockGraduacoes[3],
    historico_faixas: [
      { id: 'hf15', aluno_id: 'a6', graduacao_id: 'bjj-1', graduacao: mockGraduacoes[0], data_promocao: '2021-05-01' },
      { id: 'hf16', aluno_id: 'a6', graduacao_id: 'bjj-3', graduacao: mockGraduacoes[2], data_promocao: '2022-08-10' },
      { id: 'hf17', aluno_id: 'a6', graduacao_id: 'bjj-4', graduacao: mockGraduacoes[3], data_promocao: '2023-11-20' },
    ],
    data_matricula: '2021-05-01',
  },
]

export const mockTurmas: Turma[] = [
  {
    id: 't1', academia_id: '1', nome: 'BJJ Iniciante',
    modalidade_id: '1', modalidade: mockModalidades[0],
    professor_id: 'p1', professor: mockProfessores[0],
    nivel: 'iniciante', capacidade_maxima: 20,
    horarios: [
      { id: 'h1', turma_id: 't1', dia_semana: 1, hora_inicio: '07:00', hora_fim: '08:30' },
      { id: 'h2', turma_id: 't1', dia_semana: 3, hora_inicio: '07:00', hora_fim: '08:30' },
      { id: 'h3', turma_id: 't1', dia_semana: 5, hora_inicio: '07:00', hora_fim: '08:30' },
    ],
    ativa: true,
  },
  {
    id: 't2', academia_id: '1', nome: 'BJJ Avançado',
    modalidade_id: '1', modalidade: mockModalidades[0],
    professor_id: 'p1', professor: mockProfessores[0],
    nivel: 'avancado', capacidade_maxima: 15,
    horarios: [
      { id: 'h4', turma_id: 't2', dia_semana: 2, hora_inicio: '19:00', hora_fim: '20:30' },
      { id: 'h5', turma_id: 't2', dia_semana: 4, hora_inicio: '19:00', hora_fim: '20:30' },
      { id: 'h6', turma_id: 't2', dia_semana: 6, hora_inicio: '09:00', hora_fim: '10:30' },
    ],
    ativa: true,
  },
  {
    id: 't3', academia_id: '1', nome: 'Muay Thai',
    modalidade_id: '3', modalidade: mockModalidades[2],
    professor_id: 'p2', professor: mockProfessores[1],
    nivel: 'todos', capacidade_maxima: 25,
    horarios: [
      { id: 'h7', turma_id: 't3', dia_semana: 1, hora_inicio: '18:00', hora_fim: '19:30' },
      { id: 'h8', turma_id: 't3', dia_semana: 3, hora_inicio: '18:00', hora_fim: '19:30' },
      { id: 'h9', turma_id: 't3', dia_semana: 5, hora_inicio: '18:00', hora_fim: '19:30' },
    ],
    ativa: true,
  },
  // Academia 2
  {
    id: 't4', academia_id: '2', nome: 'BJJ All Levels',
    modalidade_id: '6', modalidade: mockModalidades[5],
    professor_id: 'p3', professor: mockProfessores[2],
    nivel: 'todos', capacidade_maxima: 18,
    horarios: [
      { id: 'h10', turma_id: 't4', dia_semana: 2, hora_inicio: '07:00', hora_fim: '08:30' },
      { id: 'h11', turma_id: 't4', dia_semana: 4, hora_inicio: '07:00', hora_fim: '08:30' },
      { id: 'h12', turma_id: 't4', dia_semana: 6, hora_inicio: '08:00', hora_fim: '09:30' },
    ],
    ativa: true,
  },
]

export const mockMensalidades: Mensalidade[] = [
  { id: 'm1', turma_id: 't1', aluno_id: 'a1', valor: 180, vencimento: '2024-01-10', status: 'pago', data_pagamento: '2024-01-08', metodo: 'pix' },
  { id: 'm2', turma_id: 't1', aluno_id: 'a1', valor: 180, vencimento: '2024-02-10', status: 'pago', data_pagamento: '2024-02-09', metodo: 'pix' },
  { id: 'm3', turma_id: 't1', aluno_id: 'a1', valor: 180, vencimento: '2024-03-10', status: 'pago', data_pagamento: '2024-03-07', metodo: 'cartao' },
  { id: 'm4', turma_id: 't1', aluno_id: 'a1', valor: 180, vencimento: '2024-04-10', status: 'atrasado' },
  { id: 'm5', turma_id: 't1', aluno_id: 'a2', valor: 180, vencimento: '2024-04-10', status: 'pendente' },
  { id: 'm6', turma_id: 't1', aluno_id: 'a4', valor: 180, vencimento: '2024-02-01', status: 'atrasado' },
  { id: 'm7', turma_id: 't1', aluno_id: 'a5', valor: 180, vencimento: '2024-01-05', status: 'atrasado' },
  { id: 'm8', turma_id: 't3', aluno_id: 'a3', valor: 150, vencimento: '2024-04-15', status: 'pago', data_pagamento: '2024-04-14', metodo: 'dinheiro' },
]

function diasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const mockCheckIns: CheckIn[] = [
  { id: 'ci1',  turma_id: 't1', aluno_id: 'a1', data: diasAtras(7), hora_checkin: '07:05' },
  { id: 'ci2',  turma_id: 't1', aluno_id: 'a2', data: diasAtras(7), hora_checkin: '07:08' },
  { id: 'ci3',  turma_id: 't1', aluno_id: 'a4', data: diasAtras(7), hora_checkin: '07:15' },
  { id: 'ci4',  turma_id: 't1', aluno_id: 'a1', data: diasAtras(5), hora_checkin: '07:02' },
  { id: 'ci5',  turma_id: 't1', aluno_id: 'a2', data: diasAtras(5), hora_checkin: '07:10' },
  { id: 'ci6',  turma_id: 't1', aluno_id: 'a1', data: diasAtras(3), hora_checkin: '07:06' },
  { id: 'ci7',  turma_id: 't1', aluno_id: 'a4', data: diasAtras(3), hora_checkin: '07:20' },
  { id: 'ci8',  turma_id: 't2', aluno_id: 'a5', data: diasAtras(6), hora_checkin: '19:01' },
  { id: 'ci9',  turma_id: 't2', aluno_id: 'a1', data: diasAtras(6), hora_checkin: '19:05' },
  { id: 'ci10', turma_id: 't2', aluno_id: 'a5', data: diasAtras(4), hora_checkin: '19:03' },
  { id: 'ci11', turma_id: 't3', aluno_id: 'a3', data: diasAtras(7), hora_checkin: '18:00' },
  { id: 'ci12', turma_id: 't3', aluno_id: 'a3', data: diasAtras(5), hora_checkin: '18:05' },
  { id: 'ci13', turma_id: 't3', aluno_id: 'a3', data: diasAtras(3), hora_checkin: '18:02' },
  { id: 'ci14', turma_id: 't1', aluno_id: 'a1', data: diasAtras(0), hora_checkin: '07:04' },
  { id: 'ci15', turma_id: 't1', aluno_id: 'a2', data: diasAtras(0), hora_checkin: '07:09' },
]

// Resolve referências de pacotes nos alunos (evita circular reference)
mockAlunos.forEach(a => {
  if (a.pacote_id) {
    a.pacote = mockPacotes.find(p => p.id === a.pacote_id)
  }
})
