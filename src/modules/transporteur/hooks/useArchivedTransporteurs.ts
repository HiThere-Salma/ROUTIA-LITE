import { useState, useEffect, useCallback } from 'react'
import { fetchArchivedTransporteurs } from '../services/transporteur.service'
import type { Transporteur } from '../types/transporteur.types'

export function useArchivedTransporteurs(page: number) {
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = useCallback(() => setRefreshCount((c) => c + 1), [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const { transporteurs: list, total: count } = await fetchArchivedTransporteurs(page)
        if (!cancelled) {
          setTransporteurs(list)
          setTotal(count)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Erreur de chargement')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => { cancelled = true }
  }, [page, refreshCount])

  return { transporteurs, total, isLoading, errorMessage, refresh }
}
