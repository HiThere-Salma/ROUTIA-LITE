import { useState } from 'react'
import { useAgriculteurs } from '../hooks/useAgriculteurs'
import { AgriculteurTable } from '../components/AgriculteurTable'
import { AgriculteurFormModal } from '../components/AgriculteurFormModal'
import { PAGE_SIZE } from '../constants/agriculteur.constants'
import { formatLastUpdated } from '../utils/agriculteur.utils'

export default function AgriculteurPage({ isModalOpen, onCloseModal }: { isModalOpen: boolean; onCloseModal: () => void }) {
  const [page, setPage] = useState(1)
  const { agriculteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useAgriculteurs(page)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)
  const firstPage = Math.min(Math.max(page - 1, 1), Math.max(totalPages - 2, 1))
  const pageButtons = Array.from({ length: Math.min(3, totalPages) }, (_, i) => firstPage + i)

  return (
    <div className="agri-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des Agriculteurs</h1>
        <p className="dashboard-sub">Pilotez votre réseau de producteurs et optimisez les points de collecte.</p>
      </div>

      <div className="agri-toolbar">
        <button className="agri-btn-outline">⊟ Filtrer</button>
        <button className="agri-btn-outline">Exporter CSV</button>
        {lastUpdated && <span className="agri-toolbar-updated">{formatLastUpdated(lastUpdated)}</span>}
      </div>

      <div className="agri-table-wrap">
        {errorMessage && <p className="agri-error">{errorMessage}</p>}
        <AgriculteurTable agriculteurs={agriculteurs} isLoading={isLoading} />
        <div className="agri-pagination">
          <span className="agri-pag-info">
            Affichage de {pageStart}–{pageEnd} sur {total.toLocaleString('fr-FR')}
          </span>
          <div className="agri-pag-pages">
            <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {pageButtons.map((p) => (
              <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      <AgriculteurFormModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onCreated={() => { setPage(1); refresh() }}
      />
    </div>
  )
}
