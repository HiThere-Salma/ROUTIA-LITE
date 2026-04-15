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
    distance_estimee: string;
  };
  getNature: (commande: CommandeData) => string;
  getStatus: (commande: CommandeData) => string;
};

export default function CommandesTable({
  commandes,
  selectedCommandeId,
  onSelectCommande,
  getCommandeId,
  getPrimaryFields,
  getNature,
  getStatus,
}: CommandesTableProps) {
  return (
    <div className="cmd-table-wrap">
      <table className="cmd-management-table">
        <thead>
          <tr>
            <th>ID COMMANDE</th>
            <th>DATE COLLECTE</th>
            <th>HEURE LIVRAISON</th>
            <th>ADRESSE COLLECTE</th>
            <th>ADRESSE LIVRAISON</th>
            <th>DISTANCE ESTIMEE</th>
            <th>NATURE</th>
            <th>STATUT</th>
          </tr>
        </thead>
        <tbody>
          {commandes.length === 0 ? (
            <tr>
              <td className="cmd-management-empty" colSpan={8}>
                Aucune commande a afficher.
              </td>
            </tr>
          ) : (
            commandes.map((commande, index) => {
              const commandeId = getCommandeId(commande, index);
              const primaryFields = getPrimaryFields(commande);
              const nature = getNature(commande);
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
                    <span>{primaryFields.heure_livraison}</span>
                  </td>
                  <td>
                    <span>{primaryFields.adresse_collecte}</span>
                  </td>
                  <td>
                    <span>{primaryFields.adresse_livraison}</span>
                  </td>
                  <td>
                    <span>{primaryFields.distance_estimee}</span>
                  </td>
                  <td>
                    <span className="cmd-nature-pill">{nature}</span>
                  </td>
                  <td>
                    <CommandeStatusBadge status={status} />
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
