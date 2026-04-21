import type { Transporteur } from '../types/transporteur.types'

export function getAdresse(transporteur: Transporteur): string {
  return [transporteur.numero_civique, transporteur.rue].filter(Boolean).join(' ') || '—'
}

export function getTrId(id: string): string {
  return '#TR-' + id.slice(-4).toUpperCase()
}

export function formatLastUpdated(lastUpdated: Date): string {
  const diffMin = Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
  if (diffMin < 1) return "moins d'une minute"
  return `${diffMin} minute${diffMin > 1 ? 's' : ''}`
}
