import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

type AgriculteurFilters = {
  nomPrenom: string
  cin: string
  telephone: string
  email: string
  villeAdresse: string
  statut: 'tous' | 'actif' | 'archive'
}

const EMPTY_FILTERS: AgriculteurFilters = {
  nomPrenom: '',
  cin: '',
  telephone: '',
  email: '',
  villeAdresse: '',
  statut: 'tous',
}

function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().trim()
}

function getFullAdresse(agriculteur: Agriculteur): string {
  return [
    agriculteur.numero_civique,
    agriculteur.rue,
    agriculteur.quartier,
    agriculteur.ville,
    agriculteur.code_postal,
  ].filter(Boolean).join(' ')
}

function matchesAgriculteurFilters(agriculteur: Agriculteur, filters: AgriculteurFilters): boolean {
  const fullName = normalizeSearch(`${agriculteur.nom} ${agriculteur.prenom}`)
  const reverseFullName = normalizeSearch(`${agriculteur.prenom} ${agriculteur.nom}`)
  const villeAdresse = normalizeSearch(getFullAdresse(agriculteur))

  const nomPrenomFilter = normalizeSearch(filters.nomPrenom)
  const cinFilter = normalizeSearch(filters.cin)
  const telephoneFilter = normalizeSearch(filters.telephone)
  const emailFilter = normalizeSearch(filters.email)
  const villeAdresseFilter = normalizeSearch(filters.villeAdresse)

  if (nomPrenomFilter && !fullName.includes(nomPrenomFilter) && !reverseFullName.includes(nomPrenomFilter)) return false
  if (cinFilter && !normalizeSearch(agriculteur.cin).includes(cinFilter)) return false
  if (telephoneFilter && !normalizeSearch(agriculteur.telephone).includes(telephoneFilter)) return false
  if (emailFilter && !normalizeSearch(agriculteur.email).includes(emailFilter)) return false
  if (villeAdresseFilter && !villeAdresse.includes(villeAdresseFilter)) return false
  if (filters.statut === 'actif' && agriculteur.is_archived) return false
  if (filters.statut === 'archive' && !agriculteur.is_archived) return false

  return true
}

function hasFilters(filters: AgriculteurFilters): boolean {
  return Object.entries(filters).some(([key, value]) => key === 'statut' ? value !== 'tous' : value.trim() !== '')
}

function getCsvValue(value: string | null | undefined): string {
  const normalized = value?.trim() || '-'
  return `"${normalized.replace(/"/g, '""')}"`
}

function getExcelTextCsvValue(value: string | null | undefined): string {
  const normalized = value?.trim() || '-'
  const formula = `="${normalized.replace(/"/g, '""')}"`
  return `"${formula.replace(/"/g, '""')}"`
}

function getCsvFileDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function exportAgriculteursCsv(agriculteurs: Agriculteur[]): void {
  const headers = ['nom', 'prenom', 'CIN', 'telephone', 'email', 'adresse', 'ville', 'statut']
  const rows = agriculteurs.map((agriculteur) => [
    getCsvValue(agriculteur.nom),
    getCsvValue(agriculteur.prenom),
    getExcelTextCsvValue(agriculteur.cin),
    getExcelTextCsvValue(agriculteur.telephone),
    getCsvValue(agriculteur.email),
    getCsvValue(getFullAdresse(agriculteur)),
    getCsvValue(agriculteur.ville),
    getCsvValue(agriculteur.is_archived ? 'archive' : 'actif'),
  ].join(';'))

  const csvContent = ['\uFEFFsep=;', headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `agriculteurs_${getCsvFileDate()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function AgriculteurPage({ isModalOpen, onCloseModal, showArchived }: { isModalOpen: boolean; onCloseModal: () => void; showArchived: boolean }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { agriculteurs, total, isLoading, errorMessage, lastUpdated, refresh } = useAgriculteurs(page)
  const { agriculteurs: archivedAgriculteurs, total: archivedTotal, isLoading: isLoadingArchived, errorMessage: archivedError, refresh: refreshArchived } = useArchivedAgriculteurs(page)
  const [editItem, setEditItem] = useState<Agriculteur | null>(null)
  const [archiveItem, setArchiveItem] = useState<Agriculteur | null>(null)
  const [reactivateItem, setReactivateItem] = useState<Agriculteur | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AgriculteurFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AgriculteurFilters>(EMPTY_FILTERS)

  const { handleArchive, isArchiving, archiveError } = useArchiveAgriculteur(() => {
    setArchiveItem(null)
    refresh()
  })

  const { handleReactivate, isReactivating, reactivateError } = useReactivateAgriculteur(() => {
    setReactivateItem(null)
    refreshArchived()
  })

  const activeTotal = showArchived ? archivedTotal : total
  const activeAgriculteurs = showArchived ? archivedAgriculteurs : agriculteurs
  const displayedAgriculteurs = useMemo(
    () => activeAgriculteurs.filter((agriculteur) => matchesAgriculteurFilters(agriculteur, appliedFilters)),
    [activeAgriculteurs, appliedFilters]
  )
  const filtersAreActive = hasFilters(appliedFilters)
  const displayTotal = filtersAreActive ? displayedAgriculteurs.length : activeTotal
  const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE))
  const pageStart = displayTotal === 0 ? 0 : filtersAreActive ? 1 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = filtersAreActive ? displayedAgriculteurs.length : Math.min(page * PAGE_SIZE, activeTotal)
  const firstPage = Math.min(Math.max(page - 1, 1), Math.max(totalPages - 2, 1))
  const pageButtons = Array.from({ length: Math.min(3, totalPages) }, (_, i) => firstPage + i)

  const updateDraftFilter = <K extends keyof AgriculteurFilters>(field: K, value: AgriculteurFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    setIsFilterOpen(false)
  }

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(1)
  }

  return (
    <div className="agri-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">{t('agriculteurs.title')}</h1>
        <p className="dashboard-sub">{t('agriculteurs.sub')}</p>
      </div>

      <div className="agri-toolbar">
        <button className={`agri-btn-outline${filtersAreActive ? ' agri-btn-outline--active' : ''}`} onClick={() => setIsFilterOpen(true)}>
          {t('agriPage.filter')}
        </button>
        {filtersAreActive && (
          <button className="agri-btn-outline" onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
        <button className="agri-btn-outline" onClick={() => exportAgriculteursCsv(displayedAgriculteurs)}>
          {t('agriPage.exportCsv')}
        </button>
        {lastUpdated && <span className="agri-toolbar-updated">{formatLastUpdated(lastUpdated)}</span>}
      </div>

      <div className="agri-table-wrap">
        {(errorMessage || archivedError) && <p className="agri-error">{errorMessage || archivedError}</p>}

        {showArchived ? (
          <AgriculteurArchivedTable
            agriculteurs={displayedAgriculteurs}
            isLoading={isLoadingArchived}
            onReactivate={(ag) => setReactivateItem(ag)}
          />
        ) : (
          <AgriculteurTable
            agriculteurs={displayedAgriculteurs}
            isLoading={isLoading}
            onEdit={(ag) => setEditItem(ag)}
            onArchive={(ag) => setArchiveItem(ag)}
          />
        )}

        <div className="agri-pagination">
          <span className="agri-pag-info">
            {t('cmdPage.showing')} {pageStart}–{pageEnd} {t('cmdPage.of')} {displayTotal.toLocaleString('fr-FR')}
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

      {isFilterOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => setIsFilterOpen(false)}>
          <div className="modal-panel agri-filter-modal" role="dialog" aria-modal="true" aria-labelledby="agri-filter-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="agri-filter-title" className="modal-title">Filtrer les agriculteurs</h2>
                <p className="agri-filter-sub">Les filtres s'appliquent aux agriculteurs deja charges dans la liste.</p>
              </div>
              <button className="modal-close" type="button" onClick={() => setIsFilterOpen(false)} aria-label="Fermer">×</button>
            </div>

            <div className="modal-form">
              <div className="modal-form-grid">
                <label className="modal-field">
                  <span className="modal-label">Nom / prenom</span>
                  <input className="modal-input" value={draftFilters.nomPrenom} onChange={(event) => updateDraftFilter('nomPrenom', event.target.value)} />
                </label>
                <label className="modal-field">
                  <span className="modal-label">CIN</span>
                  <input className="modal-input modal-input--mono" value={draftFilters.cin} onChange={(event) => updateDraftFilter('cin', event.target.value)} />
                </label>
                <label className="modal-field">
                  <span className="modal-label">Telephone</span>
                  <input className="modal-input modal-input--mono" value={draftFilters.telephone} onChange={(event) => updateDraftFilter('telephone', event.target.value)} />
                </label>
                <label className="modal-field">
                  <span className="modal-label">Email</span>
                  <input className="modal-input" type="email" value={draftFilters.email} onChange={(event) => updateDraftFilter('email', event.target.value)} />
                </label>
                <label className="modal-field">
                  <span className="modal-label">Ville / adresse</span>
                  <input className="modal-input" value={draftFilters.villeAdresse} onChange={(event) => updateDraftFilter('villeAdresse', event.target.value)} />
                </label>
                <label className="modal-field">
                  <span className="modal-label">Statut</span>
                  <select className="modal-input" value={draftFilters.statut} onChange={(event) => updateDraftFilter('statut', event.target.value as AgriculteurFilters['statut'])}>
                    <option value="tous">Tous</option>
                    <option value="actif">Actif</option>
                    <option value="archive">Archive</option>
                  </select>
                </label>
              </div>

              <div className="agri-filter-actions">
                <button className="modal-btn-submit agri-filter-apply" type="button" onClick={applyFilters}>Appliquer</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
