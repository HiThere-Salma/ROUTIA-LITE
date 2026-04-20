import type { Transporteur } from '../types/transporteur.types'
import { AVATAR_COLORS } from '../constants/transporteur.constants'
import { getAdresse, getTrId } from '../utils/transporteur.utils'
import { DocBadge } from './DocBadge'

type Props = {
  transporteur: Transporteur
  onEdit: (transporteur: Transporteur) => void
  onArchive: (transporteur: Transporteur) => void
}

export function TransporteurTableRow({ transporteur, onEdit, onArchive }: Props) {
  const initials = `${transporteur.nom[0]}${transporteur.prenom[0]}`
  const colorIndex = (transporteur.nom.charCodeAt(0) + transporteur.nom.charCodeAt(transporteur.nom.length - 1)) % AVATAR_COLORS.length
  const palette = AVATAR_COLORS[colorIndex]

  return (
    <tr>
      <td>
        <div className="tr-name-cell">
          <span className="tr-avatar" style={{ background: palette.bg, color: palette.color }}>
            {initials}
          </span>
          <div className="tr-name-info">
            <span className="tr-fullname">{transporteur.nom} {transporteur.prenom}</span>
            <span className="tr-id">ID: {getTrId(transporteur.id)}</span>
          </div>
        </div>
      </td>
      <td className="tr-mono">{transporteur.cin || '—'}</td>
      <td>
        <div className="tr-contact">
          <span className="tr-tel">{transporteur.telephone || '—'}</span>
          <span className="tr-email">{transporteur.email}</span>
        </div>
      </td>
      <td>
        <div className="tr-docs">
          <DocBadge label="PERMIS" isValid={transporteur.permis_valide} />
          <DocBadge label="ASSUR." isValid={transporteur.assurance_valide} />
          <DocBadge label="VISITE" isValid={transporteur.visite_valide} />
        </div>
      </td>
      <td className="tr-adresse">
        <div className="tr-name-info">
          <span>{getAdresse(transporteur)}</span>
          <span className="tr-ville">{transporteur.ville?.toUpperCase() ?? '—'}</span>
        </div>
      </td>
      <td>
        <div className="agri-actions">
          <button className="agri-action-btn" title="Modifier" onClick={() => onEdit(transporteur)}>✎</button>
          <button className="agri-action-btn agri-action-btn--archive" title="Archiver" onClick={() => onArchive(transporteur)}>⊘</button>
        </div>
      </td>
    </tr>
  )
}
