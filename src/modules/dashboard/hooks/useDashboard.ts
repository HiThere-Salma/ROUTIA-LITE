import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { DashboardStats, CommandeRecente, RouteRecente } from '../types/dashboard.types'

const INITIAL_STATS: DashboardStats = {
  totalCommandes: 0,
  commandesEnCours: 0,
  transporteursEnLivraison: 0,
  kmDuMois: 0,
  routesEnCours: 0,
  routesLivreesDuMois: 0,
  commandesLivreesDuMois: 0,
}

type RoutesAvecCommandesRow = {
  id: string
  transporteur_id: string
  commandes: { statut: string }[] | null
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [commandesRecentes, setCommandesRecentes] = useState<CommandeRecente[]>([])
  const [routesRecentes, setRoutesRecentes] = useState<RouteRecente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const [
        { data: allCommandes },
        { data: recentCommandes },
        { data: routesAvecCommandes },
        { data: commandesLivreesDuMois },
        { data: recentRoutes },
      ] = await Promise.all([
        supabase.from('commandes').select('statut'),
        supabase
          .from('commandes')
          .select('id, produit, prix, statut, date_collecte, agriculteur_id, utilisateurs!agriculteur_id(prenom, nom)')
          .order('date_collecte', { ascending: false })
          .limit(5),
        supabase
          .from('routes')
          .select('id, transporteur_id, commandes!route_id(statut)'),
        supabase
          .from('routes')
          .select('commandes!route_id(distance_estimee, statut)')
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth),
        supabase
          .from('routes')
          .select('id, transporteur_id, date, heure_depart, heure_fin, distance_totale, utilisateurs!transporteur_id(prenom, nom)')
          .order('date', { ascending: false })
          .limit(3),
      ])

      const total = allCommandes?.length ?? 0
      const enCours =
        allCommandes?.filter(c =>
          ['en_attente', 'assignee', 'recuperee', 'en_transport'].includes(c.statut),
        ).length ?? 0

      type RouteAvecCommandesDuMois = { commandes: { distance_estimee: number | null; statut: string }[] | null }
      const routesDuMoisRows = (commandesLivreesDuMois as unknown as RouteAvecCommandesDuMois[]) ?? []
      let kmDuMois = 0
      let commandesLivreesCount = 0
      let routesLivreesCount = 0
      for (const route of routesDuMoisRows) {
        const cmds = route.commandes ?? []
        const allLivree = cmds.length > 0 && cmds.every(c => c.statut === 'livree')
        if (allLivree) routesLivreesCount++
        for (const cmd of cmds) {
          if (cmd.statut === 'livree') {
            commandesLivreesCount++
            kmDuMois += cmd.distance_estimee ?? 0
          }
        }
      }
      kmDuMois = Math.round(kmDuMois)

      const routesAvecCommandesRows = (routesAvecCommandes as unknown as RoutesAvecCommandesRow[]) ?? []

      const uniqueTransporteurIds = new Set<string>()
      let routesEnCoursCount = 0
      for (const route of routesAvecCommandesRows) {
        const cmds = route.commandes ?? []
        const hasEnTransport = cmds.some(c => c.statut === 'en_transport')
        const allDone = cmds.length > 0 && cmds.every(c => c.statut === 'livree' || c.statut === 'terminee')
        const allCancelled = cmds.length > 0 && cmds.every(c => c.statut === 'annulee')
        const isEnCours = hasEnTransport && !allDone && !allCancelled
        if (isEnCours) {
          routesEnCoursCount++
          if (route.transporteur_id) uniqueTransporteurIds.add(route.transporteur_id)
        }
      }

      setStats({
        totalCommandes: total,
        commandesEnCours: enCours,
        transporteursEnLivraison: uniqueTransporteurIds.size,
        kmDuMois,
        routesEnCours: routesEnCoursCount,
        routesLivreesDuMois: routesLivreesCount,
        commandesLivreesDuMois: commandesLivreesCount,
      })

      setCommandesRecentes((recentCommandes as unknown as CommandeRecente[]) ?? [])
      setRoutesRecentes((recentRoutes as unknown as RouteRecente[]) ?? [])
    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { stats, commandesRecentes, routesRecentes, isLoading }
}
