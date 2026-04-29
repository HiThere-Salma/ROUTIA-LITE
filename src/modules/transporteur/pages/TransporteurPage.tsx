import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTransporteurs } from '../hooks/useTransporteurs'
import { useArchivedTransporteurs } from '../hooks/useArchivedTransporteurs'
import { useArchiveTransporteur } from '../hooks/useArchiveTransporteur'
import { useReactivateTransporteur } from '../hooks/useReactivateTransporteur'
import { TransporteurTable } from '../components/TransporteurTable'
import { TransporteurArchivedTable } from '../components/TransporteurArchivedTable'
import { TransporteurFormModal } from '../components/TransporteurFormModal'
import { ConfirmArchiveModal } from '../../../components/ConfirmArchiveModal'
import { ConfirmReactivateModal } from '../../../components/ConfirmReactivateModal'
import { PAGE_SIZE } from '../constants/transporteur.constants'
import { formatLastUpdated } from '../utils/transporteur.utils'
import type { Transporteur } from '../types/transporteur.types'

export default function TransporteurPage({ isModalOpen, onCloseModal, showArchived }: { isModalOpen: boolean; onCloseModal: () => void; showArchived: boolean }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { transporteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useTransporteurs(page)
  const { transporteurs: archivedTransporteurs, total: archivedTotal, isLoading: isLoadingArchived, errorMessage: archivedError, refresh: refreshArchived } = useArchivedTransporteurs(page)
  const [editItem, setEditItem] = useState<Transporteur | null>(null)
  const [archiveItem, setArchiveItem] = useState<Transporteur | null>(null)
  const [reactivateItem, setReactivateItem] = useState<Transporteur | null>(null)

  const { handleArchive, isArchiving, archiveError } = useArchiveTransporteur(() => {
    setArchiveItem(null)
    refresh()
  })

  const { handleReactivate, isReactivating, reactivateError } = useReactivateTransporteur(() => {
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
    <div className="tr-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">{t('transporteurs.title')}</h1>
        <p className="dashboard-sub">{t('transporteurs.sub')}</p>
      </div>

      <div className="tr-table-wrap">
        {(errorMessage || archivedError) && <p className="agri-error">{errorMessage || archivedError}</p>}

        {showArchived ? (
          <TransporteurArchivedTable
            transporteurs={archivedTransporteurs}
            isLoading={isLoadingArchived}
            onReactivate={(tr) => setReactivateItem(tr)}
          />
        ) : (
          <TransporteurTable
            transporteurs={transporteurs}
            isLoading={isLoading}
            onEdit={(tr) => setEditItem(tr)}
            onArchive={(tr) => setArchiveItem(tr)}
          />
        )}

        <div className="tr-footer">
          <div className="tr-footer-left">
            <span className="tr-sync-dot" />
            <span className="tr-sync-label">{t('transpPage.syncLabel')}</span>
            {lastUpdated && <span className="tr-sync-time">{t('transpPage.syncTime')} {formatLastUpdated(lastUpdated)}</span>}
          </div>
          <div className="tr-footer-right">
            <button className="tr-footer-btn">{t('transpPage.exportCsv')}</button>
            <button className="tr-footer-btn">{t('transpPage.monthlyReport')}</button>
          </div>
        </div>
      </div>

      <div className="tr-pagination">
        <span className="agri-pag-info">
          {t('cmdPage.showing')} {pageStart}–{pageEnd} {t('cmdPage.of')} {activeTotal.toLocaleString('fr-FR')}
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
