import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation()
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
          {t('cmdModal.deleteTitle')}
        </h2>

        <p className="cmd-delete-body">
          {t('cmdModal.deleteBodyPrefix')}{" "}
          <span className="cmd-delete-ref">#{commandeId}</span>.
          <br />
          Cette action est <strong>{t('cmdModal.deleteIrreversible')}</strong>.
        </p>

        <div className="cmd-delete-footer">
          <button
            className="agri-btn-outline"
            type="button"
            onClick={onCancel}
            disabled={deleting}
          >
            <X size={14} />
            {t('common.cancel')}
          </button>
          <button
            className="cmd-delete-confirm-btn"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={14} />
            {deleting ? t('cmdModal.deleting') : t('routePage.btnDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
