type Props = {
  label: string
  isValid: boolean | null
}

export function DocBadge({ label, isValid }: Props) {
  const isOk = isValid === true
  return (
    <div className="tr-doc-badge">
      <span className="tr-doc-label">{label}</span>
      <span className={`tr-doc-icon ${isOk ? 'tr-doc-icon--ok' : 'tr-doc-icon--ko'}`}>
        {isOk ? '✓' : '✕'}
      </span>
    </div>
  )
}
