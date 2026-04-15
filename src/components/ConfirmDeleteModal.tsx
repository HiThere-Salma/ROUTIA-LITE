type Props = {
  isOpen: boolean
  name: string
  isDeleting: boolean
  deleteError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ isOpen, name, isDeleting, deleteError, onConfirm, onCancel }: Props) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="modal-panel modal-panel--sm">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-delete-title">Confirmer la suppression</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Annuler">✕</button>
        </div>
        <div className="confirm-delete-body">
          <p className="confirm-delete-text">
            Voulez-vous vraiment supprimer <strong>{name}</strong> ?<br />
            Cette action est irréversible.
          </p>
          {deleteError && <p className="modal-submit-error">{deleteError}</p>}
          <div className="confirm-delete-actions">
            <button className="agri-btn-outline" onClick={onCancel} disabled={isDeleting}>
              Annuler
            </button>
            <button className="btn-delete-confirm" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
