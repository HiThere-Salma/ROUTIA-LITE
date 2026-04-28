import { useState, useEffect, useRef } from 'react'
import { Search, Truck, X, ChevronDown, ChevronLeft, ChevronRight, Check, Navigation, AlertTriangle, Loader, MapPin, Calendar, Clock, Route, Pencil, Trash2, Mail, Phone } from 'lucide-react'
import { getSupabaseClient } from '../lib/supabase/supabase.client'

const MAPQUEST_KEY = import.meta.env.VITE_MAPQUEST_KEY

type RouteData = {
  id: number
  transporteur: string
  transporteur_id: string
  date: string
  heureDebut: string
  heureFin: string
  commandes: number
  commandeIds: string[]
  distance: number | null
  statut: 'en_cours' | 'terminee' | 'planifiee' | 'annulee'
}

type TransporteurOption = { id: string; nom: string; prenom: string; email: string; telephone: string | null }
type CommandeOption = {
  id: string
  produit: string
  adresse_collecte: string
  adresse_livraison: string
  distance_estimee: number | null
  agriculteur: string
}

type NavModal =
  | { type: 'none' }
  | { type: 'input'; routeId: number }
  | { type: 'warning'; allAddresses: string[] }
  | { type: 'noCommandes' }

const STATUT_MAP: Record<RouteData['statut'], { label: string; className: string }> = {
  en_cours: { label: 'En cours', className: 'rt-status--encours' },
  terminee: { label: 'Terminée', className: 'rt-status--terminee' },
  planifiee: { label: 'Planifiée', className: 'rt-status--planifiee' },
  annulee: { label: 'Annulée', className: 'rt-status--annulee' },
}

const ROUTE_TO_CMD_STATUT: Record<RouteData['statut'], string> = {
  planifiee: 'en_attente',
  en_cours: 'en_transport',
  terminee: 'livree',
  annulee: 'annulee',
}

export default function RoutePage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [showModal, setShowModal] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formHeureDepart, setFormHeureDepart] = useState('')
  const [formHeureFin, setFormHeureFin] = useState('')
  const [formTransporteurId, setFormTransporteurId] = useState('')
  const [formCommandeIds, setFormCommandeIds] = useState<string[]>([])
  const [formStatut, setFormStatut] = useState<RouteData['statut']>('planifiee')
  const [transporteurs, setTransporteurs] = useState<TransporteurOption[]>([])
  const [commandesOptions, setCommandesOptions] = useState<CommandeOption[]>([])

  const [showCalendar, setShowCalendar] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [showTimeStart, setShowTimeStart] = useState(false)
  const [showTimeEnd, setShowTimeEnd] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)
  const timeStartRef = useRef<HTMLDivElement>(null)
  const timeEndRef = useRef<HTMLDivElement>(null)

  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [sendingEmail, setSendingEmail] = useState<number | null>(null)
  const [sendingSms, setSendingSms] = useState<number | null>(null)

  const [navModal, setNavModal] = useState<NavModal>({ type: 'none' })
  const [navInput, setNavInput] = useState('')
  const [loadingRoute, setLoadingRoute] = useState<number | null>(null)
  const navInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setFormDate('')
    setFormHeureDepart('')
    setFormHeureFin('')
    setFormTransporteurId('')
    setFormCommandeIds([])
    setFormStatut('planifiee')
    setEditingRouteId(null)
  }

  useEffect(() => {
    if (!showModal) return
    const supabase = getSupabaseClient()

    supabase
      .from('utilisateurs')
      .select('id, nom, prenom, email, telephone')
      .eq('role', 'transporteur')
      .order('nom')
      .then(({ data }) => setTransporteurs((data as TransporteurOption[]) ?? []))

    const fetchCommandes = async () => {
      const { data: unassigned } = await supabase
        .from('commandes')
        .select('id, produit, adresse_collecte, adresse_livraison, distance_estimee, utilisateurs!agriculteur_id(nom, prenom)')
        .is('route_id', null)
        .order('id')

      let assigned: typeof unassigned = []
      if (editingRouteId) {
        const { data: a } = await supabase
          .from('commandes')
          .select('id, produit, adresse_collecte, adresse_livraison, distance_estimee, utilisateurs!agriculteur_id(nom, prenom)')
          .eq('route_id', editingRouteId)
          .order('id')
        assigned = a ?? []
      }

      const data = [...(unassigned ?? []), ...(assigned ?? [])]
      const mapCmd = (c: Record<string, unknown>) => {
        const agri = c.utilisateurs as { nom: string; prenom: string } | null
        return {
          id: c.id as string,
          produit: c.produit as string,
          adresse_collecte: c.adresse_collecte as string,
          adresse_livraison: c.adresse_livraison as string,
          distance_estimee: c.distance_estimee as number | null,
          agriculteur: agri ? `${agri.prenom} ${agri.nom}` : '—',
        }
      }
      setCommandesOptions(data.map(mapCmd))
    }
    fetchCommandes()
  }, [showModal, editingRouteId])

  async function buildMapsLink(commandeIds: string[]): Promise<string> {
    const supabase = getSupabaseClient()
    const { data: cmds } = await supabase
      .from('commandes')
      .select('adresse_collecte, adresse_livraison')
      .in('id', commandeIds)

    const commandes = cmds ?? []
    if (commandes.length === 0) return ''

    const allAddresses = [
      ...commandes.map((c: Record<string, string>) => c.adresse_collecte),
      ...commandes.map((c: Record<string, string>) => c.adresse_livraison),
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
      if (data.info?.statuscode === 0) {
        const orderedIndexes: number[] = data.route?.locationSequence ?? []
        const ordered = orderedIndexes.map((i: number) => allAddresses[i])
        return `https://www.google.com/maps/dir/${ordered.map(a => encodeURIComponent(a)).join('/')}`
      }
    } catch {
      // fallback
    }

    return `https://www.google.com/maps/dir/${allAddresses.map(a => encodeURIComponent(a)).join('/')}`
  }

  // Used when modal is open (transporteurs already loaded in state)
  async function sendRouteEmail(transporteurId: string, routeDate: string, commandeIds: string[]) {
    const transporteur = transporteurs.find(t => t.id === transporteurId)
    if (!transporteur) return
    const mapsLink = await buildMapsLink(commandeIds)
    if (!mapsLink) return
    try {
      const supabase = getSupabaseClient()
      await supabase.functions.invoke('send-route-email', {
        body: {
          to: transporteur.email,
          phone: transporteur.telephone ?? null,
          transporteurName: `${transporteur.prenom} ${transporteur.nom}`,
          routeDate,
          mapsLink,
        },
      })
    } catch (err) {
      console.error('Erreur envoi notification:', err)
    }
  }

  // Used from table buttons — fetches transporteur fresh from DB
  async function handleSendEmail(routeId: number, transporteurId: string, routeDate: string, commandeIds: string[]) {
    setSendingEmail(routeId)
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, email, telephone')
        .eq('id', transporteurId)
        .single()
      if (!data) return
      const mapsLink = await buildMapsLink(commandeIds)
      if (!mapsLink) return
      await supabase.functions.invoke('send-route-email', {
        body: {
          to: data.email,
          phone: null,
          transporteurName: `${data.prenom} ${data.nom}`,
          routeDate,
          mapsLink,
        },
      })
    } catch (err) {
      console.error('Erreur envoi email:', err)
    } finally {
      setSendingEmail(null)
    }
  }

  async function handleSendSms(routeId: number, transporteurId: string, routeDate: string, commandeIds: string[]) {
    setSendingSms(routeId)
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, email, telephone')
        .eq('id', transporteurId)
        .single()
      if (!data) return
      const mapsLink = await buildMapsLink(commandeIds)
      if (!mapsLink) return
      await supabase.functions.invoke('send-route-email', {
        body: {
          to: null,
          phone: (data as TransporteurOption).telephone ?? null,
          transporteurName: `${data.prenom} ${data.nom}`,
          routeDate,
          mapsLink,
        },
      })
    } catch (err) {
      console.error('Erreur envoi SMS:', err)
    } finally {
      setSendingSms(null)
    }
  }

  async function fetchRoutes() {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('routes')
        .select('id, transporteur_id, date, heure_depart, heure_fin, distance_totale, utilisateurs!transporteur_id(nom, prenom), commandes!route_id(id, statut, distance_estimee)')
        .order('date', { ascending: false })

      if (error) {
        console.error('Supabase error details:', JSON.stringify(error))
        throw error
      }

      const mapped: RouteData[] = (data ?? []).map((r: Record<string, unknown>) => {
        const utilisateur = r.utilisateurs as { nom: string; prenom: string } | null
        const cmds = (r.commandes ?? []) as { id: number; statut: string; distance_estimee: number | null }[]

        let statut: RouteData['statut'] = 'planifiee'
        if (cmds.length > 0) {
          const allDone = cmds.every((c) => c.statut === 'livree' || c.statut === 'terminee')
          const allCancelled = cmds.every((c) => c.statut === 'annulee')
          if (allDone) statut = 'terminee'
          else if (allCancelled) statut = 'annulee'
          else statut = 'en_cours'
        }

        let distance: number | null = (r.distance_totale as number) ?? null
        if (distance == null && cmds.length > 0) {
          const sum = cmds.reduce((acc, c) => acc + (c.distance_estimee ?? 0), 0)
          if (sum > 0) distance = Math.round(sum * 10) / 10
        }

        return {
          id: r.id as number,
          transporteur: utilisateur ? `${utilisateur.nom} ${utilisateur.prenom}` : '—',
          transporteur_id: (r.transporteur_id as string) ?? '',
          date: r.date as string,
          heureDebut: (r.heure_depart as string) ?? '',
          heureFin: (r.heure_fin as string) ?? '',
          commandes: cmds.length,
          commandeIds: cmds.map((c) => String(c.id)),
          distance,
          statut,
        }
      })

      setRoutes(mapped)
    } catch (err) {
      console.error('Erreur chargement routes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTransporteurId || !formDate) return
    setSubmitting(true)

    try {
      const supabase = getSupabaseClient()

      if (editingRouteId) {
        const { error: routeError } = await supabase
          .from('routes')
          .update({
            transporteur_id: formTransporteurId,
            date: formDate,
            heure_depart: formHeureDepart || null,
            heure_fin: formHeureFin || null,
          })
          .eq('id', editingRouteId)

        if (routeError) throw routeError

        const { error: unassignErr } = await supabase
          .from('commandes')
          .update({ route_id: null })
          .eq('route_id', editingRouteId)

        if (unassignErr) throw unassignErr

        if (formCommandeIds.length > 0) {
          const { error: cmdError } = await supabase
            .from('commandes')
            .update({ route_id: editingRouteId })
            .in('id', formCommandeIds)

          if (cmdError) throw cmdError

          const cmdStatut = ROUTE_TO_CMD_STATUT[formStatut]
          const { error: statutErr } = await supabase
            .from('commandes')
            .update({ statut: cmdStatut })
            .in('id', formCommandeIds)

          if (statutErr) throw statutErr
        }

        await sendRouteEmail(formTransporteurId, formDate, formCommandeIds)

      } else {
        const { data: newRoute, error: routeError } = await supabase
          .from('routes')
          .insert({
            transporteur_id: formTransporteurId,
            date: formDate,
            heure_depart: formHeureDepart || null,
            heure_fin: formHeureFin || null,
          })
          .select('id')
          .single()

        if (routeError) throw routeError

        if (formCommandeIds.length > 0) {
          const { error: cmdError } = await supabase
            .from('commandes')
            .update({ route_id: newRoute.id })
            .in('id', formCommandeIds)

          if (cmdError) throw cmdError
        }

        await sendRouteEmail(formTransporteurId, formDate, formCommandeIds)
      }

      setShowModal(false)
      resetForm()
      setLoading(true)
      fetchRoutes()
    } catch (err) {
      console.error(editingRouteId ? 'Erreur modification route:' : 'Erreur création route:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (deleteRouteId == null) return
    setDeleting(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.from('commandes').update({ route_id: null }).eq('route_id', deleteRouteId)
      const { error } = await supabase.from('routes').delete().eq('id', deleteRouteId)
      if (error) throw error
      setDeleteRouteId(null)
      setLoading(true)
      fetchRoutes()
    } catch (err) {
      console.error('Erreur suppression route:', err)
    } finally {
      setDeleting(false)
    }
  }

  function handleEdit(route: RouteData) {
    setEditingRouteId(route.id)
    setFormDate(route.date)
    setFormHeureDepart(route.heureDebut)
    setFormHeureFin(route.heureFin)
    setFormTransporteurId(route.transporteur_id)
    setFormCommandeIds(route.commandeIds)
    setFormStatut(route.statut)
    setShowModal(true)
  }

  function toggleCommande(id: string) {
    setFormCommandeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false)
      if (timeStartRef.current && !timeStartRef.current.contains(e.target as Node)) setShowTimeStart(false)
      if (timeEndRef.current && !timeEndRef.current.contains(e.target as Node)) setShowTimeEnd(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }

  function selectDate(day: number) {
    const m = String(calMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    setFormDate(`${calYear}-${m}-${d}`)
    setShowCalendar(false)
  }

  function formatDisplayDate(dateStr: string) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  function selectTime(setter: (v: string) => void, closeFn: (v: boolean) => void, h: number, m: number) {
    setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    closeFn(false)
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => i)
  const MINUTES = [0, 15, 30, 45]

  useEffect(() => {
    if (navModal.type === 'input') setTimeout(() => navInputRef.current?.focus(), 50)
  }, [navModal])

  function openGoogleMaps(addresses: string[]) {
    const waypoints = addresses.map(a => encodeURIComponent(a)).join('/')
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank')
  }

  async function handleOpenMaps(routeId: number) {
    setNavInput('')
    setNavModal({ type: 'input', routeId })
  }

  async function handleConfirmAddress() {
    if (navModal.type !== 'input') return
    const { routeId } = navModal
    const startLocation = navInput.trim()
    if (!startLocation) return

    setNavModal({ type: 'none' })
    setLoadingRoute(routeId)

    try {
      const supabase = getSupabaseClient()
      const { data: cmds } = await supabase
        .from('commandes')
        .select('adresse_collecte, adresse_livraison')
        .eq('route_id', routeId)

      setLoadingRoute(null)
      const commandes = cmds ?? []

      if (commandes.length === 0) {
        setNavModal({ type: 'noCommandes' })
        return
      }

      const allAddresses = [
        startLocation,
        ...commandes.map((c: Record<string, string>) => c.adresse_collecte),
        ...commandes.map((c: Record<string, string>) => c.adresse_livraison),
      ]

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
          setNavModal({ type: 'warning', allAddresses })
          return
        }
        openGoogleMaps(allAddresses)
        return
      }

      const orderedIndexes: number[] = data.route?.locationSequence ?? []
      const orderedAddresses = orderedIndexes.map((i: number) => allAddresses[i])
      openGoogleMaps(orderedAddresses)
    } catch {
      setLoadingRoute(null)
    }
  }

  useEffect(() => {
    async function load() {
      await fetchRoutes()
    }
    void load()
  }, [])

  const filtered = routes.filter(
    (r) =>
      String(r.id).toLowerCase().includes(search.toLowerCase()) ||
      r.transporteur.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="rt-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des Routes</h1>
        <p className="dashboard-sub">
          Planifiez, suivez et optimisez l'ensemble des itinéraires de collecte et de livraison.
        </p>
      </div>

      <div className="rt-toolbar">
        <div className="rt-search">
          <Search size={15} color="var(--text-muted)" />
          <input
            className="rt-search-input"
            type="text"
            placeholder="Rechercher une route, un transporteur…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <button className="btn-add-agri" onClick={() => setShowModal(true)}>＋ Ajouter une route</button>
      </div>

      <div className="rt-table-wrap">
        <table className="rt-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Transporteur</th>
              <th>Date</th>
              <th>Horaires</th>
              <th>Distance</th>
              <th>Commandes</th>
              <th>Envoyer</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="rt-empty">
                  <Loader size={18} className="nv-spin" style={{ marginBottom: 8 }} />
                  <span>Chargement des routes…</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="rt-empty">
                  <Route size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                  <span>Aucune route trouvée</span>
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const st = STATUT_MAP[r.statut]
                return (
                  <tr key={r.id} className="rt-row">
                    <td>
                      <span className="rt-id">#{String(r.id).slice(0, 8)}</span>
                    </td>
                    <td>
                      <div className="rt-transporteur-cell">
                        <span className="rt-avatar"><Truck size={14} /></span>
                        <span>{r.transporteur}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rt-date">{r.date ? (() => { const [y, m, d] = r.date.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) })() : '—'}</span>
                    </td>
                    <td>
                      <div className="rt-horaires">
                        <Clock size={12} className="rt-horaires-icon" />
                        <span>{r.heureDebut || '—'}</span>
                        <span className="rt-horaires-sep">→</span>
                        <span>{r.heureFin || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rt-distance">
                        {r.distance != null ? `${r.distance} km` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="rt-commandes-badge">{r.commandes}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="rt-send-btn"
                          title="Envoyer email"
                          disabled={sendingEmail === r.id}
                          onClick={() => handleSendEmail(r.id, r.transporteur_id, r.date, r.commandeIds)}
                        >
                          {sendingEmail === r.id ? <Loader size={13} className="nv-spin" /> : <Mail size={13} />}
                        </button>
                        <button
                          className="rt-send-btn"
                          title="Envoyer SMS"
                          disabled={sendingSms === r.id}
                          onClick={() => handleSendSms(r.id, r.transporteur_id, r.date, r.commandeIds)}
                        >
                          {sendingSms === r.id ? <Loader size={13} className="nv-spin" /> : <Phone size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`rt-status-pill ${st.className}`}>
                        <span className="rt-status-dot" />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="rt-nav-btn" title="Modifier" onClick={() => handleEdit(r)}>
                          <Pencil size={14} />
                        </button>
                        <button
                          className="rt-nav-btn"
                          title="Itinéraire"
                          onClick={() => handleOpenMaps(r.id)}
                          disabled={loadingRoute === r.id}
                        >
                          {loadingRoute === r.id ? <Loader size={14} className="nv-spin" /> : <Navigation size={14} />}
                        </button>
                        <button
                          className="rt-nav-btn rt-nav-btn--danger"
                          title="Supprimer"
                          onClick={() => setDeleteRouteId(r.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div className="rt-pagination">
          <span className="rt-pag-info">
            {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} sur {filtered.length} routes
          </span>
          <div className="rt-pag-pages">
            <button className="rt-pag-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`rt-pag-btn${currentPage === p ? ' rt-pag-btn--active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="rt-pag-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="rt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nv-modal-header">
              <h2 className="nv-modal-title">{editingRouteId ? 'Modifier la route' : 'Nouvelle route'}</h2>
              <button className="nv-close" onClick={() => { setShowModal(false); resetForm() }}><X size={18} /></button>
            </div>

            <form className="nv-modal-body" onSubmit={handleSubmit}>
              <div className="nv-field">
                <span className="nv-label">Transporteur (valide uniquement)</span>
                <div className="nv-select-wrap">
                  <select className="nv-select" value={formTransporteurId} onChange={(e) => setFormTransporteurId(e.target.value)} required>
                    <option value="">Sélectionner un transporteur</option>
                    {transporteurs.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="nv-select-chevron" />
                </div>
              </div>

              {editingRouteId && (
                <div className="nv-field">
                  <span className="nv-label">Statut</span>
                  <div className="nv-select-wrap">
                    <select className="nv-select" value={formStatut} onChange={(e) => setFormStatut(e.target.value as RouteData['statut'])}>
                      {Object.entries(STATUT_MAP).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="nv-select-chevron" />
                  </div>
                </div>
              )}

              <div className="nv-row-3">
                <div className="nv-field" ref={calRef}>
                  <span className="nv-label">Date</span>
                  <button type="button" className="nv-picker-btn" onClick={() => { setShowCalendar((o) => !o); setShowTimeStart(false); setShowTimeEnd(false) }}>
                    <span className={formDate ? 'nv-picker-value' : 'nv-picker-placeholder'}>{formDate ? formatDisplayDate(formDate) : 'jj/mm/aaaa'}</span>
                    <Calendar size={14} className="nv-picker-icon" />
                  </button>
                  {showCalendar && (
                    <div className="nv-calendar">
                      <div className="nv-cal-nav">
                        <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }} disabled={calYear === new Date().getFullYear() && calMonth === new Date().getMonth()}><ChevronLeft size={14} /></button>
                        <span className="nv-cal-title">{MONTHS[calMonth]} {calYear}</span>
                        <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}><ChevronRight size={14} /></button>
                      </div>
                      <div className="nv-cal-grid">
                        {DAYS.map((d) => <span key={d} className="nv-cal-dayname">{d}</span>)}
                        {getCalendarDays(calYear, calMonth).map((day, i) => {
                          if (day === null) return <span key={`e${i}`} />
                          const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                          const isSelected = iso === formDate
                          const isToday = iso === new Date().toISOString().slice(0, 10)
                          const todayIso = new Date().toISOString().slice(0, 10)
                          const isPast = !editingRouteId && iso < todayIso
                          return (
                            <button key={i} type="button" className={`nv-cal-day${isSelected ? ' nv-cal-day--sel' : ''}${isToday ? ' nv-cal-day--today' : ''}${isPast ? ' nv-cal-day--past' : ''}`} onClick={() => !isPast && selectDate(day)} disabled={isPast}>
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="nv-field" ref={timeStartRef}>
                  <span className="nv-label">Heure début</span>
                  <button type="button" className="nv-picker-btn" onClick={() => { setShowTimeStart((o) => !o); setShowTimeEnd(false); setShowCalendar(false) }}>
                    <span className={formHeureDepart ? 'nv-picker-value' : 'nv-picker-placeholder'}>{formHeureDepart || '--:--'}</span>
                    <Clock size={14} className="nv-picker-icon" />
                  </button>
                  {showTimeStart && (
                    <div className="nv-timepicker">
                      <div className="nv-time-cols">
                        <div className="nv-time-col">
                          <span className="nv-time-col-title">H</span>
                          <div className="nv-time-list">
                            {HOURS.map((h) => (
                              <button key={h} type="button" className={`nv-time-item${formHeureDepart.startsWith(String(h).padStart(2, '0') + ':') ? ' nv-time-item--sel' : ''}`}
                                onClick={() => { const curMin = formHeureDepart ? parseInt(formHeureDepart.split(':')[1]) || 0 : 0; selectTime(setFormHeureDepart, setShowTimeStart, h, curMin); setShowTimeStart(true) }}>
                                {String(h).padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="nv-time-col">
                          <span className="nv-time-col-title">Min</span>
                          <div className="nv-time-list">
                            {MINUTES.map((m) => (
                              <button key={m} type="button" className={`nv-time-item${formHeureDepart.endsWith(':' + String(m).padStart(2, '0')) ? ' nv-time-item--sel' : ''}`}
                                onClick={() => { const curH = formHeureDepart ? parseInt(formHeureDepart.split(':')[0]) || 0 : 0; selectTime(setFormHeureDepart, setShowTimeStart, curH, m) }}>
                                {String(m).padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="nv-field" ref={timeEndRef}>
                  <span className="nv-label">Heure fin</span>
                  <button type="button" className="nv-picker-btn" onClick={() => { setShowTimeEnd((o) => !o); setShowTimeStart(false); setShowCalendar(false) }}>
                    <span className={formHeureFin ? 'nv-picker-value' : 'nv-picker-placeholder'}>{formHeureFin || '--:--'}</span>
                    <Clock size={14} className="nv-picker-icon" />
                  </button>
                  {showTimeEnd && (
                    <div className="nv-timepicker">
                      <div className="nv-time-cols">
                        <div className="nv-time-col">
                          <span className="nv-time-col-title">H</span>
                          <div className="nv-time-list">
                            {HOURS.map((h) => (
                              <button key={h} type="button" className={`nv-time-item${formHeureFin.startsWith(String(h).padStart(2, '0') + ':') ? ' nv-time-item--sel' : ''}`}
                                onClick={() => { const curMin = formHeureFin ? parseInt(formHeureFin.split(':')[1]) || 0 : 0; selectTime(setFormHeureFin, setShowTimeEnd, h, curMin); setShowTimeEnd(true) }}>
                                {String(h).padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="nv-time-col">
                          <span className="nv-time-col-title">Min</span>
                          <div className="nv-time-list">
                            {MINUTES.map((m) => (
                              <button key={m} type="button" className={`nv-time-item${formHeureFin.endsWith(':' + String(m).padStart(2, '0')) ? ' nv-time-item--sel' : ''}`}
                                onClick={() => { const curH = formHeureFin ? parseInt(formHeureFin.split(':')[0]) || 0 : 0; selectTime(setFormHeureFin, setShowTimeEnd, curH, m) }}>
                                {String(m).padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="nv-field">
                <span className="nv-label">Commandes disponibles</span>
                <div className="nv-cmd-list">
                  {commandesOptions.length === 0 ? (
                    <div className="nv-cmd-empty">Aucune commande disponible</div>
                  ) : (
                    commandesOptions.map((c) => {
                      const selected = formCommandeIds.includes(c.id)
                      return (
                        <button key={c.id} type="button" className={`nv-cmd-card${selected ? ' nv-cmd-card--sel' : ''}`} onClick={() => toggleCommande(c.id)}>
                          <span className={`nv-cmd-check${selected ? ' nv-cmd-check--on' : ''}`}>{selected && <Check size={12} />}</span>
                          <div className="nv-cmd-body">
                            <div className="nv-cmd-top">
                              <span className="nv-cmd-code">CMD{c.id.slice(0, 4).toUpperCase()}</span>
                              <span className="nv-cmd-sep">—</span>
                              <span className="nv-cmd-produit">{c.produit}</span>
                            </div>
                            <div className="nv-cmd-route">
                              <MapPin size={11} />
                              <span>{c.adresse_collecte} → {c.adresse_livraison}</span>
                            </div>
                            <div className="nv-cmd-agri">{c.agriculteur}</div>
                          </div>
                          <span className="nv-cmd-dist">{c.distance_estimee != null ? `${c.distance_estimee} km` : '— km'}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <button type="submit" className="nv-submit" disabled={submitting || !formTransporteurId || formCommandeIds.length === 0}>
                {submitting ? <Loader size={16} className="nv-spin" /> : <Navigation size={16} />}
                <span>{submitting ? 'Enregistrement…' : editingRouteId ? 'Enregistrer les modifications' : 'Générer & Optimiser'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteRouteId != null && (
        <div className="rt-modal-overlay" onClick={() => !deleting && setDeleteRouteId(null)}>
          <div className="rt-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="rt-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="#f87171" />
                <h2 className="rt-modal-title">Supprimer la route</h2>
              </div>
              <button className="rt-modal-close" onClick={() => setDeleteRouteId(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="rt-modal-form">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Êtes-vous sûr de vouloir supprimer la route <strong>#{String(deleteRouteId).slice(0, 8)}</strong> ? Les commandes associées seront désassignées.
              </p>
              <div className="rt-modal-actions">
                <button type="button" className="rt-btn-cancel" onClick={() => setDeleteRouteId(null)} disabled={deleting}>Annuler</button>
                <button type="button" className="rt-btn-submit" style={{ background: '#ef4444' }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader size={14} className="nv-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {navModal.type !== 'none' && (
        <div className="rt-modal-overlay" onClick={() => setNavModal({ type: 'none' })}>
          <div className="rt-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            {navModal.type === 'input' && (
              <>
                <div className="rt-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Navigation size={18} color="var(--green)" />
                    <h2 className="rt-modal-title">Adresse de départ</h2>
                  </div>
                  <button className="rt-modal-close" onClick={() => setNavModal({ type: 'none' })}><X size={18} /></button>
                </div>
                <div className="rt-modal-form">
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Entrez votre adresse actuelle pour générer un itinéraire optimisé.
                  </p>
                  <input ref={navInputRef} className="rt-form-input" placeholder="Ex: 1234 Rue Sainte-Catherine, Montréal, QC"
                    value={navInput} onChange={(e) => setNavInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddress()} />
                  <div className="rt-modal-actions">
                    <button type="button" className="rt-btn-cancel" onClick={() => setNavModal({ type: 'none' })}>Annuler</button>
                    <button type="button" className="rt-btn-submit" onClick={handleConfirmAddress} disabled={!navInput.trim()}>Ouvrir l'itinéraire</button>
                  </div>
                </div>
              </>
            )}
            {navModal.type === 'warning' && (
              <>
                <div className="rt-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#fbbf24" />
                    <h2 className="rt-modal-title">Adresses imprécises</h2>
                  </div>
                  <button className="rt-modal-close" onClick={() => setNavModal({ type: 'none' })}><X size={18} /></button>
                </div>
                <div className="rt-modal-form">
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Les adresses des commandes sont trop imprécises pour optimiser l'itinéraire.<br /><br />
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Exemple valide : "1234 Rue Sainte-Catherine, Montréal, QC"</span>
                  </p>
                  <div className="rt-modal-actions">
                    <button type="button" className="rt-btn-cancel" onClick={() => setNavModal({ type: 'none' })}>Annuler</button>
                    <button type="button" className="rt-btn-submit" onClick={() => { openGoogleMaps(navModal.allAddresses); setNavModal({ type: 'none' }) }}>Ouvrir sans optimisation</button>
                  </div>
                </div>
              </>
            )}
            {navModal.type === 'noCommandes' && (
              <>
                <div className="rt-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#f87171" />
                    <h2 className="rt-modal-title">Aucune commande</h2>
                  </div>
                  <button className="rt-modal-close" onClick={() => setNavModal({ type: 'none' })}><X size={18} /></button>
                </div>
                <div className="rt-modal-form">
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Aucune commande n'est associée à cette route. Impossible de générer un itinéraire.
                  </p>
                  <div className="rt-modal-actions" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="rt-btn-submit" onClick={() => setNavModal({ type: 'none' })}>Fermer</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}