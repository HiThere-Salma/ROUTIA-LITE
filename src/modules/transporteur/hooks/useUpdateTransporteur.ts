import { useState } from 'react'
import { updateTransporteur } from '../services/transporteur.service'
import type { TransporteurFormValues } from '../types/transporteurForm.types'

export function useUpdateTransporteur(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleUpdate(id: string, values: TransporteurFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await updateTransporteur(id, values)
      onSuccess()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleUpdate, isSubmitting, submitError }
}
