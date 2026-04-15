import { useState } from 'react'
import { deleteAgriculteur } from '../services/agriculteur.service'

export function useDeleteAgriculteur(onSuccess: () => void) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteAgriculteur(id)
      onSuccess()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  return { handleDelete, isDeleting, deleteError }
}
