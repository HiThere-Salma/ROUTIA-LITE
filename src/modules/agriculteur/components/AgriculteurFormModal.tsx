import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { agriculteurFormSchema, type AgriculteurFormValues } from '../types/agriculteurForm.types'
import { useCreateAgriculteur } from '../hooks/useCreateAgriculteur'

type Props = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function AgriculteurFormModal({ isOpen, onClose, onCreated }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgriculteurFormValues>({
    resolver: zodResolver(agriculteurFormSchema),
  })

  const { handleCreate, isSubmitting, submitError } = useCreateAgriculteur(() => {
    reset()
    onCreated()
    onClose()
  })

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="agri-form-title">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title" id="agri-form-title">Ajouter un agriculteur</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit(handleCreate)} noValidate>
          <div className="modal-form-grid">
            <div className="modal-field">
              <label htmlFor="ag-nom" className="modal-label">Nom</label>
              <input id="ag-nom" className="modal-input" placeholder="Nom" {...register('nom')} />
              {errors.nom && <span className="modal-error">{errors.nom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-prenom" className="modal-label">Prénom</label>
              <input id="ag-prenom" className="modal-input" placeholder="Prénom" {...register('prenom')} />
              {errors.prenom && <span className="modal-error">{errors.prenom.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-cin" className="modal-label">CIN</label>
              <input id="ag-cin" className="modal-input modal-input--mono" placeholder="AB123456" {...register('cin')} />
              {errors.cin && <span className="modal-error">{errors.cin.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-telephone" className="modal-label">Téléphone</label>
              <input id="ag-telephone" className="modal-input modal-input--mono" placeholder="0661234567" {...register('telephone')} />
              {errors.telephone && <span className="modal-error">{errors.telephone.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="ag-email" className="modal-label">Email</label>
              <input id="ag-email" type="email" className="modal-input" placeholder="exemple@mail.com" {...register('email')} />
              {errors.email && <span className="modal-error">{errors.email.message}</span>}
            </div>

            <div className="modal-field modal-field--full">
              <label htmlFor="ag-adresse" className="modal-label">Adresse</label>
              <input id="ag-adresse" className="modal-input" placeholder="Douar Lakhdar, Meknès" {...register('adresse')} />
              {errors.adresse && <span className="modal-error">{errors.adresse.message}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="ag-role" className="modal-label">Rôle</label>
              <input id="ag-role" className="modal-input" value="Agriculteur" readOnly />
            </div>
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
