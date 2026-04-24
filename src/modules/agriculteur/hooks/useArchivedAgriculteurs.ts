import { useState, useEffect, useCallback } from 'react'
import { fetchArchivedAgriculteurs } from '../services/agriculteur.service'
import type { Agriculteur } from '../types/agriculteur.types'

export function useArchivedAgriculteurs(page: number) {
  const [agriculteurs, setAgriculteurs] = useState<Agriculteur[]>([])
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
        const { agriculteurs: list, total: count } = await fetchArchivedAgriculteurs(page)
        if (!cancelled) {
          setAgriculteurs(list)
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

  return { agriculteurs, total, isLoading, errorMessage, refresh }
}
