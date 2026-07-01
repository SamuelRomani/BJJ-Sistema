import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned[10])
}

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DIAS_SEMANA_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function formatGraduacao(nome: string, grau?: number): string {
  if (!grau || grau === 0) return nome
  return `${nome} ${grau}° Grau`
}
