import { useState } from 'react'
import { updateAgriculteur } from '../services/agriculteur.service'
import type { AgriculteurFormValues } from '../types/agriculteurForm.types'

export function useUpdateAgriculteur(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleUpdate(id: string, values: AgriculteurFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await updateAgriculteur(id, values)
      onSuccess()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleUpdate, isSubmitting, submitError }
}
