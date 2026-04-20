type Props = {
  isOpen: boolean
  name: string
  isReactivating: boolean
  reactivateError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmReactivateModal({ isOpen, name, isReactivating, reactivateError, onConfirm, onCancel }: Props) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-reactivate-title">
      <div className="modal-panel modal-panel--sm">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-reactivate-title">Confirmer la réactivation</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Annuler">✕</button>
        </div>
        <div className="confirm-delete-body">
          <p className="confirm-delete-text">
            Voulez-vous réactiver <strong>{name}</strong> ?<br />
            L'utilisateur redeviendra actif sur la plateforme.
          </p>
          {reactivateError && <p className="modal-submit-error">{reactivateError}</p>}
          <div className="confirm-delete-actions">
            <button className="agri-btn-outline" onClick={onCancel} disabled={isReactivating}>
              Annuler
            </button>
            <button className="btn-reactivate-confirm" onClick={onConfirm} disabled={isReactivating}>
              {isReactivating ? 'Réactivation...' : 'Réactiver'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
