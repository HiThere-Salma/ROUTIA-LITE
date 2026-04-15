import type { Agriculteur } from '../types/agriculteur.types'
import { AVATAR_COLORS } from '../constants/agriculteur.constants'
import { getAdresse, getAgriId } from '../utils/agriculteur.utils'

type Props = {
  agriculteur: Agriculteur
  onEdit: (agriculteur: Agriculteur) => void
  onDelete: (agriculteur: Agriculteur) => void
}

export function AgriculteurTableRow({ agriculteur, onEdit, onDelete }: Props) {
  const initials = `${agriculteur.nom[0]}${agriculteur.prenom[0]}`
  const colorIndex = (agriculteur.nom.charCodeAt(0) + agriculteur.nom.charCodeAt(agriculteur.nom.length - 1)) % AVATAR_COLORS.length
  const palette = AVATAR_COLORS[colorIndex]

  return (
    <tr>
      <td>
        <div className="agri-name-cell">
          <span className="agri-avatar" style={{ background: palette.bg, color: palette.color }}>
            {initials}
          </span>
          <div className="agri-name-info">
            <span className="agri-fullname">{agriculteur.nom} {agriculteur.prenom}</span>
            <span className="agri-id">ID: {getAgriId(agriculteur.id)}</span>
          </div>
        </div>
      </td>
      <td className="agri-mono">{agriculteur.cin || '—'}</td>
      <td className="agri-mono">{agriculteur.telephone || '—'}</td>
      <td className="agri-email">{agriculteur.email}</td>
      <td>
        <div className="agri-name-info">
          <span className="agri-adresse">{getAdresse(agriculteur)}</span>
          <span className="agri-ville">{agriculteur.ville?.toUpperCase() ?? '—'}</span>
        </div>
      </td>
      <td>
        <div className="agri-actions">
          <button className="agri-action-btn" title="Modifier" onClick={() => onEdit(agriculteur)}>✎</button>
          <button className="agri-action-btn agri-action-btn--del" title="Supprimer" onClick={() => onDelete(agriculteur)}>✕</button>
        </div>
      </td>
    </tr>
  )
}
