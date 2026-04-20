import { useState } from 'react'
import { reactivateAgriculteur } from '../services/agriculteur.service'

export function useReactivateAgriculteur(onSuccess: () => void) {
  const [isReactivating, setIsReactivating] = useState(false)
  const [reactivateError, setReactivateError] = useState<string | null>(null)

  async function handleReactivate(id: string) {
    setIsReactivating(true)
    setReactivateError(null)
    try {
      await reactivateAgriculteur(id)
      onSuccess()
    } catch (err: unknown) {
      setReactivateError(err instanceof Error ? err.message : 'Erreur lors de la réactivation')
    } finally {
      setIsReactivating(false)
    }
  }

  return { handleReactivate, isReactivating, reactivateError }
}
