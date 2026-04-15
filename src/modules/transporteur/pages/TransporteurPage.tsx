import { useState } from 'react'
import { useTransporteurs } from '../hooks/useTransporteurs'
import { useDeleteTransporteur } from '../hooks/useDeleteTransporteur'
import { TransporteurTable } from '../components/TransporteurTable'
import { TransporteurFormModal } from '../components/TransporteurFormModal'
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal'
import { PAGE_SIZE } from '../constants/transporteur.constants'
import { formatLastUpdated } from '../utils/transporteur.utils'
import type { Transporteur } from '../types/transporteur.types'

export default function TransporteurPage({ isModalOpen, onCloseModal }: { isModalOpen: boolean; onCloseModal: () => void }) {
  const [page, setPage] = useState(1)
  const { transporteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useTransporteurs(page)
  const [editItem, setEditItem] = useState<Transporteur | null>(null)
  const [deleteItem, setDeleteItem] = useState<Transporteur | null>(null)

  const { handleDelete, isDeleting, deleteError } = useDeleteTransporteur(() => {
    setDeleteItem(null)
    refresh()
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)
  const firstPage = Math.min(Math.max(page - 1, 1), Math.max(totalPages - 2, 1))
  const pageButtons = Array.from({ length: Math.min(3, totalPages) }, (_, i) => firstPage + i)

  return (
    <div className="tr-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des transporteurs</h1>
        <p className="dashboard-sub">Visualisez et gérez l'ensemble des prestataires logistiques enregistrés sur la plateforme.</p>
      </div>

      <div className="tr-table-wrap">
        {errorMessage && <p className="agri-error">{errorMessage}</p>}
        <TransporteurTable
          transporteurs={transporteurs}
          isLoading={isLoading}
          onEdit={(tr) => setEditItem(tr)}
          onDelete={(tr) => setDeleteItem(tr)}
        />

        <div className="tr-footer">
          <div className="tr-footer-left">
            <span className="tr-sync-dot" />
            <span className="tr-sync-label">BASE DE DONNÉES SYNCHRONISÉE</span>
            {lastUpdated && <span className="tr-sync-time">Mis à jour il y a {formatLastUpdated(lastUpdated)}</span>}
          </div>
          <div className="tr-footer-right">
            <button className="tr-footer-btn">EXPORTER EN CSV</button>
            <button className="tr-footer-btn">RAPPORT MENSUEL</button>
          </div>
        </div>
      </div>

      <div className="tr-pagination">
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

      <TransporteurFormModal
        isOpen={isModalOpen || !!editItem}
        onClose={() => { onCloseModal(); setEditItem(null) }}
        onCreated={() => { setPage(1); refresh() }}
        editItem={editItem}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteItem}
        name={deleteItem ? `${deleteItem.nom} ${deleteItem.prenom}` : ''}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  )
}
