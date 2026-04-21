import { useState } from 'react'
import { createTransporteur } from '../services/transporteur.service'
import type { TransporteurFormValues } from '../types/transporteurForm.types'

export function useCreateTransporteur(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleCreate(values: TransporteurFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await createTransporteur(values)
      onSuccess()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleCreate, isSubmitting, submitError }
}
