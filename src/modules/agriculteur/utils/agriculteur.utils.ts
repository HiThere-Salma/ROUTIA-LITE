import type { Agriculteur } from '../types/agriculteur.types'

export function getAdresse(agriculteur: Agriculteur): string {
  return [agriculteur.numero_civique, agriculteur.rue].filter(Boolean).join(' ') || '—'
}

export function getAgriId(id: string): string {
  return '#AG-' + id.slice(-4).toUpperCase()
}

export function formatLastUpdated(lastUpdated: Date): string {
  const diffMin = Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
  if (diffMin < 1) return "MISE À JOUR IL Y A MOINS D'UNE MINUTE"
  return `MISE À JOUR IL Y A ${diffMin} MINUTE${diffMin > 1 ? 'S' : ''}`
}
