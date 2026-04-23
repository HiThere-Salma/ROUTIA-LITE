import { getSupabaseClient } from '../../../lib/supabase'
import type { Transporteur } from '../types/transporteur.types'
import type { TransporteurFormValues } from '../types/transporteurForm.types'
import { PAGE_SIZE } from '../constants/transporteur.constants'

export type TransporteurListResult = {
  transporteurs: Transporteur[]
  total: number
}

export async function fetchTransporteurs(page: number): Promise<TransporteurListResult> {
  const supabase = getSupabaseClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('utilisateurs')
    .select(
      'id, prenom, nom, email, cin, telephone, numero_civique, rue, ville, numero_permis, permis_valide, assurance_valide, visite_valide, date_creation, is_archived',
      { count: 'exact' }
    )
    .eq('role', 'transporteur')
    .eq('is_archived', false)
    .order('date_creation', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    transporteurs: data ?? [],
    total: count ?? 0,
  }
}

export async function createTransporteur(values: TransporteurFormValues): Promise<Transporteur> {
  const supabase = getSupabaseClient()
  const { adresse, ...rest } = values

  const { data, error } = await supabase
    .from('utilisateurs')
    .insert({ ...rest, rue: adresse, role: 'transporteur' })
    .select('id, prenom, nom, email, cin, telephone, numero_civique, rue, ville, numero_permis, permis_valide, assurance_valide, visite_valide, date_creation, is_archived')
    .single()

  if (error) throw error
  return data
}

export async function updateTransporteur(id: string, values: TransporteurFormValues): Promise<Transporteur> {
  const supabase = getSupabaseClient()
  const { adresse, ...rest } = values

  const { data, error } = await supabase
    .from('utilisateurs')
    .update({ ...rest, rue: adresse })
    .eq('id', id)
    .select('id, prenom, nom, email, cin, telephone, numero_civique, rue, ville, numero_permis, permis_valide, assurance_valide, visite_valide, date_creation, is_archived')
    .single()

  if (error) throw error
  return data
}

export async function archiveTransporteur(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('utilisateurs').update({ is_archived: true }).eq('id', id)
  if (error) throw error
}

export async function reactivateTransporteur(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('utilisateurs').update({ is_archived: false }).eq('id', id)
  if (error) throw error
}

export async function fetchArchivedTransporteurs(page: number): Promise<TransporteurListResult> {
  const supabase = getSupabaseClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('utilisateurs')
    .select(
      'id, prenom, nom, email, cin, telephone, numero_civique, rue, ville, numero_permis, permis_valide, assurance_valide, visite_valide, date_creation, is_archived',
      { count: 'exact' }
    )
    .eq('role', 'transporteur')
    .eq('is_archived', true)
    .order('date_creation', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    transporteurs: data ?? [],
    total: count ?? 0,
  }
}
