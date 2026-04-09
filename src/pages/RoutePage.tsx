import { useState } from 'react'
import { Search, Eye, Pencil, Trash2, Truck } from 'lucide-react'

type RouteData = {
  id: string
  routeId: string
  transporteur: string
  date: string
  heureDebut: string
  heureFin: string
  commandes: number
  statut: 'en_cours' | 'terminee' | 'planifiee' | 'annulee'
}

const routesMock: RouteData[] = [
  { id: '1', routeId: '#RT-4401', transporteur: 'Amrani Karim', date: '2026-04-09', heureDebut: '08:00', heureFin: '12:30', commandes: 5, statut: 'en_cours' },
  { id: '2', routeId: '#RT-4392', transporteur: 'Zitouni Youssef', date: '2026-04-09', heureDebut: '07:30', heureFin: '11:00', commandes: 3, statut: 'terminee' },
  { id: '3', routeId: '#RT-4388', transporteur: 'Lahlou Sofia', date: '2026-04-08', heureDebut: '09:00', heureFin: '14:00', commandes: 7, statut: 'planifiee' },
  { id: '4', routeId: '#RT-4375', transporteur: 'Bennani Omar', date: '2026-04-08', heureDebut: '06:00', heureFin: '10:30', commandes: 4, statut: 'terminee' },
  { id: '5', routeId: '#RT-4360', transporteur: 'Chraibi Leila', date: '2026-04-07', heureDebut: '08:30', heureFin: '13:00', commandes: 6, statut: 'en_cours' },
  { id: '6', routeId: '#RT-4351', transporteur: 'Moussaoui Tarik', date: '2026-04-07', heureDebut: '07:00', heureFin: '11:30', commandes: 2, statut: 'annulee' },
  { id: '7', routeId: '#RT-4340', transporteur: 'Berrada Samira', date: '2026-04-06', heureDebut: '09:30', heureFin: '15:00', commandes: 8, statut: 'terminee' },
  { id: '8', routeId: '#RT-4329', transporteur: 'Ennaji Mehdi', date: '2026-04-06', heureDebut: '06:30', heureFin: '12:00', commandes: 5, statut: 'planifiee' },
  { id: '9', routeId: '#RT-4310', transporteur: 'Ouali Fatima', date: '2026-04-05', heureDebut: '07:00', heureFin: '11:00', commandes: 3, statut: 'terminee' },
  { id: '10', routeId: '#RT-4298', transporteur: 'Rachid Omar', date: '2026-04-05', heureDebut: '08:00', heureFin: '13:30', commandes: 6, statut: 'en_cours' },
  { id: '11', routeId: '#RT-4285', transporteur: 'Haddou Nadia', date: '2026-04-04', heureDebut: '06:30', heureFin: '10:00', commandes: 4, statut: 'planifiee' },
  { id: '12', routeId: '#RT-4270', transporteur: 'Tazi Hassan', date: '2026-04-04', heureDebut: '09:00', heureFin: '14:30', commandes: 9, statut: 'terminee' },
  { id: '13', routeId: '#RT-4255', transporteur: 'Mansouri Zineb', date: '2026-04-03', heureDebut: '07:30', heureFin: '12:00', commandes: 5, statut: 'annulee' },
  { id: '14', routeId: '#RT-4240', transporteur: 'Fahmi Karima', date: '2026-04-03', heureDebut: '08:00', heureFin: '11:30', commandes: 3, statut: 'en_cours' },
  { id: '15', routeId: '#RT-4225', transporteur: 'Zahiri Mohamed', date: '2026-04-02', heureDebut: '06:00', heureFin: '10:30', commandes: 7, statut: 'terminee' },
]

const STATUT_MAP: Record<RouteData['statut'], { label: string; className: string }> = {
  en_cours: { label: 'En cours', className: 'rt-status--encours' },
  terminee: { label: 'Terminée', className: 'rt-status--terminee' },
  planifiee: { label: 'Planifiée', className: 'rt-status--planifiee' },
  annulee: { label: 'Annulée', className: 'rt-status--annulee' },
}

export default function RoutePage() {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filtered = routesMock.filter(
    (r) =>
      r.routeId.toLowerCase().includes(search.toLowerCase()) ||
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
        <button className="btn-add-agri">＋ Ajouter une route</button>
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="rt-empty">Aucune route trouvée</td>
              </tr>
            ) : (
              paginated.map((r) => {
                const st = STATUT_MAP[r.statut]
                return (
                  <tr key={r.id}>
                    <td className="rt-mono">{r.routeId}</td>
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
    </div>
  )
}
