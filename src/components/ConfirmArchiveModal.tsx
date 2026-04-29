import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  name: string
  isArchiving: boolean
  archiveError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmArchiveModal({ isOpen, name, isArchiving, archiveError, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-archive-title">
      <div className="modal-panel modal-panel--sm">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-archive-title">{t('agriPage.confirmArchiveTitle')}</h2>
          <button className="modal-close" onClick={onCancel} aria-label={t('common.cancel')}>✕</button>
        </div>
        <div className="confirm-delete-body">
          <p className="confirm-delete-text">
            {t('agriPage.confirmArchiveMsg', { name })}<br />
            {t('agriPage.confirmArchiveSub')}
          </p>
          {archiveError && <p className="modal-submit-error">{archiveError}</p>}
          <div className="confirm-delete-actions">
            <button className="agri-btn-outline" onClick={onCancel} disabled={isArchiving}>
              {t('common.cancel')}
            </button>
            <button className="btn-archive-confirm" onClick={onConfirm} disabled={isArchiving}>
              {isArchiving ? t('agriPage.archiving') : t('agriPage.archive')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
