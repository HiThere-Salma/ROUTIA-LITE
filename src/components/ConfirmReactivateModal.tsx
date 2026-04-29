import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  name: string
  isReactivating: boolean
  reactivateError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmReactivateModal({ isOpen, name, isReactivating, reactivateError, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-reactivate-title">
      <div className="modal-panel modal-panel--sm">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-reactivate-title">{t('agriPage.confirmReactivateTitle')}</h2>
          <button className="modal-close" onClick={onCancel} aria-label={t('common.cancel')}>✕</button>
        </div>
        <div className="confirm-delete-body">
          <p className="confirm-delete-text">
            {t('agriPage.confirmReactivateMsg', { name })}<br />
            {t('agriPage.confirmReactivateSub')}
          </p>
          {reactivateError && <p className="modal-submit-error">{reactivateError}</p>}
          <div className="confirm-delete-actions">
            <button className="agri-btn-outline" onClick={onCancel} disabled={isReactivating}>
              {t('common.cancel')}
            </button>
            <button className="btn-reactivate-confirm" onClick={onConfirm} disabled={isReactivating}>
              {isReactivating ? t('agriPage.reactivating') : t('agriPage.reactivate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
