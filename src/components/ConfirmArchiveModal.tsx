type Props = {
  isOpen: boolean
  name: string
  isArchiving: boolean
  archiveError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmArchiveModal({ isOpen, name, isArchiving, archiveError, onConfirm, onCancel }: Props) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-archive-title">
      <div className="modal-panel modal-panel--sm">
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-archive-title">Confirmer l'archivage</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Annuler">✕</button>
        </div>
        <div className="confirm-delete-body">
          <p className="confirm-delete-text">
            Voulez-vous archiver <strong>{name}</strong> ?<br />
            L'utilisateur ne sera plus actif mais pourra être réactivé.
          </p>
          {archiveError && <p className="modal-submit-error">{archiveError}</p>}
          <div className="confirm-delete-actions">
            <button className="agri-btn-outline" onClick={onCancel} disabled={isArchiving}>
              Annuler
            </button>
            <button className="btn-archive-confirm" onClick={onConfirm} disabled={isArchiving}>
              {isArchiving ? 'Archivage...' : 'Archiver'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
