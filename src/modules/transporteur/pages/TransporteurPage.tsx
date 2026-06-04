import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader, Route, X } from 'lucide-react'
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
import { getSupabaseClient } from '../../../lib/supabase/supabase.client'
import type { Transporteur } from '../types/transporteur.types'

type TransporteurRouteDetail = {
  id: string
  date: string
  statut: string
  distance_totale: number | null
  commandes: Array<{ id: string }>
}

function detailValue(value: string | null | undefined): string {
  return value?.trim() || 'Non renseigne'
}

function shortId(id: string): string {
  return id.slice(0, 8)
}

function boolValue(value: boolean | null): string {
  if (value === true) return 'Oui'
  if (value === false) return 'Non'
  return 'Non renseigne'
}

function getFullAdresse(transporteur: Transporteur): string {
  return [
    transporteur.numero_civique,
    transporteur.rue,
    transporteur.ville,
  ].filter(Boolean).join(' ')
}

export default function TransporteurPage({ isModalOpen, onCloseModal, showArchived }: { isModalOpen: boolean; onCloseModal: () => void; showArchived: boolean }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { transporteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useTransporteurs(page)
  const { transporteurs: archivedTransporteurs, total: archivedTotal, isLoading: isLoadingArchived, errorMessage: archivedError, refresh: refreshArchived } = useArchivedTransporteurs(page)
  const [editItem, setEditItem] = useState<Transporteur | null>(null)
  const [archiveItem, setArchiveItem] = useState<Transporteur | null>(null)
  const [reactivateItem, setReactivateItem] = useState<Transporteur | null>(null)
  const [selectedTransporteur, setSelectedTransporteur] = useState<Transporteur | null>(null)
  const [transporteurRoutes, setTransporteurRoutes] = useState<TransporteurRouteDetail[]>([])
  const [loadingTransporteurDetails, setLoadingTransporteurDetails] = useState(false)

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

  const closeTransporteurDetails = () => {
    setSelectedTransporteur(null)
    setTransporteurRoutes([])
    setLoadingTransporteurDetails(false)
  }

  const openTransporteurEdit = (transporteur: Transporteur) => {
    closeTransporteurDetails()
    setEditItem(transporteur)
  }

  const openTransporteurArchive = (transporteur: Transporteur) => {
    closeTransporteurDetails()
    setArchiveItem(transporteur)
  }

  const openTransporteurReactivate = (transporteur: Transporteur) => {
    closeTransporteurDetails()
    setReactivateItem(transporteur)
  }

  useEffect(() => {
    if (!selectedTransporteur) return

    let ignore = false

    async function fetchRoutes() {
      setLoadingTransporteurDetails(true)
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('routes')
          .select('id, date, statut, distance_totale, commandes!route_id(id)')
          .eq('transporteur_id', selectedTransporteur.id)
          .order('date', { ascending: false })

        if (error) throw error
        if (!ignore) {
          setTransporteurRoutes(((data ?? []) as Array<Record<string, unknown>>).map((route) => ({
            id: String(route.id ?? ''),
            date: String(route.date ?? ''),
            statut: String(route.statut ?? ''),
            distance_totale: (route.distance_totale as number | null) ?? null,
            commandes: ((route.commandes ?? []) as Array<{ id: string }>),
          })))
        }
      } catch (error) {
        console.error('Erreur chargement routes transporteur:', error)
        if (!ignore) setTransporteurRoutes([])
      } finally {
        if (!ignore) setLoadingTransporteurDetails(false)
      }
    }

    void fetchRoutes()

    return () => {
      ignore = true
    }
  }, [selectedTransporteur])

  useEffect(() => {
    if (!selectedTransporteur) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTransporteurDetails()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTransporteur])

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
            onSelect={(tr) => setSelectedTransporteur(tr)}
          />
        ) : (
          <TransporteurTable
            transporteurs={transporteurs}
            isLoading={isLoading}
            onEdit={(tr) => setEditItem(tr)}
            onArchive={(tr) => setArchiveItem(tr)}
            onSelect={(tr) => setSelectedTransporteur(tr)}
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

      {selectedTransporteur && (
        <div className="rt-drawer-overlay" onClick={closeTransporteurDetails}>
          <aside className="rt-drawer" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
            <div className="rt-drawer-header">
              <div>
                <h2 className="rt-drawer-title">Details du transporteur</h2>
                <span className="rt-drawer-subtitle">#{shortId(selectedTransporteur.id)}</span>
              </div>
              <button className="rt-modal-close" type="button" onClick={closeTransporteurDetails} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>

            <div className="rt-drawer-body">
              <section className="rt-detail-section">
                <h3 className="rt-detail-section-title">Informations generales</h3>
                <div className="rt-detail-grid">
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">ID</span>
                    <span className="rt-detail-value rt-detail-value--mono">#{shortId(selectedTransporteur.id)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Statut</span>
                    <span className="rt-detail-value">{selectedTransporteur.is_archived ? 'Archive' : 'Actif'}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Nom</span>
                    <span className="rt-detail-value">{detailValue(selectedTransporteur.nom)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Prenom</span>
                    <span className="rt-detail-value">{detailValue(selectedTransporteur.prenom)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">CIN</span>
                    <span className="rt-detail-value rt-detail-value--mono">{detailValue(selectedTransporteur.cin)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Permis</span>
                    <span className="rt-detail-value rt-detail-value--mono">{detailValue(selectedTransporteur.numero_permis)}</span>
                  </div>
                </div>
              </section>

              <section className="rt-detail-section">
                <h3 className="rt-detail-section-title">Contact et documents</h3>
                <div className="rt-detail-grid">
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Telephone</span>
                    <span className="rt-detail-value rt-detail-value--mono">{detailValue(selectedTransporteur.telephone)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Email</span>
                    <span className="rt-detail-value">{detailValue(selectedTransporteur.email)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Ville</span>
                    <span className="rt-detail-value">{detailValue(selectedTransporteur.ville)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Creation</span>
                    <span className="rt-detail-value">{detailValue(selectedTransporteur.date_creation)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Permis valide</span>
                    <span className="rt-detail-value">{boolValue(selectedTransporteur.permis_valide)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Assurance valide</span>
                    <span className="rt-detail-value">{boolValue(selectedTransporteur.assurance_valide)}</span>
                  </div>
                  <div className="rt-detail-item">
                    <span className="rt-detail-label">Visite technique</span>
                    <span className="rt-detail-value">{boolValue(selectedTransporteur.visite_valide)}</span>
                  </div>
                  <div className="rt-detail-item rt-detail-item--wide">
                    <span className="rt-detail-label">Adresse</span>
                    <span className="rt-detail-value">{detailValue(getFullAdresse(selectedTransporteur))}</span>
                  </div>
                </div>
              </section>

              <section className="rt-detail-section">
                <h3 className="rt-detail-section-title">Routes assignees</h3>
                {loadingTransporteurDetails ? (
                  <div className="rt-detail-empty">
                    <Loader size={16} className="nv-spin" />
                    <span>{t('common.loading')}</span>
                  </div>
                ) : transporteurRoutes.length === 0 ? (
                  <div className="rt-detail-empty">Aucune route assignee</div>
                ) : (
                  <div className="rt-detail-commandes">
                    {transporteurRoutes.map((route) => (
                      <article key={route.id} className="rt-detail-commande">
                        <div className="rt-detail-commande-head">
                          <span className="rt-detail-value rt-detail-value--mono">#{shortId(route.id)}</span>
                          <span className="rt-detail-badge">{detailValue(route.statut)}</span>
                        </div>
                        <div className="rt-detail-address">
                          <Route size={12} />
                          <span>{detailValue(route.date)}</span>
                        </div>
                        <div className="rt-detail-muted">
                          {route.distance_totale != null ? `${route.distance_totale} km` : 'Non renseigne'} - {route.commandes.length} commandes
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rt-detail-section">
                <h3 className="rt-detail-section-title">Actions rapides</h3>
                <div className="rt-detail-actions">
                  {!selectedTransporteur.is_archived && (
                    <>
                      <button type="button" className="rt-detail-action" onClick={() => openTransporteurEdit(selectedTransporteur)}>Modifier</button>
                      <button type="button" className="rt-detail-action" onClick={() => openTransporteurArchive(selectedTransporteur)}>Archiver</button>
                    </>
                  )}
                  {selectedTransporteur.is_archived && (
                    <button type="button" className="rt-detail-action" onClick={() => openTransporteurReactivate(selectedTransporteur)}>Reactiver</button>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

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
