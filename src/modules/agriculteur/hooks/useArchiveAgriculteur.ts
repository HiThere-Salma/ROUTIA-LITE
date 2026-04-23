import { useState } from 'react'
import { archiveAgriculteur } from '../services/agriculteur.service'

export function useArchiveAgriculteur(onSuccess: () => void) {
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  async function handleArchive(id: string) {
    setIsArchiving(true)
    setArchiveError(null)
    try {
      await archiveAgriculteur(id)
      onSuccess()
    } catch (err: unknown) {
      setArchiveError(err instanceof Error ? err.message : 'Erreur lors de l\'archivage')
    } finally {
      setIsArchiving(false)
    }
  }

  return { handleArchive, isArchiving, archiveError }
}
