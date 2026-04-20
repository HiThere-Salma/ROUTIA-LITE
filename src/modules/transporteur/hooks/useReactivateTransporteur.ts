import { useState } from 'react'
import { reactivateTransporteur } from '../services/transporteur.service'

export function useReactivateTransporteur(onSuccess: () => void) {
  const [isReactivating, setIsReactivating] = useState(false)
  const [reactivateError, setReactivateError] = useState<string | null>(null)

  async function handleReactivate(id: string) {
    setIsReactivating(true)
    setReactivateError(null)
    try {
      await reactivateTransporteur(id)
      onSuccess()
    } catch (err: unknown) {
      setReactivateError(err instanceof Error ? err.message : 'Erreur lors de la réactivation')
    } finally {
      setIsReactivating(false)
    }
  }

  return { handleReactivate, isReactivating, reactivateError }
}
