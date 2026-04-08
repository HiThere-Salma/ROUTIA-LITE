import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL //a remplacer
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY //a remplacer

export const supabase = createClient(supabaseUrl, supabaseAnonKey)