export type Agriculteur = {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  cin: string | null
  telephone: string | null
  numero_civique: string | null
  rue: string | null
  ville: string | null
  code_postal: string | null
  quartier: string | null
  date_creation: string
  is_archived: boolean
}
