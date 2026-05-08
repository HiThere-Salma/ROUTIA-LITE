import { useTranslation } from 'react-i18next'
import type { Transporteur } from '../types/transporteur.types'
import { TransporteurTableRow } from './TransporteurTableRow'

type Props = {
  transporteurs: Transporteur[]
  isLoading: boolean
  onEdit: (transporteur: Transporteur) => void
  onArchive: (transporteur: Transporteur) => void
}

export function TransporteurTable({ transporteurs, isLoading, onEdit, onArchive }: Props) {
  const { t } = useTranslation()
  return (
    <table className="tr-table">
      <thead>
        <tr>
          <th>{t('common.nomPrenom')}</th>
          <th>{t('common.cin')}</th>
          <th>{t('common.contact')}</th>
          <th>{t('transpPage.thDocuments')}</th>
          <th>{t('common.adresse')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">{t('common.loading')}</td>
          </tr>
        ) : transporteurs.length === 0 ? (
          <tr>
            <td colSpan={6} className="agri-table-empty">{t('transpPage.empty')}</td>
          </tr>
        ) : transporteurs.map((transporteur) => (
          <TransporteurTableRow key={transporteur.id} transporteur={transporteur} onEdit={onEdit} onArchive={onArchive} />
        ))}
      </tbody>
    </table>
  )
}
