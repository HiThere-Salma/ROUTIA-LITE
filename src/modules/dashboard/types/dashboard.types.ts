export type DashboardStats = {
  totalCommandes: number
  commandesEnCours: number
  transporteursEnLivraison: number
  kmDuMois: number
  routesEnCours: number
  routesLivreesDuMois: number
  commandesLivreesDuMois: number
}

export type CommandeRecente = {
  id: string
  produit: string
  prix: number
  statut: string
  date_collecte: string
  agriculteur_id: string
  utilisateurs: { prenom: string; nom: string } | null
}

export type RouteRecente = {
  id: string
  transporteur_id: string
  date: string
  heure_depart: string
  heure_fin: string
  distance_totale: number
  utilisateurs: { prenom: string; nom: string } | null
}
