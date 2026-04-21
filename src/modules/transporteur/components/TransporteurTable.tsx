import type { Transporteur } from '../types/transporteur.types'
import { TransporteurTableRow } from './TransporteurTableRow'

type Props = {
  transporteurs: Transporteur[]
  isLoading: boolean
  onEdit: (transporteur: Transporteur) => void
  onArchive: (transporteur: Transporteur) => void
}

export function TransporteurTable({ transporteurs, isLoading, onEdit, onArchive }: Props) {
  return (
    <table className="tr-table">
      <thead>
        <tr>
          <th>Nom &amp; Prénom</th>
          <th>CIN</th>
          <th>Contact</th>
          <th>Documents</th>
          <th>Adresse</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">Chargement...</td>
          </tr>
        ) : transporteurs.length === 0 ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">Aucun transporteur trouvé.</td>
          </tr>
        ) : transporteurs.map((transporteur) => (
          <TransporteurTableRow key={transporteur.id} transporteur={transporteur} onEdit={onEdit} onArchive={onArchive} />
        ))}
      </tbody>
    </table>
  )
}
