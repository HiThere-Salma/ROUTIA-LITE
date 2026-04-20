export type Transporteur = {
  id: string
  prenom: string
  nom: string
  email: string
  cin: string | null
  telephone: string | null
  numero_civique: string | null
  rue: string | null
  ville: string | null
  numero_permis: string | null
  permis_valide: boolean | null
  assurance_valide: boolean | null
  visite_valide: boolean | null
  date_creation: string
  is_archived: boolean
}
