import type { Agriculteur } from '../types/agriculteur.types'
import { AgriculteurArchivedTableRow } from './AgriculteurArchivedTableRow'

type Props = {
  agriculteurs: Agriculteur[]
  isLoading: boolean
  onReactivate: (agriculteur: Agriculteur) => void
}

export function AgriculteurArchivedTable({ agriculteurs, isLoading, onReactivate }: Props) {
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
            <td colSpan={6} className="agri-table-empty">Aucun agriculteur archivé.</td>
          </tr>
        ) : agriculteurs.map((agriculteur) => (
          <AgriculteurArchivedTableRow key={agriculteur.id} agriculteur={agriculteur} onReactivate={onReactivate} />
        ))}
      </tbody>
    </table>
  )
}
