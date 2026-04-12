import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Map, Loader, ExternalLink, X, AlertTriangle, Navigation } from 'lucide-react'

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

type ModalState =
  | { type: 'none' }
  | { type: 'input'; routeId: string }
  | { type: 'warning'; allAddresses: string[] }
  | { type: 'noCommandes' }

export default function RoutesTestPage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [routeCommandes, setRouteCommandes] = useState<Record<string, any[]>>({})
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchRoutes() }, [])

  useEffect(() => {
    if (modal.type === 'input') setTimeout(() => inputRef.current?.focus(), 50)
  }, [modal])

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
        id: r.id, date: r.date, heure_depart: r.heure_depart, heure_fin: r.heure_fin,
        distance_totale: r.distance_totale, tracking_token: r.tracking_token,
        prenom: r.utilisateurs?.prenom ?? '—', nom: r.utilisateurs?.nom ?? '—',
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

  async function handleOpenMaps(routeId: string) {
    setInputValue('')
    setModal({ type: 'input', routeId })
  }

  async function handleConfirmAddress() {
    if (modal.type !== 'input') return
    const { routeId } = modal
    const startLocation = inputValue.trim()
    if (!startLocation) return

    setModal({ type: 'none' })
    setLoadingRoute(routeId)
    const cmds = await fetchCommandesForRoute(routeId)
    setLoadingRoute(null)

    if (cmds.length === 0) {
      setModal({ type: 'noCommandes' })
      return
    }

    const allAddresses = [
      startLocation,
      ...cmds.map((c: any) => c.adresse_collecte),
      ...cmds.map((c: any) => c.adresse_livraison),
    ]

    try {
      const response = await fetch(
        `https://www.mapquestapi.com/directions/v2/optimizedroute?key=${MAPQUEST_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locations: allAddresses.map(a => ({ street: a })),
            options: { routeType: 'fastest' },
          }),
        }
      )
      const data = await response.json()

      if (data.info?.statuscode !== 0) {
        if (data.info?.statuscode === 402) {
          setModal({ type: 'warning', allAddresses })
          return
        }
        openGoogleMaps(allAddresses)
        return
      }

      const orderedIndexes: number[] = data.route?.locationSequence ?? []
      const orderedAddresses = orderedIndexes.map(i => allAddresses[i])
      openGoogleMaps(orderedAddresses)
    } catch {
      openGoogleMaps(allAddresses)
    }
  }

  function openGoogleMaps(addresses: string[]) {
    const waypoints = addresses.map(a => encodeURIComponent(a)).join('/')
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank')
  }

  const filtered = filterDate ? routes.filter(r => r.date === filterDate) : routes
  const uniqueDates = [...new Set(routes.map(r => r.date))].sort().reverse()

  return (
    <div className="agri-page">
      {/* MODAL BACKDROP */}
      {modal.type !== 'none' && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={() => setModal({ type: 'none' })}
        >
          <div
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '28px 28px 24px', width: 420, display: 'flex', flexDirection: 'column', gap: 18,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* ADDRESS INPUT MODAL */}
            {modal.type === 'input' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Navigation size={18} color="var(--green)" />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Adresse de départ</span>
                  </div>
                  <button className="agri-action-btn" onClick={() => setModal({ type: 'none' })} style={{ width: 28, height: 28 }}>
                    <X size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Entrez votre adresse actuelle pour générer un itinéraire optimisé.
                </p>
                <input
                  ref={inputRef}
                  className="search-input"
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
                    padding: '10px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%',
                  }}
                  placeholder="Ex: 1234 Rue Sainte-Catherine, Montréal, QC"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmAddress()}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="agri-btn-outline" onClick={() => setModal({ type: 'none' })}>Annuler</button>
                  <button
                    className="btn-add-agri"
                    onClick={handleConfirmAddress}
                    disabled={!inputValue.trim()}
                    style={{ opacity: inputValue.trim() ? 1 : 0.4 }}
                  >
                    Ouvrir l'itinéraire
                  </button>
                </div>
              </>
            )}

            {/* WARNING MODAL */}
            {modal.type === 'warning' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#fbbf24" />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Adresses imprécises</span>
                  </div>
                  <button className="agri-action-btn" onClick={() => setModal({ type: 'none' })} style={{ width: 28, height: 28 }}>
                    <X size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Les adresses des commandes sont trop imprécises pour optimiser l'itinéraire.
                  <br /><br />
                  <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    Exemple valide : "1234 Rue Sainte-Catherine, Montréal, QC"
                  </span>
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="agri-btn-outline" onClick={() => setModal({ type: 'none' })}>Annuler</button>
                  <button
                    className="btn-add-agri"
                    onClick={() => { openGoogleMaps(modal.allAddresses); setModal({ type: 'none' }) }}
                  >
                    Ouvrir sans optimisation
                  </button>
                </div>
              </>
            )}

            {/* NO COMMANDES MODAL */}
            {modal.type === 'noCommandes' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#f87171" />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Aucune commande</span>
                  </div>
                  <button className="agri-action-btn" onClick={() => setModal({ type: 'none' })} style={{ width: 28, height: 28 }}>
                    <X size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Aucune commande n'est associée à cette route. Impossible de générer un itinéraire.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-add-agri" onClick={() => setModal({ type: 'none' })}>Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
          {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="agri-toolbar-updated">{filtered.length} ROUTE{filtered.length !== 1 ? 'S' : ''}</span>
      </div>

      <div className="agri-table-wrap">
        {loading ? (
          <div className="panel-empty"><Loader size={28} color="var(--text-dim)" /><span>Chargement...</span></div>
        ) : filtered.length === 0 ? (
          <div className="panel-empty"><Map size={28} color="var(--text-dim)" /><span>Aucune route pour le moment</span></div>
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
                        <span className="tr-avatar" style={{ background: '#14281e', color: '#4ade80' }}>{initials}</span>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#2a1010', color: '#f87171', border: '1px solid #f8717144', borderRadius: 4, fontSize: 11, padding: '3px 8px', fontFamily: 'var(--font-mono)' }}>
                          ⚠ Aucune commande
                        </span>
                      ) : (
                        <span style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-mid)', borderRadius: 4, fontSize: 11, padding: '3px 8px', fontFamily: 'var(--font-mono)' }}>
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
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '0 12px', fontSize: 12, color: isLoadingThis ? 'var(--text-dim)' : 'var(--green)', borderColor: isLoadingThis ? 'var(--border)' : 'var(--green-mid)' }}
                        onClick={() => handleOpenMaps(r.id)}
                        disabled={isLoadingThis}
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