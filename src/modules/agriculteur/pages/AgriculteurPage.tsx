import { useState } from 'react'
import { useAgriculteurs } from '../hooks/useAgriculteurs'
import { useArchivedAgriculteurs } from '../hooks/useArchivedAgriculteurs'
import { useArchiveAgriculteur } from '../hooks/useArchiveAgriculteur'
import { useReactivateAgriculteur } from '../hooks/useReactivateAgriculteur'
import { AgriculteurTable } from '../components/AgriculteurTable'
import { AgriculteurArchivedTable } from '../components/AgriculteurArchivedTable'
import { AgriculteurFormModal } from '../components/AgriculteurFormModal'
import { ConfirmArchiveModal } from '../../../components/ConfirmArchiveModal'
import { ConfirmReactivateModal } from '../../../components/ConfirmReactivateModal'
import { PAGE_SIZE } from '../constants/agriculteur.constants'
import { formatLastUpdated } from '../utils/agriculteur.utils'
import type { Agriculteur } from '../types/agriculteur.types'

export default function AgriculteurPage({ isModalOpen, onCloseModal, showArchived }: { isModalOpen: boolean; onCloseModal: () => void; showArchived: boolean }) {
  const [page, setPage] = useState(1)
  const { agriculteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useAgriculteurs(page)
  const { agriculteurs: archivedAgriculteurs, total: archivedTotal, isLoading: isLoadingArchived, errorMessage: archivedError, refresh: refreshArchived } = useArchivedAgriculteurs(page)
  const [editItem, setEditItem] = useState<Agriculteur | null>(null)
  const [archiveItem, setArchiveItem] = useState<Agriculteur | null>(null)
  const [reactivateItem, setReactivateItem] = useState<Agriculteur | null>(null)

  const { handleArchive, isArchiving, archiveError } = useArchiveAgriculteur(() => {
    setArchiveItem(null)
    refresh()
  })

  const { handleReactivate, isReactivating, reactivateError } = useReactivateAgriculteur(() => {
    setReactivateItem(null)
    refreshArchived()
  })

  const activeTotal = showArchived ? archivedTotal : total
  const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE))
  const pageStart = activeTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, activeTotal)
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
        {(errorMessage || archivedError) && <p className="agri-error">{errorMessage || archivedError}</p>}

        {showArchived ? (
          <AgriculteurArchivedTable
            agriculteurs={archivedAgriculteurs}
            isLoading={isLoadingArchived}
            onReactivate={(ag) => setReactivateItem(ag)}
          />
        ) : (
          <AgriculteurTable
            agriculteurs={agriculteurs}
            isLoading={isLoading}
            onEdit={(ag) => setEditItem(ag)}
            onArchive={(ag) => setArchiveItem(ag)}
          />
        )}

        <div className="agri-pagination">
          <span className="agri-pag-info">
            Affichage de {pageStart}–{pageEnd} sur {activeTotal.toLocaleString('fr-FR')}
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
        isOpen={isModalOpen || !!editItem}
        onClose={() => { onCloseModal(); setEditItem(null) }}
        onCreated={() => { setPage(1); refresh() }}
        editItem={editItem}
      />

      <ConfirmArchiveModal
        isOpen={!!archiveItem}
        name={archiveItem ? `${archiveItem.nom} ${archiveItem.prenom}` : ''}
        isArchiving={isArchiving}
        archiveError={archiveError}
        onConfirm={() => archiveItem && handleArchive(archiveItem.id)}
        onCancel={() => setArchiveItem(null)}
      />

      <ConfirmReactivateModal
        isOpen={!!reactivateItem}
        name={reactivateItem ? `${reactivateItem.nom} ${reactivateItem.prenom}` : ''}
        isReactivating={isReactivating}
        reactivateError={reactivateError}
        onConfirm={() => reactivateItem && handleReactivate(reactivateItem.id)}
        onCancel={() => setReactivateItem(null)}
      />
    </div>
  )
}
