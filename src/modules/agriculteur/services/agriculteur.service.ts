import { getSupabaseClient } from '../../../lib/supabase'
import type { Agriculteur } from '../types/agriculteur.types'
import type { AgriculteurFormValues } from '../types/agriculteurForm.types'
import { PAGE_SIZE } from '../constants/agriculteur.constants'

export type AgriculteurListResult = {
  agriculteurs: Agriculteur[]
  total: number
}

export async function fetchAgriculteurs(page: number): Promise<AgriculteurListResult> {
  const supabase = getSupabaseClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('utilisateurs')
    .select(
      'id, prenom, nom, email, role, cin, telephone, numero_civique, rue, ville, code_postal, quartier, date_creation',
      { count: 'exact' }
    )
    .eq('role', 'agriculteur')
    .order('date_creation', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    agriculteurs: data ?? [],
    total: count ?? 0,
  }
}

export async function createAgriculteur(values: AgriculteurFormValues): Promise<Agriculteur> {
  const supabase = getSupabaseClient()
  const { adresse, ...rest } = values

  const { data, error } = await supabase
    .from('utilisateurs')
    .insert({ ...rest, rue: adresse, role: 'agriculteur' })
    .select('id, prenom, nom, email, role, cin, telephone, numero_civique, rue, ville, code_postal, quartier, date_creation')
    .single()

  if (error) throw error
  return data
}
