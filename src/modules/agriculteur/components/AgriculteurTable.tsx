import { useTranslation } from 'react-i18next'
import type { Agriculteur } from '../types/agriculteur.types'
import { AgriculteurTableRow } from './AgriculteurTableRow'

type Props = {
  agriculteurs: Agriculteur[]
  isLoading: boolean
  onEdit: (agriculteur: Agriculteur) => void
  onArchive: (agriculteur: Agriculteur) => void
}

export function AgriculteurTable({ agriculteurs, isLoading, onEdit, onArchive }: Props) {
  const { t } = useTranslation()
  return (
    <table className="agri-table">
      <thead>
        <tr>
          <th>{t('common.nomPrenom')}</th>
          <th>{t('common.cin')}</th>
          <th>{t('common.telephone')}</th>
          <th>{t('common.email')}</th>
          <th>{t('common.adresse')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">{t('common.loading')}</td>
          </tr>
        ) : agriculteurs.length === 0 ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">{t('agriPage.empty')}</td>
          </tr>
        ) : agriculteurs.map((agriculteur) => (
          <AgriculteurTableRow key={agriculteur.id} agriculteur={agriculteur} onEdit={onEdit} onArchive={onArchive} />
        ))}
      </tbody>
    </table>
  )
}
