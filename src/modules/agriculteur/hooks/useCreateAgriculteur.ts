import { useState } from 'react'
import { createAgriculteur } from '../services/agriculteur.service'
import type { AgriculteurFormValues } from '../types/agriculteurForm.types'

export function useCreateAgriculteur(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleCreate(values: AgriculteurFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await createAgriculteur(values)
      onSuccess()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleCreate, isSubmitting, submitError }
}
