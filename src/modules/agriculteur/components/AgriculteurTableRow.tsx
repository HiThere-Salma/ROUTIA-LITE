import type { Agriculteur } from '../types/agriculteur.types'
import { Archive, Pencil } from 'lucide-react'
import { AVATAR_COLORS } from '../constants/agriculteur.constants'
import { getAdresse, getAgriId } from '../utils/agriculteur.utils'

type Props = {
  agriculteur: Agriculteur
  onEdit: (agriculteur: Agriculteur) => void
  onArchive: (agriculteur: Agriculteur) => void
  onSelect: (agriculteur: Agriculteur) => void
}

export function AgriculteurTableRow({ agriculteur, onEdit, onArchive, onSelect }: Props) {
  const initials = `${agriculteur.nom[0]}${agriculteur.prenom[0]}`
  const colorIndex = (agriculteur.nom.charCodeAt(0) + agriculteur.nom.charCodeAt(agriculteur.nom.length - 1)) % AVATAR_COLORS.length
  const palette = AVATAR_COLORS[colorIndex]

  return (
    <tr
      className="agri-row--clickable"
      onClick={() => onSelect(agriculteur)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(agriculteur)
        }
      }}
    >
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
      <td className="agri-mono">{agriculteur.cin || '-'}</td>
      <td className="agri-mono">{agriculteur.telephone || '-'}</td>
      <td className="agri-email">{agriculteur.email}</td>
      <td>
        <div className="agri-name-info">
          <span className="agri-adresse">{getAdresse(agriculteur)}</span>
          <span className="agri-ville">{agriculteur.ville?.toUpperCase() ?? '-'}</span>
        </div>
      </td>
      <td>
        <div className="agri-actions">
          <button className="agri-action-btn" title="Modifier" onClick={(event) => { event.stopPropagation(); onEdit(agriculteur) }}><Pencil size={14} /></button>
          <button className="agri-action-btn agri-action-btn--archive" title="Archiver" onClick={(event) => { event.stopPropagation(); onArchive(agriculteur) }}><Archive size={14} /></button>
        </div>
      </td>
    </tr>
  )
}
