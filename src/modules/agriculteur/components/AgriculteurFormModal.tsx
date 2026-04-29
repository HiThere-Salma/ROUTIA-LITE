import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { agriculteurFormSchema, type AgriculteurFormValues } from '../types/agriculteurForm.types'
import { useCreateAgriculteur } from '../hooks/useCreateAgriculteur'
import { useUpdateAgriculteur } from '../hooks/useUpdateAgriculteur'
import type { Agriculteur } from '../types/agriculteur.types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  editItem?: Agriculteur | null
}

export function AgriculteurFormModal({ isOpen, onClose, onCreated, editItem }: Props) {
  const { t } = useTranslation()
  const isEdit = !!editItem

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgriculteurFormValues>({
    resolver: zodResolver(agriculteurFormSchema),
  })

  useEffect(() => {
    if (isOpen && editItem) {
      reset({
        nom: editItem.nom,
        prenom: editItem.prenom,
        cin: editItem.cin ?? '',
        telephone: editItem.telephone ?? '',
        email: editItem.email,
        adresse: editItem.rue ?? '',
      })
    } else if (isOpen && !editItem) {
      reset({ nom: '', prenom: '', cin: '', telephone: '', email: '', adresse: '' })
    }
  }, [isOpen, editItem, reset])

  const { handleCreate, isSubmitting: isCreating, submitError: createError } = useCreateAgriculteur(() => {
    reset()
    onCreated()
    onClose()
  })

  const { handleUpdate, isSubmitting: isUpdating, submitError: updateError } = useUpdateAgriculteur(() => {
    reset()
    onCreated()
    onClose()
  })

  const isSubmitting = isCreating || isUpdating
  const submitError = createError ?? updateError

  function onSubmit(values: AgriculteurFormValues) {
    if (isEdit && editItem) {
      handleUpdate(editItem.id, values)
    } else {
      handleCreate(values)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="agri-form-title">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title" id="agri-form-title">
            {isEdit ? t('agriPage.formEditTitle') : t('agriPage.formAddTitle')}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-form-grid">
            <div className="modal-field">
              <label htmlFor="ag-nom" className="modal-label">{t('common.nom')}</label>
              <input id="ag-nom" className="modal-input" placeholder={t('common.nom')} {...register('nom')} />
              {errors.nom && <span className="modal-error">{errors.nom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-prenom" className="modal-label">{t('common.prenom')}</label>
              <input id="ag-prenom" className="modal-input" placeholder={t('common.prenom')} {...register('prenom')} />
              {errors.prenom && <span className="modal-error">{errors.prenom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-cin" className="modal-label">{t('common.cin')}</label>
              <input id="ag-cin" className="modal-input modal-input--mono" placeholder="AB123456" {...register('cin')} />
              {errors.cin && <span className="modal-error">{errors.cin.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-telephone" className="modal-label">{t('common.telephone')}</label>
              <input id="ag-telephone" className="modal-input modal-input--mono" placeholder="0661234567" {...register('telephone')} />
              {errors.telephone && <span className="modal-error">{errors.telephone.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="ag-email" className="modal-label">{t('common.email')}</label>
              <input id="ag-email" type="email" className="modal-input" placeholder="exemple@mail.com" {...register('email')} />
              {errors.email && <span className="modal-error">{errors.email.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="ag-adresse" className="modal-label">{t('common.adresse')}</label>
              <input id="ag-adresse" className="modal-input" placeholder="Douar Lakhdar, Meknès" {...register('adresse')} />
              {errors.adresse && <span className="modal-error">{errors.adresse.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-role" className="modal-label">{t('common.role')}</label>
              <input id="ag-role" className="modal-input" value="Agriculteur" readOnly />
            </div>
          </div>

          {submitError && <p className="modal-submit-error">{submitError}</p>}

          <button type="submit" className="modal-btn-submit modal-btn-submit--full" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  )
}
