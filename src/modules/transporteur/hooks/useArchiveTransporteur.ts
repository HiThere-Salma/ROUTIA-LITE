import { useState } from 'react'
import { archiveTransporteur } from '../services/transporteur.service'

export function useArchiveTransporteur(onSuccess: () => void) {
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  async function handleArchive(id: string) {
    setIsArchiving(true)
    setArchiveError(null)
    try {
      await archiveTransporteur(id)
      onSuccess()
    } catch (err: unknown) {
      setArchiveError(err instanceof Error ? err.message : 'Erreur lors de l\'archivage')
    } finally {
      setIsArchiving(false)
    }
  }

  return { handleArchive, isArchiving, archiveError }
}
