import { useState } from 'react'
import { deleteTransporteur } from '../services/transporteur.service'

export function useDeleteTransporteur(onSuccess: () => void) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteTransporteur(id)
      onSuccess()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  return { handleDelete, isDeleting, deleteError }
}
