import type { Transporteur } from '../types/transporteur.types'
import { TransporteurArchivedTableRow } from './TransporteurArchivedTableRow'

type Props = {
  transporteurs: Transporteur[]
  isLoading: boolean
  onReactivate: (transporteur: Transporteur) => void
}

export function TransporteurArchivedTable({ transporteurs, isLoading, onReactivate }: Props) {
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
            <td colSpan={6} className="agri-table-empty">Aucun transporteur archivé.</td>
          </tr>
        ) : transporteurs.map((transporteur) => (
          <TransporteurArchivedTableRow key={transporteur.id} transporteur={transporteur} onReactivate={onReactivate} />
        ))}
      </tbody>
    </table>
  )
}
