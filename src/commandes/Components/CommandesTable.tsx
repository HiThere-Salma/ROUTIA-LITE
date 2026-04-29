import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import CommandeStatusBadge from "./CommandeStatusBadge";
import type { CommandeData } from "../commandes.types";

type CommandesTableProps = {
  commandes: CommandeData[];
  selectedCommandeId: string | null;
  onSelectCommande: (commandeId: string) => void;
  getCommandeId: (commande: CommandeData, index: number) => string;
  getPrimaryFields: (commande: CommandeData) => {
    date_collecte: string;
    heure_livraison: string;
    adresse_collecte: string;
    adresse_livraison: string;
  };
  getStatus: (commande: CommandeData) => string;
  onEditCommande: (commandeId: string, commande: CommandeData) => void;
  onDeleteCommande: (commandeId: string, commande: CommandeData) => void;
};

export default function CommandesTable({
  commandes,
  selectedCommandeId,
  onSelectCommande,
  getCommandeId,
  getPrimaryFields,
  getStatus,
  onEditCommande,
  onDeleteCommande,
}: CommandesTableProps) {
  const { t } = useTranslation()
  return (
    <div className="cmd-table-wrap">
      <table className="cmd-management-table">
        <thead>
          <tr>
            <th>{t('cmdPage.thId')}</th>
            <th>{t('cmdPage.thDate')}</th>
            <th>{t('cmdPage.thCollecte')}</th>
            <th>{t('cmdPage.thLivraison')}</th>
            <th>{t('cmdPage.thStatut')}</th>
            <th>{t('cmdPage.thActions')}</th>
          </tr>
        </thead>
        <tbody>
          {commandes.length === 0 ? (
            <tr>
              <td className="cmd-management-empty" colSpan={6}>
                {t('cmdPage.emptyTable')}
              </td>
            </tr>
          ) : (
            commandes.map((commande, index) => {
              const commandeId = getCommandeId(commande, index);
              const primaryFields = getPrimaryFields(commande);
              const status = getStatus(commande);
              const isSelected = selectedCommandeId === commandeId;

              return (
                <tr
                  key={commandeId}
                  className={`cmd-table-row${isSelected ? " cmd-row-selected" : ""}`}
                  onClick={() => onSelectCommande(commandeId)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span className="cmd-order-id">#{commandeId}</span>
                  </td>
                  <td>
                    <span>{primaryFields.date_collecte}</span>
                  </td>
                  <td>
                    <span>{primaryFields.adresse_collecte}</span>
                  </td>
                  <td>
                    <span>{primaryFields.adresse_livraison}</span>
                  </td>
                  <td>
                    <CommandeStatusBadge status={status} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="cmd-actions-cell">
                      <button
                        className="cmd-action-btn cmd-action-btn--edit"
                        type="button"
                        title="Modifier"
                        onClick={() => onEditCommande(commandeId, commande)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="cmd-action-btn cmd-action-btn--delete"
                        type="button"
                        title="Supprimer"
                        onClick={() => onDeleteCommande(commandeId, commande)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
