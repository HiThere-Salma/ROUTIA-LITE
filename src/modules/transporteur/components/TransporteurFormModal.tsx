import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transporteurFormSchema, type TransporteurFormValues } from '../types/transporteurForm.types'
import { useCreateTransporteur } from '../hooks/useCreateTransporteur'
import { useUpdateTransporteur } from '../hooks/useUpdateTransporteur'
import type { Transporteur } from '../types/transporteur.types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  editItem?: Transporteur | null
}

export function TransporteurFormModal({ isOpen, onClose, onCreated, editItem }: Props) {
  const isEdit = !!editItem

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransporteurFormValues>({
    resolver: zodResolver(transporteurFormSchema),
    defaultValues: { permis_valide: false, assurance_valide: false, visite_valide: false },
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
        numero_permis: editItem.numero_permis ?? '',
        permis_valide: editItem.permis_valide ?? false,
        assurance_valide: editItem.assurance_valide ?? false,
        visite_valide: editItem.visite_valide ?? false,
      })
    } else if (isOpen && !editItem) {
      reset({ nom: '', prenom: '', cin: '', telephone: '', email: '', adresse: '', numero_permis: '', permis_valide: false, assurance_valide: false, visite_valide: false })
    }
  }, [isOpen, editItem, reset])

  const { handleCreate, isSubmitting: isCreating, submitError: createError } = useCreateTransporteur(() => {
    reset()
    onCreated()
    onClose()
  })

  const { handleUpdate, isSubmitting: isUpdating, submitError: updateError } = useUpdateTransporteur(() => {
    reset()
    onCreated()
    onClose()
  })

  const isSubmitting = isCreating || isUpdating
  const submitError = createError ?? updateError

  function onSubmit(values: TransporteurFormValues) {
    if (isEdit && editItem) {
      handleUpdate(editItem.id, values)
    } else {
      handleCreate(values)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tr-form-title">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title" id="tr-form-title">
            {isEdit ? 'Modifier un transporteur' : 'Ajouter un transporteur'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-form-grid">
            <div className="modal-field">
              <label htmlFor="tr-nom" className="modal-label">Nom</label>
              <input id="tr-nom" className="modal-input" placeholder="Nom" {...register('nom')} />
              {errors.nom && <span className="modal-error">{errors.nom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="tr-prenom" className="modal-label">Prénom</label>
              <input id="tr-prenom" className="modal-input" placeholder="Prénom" {...register('prenom')} />
              {errors.prenom && <span className="modal-error">{errors.prenom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="tr-cin" className="modal-label">CIN</label>
              <input id="tr-cin" className="modal-input modal-input--mono" placeholder="AB123456" {...register('cin')} />
              {errors.cin && <span className="modal-error">{errors.cin.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="tr-telephone" className="modal-label">Téléphone</label>
              <input id="tr-telephone" className="modal-input modal-input--mono" placeholder="0661234567" {...register('telephone')} />
              {errors.telephone && <span className="modal-error">{errors.telephone.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="tr-email" className="modal-label">Email</label>
              <input id="tr-email" type="email" className="modal-input" placeholder="exemple@mail.com" {...register('email')} />
              {errors.email && <span className="modal-error">{errors.email.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="tr-adresse" className="modal-label">Adresse</label>
              <input id="tr-adresse" className="modal-input" placeholder="Quartier Industriel, Meknès" {...register('adresse')} />
              {errors.adresse && <span className="modal-error">{errors.adresse.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="tr-numero-permis" className="modal-label">N° permis</label>
              <input id="tr-numero-permis" className="modal-input modal-input--mono" placeholder="P1234567" {...register('numero_permis')} />
              {errors.numero_permis && <span className="modal-error">{errors.numero_permis.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="tr-role" className="modal-label">Rôle</label>
              <input id="tr-role" className="modal-input" value="Transporteur" readOnly />
            </div>
          </div>

          <div className="modal-checkboxes">
            <label htmlFor="tr-permis-valide" className="modal-checkbox-label">
              <input id="tr-permis-valide" type="checkbox" className="modal-checkbox" {...register('permis_valide')} />
              Permis valide
            </label>
            <label htmlFor="tr-assurance-valide" className="modal-checkbox-label">
              <input id="tr-assurance-valide" type="checkbox" className="modal-checkbox" {...register('assurance_valide')} />
              Assurance valide
            </label>
            <label htmlFor="tr-visite-valide" className="modal-checkbox-label">
              <input id="tr-visite-valide" type="checkbox" className="modal-checkbox" {...register('visite_valide')} />
              Visite technique valide
            </label>
          </div>

          {submitError && <p className="modal-submit-error">{submitError}</p>}

          <button type="submit" className="modal-btn-submit modal-btn-submit--full" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
