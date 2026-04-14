import { useState, useEffect, useCallback } from 'react'
import { fetchTransporteurs } from '../services/transporteur.service'
import type { Transporteur } from '../types/transporteur.types'

export function useTransporteurs(page: number) {
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = useCallback(() => setRefreshCount((c) => c + 1), [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setErrorMessage(null)

    fetchTransporteurs(page)
      .then(({ transporteurs: list, total: count }) => {
        if (!cancelled) {
          setTransporteurs(list)
          setTotal(count)
          setLastUpdated(new Date())
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Erreur de chargement')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [page, refreshCount])

  return { transporteurs, total, isLoading, errorMessage, lastUpdated, refresh }
}
