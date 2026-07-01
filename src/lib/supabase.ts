import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. Copie .env.example para .env e preencha.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper: retorna sessão atual ou null
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
