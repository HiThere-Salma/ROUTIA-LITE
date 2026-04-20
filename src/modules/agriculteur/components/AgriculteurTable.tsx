import type { Agriculteur } from '../types/agriculteur.types'
import { AgriculteurTableRow } from './AgriculteurTableRow'

type Props = {
  agriculteurs: Agriculteur[]
  isLoading: boolean
  onEdit: (agriculteur: Agriculteur) => void
  onArchive: (agriculteur: Agriculteur) => void
}

export function AgriculteurTable({ agriculteurs, isLoading, onEdit, onArchive }: Props) {
  return (
    <table className="agri-table">
      <thead>
        <tr>
          <th>Nom &amp; Prénom</th>
          <th>CIN</th>
          <th>Téléphone</th>
          <th>Email</th>
          <th>Adresse</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">Chargement...</td>
          </tr>
        ) : agriculteurs.length === 0 ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">Aucun agriculteur trouvé.</td>
          </tr>
        ) : agriculteurs.map((agriculteur) => (
          <AgriculteurTableRow key={agriculteur.id} agriculteur={agriculteur} onEdit={onEdit} onArchive={onArchive} />
        ))}
      </tbody>
    </table>
  )
}
