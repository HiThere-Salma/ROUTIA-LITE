import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Map, Loader, ExternalLink } from 'lucide-react'

const MAPQUEST_KEY = import.meta.env.VITE_MAPQUEST_KEY

type RouteData = {
  id: string
  date: string
  heure_depart: string
  heure_fin: string
  distance_totale: string
  tracking_token: string
  prenom: string
  nom: string
  telephone: string
  commandeCount: number
}

export default function RoutesTestPage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [routeCommandes, setRouteCommandes] = useState<Record<string, any[]>>({})
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  async function fetchRoutes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, date, heure_depart, heure_fin, distance_totale, tracking_token,
          utilisateurs!transporteur_id(prenom, nom, telephone),
          commandes(id)
        `)
        .order('date', { ascending: false })

      if (error) throw error

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.date,
        heure_depart: r.heure_depart,
        heure_fin: r.heure_fin,
        distance_totale: r.distance_totale,
        tracking_token: r.tracking_token,
        prenom: r.utilisateurs?.prenom ?? '—',
        nom: r.utilisateurs?.nom ?? '—',
        telephone: r.utilisateurs?.telephone ?? '—',
        commandeCount: r.commandes?.length ?? 0,
      }))

      setRoutes(mapped)
    } catch (err) {
      console.error('Erreur routes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCommandesForRoute(routeId: string) {
    if (routeCommandes[routeId]) return routeCommandes[routeId]
    const { data } = await supabase
      .from('commandes')
      .select('adresse_collecte, adresse_livraison')
      .eq('route_id', routeId)
    const result = data ?? []
    setRouteCommandes(prev => ({ ...prev, [routeId]: result }))
    return result
  }

  function buildGoogleMapsUrl(commandes: any[]) {
    if (commandes.length === 0) return 'https://www.google.com/maps'
    const collectes = commandes.map(c => encodeURIComponent(c.adresse_collecte))
    const livraisons = commandes.map(c => encodeURIComponent(c.adresse_livraison))
    const waypoints = [...collectes, ...livraisons].join('/')
    return `https://www.google.com/maps/dir/${waypoints}`
  }
  async function handleOpenMaps(routeId: string) {
    const startLocation = prompt('Entrez votre adresse de départ :')
    if (!startLocation) return

    setLoadingRoute(routeId)
    const cmds = await fetchCommandesForRoute(routeId)
    setLoadingRoute(null)

    if (cmds.length === 0) {
      alert('Aucune commande associée à cette route.')
      return
    }

    try {
      const allAddresses = [
        startLocation,
        ...cmds.map((c: any) => c.adresse_collecte),
        ...cmds.map((c: any) => c.adresse_livraison),
      ]

      const locations = allAddresses.map(a => ({ street: a }))

      const response = await fetch(
        `https://www.mapquestapi.com/directions/v2/optimizedroute?key=${MAPQUEST_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locations,
            options: { routeType: 'fastest' },
          }),
        }
      )

      const data = await response.json()
      console.log('MapQuest response:', data)

      if (data.info?.statuscode !== 0) {
        console.error('MapQuest error:', data.info)
        const messages = data.info?.messages ?? []
        const isAddressError = data.info?.statuscode === 402

        if (isAddressError) {
          const confirm = window.confirm(
            '⚠️ Les adresses des commandes sont trop imprécises pour optimiser l\'itinéraire.\n\n' +
            'Exemple d\'adresse valide : "1234 Rue Sainte-Catherine, Montréal, QC"\n\n' +
            'Voulez-vous quand même ouvrir Google Maps sans optimisation ?'
          )
          if (!confirm) return
        }

        const waypoints = allAddresses.map(a => encodeURIComponent(a)).join('/')
        window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank')
        return
      }

      const orderedIndexes: number[] = data.route?.locationSequence ?? []
      const orderedAddresses = orderedIndexes.map(i => allAddresses[i])
      const waypoints = orderedAddresses.map(a => encodeURIComponent(a)).join('/')
      window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank')

    } catch (err) {
      console.error('Erreur MapQuest:', err)
      const waypoints = [startLocation, ...cmds.map((c: any) => c.adresse_collecte), ...cmds.map((c: any) => c.adresse_livraison)]
        .map(a => encodeURIComponent(a)).join('/')
      window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank')
    }
  }

  const filtered = filterDate
    ? routes.filter(r => r.date === filterDate)
    : routes

  const uniqueDates = [...new Set(routes.map(r => r.date))].sort().reverse()

  return (
    <div className="agri-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Routes & Navigation</h1>
        <p className="dashboard-sub">Liste des routes assignées aux transporteurs.</p>
      </div>

      <div className="agri-toolbar">
        <select
          className="agri-btn-outline"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
        >
          <option value="">Toutes les dates</option>
          {uniqueDates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className="agri-toolbar-updated">{filtered.length} ROUTE{filtered.length !== 1 ? 'S' : ''}</span>
      </div>

      <div className="agri-table-wrap">
        {loading ? (
          <div className="panel-empty">
            <Loader size={28} color="var(--text-dim)" />
            <span>Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel-empty">
            <Map size={28} color="var(--text-dim)" />
            <span>Aucune route pour le moment</span>
          </div>
        ) : (
          <table className="agri-table">
            <thead>
              <tr>
                <th>Transporteur</th>
                <th>Date</th>
                <th>Heure départ</th>
                <th>Heure fin</th>
                <th>Distance</th>
                <th>Commandes</th>
                <th>Tracking token</th>
                <th>Navigation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const initials = `${r.nom[0] ?? '?'}${r.prenom[0] ?? '?'}`
                const isLoadingThis = loadingRoute === r.id
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="tr-name-cell">
                        <span className="tr-avatar" style={{ background: '#14281e', color: '#4ade80' }}>
                          {initials}
                        </span>
                        <div className="tr-name-info">
                          <span className="tr-fullname">{r.prenom} {r.nom}</span>
                          <span className="tr-id">{r.telephone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="agri-mono">{r.date}</td>
                    <td className="agri-mono">{r.heure_depart?.slice(0, 5)}</td>
                    <td className="agri-mono">{r.heure_fin?.slice(0, 5)}</td>
                    <td className="agri-mono" style={{ color: 'var(--green)' }}>{r.distance_totale} km</td>
                    <td>
                      {r.commandeCount === 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#2a1010', color: '#f87171',
                          border: '1px solid #f8717144', borderRadius: 4,
                          fontSize: 11, padding: '3px 8px', fontFamily: 'var(--font-mono)'
                        }}>
                          ⚠ Aucune commande
                        </span>
                      ) : (
                        <span style={{
                          background: 'var(--green-dim)', color: 'var(--green)',
                          border: '1px solid var(--green-mid)', borderRadius: 4,
                          fontSize: 11, padding: '3px 8px', fontFamily: 'var(--font-mono)'
                        }}>
                          {r.commandeCount} commande{r.commandeCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="agri-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.tracking_token?.slice(0, 16)}…
                      </span>
                    </td>
                    <td>
                      <button
                        className="agri-action-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          width: 'auto',
                          padding: '0 12px',
                          fontSize: 12,
                          color: isLoadingThis ? 'var(--text-dim)' : 'var(--green)',
                          borderColor: isLoadingThis ? 'var(--border)' : 'var(--green-mid)',
                        }}
                        onClick={() => handleOpenMaps(r.id)}
                        disabled={isLoadingThis}
                        title="Ouvrir l'itinéraire dans Google Maps"
                      >
                        {isLoadingThis ? <Loader size={12} /> : <ExternalLink size={12} />}
                        <span>Google Maps</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}