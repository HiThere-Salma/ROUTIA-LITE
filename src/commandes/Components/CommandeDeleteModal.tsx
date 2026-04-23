import { AlertTriangle, Trash2, X } from "lucide-react";

type CommandeDeleteModalProps = {
  isOpen: boolean;
  commandeId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting?: boolean;
};

export default function CommandeDeleteModal({
  isOpen,
  commandeId,
  onConfirm,
  onCancel,
  deleting = false,
}: CommandeDeleteModalProps) {
  if (!isOpen || !commandeId) return null;

  return (
    <div
      className="cmd-modal-overlay cmd-delete-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmd-delete-title"
    >
      <div className="cmd-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-delete-icon-wrap">
          <AlertTriangle size={32} className="cmd-delete-icon" />
        </div>

        <h2 className="cmd-delete-title" id="cmd-delete-title">
          Supprimer la commande
        </h2>

        <p className="cmd-delete-body">
          Vous êtes sur le point de supprimer la commande{" "}
          <span className="cmd-delete-ref">#{commandeId}</span>.
          <br />
          Cette action est <strong>irréversible</strong>.
        </p>

        <div className="cmd-delete-footer">
          <button
            className="agri-btn-outline"
            type="button"
            onClick={onCancel}
            disabled={deleting}
          >
            <X size={14} />
            Annuler
          </button>
          <button
            className="cmd-delete-confirm-btn"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={14} />
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
