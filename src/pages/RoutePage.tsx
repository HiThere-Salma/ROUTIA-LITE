import { useState, useEffect } from 'react'
import { Search, Eye, Pencil, Trash2, Truck, X, ChevronDown, Check } from 'lucide-react'
import { getSupabaseClient } from '../lib/supabase/supabase.client'

type RouteData = {
  id: number
  transporteur: string
  date: string
  heureDebut: string
  heureFin: string
  commandes: number
  statut: 'en_cours' | 'terminee' | 'planifiee' | 'annulee'
}

type TransporteurOption = { id: string; nom: string; prenom: string }
type CommandeOption = { id: string; produit: string; adresse_collecte: string; adresse_livraison: string }

const STATUT_MAP: Record<RouteData['statut'], { label: string; className: string }> = {
  en_cours: { label: 'En cours', className: 'rt-status--encours' },
  terminee: { label: 'Terminée', className: 'rt-status--terminee' },
  planifiee: { label: 'Planifiée', className: 'rt-status--planifiee' },
  annulee: { label: 'Annulée', className: 'rt-status--annulee' },
}

export default function RoutePage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formHeureDepart, setFormHeureDepart] = useState('')
  const [formHeureFin, setFormHeureFin] = useState('')
  const [formTransporteurId, setFormTransporteurId] = useState('')
  const [formCommandeIds, setFormCommandeIds] = useState<string[]>([])
  const [transporteurs, setTransporteurs] = useState<TransporteurOption[]>([])
  const [commandesOptions, setCommandesOptions] = useState<CommandeOption[]>([])
  const [cmdDropdownOpen, setCmdDropdownOpen] = useState(false)

  function resetForm() {
    setFormDate('')
    setFormHeureDepart('')
    setFormHeureFin('')
    setFormTransporteurId('')
    setFormCommandeIds([])
  }

  // Fetch transporteurs & commandes when modal opens
  useEffect(() => {
    if (!showModal) return
    const supabase = getSupabaseClient()

    supabase
      .from('utilisateurs')
      .select('id, nom, prenom')
      .eq('role', 'transporteur')
      .order('nom')
      .then(({ data }) => setTransporteurs((data as TransporteurOption[]) ?? []))

    supabase
      .from('commandes')
      .select('id, produit, adresse_collecte, adresse_livraison')
      .is('route_id', null)
      .order('id')
      .then(({ data }) => setCommandesOptions((data as CommandeOption[]) ?? []))
  }, [showModal])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTransporteurId || !formDate) return
    setSubmitting(true)

    try {
      const supabase = getSupabaseClient()

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

      // Refresh table
      setShowModal(false)
      resetForm()
      setLoading(true)
      fetchRoutes()
    } catch (err) {
      console.error('Erreur création route:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function toggleCommande(id: string) {
    setFormCommandeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  async function fetchRoutes() {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('routes')
          .select('id, date, heure_depart, heure_fin, utilisateurs!transporteur_id(nom, prenom), commandes!route_id(id, statut)')
          .order('date', { ascending: false })

        if (error) {
          console.error('Supabase error details:', JSON.stringify(error))
          throw error
        }

        const mapped: RouteData[] = (data ?? []).map((r: Record<string, unknown>) => {
          const utilisateur = r.utilisateurs as { nom: string; prenom: string } | null
          const cmds = (r.commandes ?? []) as { id: number; statut: string }[]

          let statut: RouteData['statut'] = 'planifiee'
          if (cmds.length > 0) {
            const allDone = cmds.every((c) => c.statut === 'livree' || c.statut === 'terminee')
            const allCancelled = cmds.every((c) => c.statut === 'annulee')
            if (allDone) statut = 'terminee'
            else if (allCancelled) statut = 'annulee'
            else statut = 'en_cours'
          }

          return {
            id: r.id as number,
            transporteur: utilisateur
              ? `${utilisateur.nom} ${utilisateur.prenom}`
              : '—',
            date: r.date as string,
            heureDebut: (r.heure_depart as string) ?? '',
            heureFin: (r.heure_fin as string) ?? '',
            commandes: cmds.length,
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

  const filtered = routes.filter(
    (r) =>
      String(r.id).toLowerCase().includes(search.toLowerCase()) ||
      r.transporteur.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="rt-page">
      {/* En-tête */}
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des Routes</h1>
        <p className="dashboard-sub">
          Planifiez, suivez et optimisez l'ensemble des itinéraires de collecte et de livraison.
        </p>
      </div>

      {/* Barre recherche + bouton ajouter */}
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

      {/* Tableau */}
      <div className="rt-table-wrap">
        <table className="rt-table">
          <thead>
            <tr>
              <th>ID Route</th>
              <th>Transporteur</th>
              <th>Date</th>
              <th>Début / Fin</th>
              <th>Commandes</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="rt-empty">Chargement…</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="rt-empty">Aucune route trouvée</td>
              </tr>
            ) : (
              paginated.map((r) => {
                const st = STATUT_MAP[r.statut]
                return (
                  <tr key={r.id}>
                    <td className="rt-mono">#{r.id}</td>
                    <td>
                      <div className="rt-transporteur-cell">
                        <Truck size={15} color="var(--green)" />
                        <span>{r.transporteur}</span>
                      </div>
                    </td>
                    <td className="muted">{r.date}</td>
                    <td className="rt-mono">{r.heureDebut} → {r.heureFin}</td>
                    <td className="rt-commandes">{r.commandes}</td>
                    <td>
                      <span className={`status-badge ${st.className}`}>{st.label}</span>
                    </td>
                    <td>
                      <div className="agri-actions">
                        <button className="agri-action-btn" title="Visualiser"><Eye size={14} /></button>
                        <button className="agri-action-btn" title="Modifier"><Pencil size={14} /></button>
                        <button className="agri-action-btn agri-action-btn--del" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="agri-pagination">
          <span className="agri-pag-info">
            Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-{Math.min(currentPage * itemsPerPage, filtered.length)} sur {filtered.length}
          </span>
          <div className="agri-pag-pages">
            <button className="page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn${currentPage === p ? ' page-btn--active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* Modal ajout route */}
      {showModal && (
        <div className="rt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rt-modal-header">
              <h2 className="rt-modal-title">Nouvelle route</h2>
              <button className="rt-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form className="rt-modal-form" onSubmit={handleSubmit}>
              {/* Transporteur */}
              <label className="rt-form-label">
                Transporteur
                <div className="rt-select-wrap">
                  <select
                    className="rt-form-select"
                    value={formTransporteurId}
                    onChange={(e) => setFormTransporteurId(e.target.value)}
                    required
                  >
                    <option value="">— Choisir un transporteur —</option>
                    {transporteurs.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="rt-select-icon" />
                </div>
              </label>

              {/* Date */}
              <label className="rt-form-label">
                Date
                <input
                  className="rt-form-input"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </label>

              {/* Horaires */}
              <div className="rt-form-row">
                <label className="rt-form-label">
                  Heure de départ
                  <input
                    className="rt-form-input"
                    type="time"
                    value={formHeureDepart}
                    onChange={(e) => setFormHeureDepart(e.target.value)}
                  />
                </label>
                <label className="rt-form-label">
                  Heure de fin
                  <input
                    className="rt-form-input"
                    type="time"
                    value={formHeureFin}
                    onChange={(e) => setFormHeureFin(e.target.value)}
                  />
                </label>
              </div>

              {/* Commandes multi-select */}
              <label className="rt-form-label">
                Commandes à assigner
                <div className="rt-multiselect">
                  <button
                    type="button"
                    className="rt-multiselect-trigger"
                    onClick={() => setCmdDropdownOpen((o) => !o)}
                  >
                    <span className="rt-multiselect-text">
                      {formCommandeIds.length === 0
                        ? '— Sélectionner des commandes —'
                        : `${formCommandeIds.length} commande(s) sélectionnée(s)`}
                    </span>
                    <ChevronDown size={14} className={`rt-select-icon ${cmdDropdownOpen ? 'rt-select-icon--open' : ''}`} />
                  </button>
                  {cmdDropdownOpen && (
                    <div className="rt-multiselect-dropdown">
                      {commandesOptions.length === 0 ? (
                        <div className="rt-multiselect-empty">Aucune commande disponible</div>
                      ) : (
                        commandesOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`rt-multiselect-option ${formCommandeIds.includes(c.id) ? 'rt-multiselect-option--selected' : ''}`}
                            onClick={() => toggleCommande(c.id)}
                          >
                            <span className="rt-option-check">
                              {formCommandeIds.includes(c.id) && <Check size={12} />}
                            </span>
                            <span className="rt-option-info">
                              <span className="rt-option-id">#{c.id}</span>
                              <span className="rt-option-produit">{c.produit}</span>
                            </span>
                            <span className="rt-option-adresse">{c.adresse_collecte} → {c.adresse_livraison}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* Actions */}
              <div className="rt-modal-actions">
                <button type="button" className="rt-btn-cancel" onClick={() => { setShowModal(false); resetForm() }}>Annuler</button>
                <button type="submit" className="rt-btn-submit" disabled={submitting}>
                  {submitting ? 'Création…' : 'Créer la route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
